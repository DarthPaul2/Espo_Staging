<?php

namespace Espo\Custom\Hooks\CServicevorgang;

use Espo\ORM\Entity;
use Espo\Core\Exceptions\BadRequest;

/**
 * Что это:
 * Prueft typspezifische Pflichtfelder abhaengig von "vorgangsart" beim Speichern.
 *
 * Зачем:
 * SERVICEVORGANG_TECHSPEC.md: bei Notdienst muss der Anrufer erfassbar sein, bei
 * Gewaehrleistung muss ein Bezugsauftrag vorhanden sein. Standard-Service bleibt bewusst
 * schlank (keine Zusatzpflichtfelder), siehe Techspec "Standard-Serviceeinsatz bleibt schlank".
 */
class ValidateVorgangsart
{
    public function beforeSave(Entity $entity, array $options = []): void
    {
        $art = $entity->get('vorgangsart');

        if ($art === 'notdienst') {
            $name = trim((string) $entity->get('anruferName'));
            $telefon = trim((string) $entity->get('anruferTelefon'));

            if ($name === '' || $telefon === '') {
                throw new BadRequest('Bei Notdienst müssen Anrufer-Name und Anrufer-Telefon angegeben werden.');
            }
        }

        if ($art === 'gewaehrleistung') {
            if (!$entity->get('bezugAuftragId')) {
                throw new BadRequest('Bei Gewährleistung muss ein Bezugs-Auftrag angegeben werden.');
            }
        }
    }
}
