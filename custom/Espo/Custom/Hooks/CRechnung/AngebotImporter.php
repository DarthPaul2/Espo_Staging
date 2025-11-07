<?php
namespace Espo\Custom\Hooks\CRechnung;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Utils\Log;

class AngebotImporter
{
    private EntityManager $em;
    private Log $log;

    public function __construct(EntityManager $em, Log $log)
    {
        $this->em  = $em;
        $this->log = $log;
    }

    /**
     * При изменении поля angebotId:
     *   1) Копируем поля из CAngebot в CRechnung (без titel/einleitung).
     *   2) Удаляем старые CRechnungsposition.
     *   3) Импортируем CAngebotsposition -> CRechnungsposition,
     *      устанавливая auftragspositionId по карте CAuftragsposition (того же Auftrag).
     *      Сохраняем БЕЗ skipHooks, чтобы downstream-хуки могли отработать.
     *   4) Если Rechnung — Teilrechnung (и не storniert), ставим в связанных
     *      CAuftragsposition флаг bereitsabgerechnet = true (saveEntity).
     */
    public function afterSave(Entity $entity, array $options = []): void
    {
        // Срабатываем только при реальной смене предложения
        if (!$entity->isAttributeChanged('angebotId')) {
            return;
        }

        $angebotId = $entity->get('angebotId');
        if (empty($angebotId)) {
            return;
        }

        $angebot = $this->em->getEntity('CAngebot', $angebotId);
        if (!$angebot) {
            $this->log->warning("⚠️ Angebot {$angebotId} nicht gefunden, Import abgebrochen.");
            return;
        }

        $rechnungId = (string) $entity->getId();
        $auftragId  = (string) $entity->get('auftragId'); // у тебя обязательное поле
        $this->log->debug("➡️ Import von Angebot {$angebotId} in Rechnung {$rechnungId}, Auftrag={$auftragId}");

        // === 1) Копируем основные поля из Angebot (без titel/einleitung)
        $entity->set([
            'accountId'         => $angebot->get('accountId'),
            'accountName'       => $angebot->get('accountName'),
            'accountKundenNr'   => $angebot->get('accountKundenNr'),
            'serviceNummer'     => $angebot->get('serviceNummer'),
            'gesetzOption12'    => $angebot->get('gesetzOption12'),
            'gesetzOption13b'   => $angebot->get('gesetzOption13b'),
            'leistungsdatumVon' => $angebot->get('leistungsdatumVon'),
            'leistungsdatumBis' => $angebot->get('leistungsdatumBis'),
            'ustSatz'           => $angebot->get('ustSatz') ?? 19,
        ]);

        // Тихо сохранить саму Rechnung (чтобы не триггерить лишнее)
        $this->em->saveEntity($entity, [
            'skipHooks'    => true,
            'skipWorkflow' => true,
        ]);

        // === Построить карту: angebotspositionId -> auftragspositionId для данного Auftrag
        $apMap = [];
        if ($auftragId) {
            $apList = $this->em->getRepository('CAuftragsposition')
                ->select(['id', 'angebotspositionId'])
                ->where([
                    'auftragId' => $auftragId,
                    'deleted'   => false,
                ])
                ->find();

            foreach ($apList as $ap) {
                $srcId = (string) $ap->get('angebotspositionId');
                $dstId = (string) $ap->get('id');
                if ($srcId !== '') {
                    $apMap[$srcId] = $dstId;
                }
            }
        }
        $this->log->debug('AP-Map size: ' . count($apMap));

        // === 2) Удаляем старые позиции счёта
        $oldPositions = $this->em->getRepository('CRechnungsposition')
            ->where(['rechnungId' => $rechnungId, 'deleted' => false])
            ->find();

        $deletedCount = 0;
        foreach ($oldPositions as $oldPos) {
            $this->em->removeEntity($oldPos, [
                'skipHooks'    => true,   // удаляем тихо
                'skipWorkflow' => true,
            ]);
            $deletedCount++;
        }
        $this->log->debug("🧹 Alte Positionen gelöscht: {$deletedCount}");

        // === 3) Импортируем позиции из CAngebotsposition
        $posList = $this->em->getRepository('CAngebotsposition')
            ->where(['angebotId' => $angebotId, 'deleted' => false])
            ->order('sortierung')
            ->find();

        $noVat          = (bool) $entity->get('gesetzOption13b') || (bool) $entity->get('gesetzOption12');
        $ustSatzDefault = (float) ($entity->get('ustSatz') ?? $angebot->get('ustSatz') ?? 19);

        $createdCount = 0;
        $sort = 1;

        // для шага (4): соберём затронутые Auftragsposition
        $affectedAuftragsPosIds = [];

        foreach ($posList as $pos) {
            $srcAngebotsPosId   = (string) $pos->getId();
            $auftragsPositionId = $apMap[$srcAngebotsPosId] ?? null;

            $menge  = (float) ($pos->get('menge')  ?? 0.0);
            $preis  = (float) ($pos->get('preis')  ?? 0.0);
            $rabatt = (float) ($pos->get('rabatt') ?? 0.0);

            $netto = round($menge * $preis * (1 - $rabatt / 100), 2);

            $posSteuerRaw = $pos->get('steuer');
            $posSteuer    = $noVat ? 0.0 : (
                ($posSteuerRaw === null || $posSteuerRaw === '')
                    ? $ustSatzDefault
                    : (float) $posSteuerRaw
            );

            $brutto = round($netto * (1 + $posSteuer / 100), 2);

            $recPos = $this->em->createEntity('CRechnungsposition', [
                'rechnungId'          => $rechnungId,
                'auftragspositionId'  => $auftragsPositionId, // ⬅️ ключевой момент
                'menge'               => $menge,
                'einheit'             => $pos->get('einheit'),
                'beschreibung'        => $pos->get('beschreibung'),
                'name'                => $pos->get('name'),
                'preis'               => $preis,
                'einkaufspreis'       => $pos->get('einkaufspreis'),
                'rabatt'              => $rabatt,
                'steuer'              => $posSteuer,
                'netto'               => $netto,
                'gesamt'              => $brutto,
                'materialId'          => $pos->get('materialId'),
                'materialDescription' => $pos->get('materialDescription'),
                'materialEinheit'     => $pos->get('materialEinheit'),
                'materialPreis'       => $pos->get('materialPreis'),
                'sortierung'          => $sort,
            ]);

            // ВАЖНО: хуки после сохранения позиции счёта должны иметь шанс выполниться
            $this->em->saveEntity($recPos, [
                'skipHooks'    => false,
                'skipWorkflow' => true,
            ]);

            if ($auftragsPositionId) {
                $affectedAuftragsPosIds[(string) $auftragsPositionId] = true;
            }

            $this->log->debug(
                'Rechnungsposition imported: ' .
                json_encode([
                    'srcAngebotspositionId'      => $srcAngebotsPosId,
                    'resolvedAuftragspositionId' => $auftragsPositionId,
                    'menge' => $menge, 'preis' => $preis, 'netto' => $netto, 'brutto' => $brutto
                ], JSON_UNESCAPED_UNICODE)
            );

            $sort++;
            $createdCount++;
        }

        $this->log->info(
            '✅ Angebot ' . $angebotId .
            ' → Rechnung ' . $rechnungId .
            ' importiert. Positionen: ' . $createdCount .
            ', Auftrag: ' . ($auftragId ?: '—')
        );

        // === 4) Если это Teilrechnung (и не storniert) — отметить соответствующие Auftragsposition
        if ((string)$entity->get('rechnungstyp') === 'teilrechnung' && (string)$entity->get('status') !== 'storniert') {
            foreach (array_keys($affectedAuftragsPosIds) as $aufPosId) {
                $ap = $this->em->getEntity('CAuftragsposition', $aufPosId);
                if ($ap && !$ap->get('deleted')) {
                    if (!$ap->get('bereitsabgerechnet')) {
                        $ap->set('bereitsabgerechnet', true);
                        $this->em->saveEntity($ap, [
                            'skipWorkflow' => true,
                        ]);
                    }
                }
            }
        }
    }
}
