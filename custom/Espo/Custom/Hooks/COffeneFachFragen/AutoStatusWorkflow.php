<?php

namespace Espo\Custom\Hooks\COffeneFachFragen;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

/**
 * Что это:
 * Status-Workflow für Klärungsbedarf Projekt 2030 (temporäres Tool für Tobias, siehe
 * project_coffenefachfragen_tool Memory):
 * 1) Antwort wird eingetragen (Feld antwort füllt sich, Status war "offen") → Status
 *    automatisch auf "beantwortet".
 * 2) Status wird auf "akzeptiert" gesetzt (Antwort final übernommen) → Datensatz wird
 *    automatisch archiviert (Espo-Soft-Delete: verschwindet aus Listen/Dashboard, bleibt
 *    aber vollständig in der Datenbank erhalten — "nur noch in der Historie").
 *
 * Зачем:
 * Auf Wunsch von Pavel (10.09.2026): Antwort erkennen → Status selbst umschalten, statt
 * dass Tobias das manuell nachpflegen muss. Nach Akzeptanz soll die Frage nicht mehr im
 * Weg stehen, aber auch nicht endgültig verloren gehen.
 */
class AutoStatusWorkflow
{
    public function __construct(
        private EntityManager $entityManager
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        if ($entity->get('status') === 'offen' && $entity->isAttributeChanged('antwort')) {
            $antwort = trim((string) ($entity->get('antwort') ?? ''));
            if ($antwort !== '') {
                $entity->set('status', 'beantwortet');
            }
        }
    }

    public function afterSave(Entity $entity, array $options = []): void
    {
        if ($entity->get('status') === 'akzeptiert' && $entity->isAttributeChanged('status')) {
            $this->entityManager->getRDBRepository('COffeneFachFragen')->remove($entity);
        }
    }
}
