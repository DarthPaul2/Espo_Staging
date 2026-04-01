<?php

namespace Espo\Custom\Hooks\CEingangsrechnungsposition;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Exceptions\Forbidden;

// Что это: запрещает добавление и редактирование позиции,
// если родительская Eingangsrechnung уже festgeschrieben.
class PreventEditIfParentFestgeschrieben
{
    public function __construct(private EntityManager $em) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        $eingangsrechnungId = $entity->get('eingangsrechnungId');

        if (!$eingangsrechnungId) {
            return;
        }

        $eingangsrechnung = $this->em->getEntityById('CEingangsrechnung', $eingangsrechnungId);

        if (!$eingangsrechnung) {
            return;
        }

        $status = strtolower((string) ($eingangsrechnung->get('status') ?? ''));

        if ($status !== 'festgeschrieben') {
            return;
        }

        throw new Forbidden('Positionen einer festgeschriebenen Eingangsrechnung dürfen nicht mehr bearbeitet werden.');
    }
}