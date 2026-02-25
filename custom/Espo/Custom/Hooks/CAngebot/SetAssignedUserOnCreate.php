<?php

namespace Espo\Custom\Hooks\CAngebot;

use Espo\ORM\Entity;

class SetAssignedUserOnCreate
{
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

        // Пытаемся взять текущего пользователя из options (самый надёжный источник)
        $userId = $options['userId'] ?? null;

        // Фолбэк: иногда createdById уже присутствует
        if (!$userId) {
            $userId = $entity->get('createdById') ?: null;
        }

        if (!$userId) {
            return;
        }

        // Важно: ставим именно assignedUserId
        $entity->set('assignedUserId', $userId);
    }
}