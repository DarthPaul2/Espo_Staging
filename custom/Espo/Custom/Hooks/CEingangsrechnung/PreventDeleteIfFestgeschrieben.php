<?php

namespace Espo\Custom\Hooks\CEingangsrechnung;

use Espo\ORM\Entity;
use Espo\Core\Exceptions\Forbidden;

// Что это: запрещает удаление festgeschriebene Eingangsrechnung.
class PreventDeleteIfFestgeschrieben
{
    public function beforeRemove(Entity $entity, array $options = []): void
    {
        $status = strtolower((string) ($entity->get('status') ?? ''));

        if ($status !== 'festgeschrieben') {
            return;
        }

        throw new Forbidden('Festgeschriebene Eingangsrechnungen dürfen nicht gelöscht werden.');
    }
}