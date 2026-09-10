<?php

namespace Espo\Custom\Core\RuleSet;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

/**
 * Что это:
 * Vertretungs-Resolver (T4-05, TechSpecs/Phase5/PHASE5_TECHSPEC.md). Ermittelt, wer für eine
 * CRollenzuordnung gerade tatsächlich handlungsfähig ist: Inhaber → Vertreter → zweite
 * Eskalationsstufe, je nachdem wer laut CAbwesenheit heute verfügbar ist.
 *
 * Зачем:
 * 1. Dokument Abschnitt 5 / 8. Dokument Abschnitt 4 — "Primär → Vertretung → Eskalation".
 * Bewusst KEIN automatischer Rateschritt darüber hinaus (siehe Fail-Safe-Analogie): wenn niemand
 * verfügbar/konfiguriert ist, liefert der Resolver null statt eine Person zu erfinden — insbesondere
 * wird NIE automatisch eine andere Rolle (z. B. R-02) als Vertretung der Geschäftsführung
 * eingesetzt, wenn das nicht explizit in CRollenzuordnung.vertreter hinterlegt ist.
 */
class VertretungsResolver
{
    public const STUFE_PRIMAER = 'primär';
    public const STUFE_VERTRETUNG = 'Vertretung';
    public const STUFE_ZWEITE_ESKALATION = 'zweite Eskalation';
    public const STUFE_UNGEKLAERT = 'ungeklärt';

    public function __construct(
        private EntityManager $entityManager
    ) {}

    /**
     * @return array{userId: ?string, stufe: string, begruendung: string}
     */
    public function resolveEffectiveUser(Entity $zuordnung): array
    {
        $inhaberId = $zuordnung->get('inhaberId');
        if ($inhaberId && $this->isVerfuegbar($inhaberId)) {
            return [
                'userId' => $inhaberId,
                'stufe' => self::STUFE_PRIMAER,
                'begruendung' => 'Primärinhaber verfügbar.',
            ];
        }

        $vertreterId = $zuordnung->get('vertreterId');
        if ($vertreterId && $this->isVerfuegbar($vertreterId)) {
            return [
                'userId' => $vertreterId,
                'stufe' => self::STUFE_VERTRETUNG,
                'begruendung' => 'Primärinhaber nicht verfügbar, Vertretung übernimmt.',
            ];
        }

        $eskalationId = $zuordnung->get('zweiteEskalationId');
        if ($eskalationId && $this->isVerfuegbar($eskalationId)) {
            return [
                'userId' => $eskalationId,
                'stufe' => self::STUFE_ZWEITE_ESKALATION,
                'begruendung' => 'Primärinhaber und Vertretung nicht verfügbar, zweite Eskalationsstufe übernimmt.',
            ];
        }

        return [
            'userId' => null,
            'stufe' => self::STUFE_UNGEKLAERT,
            'begruendung' => 'Niemand verfügbar oder konfiguriert — keine automatische Zuordnung möglich.',
        ];
    }

    private function isVerfuegbar(string $userId): bool
    {
        $today = date('Y-m-d');

        $aktiveAbwesenheit = $this->entityManager
            ->getRDBRepository('CAbwesenheit')
            ->where(['assignedUserId' => $userId])
            ->where(['typ' => ['U', 'K', 'unbezahlterUrlaub', 'freizeitausgleich']])
            ->where(['status!=' => 'Nicht durchgeführt'])
            ->where(['dateStart<=' => $today])
            ->where(['dateEnd>=' => $today])
            ->findOne();

        return $aktiveAbwesenheit === null;
    }
}
