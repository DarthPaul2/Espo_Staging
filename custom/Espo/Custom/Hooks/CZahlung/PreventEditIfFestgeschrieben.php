<?php

namespace Espo\Custom\Hooks\CZahlung;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Exceptions\Forbidden;

// Что это:
// запрещает обычное редактирование festgeschriebene Zahlung.
//
// Зачем:
// после Festschreibung оплата не должна меняться вручную,
// но служебные system-save должны оставаться возможны.
class PreventEditIfFestgeschrieben
{
    public function __construct(
        private EntityManager $entityManager
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        // Разрешение для внутренних служебных сохранений.
        if (!empty($options['allowFestgeschriebenSave'])) {
            return;
        }

        // Новую запись создавать можно.
        if (!$entity->getId()) {
            return;
        }

        // Состояние записи в базе ДО текущего сохранения.
        $stored = $this->entityManager->getEntity('CZahlung', $entity->getId());
        if (!$stored) {
            return;
        }

        $storedStatus = strtolower((string) ($stored->get('status') ?? ''));

        if ($storedStatus !== 'festgeschrieben') {
            return;
        }

        throw new Forbidden('Festgeschriebene Zahlungen dürfen nicht mehr bearbeitet werden.');
    }
}