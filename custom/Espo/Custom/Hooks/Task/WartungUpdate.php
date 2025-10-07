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
     * Если да — и задача завершена, обновляем данные в CWartung.
     */
    public function afterSave(Entity $entity, array $options = []): void
    {
        try {
            // 1️⃣ Проверяем: не завершена ли задача
            $status = $entity->get('status');
            if (!in_array($status, ['Completed', 'Erledigt', 'Abgeschlossen'])) {
                return;
            }

            // 2️⃣ Проверяем, связана ли задача с Wartung
            $parentType = $entity->get('parentType');
            $parentId   = $entity->get('parentId');

            if ($parentType !== 'CWartung' || !$parentId) {
                return; // ничего не делаем
            }

            // 3️⃣ Получаем саму Wartung
            $wartung = $this->em->getEntity('CWartung', $parentId);
            if (!$wartung) {
                $this->log->warning("[WartungUpdate] CWartung {$parentId} not found.");
                return;
            }

            // 4️⃣ Обновляем даты
            $letzte = new \DateTime();
            $wartung->set('letzteWartung', $letzte->format('Y-m-d'));

            $intervall = $wartung->get('intervall') ?? 'jaehrlich';
            switch ($intervall) {
                case 'monatlich':    $letzte->modify('+1 month'); break;
                case 'quartal':      $letzte->modify('+3 months'); break;
                case 'halbjaehrlich':$letzte->modify('+6 months'); break;
                case 'jaehrlich':    $letzte->modify('+1 year'); break;
            }

            $wartung->set('naechsteWartung', $letzte->format('Y-m-d'));
            $wartung->set('faelligkeitsStatus', 'nichtFaellig');
            $wartung->set('status', 'aktiv');

            $this->em->saveEntity($wartung);

            $this->log->info("[WartungUpdate] Wartung {$parentId} updated after Task completion.");

        } catch (\Throwable $e) {
            $this->log->error('[WartungUpdate] Exception: ' . $e->getMessage());
        }
    }
}
