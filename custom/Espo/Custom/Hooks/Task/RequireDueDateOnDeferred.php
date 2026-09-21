<?php

namespace Espo\Custom\Hooks\Task;

use Espo\ORM\Entity;
use Espo\Core\Exceptions\BadRequest;

/**
 * Что это:
 * AW-Bianca-Gerd Punkt 3 (19.09.2026): "Bei einer Verschiebung muss die neue
 * Fälligkeit eingetragen werden können." — serverseitige Absicherung neben der
 * clientseitigen Pflichtfeld-Markierung (clientDefs/Task.json dynamicLogic),
 * damit eine Aufgabe nie ohne neues Fälligkeitsdatum als "Verschoben" (Deferred)
 * gespeichert werden kann, auch nicht über die API direkt.
 */
class RequireDueDateOnDeferred
{
    public function beforeSave(Entity $entity, array $options = []): void
    {
        if ($entity->get('status') !== 'Deferred') {
            return;
        }

        if (!$entity->get('dateEnd')) {
            throw new BadRequest('Bei "Verschoben" muss eine neue Fälligkeit angegeben werden.');
        }
    }
}
