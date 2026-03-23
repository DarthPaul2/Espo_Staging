<?php

namespace Espo\Custom\Hooks\CRechnungsposition;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Exceptions\BadRequest;

/**
 * Запрещает сохранять позицию, если Rechnung уже festgeschrieben.
 */
class PreventEditAfterFestschreibung
{
    public function __construct(
        private EntityManager $entityManager
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        // Это ID счета, к которому относится позиция.
        $rechnungId = $entity->get('rechnungId');

        // Если у позиции нет счета, этот hook ничего не запрещает.
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

        // Это жесткий запрет на изменение/добавление позиции.
        throw new BadRequest(
            'Positionen einer festgeschriebenen Rechnung dürfen nicht mehr bearbeitet werden.'
        );
    }
}