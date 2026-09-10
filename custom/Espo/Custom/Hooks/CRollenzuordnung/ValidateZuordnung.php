<?php

namespace Espo\Custom\Hooks\CRollenzuordnung;

use Espo\ORM\Entity;
use Espo\Core\Exceptions\BadRequest;

/**
 * Что это:
 * Validiert eine Rollenzuordnung beim Speichern.
 *
 * Зачем:
 * PHASE1_TECHSPEC.md Abschnitt 2 (CRollenzuordnung, T4-01): "gueltigBis" muss nach "gueltigVon"
 * liegen, und eine Person darf nicht ihre eigene Vertretung sein.
 */
class ValidateZuordnung
{
    public function beforeSave(Entity $entity, array $options = []): void
    {
        $von = $entity->get('gueltigVon');
        $bis = $entity->get('gueltigBis');

        if ($von && $bis && $bis < $von) {
            throw new BadRequest('"Gültig bis" muss nach "Gültig von" liegen.');
        }

        $inhaberId = $entity->get('inhaberId');
        $vertreterId = $entity->get('vertreterId');

        if ($inhaberId && $vertreterId && $inhaberId === $vertreterId) {
            throw new BadRequest('Eine Person kann nicht ihre eigene Vertretung sein.');
        }
    }
}
