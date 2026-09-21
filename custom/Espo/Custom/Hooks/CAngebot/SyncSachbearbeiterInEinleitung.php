<?php

namespace Espo\Custom\Hooks\CAngebot;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

// Зачем:
// Das Feld "einleitung" enthält feste Zeilen "Ihr Ansprechpartner:"/"E-Mail:"/
// "Tel.:"/"Beauftragungen bitte an:", deren Inhalt den zugewiesenen
// Sachbearbeiter (assignedUser) widerspiegeln soll. Wir ersetzen den WERT
// dieser Zeilen bei jedem Speichern durch die aktuellen Kontaktdaten —
// unabhängig davon, wer/was dort vorher stand (nicht nur den alten "Tobias
// Schiller"-Default abgleichen: sonst bleibt z. B. "Kevin Braun" stehen,
// wenn der Sachbearbeiter danach nochmal auf Tobias wechselt, siehe
// 21.09.26). Der clientseitige Fix in
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

        // WICHTIG: $user->get('name') zuerst — er ist frisch anhand der GERADE
        // gesetzten assignedUserId geladen. $entity->get('assignedUserName')
        // ist ein gecachtes Foreign-Feld und kann direkt nach einem
        // assignedUserId-Wechsel noch den ALTEN Namen enthalten (führte am
        // 21.09.26 dazu, dass Name und E-Mail/Tel. von unterschiedlichen
        // Personen stammten).
        $name = (string) ($user->get('name') ?: $entity->get('assignedUserName') ?: 'Tobias Schiller');
        $email = (string) ($user->get('emailAddress') ?: 'schiller@klesec.de');
        $phone = (string) ($user->get('phoneNumber') ?: '0171 6969930');

        $replacements = [
            '/(Ihr Ansprechpartner:[ \t]*).*/u' => $name,
            '/(E-Mail:[ \t]*).*/u' => $email,
            '/(Tel\.:[ \t]*).*/u' => $phone,
            '/(Beauftragungen bitte an:[ \t]*).*/u' => $email,
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
