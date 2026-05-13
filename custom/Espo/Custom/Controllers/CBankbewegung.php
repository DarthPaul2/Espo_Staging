<?php

namespace Espo\Custom\Controllers;

use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\NotFound;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Tools\Api\ActionData;

class CBankbewegung extends \Espo\Core\Controllers\Record
{
    /**
     * Что это:
     * Vorprüfung для Aktion "Zahlung vorbereiten".
     *
     * Зачем:
     * Проверяет, можно ли из Bankbewegung подготовить CZahlung.
     * На этом шаге ещё НЕ создаёт Zahlung, НЕ создаёт Ausgleich и НЕ создаёт Buchungen.
     */
    public function postActionZahlungVorbereitenPruefen(Request $request, Response $response): void
    {
        $data = $request->getParsedBody();

        if (!is_object($data)) {
            throw new BadRequest('No data.');
        }

        $id = $data->id ?? null;

        if (!$id) {
            throw new BadRequest('No Bankbewegung id.');
        }

        $bankbewegung = $this->entityManager->getEntity('CBankbewegung', $id);

        if (!$bankbewegung) {
            throw new NotFound('Bankbewegung not found.');
        }

        $result = $this->buildZahlungVorbereitenPruefung($bankbewegung);

        $response->writeBody(json_encode($result));
    }

        /**
     * Что это:
     * Создаёт CZahlung im Status Entwurf aus einer CBankbewegung.
     *
     * Зачем:
     * Bankbewegung становится Ausgangspunkt für den bestehenden Zahlungsworkflow,
     * но НЕ создаёт Ausgleich, Buchungsjournal или Buchung напрямую.
     */
    public function postActionZahlungAusBankbewegungErstellen(Request $request, Response $response): void
    {
        $data = $request->getParsedBody();

        if (!is_object($data)) {
            throw new BadRequest('No data.');
        }

        $id = $data->id ?? null;

        if (!$id) {
            throw new BadRequest('No Bankbewegung id.');
        }

        $bankbewegung = $this->entityManager->getEntity('CBankbewegung', $id);

        if (!$bankbewegung) {
            throw new NotFound('Bankbewegung not found.');
        }

        $pruefung = $this->buildZahlungVorbereitenPruefung($bankbewegung);

        if (!$pruefung['success']) {
            $response->writeBody(json_encode([
                'success' => false,
                'errors' => $pruefung['errors'],
                'warnings' => $pruefung['warnings'],
            ]));

            return;
        }

        $betrag = abs((float) ($bankbewegung->get('betrag') ?? 0));
        $richtung = (string) ($bankbewegung->get('richtung') ?? '');
        $buchungstag = (string) ($bankbewegung->get('buchungstag') ?? '');

        $zahlung = $this->entityManager->getNewEntity('CZahlung');

        $zahlung->set('status', 'entwurf');
        $zahlung->set('zahlungsRichtung', $richtung);
        $zahlung->set('zahlungsart', 'bank');
        $zahlung->set('bankbezugTyp', 'bank');
        $zahlung->set('betrag', $betrag);

        if ($buchungstag !== '') {
            $zahlung->set('zahlungsdatum', $buchungstag);
        }

        $referenz = trim((string) ($bankbewegung->get('bankReferenz') ?? ''));

        if ($referenz === '') {
            $referenz = trim((string) ($bankbewegung->get('endToEndId') ?? ''));
        }

        if ($referenz === '') {
            $referenz = trim((string) ($bankbewegung->get('name') ?? ''));
        }

        if ($referenz !== '') {
            $zahlung->set('referenz', $referenz);
            $zahlung->set('kontoauszugReferenz', $referenz);
        }

        $bemerkungParts = [];

        $bemerkungParts[] = 'Erstellt aus Bankbewegung: ' . (string) ($bankbewegung->get('name') ?? $bankbewegung->get('id'));

        $verwendungszweck = trim((string) ($bankbewegung->get('verwendungszweck') ?? ''));

        if ($verwendungszweck !== '') {
            $bemerkungParts[] = 'Verwendungszweck: ' . $verwendungszweck;
        }

        $gegenpartei = trim((string) ($bankbewegung->get('gegenparteiName') ?? ''));

        if ($gegenpartei !== '') {
            $bemerkungParts[] = 'Gegenpartei: ' . $gegenpartei;
        }

        $zahlung->set('bemerkung', implode("\n", $bemerkungParts));

        $accountId = (string) ($bankbewegung->get('accountId') ?? '');
        $kundeId = (string) ($bankbewegung->get('kundeId') ?? '');
        $lieferantId = (string) ($bankbewegung->get('lieferantId') ?? '');

        if ($accountId === '' && $kundeId !== '') {
            $accountId = $kundeId;
        }

        if ($accountId === '') {
            $rechnungId = (string) ($bankbewegung->get('rechnungId') ?? '');

            if ($rechnungId !== '') {
                $rechnung = $this->entityManager->getEntity('CRechnung', $rechnungId);

                if ($rechnung) {
                    $accountId = (string) ($rechnung->get('accountId') ?? '');
                }
            }
        }

        if ($lieferantId === '') {
            $eingangsrechnungId = (string) ($bankbewegung->get('eingangsrechnungId') ?? '');

            if ($eingangsrechnungId !== '') {
                $eingangsrechnung = $this->entityManager->getEntity('CEingangsrechnung', $eingangsrechnungId);

                if ($eingangsrechnung) {
                    $lieferantId = (string) ($eingangsrechnung->get('lieferantId') ?? '');
                }
            }
        }

        if ($accountId !== '') {
            $zahlung->set('accountId', $accountId);
        }

        if ($lieferantId !== '') {
            $zahlung->set('lieferantId', $lieferantId);
        }

        $this->entityManager->saveEntity($zahlung);

                // Что это:
        // После первого сохранения у CZahlung уже есть Zahlungsnummer.
        // Поэтому здесь формируем читаемый Name с Partner вместо "Ohne Partner".
        //
        // Зачем:
        // Автонумерация может создать Name до того, как подтянется Account/Lieferant-Name.
        $zahlungsnummer = (string) ($zahlung->get('zahlungsnummer') ?? '');
        $partnerName = '';

        if ($accountId !== '') {
            $account = $this->entityManager->getEntity('Account', $accountId);
            if ($account) {
                $partnerName = (string) ($account->get('name') ?? '');
            }
        }

        if ($partnerName === '' && $lieferantId !== '') {
            $lieferant = $this->entityManager->getEntity('CLieferant', $lieferantId);
            if ($lieferant) {
                $partnerName = (string) ($lieferant->get('name') ?? '');
            }
        }

        if ($partnerName === '') {
            $partnerName = (string) ($bankbewegung->get('gegenparteiName') ?? '');
        }

        if ($partnerName === '') {
            $partnerName = 'Ohne Partner';
        }

        if ($zahlungsnummer !== '') {
            $zahlung->set('name', $zahlungsnummer . ' - ' . $partnerName);
            $this->entityManager->saveEntity($zahlung);
        }

        $bankbewegung->set('zahlungId', $zahlung->get('id'));
        $bankbewegung->set('status', 'manuell_zugeordnet');
        $bankbewegung->set('abstimmungsstatus', 'zugeordnet');

        $hinweis = trim((string) ($bankbewegung->get('zuordnungsHinweis') ?? ''));

        $newHinweis = 'CZahlung im Entwurf aus Bankbewegung erstellt: ' . (string) ($zahlung->get('name') ?? $zahlung->get('zahlungsnummer') ?? $zahlung->get('id'));

        if ($hinweis !== '') {
            $newHinweis = $hinweis . "\n" . $newHinweis;
        }

        $bankbewegung->set('zuordnungsHinweis', $newHinweis);

        $this->entityManager->saveEntity($bankbewegung);

        $response->writeBody(json_encode([
            'success' => true,
            'zahlung' => [
                'id' => $zahlung->get('id'),
                'name' => $zahlung->get('name'),
                'zahlungsnummer' => $zahlung->get('zahlungsnummer'),
                'status' => $zahlung->get('status'),
                'betrag' => $zahlung->get('betrag'),
                'zahlungsRichtung' => $zahlung->get('zahlungsRichtung'),
                'zahlungsdatum' => $zahlung->get('zahlungsdatum'),
            ],
            'bankbewegung' => [
                'id' => $bankbewegung->get('id'),
                'zahlungId' => $bankbewegung->get('zahlungId'),
                'status' => $bankbewegung->get('status'),
                'abstimmungsstatus' => $bankbewegung->get('abstimmungsstatus'),
            ],
            'warnings' => $pruefung['warnings'],
        ]));
    }

    /**
     * Что это:
     * Собирает Prüfresultat für Zahlung vorbereiten.
     *
     * Зачем:
     * Frontend получает понятный ответ:
     * - можно ли готовить Zahlung;
     * - какие Daten будут использованы;
     * - какие fachliche Warnungen есть.
     */
    private function buildZahlungVorbereitenPruefung($bankbewegung): array
    {
        $warnings = [];
        $errors = [];

        $id = (string) $bankbewegung->get('id');
        $name = (string) ($bankbewegung->get('name') ?? '');
        $betrag = (float) ($bankbewegung->get('betrag') ?? 0);
        $richtung = (string) ($bankbewegung->get('richtung') ?? '');
        $status = (string) ($bankbewegung->get('status') ?? '');
        $abstimmungsstatus = (string) ($bankbewegung->get('abstimmungsstatus') ?? '');
        $buchungstag = (string) ($bankbewegung->get('buchungstag') ?? '');

        $zahlungId = (string) ($bankbewegung->get('zahlungId') ?? '');
        $rechnungId = (string) ($bankbewegung->get('rechnungId') ?? '');
        $rechnungName = (string) ($bankbewegung->get('rechnungName') ?? '');
        $eingangsrechnungId = (string) ($bankbewegung->get('eingangsrechnungId') ?? '');
        $eingangsrechnungName = (string) ($bankbewegung->get('eingangsrechnungName') ?? '');

        if ($zahlungId !== '') {
            $errors[] = 'Diese Bankbewegung ist bereits mit einer Zahlung verknüpft.';
        }

        if ($abstimmungsstatus === 'gebucht') {
            $errors[] = 'Diese Bankbewegung ist bereits über eine festgeschriebene Zahlung gebucht.';
        }

        if ($status === 'ignoriert' || $abstimmungsstatus === 'nicht_relevant') {
            $errors[] = 'Diese Bankbewegung ist als nicht relevant markiert.';
        }

        if ($betrag <= 0) {
            $errors[] = 'Betrag muss größer als 0 sein.';
        }

        if ($richtung !== 'eingang' && $richtung !== 'ausgang') {
            $errors[] = 'Richtung muss Eingang oder Ausgang sein.';
        }

        if ($buchungstag === '') {
            $warnings[] = 'Buchungstag ist leer. Zahlungsdatum müsste manuell geprüft werden.';
        }

        if ($rechnungId === '' && $eingangsrechnungId === '') {
            $warnings[] = 'Es ist keine Rechnung oder Eingangsrechnung verknüpft.';
        }

        if ($rechnungId !== '' && $eingangsrechnungId !== '') {
            $errors[] = 'Bankbewegung darf nicht gleichzeitig Rechnung und Eingangsrechnung haben.';
        }

        if ($richtung === 'eingang' && $eingangsrechnungId !== '') {
            $warnings[] = 'Eingang ist mit einer Eingangsrechnung verknüpft. Das kann eine Lieferanten-Rückerstattung sein und muss geprüft werden.';
        }

        if ($richtung === 'ausgang' && $rechnungId !== '') {
            $warnings[] = 'Ausgang ist mit einer Ausgangsrechnung verknüpft. Das kann eine Kunden-Rückzahlung sein und muss geprüft werden.';
        }

        $belegTyp = null;
        $belegId = null;
        $belegName = null;

        if ($rechnungId !== '') {
            $belegTyp = 'rechnung';
            $belegId = $rechnungId;
            $belegName = $rechnungName;
        }

        if ($eingangsrechnungId !== '') {
            $belegTyp = 'eingangsrechnung';
            $belegId = $eingangsrechnungId;
            $belegName = $eingangsrechnungName;
        }

        return [
            'success' => count($errors) === 0,
            'bankbewegung' => [
                'id' => $id,
                'name' => $name,
                'betrag' => $betrag,
                'richtung' => $richtung,
                'buchungstag' => $buchungstag,
                'status' => $status,
                'abstimmungsstatus' => $abstimmungsstatus,
            ],
            'vorschlag' => [
                'zahlungStatus' => 'entwurf',
                'betrag' => $betrag,
                'zahlungsdatum' => $buchungstag,
                'richtung' => $richtung,
                'belegTyp' => $belegTyp,
                'belegId' => $belegId,
                'belegName' => $belegName,
            ],
            'warnings' => $warnings,
            'errors' => $errors,
        ];
    }
}