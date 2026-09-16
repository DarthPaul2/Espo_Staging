<?php
namespace Espo\Custom\Hooks\Task;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Utils\Log;

/**
 * Protokolliert Zuweisungswechsel einer Wartungs-Aufgabe (Task mit cWartungId)
 * auf der zugehörigen CWartung: Bemerkung bekommt eine neue Zeile ("wann -> wer"),
 * bestehender Text bleibt erhalten. Das Feld "Verantwortlich" (CWartung.user)
 * wird auf den aktuell zugewiesenen Benutzer aktualisiert.
 *
 * 16.09.2026, auf Pavels Wunsch — damit im Nachhinein sichtbar ist, wann eine
 * Aufgabe von Kevin an einen Techniker übergeben wurde (Espo-Stream zeigt es
 * zwar auch, aber nicht direkt auf der Wartung selbst).
 */
class WartungAssignmentTracking
{
    public function __construct(
        private EntityManager $em,
        private Log $log
    ) {}

    public function afterSave(Entity $entity, array $options = []): void
    {
        try {
            // Nur bei tatsächlicher Umzuweisung reagieren, nicht beim Erstanlegen
            // (da liegt die Aufgabe ohnehin immer erst bei Kevin, siehe wartung_check()).
            if ($entity->isNew()) {
                return;
            }

            if (!$entity->isAttributeChanged('assignedUserId')) {
                return;
            }

            $wartungId = $entity->get('cWartungId');
            if (empty($wartungId)) {
                return;
            }

            $wartung = $this->em->getEntity('CWartung', $wartungId);
            if (!$wartung) {
                return;
            }

            $newUserId = $entity->get('assignedUserId');
            $newUserName = null;

            if ($newUserId) {
                $user = $this->em->getEntity('User', $newUserId);
                $newUserName = $user ? $user->get('name') : null;
            }

            $zeitstempel = (new \DateTime())->format('d.m.Y H:i');
            $zeile = $newUserName
                ? "{$zeitstempel} — Aufgabe zugewiesen an {$newUserName}"
                : "{$zeitstempel} — Zuweisung entfernt";

            $bemerkung = trim((string) $wartung->get('bemerkung'));
            $bemerkung = $bemerkung !== '' ? ($bemerkung . "\n\n" . $zeile) : $zeile;

            $wartung->set('bemerkung', $bemerkung);
            $wartung->set('userId', $newUserId ?: null);

            $this->em->saveEntity($wartung);

            $this->log->info(
                "[WartungAssignmentTracking] CWartung {$wartungId}: Bemerkung ergänzt, Verantwortlich={$newUserName}"
            );

        } catch (\Throwable $e) {
            $this->log->error('[WartungAssignmentTracking] Exception: ' . $e->getMessage());
        }
    }
}
