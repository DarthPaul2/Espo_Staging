<?php

namespace Espo\Custom\Hooks\CEingangsrechnung;

use Espo\ORM\Entity;
use Espo\Core\Exceptions\Forbidden;

// Что это: запрещает обычное редактирование festgeschriebene Eingangsrechnung.
class PreventEditIfFestgeschrieben
{
    public function beforeSave(Entity $entity, array $options = []): void
    {
        // Новую запись создавать можно.
        if ($entity->isNew()) {
            return;
        }

        $status = strtolower((string) ($entity->get('status') ?? ''));

        // Если документ не festgeschrieben, редактирование разрешено.
        if ($status !== 'festgeschrieben') {
            return;
        }

        // Разрешаем только системные изменения через специальные actions,
        // если они явно передадут этот флаг.
        if (!empty($options['allowFestgeschriebenSave'])) {
            return;
        }

        throw new Forbidden('Festgeschriebene Eingangsrechnungen dürfen nicht mehr bearbeitet werden.');
    }
}