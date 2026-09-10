<?php

namespace Espo\Custom\Hooks\Common;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Exceptions\Forbidden;
use Espo\Custom\Core\RuleSet\RuleEvaluator;

/**
 * Что это:
 * Generische Status-Guard-Engine (T4-25, Phase 2 der offiziellen 10-Phasen-Reihenfolge aus dem
 * 9. Dokument). Läuft als Common-Hook bei JEDER Entity-Speicherung, prüft aber nur, wenn für den
 * jeweiligen Entity-Typ überhaupt aktive CPruefregel-Zeilen existieren (Fast-Path sonst).
 *
 * Зачем:
 * TechSpecs/Phase2/PHASE2_TECHSPEC.md — vollständige Herleitung. Kurzfassung: liest CPruefregel,
 * erkennt einen Statuswechsel auf eine überwachte Zielausprägung, wertet feldOderBeziehung/
 * operator/erwarteterWert aus (Service checkRequiredFields) und blockiert bei Verstoß, wenn
 * statuswechselBlockieren=true. Für die 13 anderen, noch nicht implementierten Prüfservices ist
 * das Ergebnis bewusst GREY ("noch nicht berechenbar") und wird wie ein Verstoß blockiert
 * (Fail-Safe-Prinzip aus dem 9. Dokument: nie stillschweigend GREEN).
 *
 * Auswertungslogik seit Phase 3 in Espo\Custom\Core\RuleSet\RuleEvaluator ausgelagert, damit
 * Guard (hier) und Ampel-Aggregation (AmpelAggregationEngine) dieselbe Definition von
 * erfüllt/verletzt/nicht-prüfbar verwenden.
 */
class StatusGuardEngine
{
    public function __construct(
        private EntityManager $entityManager,
        private RuleEvaluator $ruleEvaluator
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        $entityType = $entity->getEntityType();

        if ($entityType === 'CPruefregel') {
            return;
        }

        $rules = $this->loadActiveRules($entityType);
        if (count($rules) === 0) {
            return;
        }

        $byStatusFeld = [];
        foreach ($rules as $rule) {
            $statusFeld = (string) ($rule->get('statusFeld') ?: 'status');
            $byStatusFeld[$statusFeld][] = $rule;
        }

        $violations = [];

        foreach ($byStatusFeld as $statusFeld => $fieldRules) {
            if (!$this->isTransitioningInto($entity, $statusFeld)) {
                continue;
            }

            $currentValue = (string) ($entity->get($statusFeld) ?? '');

            foreach ($fieldRules as $rule) {
                if ((string) $rule->get('zielStatus') !== $currentValue) {
                    continue;
                }

                if (!$rule->get('statuswechselBlockieren')) {
                    continue;
                }

                $eval = $this->ruleEvaluator->evaluate($entity, $rule);
                if ($eval['result'] !== RuleEvaluator::RESULT_OK) {
                    $violations[] = $eval['message'];
                }
            }
        }

        if (count($violations) > 0) {
            throw new Forbidden(implode(' | ', $violations));
        }
    }

    private function loadActiveRules(string $entityType): iterable
    {
        $today = date('Y-m-d');

        return $this->entityManager
            ->getRDBRepository('CPruefregel')
            ->where(['zielEntitaet' => $entityType])
            ->where(['gueltigVon<=' => $today])
            ->where([
                'OR' => [
                    ['gueltigBis' => null],
                    ['gueltigBis>=' => $today],
                ],
            ])
            ->find();
    }

    private function isTransitioningInto(Entity $entity, string $statusFeld): bool
    {
        if ($entity->isNew()) {
            return $entity->get($statusFeld) !== null;
        }

        return $entity->isAttributeChanged($statusFeld);
    }
}
