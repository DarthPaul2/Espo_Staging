<?php

namespace Espo\Custom\Classes\Calendar;

use Espo\Modules\Crm\Tools\Calendar\Service as CoreCalendarService;
use Espo\ORM\Query\Part\Condition as Cond;
use Espo\ORM\Query\Select;
use Espo\ORM\Query\SelectBuilder;

/**
 * KleSec-Anpassung: abgeschlossene Aufgaben und erledigte Anrufe nicht im Kalender anzeigen
 * (Wunsch von Pavel, 31.08.2026) — Standard-Espo filtert im Kalender grundsätzlich nicht
 * nach Status. Überschreibt NUR die beiden Query-Methoden, alles andere bleibt
 * Standardverhalten der Kernklasse (kein Konstruktor nötig — wird von PHP automatisch geerbt).
 * Gebunden über custom/Espo/Custom/Binding.php — NICHT über custom/Espo/Modules/Crm/...,
 * das bricht `php command.php rebuild` (Espo wertet das als doppelt registriertes Modul).
 */
class Service extends CoreCalendarService
{
    protected function getCalendarTaskQuery(string $userId, string $from, string $to, bool $skipAcl): Select
    {
        $query = parent::getCalendarTaskQuery($userId, $from, $to, $skipAcl);

        return SelectBuilder::create()
            ->clone($query)
            ->where(['status!=' => 'Completed'])
            ->build();
    }

    protected function getCalendarCallQuery(string $userId, string $from, string $to, bool $skipAcl): Select
    {
        $query = parent::getCalendarCallQuery($userId, $from, $to, $skipAcl);

        return SelectBuilder::create()
            ->clone($query)
            ->where(
                Cond::notIn(Cond::column('status'), ['Held', 'Not Held'])
            )
            ->build();
    }
}
