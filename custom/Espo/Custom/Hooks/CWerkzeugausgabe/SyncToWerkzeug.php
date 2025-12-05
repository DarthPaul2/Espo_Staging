<?php
namespace Espo\Custom\Hooks\CWerkzeugausgabe;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Utils\Log;

class SyncToWerkzeug
{
    public function __construct(
        private EntityManager $em,
        private Log $log
    ) {}

    public function afterSave(Entity $entity, array $options = []): void
    {
        // Должна быть ссылка на Werkzeug
        $werkzeugId = $entity->get('werkzeugId');
        if (!$werkzeugId) {
            return;
        }

        $status = (string) $entity->get('status');

        // Работаем только с понятными статусами
        if ($status !== 'ausgegeben' && $status !== 'zurueckgegeben') {
            return;
        }

        // Загружаем связанную запись CWerkzeug
        $werkzeug = $this->em->getEntity('CWerkzeug', $werkzeugId);
        if (!$werkzeug) {
            $this->log->warning('[SyncToWerkzeug] CWerkzeug not found for ID ' . $werkzeugId);
            return;
        }

        $assignedUserId   = $entity->get('assignedUserId');
        $ausgegebenAm     = $entity->get('ausgegebenAm') ?: $entity->get('createdAt');
        $zurueckgegebenAm = $entity->get('zurueckgegebenAm') ?: $entity->get('modifiedAt');

        if ($status === 'ausgegeben') {
            // Инструмент выдан
            $werkzeug->set('userId', $assignedUserId);

            if ($ausgegebenAm) {
                $werkzeug->set('ausgegebenAm', $ausgegebenAm);
            }

            // При выдаче считаем, что ещё не возвращён
            $werkzeug->set('zurckgegebenAm', null);

        } elseif ($status === 'zurueckgegeben') {
            // Инструмент возвращён
            $werkzeug->set('userId', null);

            if ($zurueckgegebenAm) {
                $werkzeug->set('zurckgegebenAm', $zurueckgegebenAm);
            }

            // Логично — вернулся на склад
            $werkzeug->set('standort', 'lager');
        }

        try {
            $this->em->saveEntity($werkzeug);
        } catch (\Throwable $e) {
            $this->log->error(
                '[SyncToWerkzeug] Failed to sync CWerkzeug: ' . $e->getMessage(),
                ['werkzeugId' => $werkzeugId]
            );
        }
    }
}
