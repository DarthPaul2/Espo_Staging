<?php

namespace Espo\Custom\Hooks\CRechnung;

use Espo\ORM\Entity;
use Espo\Core\Exceptions\BadRequest;

/**
 * Запрещает удалять уже festgeschriebene Rechnung.
 */
class PreventRemoveAfterFestschreibung
{
    public function beforeRemove(Entity $entity, array $options = []): void
    {
        // Это проверка: если счет уже festgeschrieben, удаление запрещаем.
        $isFestgeschrieben = (bool) ($entity->get('istFestgeschrieben') ?? false);
        $buchhaltungStatus = strtolower((string) ($entity->get('buchhaltungStatus') ?? ''));

        if ($isFestgeschrieben || $buchhaltungStatus === 'festgeschrieben') {
            throw new BadRequest(
                'Festgeschriebene Rechnungen dürfen nicht gelöscht werden.'
            );
        }
    }
}