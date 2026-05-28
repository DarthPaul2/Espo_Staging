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
        $vorschauNaechsteWochen = $this->loadVorschauNaechsteWochen($pdo);

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
            'vorschauNaechsteWochen' => $vorschauNaechsteWochen,
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
                        WHEN konto_nummer IN ('4400', '4337', '4290') AND buchungsart = 'credit' THEN betrag
                        WHEN konto_nummer IN ('4400', '4337', '4290') AND buchungsart = 'debit' THEN -betrag
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

        // Что это:
        // Подготавливаем Werte für Liquidität und offene Posten.
        //
        // Зачем:
        // Phase 7A.5: Erwartete Liquidität soll als eigene Management-Kennzahl
        // aus Bankbestand + offenen Forderungen - offenen Verbindlichkeiten berechnet werden.

        $zahlungseingaenge = (float) ($row['zahlungseingaenge'] ?? 0);
        $zahlungsausgaenge = (float) ($row['zahlungsausgaenge'] ?? 0);

        $offeneForderungen = (float) ($row['offene_forderungen'] ?? 0);
        $offeneVerbindlichkeiten = (float) ($row['offene_verbindlichkeiten'] ?? 0);
        $bankSaldo = (float) ($row['bank_saldo'] ?? 0);

        $erwarteteLiquiditaet = round($bankSaldo + $offeneForderungen - $offeneVerbindlichkeiten, 2);

        return [
            'umsatzNetto' => $umsatzNetto,
            'aufwandNetto' => $aufwandNetto,
            'basisErgebnis' => round($umsatzNetto - $aufwandNetto, 2),

            // Что это:
            // Offene Posten und Bankbestand als Grundlage für erwartete Liquidität.
            //
            // Зачем:
            // Diese Werte werden im Cockpit getrennt angezeigt und zusätzlich
            // zur Management-Kennzahl "Erwartete Liquidität" zusammengeführt.

            'offeneForderungen' => $offeneForderungen,
            'offeneVerbindlichkeiten' => $offeneVerbindlichkeiten,

            'bankSaldo' => $bankSaldo,
            'erwarteteLiquiditaet' => $erwarteteLiquiditaet,

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
                        WHEN konto_nummer IN ('4400', '4337', '4290') AND buchungsart = 'credit' THEN betrag
                        WHEN konto_nummer IN ('4400', '4337', '4290') AND buchungsart = 'debit' THEN -betrag
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
     * Загружает Liquiditätsvorschau für die nächsten 7/14/30 Tage.
     *
     * Зачем:
     * Phase 7A.5: Geschäftsführung soll sehen, welche Zahlungseingänge
     * und Zahlungsausgänge aus offenen Belegen demnächst erwartet werden.
     *
     * Datenquellen:
     * - CRechnung.faellig_am + restbetrag_offen = erwartete Zahlungseingänge
     * - CEingangsrechnung.faellig_am + restbetrag_offen = erwartete Zahlungsausgänge
     */
    private function loadVorschauNaechsteWochen(\PDO $pdo): array
    {
        $perioden = [
            7,
            14,
            30,
        ];

        $result = [];

        foreach ($perioden as $tage) {
            $eingang = $this->loadErwarteteZahlungseingaenge($pdo, $tage);
            $ausgang = $this->loadErwarteteZahlungsausgaenge($pdo, $tage);

            $summeEingang = (float) ($eingang['summe'] ?? 0);
            $summeAusgang = (float) ($ausgang['summe'] ?? 0);

            $result[] = [
                'tage' => $tage,
                'label' => 'Nächste ' . $tage . ' Tage',
                'zahlungseingaenge' => round($summeEingang, 2),
                'zahlungsausgaenge' => round($summeAusgang, 2),
                'nettoAusblick' => round($summeEingang - $summeAusgang, 2),
                'anzahlEingaenge' => (int) ($eingang['anzahl'] ?? 0),
                'anzahlAusgaenge' => (int) ($ausgang['anzahl'] ?? 0),
            ];
        }

        return $result;
    }

    /**
     * Что это:
     * Erwartete Zahlungseingänge aus offenen Ausgangsrechnungen.
     *
     * Зачем:
     * Offene CRechnung mit Fälligkeit innerhalb der nächsten X Tage
     * bilden die erwarteten Kundenzahlungen.
     */
    private function loadErwarteteZahlungseingaenge(\PDO $pdo, int $tage): array
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
            AND faellig_am IS NOT NULL
            AND faellig_am >= CURDATE()
            AND faellig_am <= DATE_ADD(CURDATE(), INTERVAL :tage DAY)
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':tage' => $tage,
        ]);

        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: [
            'summe' => 0,
            'anzahl' => 0,
        ];
    }

    /**
     * Что это:
     * Erwartete Zahlungsausgänge aus offenen Eingangsrechnungen.
     *
     * Зачем:
     * Offene CEingangsrechnung mit Fälligkeit innerhalb der nächsten X Tage
     * bilden die erwarteten Lieferantenzahlungen.
     */
    private function loadErwarteteZahlungsausgaenge(\PDO $pdo, int $tage): array
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
            AND faellig_am IS NOT NULL
            AND faellig_am >= CURDATE()
            AND faellig_am <= DATE_ADD(CURDATE(), INTERVAL :tage DAY)
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':tage' => $tage,
        ]);

        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: [
            'summe' => 0,
            'anzahl' => 0,
        ];
    }


    /**
     * Что это:
     * Загружает kritische Forderungen вместо простой Top-Liste.
     *
     * Зачем:
     * Phase 7A.5: Geschäftsführung soll nicht просто самые большие offene Forderungen видеть,
     * а Forderungen, по которым нужно действовать.
     *
     * Sortierung:
     * 1. zuerst kritische Forderungen ab 5.000 €
     * 2. danach alle weiteren kritischen Forderungen
     * 3. innerhalb der Gruppen: Mahnstufe / Überfälligkeit / Betrag
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
                r.mahnstufe,

                CASE
                    WHEN r.faellig_am IS NOT NULL AND r.faellig_am < CURDATE()
                        THEN DATEDIFF(CURDATE(), r.faellig_am)
                    ELSE 0
                END AS tage_ueberfaellig,

                CASE
                    WHEN r.restbetrag_offen >= 5000 THEN 1
                    ELSE 0
                END AS ist_grosse_forderung,

                CASE
                    WHEN r.mahnstufe = 'inkasso' THEN 5
                    WHEN r.mahnstufe = 'mahnung3' THEN 4
                    WHEN r.mahnstufe = 'mahnung2' THEN 3
                    WHEN r.mahnstufe = 'mahnung1' THEN 2
                    WHEN r.mahnstufe = 'zahlungserinnerung' THEN 1
                    ELSE 0
                END AS mahn_prioritaet

            FROM c_rechnung r
            LEFT JOIN account a ON a.id = r.account_id AND a.deleted = 0

            WHERE r.deleted = 0
            AND r.buchhaltung_status = 'festgeschrieben'
            AND r.status <> 'storniert'
            AND IFNULL(r.ist_storniert, 0) = 0
            AND r.restbetrag_offen > 0

            AND (
                    r.restbetrag_offen >= 5000
                    OR r.mahnstufe IN ('mahnung2', 'mahnung3', 'inkasso')
                    OR (r.faellig_am IS NOT NULL AND r.faellig_am < CURDATE())
            )

            ORDER BY
                CASE
                    WHEN r.restbetrag_offen >= 5000 THEN 0
                    ELSE 1
                END ASC,

                r.restbetrag_offen DESC,

                mahn_prioritaet DESC,
                tage_ueberfaellig DESC,
                r.faellig_am ASC

            LIMIT 20
        ";

        $rows = $pdo->query($sql)->fetchAll(\PDO::FETCH_ASSOC) ?: [];

        return array_map(function ($row) {
            $restbetragOffen = (float) ($row['restbetrag_offen'] ?? 0);
            $tageUeberfaellig = (int) ($row['tage_ueberfaellig'] ?? 0);
            $mahnstufe = $row['mahnstufe'] ?? null;

            return [
                'id' => $row['id'],
                'rechnungsnummer' => $row['rechnungsnummer'],
                'belegdatum' => $row['belegdatum'],
                'faelligAm' => $row['faellig_am'],
                'restbetragOffen' => $restbetragOffen,
                'accountId' => $row['account_id'],
                'accountName' => $row['account_name'],
                'mahnstufe' => $mahnstufe,
                'tageUeberfaellig' => $tageUeberfaellig,
                'istGrosseForderung' => ((int) ($row['ist_grosse_forderung'] ?? 0)) === 1,
                'kritischGrund' => $this->buildKritischeForderungGrund(
                    $restbetragOffen,
                    $tageUeberfaellig,
                    $mahnstufe
                ),
            ];
        }, $rows);
    }

    /**
     * Что это:
     * Формирует понятное fachliches Label, почему Forderung kritisch ist.
     *
     * Зачем:
     * В Cockpit руководство должно видеть не только сумму,
     * но и причину, почему по Forderung нужно действовать.
     */
    private function buildKritischeForderungGrund(float $restbetragOffen, int $tageUeberfaellig, ?string $mahnstufe): string
    {
        $gruende = [];

        if ($restbetragOffen >= 5000) {
            $gruende[] = 'ab 5.000 €';
        }

        if ($mahnstufe === 'inkasso') {
            $gruende[] = 'Inkasso';
        } elseif ($mahnstufe === 'mahnung3') {
            $gruende[] = 'Mahnung 3';
        } elseif ($mahnstufe === 'mahnung2') {
            $gruende[] = 'Mahnung 2';
        }

        if ($tageUeberfaellig > 0) {
            $gruende[] = $tageUeberfaellig . ' Tage überfällig';
        }

        if (!$gruende) {
            return 'Prüfen';
        }

        return implode(' · ', $gruende);
    }

    /**
     * GET /CBuchung/action/kontenbewegungenReport
     *
     * Что это:
     * Backend-Quelle für den Bericht "Kontenbewegungen" Ausgangsrechnungen.
     *
     * Зачем:
     * Der alte Frontend-Report lädt über collection.fetch() faktisch nur einen begrenzten Teil
     * der Buchungen. Dadurch können Summe Soll/Haben und Differenz falsch aussehen.
     * Dieser Action lädt die Daten direkt per SQL ohne 200-Zeilen-Frontend-Limit.
     *
     * Query-Parameter:
     * - dateFrom=YYYY-MM-DD optional
     * - dateTo=YYYY-MM-DD optional
     */
    public function getActionKontenbewegungenReport($params, $data, $request)
    {
        $this->getAcl()->check('CBuchung', 'read');

        $em = $this->getEntityManager();
        $pdo = $em->getPDO();

        $dateFrom = $request->getQueryParam('dateFrom');
        $dateTo = $request->getQueryParam('dateTo');

        $whereDate = '';
        $sqlParams = [];

        if ($dateFrom) {
            $whereDate .= ' AND b.belegdatum >= :dateFrom';
            $sqlParams[':dateFrom'] = $dateFrom;
        }

        if ($dateTo) {
            $whereDate .= ' AND b.belegdatum <= :dateTo';
            $sqlParams[':dateTo'] = $dateTo;
        }

        $sql = "
            SELECT
                b.id,
                b.buchungstext,
                b.betrag,
                b.konto_nummer AS kontoNummer,
                b.konto_bezeichnung AS kontoBezeichnung,
                b.buchungsart,
                b.belegdatum,
                b.quelle_id_extern AS quelleIdExtern,
                b.quelle_nummer AS quelleNummer,
                b.steuer_fall AS steuerFall,
                b.phase1_verwendet AS phase1Verwendet,
                b.buchungsjournal_id AS buchungsjournalId,
                j.name AS buchungsjournalName
            FROM c_buchung b
            LEFT JOIN c_buchungsjournal j
                ON j.id = b.buchungsjournal_id
            AND j.deleted = 0
            WHERE b.deleted = 0
            AND b.quelle_typ = 'ausgangsrechnung'
            AND IFNULL(b.phase1_verwendet, 0) = 1
            {$whereDate}
            ORDER BY
                b.belegdatum DESC,
                b.quelle_nummer DESC,
                b.konto_nummer ASC,
                b.buchungsart ASC
        ";

        try {
            $stmt = $pdo->prepare($sql);
            $stmt->execute($sqlParams);

            $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];

            foreach ($rows as &$row) {
                $row['betrag'] = (float) ($row['betrag'] ?? 0);
                $row['phase1Verwendet'] = ((int) ($row['phase1Verwendet'] ?? 0)) === 1;
            }

            return [
                'success' => true,
                'total' => count($rows),
                'list' => $rows,
            ];
        } catch (\Throwable $e) {
            $this->getContainer()->get('log')->error(
                'CBuchung::getActionKontenbewegungenReport SQL error: ' . $e->getMessage()
            );

            return [
                'success' => false,
                'message' => 'Kontenbewegungen konnten nicht geladen werden.',
                'list' => [],
                'total' => 0,
            ];
        }
    }
}
