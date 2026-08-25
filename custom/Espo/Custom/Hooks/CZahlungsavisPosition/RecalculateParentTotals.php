<?php

namespace Espo\Custom\Hooks\CZahlungsavisPosition;

use Espo\ORM\Entity;
use Espo\Custom\Services\CZahlungsavisCalculator;

// Что это: после сохранения (Create/Edit/Unlink) einer Position wird die Gesamt-Summe
// des zugehörigen Zahlungsavis neu berechnet.
class RecalculateParentTotals
{
    public function __construct(
        private CZahlungsavisCalculator $calculator
    ) {}

    public function afterSave(Entity $entity, array $options = []): void
    {
        $zahlungsavisId = $entity->get('zahlungsavisId');

        if (!$zahlungsavisId) {
            return;
        }

        $this->calculator->recalculate($zahlungsavisId);
    }
}
