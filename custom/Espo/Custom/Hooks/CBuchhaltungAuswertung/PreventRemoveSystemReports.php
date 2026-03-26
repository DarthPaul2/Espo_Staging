<?php

namespace Espo\Custom\Hooks\CBuchhaltungAuswertung;

use Espo\ORM\Entity;
use Espo\ORM\Repository\Option\RemoveOptions;
use Espo\Core\Hook\Hook\BeforeRemove;

class PreventRemoveSystemReports implements BeforeRemove
{
    public function beforeRemove(Entity $entity, RemoveOptions $options): void
    {
        $auswertungTyp = (string) ($entity->get('auswertungTyp') ?? '');

        $protectedTypes = [
            'festgeschriebene_rechnungen',
            'umsatzuebersicht',
            'umsatzsteuer_uebersicht',
            'offene_forderungen',
            'kontenbewegungen',
        ];

        if (in_array($auswertungTyp, $protectedTypes, true)) {
            throw new Forbidden('System-Auswertungen dürfen nicht gelöscht werden.');
        }
    }
}