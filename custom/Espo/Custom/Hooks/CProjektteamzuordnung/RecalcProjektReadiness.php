<?php

namespace Espo\Custom\Hooks\CProjektteamzuordnung;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

/**
 * Что это:
 * CProjekt/CalcTeamReadiness (Phase 7, T4-29) berechnet technikerVerfuegbar/
 * technikerQualifikationStatus NUR beim Speichern von CProjekt selbst — läuft also NICHT
 * automatisch neu, wenn danach ein CProjektteamzuordnung-Mitglied hinzugefügt/entfernt wird.
 * Dieser Hook stößt genau das an: nach jedem Speichern/Löschen einer Teamzuordnung wird das
 * zugehörige CProjekt neu gespeichert, damit seine BeforeSave-Hooks neu rechnen.
 *
 * Зачем:
 * PHASE7_TECHSPEC.md, Abschnitt "Hooks", Hinweis zur Hook-Kaskade — ohne das bliebe der
 * Readiness-Status nach Team-Änderungen veraltet.
 */
class RecalcProjektReadiness
{
    public function __construct(
        private EntityManager $entityManager
    ) {}

    public function afterSave(Entity $entity, array $options = []): void
    {
        $this->recalc($entity);
    }

    public function afterRemove(Entity $entity, array $options = []): void
    {
        $this->recalc($entity);
    }

    private function recalc(Entity $entity): void
    {
        $projektId = $entity->get('projektId');
        if (!$projektId) {
            return;
        }

        $projekt = $this->entityManager->getEntityById('CProjekt', $projektId);
        if (!$projekt) {
            return;
        }

        $this->entityManager->saveEntity($projekt, ['skipHooks' => false]);
    }
}
