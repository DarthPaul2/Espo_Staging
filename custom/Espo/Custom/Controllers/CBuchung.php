<?php

namespace Espo\Custom\Controllers;

class CBuchung extends \Espo\Core\Templates\Controllers\Base

{
    /**
     * GET /CBuchung/action/managementDashboard
     *
     * Что это:
     * Backend endpoint для нового Dashboard "Buchhaltung Cockpit".
     *
     * Зачем:
     * Возвращает journalbasierte Management-Kennzahlen из c_buchung,
     * чтобы frontend только рисовал Dashboard, а не рассчитывал бухгалтерскую логику.
     *
     * Параметры:
     * - year=2026              optional
     * - dateFrom=2026-01-01    optional
     * - dateTo=2026-12-31      optional
     *
     * Если dateFrom/dateTo не переданы, но передан year — берётся весь год.
     * Если ничего не передано — берётся текущий год.
     */
    public function getActionManagementDashboard($params, $data, $request)
    {
        $em = $this->getEntityManager();
        $pdo = $em->getPDO();

        $year = $request->getQueryParam('year');
        $dateFrom = $request->getQueryParam('dateFrom');
        $dateTo = $request->getQueryParam('dateTo');

        if (!$dateFrom && !$dateTo) {
            if (!$year) {
                $year = date('Y');
            }

            $dateFrom = $year . '-01-01';
            $dateTo = $year . '-12-31';
        }

        $whereDate = '';
        $sqlParams = [];

        if ($dateFrom) {
            $whereDate .= ' AND belegdatum >= :dateFrom';
            $sqlParams[':dateFrom'] = $dateFrom;
        }

        if ($dateTo) {
            $whereDate .= ' AND belegdatum <= :dateTo';
            $sqlParams[':dateTo'] = $dateTo;
        }

        $kpi = $this->loadKpi($pdo, $whereDate, $sqlParams);
        $monthly = $this->loadMonthly($pdo, $whereDate, $sqlParams);
        $konten = $this->loadKonten($pdo, $whereDate, $sqlParams);
        $checks = $this->loadChecks($pdo, $whereDate, $sqlParams);
        $topOpenForderungen = $this->loadTopOpenForderungen($pdo);

        return [
            'period' => [
                'year' => $year ? (int) $year : null,
                'dateFrom' => $dateFrom,
                'dateTo' => $dateTo,
            ],
            'kpi' => $kpi,
            'monthly' => $monthly,
            'konten' => $konten,
            'checks' => $checks,
            'topOpenForderungen' => $topOpenForderungen,
        ];
    }

    /**
     * Что это:
     * Загружает основные Management-Kennzahlen.
     *
     * Зачем:
     * Это основа верхних KPI-карточек Dashboard.
     */
    private function loadKpi(\PDO $pdo, string $whereDate, array $params): array
    {
        $sql = "
            SELECT
                ROUND(SUM(
                    CASE
                        WHEN konto_nummer = '4400' AND buchungsart = 'credit' THEN betrag
                        WHEN konto_nummer = '4400' AND buchungsart = 'debit' THEN -betrag
                        ELSE 0
                    END
                ), 2) AS umsatz_netto,

                ROUND(SUM(
                    CASE
                        WHEN konto_nummer = '6300' AND buchungsart = 'debit' THEN betrag
                        WHEN konto_nummer = '6300' AND buchungsart = 'credit' THEN -betrag
                        ELSE 0
                    END
                ), 2) AS aufwand_netto,

                ROUND(SUM(
                    CASE
                        WHEN konto_nummer = '1200' AND buchungsart = 'debit' THEN betrag
                        WHEN konto_nummer = '1200' AND buchungsart = 'credit' THEN -betrag
                        ELSE 0
                    END
                ), 2) AS offene_forderungen,

                ROUND(SUM(
                    CASE
                        WHEN konto_nummer = '3300' AND buchungsart = 'credit' THEN betrag
                        WHEN konto_nummer = '3300' AND buchungsart = 'debit' THEN -betrag
                        ELSE 0
                    END
                ), 2) AS offene_verbindlichkeiten,

                ROUND(SUM(
                    CASE
                        WHEN konto_nummer = '1800' AND buchungsart = 'debit' THEN betrag
                        WHEN konto_nummer = '1800' AND buchungsart = 'credit' THEN -betrag
                        ELSE 0
                    END
                ), 2) AS bank_saldo,

                ROUND(SUM(
                    CASE
                        WHEN konto_nummer = '3806' AND buchungsart = 'credit' THEN betrag
                        WHEN konto_nummer = '3806' AND buchungsart = 'debit' THEN -betrag
                        ELSE 0
                    END
                ), 2) AS umsatzsteuer,

                ROUND(SUM(
                    CASE
                        WHEN konto_nummer IN ('1401', '1406') AND buchungsart = 'debit' THEN betrag
                        WHEN konto_nummer IN ('1401', '1406') AND buchungsart = 'credit' THEN -betrag
                        ELSE 0
                    END
                ), 2) AS vorsteuer,

                ROUND(SUM(CASE WHEN konto_nummer = '1800' AND buchungsart = 'debit' THEN betrag ELSE 0 END), 2) AS zahlungseingaenge,

                ROUND(SUM(CASE WHEN konto_nummer = '1800' AND buchungsart = 'credit' THEN betrag ELSE 0 END), 2) AS zahlungsausgaenge
            FROM c_buchung
            WHERE deleted = 0
            {$whereDate}
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $row = $stmt->fetch(\PDO::FETCH_ASSOC) ?: [];

        $umsatzNetto = (float) ($row['umsatz_netto'] ?? 0);
        $aufwandNetto = (float) ($row['aufwand_netto'] ?? 0);
        $umsatzsteuer = (float) ($row['umsatzsteuer'] ?? 0);
        $vorsteuer = (float) ($row['vorsteuer'] ?? 0);
        $zahlungseingaenge = (float) ($row['zahlungseingaenge'] ?? 0);
        $zahlungsausgaenge = (float) ($row['zahlungsausgaenge'] ?? 0);

        return [
            'umsatzNetto' => $umsatzNetto,
            'aufwandNetto' => $aufwandNetto,
            'basisErgebnis' => round($umsatzNetto - $aufwandNetto, 2),

            'offeneForderungen' => (float) ($row['offene_forderungen'] ?? 0),
            'offeneVerbindlichkeiten' => (float) ($row['offene_verbindlichkeiten'] ?? 0),

            'bankSaldo' => (float) ($row['bank_saldo'] ?? 0),

            'umsatzsteuer' => $umsatzsteuer,
            'vorsteuer' => $vorsteuer,
            'steuerSaldo' => round($umsatzsteuer - $vorsteuer, 2),

            'zahlungseingaenge' => $zahlungseingaenge,
            'zahlungsausgaenge' => $zahlungsausgaenge,
            'liquiditaetsbewegung' => round($zahlungseingaenge - $zahlungsausgaenge, 2),
        ];
    }

    /**
     * Что это:
     * Monatliche Entwicklung für Charts.
     *
     * Зачем:
     * Liefert Daten für Umsatz/Aufwand/Ergebnis und Liquidität nach Monat.
     */
    private function loadMonthly(\PDO $pdo, string $whereDate, array $params): array
    {
        $sql = "
            SELECT
                DATE_FORMAT(belegdatum, '%Y-%m') AS month,

                ROUND(SUM(
                    CASE
                        WHEN konto_nummer = '4400' AND buchungsart = 'credit' THEN betrag
                        WHEN konto_nummer = '4400' AND buchungsart = 'debit' THEN -betrag
                        ELSE 0
                    END
                ), 2) AS umsatz_netto,

                ROUND(SUM(
                    CASE
                        WHEN konto_nummer = '6300' AND buchungsart = 'debit' THEN betrag
                        WHEN konto_nummer = '6300' AND buchungsart = 'credit' THEN -betrag
                        ELSE 0
                    END
                ), 2) AS aufwand_netto,

                ROUND(SUM(CASE WHEN konto_nummer = '1800' AND buchungsart = 'debit' THEN betrag ELSE 0 END), 2) AS zahlungseingaenge,

                ROUND(SUM(CASE WHEN konto_nummer = '1800' AND buchungsart = 'credit' THEN betrag ELSE 0 END), 2) AS zahlungsausgaenge
            FROM c_buchung
            WHERE deleted = 0
              AND belegdatum IS NOT NULL
            {$whereDate}
            GROUP BY DATE_FORMAT(belegdatum, '%Y-%m')
            ORDER BY month
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];

        return array_map(function ($row) {
            $umsatzNetto = (float) ($row['umsatz_netto'] ?? 0);
            $aufwandNetto = (float) ($row['aufwand_netto'] ?? 0);
            $zahlungseingaenge = (float) ($row['zahlungseingaenge'] ?? 0);
            $zahlungsausgaenge = (float) ($row['zahlungsausgaenge'] ?? 0);

            return [
                'month' => $row['month'],
                'umsatzNetto' => $umsatzNetto,
                'aufwandNetto' => $aufwandNetto,
                'basisErgebnis' => round($umsatzNetto - $aufwandNetto, 2),
                'zahlungseingaenge' => $zahlungseingaenge,
                'zahlungsausgaenge' => $zahlungsausgaenge,
                'liquiditaetsbewegung' => round($zahlungseingaenge - $zahlungsausgaenge, 2),
            ];
        }, $rows);
    }

    /**
     * Что это:
     * Kontenübersicht kompakt.
     *
     * Зачем:
     * Для Buchhaltung-Tab: показывает Soll/Haben/Saldo je Konto.
     */
    private function loadKonten(\PDO $pdo, string $whereDate, array $params): array
    {
        $sql = "
            SELECT
                konto_nummer,
                konto_bezeichnung,
                ROUND(SUM(CASE WHEN buchungsart = 'debit' THEN betrag ELSE 0 END), 2) AS soll,
                ROUND(SUM(CASE WHEN buchungsart = 'credit' THEN betrag ELSE 0 END), 2) AS haben,
                ROUND(SUM(
                    CASE
                        WHEN buchungsart = 'debit' THEN betrag
                        WHEN buchungsart = 'credit' THEN -betrag
                        ELSE 0
                    END
                ), 2) AS saldo,
                COUNT(*) AS anzahl_buchungen
            FROM c_buchung
            WHERE deleted = 0
            {$whereDate}
            GROUP BY konto_nummer, konto_bezeichnung
            ORDER BY konto_nummer
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];
    }

    /**
     * Что это:
     * Prüfindikatoren für Buchhaltung.
     *
     * Зачем:
     * Показывает, сходится ли Soll/Haben и совпадают ли OP-Werte с operativen Restbeträgen.
     */
    private function loadChecks(\PDO $pdo, string $whereDate, array $params): array
    {
        $journalSql = "
            SELECT
                ROUND(SUM(CASE WHEN buchungsart = 'debit' THEN betrag ELSE 0 END), 2) AS summe_soll,
                ROUND(SUM(CASE WHEN buchungsart = 'credit' THEN betrag ELSE 0 END), 2) AS summe_haben,
                COUNT(*) AS anzahl_buchungen
            FROM c_buchung
            WHERE deleted = 0
            {$whereDate}
        ";

        $stmt = $pdo->prepare($journalSql);
        $stmt->execute($params);
        $journal = $stmt->fetch(\PDO::FETCH_ASSOC) ?: [];

        $summeSoll = (float) ($journal['summe_soll'] ?? 0);
        $summeHaben = (float) ($journal['summe_haben'] ?? 0);
        $pruefsaldo = round($summeSoll - $summeHaben, 2);

        $opJournalSql = "
            SELECT
                ROUND(SUM(
                    CASE
                        WHEN konto_nummer = '1200' AND buchungsart = 'debit' THEN betrag
                        WHEN konto_nummer = '1200' AND buchungsart = 'credit' THEN -betrag
                        ELSE 0
                    END
                ), 2) AS journal_forderungen,

                ROUND(SUM(
                    CASE
                        WHEN konto_nummer = '3300' AND buchungsart = 'credit' THEN betrag
                        WHEN konto_nummer = '3300' AND buchungsart = 'debit' THEN -betrag
                        ELSE 0
                    END
                ), 2) AS journal_verbindlichkeiten
            FROM c_buchung
            WHERE deleted = 0
            {$whereDate}
        ";

        $stmt = $pdo->prepare($opJournalSql);
        $stmt->execute($params);
        $opJournal = $stmt->fetch(\PDO::FETCH_ASSOC) ?: [];

        $journalForderungen = (float) ($opJournal['journal_forderungen'] ?? 0);
        $journalVerbindlichkeiten = (float) ($opJournal['journal_verbindlichkeiten'] ?? 0);

        $operativeForderungen = $this->loadOperativeForderungen($pdo);
        $operativeVerbindlichkeiten = $this->loadOperativeVerbindlichkeiten($pdo);

        return [
            'pruefsaldo' => $pruefsaldo,
            'summeSoll' => $summeSoll,
            'summeHaben' => $summeHaben,
            'anzahlBuchungen' => (int) ($journal['anzahl_buchungen'] ?? 0),

            'opForderungenDifferenz' => round($journalForderungen - $operativeForderungen['summe'], 2),
            'opVerbindlichkeitenDifferenz' => round($journalVerbindlichkeiten - $operativeVerbindlichkeiten['summe'], 2),

            'operativeForderungen' => $operativeForderungen,
            'operativeVerbindlichkeiten' => $operativeVerbindlichkeiten,
        ];
    }

    /**
     * Что это:
     * Summe offener Forderungen aus CRechnung.
     *
     * Зачем:
     * Operative Gegenprüfung zu Konto 1200.
     */
    private function loadOperativeForderungen(\PDO $pdo): array
    {
        $sql = "
            SELECT
                ROUND(SUM(restbetrag_offen), 2) AS summe,
                COUNT(*) AS anzahl
            FROM c_rechnung
            WHERE deleted = 0
              AND buchhaltung_status = 'festgeschrieben'
              AND status <> 'storniert'
              AND IFNULL(ist_storniert, 0) = 0
              AND restbetrag_offen > 0
        ";

        $row = $pdo->query($sql)->fetch(\PDO::FETCH_ASSOC) ?: [];

        return [
            'summe' => (float) ($row['summe'] ?? 0),
            'anzahl' => (int) ($row['anzahl'] ?? 0),
        ];
    }

    /**
     * Что это:
     * Summe offener Verbindlichkeiten aus CEingangsrechnung.
     *
     * Зачем:
     * Operative Gegenprüfung zu Konto 3300.
     */
    private function loadOperativeVerbindlichkeiten(\PDO $pdo): array
    {
        $sql = "
            SELECT
                ROUND(SUM(restbetrag_offen), 2) AS summe,
                COUNT(*) AS anzahl
            FROM c_eingangsrechnung
            WHERE deleted = 0
              AND status = 'festgeschrieben'
              AND IFNULL(ist_storniert, 0) = 0
              AND restbetrag_offen > 0
        ";

        $row = $pdo->query($sql)->fetch(\PDO::FETCH_ASSOC) ?: [];

        return [
            'summe' => (float) ($row['summe'] ?? 0),
            'anzahl' => (int) ($row['anzahl'] ?? 0),
        ];
    }

    /**
     * Что это:
     * Top offene Forderungen.
     *
     * Зачем:
     * Для Chef-Dashboard: кто должен деньги и сколько.
     */
    private function loadTopOpenForderungen(\PDO $pdo): array
    {
        $sql = "
            SELECT
                r.id,
                r.rechnungsnummer,
                r.belegdatum,
                r.faellig_am,
                r.restbetrag_offen,
                r.account_id,
                a.name AS account_name,
                r.mahnstufe
            FROM c_rechnung r
            LEFT JOIN account a ON a.id = r.account_id AND a.deleted = 0
            WHERE r.deleted = 0
              AND r.buchhaltung_status = 'festgeschrieben'
              AND r.status <> 'storniert'
              AND IFNULL(r.ist_storniert, 0) = 0
              AND r.restbetrag_offen > 0
            ORDER BY r.restbetrag_offen DESC
            LIMIT 10
        ";

        $rows = $pdo->query($sql)->fetchAll(\PDO::FETCH_ASSOC) ?: [];

        return array_map(function ($row) {
            return [
                'id' => $row['id'],
                'rechnungsnummer' => $row['rechnungsnummer'],
                'belegdatum' => $row['belegdatum'],
                'faelligAm' => $row['faellig_am'],
                'restbetragOffen' => (float) ($row['restbetrag_offen'] ?? 0),
                'accountId' => $row['account_id'],
                'accountName' => $row['account_name'],
                'mahnstufe' => $row['mahnstufe'],
            ];
        }, $rows);
    }
}
