<?php

namespace Espo\Custom\Hooks\CZahlungsavisPosition;

use Espo\ORM\Entity;
use Espo\Custom\Services\CZahlungsavisCalculator;

// Что это: nach dem Löschen/Entfernen einer Position die Gesamt-Summe des Zahlungsavis
// neu berechnen (sonst bliebe eine gelöschte Position in der Summe stehen).
class RecalculateParentTotalsAfterRemove
{
    public function __construct(
        private CZahlungsavisCalculator $calculator
    ) {}

    public function afterRemove(Entity $entity, array $options = []): void
    {
        $zahlungsavisId = $entity->get('zahlungsavisId');

        if (!$zahlungsavisId) {
            return;
        }

        $this->calculator->recalculate($zahlungsavisId);
    }
}
