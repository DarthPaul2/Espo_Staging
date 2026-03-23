<?php

namespace Espo\Custom\Hooks\CRechnung;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Exceptions\BadRequest;

/**
 * Запрещает редактирование уже festgeschriebene Rechnung.
 */
class PreventEditAfterFestschreibung
{
    public function __construct(
        private EntityManager $entityManager
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        // Это защита только для уже существующих записей.
        if (!$entity->getId()) {
            return;
        }

        // Это текущее состояние счета в базе ДО нового сохранения.
        $stored = $this->entityManager->getEntity('CRechnung', $entity->getId());
        if (!$stored) {
            return;
        }

        $alreadyFestgeschrieben = (bool) ($stored->get('istFestgeschrieben') ?? false);
        if (!$alreadyFestgeschrieben) {
            return;
        }

        // Это жесткий запрет любого дальнейшего редактирования.
        throw new BadRequest(
            'Festgeschriebene Rechnungen dürfen nicht mehr bearbeitet werden.'
        );
    }
}