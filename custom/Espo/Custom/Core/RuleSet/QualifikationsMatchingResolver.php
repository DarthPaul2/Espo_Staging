<?php

namespace Espo\Custom\Core\RuleSet;

use Espo\ORM\EntityManager;

/**
 * Что это:
 * Techniker-Qualifikations-Matching (T4-21, TechSpecs/Phase6/PHASE6_TECHSPEC.md).
 * 9-Schritte-Algorithmus wörtlich aus 8. Dokument, Abschnitt 5.1.
 *
 * Зачем:
 * "Die Disposition darf nicht fragen 'Ist Kevin frei?', sondern: welche verfügbaren
 * Mitarbeiter besitzen Rolle+Fachbereich+alle zwingenden Qualifikationen." Liefert pro
 * Kandidat ein Ergebnis MIT Begründung (Pflicht laut Dokument), keine Persistierung
 * (AssignmentResult ist laut Doku ausdrücklich Laufzeit-Berechnung).
 *
 * Bewusste Vereinfachungen/Lücken (siehe Grundsatzentscheidungen 6+7 im Techspec):
 * - Schritt 6 (Standort/Reisezeit): einfacher Regionsvergleich, keine echte Routenberechnung.
 * - Schritt 8 (Azubi-Sonderfall): nicht automatisiert, nur Hinweis — fehlendes Datenmodell,
 *   siehe Dokumentation/OFFENE_FACHFRAGEN.md #5.
 */
class QualifikationsMatchingResolver
{
    private const RANG = ['ZWINGEND_NICHT_ERFUELLT' => 3, 'ABGELAUFEN' => 2, 'LAEUFT_BALD_AB' => 1, 'GUELTIG' => 0];

    public function __construct(
        private EntityManager $entityManager,
        private VerfuegbarkeitsResolver $verfuegbarkeitsResolver
    ) {}

    /**
     * @return array<array{userId: string, name: string, zulaessig: bool, begruendung: string[]}>
     */
    public function finde(
        string $rollencode,
        ?string $fachbereich,
        string $bezugEntitaet,
        string $bezugId,
        ?string $terminDatum = null,
        ?string $regionFilter = null
    ): array {
        // Schritt 1+2: Rolle + Fachbereich
        $kandidatenZuordnungen = $this->entityManager
            ->getRDBRepository('CRollenzuordnung')
            ->where(['status' => 'aktiv'])
            ->join('rolle')
            ->where(['rolle.rollencode' => $rollencode])
            ->find();

        $kandidatenIds = [];
        foreach ($kandidatenZuordnungen as $z) {
            $userId = $z->get('inhaberId');
            if ($userId) {
                $kandidatenIds[$userId] = true;
            }
        }

        if (count($kandidatenIds) === 0) {
            return [];
        }

        // Schritt 3: MUST/SHOULD-Qualifikationen für diesen Bezug laden
        $anforderungen = $this->entityManager
            ->getRDBRepository('CQualifikationsanforderung')
            ->where(['bezugEntitaet' => $bezugEntitaet, 'bezugId' => $bezugId])
            ->find();

        $ergebnisse = [];

        foreach (array_keys($kandidatenIds) as $userId) {
            $user = $this->entityManager->getEntityById('User', $userId);
            if (!$user) {
                continue;
            }

            $begruendung = [];
            $zulaessig = true;

            // Schritt 2: Fachbereich pruefen
            if ($fachbereich) {
                $userFachbereiche = $user->get('fachbereich') ?? [];
                if (!in_array($fachbereich, $userFachbereiche, true)) {
                    continue; // Basisfilter, kein Kandidat
                }
                $begruendung[] = "$fachbereich erfüllt";
            }
            $begruendung[] = "$rollencode erfüllt";

            // Schritt 4+5: Qualifikationen pruefen
            foreach ($anforderungen as $anf) {
                $status = $this->pruefeQualifikation($userId, $anf->get('qualifikationId'));
                $qualEntity = $anf->get('qualifikationId')
                    ? $this->entityManager->getEntityById('CQualifikation', $anf->get('qualifikationId'))
                    : null;
                $qualName = $qualEntity ? $qualEntity->get('name') : '(unbekannte Qualifikation)';
                $typ = $anf->get('anforderungsTyp');

                if ($status === 'GUELTIG') {
                    $begruendung[] = "$qualName gültig";
                    continue;
                }

                if ($status === 'ABGELAUFEN' || $status === 'LAEUFT_BALD_AB') {
                    if ($typ === 'EXTERNAL_MUST') {
                        $zulaessig = false;
                        $begruendung[] = "nicht zulässig: zwingende Qualifikation $qualName $status";
                    } else {
                        $begruendung[] = "Warnung: $qualName $status (kein Block, da nicht EXTERNAL_MUST)";
                    }
                    continue;
                }

                // status === 'FEHLT'
                if ($typ === 'MUST' || $typ === 'EXTERNAL_MUST') {
                    $zulaessig = false;
                    $begruendung[] = "nicht zulässig: $qualName fehlt (" . $typ . ")";
                } else {
                    $begruendung[] = "Hinweis: $qualName (SHOULD) fehlt";
                }
            }

            // Schritt 6: Standort/Region (vereinfacht)
            if ($regionFilter) {
                $userStandort = (string) ($user->get('standort') ?? '');
                if ($userStandort !== '' && stripos($userStandort, $regionFilter) === false) {
                    $begruendung[] = "Hinweis: Standort '$userStandort' weicht von '$regionFilter' ab";
                }
            }

            // Schritt 7: Verfuegbarkeit
            if ($terminDatum) {
                if (!$this->verfuegbarkeitsResolver->istVerfuegbar($userId, $terminDatum)) {
                    $zulaessig = false;
                    $begruendung[] = 'nicht verfügbar am ' . $terminDatum;
                } else {
                    $begruendung[] = 'verfügbar am ' . $terminDatum;
                }
            }

            // Schritt 8: Azubi-Sonderfall — nur Hinweis, siehe OFFENE_FACHFRAGEN.md #5
            if ($rollencode === 'R-18') {
                $begruendung[] = 'Azubi (R-18) — Aufsicht/Ausbildungsstand manuell prüfen (nicht automatisiert)';
            }

            $ergebnisse[] = [
                'userId' => $userId,
                'name' => $user->get('name'),
                'zulaessig' => $zulaessig,
                'begruendung' => $begruendung,
            ];
        }

        return $ergebnisse;
    }

    /**
     * Ermittelt den Qualifikationsstatus eines Mitarbeiters für EINE Qualifikation
     * (T4-22): GUELTIG / LAEUFT_BALD_AB / ABGELAUFEN / FEHLT.
     *
     * Sichtbarkeit seit Phase 7 (T4-29, TechSpecs/Phase7/PHASE7_TECHSPEC.md, Grundsatzentscheidung 4)
     * von private auf public angehoben, damit CProjekt/CalcTeamReadiness dieselbe Logik
     * wiederverwendet, statt sie ein zweites Mal zu implementieren.
     */
    public function pruefeQualifikation(string $userId, ?string $qualifikationId): string
    {
        if (!$qualifikationId) {
            return 'FEHLT';
        }

        $zuordnung = $this->entityManager
            ->getRDBRepository('CQualifikationszuordnung')
            ->where(['mitarbeiterId' => $userId, 'qualifikationId' => $qualifikationId])
            ->order('gueltigBis', 'DESC')
            ->findOne();

        if (!$zuordnung) {
            return 'FEHLT';
        }

        return (string) $zuordnung->get('eigenerStatus');
    }
}
