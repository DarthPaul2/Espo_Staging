<?php

namespace Espo\Custom\Hooks\Opportunity;

use Espo\ORM\Entity;
use Espo\Core\Exceptions\BadRequest;

/**
 * Что это:
 * AW-Bianca-Gerd Punkt 10 (19.09.2026), nach P-03-Spezifikation (Tobias und ChatGPT.txt,
 * Zeile 8528: "Nicht jeder Mitarbeiter darf nach Bauchgefühl einen attraktiven Kunden ablehnen" —
 * "strukturierte Gründe" gefordert). Serverseitige Absicherung neben der clientseitigen
 * Pflichtfeld-Markierung (clientDefs/Opportunity.json dynamicLogic).
 */
class RequireNoGoGrund
{
    public function beforeSave(Entity $entity, array $options = []): void
    {
        if ($entity->get('qualifizierungsErgebnis') !== 'noGo') {
            return;
        }

        $grund = $entity->get('noGoGrund');

        if (!$grund) {
            throw new BadRequest('Bei "NO-GO" muss ein strukturierter Grund angegeben werden.');
        }
    }
}
