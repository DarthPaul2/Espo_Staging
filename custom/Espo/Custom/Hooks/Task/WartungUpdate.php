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

            // 4️⃣ Обновляем даты
            $letzte = new \DateTime();
            $wartung->set('letzteWartung', $letzte->format('Y-m-d'));

            // Расчёт следующей даты по интервалу
            $intervall = $wartung->get('intervall') ?? 'jaehrlich';
            $naechste = clone $letzte;
            switch ($intervall) {
                case 'monatlich':     $naechste->modify('+1 month'); break;
                case 'quartal':       $naechste->modify('+3 months'); break;
                case 'halbjaehrlich': $naechste->modify('+6 months'); break;
                case 'jaehrlich':     $naechste->modify('+1 year');  break;
            }

            $wartung->set('naechsteWartung', $naechste->format('Y-m-d'));

            // Меняем статусы
            $wartung->set('status', 'beendet');
            $wartung->set('faelligkeitsStatus', 'beendet');

            // Сохраняем обновлённую Wartung
            $this->em->saveEntity($wartung);

            $this->log->info("[WartungUpdate] ✅ Wartung {$wartungId} updated: beendet, nächste={$naechste->format('Y-m-d')}");

        } catch (\Throwable $e) {
            $this->log->error('[WartungUpdate] Exception: ' . $e->getMessage());
        }
    }
}
