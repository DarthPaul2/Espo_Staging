<?php

namespace Espo\Custom\Core\RuleSet;

use Espo\ORM\EntityManager;

/**
 * Что это:
 * Kompetenzmatrix-Resolver (T4-08, TechSpecs/Phase5). Ermittelt die für eine Freigabe
 * erforderliche Rolle: zuerst Risiko-Override-Prüfung (immer R-01 bei gesetzter
 * risikokategorie), sonst Lookup in CFreigabeSchwelle nach vorgangsart+projektbezogen+Betrag.
 *
 * Зачем:
 * 8. Dokument Abschnitt 3: "keine Betragsgrenzen hart im Code" — die Matrix liegt als
 * administrierbare Entity vor (CFreigabeSchwelle), nicht als PHP-Konstanten.
 *
 * Wichtig (siehe TechSpecs/Phase5/PHASE5_TECHSPEC.md, Abschnitt T4-08 "Offene Punkte"):
 * Nur die Zeilen der Original-18-Zeilen-Matrix mit eindeutigem, nicht-kontextabhängigem
 * R-Code UND eindeutiger Vorgangsart/Betrags-Zuordnung sind hier migriert. Mehrere Zeilen
 * (z. B. "zuständiger Fachverantwortlicher", "Technische Materialsubstitution" mit R-11/R-04,
 * "Standard-Kundenvertrag") sind bewusst NICHT automatisiert — dafür liefert der Resolver
 * null mit einer erklärenden Meldung statt zu raten.
 */
class KompetenzmatrixResolver
{
    private const R01 = 'R-01';

    public function __construct(
        private EntityManager $entityManager
    ) {}

    /**
     * @return array{rolleId: ?string, rollencode: ?string, begruendung: string}
     */
    public function resolve(string $vorgangsart, ?float $betrag, array $risikokategorien, ?bool $projektbezogen): array
    {
        if (count($risikokategorien) > 0) {
            $rolle = $this->entityManager->getRDBRepository('CRollenkatalog')
                ->where(['rollencode' => self::R01])
                ->findOne();

            return [
                'rolleId' => $rolle?->getId(),
                'rollencode' => self::R01,
                'begruendung' => 'Risiko-Override: mindestens eine Risikokategorie gesetzt → immer Geschäftsführung, unabhängig vom Betrag.',
            ];
        }

        $query = $this->entityManager->getRDBRepository('CFreigabeSchwelle')
            ->where(['vorgangsart' => $vorgangsart, 'aktiv' => true]);

        $zeilen = $query->find();
        foreach ($zeilen as $zeile) {
            $zeileProjektbezogen = (string) ($zeile->get('projektbezogen') ?? '');
            if ($zeileProjektbezogen !== '' && $projektbezogen !== null) {
                $erwartet = $zeileProjektbezogen === 'ja';
                if ($erwartet !== $projektbezogen) {
                    continue;
                }
            }

            $betragVon = $zeile->get('betragVon');
            $betragBis = $zeile->get('betragBis');
            if ($betrag !== null) {
                if ($betragVon !== null && $betrag < $betragVon) {
                    continue;
                }
                if ($betragBis !== null && $betrag > $betragBis) {
                    continue;
                }
            }

            $rolleId = $zeile->get('erforderlicheRolleId');
            if (!$rolleId) {
                return [
                    'rolleId' => null,
                    'rollencode' => null,
                    'begruendung' => "Matrixregel gefunden (\"" . $zeile->get('name') . "\"), aber Rolle ist kontextabhängig und noch nicht automatisierbar — manuelle Zuordnung nötig.",
                ];
            }

            $rolle = $this->entityManager->getEntityById('CRollenkatalog', $rolleId);

            return [
                'rolleId' => $rolleId,
                'rollencode' => $rolle?->get('rollencode'),
                'begruendung' => 'Kompetenzmatrix-Regel: ' . $zeile->get('name'),
            ];
        }

        return [
            'rolleId' => null,
            'rollencode' => null,
            'begruendung' => 'Keine passende Kompetenzmatrix-Regel gefunden für diesen Vorgang.',
        ];
    }
}
