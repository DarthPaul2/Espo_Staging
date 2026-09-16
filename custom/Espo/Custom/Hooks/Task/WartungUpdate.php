<?php
namespace Espo\Custom\Hooks\Task;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Utils\Log;

class WartungUpdate
{
    public function __construct(
        private EntityManager $em,
        private Log $log
    ) {}

    /**
     * После сохранения задачи проверяем: связана ли она с CWartung.
     * Если да — и задача завершена, закрываем текущий Wartung-Zyklus.
     *
     * Die eigentliche Berechnung von naechsteWartung (unter Beachtung von
     * regelModus/vorwarnTage) übernimmt AUSSCHLIESSLICH CWartung::beforeSave —
     * hier wird bewusst NICHT mehr selbst gerechnet (15.09.2026: doppelte,
     * abweichende Berechnung hier führte zu falschen Daten bei regelModus
     * "abStartdatum").
     */
    public function afterSave(Entity $entity, array $options = []): void
    {
        try {
            // 1️⃣ Nur bei echtem Abschluss reagieren (Task.status-Enum: siehe Task.json)
            if ($entity->get('status') !== 'Completed') {
                return;
            }

            // 2️⃣ Проверяем наличие поля связи cWartungId
            $wartungId = $entity->get('cWartungId');
            if (empty($wartungId)) {
                return; // не связано с Wartung
            }

            // 3️⃣ Получаем саму Wartung
            $wartung = $this->em->getEntity('CWartung', $wartungId);
            if (!$wartung) {
                $this->log->warning("[WartungUpdate] CWartung {$wartungId} not found.");
                return;
            }

            // 4️⃣ Zyklus schließen: letzteWartung=heute, naechsteWartung leeren
            // (damit CWartung::beforeSave sie korrekt neu berechnet) und beendet setzen.
            $wartung->set('letzteWartung', (new \DateTime())->format('Y-m-d'));
            $wartung->set('naechsteWartung', null);
            $wartung->set('status', 'beendet');

            $this->em->saveEntity($wartung);

            $this->log->info(
                "[WartungUpdate] ✅ Wartung {$wartungId} geschlossen: beendet, "
                . "naechsteWartung=" . $wartung->get('naechsteWartung')
            );

        } catch (\Throwable $e) {
            $this->log->error('[WartungUpdate] Exception: ' . $e->getMessage());
        }
    }
}
