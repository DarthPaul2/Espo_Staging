<?php

namespace Espo\Custom\Hooks\CLieferschein;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

// Зачем: siehe Espo\Custom\Hooks\CAngebot\SyncSachbearbeiterInEinleitung
// (gleicher Fix, ohne "Beauftragungen bitte an:"-Zeile, die es im
// Lieferschein-Text nicht gibt).
class SyncSachbearbeiterInEinleitung
{
    public function __construct(
        private EntityManager $entityManager
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        $text = (string) ($entity->get('einleitung') ?? '');
        if (trim($text) === '') {
            return;
        }

        $userId = $entity->get('assignedUserId');
        if (!$userId) {
            return;
        }

        $user = $this->entityManager->getEntity('User', $userId);
        if (!$user) {
            return;
        }

        $name = (string) ($entity->get('assignedUserName') ?: $user->get('name') ?: 'Tobias Schiller');
        $email = (string) ($user->get('emailAddress') ?: 'schiller@klesec.de');
        $phone = (string) ($user->get('phoneNumber') ?: '0171 6969930');

        $updated = preg_replace(
            [
                '/Ihr Ansprechpartner:\s*Tobias Schiller/u',
                '/E-Mail:\s*schiller@klesec\.de/u',
                '/Tel\.:\s*0171 6969930/u',
            ],
            [
                'Ihr Ansprechpartner: ' . $name,
                'E-Mail: ' . $email,
                'Tel.: ' . $phone,
            ],
            $text
        );

        if ($updated !== null && $updated !== $text) {
            $entity->set('einleitung', $updated);
        }
    }
}
