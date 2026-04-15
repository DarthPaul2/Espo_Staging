<?php

namespace Espo\Custom\Hooks\CEingangsrechnung;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Exceptions\Forbidden;

// Что это:
// запрещает обычное редактирование festgeschriebene Eingangsrechnung.
//
// Зачем:
// после Festschreibung документ нельзя менять вручную,
// но служебные system-save должны оставаться возможны.
class PreventEditIfFestgeschrieben
{
    public function __construct(
        private EntityManager $entityManager
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        // Что это:
        // разрешение для внутренних служебных сохранений.
        if (!empty($options['allowFestgeschriebenSave'])) {
            return;
        }

        // Новую запись создавать можно.
        if (!$entity->getId()) {
            return;
        }

        // Что это:
        // состояние документа в базе ДО текущего сохранения.
        $stored = $this->entityManager->getEntity('CEingangsrechnung', $entity->getId());
        if (!$stored) {
            return;
        }

        $storedStatus = strtolower((string) ($stored->get('status') ?? ''));

        if ($storedStatus !== 'festgeschrieben') {
            return;
        }

        throw new Forbidden('Festgeschriebene Eingangsrechnungen dürfen nicht mehr bearbeitet werden.');
    }
}