<?php

namespace Espo\Custom\Hooks\CServicevorgang;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

/**
 * Что это:
 * Notdienst-App-Brücke (18.09.2026), siehe TechSpecs/Servicevorgang/NOTDIENST_APP_INTEGRATION_BRIEF.md.
 * Legt beim Speichern eines Servicevorgangs mit vorgangsart=notdienst automatisch eine
 * Task an (Phase 1 "Alarm"), zugewiesen an denselben Techniker wie "Zugewiesener Benutzer".
 * Die Task trägt zusätzlich denormalisierte Kopien der Anrufer-/Kunden-/Problem-Felder
 * (cAnrufer*, cKunde*, cProblem, cPrioritaet, cAlarmierungAm, cServicevorgangArt) — diese
 * Felder existieren NUR für die App-Anbindung (Flask liest sie 1:1 über den bestehenden
 * Task.update/Task.create-Webhook, ohne Zusatzabfrage), nicht für die Espo-UI gedacht.
 *
 * Ausgelöst bei: neuer Datensatz, ODER Neuzuweisung (assignedUser geändert) SOLANGE der
 * Alarm noch nicht bestätigt wurde (alarmBestaetigtAm leer) — danach erzeugt eine spätere
 * Korrektur der Zuweisung bewusst KEINE zweite Alarm-Task mehr (Vermeidung von Duplikaten
 * nach bereits laufendem Phase-2-Ablauf).
 */
class CreateNotdienstTask
{
    public function __construct(private EntityManager $em) {}

    public function afterSave(Entity $entity, array $options = []): void
    {
        if ($entity->get('vorgangsart') !== 'notdienst') {
            return;
        }

        $assignedUserId = $entity->get('assignedUserId');
        if (!$assignedUserId) {
            return;
        }

        $shouldCreate = $entity->isNew()
            || (
                $entity->isAttributeChanged('assignedUserId')
                && !$entity->get('alarmBestaetigtAm')
            );

        if (!$shouldCreate) {
            return;
        }

        $account = $entity->get('accountId')
            ? $this->em->getEntity('Account', $entity->get('accountId'))
            : null;

        $kundeTelefon = $account ? trim((string) $account->get('phoneNumber')) : '';
        $kundeAdresse = '';
        if ($account) {
            $strasse = trim((string) $account->get('billingAddressStreet'));
            $plz = trim((string) $account->get('billingAddressPostalCode'));
            $ort = trim((string) $account->get('billingAddressCity'));
            $kundeAdresse = trim($strasse . ', ' . trim($plz . ' ' . $ort), ', ');
        }

        $anruferName = trim((string) $entity->get('anruferName'));
        $accountName = $account ? trim((string) $account->get('name')) : '';

        $title = 'Notdienst-Alarm' . ($accountName ? " – {$accountName}" : '');

        $beschreibungZeilen = [];
        if ($anruferName) {
            $beschreibungZeilen[] = "Anrufer: {$anruferName}" .
                (trim((string) $entity->get('anruferTelefon')) ? ' (' . $entity->get('anruferTelefon') . ')' : '');
        }
        if ($accountName) {
            $beschreibungZeilen[] = "Kunde: {$accountName}" . ($kundeTelefon ? " ({$kundeTelefon})" : '');
        }
        if ($kundeAdresse) {
            $beschreibungZeilen[] = "Adresse: {$kundeAdresse}";
        }
        if (trim((string) $entity->get('problem'))) {
            $beschreibungZeilen[] = "Problem: " . $entity->get('problem');
        }

        $task = $this->em->getNewEntity('Task');
        $task->set([
            'name' => $title,
            'description' => $beschreibungZeilen ? implode("\n", $beschreibungZeilen) : null,
            'assignedUserId' => $assignedUserId,
            // Wie bei Wartungs-Tasks (parentType=Account/parentId) — Flask löst darüber
            // den Kunden auf (routes_espo.py::_resolve_client_id), sonst "no client resolved".
            'parentType' => $account ? 'Account' : null,
            'parentId' => $account ? $account->getId() : null,
            'cServicevorgangId' => $entity->getId(),
            'cServicevorgangArt' => $entity->get('vorgangsart'),
            'cAnruferName' => $anruferName ?: null,
            'cAnruferTelefon' => trim((string) $entity->get('anruferTelefon')) ?: null,
            'cKundeTelefon' => $kundeTelefon ?: null,
            'cKundeAdresse' => $kundeAdresse ?: null,
            'cProblem' => trim((string) $entity->get('problem')) ?: null,
            'cPrioritaet' => trim((string) $entity->get('prioritaet')) ?: null,
            'cAlarmierungAm' => $entity->get('alarmierungAm'),
        ]);

        $this->em->saveEntity($task);
    }
}
