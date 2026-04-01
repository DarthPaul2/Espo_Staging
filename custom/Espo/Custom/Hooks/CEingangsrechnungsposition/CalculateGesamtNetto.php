<?php

namespace Espo\Custom\Hooks\CEingangsrechnungsposition;

use Espo\ORM\Entity;

// Что это: перед сохранением позиции автоматически считаем netto-сумму строки.
class CalculateGesamtNetto
{
    public function beforeSave(Entity $entity, array $options = []): void
    {
        $menge = (float) ($entity->get('menge') ?? 0);
        $einzelpreisNetto = (float) ($entity->get('einzelpreisNetto') ?? 0);

        $gesamtNetto = round($menge * $einzelpreisNetto, 2);

        $entity->set('gesamtNetto', $gesamtNetto);
    }
}