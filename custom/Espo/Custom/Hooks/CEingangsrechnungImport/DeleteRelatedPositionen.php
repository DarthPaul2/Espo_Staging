<?php
namespace Espo\Custom\Hooks\CEingangsrechnungImport;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

class DeleteRelatedPositionen
{
    public function __construct(private EntityManager $em) {}

    public function beforeRemove(Entity $entity, array $options = []): void
    {
        // Что это: ID удаляемого import-документа.
        // Зачем: нужно удалить все связанные import-позиции.
        $importId = $entity->getId();

        if (!$importId) {
            return;
        }

        $positionen = $this->em
            ->getRDBRepository('CEingangsrechnungImportPosition')
            ->where(['eingangsrechnungImportId' => $importId])
            ->find();

        foreach ($positionen as $position) {
            // Что это: удаляем каждую связанную import-позицию.
            // Зачем: чтобы не оставались сиротские строки после удаления import-шапки.
            $this->em->removeEntity($position);
        }
    }
}