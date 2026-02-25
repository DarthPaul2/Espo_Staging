<?php

namespace Espo\Custom\Hooks\CAngebotsposition;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

class SetAssignedUserFromAngebotOnCreate
{
    private EntityManager $entityManager;

    public function __construct(EntityManager $entityManager)
    {
        $this->entityManager = $entityManager;
    }

    public function beforeSave(Entity $entity, array $options = []): void
    {
        // Только для новой записи
        if (!$entity->isNew()) {
            return;
        }

        // Если уже назначено — не трогаем
        if ($entity->get('assignedUserId')) {
            return;
        }

        // Берём родителя (Angebot)
        $angebotId = $entity->get('angebotId');
        if (!$angebotId) {
            return;
        }

        $angebot = $this->entityManager->getEntityById('CAngebot', $angebotId);
        if (!$angebot) {
            return;
        }

        $assignedUserId = $angebot->get('assignedUserId');
        if (!$assignedUserId) {
            return;
        }

        $entity->set('assignedUserId', $assignedUserId);
    }
}