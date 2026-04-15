<?php

namespace Espo\Custom\Hooks\CRechnung;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Exceptions\BadRequest;

/**
 * Что это:
 * запрещает обычное редактирование уже festgeschriebene Rechnung.
 *
 * Зачем:
 * чтобы счёт после Festschreibung нельзя было менять вручную,
 * но служебные system-save оставались возможны.
 */
class PreventEditAfterFestschreibung
{
    public function __construct(
        private EntityManager $entityManager
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        // Что это:
        // разрешение для внутренних служебных сохранений.
        //
        // Зачем:
        // Phase 3 должна уметь обновлять restbetragOffen и status
        // у уже festgeschriebene Rechnung после gültigem Ausgleich.
        if (!empty($options['allowFestgeschriebenSave'])) {
            return;
        }

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

        // Это жесткий запрет обычного редактирования.
        throw new BadRequest(
            'Festgeschriebene Rechnungen dürfen nicht mehr bearbeitet werden.'
        );
    }
}