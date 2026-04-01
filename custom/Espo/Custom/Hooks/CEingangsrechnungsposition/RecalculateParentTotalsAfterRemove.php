<?php

namespace Espo\Custom\Hooks\CEingangsrechnungsposition;

use Espo\ORM\Entity;
use Espo\Custom\Services\CEingangsrechnungCalculator;

// Что это: после удаления позиции пересчитываем суммы шапки входящего счёта.
class RecalculateParentTotalsAfterRemove
{
    public function __construct(
        private CEingangsrechnungCalculator $calculator
    ) {}

    public function afterRemove(Entity $entity, array $options = []): void
    {
        $eingangsrechnungId = $entity->get('eingangsrechnungId');

        if (!$eingangsrechnungId) {
            return;
        }

        $this->calculator->recalculate($eingangsrechnungId);
    }
}