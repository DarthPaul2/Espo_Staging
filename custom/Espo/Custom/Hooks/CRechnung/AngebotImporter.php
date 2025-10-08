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
     *   1. Копируем данные из CAngebot в CRechnung (кроме titel, einleitung).
     *   2. Копируем все CAngebotsposition → CRechnungsposition с пересчётом netto/gesamt.
     */
    public function afterSave(Entity $entity, array $options = []): void
    {
        if (!$entity->isAttributeChanged('angebotId')) {
            return;
        }

        $angebotId = $entity->get('angebotId');
        if (empty($angebotId)) {
            return;
        }

        $angebot = $this->em->getEntity('CAngebot', $angebotId);
        if (!$angebot) {
            $this->log->warning("⚠️ Angebot {$angebotId} nicht gefunden, nichts kopiert.");
            return;
        }

        $this->log->debug("➡️ Importiere Felder & Positionen von Angebot {$angebotId} in Rechnung {$entity->getId()}.");

        // === 1) Копируем поля из Angebot (без titel и einleitung) ===
        $entity->set([
            'accountId'         => $angebot->get('accountId'),
            'accountName'       => $angebot->get('accountName'),
            'accountKundenNr'   => $angebot->get('accountKundenNr'),
            'serviceNummer'     => $angebot->get('serviceNummer'),
            'gesetzOption12'    => $angebot->get('gesetzOption12'),
            'gesetzOption13b'   => $angebot->get('gesetzOption13b'),
            'leistungsdatumVon' => $angebot->get('leistungsdatumVon'),
            'leistungsdatumBis' => $angebot->get('leistungsdatumBis'),
            // важно: тянем общую ставку НДС из Angebots, если есть
            'ustSatz'           => $angebot->get('ustSatz') ?? 19,
        ]);

        $this->em->saveEntity($entity, [
            'skipHooks'    => true,
            'skipWorkflow' => true,
        ]);

        // глобальные режимы НДС для счёта
        $noVat = (bool) $entity->get('gesetzOption13b') || (bool) $entity->get('gesetzOption12');
        // дефолтная ставка НДС
        $ustSatzDefault = (float) ($entity->get('ustSatz') ?? $angebot->get('ustSatz') ?? 19);

        // === 2) Копируем позиции ===
        $posList = $this->em->getRepository('CAngebotsposition')
            ->where(['angebotId' => $angebotId, 'deleted' => false])
            ->order('sortierung')
            ->find();

        $sort = 1;
        foreach ($posList as $pos) {
            $menge  = (float) $pos->get('menge') ?: 0.0;
            $preis  = (float) $pos->get('preis') ?: 0.0;
            $rabatt = (float) $pos->get('rabatt') ?: 0.0;

            $netto = round($menge * $preis * (1 - $rabatt / 100), 2);

            // ставка позиции: если есть своя steuer — берём её, иначе — общий ustSatz; при режиме noVat → 0
            $posSteuerRaw = $pos->get('steuer');
            $posSteuer = $noVat ? 0.0 : ( ($posSteuerRaw === null || $posSteuerRaw === '') ? $ustSatzDefault : (float) $posSteuerRaw );

            $brutto = round($netto * (1 + $posSteuer / 100), 2);

            $recPos = $this->em->createEntity('CRechnungsposition', [
                'rechnungId'          => $entity->getId(),
                'menge'               => $menge,
                'einheit'             => $pos->get('einheit'),
                'beschreibung'        => $pos->get('beschreibung'),
                'name'                => $pos->get('name'),
                'preis'               => $preis,
                'einkaufspreis'       => $pos->get('einkaufspreis'),
                'rabatt'              => $rabatt,
                'steuer'              => $noVat ? 0.0 : ($posSteuerRaw === null || $posSteuerRaw === '' ? $ustSatzDefault : (float) $posSteuerRaw),
                'netto'               => $netto,
                'gesamt'              => $brutto,   // Brutto с НДС (или 0% при noVat)
                'materialId'          => $pos->get('materialId'),
                'materialDescription' => $pos->get('materialDescription'),
                'materialEinheit'     => $pos->get('materialEinheit'),
                'materialPreis'       => $pos->get('materialPreis'),
                'sortierung'          => $sort,
            ]);

            $this->em->saveEntity($recPos, [
                'skipHooks'    => true,
                'skipWorkflow' => true,
            ]);

            $sort++;
        }
}
}
