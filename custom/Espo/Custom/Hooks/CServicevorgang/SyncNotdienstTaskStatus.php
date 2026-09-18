<?php

namespace Espo\Custom\Hooks\CServicevorgang;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

/**
 * Что это:
 * Notdienst-App-Brücke (18.09.2026) — Server-als-Source-of-Truth-Prinzip (siehe
 * TechSpecs/Servicevorgang/NOTDIENST_APP_INTEGRATION_BRIEF.md, Korrekturrunde 2).
 * Spiegelt alarmBestaetigtAm/entscheidung/rueckrufAm/rueckrufNotiz bei JEDER Änderung
 * auf alle mit diesem Servicevorgang verknüpften Tasks (normalerweise die eine
 * Alarm-Task, ggf. zusätzlich die Eskalations-Task). Grund: die App pollt periodisch
 * GET /tasks/technician/<id> und muss den Bestätigt-/Rückmeldungs-Status direkt aus
 * Espo sehen können — nicht nur einmalig aus der eigenen Antwort auf ihren POST, sonst
 * würde z.B. eine App-Neuinstallation den "Alarm bestätigt"-Button wieder aktiv zeigen.
 */
class SyncNotdienstTaskStatus
{
    private const FELDER = ['alarmBestaetigtAm', 'entscheidung', 'rueckrufAm', 'rueckrufNotiz'];

    public function __construct(private EntityManager $em) {}

    public function afterSave(Entity $entity, array $options = []): void
    {
        if ($entity->get('vorgangsart') !== 'notdienst') {
            return;
        }

        $geaendert = false;
        foreach (self::FELDER as $feld) {
            if ($entity->isAttributeChanged($feld)) {
                $geaendert = true;
                break;
            }
        }

        if (!$geaendert) {
            return;
        }

        $tasks = $this->em->getRDBRepository('Task')
            ->where(['cServicevorgangId' => $entity->getId()])
            ->find();

        foreach ($tasks as $task) {
            $task->set([
                'cAlarmBestaetigtAm' => $entity->get('alarmBestaetigtAm'),
                'cEntscheidung' => $entity->get('entscheidung'),
                'cRueckrufAm' => $entity->get('rueckrufAm'),
                'cRueckrufNotiz' => $entity->get('rueckrufNotiz'),
            ]);
            $this->em->saveEntity($task);
        }
    }
}
