<?php

namespace Espo\Custom\Controllers;

use Espo\Core\Templates\Controllers\Base;
use Espo\ORM\Entity;
use Espo\Core\Exceptions\NotFound;

class CAngebot extends Base
{
    protected function buildPayload(Entity $entity): array
    {
        return [
            'id' => $entity->getId(),
            'titel' => $entity->get('name'),
            'einleitung' => $entity->get('einleitungstext'),
            'bemerkung' => $entity->get('bemerkung'),
            'betrag_netto' => $entity->get('netto'),
            'betrag_brutto' => $entity->get('brutto'),
            'steuer' => $entity->get('steuer'),
            'kunde' => $entity->get('accountName'),
            'strasse' => $entity->get('strasse'),
            'hausnummer' => $entity->get('hausnummer'),
            'plz' => $entity->get('plz'),
            'ort' => $entity->get('ort'),
            'angebotsnummer' => $entity->get('name'),
            'servicenummer' => $entity->get('serviceNummer'),
            'kundennummer' => $entity->get('kundennummer'),
            'gueltig_bis' => $entity->get('gueltigBis'),
            'datum' => $entity->get('createdAt'),
            'leistungsdatum_von' => $entity->get('leistungsdatumVon'),
            'leistungsdatum_bis' => $entity->get('leistungsdatumBis'),
            'typ' => 'angebot',
            'positionen' => json_decode($entity->get('positionen') ?? '[]', true),
        ];
    }

}
