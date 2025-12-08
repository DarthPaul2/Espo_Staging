<?php

namespace Espo\Custom\Controllers;

use Espo\Core\Templates\Controllers\Base;

class CRechnung extends Base
{
    /**
     * GET /CRechnung/action/bezahltUmsatzByMonth
     *
     * Параметры (query, опционально):
     *   year=YYYY
     *
     * Возвращает:
     * [
     *   { "month": "2025-01", "umsatzNetto": 1234.56, "umsatzBrutto": 1456.78, "cnt": 10 },
     *   ...
     * ]
     */
    public function getActionBezahltUmsatzByMonth($params, $data, $request)
    {
        $em  = $this->getEntityManager();
        $pdo = $em->getPDO();

        // ?year=2025 (опционально)
        $year = $request->getQueryParam('year');

        $sql = "
            SELECT
                DATE_FORMAT(bezahlt_am, '%Y-%m') AS month,
                SUM(betrag_netto)  AS umsatzNetto,
                SUM(betrag_brutto) AS umsatzBrutto,
                COUNT(*)           AS cnt
            FROM c_rechnung
            WHERE
                deleted = 0
                AND status = 'bezahlt'
                AND bezahlt_am IS NOT NULL
                " . ($year ? "AND YEAR(bezahlt_am) = :year" : "") . "
            GROUP BY DATE_FORMAT(bezahlt_am, '%Y-%m')
            ORDER BY month ASC
        ";

        try {
            $sth = $pdo->prepare($sql);

            if ($year) {
                $sth->bindValue(':year', (int) $year, \PDO::PARAM_INT);
            }

            $sth->execute();

            $rows = $sth->fetchAll(\PDO::FETCH_ASSOC) ?: [];

            foreach ($rows as &$row) {
                $row['umsatzNetto']  = (float) ($row['umsatzNetto']  ?? 0);
                $row['umsatzBrutto'] = (float) ($row['umsatzBrutto'] ?? 0);
                $row['cnt']          = (int)   ($row['cnt']          ?? 0);
            }

            return $rows;

        } catch (\Throwable $e) {
            $this->getContainer()->get('log')->error(
                'CRechnung::bezahltUmsatzByMonth SQL error: ' . $e->getMessage()
            );

            return [
                'success' => false,
                'error'   => 'SQL error in bezahltUmsatzByMonth',
            ];
        }
    }

    /**
     * GET /CRechnung/action/rechnungStatusSummary
     *
     * Параметры (query, опционально):
     *   year=YYYY
     *
     * Возвращает один объект с агрегатами ЗА ВЫБРАННЫЙ ГОД:
     *  - всего счетов (кроме storniert)
     *  - суммы Netto/Brutto по всем
     *  - суммы и количество по оплаченным
     *  - суммы и количество по не оплаченным (кроме storniert)
     */
    public function getActionRechnungStatusSummary($params, $data, $request)
    {
        $em  = $this->getEntityManager();
        $pdo = $em->getPDO();

        // ?year=2025 (опционально)
        $year = $request->getQueryParam('year');

        $yearFilterSql = '';
        if ($year && preg_match('/^\d{4}$/', $year)) {
            // фильтруем по году выставления счёта (created_at)
            $yearFilterSql = " AND YEAR(created_at) = :year ";
        }

        $sql = "
            SELECT
                -- все (кроме storniert)
                COUNT(*)                                          AS totalCount,
                SUM(betrag_netto)                                 AS totalNetto,
                SUM(betrag_brutto)                                AS totalBrutto,

                -- оплаченные
                SUM(CASE WHEN status = 'bezahlt' THEN 1 ELSE 0 END)             AS bezahltCount,
                SUM(CASE WHEN status = 'bezahlt' THEN betrag_netto  ELSE 0 END) AS bezahltNetto,
                SUM(CASE WHEN status = 'bezahlt' THEN betrag_brutto ELSE 0 END) AS bezahltBrutto,

                -- не оплаченные (все, кто НЕ bezahlt и НЕ storniert)
                SUM(CASE WHEN status <> 'bezahlt' THEN 1 ELSE 0 END)             AS offenCount,
                SUM(CASE WHEN status <> 'bezahlt' THEN betrag_netto  ELSE 0 END) AS offenNetto,
                SUM(CASE WHEN status <> 'bezahlt' THEN betrag_brutto ELSE 0 END) AS offenBrutto
            FROM c_rechnung
            WHERE
                deleted = 0
                AND status <> 'storniert'
                {$yearFilterSql}
        ";

        try {
            $sth = $pdo->prepare($sql);

            if ($yearFilterSql) {
                $sth->bindValue(':year', (int) $year, \PDO::PARAM_INT);
            }

            $sth->execute();

            $row = $sth->fetch(\PDO::FETCH_ASSOC) ?: [];

            $result = [
                'totalCount'    => (int)   ($row['totalCount']    ?? 0),
                'totalNetto'    => (float) ($row['totalNetto']    ?? 0),
                'totalBrutto'   => (float) ($row['totalBrutto']   ?? 0),

                'bezahltCount'  => (int)   ($row['bezahltCount']  ?? 0),
                'bezahltNetto'  => (float) ($row['bezahltNetto']  ?? 0),
                'bezahltBrutto' => (float) ($row['bezahltBrutto'] ?? 0),

                'offenCount'    => (int)   ($row['offenCount']    ?? 0),
                'offenNetto'    => (float) ($row['offenNetto']    ?? 0),
                'offenBrutto'   => (float) ($row['offenBrutto']   ?? 0),
            ];

            $this->getContainer()->get('log')->info(
                'CRechnung::rechnungStatusSummary result: ' . json_encode($result)
            );

            return $result;
        } catch (\Throwable $e) {
            $this->getContainer()->get('log')->error(
                'CRechnung::rechnungStatusSummary SQL error: ' . $e->getMessage()
            );

            return [
                'success' => false,
                'error'   => 'SQL error in rechnungStatusSummary',
            ];
        }
    }

    public function getActionMonatlicheStatistik($params, $data, $request)
    {
        $year = $request->getQueryParam('year');
        if (!$year || !preg_match('/^\d{4}$/', $year)) {
            return ['success' => false, 'error' => 'year parameter missing or invalid'];
        }

        $em  = $this->getEntityManager();
        $pdo = $em->getPDO();

        /**
         * 🇩🇪 ЛОГИКА:
         * Umsatz       → created_at
         * Bezahlt      → bezahlt_am
         * Offene Posten→ faellig_am
         */
        $sql = "
            SELECT
                m.monat AS month,

                -- Umsatz (выставлено)
                SUM(CASE WHEN r.status <> 'storniert'
                         AND YEAR(r.created_at) = :year
                         AND DATE_FORMAT(r.created_at, '%Y-%m') = m.monat
                     THEN r.betrag_netto ELSE 0 END) AS umsatzNetto,

                SUM(CASE WHEN r.status <> 'storniert'
                         AND YEAR(r.created_at) = :year
                         AND DATE_FORMAT(r.created_at, '%Y-%m') = m.monat
                     THEN r.betrag_brutto ELSE 0 END) AS umsatzBrutto,

                -- Оплачено
                SUM(CASE WHEN r.status = 'bezahlt'
                         AND YEAR(r.bezahlt_am) = :year
                         AND DATE_FORMAT(r.bezahlt_am, '%Y-%m') = m.monat
                     THEN r.betrag_netto ELSE 0 END) AS bezahltNetto,

                SUM(CASE WHEN r.status = 'bezahlt'
                         AND YEAR(r.bezahlt_am) = :year
                         AND DATE_FORMAT(r.bezahlt_am, '%Y-%m') = m.monat
                     THEN r.betrag_brutto ELSE 0 END) AS bezahltBrutto,

                -- Не оплачено (Offene Posten)
                SUM(CASE WHEN r.status <> 'bezahlt'
                         AND r.status <> 'storniert'
                         AND YEAR(r.faellig_am) = :year
                         AND DATE_FORMAT(r.faellig_am, '%Y-%m') = m.monat
                     THEN r.betrag_netto ELSE 0 END) AS offenNetto,

                SUM(CASE WHEN r.status <> 'bezahlt'
                         AND r.status <> 'storniert'
                         AND YEAR(r.faellig_am) = :year
                         AND DATE_FORMAT(r.faellig_am, '%Y-%m') = m.monat
                     THEN r.betrag_brutto ELSE 0 END) AS offenBrutto

            FROM
                (
                    SELECT DATE_FORMAT(STR_TO_DATE(CONCAT(:year, '-', m, '-01'), '%Y-%m-%d'), '%Y-%m') AS monat
                    FROM (SELECT 1 AS m UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6
                          UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12) AS months
                ) AS m
            LEFT JOIN c_rechnung r ON 1=1
            WHERE r.deleted = 0
            GROUP BY m.monat
            ORDER BY m.monat ASC
        ";

        try {
            $sth = $pdo->prepare($sql);
            $sth->execute(['year' => $year]);
            $rows = $sth->fetchAll(\PDO::FETCH_ASSOC) ?: [];

            foreach ($rows as &$row) {
                foreach ($row as $k => $v) {
                    if ($k !== 'month') {
                        $row[$k] = (float) $v;
                    }
                }
            }

            return $rows;
        } catch (\Throwable $e) {
            $this->getContainer()->get('log')->error("monatlicheStatistik error: " . $e->getMessage());
            return ['success' => false, 'error' => 'SQL error'];
        }
    }

    public function getActionJahresStatistik($params, $data, $request)
    {
        $em  = $this->getEntityManager();
        $pdo = $em->getPDO();

        $sql = "
            SELECT
                YEAR(r.created_at) AS year,

                SUM(r.betrag_netto)  AS umsatzNetto,
                SUM(r.betrag_brutto) AS umsatzBrutto,

                SUM(CASE WHEN r.status = 'bezahlt' THEN r.betrag_netto  ELSE 0 END) AS bezahltNetto,
                SUM(CASE WHEN r.status = 'bezahlt' THEN r.betrag_brutto ELSE 0 END) AS bezahltBrutto,

                SUM(CASE WHEN r.status <> 'bezahlt' AND r.status <> 'storniert'
                         THEN r.betrag_netto ELSE 0 END) AS offenNetto,

                SUM(CASE WHEN r.status <> 'bezahlt' AND r.status <> 'storniert'
                         THEN r.betrag_brutto ELSE 0 END) AS offenBrutto

            FROM c_rechnung r
            WHERE r.deleted = 0
            GROUP BY YEAR(r.created_at)
            ORDER BY year ASC
        ";

        try {
            $rows = $pdo->query($sql)->fetchAll(\PDO::FETCH_ASSOC) ?: [];

            foreach ($rows as &$row) {
                foreach ($row as $k => $v) {
                    if ($k !== 'year') {
                        $row[$k] = (float) $v;
                    } else {
                        $row[$k] = (int) $v;
                    }
                }
            }

            return $rows;
        } catch (\Throwable $e) {
            $this->getContainer()->get('log')->error("jahresStatistik error: " . $e->getMessage());
            return ['success' => false, 'error' => 'SQL error'];
        }
    }

    public function getActionUmsatzGestelltByMonth($params, $data, $request)
    {
        $em  = $this->getEntityManager();
        $pdo = $em->getPDO();

        $year = $request->getQueryParam('year');   // можно фильтровать по году

        $sql = "
            SELECT
                DATE_FORMAT(created_at, '%Y-%m') AS month,
                SUM(betrag_netto)  AS umsatzNetto,
                SUM(betrag_brutto) AS umsatzBrutto,
                COUNT(*) AS cnt
            FROM c_rechnung
            WHERE
                deleted = 0
                AND status <> 'storniert'
                " . ($year ? "AND YEAR(created_at) = :year" : "") . "
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month ASC
        ";

        try {
            $sth = $pdo->prepare($sql);
            if ($year) {
                $sth->bindValue(':year', $year, \PDO::PARAM_INT);
            }
            $sth->execute();

            $rows = $sth->fetchAll(\PDO::FETCH_ASSOC) ?: [];

            foreach ($rows as &$row) {
                $row['umsatzNetto']  = (float) ($row['umsatzNetto']  ?? 0);
                $row['umsatzBrutto'] = (float) ($row['umsatzBrutto'] ?? 0);
                $row['cnt']          = (int)   ($row['cnt']          ?? 0);
            }

            $this->getContainer()->get('log')->info(
                'CRechnung::umsatzGestelltByMonth result: ' . json_encode($rows)
            );

            return $rows;

        } catch (\Throwable $e) {
            $this->getContainer()->get('log')->error(
                'CRechnung::umsatzGestelltByMonth SQL error: ' . $e->getMessage()
            );

            return [
                'success' => false,
                'error'   => 'SQL error in umsatzGestelltByMonth',
            ];
        }
    }

    public function getActionUmsatzGestelltByYear($params, $data, $request)
    {
        $em  = $this->getEntityManager();
        $pdo = $em->getPDO();

        $sql = "
            SELECT
                YEAR(created_at)           AS year,
                SUM(betrag_netto)          AS umsatzNetto,
                SUM(betrag_brutto)         AS umsatzBrutto,
                COUNT(*)                   AS cnt
            FROM c_rechnung
            WHERE
                deleted = 0
                AND status <> 'storniert'
            GROUP BY YEAR(created_at)
            ORDER BY year ASC
        ";

        try {
            $sth = $pdo->prepare($sql);
            $sth->execute();

            $rows = $sth->fetchAll(\PDO::FETCH_ASSOC) ?: [];

            foreach ($rows as &$row) {
                $row['year']         = (int)   ($row['year']         ?? 0);
                $row['umsatzNetto']  = (float) ($row['umsatzNetto']  ?? 0);
                $row['umsatzBrutto'] = (float) ($row['umsatzBrutto'] ?? 0);
                $row['cnt']          = (int)   ($row['cnt']          ?? 0);
            }

            $this->getContainer()->get('log')->info(
                'CRechnung::umsatzGestelltByYear result: ' . json_encode($rows)
            );

            return $rows;

        } catch (\Throwable $e) {
            $this->getContainer()->get('log')->error(
                'CRechnung::umsatzGestelltByYear SQL error: ' . $e->getMessage()
            );

            return [
                'success' => false,
                'error'   => 'SQL error in umsatzGestelltByYear',
            ];
        }
    }
}
