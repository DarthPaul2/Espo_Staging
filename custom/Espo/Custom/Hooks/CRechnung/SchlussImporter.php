<?php
namespace Espo\Custom\Hooks\CRechnung;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Utils\Log;
use Espo\Core\Exceptions\Error;

class SchlussImporter
{
    private EntityManager $em;
    private Log $log;

    public function __construct(EntityManager $em, Log $log)
    {
        $this->em  = $em;
        $this->log = $log;
    }

    public function afterSave(Entity $rechnung, array $options = []): void
    {
        try {
            $typ = (string) $rechnung->get('rechnungstyp');
            if ($typ !== 'schlussrechnung') {
                return; // работаем только для Schlussrechnung
            }

            $rechnungId = (string) $rechnung->getId();
            $auftragId  = (string) $rechnung->get('auftragId');

            // 1) Проверка: Auftrag обязателен
            if (!$auftragId) {
                throw new Error('Für eine Schlussrechnung muss ein Auftrag gewählt werden.');
            }

            // 2) Импорт выполняем только если счёт ещё пустой
            $already = $this->em->getRepository('CRechnungsposition')
                ->where(['rechnungId' => $rechnungId, 'deleted' => false])
                ->count();

            if ($already > 0) {
                $this->log->debug("[SchlussImporter] Rechnung {$rechnungId} hat bereits {$already} Position(en), Import übersprungen.");
                return;
            }

            // 3) Забираем все НЕ оплаченные позиции заказа (bereitsabgerechnet = false)
            $auftragsPosList = $this->em->getRepository('CAuftragsposition')
                ->where([
                    'auftragId'          => $auftragId,
                    'deleted'            => false,
                    'bereitsabgerechnet' => false,
                ])
                ->order('sortierung')
                ->find();

            if (count($auftragsPosList) === 0) {
                $this->log->info("[SchlussImporter] Keine offenen Auftragspositionen für Auftrag {$auftragId}. Nichts zu importieren.");
                return;
            }

            // НДС-режим: как в AngebotImporter
            $noVat          = (bool) $rechnung->get('gesetzOption13b') || (bool) $rechnung->get('gesetzOption12');
            $ustSatzDefault = (float) ($rechnung->get('ustSatz') ?? 19);

            $created = 0;
            $sort    = 1;

            foreach ($auftragsPosList as $ap) {
                /** @var Entity $ap */
                $auftragsPosId = (string) $ap->get('id');

                $menge  = (float) ($ap->get('menge')  ?? 0.0);
                $preis  = (float) ($ap->get('preis')  ?? 0.0);
                $rabatt = (float) ($ap->get('rabatt') ?? 0.0);

                $netto = round($menge * $preis * (1 - $rabatt / 100), 2);

                $posSteuerRaw = $ap->get('steuer');
                $posSteuer    = $noVat ? 0.0 : (
                    ($posSteuerRaw === null || $posSteuerRaw === '')
                        ? $ustSatzDefault
                        : (float) $posSteuerRaw
                );

                $brutto = round($netto * (1 + $posSteuer / 100), 2);

                // 4) Создаём позицию счёта и связываем с Auftragsposition
                $recPos = $this->em->createEntity('CRechnungsposition', [
                    'rechnungId'          => $rechnungId,
                    'auftragspositionId'  => $auftragsPosId,

                    'name'                => $ap->get('name'),
                    'beschreibung'        => $ap->get('beschreibung') ?: $ap->get('description'),
                    'einheit'             => $ap->get('einheit'),
                    'menge'               => $menge,
                    'preis'               => $preis,
                    'rabatt'              => $rabatt,
                    'steuer'              => $posSteuer,
                    'netto'               => $netto,
                    'gesamt'              => $brutto,

                    'materialId'          => $ap->get('materialId'),
                    'materialDescription' => $ap->get('materialDescription'),
                    'materialEinheit'     => $ap->get('materialEinheit'),
                    'materialPreis'       => $ap->get('materialPreis'),

                    'sortierung'          => $sort,
                ]);

                // ВАЖНО: позволяем отработать afterSave-процессам позиций
                $this->em->saveEntity($recPos, [
                    'skipHooks'    => false,
                    'skipWorkflow' => true,
                ]);

                // 5) Сразу помечаем эту Auftragsposition как "уже выставлена"
                $ap->set('bereitsabgerechnet', true);
                $this->em->saveEntity($ap, [
                    'skipHooks'    => true,  // тихо, чтобы не запускать каскады
                    'skipWorkflow' => true,
                ]);

                $sort++;
                $created++;
            }

            $this->log->info("[SchlussImporter] Rechnung {$rechnungId}: importiert {$created} offene Auftragsposition(en) aus Auftrag {$auftragId}.");

        } catch (\Throwable $e) {
            // Логируем и прокидываем дальше как Error, чтобы фронт получил причину
            $this->log->warning('[SchlussImporter] ERROR: ' . $e->getMessage());
            throw $e instanceof Error ? $e : new Error($e->getMessage());
        }
    }
}
