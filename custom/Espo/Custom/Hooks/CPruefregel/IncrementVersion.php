<?php

namespace Espo\Custom\Hooks\CPruefregel;

use Espo\ORM\Entity;

/**
 * Что это:
 * Erhöht "version" automatisch bei jeder inhaltlichen Änderung einer Prüfregel.
 *
 * Зачем:
 * 9. Dokument, E-05: Prüfregeln sind versioniert, damit Änderungen am RuleSet nachvollziehbar
 * sind (Fail-Safe-/Audit-Anforderung). "version" wird bewusst nicht editierbar (readOnly) gehalten
 * und ausschließlich hier gesetzt.
 */
class IncrementVersion
{
    private const TRACKED_FIELDS = [
        'regelcode', 'prozesscode', 'zielEntitaet', 'zielStatus',
        'kriteriumTyp', 'teilampel', 'pruefservice', 'feldOderBeziehung',
        'operator', 'erwarteterWert', 'statuswechselBlockieren', 'uebersteuerbar',
        'uebersteuerungsRolleId', 'zustaendigeRolleId', 'aufgabenVorlage',
        'eskalationsregel', 'meldungstext', 'gueltigVon', 'gueltigBis',
    ];

    public function beforeSave(Entity $entity, array $options = []): void
    {
        if ($entity->isNew()) {
            if (!$entity->get('version')) {
                $entity->set('version', 1);
            }
            return;
        }

        foreach (self::TRACKED_FIELDS as $field) {
            if ($entity->isAttributeChanged($field)) {
                $entity->set('version', (int) ($entity->getFetched('version') ?? 1) + 1);
                return;
            }
        }
    }
}
