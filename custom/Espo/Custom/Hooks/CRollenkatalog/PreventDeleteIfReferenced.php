<?php

namespace Espo\Custom\Hooks\CRollenkatalog;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\ORM\Repository\Option\RemoveOptions;
use Espo\Core\Hook\Hook\BeforeRemove;
use Espo\Core\Exceptions\Forbidden;

/**
 * Что это:
 * Verhindert das Löschen einer Rolle aus dem Rollenkatalog, solange sie noch aktiv
 * über CRollenzuordnung besetzt ist.
 *
 * Зачем:
 * PHASE1_TECHSPEC.md Abschnitt 1 (CRollenkatalog, T4-01) — Espo verhindert das Soft-Delete
 * einer referenzierten Rolle standardmäßig NICHT (per Test am 09.09.2026 bestätigt), das würde
 * bestehende CRollenzuordnung-Datensätze auf eine "unsichtbare" Rolle verweisen lassen.
 */
class PreventDeleteIfReferenced implements BeforeRemove
{
    public function __construct(
        private EntityManager $entityManager
    ) {}

    public function beforeRemove(Entity $entity, RemoveOptions $options): void
    {
        $count = $this->entityManager
            ->getRDBRepository('CRollenzuordnung')
            ->where([
                'rolleId' => $entity->getId(),
                'status' => 'aktiv',
            ])
            ->count();

        if ($count > 0) {
            throw new Forbidden(
                'Diese Rolle wird noch von ' . $count . ' aktiver Rollenzuordnung referenziert und kann nicht gelöscht werden. ' .
                'Bitte zuerst die Zuordnung(en) beenden (Status "inaktiv") oder die Rolle stattdessen auf "Aktiv" = nein setzen.'
            );
        }
    }
}
