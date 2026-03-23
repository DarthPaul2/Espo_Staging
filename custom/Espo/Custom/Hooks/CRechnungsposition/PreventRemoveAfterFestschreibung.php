<?php

namespace Espo\Custom\Hooks\CRechnungsposition;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Exceptions\BadRequest;

/**
 * Запрещает удалять позицию, если Rechnung уже festgeschrieben.
 */
class PreventRemoveAfterFestschreibung
{
    public function __construct(
        private EntityManager $entityManager
    ) {}

    public function beforeRemove(Entity $entity, array $options = []): void
    {
        // Это ID счета, к которому относится позиция.
        $rechnungId = $entity->get('rechnungId');

        if (!$rechnungId) {
            return;
        }

        $rechnung = $this->entityManager->getEntity('CRechnung', $rechnungId);
        if (!$rechnung) {
            return;
        }

        $isFestgeschrieben = (bool) ($rechnung->get('istFestgeschrieben') ?? false);
        if (!$isFestgeschrieben) {
            return;
        }

        // Это жесткий запрет на удаление позиции.
        throw new BadRequest(
            'Positionen einer festgeschriebenen Rechnung dürfen nicht mehr gelöscht werden.'
        );
    }
}