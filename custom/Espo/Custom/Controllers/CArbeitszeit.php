<?php
namespace Espo\Custom\Controllers;

use Espo\Core\Templates\Controllers\Base;
use Espo\Core\Api\Request;

class CArbeitszeit extends Base
{
    private \DateTimeZone $_berlin;
    private \DateTimeZone $_utc;

    private function _toLocal(?string $utcStr): ?string
    {
        if (!$utcStr) return null;
        if (!isset($this->_berlin)) {
            $this->_berlin = new \DateTimeZone('Europe/Berlin');
            $this->_utc    = new \DateTimeZone('UTC');
        }
        $dt = new \DateTime($utcStr, $this->_utc);
        $dt->setTimezone($this->_berlin);
        return $dt->format('Y-m-d H:i:s');
    }

    // ── Праздники NRW — алгоритмический расчёт для любого года ───────────────
    private function _getFeiertage(int $year): array
    {
        // Дата Пасхи по алгоритму Гаусса
        $a = $year % 19;
        $b = intdiv($year, 100);
        $c = $year % 100;
        $d = intdiv($b, 4);
        $e = $b % 4;
        $f = intdiv($b + 8, 25);
        $g = intdiv($b - $f + 1, 3);
        $h = (19 * $a + $b - $d - $g + 15) % 30;
        $i = intdiv($c, 4);
        $k = $c % 4;
        $l = (32 + 2 * $e + 2 * $i - $h - $k) % 7;
        $m = intdiv($a + 11 * $h + 22 * $l, 451);
        $month = intdiv($h + $l - 7 * $m + 114, 31);
        $day   = (($h + $l - 7 * $m + 114) % 31) + 1;
        $easter = new \DateTime("$year-$month-$day");

        $fmt = fn(\DateTime $d) => $d->format('Y-m-d');
        $add = fn(\DateTime $d, int $days) => (clone $d)->modify("+$days days");

        return [
            "$year-01-01",                  // Neujahr
            $fmt($add($easter, -2)),         // Karfreitag
            $fmt($add($easter,  1)),         // Ostermontag
            "$year-05-01",                  // Tag der Arbeit
            $fmt($add($easter, 39)),         // Christi Himmelfahrt
            $fmt($add($easter, 50)),         // Pfingstmontag
            $fmt($add($easter, 60)),         // Fronleichnam (NRW)
            "$year-10-03",                  // Tag der deutschen Einheit
            "$year-11-01",                  // Allerheiligen (NRW)
            "$year-12-25",                  // 1. Weihnachtstag
            "$year-12-26",                  // 2. Weihnachtstag
        ];
    }

    private function _isFeiertag(\DateTime $date): bool
    {
        return in_array($date->format('Y-m-d'), $this->_getFeiertage((int)$date->format('Y')));
    }

    private function _getFeiertagnamen(int $year): array
    {
        $a = $year % 19;
        $b = intdiv($year, 100);
        $c = $year % 100;
        $d = intdiv($b, 4);
        $e = $b % 4;
        $f = intdiv($b + 8, 25);
        $g = intdiv($b - $f + 1, 3);
        $h = (19 * $a + $b - $d - $g + 15) % 30;
        $i = intdiv($c, 4);
        $k = $c % 4;
        $l = (32 + 2 * $e + 2 * $i - $h - $k) % 7;
        $m = intdiv($a + 11 * $h + 22 * $l, 451);
        $month = intdiv($h + $l - 7 * $m + 114, 31);
        $day   = (($h + $l - 7 * $m + 114) % 31) + 1;
        $easter = new \DateTime("$year-$month-$day");

        $fmt = fn(\DateTime $d) => $d->format('Y-m-d');
        $add = fn(\DateTime $d, int $days) => (clone $d)->modify("+$days days");

        return [
            "$year-01-01"              => 'Neujahr',
            $fmt($add($easter, -2))    => 'Karfreitag',
            $fmt($add($easter,  1))    => 'Ostermontag',
            "$year-05-01"              => 'Tag der Arbeit',
            $fmt($add($easter, 39))    => 'Christi Himmelfahrt',
            $fmt($add($easter, 50))    => 'Pfingstmontag',
            $fmt($add($easter, 60))    => 'Fronleichnam',
            "$year-10-03"              => 'Tag der deutschen Einheit',
            "$year-11-01"              => 'Allerheiligen',
            "$year-12-25"              => '1. Weihnachtstag',
            "$year-12-26"              => '2. Weihnachtstag',
        ];
    }

    private function _isArbeitstag(\DateTime $date): bool
    {
        $dow = (int)$date->format('N');
        if ($dow >= 6) return false;
        return !$this->_isFeiertag($date);
    }

    private function _arbeitstageImMonat(int $year, int $month): int
    {
        $letzterTag = (int)(new \DateTime("$year-$month-01"))->format('t');
        $count = 0;
        for ($day = 1; $day <= $letzterTag; $day++) {
            if ($this->_isArbeitstag(new \DateTime("$year-$month-$day"))) $count++;
        }
        return $count;
    }

    private function _getAbwesenheiten(\PDO $pdo, string $technikerId, string $erster, string $letzter): array
    {
        $stmt = $pdo->prepare("
            SELECT DATE(date_start) AS date_start_date, DATE(date_end) AS date_end_date, typ, name
            FROM c_abwesenheit
            WHERE deleted = 0
              AND assigned_user_id = :uid
              AND DATE(date_start) <= :letzter
              AND DATE(date_end)   >= :erster
            ORDER BY date_start ASC
        ");
        $stmt->execute(['uid' => $technikerId, 'letzter' => $letzter, 'erster' => $erster]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    private function _urlaubstageImMonat(\PDO $pdo, string $technikerId, int $year, int $month): int
    {
        $erster  = new \DateTime("$year-$month-01");
        $letzter = new \DateTime($erster->format('Y-m-t'));

        $count = 0;
        foreach ($this->_getAbwesenheiten($pdo, $technikerId, $erster->format('Y-m-d'), $letzter->format('Y-m-d')) as $abw) {
            $start = new \DateTime(max($abw['date_start_date'], $erster->format('Y-m-d')));
            $end   = new \DateTime(min($abw['date_end_date'],   $letzter->format('Y-m-d')));
            $cur   = clone $start;
            while ($cur <= $end) {
                if ($this->_isArbeitstag($cur)) $count++;
                $cur->modify('+1 day');
            }
        }
        return $count;
    }

    // ── Monatsübersicht ────────────────────────────────────────────────────────
    public function actionGetMonatsstatistik(array $params, $data, Request $request)
    {
        $q           = $request->getQueryParams();
        $technikerId = $q['technikerId'] ?? null;
        $month       = $q['month'] ?? null;
        $year        = $q['year'] ?? null;

        if (!$technikerId || !$month || !$year) {
            throw new \Espo\Core\Exceptions\BadRequest('Fehlende Parameter');
        }

        $pdo = $this->getEntityManager()->getPDO();

        $stmt = $pdo->prepare("
            SELECT
                DATE(startzeit)     AS datum,
                startzeit,
                endzeit,
                dauerminuten        AS dauer,
                nettominuten        AS netto,
                feiertagwochenende  AS wochenende
            FROM c_arbeitszeit
            WHERE deleted = 0
              AND techniker_id = :tid
              AND MONTH(startzeit) = :m
              AND YEAR(startzeit)  = :y
            ORDER BY startzeit ASC
        ");
        $stmt->execute(['tid' => $technikerId, 'm' => (int)$month, 'y' => (int)$year]);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // Конвертируем UTC→Europe/Berlin для отображения
        foreach ($rows as &$r) {
            $localStart    = $this->_toLocal($r['startzeit']);
            $r['startzeit'] = $localStart;
            $r['endzeit']   = $this->_toLocal($r['endzeit']);
            $r['datum']     = $localStart ? substr($localStart, 0, 10) : $r['datum'];
        }
        unset($r);

        $erster      = "$year-$month-01";
        $letzter     = (new \DateTime($erster))->format('Y-m-t');
        $abwesenheiten = $this->_getAbwesenheiten($pdo, $technikerId, $erster, $letzter);

        // Индекс: дата → запись о работе
        $arbeitIndex = [];
        foreach ($rows as $r) {
            $arbeitIndex[$r['datum']] = $r;
        }

        // Индекс: дата → тип отсутствия
        $abwIndex = [];
        foreach ($abwesenheiten as $abw) {
            $cur = new \DateTime($abw['date_start_date']);
            $end = new \DateTime($abw['date_end_date']);
            while ($cur <= $end) {
                $abwIndex[$cur->format('Y-m-d')] = $abw['typ'];
                $cur->modify('+1 day');
            }
        }

        // Полная таблица всех дней месяца (рабочие + праздники + выходные с записями)
        $alleTagе = [];
        $feiertagnamen = $this->_getFeiertagnamen((int)$year);
        $cur = new \DateTime($erster);
        $endDt = new \DateTime($letzter);
        while ($cur <= $endDt) {
            $datum = $cur->format('Y-m-d');
            $dow   = (int)$cur->format('N'); // 1=Mo, 7=So
            $isFT  = $this->_isFeiertag($cur);
            $isWE  = $dow >= 6;

            if ($isFT && !$isWE) {
                // Feiertag (Wochentag)
                $alleTagе[] = [
                    'datum'     => $datum,
                    'startzeit' => null,
                    'endzeit'   => null,
                    'dauer'     => null,
                    'netto'     => null,
                    'wochenende'=> false,
                    'status'    => 'feiertag',
                    'name'      => $feiertagnamen[$datum] ?? 'Feiertag',
                ];
            } elseif (!$isWE && !$isFT) {
                // Обычный рабочий день
                if (isset($arbeitIndex[$datum])) {
                    $r = $arbeitIndex[$datum];
                    $alleTagе[] = [
                        'datum'     => $datum,
                        'startzeit' => $r['startzeit'],
                        'endzeit'   => $r['endzeit'],
                        'dauer'     => $r['dauer'],
                        'netto'     => $r['netto'],
                        'wochenende'=> false,
                        'status'    => 'gearbeitet',
                        'name'      => null,
                    ];
                } elseif (isset($abwIndex[$datum])) {
                    $alleTagе[] = [
                        'datum'     => $datum,
                        'startzeit' => null,
                        'endzeit'   => null,
                        'dauer'     => null,
                        'netto'     => null,
                        'wochenende'=> false,
                        'status'    => $abwIndex[$datum] === 'K' ? 'krank' : 'urlaub',
                        'name'      => null,
                    ];
                } else {
                    $alleTagе[] = [
                        'datum'     => $datum,
                        'startzeit' => null,
                        'endzeit'   => null,
                        'dauer'     => null,
                        'netto'     => null,
                        'wochenende'=> false,
                        'status'    => 'fehlend',
                        'name'      => null,
                    ];
                }
            }
            $cur->modify('+1 day');
        }

        $arbeitstage = $this->_arbeitstageImMonat((int)$year, (int)$month);
        $urlaubstage = $this->_urlaubstageImMonat($pdo, $technikerId, (int)$year, (int)$month);
        $sollMin     = ($arbeitstage - $urlaubstage) * 480;
        $nettoMin    = array_sum(array_column($rows, 'netto'));
        $bilanzMin   = $nettoMin - $sollMin;

        return [
            'success'       => true,
            'rows'          => $alleTagе,
            'abwesenheiten' => $abwesenheiten,
            'arbeitstage'   => $arbeitstage,
            'urlaubstage'   => $urlaubstage,
            'soll_min'      => $sollMin,
            'netto_min'     => $nettoMin,
            'bilanz_min'    => $bilanzMin,
        ];
    }

    // ── Jahresübersicht ────────────────────────────────────────────────────────
    public function actionGetJahresstatistik(array $params, $data, Request $request)
    {
        $q           = $request->getQueryParams();
        $technikerId = $q['technikerId'] ?? null;
        $year        = $q['year'] ?? null;

        if (!$technikerId || !$year) {
            throw new \Espo\Core\Exceptions\BadRequest('Fehlende Parameter');
        }

        $pdo = $this->getEntityManager()->getPDO();

        $stmt = $pdo->prepare("
            SELECT
                MONTH(startzeit)   AS monat,
                SUM(dauerminuten)  AS summeDauer,
                SUM(nettominuten)  AS summeNetto,
                SUM(CASE WHEN feiertagwochenende = 1 THEN nettominuten ELSE 0 END) AS summeFeiertagWochenende
            FROM c_arbeitszeit
            WHERE deleted = 0
              AND techniker_id = :tid
              AND YEAR(startzeit) = :y
            GROUP BY MONTH(startzeit)
            ORDER BY monat ASC
        ");
        $stmt->execute(['tid' => $technikerId, 'y' => (int)$year]);
        $rawRows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $rows = [];
        $gesamtSoll = 0;
        $gesamtNetto = 0;
        $gesamtBilanz = 0;

        foreach ($rawRows as $r) {
            $monat       = (int)$r['monat'];
            $arbeitstage = $this->_arbeitstageImMonat((int)$year, $monat);
            $urlaubstage = $this->_urlaubstageImMonat($pdo, $technikerId, (int)$year, $monat);
            $sollMin     = ($arbeitstage - $urlaubstage) * 480;
            $nettoMin    = (int)$r['summeNetto'];
            $bilanzMin   = $nettoMin - $sollMin;

            $gesamtSoll  += $sollMin;
            $gesamtNetto += $nettoMin;
            $gesamtBilanz += $bilanzMin;

            $rows[] = [
                'monat'                   => $monat,
                'summeDauer'              => (int)$r['summeDauer'],
                'summeNetto'              => $nettoMin,
                'summeFeiertagWochenende' => (int)$r['summeFeiertagWochenende'],
                'arbeitstage'             => $arbeitstage,
                'urlaubstage'             => $urlaubstage,
                'soll_min'                => $sollMin,
                'bilanz_min'              => $bilanzMin,
            ];
        }

        $alleAbwesenheiten = $this->_getAbwesenheiten($pdo, $technikerId, "$year-01-01", "$year-12-31");

        return [
            'success'          => true,
            'rows'             => $rows,
            'abwesenheiten'    => $alleAbwesenheiten,
            'gesamt_soll'      => $gesamtSoll,
            'gesamt_netto'     => $gesamtNetto,
            'gesamt_bilanz'    => $gesamtBilanz,
        ];
    }
}
