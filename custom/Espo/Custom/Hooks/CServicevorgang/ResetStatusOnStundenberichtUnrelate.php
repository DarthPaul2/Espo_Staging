<?php

namespace Espo\Custom\Hooks\CServicevorgang;

use Espo\Core\Hook\Hook\AfterUnrelate;
use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\ORM\Repository\Option\UnrelateOptions;

/**
 * Что это:
 * Setzt den Servicevorgang-Status zurück auf "geplant", wenn nach dem Entfernen einer
 * Stundenbericht-Verknüpfung KEIN Stundenbericht mehr übrig ist (15.09.2026, auf Pavels
 * Wunsch — Gegenstück zu AdvanceStatusOnStundenberichtRelate.php: wenn kein Beleg für
 * geleistete Arbeit mehr existiert, soll der Status das auch nicht mehr behaupten).
 *
 * Bewusst OHNE Rücksicht auf den aktuellen Status (im Gegensatz zum Vorwärts-Hook) —
 * der letzte Beleg ist weg, das ist ein eindeutiges Signal.
 */
class ResetStatusOnStundenberichtUnrelate implements AfterUnrelate
{
    public function __construct(
        private EntityManager $entityManager
    ) {}

    public function afterUnrelate(
        Entity $entity,
        string $relationName,
        Entity $relatedEntity,
        UnrelateOptions $options
    ): void {
        if ($relationName !== 'stundenberichte' || $entity->getEntityType() !== 'CServicevorgang') {
            return;
        }

        $verbleibend = $this->entityManager
            ->getRDBRepository('CStundenbericht')
            ->where(['servicevorgangId' => $entity->getId()])
            ->count();

        if ($verbleibend > 0) {
            return;
        }

        $entity->set('status', 'geplant');
        $this->entityManager->saveEntity($entity);
    }
}
