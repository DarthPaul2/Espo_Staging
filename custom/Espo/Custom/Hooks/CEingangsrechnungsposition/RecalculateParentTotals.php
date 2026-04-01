<?php

namespace Espo\Custom\Hooks\CEingangsrechnungsposition;

use Espo\ORM\Entity;
use Espo\Custom\Services\CEingangsrechnungCalculator;

// Что это: после сохранения позиции пересчитываем шапку связанного входящего счёта.
class RecalculateParentTotals
{
    public function __construct(
        private CEingangsrechnungCalculator $calculator
    ) {}

    public function afterSave(Entity $entity, array $options = []): void
    {
        $eingangsrechnungId = $entity->get('eingangsrechnungId');

        if (!$eingangsrechnungId) {
            return;
        }

        $this->calculator->recalculate($eingangsrechnungId);
    }
}