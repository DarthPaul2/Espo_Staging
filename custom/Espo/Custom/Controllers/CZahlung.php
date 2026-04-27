<?php

namespace Espo\Custom\Controllers;

use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Templates\Controllers\Base;
use Espo\ORM\Entity;
use RuntimeException;

class CZahlung extends Base
{
    public function postActionFreigeben($params, $data, $request)
    {
        $this->getAcl()->check('CZahlung', 'edit');

        $id = $params['id'] ?? null;
        if (!$id && isset($data->id)) {
            $id = $data->id;
        }

        if (!$id) {
            return [
                'success' => false,
                'message' => 'Zahlung-ID fehlt.'
            ];
        }

        $em = $this->getEntityManager();
        /** @var Entity|null $zahlung */
        $zahlung = $em->getEntity('CZahlung', $id);

        if (!$zahlung) {
            return [
                'success' => false,
                'message' => 'Zahlung wurde nicht gefunden.'
            ];
        }

        try {
            $this->validateFreigabe($zahlung, $em);

            $zahlung->set('status', 'freigabe');
            $zahlung->set('freigabeAm', date('Y-m-d H:i:s'));

            $em->saveEntity($zahlung, [
                'allowFestgeschriebenSave' => true
            ]);

            return [
                'success' => true,
                'message' => 'Zahlung wurde fachlich freigegeben.',
                'id' => $zahlung->getId(),
                'status' => $zahlung->get('status'),
                'freigabeAm' => $zahlung->get('freigabeAm'),
            ];
        } catch (BadRequest $e) {
            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        } catch (\Throwable $e) {
            $this->getContainer()->get('log')->error(
                'CZahlung::postActionFreigeben error: ' . $e->getMessage()
            );

            return [
                'success' => false,
                'message' => 'Freigabe konnte nicht abgeschlossen werden.'
            ];
        }
    }

    public function postActionZurueckZuEntwurf($params, $data, $request)
    {
        $this->getAcl()->check('CZahlung', 'edit');

        $id = $params['id'] ?? null;
        if (!$id && isset($data->id)) {
            $id = $data->id;
        }

        if (!$id) {
            return [
                'success' => false,
                'message' => 'Zahlung-ID fehlt.'
            ];
        }

        $em = $this->getEntityManager();
        /** @var Entity|null $zahlung */
        $zahlung = $em->getEntity('CZahlung', $id);

        if (!$zahlung) {
            return [
                'success' => false,
                'message' => 'Zahlung wurde nicht gefunden.'
            ];
        }

        try {
            $status = strtolower((string) ($zahlung->get('status') ?? 'entwurf'));

            if ($status === 'entwurf') {
                return [
                    'success' => true,
                    'message' => 'Die Zahlung befindet sich bereits im Status Entwurf.'
                ];
            }

            if ($status === 'festgeschrieben') {
                return [
                    'success' => false,
                    'message' => 'Festgeschriebene Zahlungen können nicht mehr in den Entwurf zurückgesetzt werden.'
                ];
            }

            if ($status !== 'freigabe') {
                return [
                    'success' => false,
                    'message' => 'Nur freigegebene Zahlungen können zurück in den Entwurf gesetzt werden.'
                ];
            }

            $zahlung->set('status', 'entwurf');
            $zahlung->set('freigabeAm', null);

            $em->saveEntity($zahlung, [
                'allowFestgeschriebenSave' => true
            ]);

            return [
                'success' => true,
                'message' => 'Zahlung wurde zurück in den Entwurf gesetzt.',
                'id' => $zahlung->getId(),
                'status' => $zahlung->get('status'),
            ];
        } catch (\Throwable $e) {
            $this->getContainer()->get('log')->error(
                'CZahlung::postActionZurueckZuEntwurf error: ' . $e->getMessage()
            );

            return [
                'success' => false,
                'message' => 'Der Status konnte nicht auf Entwurf zurückgesetzt werden.'
            ];
        }
    }


        /**
     * Что это:
     * Главный action Phase 3:
     * freigabe -> festgeschrieben + Journal + Buchungen + Ausgleich + Restbetrag + Statusupdate.
     *
     * Зачем:
     * Делает оплату бухгалтерически значимой и уменьшает offenen Posten документа.
     */
    public function postActionFestschreiben($params, $data, $request)
    {
        $this->getAcl()->check('CZahlung', 'edit');

        $id = $params['id'] ?? null;
        if (!$id && isset($data->id)) {
            $id = $data->id;
        }

        if (!$id) {
            return [
                'success' => false,
                'message' => 'Zahlung-ID fehlt.'
            ];
        }

        $em = $this->getEntityManager();
        $pdo = $em->getPDO();

        /** @var Entity|null $zahlung */
        $zahlung = $em->getEntity('CZahlung', $id);

        if (!$zahlung) {
            return [
                'success' => false,
                'message' => 'Zahlung wurde nicht gefunden.'
            ];
        }

        try {
            $status = strtolower((string) ($zahlung->get('status') ?? 'entwurf'));
            $istFestgeschrieben = (bool) ($zahlung->get('istFestgeschrieben') ?? false);

            if ($status !== 'freigabe') {
                return [
                    'success' => false,
                    'message' => 'Die Zahlung muss zuerst freigegeben werden.'
                ];
            }

            if ($istFestgeschrieben || $status === 'festgeschrieben') {
                return [
                    'success' => false,
                    'message' => 'Die Zahlung ist bereits festgeschrieben.'
                ];
            }

            // Что это:
            // Повторная fachliche проверка перед окончательной Festschreibung.
            $this->validateFreigabeForFestschreibung($zahlung, $em);

            $zahlungsRichtung = strtolower((string) ($zahlung->get('zahlungsRichtung') ?? ''));
            $zahlungsart = strtolower((string) ($zahlung->get('zahlungsart') ?? 'bank'));
            $bankbezugTyp = strtolower((string) ($zahlung->get('bankbezugTyp') ?? 'bank'));
            $betrag = round((float) ($zahlung->get('betrag') ?? 0), 2);

            // Что это:
            // Для Regelwahl берём сначала zahlungsart, если она bank/bar.
            // Иначе fallback auf bankbezugTyp.
            $kontoTyp = 'bank';

            if (in_array($zahlungsart, ['bank', 'bar'], true)) {
                $kontoTyp = $zahlungsart;
            } elseif (in_array($bankbezugTyp, ['bank', 'kasse'], true)) {
                $kontoTyp = $bankbezugTyp === 'kasse' ? 'bar' : 'bank';
            }

            $dokumentTyp = $zahlungsRichtung === 'eingang' ? 'zahlungseingang' : 'zahlungsausgang';

            // Что это:
            // Ищем passende Buchungsregel для оплаты.
            $regelList = $em
                ->getRDBRepository('CBuchungsregel')
                ->where([
                    'aktiv' => true,
                    'quelleTyp' => 'CZahlung',
                    'dokumentTyp' => $dokumentTyp,
                    'steuerFall' => 'normal',
                    'deleted' => false,
                ])
                ->find();

            if (!$regelList || !count($regelList)) {
                return [
                    'success' => false,
                    'message' => 'Keine passende Buchungsregel für diese Zahlung gefunden.'
                ];
            }

            $regel = null;

            foreach ($regelList as $candidate) {
                $hasBank = !empty($candidate->get('bankKontoRegelnId'));
                $hasKasse = !empty($candidate->get('kasseKontoRegelnId'));

                if ($kontoTyp === 'bank' && $hasBank && !$hasKasse) {
                    $regel = $candidate;
                    break;
                }

                if ($kontoTyp === 'bar' && $hasKasse && !$hasBank) {
                    $regel = $candidate;
                    break;
                }
            }

            if (!$regel) {
                return [
                    'success' => false,
                    'message' => 'Keine passende Buchungsregel für Zahlungsart bzw. Bankbezug gefunden.'
                ];
            }

            $bankKontoId = $regel->get('bankKontoRegelnId');
            $kasseKontoId = $regel->get('kasseKontoRegelnId');
            $forderungKontoId = $regel->get('forderungKontoRegelnId');
            $verbindlichkeitKontoId = $regel->get('verbindlichkeitZahlungKontoRegelnId');

            $liquiditaetsKonto = null;
            if ($kontoTyp === 'bank' && $bankKontoId) {
                $liquiditaetsKonto = $em->getEntity('CKonto', $bankKontoId);
            }
            if ($kontoTyp === 'bar' && $kasseKontoId) {
                $liquiditaetsKonto = $em->getEntity('CKonto', $kasseKontoId);
            }

            $forderungKonto = $forderungKontoId ? $em->getEntity('CKonto', $forderungKontoId) : null;
            $verbindlichkeitKonto = $verbindlichkeitKontoId ? $em->getEntity('CKonto', $verbindlichkeitKontoId) : null;

            if (!$liquiditaetsKonto) {
                return [
                    'success' => false,
                    'message' => 'Die Buchungsregel enthält kein passendes Liquiditätskonto.'
                ];
            }

            if ($zahlungsRichtung === 'eingang' && !$forderungKonto) {
                return [
                    'success' => false,
                    'message' => 'Die Buchungsregel enthält kein Forderungskonto.'
                ];
            }

            if ($zahlungsRichtung === 'ausgang' && !$verbindlichkeitKonto) {
                return [
                    'success' => false,
                    'message' => 'Die Buchungsregel enthält kein Verbindlichkeitskonto.'
                ];
            }

            // Что это:
            // Загружаем активные Ausgleiche ещё раз для транзакционной Verarbeitung.
            $ausgleichCollection = $em
                ->getRDBRepository('CAusgleich')
                ->where([
                    'zahlungId' => $zahlung->getId(),
                    'deleted' => false,
                    'istAktiv' => true,
                    'ausgleichStatus' => 'aktiv',
                ])
                ->find();

            if (!$ausgleichCollection || !count($ausgleichCollection)) {
                return [
                    'success' => false,
                    'message' => 'Keine aktiven Ausgleiche für diese Zahlung gefunden.'
                ];
            }

            // Что это:
            // Подготавливаем Journalnummer.
            $journalNummer = 'ZLG-JRN-' . date('Ymd-His') . '-' . substr($zahlung->getId(), -6);

            // Что это:
            // Подготавливаем Buchungszeilen vor DB-Transaktion.
            $buchungenData = [];

            if ($zahlungsRichtung === 'eingang') {
                // Soll Bank/Kasse
                $buchungenData[] = [
                    'buchungsart' => 'debit',
                    'betrag' => $betrag,
                    'kontoEntity' => $liquiditaetsKonto,
                    'buchungstext' => 'Zahlungseingang ' . (string) ($zahlung->get('zahlungsnummer') ?? ''),
                    'steuerFall' => 'normal',
                ];

                // Haben Forderung
                $buchungenData[] = [
                    'buchungsart' => 'credit',
                    'betrag' => $betrag,
                    'kontoEntity' => $forderungKonto,
                    'buchungstext' => 'Ausgleich Forderung ' . (string) ($zahlung->get('zahlungsnummer') ?? ''),
                    'steuerFall' => 'normal',
                ];
            } else {
                // Soll Verbindlichkeit
                $buchungenData[] = [
                    'buchungsart' => 'debit',
                    'betrag' => $betrag,
                    'kontoEntity' => $verbindlichkeitKonto,
                    'buchungstext' => 'Ausgleich Verbindlichkeit ' . (string) ($zahlung->get('zahlungsnummer') ?? ''),
                    'steuerFall' => 'normal',
                ];

                // Haben Bank/Kasse
                $buchungenData[] = [
                    'buchungsart' => 'credit',
                    'betrag' => $betrag,
                    'kontoEntity' => $liquiditaetsKonto,
                    'buchungstext' => 'Zahlungsausgang ' . (string) ($zahlung->get('zahlungsnummer') ?? ''),
                    'steuerFall' => 'normal',
                ];
            }

            // Что это:
            // Проверка баланса до записи в БД.
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

            if (!$pdo->inTransaction()) {
                $pdo->beginTransaction();
            }

            // Что это:
            // Создаём Buchungsjournal.
            $journal = $em->getNewEntity('CBuchungsjournal');

            $journal->set('name', $journalNummer);
            $journal->set('journalNummer', $journalNummer);
            $journal->set('belegdatum', $zahlung->get('zahlungsdatum'));
            $journal->set('buchungstext', 'Festschreibung Zahlung ' . (string) ($zahlung->get('zahlungsnummer') ?? ''));
            $journal->set('quelleTyp', 'CZahlung');
            $journal->set('quelleIdExtern', $zahlung->getId());
            $journal->set('quelleNummer', $zahlung->get('zahlungsnummer'));
            $journal->set('buchhaltungStatus', 'festgeschrieben');
            $journal->set('phase1Verwendet', false);

            $em->saveEntity($journal);

            if (!$journal->getId()) {
                throw new \RuntimeException('Buchungsjournal konnte nicht erstellt werden.');
            }

            // Что это:
            // Создаём Buchungen.
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
                $buchung->set('belegdatum', $zahlung->get('zahlungsdatum'));
                $buchung->set('quelleTyp', 'CZahlung');
                $buchung->set('quelleIdExtern', $zahlung->getId());
                $buchung->set('quelleNummer', $zahlung->get('zahlungsnummer'));
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

            // Что это:
            // Применяем Ausgleich auf die verknüpften Dokumente.
            foreach ($ausgleichCollection as $ausgleich) {
                $ausgleichBetrag = round((float) ($ausgleich->get('betrag') ?? 0), 2);

                $rechnungId = $ausgleich->get('rechnungId');
                $eingangsrechnungId = $ausgleich->get('eingangsrechnungId');

                if ($rechnungId) {
                    $rechnung = $em->getEntity('CRechnung', $rechnungId);
                    if (!$rechnung) {
                        throw new \RuntimeException('Verknüpfte Rechnung wurde nicht gefunden.');
                    }

                    $alterRestbetrag = round((float) ($rechnung->get('restbetragOffen') ?? 0), 2);
                    $neuerRestbetrag = round($alterRestbetrag - $ausgleichBetrag, 2);

                    if ($neuerRestbetrag < 0) {
                        throw new \RuntimeException('Restbetrag der Rechnung würde negativ werden.');
                    }

                    $rechnung->set('restbetragOffen', $neuerRestbetrag);
                    $rechnung->set('status', $this->determineDokumentZahlungsstatus(
                        round((float) ($rechnung->get('betragBrutto') ?? 0), 2),
                        $neuerRestbetrag,
                        strtolower((string) ($rechnung->get('status') ?? 'offen'))
                    ));

                    $em->saveEntity($rechnung, [
                        'allowFestgeschriebenSave' => true
                    ]);

                    $ausgleich->set('restbetragNachAusgleich', $neuerRestbetrag);
                    $ausgleich->set('ausgleichTyp', $neuerRestbetrag == 0.0 ? 'voll' : 'teil');
                }

                if ($eingangsrechnungId) {
                    $eingangsrechnung = $em->getEntity('CEingangsrechnung', $eingangsrechnungId);
                    if (!$eingangsrechnung) {
                        throw new \RuntimeException('Verknüpfte Eingangsrechnung wurde nicht gefunden.');
                    }

                    $alterRestbetrag = round((float) ($eingangsrechnung->get('restbetragOffen') ?? 0), 2);
                    $neuerRestbetrag = round($alterRestbetrag - $ausgleichBetrag, 2);

                    if ($neuerRestbetrag < 0) {
                        throw new \RuntimeException('Restbetrag der Eingangsrechnung würde negativ werden.');
                    }

                    $eingangsrechnung->set('restbetragOffen', $neuerRestbetrag);
                    $eingangsrechnung->set('zahlungsstatus', $this->determineDokumentZahlungsstatus(
                        round((float) ($eingangsrechnung->get('betragBrutto') ?? 0), 2),
                        $neuerRestbetrag,
                        strtolower((string) ($eingangsrechnung->get('zahlungsstatus') ?? 'offen'))
                    ));

                    $em->saveEntity($eingangsrechnung, [
                        'allowFestgeschriebenSave' => true
                    ]);

                    $ausgleich->set('restbetragNachAusgleich', $neuerRestbetrag);
                    $ausgleich->set('ausgleichTyp', $neuerRestbetrag == 0.0 ? 'voll' : 'teil');
                }

                $em->saveEntity($ausgleich, [
                    'allowFestgeschriebenSave' => true
                ]);
            }

            // Что это:
            // Финально фиксируем саму Zahlung.
            $user = $this->getUser();

            $zahlung->set('status', 'festgeschrieben');
            $zahlung->set('istFestgeschrieben', true);
            $zahlung->set('festgeschriebenAm', date('Y-m-d H:i:s'));

            if ($user) {
                $zahlung->set('festgeschriebenVonId', $user->getId());
                $zahlung->set('festgeschriebenVonName', $user->get('name'));
            }

            $zahlung->set('buchungsjournalId', $journal->getId());
            $zahlung->set('buchungsjournalName', $journal->get('journalNummer'));

            $em->saveEntity($zahlung, [
                'allowFestgeschriebenSave' => true
            ]);

            if ($pdo->inTransaction()) {
                $pdo->commit();
            }

            return [
                'success' => true,
                'message' => 'Zahlung wurde festgeschrieben und ins Buchungsjournal übernommen.',
                'id' => $zahlung->getId(),
                'status' => $zahlung->get('status'),
                'journalId' => $journal->getId(),
                'journalNummer' => $journal->get('journalNummer'),
                'buchungen' => $createdCount,
            ];
        } catch (BadRequest $e) {
            try {
                if (isset($pdo) && $pdo->inTransaction()) {
                    $pdo->rollBack();
                }
            } catch (\Throwable $rollbackError) {
                $this->getContainer()->get('log')->error(
                    'CZahlung::postActionFestschreiben rollback error: ' . $rollbackError->getMessage()
                );
            }

            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        } catch (\Throwable $e) {
            try {
                if (isset($pdo) && $pdo->inTransaction()) {
                    $pdo->rollBack();
                }
            } catch (\Throwable $rollbackError) {
                $this->getContainer()->get('log')->error(
                    'CZahlung::postActionFestschreiben rollback error: ' . $rollbackError->getMessage()
                );
            }

            $this->getContainer()->get('log')->error(
                'CZahlung::postActionFestschreiben error: ' . $e->getMessage()
            );

            return [
                'success' => false,
                'message' => 'Festschreibung konnte nicht abgeschlossen werden. Es wurden keine endgültigen Änderungen übernommen.'
            ];
        }
    }

        /**
     * Что это:
     * Главный action Phase 4 для безопасного Storno festgeschriebene Zahlung.
     *
     * Зачем:
     * Отменяет Zahlungswirkung через Gegenbuchung,
     * deaktiviert aktive Ausgleiche
     * и пересчитывает Restbetrag/Status документа.
     */
    public function postActionStornieren($params, $data, $request)
    {
        $this->getAcl()->check('CZahlung', 'edit');

        $id = $params['id'] ?? null;
        if (!$id && isset($data->id)) {
            $id = $data->id;
        }

        if (!$id) {
            return [
                'success' => false,
                'message' => 'Zahlung-ID fehlt.'
            ];
        }

        $em = $this->getEntityManager();
        $pdo = $em->getPDO();

        /** @var Entity|null $zahlung */
        $zahlung = $em->getEntity('CZahlung', $id);

        if (!$zahlung) {
            return [
                'success' => false,
                'message' => 'Zahlung wurde nicht gefunden.'
            ];
        }

        try {
            $status = strtolower((string) ($zahlung->get('status') ?? ''));
            $istFestgeschrieben = (bool) ($zahlung->get('istFestgeschrieben') ?? false);
            $istStorniert = (bool) ($zahlung->get('istStorniert') ?? false);

            if ($status !== 'festgeschrieben' || !$istFestgeschrieben) {
                return [
                    'success' => false,
                    'message' => 'Nur festgeschriebene Zahlungen können storniert werden.'
                ];
            }

            if ($istStorniert) {
                return [
                    'success' => false,
                    'message' => 'Die Zahlung ist bereits storniert.'
                ];
            }

            $stornoGrund = trim((string) ($data->stornoGrund ?? ''));
            if ($stornoGrund === '') {
                return [
                    'success' => false,
                    'message' => 'Storno-Grund fehlt.'
                ];
            }

            $zahlungsRichtung = strtolower((string) ($zahlung->get('zahlungsRichtung') ?? ''));
            $zahlungsart = strtolower((string) ($zahlung->get('zahlungsart') ?? 'bank'));
            $bankbezugTyp = strtolower((string) ($zahlung->get('bankbezugTyp') ?? 'bank'));
            $betrag = round((float) ($zahlung->get('betrag') ?? 0), 2);

            if ($betrag <= 0) {
                return [
                    'success' => false,
                    'message' => 'Der Zahlungsbetrag ist ungültig.'
                ];
            }

            $kontoTyp = 'bank';

            if (in_array($zahlungsart, ['bank', 'bar'], true)) {
                $kontoTyp = $zahlungsart;
            } elseif (in_array($bankbezugTyp, ['bank', 'kasse'], true)) {
                $kontoTyp = $bankbezugTyp === 'kasse' ? 'bar' : 'bank';
            }

            $dokumentTyp = $zahlungsRichtung === 'eingang' ? 'zahlungseingang' : 'zahlungsausgang';

            $regelList = $em
                ->getRDBRepository('CBuchungsregel')
                ->where([
                    'aktiv' => true,
                    'quelleTyp' => 'CZahlung',
                    'dokumentTyp' => $dokumentTyp,
                    'steuerFall' => 'normal',
                    'deleted' => false,
                ])
                ->find();

            if (!$regelList || !count($regelList)) {
                return [
                    'success' => false,
                    'message' => 'Keine passende Buchungsregel für das Storno dieser Zahlung gefunden.'
                ];
            }

            $regel = null;

            foreach ($regelList as $candidate) {
                $hasBank = !empty($candidate->get('bankKontoRegelnId'));
                $hasKasse = !empty($candidate->get('kasseKontoRegelnId'));

                if ($kontoTyp === 'bank' && $hasBank && !$hasKasse) {
                    $regel = $candidate;
                    break;
                }

                if ($kontoTyp === 'bar' && $hasKasse && !$hasBank) {
                    $regel = $candidate;
                    break;
                }
            }

            if (!$regel) {
                return [
                    'success' => false,
                    'message' => 'Keine passende Buchungsregel für das Storno dieser Zahlung gefunden.'
                ];
            }

            $bankKontoId = $regel->get('bankKontoRegelnId');
            $kasseKontoId = $regel->get('kasseKontoRegelnId');
            $forderungKontoId = $regel->get('forderungKontoRegelnId');
            $verbindlichkeitKontoId = $regel->get('verbindlichkeitZahlungKontoRegelnId');

            $liquiditaetsKonto = null;
            if ($kontoTyp === 'bank' && $bankKontoId) {
                $liquiditaetsKonto = $em->getEntity('CKonto', $bankKontoId);
            }
            if ($kontoTyp === 'bar' && $kasseKontoId) {
                $liquiditaetsKonto = $em->getEntity('CKonto', $kasseKontoId);
            }

            $forderungKonto = $forderungKontoId ? $em->getEntity('CKonto', $forderungKontoId) : null;
            $verbindlichkeitKonto = $verbindlichkeitKontoId ? $em->getEntity('CKonto', $verbindlichkeitKontoId) : null;

            if (!$liquiditaetsKonto) {
                return [
                    'success' => false,
                    'message' => 'Die Buchungsregel enthält kein passendes Liquiditätskonto.'
                ];
            }

            if ($zahlungsRichtung === 'eingang' && !$forderungKonto) {
                return [
                    'success' => false,
                    'message' => 'Die Buchungsregel enthält kein Forderungskonto.'
                ];
            }

            if ($zahlungsRichtung === 'ausgang' && !$verbindlichkeitKonto) {
                return [
                    'success' => false,
                    'message' => 'Die Buchungsregel enthält kein Verbindlichkeitskonto.'
                ];
            }

            $ausgleichCollection = $em
                ->getRDBRepository('CAusgleich')
                ->where([
                    'zahlungId' => $zahlung->getId(),
                    'deleted' => false,
                    'istAktiv' => true,
                    'ausgleichStatus' => 'aktiv',
                ])
                ->find();

            if (!$ausgleichCollection || !count($ausgleichCollection)) {
                return [
                    'success' => false,
                    'message' => 'Keine aktiven Ausgleiche für diese Zahlung gefunden.'
                ];
            }

            $journalNummer = 'STZLG-JRN-' . date('Ymd-His') . '-' . substr($zahlung->getId(), -6);

            $buchungenData = [];

            if ($zahlungsRichtung === 'eingang') {
                // Storno Zahlungseingang:
                // Bank/Kasse credit, Forderung debit
                $buchungenData[] = [
                    'buchungsart' => 'credit',
                    'betrag' => $betrag,
                    'kontoEntity' => $liquiditaetsKonto,
                    'buchungstext' => 'Storno Zahlungseingang ' . (string) ($zahlung->get('zahlungsnummer') ?? ''),
                    'steuerFall' => 'normal',
                ];

                $buchungenData[] = [
                    'buchungsart' => 'debit',
                    'betrag' => $betrag,
                    'kontoEntity' => $forderungKonto,
                    'buchungstext' => 'Storno Ausgleich Forderung ' . (string) ($zahlung->get('zahlungsnummer') ?? ''),
                    'steuerFall' => 'normal',
                ];
            } else {
                // Storno Zahlungsausgang:
                // Verbindlichkeit credit, Bank/Kasse debit
                $buchungenData[] = [
                    'buchungsart' => 'credit',
                    'betrag' => $betrag,
                    'kontoEntity' => $verbindlichkeitKonto,
                    'buchungstext' => 'Storno Ausgleich Verbindlichkeit ' . (string) ($zahlung->get('zahlungsnummer') ?? ''),
                    'steuerFall' => 'normal',
                ];

                $buchungenData[] = [
                    'buchungsart' => 'debit',
                    'betrag' => $betrag,
                    'kontoEntity' => $liquiditaetsKonto,
                    'buchungstext' => 'Storno Zahlungsausgang ' . (string) ($zahlung->get('zahlungsnummer') ?? ''),
                    'steuerFall' => 'normal',
                ];
            }

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
                    'message' => 'Die Storno-Buchung ist nicht ausgeglichen.'
                ];
            }

            if (!$pdo->inTransaction()) {
                $pdo->beginTransaction();
            }

            $journal = $em->getNewEntity('CBuchungsjournal');

            $journal->set('name', $journalNummer);
            $journal->set('journalNummer', $journalNummer);
            $journal->set('belegdatum', $zahlung->get('zahlungsdatum'));
            $journal->set('buchungstext', 'Storno Zahlung ' . (string) ($zahlung->get('zahlungsnummer') ?? ''));
            $journal->set('quelleTyp', 'CZahlung');
            $journal->set('quelleIdExtern', $zahlung->getId());
            $journal->set('quelleNummer', $zahlung->get('zahlungsnummer'));
            $journal->set('buchhaltungStatus', 'festgeschrieben');
            $journal->set('phase1Verwendet', false);
            $journal->set('istStorno', true);
            $journal->set('stornoGrund', $stornoGrund);

            $em->saveEntity($journal);

            if (!$journal->getId()) {
                throw new \RuntimeException('Storno-Buchungsjournal konnte nicht erstellt werden.');
            }

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
                $buchung->set('belegdatum', $zahlung->get('zahlungsdatum'));
                $buchung->set('quelleTyp', 'CZahlung');
                $buchung->set('quelleIdExtern', $zahlung->getId());
                $buchung->set('quelleNummer', $zahlung->get('zahlungsnummer'));
                $buchung->set('steuerFall', $row['steuerFall']);
                $buchung->set('phase1Verwendet', false);
                $buchung->set('istStorno', true);

                $buchung->set('buchungsjournalId', $journal->getId());
                $buchung->set('buchungsjournalName', $journal->get('journalNummer'));

                $buchung->set('buchungsregelId', $regel->getId());
                $buchung->set('buchungsregelName', $regel->get('name'));

                $em->saveEntity($buchung);
                $createdCount++;
            }

            foreach ($ausgleichCollection as $ausgleich) {
                $rechnungId = $ausgleich->get('rechnungId');
                $eingangsrechnungId = $ausgleich->get('eingangsrechnungId');

                $ausgleich->set('istAktiv', false);
                $ausgleich->set('ausgleichStatus', 'storniert');
                $ausgleich->set('storniertAm', date('Y-m-d H:i:s'));
                $ausgleich->set('stornoGrund', $stornoGrund);

                $em->saveEntity($ausgleich, [
                    'allowFestgeschriebenSave' => true
                ]);

                if ($rechnungId) {
                    $this->recalculateRechnungRestbetragUndStatus($rechnungId, $em);
                }

                if ($eingangsrechnungId) {
                    $this->recalculateEingangsrechnungRestbetragUndStatus($eingangsrechnungId, $em);
                }
            }

            $zahlung->set('istStorniert', true);
            $zahlung->set('storniertAm', date('Y-m-d H:i:s'));
            $zahlung->set('stornoGrund', $stornoGrund);

            $em->saveEntity($zahlung, [
                'allowFestgeschriebenSave' => true
            ]);

            if ($pdo->inTransaction()) {
                $pdo->commit();
            }

            return [
                'success' => true,
                'message' => 'Zahlung wurde erfolgreich storniert.',
                'id' => $zahlung->getId(),
                'journalId' => $journal->getId(),
                'journalNummer' => $journal->get('journalNummer'),
                'buchungen' => $createdCount,
            ];
        } catch (\Throwable $e) {
            try {
                if (isset($pdo) && $pdo->inTransaction()) {
                    $pdo->rollBack();
                }
            } catch (\Throwable $rollbackError) {
                $this->getContainer()->get('log')->error(
                    'CZahlung::postActionStornieren rollback error: ' . $rollbackError->getMessage()
                );
            }

            $this->getContainer()->get('log')->error(
                'CZahlung::postActionStornieren error: ' . $e->getMessage()
            );

            return [
                'success' => false,
                'message' => 'Storno konnte nicht abgeschlossen werden. Es wurden keine endgültigen Änderungen übernommen.'
            ];
        }
    }

    private function validateFreigabe(Entity $zahlung, $em): void
    {
        $status = strtolower((string) ($zahlung->get('status') ?? 'entwurf'));

        if ($status === 'festgeschrieben') {
            throw new BadRequest('Die Zahlung ist bereits festgeschrieben.');
        }

        if ($status !== 'entwurf') {
            throw new BadRequest('Nur Zahlungen im Status Entwurf können freigegeben werden.');
        }

        if (!$zahlung->get('zahlungsdatum')) {
            throw new BadRequest('Zahlungsdatum fehlt.');
        }

        $betrag = round((float) ($zahlung->get('betrag') ?? 0), 2);
        if ($betrag <= 0) {
            throw new BadRequest('Der Betrag muss größer als 0 sein.');
        }

        $zahlungsRichtung = strtolower((string) ($zahlung->get('zahlungsRichtung') ?? ''));
        if (!in_array($zahlungsRichtung, ['eingang', 'ausgang'], true)) {
            throw new BadRequest('Zahlungsrichtung ist ungültig.');
        }

        $accountId = $zahlung->get('accountId');
        $lieferantId = $zahlung->get('lieferantId');

        if ($zahlungsRichtung === 'eingang') {
            if (empty($accountId)) {
                throw new BadRequest('Für einen Zahlungseingang muss ein Kunde ausgewählt sein.');
            }
            if (!empty($lieferantId)) {
                throw new BadRequest('Für einen Zahlungseingang darf kein Lieferant gesetzt sein.');
            }
        }

        if ($zahlungsRichtung === 'ausgang') {
            if (empty($lieferantId)) {
                throw new BadRequest('Für einen Zahlungsausgang muss ein Lieferant ausgewählt sein.');
            }
            if (!empty($accountId)) {
                throw new BadRequest('Für einen Zahlungsausgang darf kein Kunde gesetzt sein.');
            }
        }

        $ausgleichCollection = $em
            ->getRDBRepository('CAusgleich')
            ->where([
                'zahlungId' => $zahlung->getId(),
                'deleted' => false,
            ])
            ->find();

        if (!$ausgleichCollection || !count($ausgleichCollection)) {
            throw new BadRequest('Für die Freigabe muss mindestens ein Ausgleich vorhanden sein.');
        }

        $summeAusgleich = 0.0;

        foreach ($ausgleichCollection as $ausgleich) {
            $this->validateAusgleichForFreigabe($ausgleich, $zahlungsRichtung, $em);
            $summeAusgleich += round((float) ($ausgleich->get('betrag') ?? 0), 2);
        }

        $summeAusgleich = round($summeAusgleich, 2);

        if (abs($summeAusgleich - $betrag) > 0.009) {
            throw new BadRequest('Betrag der Zahlung muss der Summe aller aktiven Ausgleiche entsprechen.');
        }
    }

    private function validateAusgleichForFreigabe(Entity $ausgleich, string $zahlungsRichtung, $em): void
    {
        $istAktiv = (bool) ($ausgleich->get('istAktiv') ?? false);
        if (!$istAktiv) {
            throw new BadRequest('Alle Ausgleiche müssen aktiv sein.');
        }

        $ausgleichStatus = strtolower((string) ($ausgleich->get('ausgleichStatus') ?? ''));
        if ($ausgleichStatus !== 'aktiv') {
            throw new BadRequest('Nur aktive Ausgleiche dürfen freigegeben werden.');
        }

        $ausgleichBetrag = round((float) ($ausgleich->get('betrag') ?? 0), 2);
        if ($ausgleichBetrag <= 0) {
            throw new BadRequest('Jeder Ausgleich muss einen Betrag größer als 0 haben.');
        }

        if (!$ausgleich->get('ausgleichsdatum')) {
            throw new BadRequest('Ausgleichsdatum fehlt.');
        }

        $ausgleichRichtung = strtolower((string) ($ausgleich->get('richtung') ?? ''));
        if (!in_array($ausgleichRichtung, ['forderungsausgleich', 'verbindlichkeitsausgleich'], true)) {
            throw new BadRequest('Richtung eines Ausgleichs ist ungültig.');
        }

        $ausgleichTyp = strtolower((string) ($ausgleich->get('ausgleichTyp') ?? ''));
        if (!in_array($ausgleichTyp, ['voll', 'teil'], true)) {
            throw new BadRequest('Ausgleichstyp ist ungültig.');
        }

        $rechnungId = $ausgleich->get('rechnungId');
        $eingangsrechnungId = $ausgleich->get('eingangsrechnungId');

        if (($rechnungId && $eingangsrechnungId) || (!$rechnungId && !$eingangsrechnungId)) {
            throw new BadRequest('Jeder Ausgleich muss genau einer Rechnung oder Eingangsrechnung zugeordnet sein.');
        }

        if ($zahlungsRichtung === 'eingang' && $ausgleichRichtung !== 'forderungsausgleich') {
            throw new BadRequest('Ein Zahlungseingang darf nur Forderungen ausgleichen.');
        }

        if ($zahlungsRichtung === 'ausgang' && $ausgleichRichtung !== 'verbindlichkeitsausgleich') {
            throw new BadRequest('Ein Zahlungsausgang darf nur Verbindlichkeiten ausgleichen.');
        }

        if ($rechnungId) {
            $rechnung = $em->getEntity('CRechnung', $rechnungId);

            if (!$rechnung) {
                throw new BadRequest('Verknüpfte Rechnung wurde nicht gefunden.');
            }

            $rechnungBuchhaltungStatus = strtolower((string) ($rechnung->get('buchhaltungStatus') ?? ''));
            if ($rechnungBuchhaltungStatus !== 'festgeschrieben') {
                throw new BadRequest('Die verknüpfte Rechnung ist nicht festgeschrieben.');
            }

            $restbetrag = round((float) ($rechnung->get('restbetragOffen') ?? 0), 2);

            if ($restbetrag <= 0) {
                throw new BadRequest('Die verknüpfte Rechnung ist bereits vollständig ausgeglichen.');
            }

            if ($ausgleichBetrag > $restbetrag) {
                throw new BadRequest('Ausgleichsbetrag darf den offenen Restbetrag der Rechnung nicht überschreiten.');
            }

            return;
        }

        if ($eingangsrechnungId) {
            $eingangsrechnung = $em->getEntity('CEingangsrechnung', $eingangsrechnungId);

            if (!$eingangsrechnung) {
                throw new BadRequest('Verknüpfte Eingangsrechnung wurde nicht gefunden.');
            }

            $eingangsrechnungStatus = strtolower((string) ($eingangsrechnung->get('status') ?? ''));
            if ($eingangsrechnungStatus !== 'festgeschrieben') {
                throw new BadRequest('Die verknüpfte Eingangsrechnung ist nicht festgeschrieben.');
            }

            $restbetrag = round((float) ($eingangsrechnung->get('restbetragOffen') ?? 0), 2);

            if ($restbetrag <= 0) {
                throw new BadRequest('Die verknüpfte Eingangsrechnung ist bereits vollständig ausgeglichen.');
            }

            if ($ausgleichBetrag > $restbetrag) {
                throw new BadRequest('Ausgleichsbetrag darf den offenen Restbetrag der Eingangsrechnung nicht überschreiten.');
            }

        }
    }

        /**
     * Что это:
     * Повторная проверка перед Festschreibung.
     *
     * Зачем:
     * Чтобы перед транзакцией ещё раз убедиться,
     * что Zahlung и Ausgleiche всё ещё konsistent.
     */
    private function validateFreigabeForFestschreibung(Entity $zahlung, $em): void
    {
        $status = strtolower((string) ($zahlung->get('status') ?? 'entwurf'));

        if ($status !== 'freigabe') {
            throw new BadRequest('Die Zahlung muss zuerst im Status Freigabe sein.');
        }

        $istFestgeschrieben = (bool) ($zahlung->get('istFestgeschrieben') ?? false);
        if ($istFestgeschrieben) {
            throw new BadRequest('Die Zahlung ist bereits festgeschrieben.');
        }

        if (!$zahlung->get('zahlungsdatum')) {
            throw new BadRequest('Zahlungsdatum fehlt.');
        }

        $betrag = round((float) ($zahlung->get('betrag') ?? 0), 2);
        if ($betrag <= 0) {
            throw new BadRequest('Der Betrag muss größer als 0 sein.');
        }

        $zahlungsRichtung = strtolower((string) ($zahlung->get('zahlungsRichtung') ?? ''));
        if (!in_array($zahlungsRichtung, ['eingang', 'ausgang'], true)) {
            throw new BadRequest('Zahlungsrichtung ist ungültig.');
        }

        $ausgleichCollection = $em
            ->getRDBRepository('CAusgleich')
            ->where([
                'zahlungId' => $zahlung->getId(),
                'deleted' => false,
            ])
            ->find();

        if (!$ausgleichCollection || !count($ausgleichCollection)) {
            throw new BadRequest('Für die Festschreibung muss mindestens ein Ausgleich vorhanden sein.');
        }

        $summeAusgleich = 0.0;

        foreach ($ausgleichCollection as $ausgleich) {
            $this->validateAusgleichForFreigabe($ausgleich, $zahlungsRichtung, $em);
            $summeAusgleich += round((float) ($ausgleich->get('betrag') ?? 0), 2);
        }

        $summeAusgleich = round($summeAusgleich, 2);

        if (abs($summeAusgleich - $betrag) > 0.009) {
            throw new BadRequest('Betrag der Zahlung muss der Summe aller aktiven Ausgleiche entsprechen.');
        }
    }

    /**
     * Что это:
     * Вычисляет производный operativer Zahlungsstatus документа.
     *
     * Зачем:
     * Чтобы status / zahlungsstatus не считались вручную,
     * а всегда выводились из Gesamtbetrag и Restbetrag.
     */
    private function determineDokumentZahlungsstatus(float $gesamtbetrag, float $restbetrag, string $aktuellerStatus): string
    {
        if ($aktuellerStatus === 'storniert') {
            return 'storniert';
        }

        $gesamtbetrag = round($gesamtbetrag, 2);
        $restbetrag = round($restbetrag, 2);

        if ($restbetrag <= 0.0) {
            return 'bezahlt';
        }

        if ($restbetrag < $gesamtbetrag) {
            return 'teilweise_bezahlt';
        }

        return 'offen';
    }

    /**
     * Что это:
     * Пересчитывает restbetragOffen и status у Rechnung
     * по всем активным gültigen Ausgleichen.
     *
     * Зачем:
     * После Storno Zahlung нельзя просто "прибавить сумму обратно" руками.
     * Нужно заново собрать fachlich правильный Restbetrag
     * и убрать bezahltAm, если Rechnung снова не полностью bezahlt.
     */
    private function recalculateRechnungRestbetragUndStatus(string $rechnungId, $em): void
    {
        $rechnung = $em->getEntity('CRechnung', $rechnungId);

        if (!$rechnung) {
            throw new \RuntimeException('Verknüpfte Rechnung wurde nicht gefunden.');
        }

        $gesamtbetrag = round((float) ($rechnung->get('betragBrutto') ?? 0), 2);
        $summeAktiverAusgleich = $this->getAktiveAusgleichsSummeFuerRechnung($rechnungId, $em);

        $neuerRestbetrag = round($gesamtbetrag - $summeAktiverAusgleich, 2);
        if ($neuerRestbetrag < 0) {
            $neuerRestbetrag = 0.0;
        }

        $neuerStatus = $this->determineDokumentZahlungsstatus(
            $gesamtbetrag,
            $neuerRestbetrag,
            strtolower((string) ($rechnung->get('status') ?? 'offen'))
        );

        $rechnung->set('restbetragOffen', $neuerRestbetrag);
        $rechnung->set('status', $neuerStatus);

        // Что это:
        // сбрасываем bezahltAm, если Rechnung после Neuberechnung
        // больше не vollständig bezahlt.
        //
        // Зачем:
        // после Storno Zahlung поле bezahltAm не должно оставаться
        // у снова offenen oder teilweise_bezahlten Rechnungen.
        if (in_array($neuerStatus, ['offen', 'teilweise_bezahlt'], true)) {
            $rechnung->set('bezahltAm', null);
        }

        $em->saveEntity($rechnung, [
            'allowFestgeschriebenSave' => true
        ]);
    }

        /**
     * Что это:
     * Пересчитывает restbetragOffen и zahlungsstatus у Eingangsrechnung
     * по всем активным gültigen Ausgleichen.
     *
     * Зачем:
     * После Storno Zahlungsausgang offene Verbindlichkeit должна fachlich korrekt zurückkommen.
     */
    private function recalculateEingangsrechnungRestbetragUndStatus(string $eingangsrechnungId, $em): void
    {
        $eingangsrechnung = $em->getEntity('CEingangsrechnung', $eingangsrechnungId);

        if (!$eingangsrechnung) {
            throw new \RuntimeException('Verknüpfte Eingangsrechnung wurde nicht gefunden.');
        }

        $gesamtbetrag = round((float) ($eingangsrechnung->get('betragBrutto') ?? 0), 2);
        $summeAktiverAusgleich = $this->getAktiveAusgleichsSummeFuerEingangsrechnung($eingangsrechnungId, $em);

        $neuerRestbetrag = round($gesamtbetrag - $summeAktiverAusgleich, 2);
        if ($neuerRestbetrag < 0) {
            $neuerRestbetrag = 0.0;
        }

        $eingangsrechnung->set('restbetragOffen', $neuerRestbetrag);
        $eingangsrechnung->set('zahlungsstatus', $this->determineDokumentZahlungsstatus(
            $gesamtbetrag,
            $neuerRestbetrag,
            strtolower((string) ($eingangsrechnung->get('zahlungsstatus') ?? 'offen'))
        ));

        $em->saveEntity($eingangsrechnung, [
            'allowFestgeschriebenSave' => true
        ]);
    }

        /**
     * Что это:
     * Сумма всех aktiven Ausgleiche для Rechnung.
     *
     * Зачем:
     * Это fachliche Grundlage для Restbetrag nach Storno.
     */
    private function getAktiveAusgleichsSummeFuerRechnung(string $rechnungId, $em): float
    {
        $ausgleichCollection = $em
            ->getRDBRepository('CAusgleich')
            ->where([
                'rechnungId' => $rechnungId,
                'deleted' => false,
                'istAktiv' => true,
                'ausgleichStatus' => 'aktiv',
            ])
            ->find();

        $summe = 0.0;

        foreach ($ausgleichCollection as $ausgleich) {
            $summe += round((float) ($ausgleich->get('betrag') ?? 0), 2);
        }

        return round($summe, 2);
    }

        /**
     * Что это:
     * Сумма всех aktiven Ausgleiche для Eingangsrechnung.
     *
     * Зачем:
     * Это fachliche Grundlage для Restbetrag nach Storno Zahlungsausgang.
     */
    private function getAktiveAusgleichsSummeFuerEingangsrechnung(string $eingangsrechnungId, $em): float
    {
        $ausgleichCollection = $em
            ->getRDBRepository('CAusgleich')
            ->where([
                'eingangsrechnungId' => $eingangsrechnungId,
                'deleted' => false,
                'istAktiv' => true,
                'ausgleichStatus' => 'aktiv',
            ])
            ->find();

        $summe = 0.0;

        foreach ($ausgleichCollection as $ausgleich) {
            $summe += round((float) ($ausgleich->get('betrag') ?? 0), 2);
        }

        return round($summe, 2);
    }

    // Что это:
// SQL-отчёт по сторнированным Zahlungen.
//
// Зачем:
// Берём данные напрямую из БД, без спорной выборки через collection,
// чтобы отчет стабильно показывал реально сторнированные оплаты.
public function getActionStornierteZahlungenReport($params, $data, $request)
{
    $this->getAcl()->check('CZahlung', 'read');

    $em = $this->getEntityManager();
    $pdo = $em->getPDO();

    $von = $request->getQueryParam('von');
    $bis = $request->getQueryParam('bis');

    $where = "
        z.deleted = 0
        AND z.status = 'festgeschrieben'
        AND COALESCE(z.ist_storniert, 0) = 1
    ";

    $bind = [];

    if ($von) {
        $where .= " AND z.storniert_am >= :von ";
        $bind['von'] = $von . ' 00:00:00';
    }

    if ($bis) {
        $where .= " AND z.storniert_am <= :bis ";
        $bind['bis'] = $bis . ' 23:59:59';
    }

    $sql = "
        SELECT
            z.id,
            z.name,
            z.zahlungsnummer,
            z.zahlungsdatum,
            z.betrag,
            z.zahlungs_richtung AS zahlungsRichtung,
            z.status,
            z.ist_storniert AS istStorniert,
            z.storniert_am AS storniertAm,
            z.storno_grund AS stornoGrund,
            z.account_id AS accountId,
            acc.name AS accountName,
            z.lieferant_id AS lieferantId,
            lief.name AS lieferantName,
            j.id AS stornoJournalId,
            j.journal_nummer AS stornoJournalNummer
        FROM c_zahlung z
        LEFT JOIN account acc
            ON acc.id = z.account_id
            AND acc.deleted = 0
        LEFT JOIN c_lieferant lief
            ON lief.id = z.lieferant_id
            AND lief.deleted = 0
        LEFT JOIN c_buchungsjournal j
            ON j.quelle_id_extern = z.id
            AND j.deleted = 0
            AND COALESCE(j.ist_storno, 0) = 1
            AND j.quelle_typ = 'CZahlung'
        WHERE {$where}
        ORDER BY z.storniert_am DESC, z.created_at DESC
    ";

    try {
        $sth = $pdo->prepare($sql);
        $sth->execute($bind);

        $rows = $sth->fetchAll(\PDO::FETCH_ASSOC) ?: [];

        foreach ($rows as &$row) {
            $row['betrag'] = (float) ($row['betrag'] ?? 0);
            $row['istStorniert'] = (int) ($row['istStorniert'] ?? 0);
        }

        return $rows;
    } catch (\Throwable $e) {
        $this->getContainer()->get('log')->error(
            'CZahlung::getActionStornierteZahlungenReport error: ' . $e->getMessage()
        );

        return [
            'success' => false,
            'error' => 'SQL error in stornierteZahlungenReport',
        ];
    }
}

// Что это:
// SQL-отчёт по сторнированным Ausgleichen.
//
// Зачем:
// Берём данные напрямую из БД, без спорной выборки через collection,
// чтобы отчёт стабильно показывал реально сторнированные Ausgleiche.
public function getActionStornierteAusgleicheReport($params, $data, $request)
{
    $this->getAcl()->check('CAusgleich', 'read');

    $em = $this->getEntityManager();
    $pdo = $em->getPDO();

    $von = $request->getQueryParam('von');
    $bis = $request->getQueryParam('bis');

    $where = "
        a.deleted = 0
        AND COALESCE(a.ist_aktiv, 0) = 0
        AND a.ausgleich_status = 'storniert'
    ";

    $bind = [];

    if ($von) {
        $where .= " AND a.storniert_am >= :von ";
        $bind['von'] = $von . ' 00:00:00';
    }

    if ($bis) {
        $where .= " AND a.storniert_am <= :bis ";
        $bind['bis'] = $bis . ' 23:59:59';
    }

    $sql = "
        SELECT
            a.id,
            a.name,
            a.richtung,
            a.ausgleich_typ AS ausgleichTyp,
            a.betrag,
            a.storniert_am AS storniertAm,
            a.storno_grund AS stornoGrund,
            a.rechnung_id AS rechnungId,
            r.rechnungsnummer AS rechnungName,
            a.eingangsrechnung_id AS eingangsrechnungId,
            er.eingangsrechnungsnummer AS eingangsrechnungName,
            a.zahlung_id AS zahlungId,
            z.zahlungsnummer AS zahlungName,
            a.ist_aktiv AS istAktiv,
            a.ausgleich_status AS ausgleichStatus
        FROM c_ausgleich a
        LEFT JOIN c_rechnung r
            ON r.id = a.rechnung_id
            AND r.deleted = 0
        LEFT JOIN c_eingangsrechnung er
            ON er.id = a.eingangsrechnung_id
            AND er.deleted = 0
        LEFT JOIN c_zahlung z
            ON z.id = a.zahlung_id
            AND z.deleted = 0
        WHERE {$where}
        ORDER BY a.storniert_am DESC, a.created_at DESC, a.id DESC
    ";

    try {
        $sth = $pdo->prepare($sql);
        $sth->execute($bind);

        $rows = $sth->fetchAll(\PDO::FETCH_ASSOC) ?: [];

        foreach ($rows as &$row) {
            $row['betrag'] = (float) ($row['betrag'] ?? 0);
            $row['istAktiv'] = (int) ($row['istAktiv'] ?? 0);
        }

        return $rows;
    } catch (\Throwable $e) {
        $this->getContainer()->get('log')->error(
            'CZahlung::getActionStornierteAusgleicheReport error: ' . $e->getMessage()
        );

        return [
            'success' => false,
            'error' => 'SQL error in stornierteAusgleicheReport',
        ];
    }
}
}