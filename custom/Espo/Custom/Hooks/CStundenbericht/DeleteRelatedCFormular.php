<?php

namespace Espo\Custom\Hooks\CStundenbericht;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

class DeleteRelatedCFormular
{
    private EntityManager $em;

    public function __construct(EntityManager $em)
    {
        $this->em = $em;
    }

    public function afterRemove(Entity $entity, array $options = []): void
    {
        $sbId = $entity->getId();
        if (!$sbId) {
            return;
        }

        $repo = $this->em->getRDBRepository('CFormular');

        $collection = $repo->where([
            'formularberichteId' => $sbId
        ])->find();

        foreach ($collection as $cf) {
            $repo->remove($cf);
        }
    }
}
