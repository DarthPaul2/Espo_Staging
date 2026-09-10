<?php

namespace Espo\Custom\Hooks\CFreigabe;

use Espo\ORM\Entity;
use Espo\Custom\Core\RuleSet\KompetenzmatrixResolver;

/**
 * Что это:
 * Setzt CFreigabe.erforderlicheRolle automatisch über die Kompetenzmatrix (T4-08), sobald
 * freigabeArt/betrag/risikokategorie bekannt sind — außer bereits manuell überschrieben.
 * Setzt zusätzlich entscheidungAm automatisch beim Statuswechsel auf freigegeben/abgelehnt.
 *
 * Зачем:
 * TechSpecs/Phase5/PHASE5_TECHSPEC.md, T4-07 Hooks-Abschnitt.
 */
class SetErforderlicheRolle
{
    public function __construct(
        private KompetenzmatrixResolver $resolver
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        $this->maybeRecalcRolle($entity);
        $this->maybeSetEntscheidungAm($entity);
    }

    private function maybeRecalcRolle(Entity $entity): void
    {
        $sourceChanged = $entity->isNew()
            || $entity->isAttributeChanged('freigabeArt')
            || $entity->isAttributeChanged('betrag')
            || $entity->isAttributeChanged('risikokategorie');

        if (!$sourceChanged) {
            return;
        }

        // Manuelle Überschreibung respektieren: wurde erforderlicheRolle in DIESEM Save
        // eigenständig (zusätzlich zu den Quellfeldern) mitgesetzt, nicht überschreiben.
        if ($entity->isAttributeChanged('erforderlicheRolleId')) {
            return;
        }

        $freigabeArt = (string) ($entity->get('freigabeArt') ?? '');
        if ($freigabeArt === '') {
            return;
        }

        $betrag = $entity->get('betrag');
        $risikokategorien = $entity->get('risikokategorie') ?? [];

        $result = $this->resolver->resolve(
            $freigabeArt,
            $betrag !== null ? (float) $betrag : null,
            is_array($risikokategorien) ? $risikokategorien : [],
            null
        );

        $entity->set('erforderlicheRolleId', $result['rolleId']);
    }

    private function maybeSetEntscheidungAm(Entity $entity): void
    {
        if (!$entity->isAttributeChanged('status')) {
            return;
        }

        $status = $entity->get('status');
        if (in_array($status, ['freigegeben', 'abgelehnt'], true) && !$entity->get('entscheidungAm')) {
            $entity->set('entscheidungAm', date('Y-m-d H:i:s'));
        }
    }
}
