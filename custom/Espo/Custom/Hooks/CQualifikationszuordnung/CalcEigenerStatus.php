<?php

namespace Espo\Custom\Hooks\CQualifikationszuordnung;

use Espo\ORM\Entity;

/**
 * Что это:
 * Berechnet eigenerStatus (T4-22, TechSpecs/Phase6) rein aus gueltigVon/gueltigBis —
 * isoliert betrachtet, ohne Bezug zu einer konkreten Einsatz-Anforderung.
 *
 * Зачем:
 * Gibt eine schnelle Übersicht ("wessen Qualifikationen laufen bald ab") ohne dass man
 * jedes Mal das Matching starten muss. Der Status IM KONTEXT eines Jobs (inkl.
 * NICHT_ERFORDERLICH/ZWINGEND_NICHT_ERFUELLT) wird separat vom
 * QualifikationsMatchingResolver berechnet, siehe TechSpecs/Phase6/PHASE6_TECHSPEC.md.
 */
class CalcEigenerStatus
{
    private const WARN_TAGE = 30;

    public function beforeSave(Entity $entity, array $options = []): void
    {
        $gueltigBis = $entity->get('gueltigBis');

        if (!$gueltigBis) {
            $entity->set('eigenerStatus', 'GUELTIG');
            return;
        }

        $heute = new \DateTime('today');
        $bis = new \DateTime($gueltigBis);
        $diffTage = (int) $heute->diff($bis)->format('%r%a');

        if ($diffTage < 0) {
            $entity->set('eigenerStatus', 'ABGELAUFEN');
        } elseif ($diffTage <= self::WARN_TAGE) {
            $entity->set('eigenerStatus', 'LAEUFT_BALD_AB');
        } else {
            $entity->set('eigenerStatus', 'GUELTIG');
        }
    }
}
