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

        // Что это: Rundungsdifferenz-Korrektur — siehe ausführlichen Kommentar in
        // CEingangsrechnung::postActionFestschreiben (identische Logik, zwei Aufrufstellen: hier
        // bei jedem Positions-Speichern, dort zusätzlich direkt vor der Festschreibung).
        $quellImportList = $this->em
            ->getRDBRepository('CEingangsrechnungImport')
            ->where([
                'eingangsrechnungId' => $eingangsrechnungId,
                'deleted' => false,
            ])
            ->find();

        if ($quellImportList && count($quellImportList)) {
            $quellImport = $quellImportList[0];
            $importBrutto = $quellImport->get('betragBrutto');
            $diff = $importBrutto !== null ? abs($betragBrutto - (float) $importBrutto) : null;

            if ($diff !== null && $diff > 0 && $diff <= 0.02) {
                $betragNetto = (float) $quellImport->get('betragNetto');
                $steuerBetrag = (float) $quellImport->get('steuerBetrag');
                $betragBrutto = (float) $importBrutto;
            }
        }

        $eingangsrechnung->set('betragNetto', $betragNetto);
        $eingangsrechnung->set('steuerBetrag', $steuerBetrag);
        $eingangsrechnung->set('betragBrutto', $betragBrutto);

        $this->em->saveEntity($eingangsrechnung);
    }
}