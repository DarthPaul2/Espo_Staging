<?php

namespace Espo\Custom\Hooks\CAngebot;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

// Зачем:
// Das Feld "einleitung" enthält beim Anlegen einen statischen Default-Text mit
// "Ihr Ansprechpartner: Tobias Schiller" (siehe entityDefs/CAngebot.json).
// Beim Speichern ersetzen wir diesen (auch wenn der Text zwischenzeitlich um
// eigene Zeilen ergänzt wurde) durch die Kontaktdaten des tatsächlich
// zugewiesenen Sachbearbeiters (assignedUser). Der clientseitige Fix in
// client/custom/src/views/c-angebot/record/detail.js macht dasselbe schon für
// Anzeige/PDF — dieser Hook sorgt zusätzlich dafür, dass es auch nach dem
// Speichern (und bei API-Zugriffen ohne diese View) in der Datenbank stimmt.
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
                '/Beauftragungen bitte an:\s*schiller@klesec\.de/u',
            ],
            [
                'Ihr Ansprechpartner: ' . $name,
                'E-Mail: ' . $email,
                'Tel.: ' . $phone,
                'Beauftragungen bitte an: ' . $email,
            ],
            $text
        );

        if ($updated !== null && $updated !== $text) {
            $entity->set('einleitung', $updated);
        }
    }
}
