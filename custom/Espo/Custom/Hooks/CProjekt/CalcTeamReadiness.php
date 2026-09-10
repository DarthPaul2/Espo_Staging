<?php

namespace Espo\Custom\Hooks\CProjekt;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Custom\Core\RuleSet\VerfuegbarkeitsResolver;
use Espo\Custom\Core\RuleSet\QualifikationsMatchingResolver;

/**
 * Что это:
 * Berechnet zwei readOnly-Felder auf CProjekt (T4-29, TechSpecs/Phase7/PHASE7_TECHSPEC.md):
 * - technikerVerfuegbar: sind ALLE CProjektteamzuordnung-Mitglieder zum einsatzTermin verfügbar?
 * - technikerQualifikationStatus: schlechtester Qualifikationsstatus über alle Mitglieder ×
 *   CQualifikationsanforderung (bezugEntitaet=CProjekt, bezugId=dieses Projekt).
 *
 * Зачем:
 * Reproduziert die "Techniker verfügbar" / "Herstellerqualifikation"-Kriterien aus dem
 * wörtlichen Beispiel im 9. Dokument, Abschnitt 10 — als vorberechnete Felder, damit die
 * generische CPruefregel-Auswertung (checkRequiredFields) sie wie jedes andere Feld prüfen
 * kann, ohne einen neuen Dispatch-Zweig in RuleEvaluator zu brauchen
 * (Grundsatzentscheidung 3, PHASE7_TECHSPEC.md).
 */
class CalcTeamReadiness
{
    private const QUALI_RANG = [
        'FEHLT' => 3,
        'ABGELAUFEN' => 3,
        'LAEUFT_BALD_AB' => 1,
        'GUELTIG' => 0,
    ];

    public function __construct(
        private EntityManager $entityManager,
        private VerfuegbarkeitsResolver $verfuegbarkeitsResolver,
        private QualifikationsMatchingResolver $qualifikationsMatchingResolver
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        $teamMitgliederIds = $this->ladeTeamMitgliederIds($entity);

        $this->calcTechnikerVerfuegbar($entity, $teamMitgliederIds);
        $this->calcTechnikerQualifikationStatus($entity, $teamMitgliederIds);
    }

    /**
     * @return string[] User-IDs aller CProjektteamzuordnung-Mitglieder dieses Projekts.
     */
    private function ladeTeamMitgliederIds(Entity $entity): array
    {
        $projektId = $entity->getId();
        if (!$projektId) {
            return [];
        }

        $zuordnungen = $this->entityManager
            ->getRDBRepository('CProjektteamzuordnung')
            ->where(['projektId' => $projektId])
            ->find();

        $ids = [];
        foreach ($zuordnungen as $zuordnung) {
            $mitarbeiterId = $zuordnung->get('mitarbeiterId');
            if ($mitarbeiterId) {
                $ids[] = $mitarbeiterId;
            }
        }

        return $ids;
    }

    private function calcTechnikerVerfuegbar(Entity $entity, array $teamMitgliederIds): void
    {
        $termin = $entity->get('einsatzTermin');

        if (!$termin || count($teamMitgliederIds) === 0) {
            $entity->set('technikerVerfuegbar', '');
            return;
        }

        foreach ($teamMitgliederIds as $userId) {
            if (!$this->verfuegbarkeitsResolver->istVerfuegbar($userId, $termin)) {
                $entity->set('technikerVerfuegbar', 'nein');
                return;
            }
        }

        $entity->set('technikerVerfuegbar', 'ja');
    }

    private function calcTechnikerQualifikationStatus(Entity $entity, array $teamMitgliederIds): void
    {
        $projektId = $entity->getId();
        if (!$projektId || count($teamMitgliederIds) === 0) {
            $entity->set('technikerQualifikationStatus', '');
            return;
        }

        $anforderungen = $this->entityManager
            ->getRDBRepository('CQualifikationsanforderung')
            ->where(['bezugEntitaet' => 'CProjekt', 'bezugId' => $projektId])
            ->find();

        $qualifikationIds = [];
        foreach ($anforderungen as $anforderung) {
            $qId = $anforderung->get('qualifikationId');
            if ($qId) {
                $qualifikationIds[] = $qId;
            }
        }

        if (count($qualifikationIds) === 0) {
            $entity->set('technikerQualifikationStatus', '');
            return;
        }

        $schlechtesterStatus = 'GUELTIG';
        $schlechtesterRang = 0;

        foreach ($teamMitgliederIds as $userId) {
            foreach ($qualifikationIds as $qualifikationId) {
                $status = $this->qualifikationsMatchingResolver->pruefeQualifikation($userId, $qualifikationId);
                $rang = self::QUALI_RANG[$status] ?? 0;

                if ($rang > $schlechtesterRang) {
                    $schlechtesterRang = $rang;
                    $schlechtesterStatus = $status;
                }
            }
        }

        $entity->set('technikerQualifikationStatus', $schlechtesterStatus);
    }
}
