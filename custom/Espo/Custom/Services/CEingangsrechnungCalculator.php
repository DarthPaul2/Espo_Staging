<?php

namespace Espo\Custom\Services;

use Espo\ORM\EntityManager;

// Что это: сервис пересчитывает итоговые суммы входящего счёта по всем его позициям.
class CEingangsrechnungCalculator
{
    public function __construct(private EntityManager $em) {}

    public function recalculate(string $eingangsrechnungId): void
    {
        $eingangsrechnung = $this->em->getEntityById('CEingangsrechnung', $eingangsrechnungId);

        if (!$eingangsrechnung) {
            return;
        }

        $positionList = $this->em
            ->getRDBRepository('CEingangsrechnungsposition')
            ->where([
                'eingangsrechnungId' => $eingangsrechnungId,
                'deleted' => false,
            ])
            ->find();

        $betragNetto = 0.0;

        foreach ($positionList as $position) {
            $betragNetto += (float) ($position->get('gesamtNetto') ?? 0);
        }

        $betragNetto = round($betragNetto, 2);

        $steuerfall = $eingangsrechnung->get('steuerfall');
        $steuerBetrag = 0.0;

        if ($steuerfall === 'ust19') {
            $steuerBetrag = round($betragNetto * 0.19, 2);
        } elseif ($steuerfall === 'ust7') {
            $steuerBetrag = round($betragNetto * 0.07, 2);
        }

        $betragBrutto = round($betragNetto + $steuerBetrag, 2);

        $eingangsrechnung->set('betragNetto', $betragNetto);
        $eingangsrechnung->set('steuerBetrag', $steuerBetrag);
        $eingangsrechnung->set('betragBrutto', $betragBrutto);

        $this->em->saveEntity($eingangsrechnung);
    }
}