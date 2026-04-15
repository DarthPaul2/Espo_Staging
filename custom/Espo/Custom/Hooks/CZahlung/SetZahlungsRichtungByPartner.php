<?php

namespace Espo\Custom\Hooks\CZahlung;

use Espo\ORM\Entity;
use Espo\Core\Exceptions\BadRequest;

/**
 * Что это:
 * Автоматически проставляет zahlungsRichtung по выбранному контрагенту.
 *
 * Зачем:
 * Чтобы система сама определяла направление оплаты:
 * account   -> eingang
 * lieferant -> ausgang
 */
class SetZahlungsRichtungByPartner
{
    public function beforeSave(Entity $entity, array $options = []): void
    {
        $accountId = $entity->get('accountId');
        $lieferantId = $entity->get('lieferantId');

        $hasAccount = !empty($accountId);
        $hasLieferant = !empty($lieferantId);

        if (!$hasAccount && !$hasLieferant) {
            throw new BadRequest('Es muss entweder ein Kunde oder ein Lieferant ausgewählt sein.');
        }

        if ($hasAccount && $hasLieferant) {
            throw new BadRequest('Es darf nur entweder ein Kunde oder ein Lieferant ausgewählt werden, nicht beide gleichzeitig.');
        }

        if ($hasAccount) {
            $entity->set('zahlungsRichtung', 'eingang');
            return;
        }

        if ($hasLieferant) {
            $entity->set('zahlungsRichtung', 'ausgang');
        }
    }
}