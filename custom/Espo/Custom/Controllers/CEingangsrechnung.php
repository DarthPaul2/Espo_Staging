<?php

namespace Espo\Custom\Controllers;

use Espo\Core\Templates\Controllers\Base;

class CEingangsrechnung extends Base
{
    /**
     * Это action для fachlicher Freigabe входящего счета.
     * Он проверяет документ и переводит его в статус "freigabe".
     */
    public function postActionFreigeben($params, $data, $request)
    {
        $this->getAcl()->check('CEingangsrechnung', 'edit');

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

            if (!$eingangsrechnung->get('faelligAm')) {
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
                $recalculatedGesamtNetto = round($menge * $einzelpreisNetto, 2);

                if ($menge <= 0) {
                    return [
                        'success' => false,
                        'message' => 'Mindestens eine Position hat eine ungültige Menge.'
                    ];
                }

                if ($einzelpreisNetto < 0) {
                    return [
                        'success' => false,
                        'message' => 'Mindestens eine Position hat einen ungültigen Einzelpreis.'
                    ];
                }

                if ($recalculatedGesamtNetto < 0) {
                    return [
                        'success' => false,
                        'message' => 'Mindestens eine Position hat einen ungültigen Gesamtbetrag.'
                    ];
                }
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
            $this->getContainer()->get('log')->error(
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
        $this->getAcl()->check('CEingangsrechnung', 'edit');

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
            $this->getContainer()->get('log')->error(
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
        $this->getAcl()->check('CEingangsrechnung', 'edit');

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

            if (!$eingangsrechnung->get('faelligAm')) {
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
                $gesamtNetto = round((float) ($position->get('gesamtNetto') ?? 0), 2);

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

                if ($einzelpreisNetto < 0) {
                    return [
                        'success' => false,
                        'message' => 'Mindestens eine Position hat einen ungültigen Einzelpreis.'
                    ];
                }

                $recalculatedGesamtNetto = round($menge * $einzelpreisNetto, 2);

                // Что это: для Festschreibung берём всегда заново пересчитанную сумму строки,
                // но не сохраняем позицию отдельно до завершения всей транзакции.
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

            // Aufwand (Debit)
            $buchungenData[] = [
                'buchungsart' => 'debit',
                'betrag' => $betragNetto,
                'kontoEntity' => $aufwandKonto,
                'buchungstext' => 'Aufwand aus Eingangsrechnung ' . (string) $eingangsrechnung->get('eingangsrechnungsnummer'),
                'steuerFall' => $regelSteuerFall,
            ];

            // Vorsteuer (Debit) — только если не steuerfrei
            if ($regelSteuerFall !== 'steuerfrei') {
                $buchungenData[] = [
                    'buchungsart' => 'debit',
                    'betrag' => $steuerBetrag,
                    'kontoEntity' => $vorsteuerKonto,
                    'buchungstext' => 'Vorsteuer aus Eingangsrechnung ' . (string) $eingangsrechnung->get('eingangsrechnungsnummer'),
                    'steuerFall' => $regelSteuerFall,
                ];
            }

            // Verbindlichkeit (Credit)
            $buchungenData[] = [
                'buchungsart' => 'credit',
                'betrag' => $betragBrutto,
                'kontoEntity' => $verbindlichkeitKonto,
                'buchungstext' => 'Verbindlichkeit aus Eingangsrechnung ' . (string) $eingangsrechnung->get('eingangsrechnungsnummer'),
                'steuerFall' => $regelSteuerFall,
            ];

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

            // Что это: Journalnummer für Phase 2.
            $journalNummer = 'EJR-' . date('Ymd-His') . '-' . substr($eingangsrechnung->getId(), -6);

            if (!$pdo->inTransaction()) {
                $pdo->beginTransaction();
            }

            // Что это: создаём Buchungsjournal.
            $journal = $em->getNewEntity('CBuchungsjournal');

            $journal->set('name', $journalNummer);
            $journal->set('journalNummer', $journalNummer);
            $journal->set('belegdatum', $eingangsrechnung->get('belegdatum'));
            $journal->set('buchungstext', 'Festschreibung Eingangsrechnung ' . (string) $eingangsrechnung->get('eingangsrechnungsnummer'));
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
            $user = $this->getUser();

            $eingangsrechnung->set('betragNetto', $betragNetto);
            $eingangsrechnung->set('steuerBetrag', $steuerBetrag);
            $eingangsrechnung->set('betragBrutto', $betragBrutto);

            // Что это:
            // стартовый offener Restbetrag после первой Festschreibung Eingangsrechnung.
            //
            // Зачем:
            // в момент Festschreibung документ уже бухгалтерски зафиксирован,
            // но ещё не оплачен, значит весь Bruttobetrag пока остаётся offen.
            $eingangsrechnung->set('restbetragOffen', $betragBrutto);

            // Что это:
            // стартовый operativer Zahlungsstatus Eingangsrechnung.
            //
            // Зачем:
            // после Festschreibung и до первой оплаты Eingangsrechnung должна считаться offen.
            $eingangsrechnung->set('zahlungsstatus', 'offen');

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
                $this->getContainer()->get('log')->error(
                    'CEingangsrechnung::postActionFestschreiben rollback error: ' . $rollbackError->getMessage()
                );
            }

            $this->getContainer()->get('log')->error(
                'CEingangsrechnung::postActionFestschreiben error: ' . $e->getMessage()
            );

            return [
                'success' => false,
                'message' => 'Festschreibung konnte nicht abgeschlossen werden. Es wurden keine endgültigen Änderungen übernommen.'
            ];
        }
    }

    public function getActionFestgeschriebeneEingangsrechnungenReport($params, $data, $request)
{
    $this->getAcl()->check('CEingangsrechnung', 'read');

    $em = $this->getEntityManager();
    $pdo = $em->getPDO();

    $von = $request->getQueryParam('von');
    $bis = $request->getQueryParam('bis');

    $where = "
        r.deleted = 0
        AND r.status = 'festgeschrieben'
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
        $this->getContainer()->get('log')->error(
            'CEingangsrechnung::getActionFestgeschriebeneEingangsrechnungenReport error: ' . $e->getMessage()
        );

        return [
            'success' => false,
            'error' => 'SQL error in festgeschriebeneEingangsrechnungenReport',
        ];
    }
}
}