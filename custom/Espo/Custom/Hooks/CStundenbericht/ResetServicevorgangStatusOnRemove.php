<?php

namespace Espo\Custom\Hooks\CStundenbericht;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

/**
 * Что это:
 * Gegenstück zu CServicevorgang/ResetStatusOnStundenberichtUnrelate.php — für den Fall,
 * dass der letzte verknüpfte CStundenbericht nicht entfernt (unlink), sondern komplett
 * gelöscht wird (z. B. direkt von seiner eigenen Detailseite aus). Auch dann soll der
 * Servicevorgang-Status auf "geplant" zurückfallen, wenn danach keiner mehr übrig ist.
 */
class ResetServicevorgangStatusOnRemove
{
    public function __construct(
        private EntityManager $entityManager
    ) {}

    public function afterRemove(Entity $entity, array $options = []): void
    {
        $servicevorgangId = $entity->get('servicevorgangId');
        if (!$servicevorgangId) {
            return;
        }

        $verbleibend = $this->entityManager
            ->getRDBRepository('CStundenbericht')
            ->where(['servicevorgangId' => $servicevorgangId])
            ->count();

        if ($verbleibend > 0) {
            return;
        }

        $servicevorgang = $this->entityManager->getEntityById('CServicevorgang', $servicevorgangId);
        if (!$servicevorgang) {
            return;
        }

        $servicevorgang->set('status', 'geplant');
        $this->entityManager->saveEntity($servicevorgang);
    }
}
