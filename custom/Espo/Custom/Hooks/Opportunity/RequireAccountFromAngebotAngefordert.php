<?php

namespace Espo\Custom\Hooks\Opportunity;

use Espo\ORM\Entity;
use Espo\Core\Exceptions\BadRequest;

/**
 * Что это:
 * AW-Bianca-Gerd Punkt 11 (19.09.2026): "Erst wenn der im Prozess festgelegte Punkt erreicht
 * wurde... insbesondere beim Übergang zu 'Angebot angefordert'" — ab dieser Stufe muss ein
 * echter, verknüpfter Kunde (Account) vorhanden sein, statt nur der freien Adresse/Kontaktdaten-
 * Felder auf der Chance selbst. Serverseitige Absicherung neben der clientseitigen
 * Pflichtfeld-Markierung (clientDefs/Opportunity.json dynamicLogic).
 *
 * Die Dublettenprüfung selbst ist bereits nativ vorhanden — Account nutzt das Company-Template
 * mit duplicateCheckFieldList=["name","emailAddress"], keine eigene Logik nötig.
 */
class RequireAccountFromAngebotAngefordert
{
    private const SPAETE_STUFEN = [
        'interessentAngebotAngefordert',
        'interessentAngebotInErstellung',
        'kaeuferAngebotErhalten',
        'kundeInDisposition',
        'kundeLeistungserbringung',
        'bestandskunde',
    ];

    public function beforeSave(Entity $entity, array $options = []): void
    {
        $stufe = $entity->get('stage');

        if (!in_array($stufe, self::SPAETE_STUFEN, true)) {
            return;
        }

        if (!$entity->get('accountId')) {
            throw new BadRequest('Ab der Stufe "Angebot angefordert" muss ein echter Kunde (Firma) verknüpft sein.');
        }
    }
}
