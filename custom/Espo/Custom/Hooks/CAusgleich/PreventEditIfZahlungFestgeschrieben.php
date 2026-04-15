<?php

namespace Espo\Custom\Hooks\CAusgleich;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Exceptions\Forbidden;

// Что это:
// запрещает обычное редактирование Ausgleich,
// если связанная Zahlung уже festgeschrieben.
//
// Зачем:
// после Festschreibung оплаты нельзя менять состав закрытия вручную,
// но служебные system-save должны оставаться возможны.
class PreventEditIfZahlungFestgeschrieben
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

        // Берём состояние записи из базы ДО текущего сохранения.
        $stored = $this->entityManager->getEntity('CAusgleich', $entity->getId());
        if (!$stored) {
            return;
        }

        $zahlungId = $stored->get('zahlungId');
        if (!$zahlungId) {
            return;
        }

        $zahlung = $this->entityManager->getEntity('CZahlung', $zahlungId);
        if (!$zahlung) {
            return;
        }

        $zahlungStatus = strtolower((string) ($zahlung->get('status') ?? ''));

        if ($zahlungStatus !== 'festgeschrieben') {
            return;
        }

        throw new Forbidden('Ausgleiche einer festgeschriebenen Zahlung dürfen nicht mehr bearbeitet werden.');
    }
}