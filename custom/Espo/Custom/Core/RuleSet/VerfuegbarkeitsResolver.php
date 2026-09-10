<?php

namespace Espo\Custom\Core\RuleSet;

use Espo\ORM\EntityManager;

/**
 * Что это:
 * Verfügbarkeits-Sicht (T4-20, TechSpecs/Phase6). KEINE neue Entity — führt bestehende
 * Daten zusammen: CAbwesenheit (Urlaub/Krankheit, bereits von VertretungsResolver aus
 * Phase 5 genutzt) + native Task-Belegung (dateStart/dateEnd/assignedUser).
 *
 * Зачем:
 * 8. Dokument, Abschnitt 5.3: "Availability — nicht neu bauen, sondern Sicht auf
 * bestehende CAbwesenheit + Task-Belegung". Wortwörtliche Umsetzung dieser Vorgabe.
 */
class VerfuegbarkeitsResolver
{
    public function __construct(
        private EntityManager $entityManager
    ) {}

    public function istVerfuegbar(string $userId, string $terminDatum): bool
    {
        return $this->keineAbwesenheit($userId, $terminDatum) && $this->keineTaskBelegung($userId, $terminDatum);
    }

    private function keineAbwesenheit(string $userId, string $terminDatum): bool
    {
        $treffer = $this->entityManager
            ->getRDBRepository('CAbwesenheit')
            ->where(['assignedUserId' => $userId])
            ->where(['typ' => ['U', 'K', 'unbezahlterUrlaub', 'freizeitausgleich']])
            ->where(['status!=' => 'Nicht durchgeführt'])
            ->where(['dateStart<=' => $terminDatum])
            ->where(['dateEnd>=' => $terminDatum])
            ->findOne();

        return $treffer === null;
    }

    private function keineTaskBelegung(string $userId, string $terminDatum): bool
    {
        $treffer = $this->entityManager
            ->getRDBRepository('Task')
            ->where(['assignedUserId' => $userId])
            ->where(['status!=' => ['Completed', 'Canceled']])
            ->where(['dateStartDate<=' => $terminDatum])
            ->where(['dateEndDate>=' => $terminDatum])
            ->findOne();

        return $treffer === null;
    }
}
