<?php

namespace Espo\Custom\Hooks\CBankbewegung;

use Espo\ORM\Entity;

/**
 * Что это:
 * BeforeSave-Hook для CBankbewegung.
 *
 * Зачем:
 * Автоматически нормализует базовые данные банковского движения:
 * - Richtung по Betrag
 * - Name по основным банковским данным
 * - Importiert am
 * - Import-Hash для будущей Dublettenerkennung
 *
 * Важно:
 * Hook НЕ создаёт CZahlung, CAusgleich, CBuchungsjournal или CBuchung.
 * Bankbewegung остаётся только реальной банковской строкой.
 */
class BeforeSave
{
    public function beforeSave(Entity $entity, array $options = []): void
    {
        $this->setRichtungByBetrag($entity);
        $this->setImportiertAm($entity);
        $this->setZuordnungsStatus($entity, $options);
        $this->setName($entity);
        $this->setImportHash($entity);
    }

    /**
     * Что это:
     * Нормализует Betrag и Richtung.
     *
     * Зачем:
     * В бухгалтерской форме Betrag должен быть положительным.
     * Eingang/Ausgang определяется через Richtung.
     *
     * Правило:
     * - если Betrag отрицательный, значит это Ausgang;
     * - Betrag сохраняется как положительное число;
     * - если Betrag положительный и Richtung уже выбрана вручную, она не перезаписывается.
     */
    private function setRichtungByBetrag(Entity $entity): void
    {
        $betrag = (float) ($entity->get('betrag') ?? 0);
        $richtung = (string) ($entity->get('richtung') ?? '');

        if ($betrag < 0) {
            $entity->set('betrag', abs($betrag));
            $entity->set('richtung', 'ausgang');
            return;
        }

        if ($betrag > 0 && $richtung === '') {
            $entity->set('richtung', 'eingang');
        }
    }

    /**
     * Что это:
     * Заполняет Importiert am, если поле пустое.
     *
     * Зачем:
     * Чтобы каждая Bankbewegung имела техническую дату попадания в систему.
     */
    private function setImportiertAm(Entity $entity): void
    {
        if ($entity->get('importiertAm')) {
            return;
        }

        $entity->set('importiertAm', date('Y-m-d H:i:s'));
    }

    /**
     * Что это:
     * Автоматически setzt Status und Abstimmungsstatus,
     * wenn eine Bankbewegung manuell einem fachlichen Objekt zugeordnet wurde.
     *
     * Зачем:
     * Wenn Buchhaltung Kunde, Lieferant, Rechnung, Eingangsrechnung oder Zahlung auswählt,
     * soll die Bankbewegung nicht mehr als völlig offen/importiert erscheinen.
     *
     * Важно:
     * Ignoriert / Nicht relevant und Gebucht werden nicht überschrieben.
     * Außerdem kann diese Logik bei System-Saves gezielt übersprungen werden.
     */
    private function setZuordnungsStatus(Entity $entity, array $options = []): void
    {
        if (!empty($options['skipBankbewegungZuordnungsStatus'])) {
            return;
        }

        $status = (string) ($entity->get('status') ?? '');
        $abstimmungsstatus = (string) ($entity->get('abstimmungsstatus') ?? '');

        if ($status === 'ignoriert' || $abstimmungsstatus === 'nicht_relevant') {
            return;
        }

        if ($abstimmungsstatus === 'gebucht') {
            return;
        }

        $hasZuordnung =
            (bool) $entity->get('zahlungId') ||
            (bool) $entity->get('rechnungId') ||
            (bool) $entity->get('eingangsrechnungId') ||
            (bool) $entity->get('accountId') ||
            (bool) $entity->get('kundeId') ||
            (bool) $entity->get('lieferantId');

        if (!$hasZuordnung) {
            return;
        }

        $entity->set('status', 'manuell_zugeordnet');
        $entity->set('abstimmungsstatus', 'zugeordnet');
    }

    /**
     * Что это:
     * Автоматически формирует Name из текущих данных Bankbewegung.
     *
     * Зачем:
     * Name должен отражать актуальные Richtung, Betrag, Datum und Gegenpartei.
     * Если пользователь позже меняет Richtung с Eingang на Ausgang, Name должен обновиться.
     */
    private function setName(Entity $entity): void
    {
        $buchungstag = (string) ($entity->get('buchungstag') ?? '');
        $betrag = abs((float) ($entity->get('betrag') ?? 0));
        $richtung = (string) ($entity->get('richtung') ?? '');
        $gegenpartei = trim((string) ($entity->get('gegenparteiName') ?? ''));

        $richtungText = 'Bankbewegung';

        if ($richtung === 'eingang') {
            $richtungText = 'Eingang';
        } elseif ($richtung === 'ausgang') {
            $richtungText = 'Ausgang';
        }

        $betragText = number_format($betrag, 2, ',', '.') . ' EUR';

        $parts = [];

        if ($buchungstag !== '') {
            $parts[] = $buchungstag;
        }

        $parts[] = $richtungText;
        $parts[] = $betragText;

        if ($gegenpartei !== '') {
            $parts[] = $gegenpartei;
        }

        $entity->set('name', implode(' · ', $parts));
    }

    /**
     * Что это:
     * Создаёт Import-Hash aus Bankkonto, Buchungstag, Richtung, Betrag,
     * Gegenpartei, IBAN, Verwendungszweck, Bankreferenz und End-to-End-ID.
     *
     * Зачем:
     * Hash должен отражать актуальные technische Bewegungsdaten.
     * Если Richtung/Betrag/Referenz исправлены, Hash тоже должен обновиться.
     */
    private function setImportHash(Entity $entity): void
    {
        $parts = [
            (string) ($entity->get('bankkontoId') ?? ''),
            (string) ($entity->get('buchungstag') ?? ''),
            (string) ($entity->get('richtung') ?? ''),
            number_format(abs((float) ($entity->get('betrag') ?? 0)), 2, '.', ''),
            mb_strtolower(trim((string) ($entity->get('gegenparteiName') ?? ''))),
            mb_strtolower(trim((string) ($entity->get('gegenparteiIban') ?? ''))),
            mb_strtolower(trim((string) ($entity->get('verwendungszweck') ?? ''))),
            mb_strtolower(trim((string) ($entity->get('bankReferenz') ?? ''))),
            mb_strtolower(trim((string) ($entity->get('endToEndId') ?? ''))),
        ];

        $base = implode('|', $parts);

        $entity->set('importHash', hash('sha256', $base));
    }
}