<?php

namespace Espo\Custom\Hooks\CAngebotsposition;

use Espo\ORM\Entity;

/**
 * Что это:
 * Berechnet margeProzent = (preis - einkaufspreis) / preis * 100 (T4-08, TechSpecs/Phase5).
 *
 * Зачем:
 * Macht die Marge-Ampel-Schwelle (8. Dokument Abschnitt 2: Grün≥30%/Gelb25-29,9%/Rot<25%) zu
 * einem ganz normalen CPruefregel-Eintrag (feldOderBeziehung=margeProzent) statt eigenem
 * Prüfservice — die Schwelle bleibt dadurch administrierbar ohne Code-Änderung.
 */
class CalcMargeProzent
{
    public function beforeSave(Entity $entity, array $options = []): void
    {
        $preis = $entity->get('preis');
        $einkaufspreis = $entity->get('einkaufspreis');

        if ($preis === null || $preis == 0.0 || $einkaufspreis === null) {
            $entity->set('margeProzent', null);
            return;
        }

        $marge = ($preis - $einkaufspreis) / $preis * 100;
        $entity->set('margeProzent', round($marge, 2));
    }
}
