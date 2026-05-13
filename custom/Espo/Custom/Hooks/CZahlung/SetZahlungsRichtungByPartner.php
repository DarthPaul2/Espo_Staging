<?php

namespace Espo\Custom\Hooks\CZahlung;

use Espo\ORM\Entity;
use Espo\Core\Exceptions\BadRequest;

/**
 * Что это:
 * Проверяет выбранного контрагента у CZahlung и задаёт Richtung только как Default.
 *
 * Зачем:
 * Kunde/Lieferant определяют сторону контрагента, но не всегда направление денег.
 * Возможны:
 * - Kunde + Eingang  = Kunde bezahlt Rechnung
 * - Kunde + Ausgang  = Rückzahlung an Kunde
 * - Lieferant + Ausgang = Zahlung an Lieferant
 * - Lieferant + Eingang = Rückerstattung vom Lieferanten
 */
class SetZahlungsRichtungByPartner
{
    public function beforeSave(Entity $entity, array $options = []): void
    {
        $accountId = $entity->get('accountId');
        $lieferantId = $entity->get('lieferantId');
        $zahlungsRichtung = (string) ($entity->get('zahlungsRichtung') ?? '');

        $hasAccount = !empty($accountId);
        $hasLieferant = !empty($lieferantId);

        if (!$hasAccount && !$hasLieferant) {
            throw new BadRequest('Es muss entweder ein Kunde oder ein Lieferant ausgewählt sein.');
        }

        if ($hasAccount && $hasLieferant) {
            throw new BadRequest('Es darf nur entweder ein Kunde oder ein Lieferant ausgewählt werden, nicht beide gleichzeitig.');
        }

        if ($zahlungsRichtung !== '' && !in_array($zahlungsRichtung, ['eingang', 'ausgang'], true)) {
            throw new BadRequest('Zahlungsrichtung muss Eingang oder Ausgang sein.');
        }

        // Если Richtung уже явно установлена, например из Bankbewegung,
        // не перезаписываем её.
        if ($zahlungsRichtung !== '') {
            return;
        }

        // Default nur für manuelle Zahlungen ohne gesetzte Richtung.
        if ($hasAccount) {
            $entity->set('zahlungsRichtung', 'eingang');
            return;
        }

        if ($hasLieferant) {
            $entity->set('zahlungsRichtung', 'ausgang');
        }
    }
}