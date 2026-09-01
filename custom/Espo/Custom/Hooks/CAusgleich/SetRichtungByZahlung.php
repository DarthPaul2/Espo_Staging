<?php

namespace Espo\Custom\Hooks\CAusgleich;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

/**
 * Что это:
 * Setzt "richtung" (Forderungsausgleich/Verbindlichkeitsausgleich) automatisch anhand der
 * verknüpften Zahlung, analog zu SetZahlungsRichtungByPartner bei CZahlung.
 *
 * Зачем:
 * "richtung" hatte bisher einen festen Default ("forderungsausgleich"), der jede Automatik
 * blockierte, weil das Feld beim Speichern nie wirklich leer war — exakt derselbe Fehler wie
 * bei CZahlung.zahlungsRichtung (26.08.2026 behoben). Ohne Default kann dieser Hook das Feld
 * jetzt zuverlässig aus der Zahlungsrichtung ableiten:
 * Zahlung "eingang" (Kunde zahlt uns) -> Forderungsausgleich
 * Zahlung "ausgang" (wir zahlen Lieferant) -> Verbindlichkeitsausgleich
 */
class SetRichtungByZahlung
{
    public function __construct(
        private EntityManager $entityManager
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        $richtung = (string) ($entity->get('richtung') ?? '');
        if ($richtung !== '') {
            return;
        }

        $zahlungId = $entity->get('zahlungId');
        if (!$zahlungId) {
            return;
        }

        $zahlung = $this->entityManager->getEntity('CZahlung', $zahlungId);
        if (!$zahlung) {
            return;
        }

        $zahlungsRichtung = (string) ($zahlung->get('zahlungsRichtung') ?? '');

        if ($zahlungsRichtung === 'eingang') {
            $entity->set('richtung', 'forderungsausgleich');
        } elseif ($zahlungsRichtung === 'ausgang') {
            $entity->set('richtung', 'verbindlichkeitsausgleich');
        }
    }
}
