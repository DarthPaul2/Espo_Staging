<?php

namespace Espo\Custom\Hooks\CEingangsrechnung;

use Espo\ORM\Entity;

/**
 * Что это:
 * Автоматически ставит Eingangsdatum, если оно пустое.
 *
 * Зачем:
 * Чтобы neue Eingangsrechnungen не падали на Freigabe/Festschreibung,
 * если дата поступления документа не была введена вручную.
 */
class SetEingangsdatumIfEmpty
{
    public function beforeSave(Entity $entity, array $options = []): void
    {
        $eingangsdatum = $entity->get('eingangsdatum');

        if (!empty($eingangsdatum)) {
            return;
        }

        $entity->set('eingangsdatum', date('Y-m-d'));
    }
}