<?php
namespace Espo\Custom\Hooks\CEingangsrechnungsposition;

use Espo\ORM\Entity;

class RecalculateTotals
{
    public function beforeSave(Entity $entity, array $options = []): void
    {
        $menge = $entity->get('menge');
        $einzelpreisNetto = $entity->get('einzelpreisNetto');
        $rabattProzent = $entity->get('rabattProzent');

        if ($menge === null || $einzelpreisNetto === null) {
            return;
        }

        $menge = (float)$menge;
        $einzelpreisNetto = (float)$einzelpreisNetto;
        $rabattProzent = $rabattProzent !== null ? (float)$rabattProzent : 0.0;

        if ($rabattProzent < 0) {
            $rabattProzent = 0.0;
        }

        $zeilenNettoVorRabatt = $menge * $einzelpreisNetto;
        $rabattBetrag = round($zeilenNettoVorRabatt * $rabattProzent / 100, 2);
        $gesamtNetto = round($zeilenNettoVorRabatt - $rabattBetrag, 2);

        $entity->set('rabattBetrag', $rabattBetrag);
        $entity->set('gesamtNetto', $gesamtNetto);
    }
}