<?php

namespace Espo\Custom\Hooks\CPersonalakte;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

/**
 * Что это:
 * Before-Save-Hook für CPersonalakte.
 *
 * Зачем:
 * Der Name-Titel der Personalakte (im Breadcrumb/in Listen sichtbar) soll automatisch
 * aus Name + Funktion des verknüpften Benutzers gebildet werden, statt einer
 * bedeutungslosen Datensatz-ID (Pavel, 03.09.2026).
 */
class SetNameFromUser
{
    public function __construct(
        private EntityManager $entityManager
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        $userId = $entity->get('userId');

        if (!$userId) {
            return;
        }

        $user = $this->entityManager->getEntity('User', $userId);

        if (!$user) {
            return;
        }

        $name = (string) $user->get('name');
        $funktion = trim((string) ($user->get('title') ?? ''));

        if ($funktion !== '') {
            $name .= ' – ' . $funktion;
        }

        $entity->set('name', $name);
    }
}
