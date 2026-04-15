<?php

namespace Espo\Custom\Hooks\CZahlung;

use Espo\ORM\Entity;
use Espo\Core\Exceptions\Forbidden;

// Что это:
// запрещает удаление festgeschriebene Zahlung.
//
// Зачем:
// после Festschreibung оплата не должна удаляться обычным способом.
class PreventDeleteIfFestgeschrieben
{
    public function beforeRemove(Entity $entity, array $options = []): void
    {
        $status = strtolower((string) ($entity->get('status') ?? ''));

        if ($status !== 'festgeschrieben') {
            return;
        }

        throw new Forbidden('Festgeschriebene Zahlungen dürfen nicht gelöscht werden.');
    }
}