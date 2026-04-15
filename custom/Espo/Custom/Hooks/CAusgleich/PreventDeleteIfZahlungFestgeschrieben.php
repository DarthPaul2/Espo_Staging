<?php

namespace Espo\Custom\Hooks\CAusgleich;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Exceptions\Forbidden;

// Что это:
// запрещает удаление Ausgleich,
// если связанная Zahlung уже festgeschrieben.
//
// Зачем:
// после Festschreibung оплаты нельзя разрушать слой Ausgleich удалением.
class PreventDeleteIfZahlungFestgeschrieben
{
    public function __construct(
        private EntityManager $entityManager
    ) {}

    public function beforeRemove(Entity $entity, array $options = []): void
    {
        $zahlungId = $entity->get('zahlungId');
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

        throw new Forbidden('Ausgleiche einer festgeschriebenen Zahlung dürfen nicht gelöscht werden.');
    }
}