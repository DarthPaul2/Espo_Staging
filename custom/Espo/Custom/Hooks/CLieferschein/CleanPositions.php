<?php
namespace Espo\Custom\Hooks\CLieferschein;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

class CleanPositions
{
    public function __construct(
        private EntityManager $em
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        // Проверяем: если был Auftrag, а теперь убрали
        if ($entity->isAttributeChanged('auftragId') && !$entity->get('auftragId')) {
            $lieferscheinId = $entity->getId();

            if ($lieferscheinId) {
                $positions = $this->em->getRepository('CLieferscheinposition')
                    ->where(['lieferscheinId' => $lieferscheinId])
                    ->find();

                foreach ($positions as $pos) {
                    $this->em->removeEntity($pos);
                }
            }
        }
    }
}
