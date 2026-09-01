<?php

namespace Espo\Custom\Controllers;

use Espo\Core\Templates\Controllers\Base;

class CEingangsrechnung extends Base
{
    use \Espo\Custom\Traits\HasEntityManagerCompat;

    /**
     * Это action для fachlicher Freigabe входящего счета.
     * Он проверяет документ и переводит его в статус "freigabe".
     */
    public function postActionFreigeben($params, $data, $request)
    {
        $this->acl->check('CEingangsrechnung', 'edit');

        $id = $params['id'] ?? null;

        if (!$id && isset($data->id)) {
            $id = $data->id;
        }

        if (!$id) {
            return [
                'success' => false,
                'message' => 'Eingangsrechnung-ID fehlt.'
            ];
        }

        $em = $this->getEntityManager();
        $eingangsrechnung = $em->getEntity('CEingangsrechnung', $id);

        if (!$eingangsrechnung) {
            return [
                'success' => false,
                'message' => 'Eingangsrechnung wurde nicht gefunden.'
            ];
        }

        try {
            $status = strtolower((string) ($eingangsrechnung->get('status') ?? 'entwurf'));

            if ($status === 'festgeschrieben') {
                return [
                    'success' => false,
                    'message' => 'Die Eingangsrechnung ist bereits festgeschrieben.'
                ];
            }

            // Schutzregel Phase 2A: buchungsWirkung prüfen.
            // Leeres Feld → 'normal_buchen' (Abwärtskompatibilität für bestehende Eingangsrechnungen).
            $buchungsWirkung = (string) ($eingangsrechnung->get('buchungsWirkung') ?: 'normal_buchen');
            if (in_array($buchungsWirkung, ['manuell_pruefen'], true)) {
                return [
                    'success' => false,
                    'message' => 'Für diesen Belegtyp ist die Buchungswirkung noch nicht für Freigabe/Festschreibung freigegeben. Bitte fachlich prüfen.'
                ];
            }

            if (!$eingangsrechnung->get('lieferantId')) {
                return [
                    'success' => false,
                    'message' => 'Lieferant fehlt.'
                ];
            }

            if (!trim((string) ($eingangsrechnung->get('eingangsrechnungsnummer') ?? ''))) {
                return [
                    'success' => false,
                    'message' => 'Eingangsrechnungsnummer fehlt.'
                ];
            }

            if (!$eingangsrechnung->get('belegdatum')) {
                return [
                    'success' => false,
                    'message' => 'Belegdatum fehlt.'
                ];
            }

            if (!$eingangsrechnung->get('eingangsdatum')) {
                return [
                    'success' => false,
                    'message' => 'Eingangsdatum fehlt.'
                ];
            }

            // faelligAm ist für Gegenbuchungen (Gutschrift/Stornorechnung) nicht erforderlich.
            if (!$eingangsrechnung->get('faelligAm') && $buchungsWirkung !== 'gegenbuchung') {
                return [
                    'success' => false,
                    'message' => 'Fälligkeitsdatum fehlt.'
                ];
            }

            $steuerfall = (string) ($eingangsrechnung->get('steuerfall') ?? '');
            if (!in_array($steuerfall, ['ust19', 'ust7', 'steuerfrei'], true)) {
                return [
                    'success' => false,
                    'message' => 'Steuerfall ist ungültig.'
                ];
            }

            $betragNetto = round((float) ($eingangsrechnung->get('betragNetto') ?? 0), 2);
            $steuerBetrag = round((float) ($eingangsrechnung->get('steuerBetrag') ?? 0), 2);
            $betragBrutto = round((float) ($eingangsrechnung->get('betragBrutto') ?? 0), 2);

            if ($betragNetto <= 0 || $betragBrutto <= 0) {
                return [
                    'success' => false,
                    'message' => 'Netto- und Bruttobetrag müssen größer als 0 sein.'
                ];
            }

            if ($steuerfall === 'steuerfrei' && round($steuerBetrag, 2) !== 0.0) {
                return [
                    'success' => false,
                    'message' => 'Bei steuerfrei muss der Steuerbetrag 0 sein.'
                ];
            }

            $positionCollection = $em
                ->getRDBRepository('CEingangsrechnungsposition')
                ->where([
                    'eingangsrechnungId' => $id,
                    'deleted' => false,
                ])
                ->find();

            if (!$positionCollection || !count($positionCollection)) {
                return [
                    'success' => false,
                    'message' => 'Die Eingangsrechnung enthält keine Positionen.'
                ];
            }

            foreach ($positionCollection as $position) {
                $name = trim((string) ($position->get('name') ?? ''));

                if ($name === '') {
                    return [
                        'success' => false,
                        'message' => 'Mindestens eine Position hat keinen Namen.'
                    ];
                }

                $menge = (float) ($position->get('menge') ?? 0);
                $einzelpreisNetto = (float) ($position->get('einzelpreisNetto') ?? 0);

                // Что это: читает Rabatt из позиции Eingangsrechnung.
                // Зачем: Freigabe должна проверять сумму позиции с учётом скидки.
                $rabattProzent = round((float) ($position->get('rabattProzent') ?? 0), 2);
                $rabattBetrag = round((float) ($position->get('rabattBetrag') ?? 0), 2);

                if ($menge <= 0) {
                    return [
                        'success' => false,
                        'message' => 'Mindestens eine Position hat eine ungültige Menge.'
                    ];
                }

                // Einzelpreis darf negativ sein (Rabatt-/Guthabenzeilen wie bei Telekom-Rechnungen).
                $basisNetto = round($menge * $einzelpreisNetto, 2);

                if ($rabattProzent > 0) {
                    $recalculatedGesamtNetto = round($basisNetto * (1 - ($rabattProzent / 100)), 2);
                } elseif ($rabattBetrag > 0) {
                    $recalculatedGesamtNetto = round($basisNetto - $rabattBetrag, 2);
                } else {
                    $recalculatedGesamtNetto = $basisNetto;
                }
                // Einzelne Position darf negativ sein — der Gesamtbetrag des Belegs wird auf Ebene des Dokuments geprüft.
            }

            $eingangsrechnung->set('status', 'freigabe');
            $eingangsrechnung->set('freigabeAm', date('Y-m-d H:i:s'));

            $em->saveEntity($eingangsrechnung, [
                'allowFestgeschriebenSave' => true
            ]);

            return [
                'success' => true,
                'message' => 'Eingangsrechnung wurde fachlich freigegeben.',
                'id' => $eingangsrechnung->getId(),
                'status' => $eingangsrechnung->get('status'),
                'freigabeAm' => $eingangsrechnung->get('freigabeAm'),
            ];
        } catch (\Throwable $e) {
            $GLOBALS['log']->error(
                'CEingangsrechnung::postActionFreigeben error: ' . $e->getMessage()
            );

            return [
                'success' => false,
                'message' => 'Freigabe konnte nicht abgeschlossen werden.'
            ];
        }
    }

    /**
     * Это action для обратного перехода: freigabe -> entwurf.
     */
    public function postActionZurueckZuEntwurf($params, $data, $request)
    {
        $this->acl->check('CEingangsrechnung', 'edit');

        $id = $params['id'] ?? null;
        if (!$id && isset($data->id)) {
            $id = $data->id;
        }

        if (!$id) {
            return [
                'success' => false,
                'message' => 'Eingangsrechnung-ID fehlt.'
            ];
        }

        $em = $this->getEntityManager();
        $eingangsrechnung = $em->getEntity('CEingangsrechnung', $id);

        if (!$eingangsrechnung) {
            return [
                'success' => false,
                'message' => 'Eingangsrechnung wurde nicht gefunden.'
            ];
        }

        try {
            $status = strtolower((string) ($eingangsrechnung->get('status') ?? 'entwurf'));

            if ($status === 'entwurf') {
                return [
                    'success' => true,
                    'message' => 'Die Eingangsrechnung befindet sich bereits im Status Entwurf.'
                ];
            }

            if ($status === 'festgeschrieben') {
                return [
                    'success' => false,
                    'message' => 'Festgeschriebene Eingangsrechnungen können nicht mehr in den Entwurf zurückgesetzt werden.'
                ];
            }

            if ($status !== 'freigabe') {
                return [
                    'success' => false,
                    'message' => 'Nur freigegebene Eingangsrechnungen können zurück in den Entwurf gesetzt werden.'
                ];
            }

            $eingangsrechnung->set('status', 'entwurf');
            $eingangsrechnung->set('freigabeAm', null);

            $em->saveEntity($eingangsrechnung, [
                'allowFestgeschriebenSave' => true
            ]);

            return [
                'success' => true,
                'message' => 'Eingangsrechnung wurde zurück in den Entwurf gesetzt.',
                'id' => $eingangsrechnung->getId(),
                'status' => $eingangsrechnung->get('status'),
            ];
        } catch (\Throwable $e) {
            $GLOBALS['log']->error(
                'CEingangsrechnung::postActionZurueckZuEntwurf error: ' . $e->getMessage()
            );

            return [
                'success' => false,
                'message' => 'Der Status konnte nicht auf Entwurf zurückgesetzt werden.'
            ];
        }
    }

    /**
     * Это главный бухгалтерический action Phase 2:
     * freigabe -> festgeschrieben + Journal + Buchungen.
     */
    public function postActionFestschreiben($params, $data, $request)
    {
        $this->acl->check('CEingangsrechnung', 'edit');

        $id = $params['id'] ?? null;
        if (!$id && isset($data->id)) {
            $id = $data->id;
        }

        if (!$id) {
            return [
                'success' => false,
                'message' => 'Eingangsrechnung-ID fehlt.'
            ];
        }

        $em = $this->getEntityManager();
        $pdo = $em->getPDO();

        $eingangsrechnung = $em->getEntity('CEingangsrechnung', $id);

        if (!$eingangsrechnung) {
            return [
                'success' => false,
                'message' => 'Eingangsrechnung wurde nicht gefunden.'
            ];
        }

        try {
            // Что это: базовая проверка статуса и Pflichtfelder.
            $status = strtolower((string) ($eingangsrechnung->get('status') ?? 'entwurf'));

            if ($status !== 'freigabe') {
                return [
                    'success' => false,
                    'message' => 'Die Eingangsrechnung muss zuerst freigegeben werden.'
                ];
            }

            // Schutzregel Phase 2A: buchungsWirkung prüfen (zweite Sicherheit vor Festschreibung).
            // Leeres Feld → 'normal_buchen' (Abwärtskompatibilität für bestehende Eingangsrechnungen).
            $buchungsWirkung = (string) ($eingangsrechnung->get('buchungsWirkung') ?: 'normal_buchen');
            if (in_array($buchungsWirkung, ['manuell_pruefen'], true)) {
                return [
                    'success' => false,
                    'message' => 'Für diesen Belegtyp ist die Buchungswirkung noch nicht für Freigabe/Festschreibung freigegeben. Bitte fachlich prüfen.'
                ];
            }

            if (!$eingangsrechnung->get('lieferantId')) {
                return [
                    'success' => false,
                    'message' => 'Lieferant fehlt.'
                ];
            }

            if (!trim((string) ($eingangsrechnung->get('eingangsrechnungsnummer') ?? ''))) {
                return [
                    'success' => false,
                    'message' => 'Eingangsrechnungsnummer fehlt.'
                ];
            }

            if (!$eingangsrechnung->get('belegdatum')) {
                return [
                    'success' => false,
                    'message' => 'Belegdatum fehlt.'
                ];
            }

            if (!$eingangsrechnung->get('eingangsdatum')) {
                return [
                    'success' => false,
                    'message' => 'Eingangsdatum fehlt.'
                ];
            }

            // faelligAm ist für Gegenbuchungen (Gutschrift/Stornorechnung) nicht erforderlich.
            if (!$eingangsrechnung->get('faelligAm') && $buchungsWirkung !== 'gegenbuchung') {
                return [
                    'success' => false,
                    'message' => 'Fälligkeitsdatum fehlt.'
                ];
            }

            // Что это: пересчитываем итоговые суммы по позициям прямо перед Festschreibung.
            $positionCollection = $em
                ->getRDBRepository('CEingangsrechnungsposition')
                ->where([
                    'eingangsrechnungId' => $id,
                    'deleted' => false,
                ])
                ->find();

            if (!$positionCollection || !count($positionCollection)) {
                return [
                    'success' => false,
                    'message' => 'Die Eingangsrechnung enthält keine Positionen.'
                ];
            }

            $betragNetto = 0.0;

            foreach ($positionCollection as $position) {
                $name = trim((string) ($position->get('name') ?? ''));
                $menge = (float) ($position->get('menge') ?? 0);
                $einzelpreisNetto = (float) ($position->get('einzelpreisNetto') ?? 0);

                // Что это: читает Rabatt из позиции Eingangsrechnung.
                // Зачем: Festschreibung должна создавать Journal/Buchungen с правильной суммой после скидки.
                $rabattProzent = round((float) ($position->get('rabattProzent') ?? 0), 2);
                $rabattBetrag = round((float) ($position->get('rabattBetrag') ?? 0), 2);

                if ($name === '') {
                    return [
                        'success' => false,
                        'message' => 'Mindestens eine Position hat keinen Namen.'
                    ];
                }

                if ($menge <= 0) {
                    return [
                        'success' => false,
                        'message' => 'Mindestens eine Position hat eine ungültige Menge.'
                    ];
                }

                // Einzelpreis darf negativ sein (Rabatt-/Guthabenzeilen wie bei Telekom-Rechnungen).
                $basisNetto = round($menge * $einzelpreisNetto, 2);

                if ($rabattProzent > 0) {
                    $recalculatedGesamtNetto = round($basisNetto * (1 - ($rabattProzent / 100)), 2);
                } elseif ($rabattBetrag > 0) {
                    $recalculatedGesamtNetto = round($basisNetto - $rabattBetrag, 2);
                } else {
                    $recalculatedGesamtNetto = $basisNetto;
                }
                // Einzelne Position darf negativ sein — Gesamtbetrag wird auf Dokumentebene geprüft.

                // Что это: für Festschreibung берём neu berechneten Netto-Gesamtbetrag inkl. Rabatt.
                // Зачем: Journal, Steuer und Verbindlichkeit müssen Rabatt korrekt berücksichtigen.
                $gesamtNetto = $recalculatedGesamtNetto;

                $betragNetto += $gesamtNetto;
            }

            $betragNetto = round($betragNetto, 2);

            $steuerfall = (string) ($eingangsrechnung->get('steuerfall') ?? '');
            $steuerBetrag = 0.0;

            if ($steuerfall === 'ust19') {
                $steuerBetrag = round($betragNetto * 0.19, 2);
            } elseif ($steuerfall === 'ust7') {
                $steuerBetrag = round($betragNetto * 0.07, 2);
            } elseif ($steuerfall === 'steuerfrei') {
                $steuerBetrag = 0.0;
            } else {
                return [
                    'success' => false,
                    'message' => 'Steuerfall ist ungültig.'
                ];
            }

            $betragBrutto = round($betragNetto + $steuerBetrag, 2);

            // Что это: Rundungsdifferenz-Korrektur (Schutznetz, analog zur Import-Seite in
            // _korrigiere_rundungsdifferenz, app/mail_rechnung.py). Real beobachtet (ELTEN GmbH,
            // 27.08.2026): wenn ein Lieferant Netto/Steuer/Brutto jeweils unabhängig rundet, kann
            // die aus den Positionen neu berechnete Summe um 1-2 Cent vom tatsächlich gedruckten
            // Rechnungsbetrag abweichen. Bei kleiner Abweichung (<= 2 Cent) wird NICHT die eigene
            // Neuberechnung verwendet, sondern der ursprünglich erkannte/bestätigte Betrag aus dem
            // Quell-Import wiederhergestellt — nur wenn ein verknüpfter Import überhaupt existiert.
            $quellImportList = $em
                ->getRDBRepository('CEingangsrechnungImport')
                ->where([
                    'eingangsrechnungId' => $id,
                    'deleted' => false,
                ])
                ->find();

            if ($quellImportList && count($quellImportList)) {
                $quellImport = $quellImportList[0];
                $importBrutto = $quellImport->get('betragBrutto');
                $diff = $importBrutto !== null ? abs($betragBrutto - (float) $importBrutto) : null;

                if ($diff !== null && $diff > 0 && $diff <= 0.02) {
                    $betragNetto = (float) $quellImport->get('betragNetto');
                    $steuerBetrag = (float) $quellImport->get('steuerBetrag');
                    $betragBrutto = (float) $importBrutto;
                }
            }

            if ($betragNetto <= 0 || $betragBrutto <= 0) {
                return [
                    'success' => false,
                    'message' => 'Netto- und Bruttobetrag müssen größer als 0 sein.'
                ];
            }

            // Что это: Mapping von CEingangsrechnung.steuerfall -> CBuchungsregel.steuerFall.
            $regelSteuerFall = null;

            if ($steuerfall === 'ust19') {
                $regelSteuerFall = 'normal';
            } elseif ($steuerfall === 'ust7') {
                $regelSteuerFall = 'ermaessigt';
            } elseif ($steuerfall === 'steuerfrei') {
                $regelSteuerFall = 'steuerfrei';
            }

            // Что это: ищем подходящую Buchungsregel для Eingangsrechnung.
            $regelList = $em
                ->getRDBRepository('CBuchungsregel')
                ->where([
                    'aktiv' => true,
                    'quelleTyp' => 'CEingangsrechnung',
                    'dokumentTyp' => 'eingangsrechnung',
                    'steuerFall' => $regelSteuerFall,
                    'deleted' => false,
                ])
                ->find();

            if (!$regelList || !count($regelList)) {
                return [
                    'success' => false,
                    'message' => 'Keine passende Buchungsregel für diese Eingangsrechnung gefunden.'
                ];
            }

            if (count($regelList) > 1) {
                return [
                    'success' => false,
                    'message' => 'Mehrere passende Buchungsregeln für diese Eingangsrechnung gefunden.'
                ];
            }

            $regel = $regelList[0];

            $aufwandKontoId = $regel->get('aufwandKontoRegelnId');
            $vorsteuerKontoId = $regel->get('vorsteuerKontoRegelnId');
            $verbindlichkeitKontoId = $regel->get('verbindlichkeitKontoRegelnId');

            $aufwandKonto = $aufwandKontoId ? $em->getEntity('CKonto', $aufwandKontoId) : null;
            $vorsteuerKonto = $vorsteuerKontoId ? $em->getEntity('CKonto', $vorsteuerKontoId) : null;
            $verbindlichkeitKonto = $verbindlichkeitKontoId ? $em->getEntity('CKonto', $verbindlichkeitKontoId) : null;

            if (!$aufwandKonto || !$verbindlichkeitKonto) {
                return [
                    'success' => false,
                    'message' => 'Die Buchungsregel ist unvollständig.'
                ];
            }

            if ($regelSteuerFall !== 'steuerfrei' && !$vorsteuerKonto) {
                return [
                    'success' => false,
                    'message' => 'Die Buchungsregel ist unvollständig.'
                ];
            }

            // Что это: подготавливаем Buchungszeilen vor DB-Transaktion.
            $buchungenData = [];
            $ereNummer = (string) $eingangsrechnung->get('eingangsrechnungsnummer');

            if ($buchungsWirkung === 'gegenbuchung') {
                // Gegenbuchung (Gutschrift / Stornorechnung): umgekehrte Richtungen.
                // SOLL Verbindlichkeit, HABEN Vorsteuer, HABEN Aufwand.

                // Verbindlichkeit (Debit) — Schuld wird verringert
                $buchungenData[] = [
                    'buchungsart' => 'debit',
                    'betrag' => $betragBrutto,
                    'kontoEntity' => $verbindlichkeitKonto,
                    'buchungstext' => 'Verbindlichkeit aus Gegenbuchung ' . $ereNummer,
                    'steuerFall' => $regelSteuerFall,
                ];

                // Vorsteuer (Credit) — Vorsteueranspruch wird verringert
                if ($regelSteuerFall !== 'steuerfrei') {
                    $buchungenData[] = [
                        'buchungsart' => 'credit',
                        'betrag' => $steuerBetrag,
                        'kontoEntity' => $vorsteuerKonto,
                        'buchungstext' => 'Vorsteuer aus Gegenbuchung ' . $ereNummer,
                        'steuerFall' => $regelSteuerFall,
                    ];
                }

                // Aufwand (Credit) — Aufwand wird verringert
                $buchungenData[] = [
                    'buchungsart' => 'credit',
                    'betrag' => $betragNetto,
                    'kontoEntity' => $aufwandKonto,
                    'buchungstext' => 'Aufwand aus Gegenbuchung ' . $ereNummer,
                    'steuerFall' => $regelSteuerFall,
                ];
            } else {
                // normal_buchen: Standard-Eingangsrechnung.
                // SOLL Aufwand, SOLL Vorsteuer, HABEN Verbindlichkeit.

                // Aufwand (Debit)
                $buchungenData[] = [
                    'buchungsart' => 'debit',
                    'betrag' => $betragNetto,
                    'kontoEntity' => $aufwandKonto,
                    'buchungstext' => 'Aufwand aus Eingangsrechnung ' . $ereNummer,
                    'steuerFall' => $regelSteuerFall,
                ];

                // Vorsteuer (Debit) — только если не steuerfrei
                if ($regelSteuerFall !== 'steuerfrei') {
                    $buchungenData[] = [
                        'buchungsart' => 'debit',
                        'betrag' => $steuerBetrag,
                        'kontoEntity' => $vorsteuerKonto,
                        'buchungstext' => 'Vorsteuer aus Eingangsrechnung ' . $ereNummer,
                        'steuerFall' => $regelSteuerFall,
                    ];
                }

                // Verbindlichkeit (Credit)
                $buchungenData[] = [
                    'buchungsart' => 'credit',
                    'betrag' => $betragBrutto,
                    'kontoEntity' => $verbindlichkeitKonto,
                    'buchungstext' => 'Verbindlichkeit aus Eingangsrechnung ' . $ereNummer,
                    'steuerFall' => $regelSteuerFall,
                ];
            }

            // Что это: проверяем баланс до записи в БД.
            $sumDebit = 0.0;
            $sumCredit = 0.0;

            foreach ($buchungenData as $row) {
                if (($row['buchungsart'] ?? '') === 'debit') {
                    $sumDebit += (float) $row['betrag'];
                } else {
                    $sumCredit += (float) $row['betrag'];
                }
            }

            $sumDebit = round($sumDebit, 2);
            $sumCredit = round($sumCredit, 2);

            if ($sumDebit !== $sumCredit) {
                return [
                    'success' => false,
                    'message' => 'Die Buchung ist nicht ausgeglichen.'
                ];
            }

            // Journalnummer und Buchungstext je nach buchungsWirkung.
            $journalPrefix = ($buchungsWirkung === 'gegenbuchung') ? 'EGS-' : 'EJR-';
            $journalNummer = $journalPrefix . date('Ymd-His') . '-' . substr($eingangsrechnung->getId(), -6);
            $journalText = ($buchungsWirkung === 'gegenbuchung')
                ? 'Gegenbuchung ' . $ereNummer
                : 'Festschreibung Eingangsrechnung ' . $ereNummer;

            if (!$pdo->inTransaction()) {
                $pdo->beginTransaction();
            }

            // Что это: создаём Buchungsjournal.
            $journal = $em->getNewEntity('CBuchungsjournal');

            $journal->set('name', $journalNummer);
            $journal->set('journalNummer', $journalNummer);
            $journal->set('belegdatum', $eingangsrechnung->get('belegdatum'));
            $journal->set('buchungstext', $journalText);
            $journal->set('quelleTyp', 'CEingangsrechnung');
            $journal->set('quelleIdExtern', $eingangsrechnung->getId());
            $journal->set('quelleNummer', $eingangsrechnung->get('eingangsrechnungsnummer'));
            $journal->set('buchhaltungStatus', 'festgeschrieben');
            $journal->set('phase1Verwendet', false);

            $em->saveEntity($journal);

            if (!$journal->getId()) {
                throw new \RuntimeException('Buchungsjournal konnte nicht erstellt werden.');
            }

            // Что это: создаём Buchungen.
            $createdCount = 0;

            foreach ($buchungenData as $row) {
                $kontoEntity = $row['kontoEntity'];

                $kontoNummer = '';
                $kontoBezeichnung = '';

                if ($kontoEntity) {
                    $kontoNummer = (string) ($kontoEntity->get('kontonummer') ?? '');
                    $kontoBezeichnung = (string) ($kontoEntity->get('bezeichnung') ?? '');
                }

                $buchung = $em->getNewEntity('CBuchung');

                $buchung->set('name', ($row['buchungsart'] === 'debit' ? 'Soll ' : 'Haben ') . $kontoNummer);
                $buchung->set('buchungsart', $row['buchungsart']);
                $buchung->set('betrag', round((float) $row['betrag'], 2));
                $buchung->set('kontoNummer', $kontoNummer);
                $buchung->set('kontoBezeichnung', $kontoBezeichnung);
                $buchung->set('buchungstext', $row['buchungstext']);
                $buchung->set('belegdatum', $eingangsrechnung->get('belegdatum'));
                $buchung->set('quelleTyp', 'CEingangsrechnung');
                $buchung->set('quelleIdExtern', $eingangsrechnung->getId());
                $buchung->set('quelleNummer', $eingangsrechnung->get('eingangsrechnungsnummer'));
                $buchung->set('steuerFall', $row['steuerFall']);
                $buchung->set('phase1Verwendet', false);

                $buchung->set('buchungsjournalId', $journal->getId());
                $buchung->set('buchungsjournalName', $journal->get('journalNummer'));

                $buchung->set('buchungsregelId', $regel->getId());
                $buchung->set('buchungsregelName', $regel->get('name'));

                $em->saveEntity($buchung);
                $createdCount++;
            }

            if ($createdCount !== count($buchungenData)) {
                throw new \RuntimeException('Buchungszeilen konnten nicht vollständig erstellt werden.');
            }

            // Что это: финально фиксируем сам документ.
            $user = $this->user;

            $eingangsrechnung->set('betragNetto', $betragNetto);
            $eingangsrechnung->set('steuerBetrag', $steuerBetrag);
            $eingangsrechnung->set('betragBrutto', $betragBrutto);

            if ($buchungsWirkung === 'gegenbuchung') {
                // Gegenbuchung: Auto-Verrechnung mit Originalbeleg wenn eindeutig und sicher möglich.
                $bezugsNr      = trim((string) ($eingangsrechnung->get('bezugsRechnungsnummer') ?? ''));
                $lieferantId   = $eingangsrechnung->get('lieferantId');
                $verrechnungOk = false;

                if ($bezugsNr !== '' && $lieferantId) {
                    $originalList = $em
                        ->getRDBRepository('CEingangsrechnung')
                        ->where([
                            'lieferantenRechnungsnummer' => $bezugsNr,
                            'lieferantId'               => $lieferantId,
                            'status'                    => 'festgeschrieben',
                            'deleted'                   => false,
                            'id!='                      => $eingangsrechnung->getId(),
                        ])
                        ->find();

                    if ($originalList && count($originalList) === 1) {
                        $original         = $originalList[0];
                        $originalRest     = round((float) ($original->get('restbetragOffen') ?? 0), 2);
                        $gutschriftBrutto = round($betragBrutto, 2);

                        if ($gutschriftBrutto > 0 && $gutschriftBrutto <= $originalRest) {
                            $neuerRest    = round($originalRest - $gutschriftBrutto, 2);
                            $ausgleichTyp = ($neuerRest <= 0) ? 'voll' : 'teil';
                            $gutschriftNr = (string) ($eingangsrechnung->get('eingangsrechnungsnummer') ?? '');
                            $originalNr   = (string) ($original->get('eingangsrechnungsnummer') ?? '');
                            $ausgleichsnr = 'AGS-GS-' . date('Ymd-His') . '-' . substr($eingangsrechnung->getId(), -4);

                            // CAusgleich anlegen — ohne CZahlung, ohne Bankbewegung.
                            $ausgleich = $em->getNewEntity('CAusgleich');
                            $ausgleich->set('name',             'Verrechnung ' . $gutschriftNr . ' → ' . $originalNr);
                            $ausgleich->set('ausgleichsnummer', $ausgleichsnr);
                            $ausgleich->set('typ',              'gutschrift_verrechnung');
                            $ausgleich->set('ausgleichTyp',     $ausgleichTyp);
                            $ausgleich->set('richtung',         'verbindlichkeitsausgleich');
                            $ausgleich->set('ausgleichsdatum',  date('Y-m-d'));
                            $ausgleich->set('betrag',           $gutschriftBrutto);
                            $ausgleich->set('restbetragNachAusgleich', max(0.0, $neuerRest));
                            $ausgleich->set('ausgleichStatus',  'aktiv');
                            $ausgleich->set('istAktiv',         true);
                            // Link Originalbeleg (n:1 → CEingangsrechnung)
                            $ausgleich->set('eingangsrechnungId',   $original->getId());
                            $ausgleich->set('eingangsrechnungName', $originalNr);
                            // Link Gutschrift (n:1 → CEingangsrechnung, Spalte: gegenbeleg_ausgleiche_id)
                            $ausgleich->set('gegenbelegAusgleicheId',   $eingangsrechnung->getId());
                            $ausgleich->set('gegenbelegAusgleicheName', $gutschriftNr);
                            $ausgleich->set('bemerkung',
                                'Automatische Gutschrift-Verrechnung am ' . date('Y-m-d H:i:s') . '. ' .
                                'Gutschrift: ' . $gutschriftNr . '. Originalbeleg: ' . $originalNr . '. ' .
                                'Betrag: ' . number_format($gutschriftBrutto, 2, ',', '.') . ' EUR.'
                            );
                            $em->saveEntity($ausgleich);

                            // Originalbeleg aktualisieren.
                            $original->set('restbetragOffen', $neuerRest <= 0 ? 0.0 : $neuerRest);
                            $original->set('zahlungsstatus',  $neuerRest <= 0 ? 'bezahlt' : 'teilweise_bezahlt');

                            $erklaerung =
                                date('d.m.Y H:i') . ' — Automatische Gutschrift-Verrechnung: ' .
                                'Diese Eingangsrechnung wurde durch die Gutschrift ' . $gutschriftNr .
                                ' (Lieferanten-Belegnummer: ' . (string) ($eingangsrechnung->get('lieferantenRechnungsnummer') ?? '') . ')' .
                                ' ' . ($neuerRest <= 0 ? 'vollständig' : 'teilweise') . ' verrechnet. ' .
                                'Verrechneter Betrag: ' . number_format($gutschriftBrutto, 2, ',', '.') . ' EUR. ' .
                                'Restbetrag vor Verrechnung: ' . number_format($originalRest, 2, ',', '.') . ' EUR, ' .
                                'danach: ' . number_format(max(0.0, $neuerRest), 2, ',', '.') . ' EUR. ' .
                                'Zahlungsstatus: ' . ($neuerRest <= 0 ? 'bezahlt' : 'teilweise bezahlt') . '. ' .
                                'Ausgleichsbeleg: ' . $ausgleichsnr . '.';

                            $altBemerkung = trim((string) ($original->get('bemerkung') ?? ''));
                            $original->set('bemerkung', $altBemerkung !== ''
                                ? $altBemerkung . "\n\n" . $erklaerung
                                : $erklaerung
                            );

                            $em->saveEntity($original, ['allowFestgeschriebenSave' => true]);

                            // Gutschrift vollständig verrechnet.
                            $eingangsrechnung->set('restbetragOffen', 0.0);
                            $eingangsrechnung->set('zahlungsstatus',  'bezahlt');
                            $verrechnungOk = true;
                        }
                    }
                }

                // Kein sicherer Auto-Ausgleich → Gutschrift bleibt offen.
                if (!$verrechnungOk) {
                    $eingangsrechnung->set('restbetragOffen', $betragBrutto);
                    $eingangsrechnung->set('zahlungsstatus',  'offen');
                }
            } else {
                // normal_buchen: Restbetrag offen, Zahlung noch ausstehend.
                $eingangsrechnung->set('restbetragOffen', $betragBrutto);
                $eingangsrechnung->set('zahlungsstatus',  'offen');
            }

            $eingangsrechnung->set('status', 'festgeschrieben');
            $eingangsrechnung->set('festgeschriebenAm', date('Y-m-d H:i:s'));

            if ($user) {
                $eingangsrechnung->set('festgeschriebenVonId', $user->getId());
                $eingangsrechnung->set('festgeschriebenVonName', $user->get('name'));
            }

            $eingangsrechnung->set('buchungsjournalId', $journal->getId());
            $eingangsrechnung->set('buchungsjournalName', $journal->get('journalNummer'));

            $em->saveEntity($eingangsrechnung, [
                'allowFestgeschriebenSave' => true
            ]);

            if ($pdo->inTransaction()) {
                $pdo->commit();
            }

            return [
                'success' => true,
                'message' => 'Eingangsrechnung wurde festgeschrieben und ins Buchungsjournal übernommen.',
                'id' => $eingangsrechnung->getId(),
                'status' => $eingangsrechnung->get('status'),
                'journalId' => $journal->getId(),
                'journalNummer' => $journal->get('journalNummer'),
                'buchungen' => $createdCount,
                'steuerFall' => $regelSteuerFall,
            ];
        } catch (\Throwable $e) {
            try {
                if (isset($pdo) && $pdo->inTransaction()) {
                    $pdo->rollBack();
                }
            } catch (\Throwable $rollbackError) {
                $GLOBALS['log']->error(
                    'CEingangsrechnung::postActionFestschreiben rollback error: ' . $rollbackError->getMessage()
                );
            }

            $GLOBALS['log']->error(
                'CEingangsrechnung::postActionFestschreiben error: ' . $e->getMessage()
            );

            return [
                'success' => false,
                'message' => 'Festschreibung konnte nicht abgeschlossen werden. Es wurden keine endgültigen Änderungen übernommen.'
            ];
        }
    }

        /**
     * Что это:
     * Phase 4 — fachliches Storno einer festgeschriebenen Eingangsrechnung.
     *
     * Зачем:
     * Не редактирует старую Eingangsrechnung задним числом,
     * а создаёт nachvollziehbare Gegenbuchungen
     * и выводит документ из aktiver Verbindlichkeiten-Logik.
     */
    public function postActionStornieren($params, $data, $request)
    {
        $this->acl->check('CEingangsrechnung', 'edit');

        $id = $params['id'] ?? null;
        if (!$id && isset($data->id)) {
            $id = $data->id;
        }

        if (!$id) {
            return [
                'success' => false,
                'message' => 'Eingangsrechnung-ID fehlt.'
            ];
        }

        $em = $this->getEntityManager();
        $pdo = $em->getPDO();

        /** @var Entity|null $eingangsrechnung */
        $eingangsrechnung = $em->getEntity('CEingangsrechnung', $id);

        if (!$eingangsrechnung) {
            return [
                'success' => false,
                'message' => 'Eingangsrechnung wurde nicht gefunden.'
            ];
        }

        try {
            $status = strtolower((string) ($eingangsrechnung->get('status') ?? ''));
            $istStorniert = (bool) ($eingangsrechnung->get('istStorniert') ?? false);
            $zahlungsstatus = strtolower((string) ($eingangsrechnung->get('zahlungsstatus') ?? ''));

            if ($status !== 'festgeschrieben') {
                return [
                    'success' => false,
                    'message' => 'Nur festgeschriebene Eingangsrechnungen können storniert werden.'
                ];
            }

            if ($istStorniert || $zahlungsstatus === 'storniert') {
                return [
                    'success' => false,
                    'message' => 'Die Eingangsrechnung ist bereits storniert.'
                ];
            }

            $stornoGrund = trim((string) ($data->stornoGrund ?? ''));
            if ($stornoGrund === '') {
                return [
                    'success' => false,
                    'message' => 'Storno-Grund fehlt.'
                ];
            }

            // Что это:
            // Жёсткая стартовая Sicherheitsregel für Phase 4:
            // сначала сторнируются Zahlungen/Ausgleiche, потом Eingangsrechnung.
            if ($this->hasAktiveAusgleicheFuerEingangsrechnung($eingangsrechnung->getId(), $em)) {
                return [
                    'success' => false,
                    'message' => 'Zu dieser Eingangsrechnung existieren noch aktive Zahlungen/Ausgleiche. Bitte zuerst die zugehörigen Zahlungen stornieren.'
                ];
            }

            $originalJournalId = $eingangsrechnung->get('buchungsjournalId');
            if (!$originalJournalId) {
                return [
                    'success' => false,
                    'message' => 'Zur Eingangsrechnung wurde kein ursprüngliches Buchungsjournal gefunden.'
                ];
            }

            $originalJournal = $em->getEntity('CBuchungsjournal', $originalJournalId);
            if (!$originalJournal) {
                return [
                    'success' => false,
                    'message' => 'Das ursprüngliche Buchungsjournal wurde nicht gefunden.'
                ];
            }

            $originalBuchungen = $em
                ->getRDBRepository('CBuchung')
                ->where([
                    'buchungsjournalId' => $originalJournalId,
                    'deleted' => false,
                ])
                ->find();

            if (!$originalBuchungen || !count($originalBuchungen)) {
                return [
                    'success' => false,
                    'message' => 'Zu dieser Eingangsrechnung wurden keine ursprünglichen Buchungen gefunden.'
                ];
            }

            $journalNummer = 'ESTR-JRN-' . date('Ymd-His') . '-' . substr($eingangsrechnung->getId(), -6);

            if (!$pdo->inTransaction()) {
                $pdo->beginTransaction();
            }

            // Что это:
            // Neues Storno-Journal für Eingangsrechnung.
            $journal = $em->getNewEntity('CBuchungsjournal');

            $journal->set('name', $journalNummer);
            $journal->set('journalNummer', $journalNummer);
            $journal->set('belegdatum', date('Y-m-d'));
            $journal->set('buchungstext', 'Storno Eingangsrechnung ' . (string) ($eingangsrechnung->get('eingangsrechnungsnummer') ?? ''));
            $journal->set('quelleTyp', 'CEingangsrechnung');
            $journal->set('quelleIdExtern', $eingangsrechnung->getId());
            $journal->set('quelleNummer', $eingangsrechnung->get('eingangsrechnungsnummer'));
            $journal->set('buchhaltungStatus', 'festgeschrieben');
            $journal->set('phase1Verwendet', false);
            $journal->set('istStorno', true);
            $journal->set('stornoGrund', $stornoGrund);

            $em->saveEntity($journal);

            if (!$journal->getId()) {
                throw new \RuntimeException('Storno-Buchungsjournal konnte nicht erstellt werden.');
            }

            $createdCount = 0;

            foreach ($originalBuchungen as $originalBuchung) {
                $originalArt = strtolower((string) ($originalBuchung->get('buchungsart') ?? ''));
                $stornoArt = $originalArt === 'debit' ? 'credit' : 'debit';

                $buchung = $em->getNewEntity('CBuchung');

                $buchung->set(
                    'name',
                    ($stornoArt === 'debit' ? 'Soll ' : 'Haben ') . (string) ($originalBuchung->get('kontoNummer') ?? '')
                );
                $buchung->set('buchungsart', $stornoArt);
                $buchung->set('betrag', round((float) ($originalBuchung->get('betrag') ?? 0), 2));
                $buchung->set('kontoNummer', $originalBuchung->get('kontoNummer'));
                $buchung->set('kontoBezeichnung', $originalBuchung->get('kontoBezeichnung'));
                $buchung->set(
                    'buchungstext',
                    'Storno zu ' . (string) ($originalBuchung->get('buchungstext') ?? '')
                );
                $buchung->set('belegdatum', date('Y-m-d'));
                $buchung->set('quelleTyp', 'CEingangsrechnung');
                $buchung->set('quelleIdExtern', $eingangsrechnung->getId());
                $buchung->set('quelleNummer', $eingangsrechnung->get('eingangsrechnungsnummer'));
                $buchung->set('steuerFall', $originalBuchung->get('steuerFall'));
                $buchung->set('phase1Verwendet', false);
                $buchung->set('istStorno', true);

                $buchung->set('buchungsjournalId', $journal->getId());
                $buchung->set('buchungsjournalName', $journal->get('journalNummer'));

                $buchung->set('buchungsregelId', $originalBuchung->get('buchungsregelId'));
                $buchung->set('buchungsregelName', $originalBuchung->get('buchungsregelName'));

                $em->saveEntity($buchung);
                $createdCount++;
            }

            if ($createdCount !== count($originalBuchungen)) {
                throw new \RuntimeException('Storno-Buchungen konnten nicht vollständig erstellt werden.');
            }

            $user = $this->user;

            // Что это:
            // Eingangsrechnung fachlich in stornierten Zustand setzen.
            //
            // Важно:
            // status workflow bleibt festgeschrieben,
            // а operative Zahlungsdarstellung уходит в storniert.
            $eingangsrechnung->set('istStorniert', true);
            $eingangsrechnung->set('storniertAm', date('Y-m-d H:i:s'));
            $eingangsrechnung->set('stornoGrund', $stornoGrund);
            $eingangsrechnung->set('zahlungsstatus', 'storniert');
            $eingangsrechnung->set('restbetragOffen', 0.0);

            if ($user) {
                // Что это:
                // сохраняем пользователя, который выполнил Storno.
                //
                // Зачем:
                // чтобы в карточке и в истории было видно, кто именно сторнировал документ.
                $eingangsrechnung->set('storniertVonId', $user->getId());
                $eingangsrechnung->set('storniertVonName', $user->get('name'));
            }

            $em->saveEntity($eingangsrechnung, [
                'allowFestgeschriebenSave' => true
            ]);

            if ($pdo->inTransaction()) {
                $pdo->commit();
            }

            return [
                'success' => true,
                'message' => 'Eingangsrechnung wurde erfolgreich storniert.',
                'id' => $eingangsrechnung->getId(),
                'journalId' => $journal->getId(),
                'journalNummer' => $journal->get('journalNummer'),
                'buchungen' => $createdCount,
                'storniertAm' => $eingangsrechnung->get('storniertAm'),
            ];
        } catch (\Throwable $e) {
            try {
                if (isset($pdo) && $pdo->inTransaction()) {
                    $pdo->rollBack();
                }
            } catch (\Throwable $rollbackError) {
                $GLOBALS['log']->error(
                    'CEingangsrechnung::postActionStornieren rollback error: ' . $rollbackError->getMessage()
                );
            }

            $GLOBALS['log']->error(
                'CEingangsrechnung::postActionStornieren error: ' . $e->getMessage()
            );

            return [
                'success' => false,
                'message' => 'Storno konnte nicht abgeschlossen werden. Es wurden keine endgültigen Änderungen übernommen.'
            ];
        }
    }

    public function getActionFestgeschriebeneEingangsrechnungenReport($params, $data, $request)
{
    $this->acl->check('CEingangsrechnung', 'read');

    $em = $this->getEntityManager();
    $pdo = $em->getPDO();

    $von = $request->getQueryParam('von');
    $bis = $request->getQueryParam('bis');

    $where = "
        r.deleted = 0
        AND r.status = 'festgeschrieben'
        AND COALESCE(r.ist_storniert, 0) = 0
    ";

    $bind = [];

    if ($von) {
        $where .= " AND r.belegdatum >= :von ";
        $bind['von'] = $von;
    }

    if ($bis) {
        $where .= " AND r.belegdatum <= :bis ";
        $bind['bis'] = $bis;
    }

    $sql = "
        SELECT
            r.id,
            r.belegdatum,
            r.eingangsrechnungsnummer,
            r.lieferanten_rechnungsnummer AS lieferantenRechnungsnummer,
            r.steuerfall,
            r.betrag_netto AS betragNetto,
            r.steuer_betrag AS steuerBetrag,
            r.betrag_brutto AS betragBrutto,
            r.status,
            l.name AS lieferantName,
            j.journal_nummer AS journalNummer
        FROM c_eingangsrechnung r
        LEFT JOIN c_lieferant l ON l.id = r.lieferant_id AND l.deleted = 0
        LEFT JOIN c_buchungsjournal j ON j.id = r.buchungsjournal_id AND j.deleted = 0
        WHERE {$where}
        ORDER BY r.belegdatum DESC, r.created_at DESC
    ";

    try {
        $sth = $pdo->prepare($sql);
        $sth->execute($bind);

        $rows = $sth->fetchAll(\PDO::FETCH_ASSOC) ?: [];

        foreach ($rows as &$row) {
            $row['betragNetto'] = (float) ($row['betragNetto'] ?? 0);
            $row['steuerBetrag'] = (float) ($row['steuerBetrag'] ?? 0);
            $row['betragBrutto'] = (float) ($row['betragBrutto'] ?? 0);
        }

        return $rows;
    } catch (\Throwable $e) {
        $GLOBALS['log']->error(
            'CEingangsrechnung::getActionFestgeschriebeneEingangsrechnungenReport error: ' . $e->getMessage()
        );

        return [
            'success' => false,
            'error' => 'SQL error in festgeschriebeneEingangsrechnungenReport',
        ];
    }
}

    /**
     * Что это:
     * Проверяет, есть ли по Eingangsrechnung noch aktive Ausgleiche.
     *
     * Зачем:
     * В стартовой модели Phase 4 нельзя сторнировать Eingangsrechnung,
     * пока по ней ещё живы Zahlungsausgänge/Ausgleiche.
     */
    protected function hasAktiveAusgleicheFuerEingangsrechnung(string $eingangsrechnungId, $em): bool
    {
        $collection = $em
            ->getRDBRepository('CAusgleich')
            ->where([
                'eingangsrechnungId' => $eingangsrechnungId,
                'deleted' => false,
                'istAktiv' => true,
                'ausgleichStatus' => 'aktiv',
            ])
            ->find();

        return $collection && count($collection) > 0;
    }

    /**
     * Что это:
     * SQL-отчёт по сторнированным Eingangsrechnungen.
     *
     * Зачем:
     * Даёт стабильную server-side выборку всех fachlich stornierten Eingangsrechnungen
     * для Auswertungen, чтобы отчёт всегда строился по реальным DB-данным
     * и не ломался из-за особенностей ORM-выборки или UI-фильтрации.
     */
    public function getActionStornierteEingangsrechnungenReport($params, $data, $request)
    {
        $this->acl->check('CEingangsrechnung', 'read');

        $em = $this->getEntityManager();
        $pdo = $em->getPDO();

        $von = $request->getQueryParam('von');
        $bis = $request->getQueryParam('bis');

        $where = "
            r.deleted = 0
            AND r.status = 'festgeschrieben'
            AND r.zahlungsstatus = 'storniert'
            AND COALESCE(r.ist_storniert, 0) = 1
        ";

        $bind = [];

        if ($von) {
            $where .= " AND r.storniert_am >= :von ";
            $bind['von'] = $von . ' 00:00:00';
        }

        if ($bis) {
            $where .= " AND r.storniert_am <= :bis ";
            $bind['bis'] = $bis . ' 23:59:59';
        }

        $sql = "
            SELECT
                r.id,
                r.name,
                r.eingangsrechnungsnummer,
                r.belegdatum,
                r.betrag_netto AS betragNetto,
                r.steuer_betrag AS steuerBetrag,
                r.betrag_brutto AS betragBrutto,
                r.lieferant_id AS lieferantId,
                l.name AS lieferantName,
                r.storniert_am AS storniertAm,
                r.storno_grund AS stornoGrund,
                r.ist_storniert AS istStorniert,
                r.status,
                r.zahlungsstatus,
                j.id AS stornoJournalId,
                j.journal_nummer AS stornoJournalNummer
            FROM c_eingangsrechnung r
            LEFT JOIN c_lieferant l
                ON l.id = r.lieferant_id
                AND l.deleted = 0
            LEFT JOIN c_buchungsjournal j
                ON j.quelle_id_extern = r.id
                AND j.deleted = 0
                AND COALESCE(j.ist_storno, 0) = 1
                AND j.quelle_typ = 'CEingangsrechnung'
            WHERE {$where}
            ORDER BY r.storniert_am DESC, r.created_at DESC
        ";

        try {
            $sth = $pdo->prepare($sql);
            $sth->execute($bind);

            $rows = $sth->fetchAll(\PDO::FETCH_ASSOC) ?: [];

            foreach ($rows as &$row) {
                $row['betragNetto'] = (float) ($row['betragNetto'] ?? 0);
                $row['steuerBetrag'] = (float) ($row['steuerBetrag'] ?? 0);
                $row['betragBrutto'] = (float) ($row['betragBrutto'] ?? 0);
                $row['istStorniert'] = (int) ($row['istStorniert'] ?? 0);
            }

            return $rows;
        } catch (\Throwable $e) {
            $GLOBALS['log']->error(
                'CEingangsrechnung::getActionStornierteEingangsrechnungenReport error: ' . $e->getMessage()
            );

            return [
                'success' => false,
                'error' => 'SQL error in stornierteEingangsrechnungenReport',
            ];
        }
    }


    /**
 * Что это:
 * SQL-Report "Korrekturketten Eingangsrechnungen".
 *
 * Зачем:
 * Показывает fachliche Kette:
 * stornierte Eingangsrechnung -> korrigierter Nachfolgebeleg.
 *
 * Используется в:
 * CBuchhaltungAuswertung / Korrekturketten Eingangsrechnungen.
 */
public function getActionKorrekturkettenReport($params, $data, $request)
{
    $this->acl->check('CEingangsrechnung', 'read');

    $em = $this->getEntityManager();
    $pdo = $em->getPDO();

    $von = $request->getQueryParam('von');
    $bis = $request->getQueryParam('bis');

    $where = "
        u.deleted = 0
        AND u.nachfolge_beleg_id IS NOT NULL
        AND u.nachfolge_beleg_id <> ''
    ";

    $bind = [];

    // Что это:
    // Zeitraumfilter по Storno-Zeitpunkt des Ursprungsbelegs.
    //
    // Зачем:
    // Korrekturkette начинается с Storno des fehlerhaften Eingangsbelegs.
    if ($von) {
        $where .= " AND u.storniert_am >= :von ";
        $bind['von'] = $von . ' 00:00:00';
    }

    if ($bis) {
        $where .= " AND u.storniert_am <= :bis ";
        $bind['bis'] = $bis . ' 23:59:59';
    }

    $sql = "
        SELECT
            -- Ursprung
            u.id AS ursprungId,
            u.eingangsrechnungsnummer AS ursprungEingangsrechnungsnummer,
            u.name AS ursprungName,
            u.lieferanten_rechnungsnummer AS ursprungLieferantenRechnungsnummer,
            u.status AS ursprungStatus,
            u.zahlungsstatus AS ursprungZahlungsstatus,
            u.ist_storniert AS ursprungIstStorniert,
            u.betrag_netto AS ursprungBetragNetto,
            u.steuer_betrag AS ursprungSteuerBetrag,
            u.betrag_brutto AS ursprungBetragBrutto,
            u.restbetrag_offen AS ursprungRestbetragOffen,
            u.storniert_am AS ursprungStorniertAm,
            u.storno_grund AS ursprungStornoGrund,

            -- Nachfolger
            n.id AS nachfolgerId,
            n.eingangsrechnungsnummer AS nachfolgerEingangsrechnungsnummer,
            n.name AS nachfolgerName,
            n.lieferanten_rechnungsnummer AS nachfolgerLieferantenRechnungsnummer,
            n.status AS nachfolgerStatus,
            n.zahlungsstatus AS nachfolgerZahlungsstatus,
            n.ist_storniert AS nachfolgerIstStorniert,
            n.betrag_netto AS nachfolgerBetragNetto,
            n.steuer_betrag AS nachfolgerSteuerBetrag,
            n.betrag_brutto AS nachfolgerBetragBrutto,
            n.restbetrag_offen AS nachfolgerRestbetragOffen,
            n.freigabe_am AS nachfolgerFreigabeAm,
            n.festgeschrieben_am AS nachfolgerFestgeschriebenAm,

            -- Korrektur
            COALESCE(n.korrektur_typ, u.korrektur_typ) AS korrekturTyp,
            COALESCE(n.korrektur_grund, u.korrektur_grund) AS korrekturGrund,

            -- Lieferant
            u.lieferant_id AS lieferantId,
            l.name AS lieferantName,

            -- technische Kontrolle
            u.nachfolge_beleg_id AS linkedNachfolgerId,
            u.nachfolge_beleg_name AS linkedNachfolgerName,
            n.ersetzt_beleg_id AS nachfolgerErsetztBelegId,
            n.ersetzt_beleg_name AS nachfolgerErsetztBelegName

        FROM c_eingangsrechnung u

        LEFT JOIN c_eingangsrechnung n
            ON n.id = u.nachfolge_beleg_id
            AND n.deleted = 0

        LEFT JOIN c_lieferant l
            ON l.id = u.lieferant_id
            AND l.deleted = 0

        WHERE {$where}

        ORDER BY
            u.storniert_am DESC,
            u.created_at DESC
    ";

    try {
        $sth = $pdo->prepare($sql);
        $sth->execute($bind);

        $rows = $sth->fetchAll(\PDO::FETCH_ASSOC) ?: [];

        foreach ($rows as &$row) {
            $row['ursprungIstStorniert'] = (int) ($row['ursprungIstStorniert'] ?? 0);
            $row['nachfolgerIstStorniert'] = (int) ($row['nachfolgerIstStorniert'] ?? 0);

            $row['ursprungBetragNetto'] = (float) ($row['ursprungBetragNetto'] ?? 0);
            $row['ursprungSteuerBetrag'] = (float) ($row['ursprungSteuerBetrag'] ?? 0);
            $row['ursprungBetragBrutto'] = (float) ($row['ursprungBetragBrutto'] ?? 0);
            $row['ursprungRestbetragOffen'] = (float) ($row['ursprungRestbetragOffen'] ?? 0);

            $row['nachfolgerBetragNetto'] = (float) ($row['nachfolgerBetragNetto'] ?? 0);
            $row['nachfolgerSteuerBetrag'] = (float) ($row['nachfolgerSteuerBetrag'] ?? 0);
            $row['nachfolgerBetragBrutto'] = (float) ($row['nachfolgerBetragBrutto'] ?? 0);
            $row['nachfolgerRestbetragOffen'] = (float) ($row['nachfolgerRestbetragOffen'] ?? 0);
        }

        return $rows;
    } catch (\Throwable $e) {
        $GLOBALS['log']->error(
            'CEingangsrechnung::getActionKorrekturkettenReport error: ' . $e->getMessage()
        );

        return [
            'success' => false,
            'error' => 'SQL error in korrekturkettenReport',
            'message' => 'Korrekturketten Eingangsrechnungen konnten nicht geladen werden.',
        ];
    }
}

/**
 * Что это:
 * Kontrollreport für stornierte Eingangsrechnungen ohne/mit Nachfolger.
 *
 * Зачем:
 * Показывает все stornierten Eingangsrechnungen и контролирует,
 * есть ли к ним Nachfolgebeleg.
 *
 * Используется в:
 * CBuchhaltungAuswertung / Stornierte Belege Kontrolle.
 */
public function getActionStornierteBelegeKontrolleReport($params, $data, $request)
{
    $this->acl->check('CEingangsrechnung', 'read');

    $em = $this->getEntityManager();
    $pdo = $em->getPDO();

    $von = $request->getQueryParam('von');
    $bis = $request->getQueryParam('bis');

    $where = "
        r.deleted = 0
        AND COALESCE(r.ist_storniert, 0) = 1
        AND r.zahlungsstatus = 'storniert'
    ";

    $bind = [];

    if ($von) {
        $where .= " AND r.storniert_am >= :von ";
        $bind['von'] = $von . ' 00:00:00';
    }

    if ($bis) {
        $where .= " AND r.storniert_am <= :bis ";
        $bind['bis'] = $bis . ' 23:59:59';
    }

    $sql = "
        SELECT
            'eingang' AS bereich,

            r.id AS id,
            r.eingangsrechnungsnummer AS belegNummer,
            r.name AS name,
            'eingangsrechnung' AS belegTyp,

            r.status AS status,
            r.zahlungsstatus AS zahlungsstatus,
            r.ist_storniert AS istStorniert,
            r.storniert_am AS storniertAm,
            r.storno_grund AS stornoGrund,

            r.betrag_netto AS betragNetto,
            r.steuer_betrag AS steuerBetrag,
            r.betrag_brutto AS betragBrutto,

            r.lieferant_id AS partnerId,
            l.name AS partnerName,

            r.nachfolge_beleg_id AS nachfolgerId,
            r.nachfolge_beleg_name AS nachfolgerName,
            n.eingangsrechnungsnummer AS nachfolgerNummer,
            n.status AS nachfolgerStatus,
            n.zahlungsstatus AS nachfolgerZahlungsstatus,
            n.ist_storniert AS nachfolgerIstStorniert,

            COALESCE(n.korrektur_typ, r.korrektur_typ) AS korrekturTyp,
            COALESCE(n.korrektur_grund, r.korrektur_grund) AS korrekturGrund

        FROM c_eingangsrechnung r

        LEFT JOIN c_lieferant l
            ON l.id = r.lieferant_id
            AND l.deleted = 0

        LEFT JOIN c_eingangsrechnung n
            ON n.id = r.nachfolge_beleg_id
            AND n.deleted = 0

        WHERE {$where}

        ORDER BY
            r.storniert_am DESC,
            r.created_at DESC
    ";

    try {
        $sth = $pdo->prepare($sql);
        $sth->execute($bind);

        $rows = $sth->fetchAll(\PDO::FETCH_ASSOC) ?: [];

        foreach ($rows as &$row) {
            $row['istStorniert'] = (int) ($row['istStorniert'] ?? 0);
            $row['nachfolgerIstStorniert'] = (int) ($row['nachfolgerIstStorniert'] ?? 0);

            $row['betragNetto'] = (float) ($row['betragNetto'] ?? 0);
            $row['steuerBetrag'] = (float) ($row['steuerBetrag'] ?? 0);
            $row['betragBrutto'] = (float) ($row['betragBrutto'] ?? 0);
        }

        return $rows;
    } catch (\Throwable $e) {
        $GLOBALS['log']->error(
            'CEingangsrechnung::getActionStornierteBelegeKontrolleReport error: ' . $e->getMessage()
        );

        return [
            'success' => false,
            'error' => 'SQL error in stornierteBelegeKontrolleReport',
            'message' => 'Stornierte Eingangsrechnungen konnten nicht geladen werden.',
        ];
    }
}

    /**
     * Что это:
     * Phase 5 — создаёт korrigierten Nachfolgebeleg zu einer stornierten Eingangsrechnung.
     *
     * Зачем:
     * Stornierte Eingangsrechnung не редактируется задним числом.
     * Вместо неё создаётся новая самостоятельная Eingangsrechnung im Entwurf,
     * связанная с Ursprungsbeleg.
     */
    public function postActionCreateKorrekturNachfolgebeleg($params, $data, $request)
    {
        $this->acl->check('CEingangsrechnung', 'edit');

        $em = $this->getEntityManager();

        $id = $data->id ?? null;
        $korrekturTyp = trim((string)($data->korrekturTyp ?? ''));
        $korrekturGrund = trim((string)($data->korrekturGrund ?? ''));

        if (!$id) {
            return [
                'success' => false,
                'message' => 'Eingangsrechnung-ID fehlt.',
            ];
        }

        $allowedTypes = [
            'inhaltliche_korrektur',
            'betragskorrektur',
            'positionskorrektur',
            'steuerkorrektur',
            'adresskorrektur',
            'formelle_korrektur',
            'sonstige_korrektur',
        ];

        if (!in_array($korrekturTyp, $allowedTypes, true)) {
            return [
                'success' => false,
                'message' => 'Ungültiger Korrekturtyp.',
            ];
        }

        if ($korrekturGrund === '') {
            return [
                'success' => false,
                'message' => 'Korrekturgrund fehlt.',
            ];
        }

        $ursprung = $em->getEntity('CEingangsrechnung', $id);

        if (!$ursprung) {
            return [
                'success' => false,
                'message' => 'Ursprungs-Eingangsrechnung wurde nicht gefunden.',
            ];
        }

        $istStorniert = (bool)($ursprung->get('istStorniert') ?? false);
        $zahlungsstatus = strtolower((string)($ursprung->get('zahlungsstatus') ?? ''));

        if (!$istStorniert && $zahlungsstatus !== 'storniert') {
            return [
                'success' => false,
                'message' => 'Ein Nachfolgebeleg kann nur für eine stornierte Eingangsrechnung erstellt werden.',
            ];
        }

        if ($ursprung->get('nachfolgeBelegId')) {
            return [
                'success' => false,
                'message' => 'Für diese Eingangsrechnung existiert bereits ein Nachfolgebeleg.',
            ];
        }

        $nachfolger = $em->getNewEntity('CEingangsrechnung');

        // Basisdaten aus Ursprungs-Eingangsrechnung übernehmen.
        $fieldsToCopy = [
            'lieferantId',
            'lieferantName',

            'lieferantenRechnungsnummer',
            'belegdatum',
            'eingangsdatum',
            'faelligAm',

            'steuerfall',
            'betragNetto',
            'steuerBetrag',
            'betragBrutto',

            'bemerkung',
            'pruefhinweis',

            'assignedUserId',
            'assignedUserName',
        ];

        foreach ($fieldsToCopy as $field) {
            if ($ursprung->has($field)) {
                $nachfolger->set($field, $ursprung->get($field));
            }
        }

        // Neue Eingangsrechnung ist frischer Entwurf ohne buchhalterische Wirkung.
        $nachfolger->set('status', 'entwurf');
        $nachfolger->set('zahlungsstatus', 'offen');
        $nachfolger->set('aktiv', true);

        $nachfolger->set('freigabeAm', null);
        $nachfolger->set('festgeschriebenAm', null);
        $nachfolger->set('festgeschriebenVonId', null);
        $nachfolger->set('festgeschriebenVonName', null);

        $nachfolger->set('buchungsjournalId', null);
        $nachfolger->set('buchungsjournalName', null);

        // Keine Storno-Merkmale auf dem neuen Beleg.
        $nachfolger->set('istStorniert', false);
        $nachfolger->set('storniertAm', null);
        $nachfolger->set('stornoGrund', null);
        $nachfolger->set('storniertVonId', null);
        $nachfolger->set('storniertVonName', null);

        // Keine Zahlungswirkung im Entwurf.
        $nachfolger->set('restbetragOffen', null);

        // Phase-5-Korrekturdaten.
        $ursprungName =
            $ursprung->get('eingangsrechnungsnummer')
            ?: $ursprung->get('name')
            ?: $ursprung->get('id');

        $nachfolger->set('istKorrekturbeleg', true);
        $nachfolger->set('korrekturTyp', $korrekturTyp);
        $nachfolger->set('korrekturGrund', $korrekturGrund);
        $nachfolger->set('ersetztBelegId', $ursprung->get('id'));
        $nachfolger->set('ersetztBelegName', $ursprungName);
        $nachfolger->set('nachfolgeBelegId', null);
        $nachfolger->set('nachfolgeBelegName', null);

        // Name bewusst markieren. Eingangsrechnungsnummer kommt über AutoNumber.
        $nachfolger->set('name', 'Korrektur zu ' . $ursprungName);

        // Erst speichern, damit neue ID für Positionen existiert.
        $em->saveEntity($nachfolger);

        $nachfolgerId = $nachfolger->get('id');

        if (!$nachfolgerId) {
            throw new \RuntimeException('Nachfolgebeleg konnte nicht erstellt werden.');
        }

        // ------------------------------------------------------------
        // Positionen aus Ursprungs-Eingangsrechnung kopieren
        // ------------------------------------------------------------
        $positionCollection = $em
            ->getRDBRepository('CEingangsrechnungsposition')
            ->where([
                'eingangsrechnungId' => $ursprung->get('id'),
                'deleted' => false,
            ])
            ->find();

        $copiedPositions = 0;

        if ($positionCollection && count($positionCollection)) {
            foreach ($positionCollection as $altePosition) {
                $neuePosition = $em->getNewEntity('CEingangsrechnungsposition');

                $positionFieldsToCopy = [
                    'positionsnummer',
                    'name',
                    'bezeichnung',
                    'beschreibung',
                    'menge',
                    'einheit',
                    'einzelpreisNetto',
                    'gesamtNetto',
                    'kostenart',
                    'bemerkung',
                    'materialId',
                    'materialName',
                    'rabattProzent',
                    'rabattBetrag',
                ];

                foreach ($positionFieldsToCopy as $field) {
                    if ($altePosition->has($field)) {
                        $neuePosition->set($field, $altePosition->get($field));
                    }
                }

                $neuePosition->set('eingangsrechnungId', $nachfolgerId);
                $neuePosition->set(
                    'eingangsrechnungName',
                    $nachfolger->get('eingangsrechnungsnummer') ?: $nachfolger->get('name') ?: $nachfolgerId
                );

                $em->saveEntity($neuePosition);
                $copiedPositions++;
            }
        }

        // Startwerte aus Ursprung übernehmen.
        // Wichtig: restbetragOffen bleibt trotzdem leer, weil der Entwurf noch keine Verbindlichkeit erzeugt.
        $nachfolger->set('betragNetto', round((float)($ursprung->get('betragNetto') ?? 0), 2));
        $nachfolger->set('steuerBetrag', round((float)($ursprung->get('steuerBetrag') ?? 0), 2));
        $nachfolger->set('betragBrutto', round((float)($ursprung->get('betragBrutto') ?? 0), 2));
        $nachfolger->set('restbetragOffen', null);

        $em->saveEntity($nachfolger);

        $nachfolgerName =
            $nachfolger->get('eingangsrechnungsnummer')
            ?: $nachfolger->get('name')
            ?: $nachfolgerId;

        // Rückverknüpfung auf dem stornierten Ursprungsbeleg.
        $ursprung->set('nachfolgeBelegId', $nachfolgerId);
        $ursprung->set('nachfolgeBelegName', $nachfolgerName);

        // Korrekturinfo auch auf Ursprung sichtbar machen.
        $ursprung->set('korrekturTyp', $korrekturTyp);
        $ursprung->set('korrekturGrund', $korrekturGrund);
        $ursprung->set('istKorrekturbeleg', false);

        $em->saveEntity($ursprung, [
            'allowFestgeschriebenSave' => true,
        ]);

        return [
            'success' => true,
            'message' => 'Korrigierter Nachfolgebeleg wurde als Entwurf erstellt.',
            'nachfolgeBelegId' => $nachfolgerId,
            'nachfolgeBelegName' => $nachfolgerName,
            'copiedPositions' => $copiedPositions,
        ];
    }

}