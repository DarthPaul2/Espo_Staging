<?php

namespace Espo\Custom\Hooks\CServicevorgang;

use Espo\ORM\Entity;

/**
 * Что это:
 * Notdienst-App-Brücke (18.09.2026), Statuslogik aus NOTDIENST_APP_INTEGRATION_BRIEF.md
 * Abschnitt 4: setzt status automatisch, sobald der Techniker über die App eine
 * Entscheidung zurückmeldet. "eskaliert" hat bewusst KEINE eigene Statusfolge hier —
 * das übernimmt EscalateNotdienst.php (neue Task für Kevin), der Status bleibt unverändert.
 * Bewegt status NIE rückwärts (gleiche REIHENFOLGE-Absicherung wie
 * AdvanceStatusOnStundenberichtRelate.php) — falls der Vorgang durch einen Stundenbericht
 * o.ä. bereits weiter ist, überschreibt eine (verspätete) Rückmeldung das nicht mehr.
 */
class StatuslogikNachEntscheidung
{
    private const REIHENFOLGE = [
        'neu', 'geprueft', 'geplant', 'inArbeit', 'rueckfrageMaterial', 'abgeschlossen', 'abrechnungsfaehig',
    ];

    private const ZIELSTATUS = [
        'telefonischGeloest' => 'abgeschlossen',
        'fehlalarm' => 'abgeschlossen',
        'vorOrtEinsatz' => 'inArbeit',
    ];

    public function beforeSave(Entity $entity, array $options = []): void
    {
        if ($entity->get('vorgangsart') !== 'notdienst') {
            return;
        }

        if (!$entity->isAttributeChanged('entscheidung')) {
            return;
        }

        $entscheidung = $entity->get('entscheidung');
        $zielStatus = self::ZIELSTATUS[$entscheidung] ?? null;

        if (!$zielStatus) {
            return;
        }

        $aktuellerIndex = array_search((string) $entity->get('status'), self::REIHENFOLGE, true);
        $zielIndex = array_search($zielStatus, self::REIHENFOLGE, true);

        if ($aktuellerIndex === false || $zielIndex === false || $zielIndex <= $aktuellerIndex) {
            return;
        }

        $entity->set('status', $zielStatus);
    }
}
