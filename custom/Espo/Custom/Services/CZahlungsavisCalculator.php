<?php

namespace Espo\Custom\Services;

use Espo\ORM\EntityManager;

// Что это: пересчитывает Gesamt-Summe des Zahlungsavis anhand seiner Positionen.
class CZahlungsavisCalculator
{
    public function __construct(private EntityManager $em) {}

    public function recalculate(string $zahlungsavisId): void
    {
        $zahlungsavis = $this->em->getEntityById('CZahlungsavis', $zahlungsavisId);

        if (!$zahlungsavis) {
            return;
        }

        $positionList = $this->em
            ->getRDBRepository('CZahlungsavisPosition')
            ->where([
                'zahlungsavisId' => $zahlungsavisId,
                'deleted' => false,
            ])
            ->find();

        $betragGesamt = 0.0;

        foreach ($positionList as $position) {
            $betragGesamt += (float) ($position->get('zahlung') ?? 0);
        }

        $zahlungsavis->set('betragGesamt', round($betragGesamt, 2));

        $this->em->saveEntity($zahlungsavis);
    }
}
