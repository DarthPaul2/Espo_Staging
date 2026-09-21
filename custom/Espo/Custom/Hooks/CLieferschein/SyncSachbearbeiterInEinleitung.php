<?php

namespace Espo\Custom\Hooks\CLieferschein;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

// Зачем: siehe Espo\Custom\Hooks\CAngebot\SyncSachbearbeiterInEinleitung
// (gleicher Fix — Zeilen werden per Label ersetzt, nicht per altem Wert,
// ohne "Beauftragungen bitte an:"-Zeile, die es im Lieferschein-Text nicht gibt).
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

        // WICHTIG: siehe Espo\Custom\Hooks\CAngebot\SyncSachbearbeiterInEinleitung
        // — $user->get('name') zuerst, nicht das ggf. gecachte assignedUserName.
        $name = (string) ($user->get('name') ?: $entity->get('assignedUserName') ?: 'Tobias Schiller');
        $email = (string) ($user->get('emailAddress') ?: 'schiller@klesec.de');
        $phone = (string) ($user->get('phoneNumber') ?: '0171 6969930');

        $replacements = [
            '/(Ihr Ansprechpartner:[ \t]*).*/u' => $name,
            '/(E-Mail:[ \t]*).*/u' => $email,
            '/(Tel\.:[ \t]*).*/u' => $phone,
        ];

        $updated = $text;
        foreach ($replacements as $pattern => $value) {
            $updated = preg_replace_callback(
                $pattern,
                fn (array $m) => $m[1] . $value,
                $updated,
                1
            ) ?? $updated;
        }

        if ($updated !== $text) {
            $entity->set('einleitung', $updated);
        }
    }
}
