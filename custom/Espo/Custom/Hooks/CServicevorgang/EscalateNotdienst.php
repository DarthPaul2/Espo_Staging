<?php

namespace Espo\Custom\Hooks\CServicevorgang;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

/**
 * Что это:
 * Notdienst-App-Brücke (18.09.2026). Wenn entscheidung -> "eskaliert" wechselt (Techniker
 * meldet in der App "eskaliert" zurück, Server macht PATCH CServicevorgang), wird
 * automatisch eine neue Task "ESKALATION: …" für Kevin Braun (aktuell einziger
 * Chef-Techniker, siehe project_dennis_rieck_left_company) erzeugt — läuft über denselben
 * App-Task-Kanal wie die ursprüngliche Alarm-Task. Setzt zusätzlich das bereits
 * bestehende Feld alarmEskaliert=true auf dem Servicevorgang selbst.
 *
 * Dedup-Schutz: isAttributeChanged('entscheidung') feuert nur, wenn sich der Wert in
 * DIESEM Save tatsächlich ändert — ein wiederholter PATCH mit demselben Wert (App-Retry
 * ohne funktionierenden client_request_id-Dedup auf Flask-Seite) löst hier nichts erneut
 * aus. Primäre Verteidigung gegen Retry-Duplikate ist der client_request_id-Dedup auf
 * Flask-Seite — das hier ist die sekundäre Absicherung.
 *
 * WICHTIG (18.09.2026, live gefunden): alarmEskaliert wird in beforeSave gesetzt, NICHT
 * per zweitem saveEntity($entity) in afterSave — ein zweites saveEntity auf demselben
 * Entity-Objekt setzt Espos Change-Tracking zurück (der Entity gilt danach als "clean"),
 * wodurch der alphabetisch NACH "EscalateNotdienst" laufende Hook
 * "SyncNotdienstTaskStatus" fälschlich isAttributeChanged()=false sieht und die
 * Rückmeldungs-Felder NICHT mehr auf die Task spiegelt. Live reproduziert: cEntscheidung/
 * cRueckrufAm/cRueckrufNotiz blieben nach einer Eskalation leer.
 */
class EscalateNotdienst
{
    private const KEVIN_USERNAME = 'kevin';

    public function __construct(private EntityManager $em) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        if ($entity->get('vorgangsart') !== 'notdienst') {
            return;
        }

        if (!$entity->isAttributeChanged('entscheidung') || $entity->get('entscheidung') !== 'eskaliert') {
            return;
        }

        if (!$entity->get('alarmEskaliert')) {
            $entity->set('alarmEskaliert', true);
        }
    }

    public function afterSave(Entity $entity, array $options = []): void
    {
        if ($entity->get('vorgangsart') !== 'notdienst') {
            return;
        }

        if (!$entity->isAttributeChanged('entscheidung') || $entity->get('entscheidung') !== 'eskaliert') {
            return;
        }

        $kevin = $this->em->getRDBRepository('User')
            ->where(['userName' => self::KEVIN_USERNAME])
            ->findOne();

        if (!$kevin) {
            return;
        }

        $account = null;
        $accountName = '';
        if ($entity->get('accountId')) {
            $account = $this->em->getEntity('Account', $entity->get('accountId'));
            $accountName = $account ? trim((string) $account->get('name')) : '';
        }

        $task = $this->em->getNewEntity('Task');
        $task->set([
            'name' => 'ESKALATION: Notdienst' . ($accountName ? " – {$accountName}" : ''),
            'description' => trim((string) $entity->get('rueckrufNotiz')) ?: null,
            'assignedUserId' => $kevin->getId(),
            'parentType' => $account ? 'Account' : null,
            'parentId' => $account ? $account->getId() : null,
            'cServicevorgangId' => $entity->getId(),
            'cServicevorgangArt' => $entity->get('vorgangsart'),
            'cAnruferName' => trim((string) $entity->get('anruferName')) ?: null,
            'cAnruferTelefon' => trim((string) $entity->get('anruferTelefon')) ?: null,
            'cProblem' => trim((string) $entity->get('problem')) ?: null,
            'cPrioritaet' => trim((string) $entity->get('prioritaet')) ?: null,
            'cAlarmierungAm' => $entity->get('alarmierungAm'),
        ]);
        $this->em->saveEntity($task);
    }
}
