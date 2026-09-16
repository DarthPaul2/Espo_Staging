<?php

namespace Espo\Custom\Hooks\CServicevorgang;

use Espo\Core\Hook\Hook\AfterRelate;
use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\ORM\Repository\Option\RelateOptions;

/**
 * Что это:
 * Gleiche Statuslogik wie CStundenbericht/AdvanceServicevorgangStatus.php — aber für den
 * Fall, dass ein BEREITS EXISTIERENDER CStundenbericht über den "Auswählen"-Knopf im
 * Stundenberichte-Panel verknüpft wird (nicht neu angelegt). Nötig, weil
 * getRelation(...)->relate() auf DB-Mapper-Ebene läuft und KEIN CStundenbericht.afterSave
 * auslöst (15.09.2026 live entdeckt — Bericht neu angeheftet, Status blieb stehen).
 */
class AdvanceStatusOnStundenberichtRelate implements AfterRelate
{
    private const REIHENFOLGE = [
        'neu', 'geprueft', 'geplant', 'inArbeit', 'rueckfrageMaterial', 'abgeschlossen', 'abrechnungsfaehig',
    ];

    public function __construct(
        private EntityManager $entityManager
    ) {}

    public function afterRelate(
        Entity $entity,
        string $relationName,
        Entity $relatedEntity,
        array $columnData,
        RelateOptions $options
    ): void {
        if ($relationName !== 'stundenberichte' || $entity->getEntityType() !== 'CServicevorgang') {
            return;
        }

        $aktuellerIndex = array_search((string) $entity->get('status'), self::REIHENFOLGE, true);
        $rueckfrageIndex = array_search('rueckfrageMaterial', self::REIHENFOLGE, true);

        if ($aktuellerIndex === false || $aktuellerIndex >= $rueckfrageIndex) {
            return;
        }

        $zielStatus = match (true) {
            (bool) $relatedEntity->get('auftragAbgeschlossen') => 'abgeschlossen',
            (bool) $relatedEntity->get('restarbeiten') || (bool) $relatedEntity->get('neuerTermin') => 'rueckfrageMaterial',
            default => 'inArbeit',
        };
        $zielIndex = array_search($zielStatus, self::REIHENFOLGE, true);

        if ($zielIndex === false || $zielIndex <= $aktuellerIndex) {
            return;
        }

        $entity->set('status', $zielStatus);
        $this->entityManager->saveEntity($entity);
    }
}
