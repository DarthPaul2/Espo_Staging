<?php
namespace Espo\Custom\Hooks\CEingangsrechnung;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

class DeleteRelatedPositionen
{
    public function __construct(private EntityManager $em) {}

    public function beforeRemove(Entity $entity, array $options = []): void
    {
        // Что это: ID удаляемого входящего счёта.
        // Зачем: нужно удалить все связанные позиции этого CEingangsrechnung.
        $eingangsrechnungId = $entity->getId();

        if (!$eingangsrechnungId) {
            return;
        }

        $positionen = $this->em
            ->getRDBRepository('CEingangsrechnungsposition')
            ->where(['eingangsrechnungId' => $eingangsrechnungId])
            ->find();

        foreach ($positionen as $position) {
            // Что это: удаляем каждую связанную позицию.
            // Зачем: чтобы не оставались сиротские строки после удаления шапки.
            $this->em->removeEntity($position);
        }
    }
}