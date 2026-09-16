<?php

namespace Espo\Custom\Hooks\Common;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Custom\Core\RuleSet\RuleEvaluator;

/**
 * Что это:
 * Ampel-Aggregation (T4-26, Phase 3). Läuft NACH dem Save (AfterSave).
 *
 * Seit Phase 7 (T4-29, TechSpecs/Phase7/PHASE7_TECHSPEC.md, Grundsatzentscheidung "Ampel bei
 * blockiertem Übergang") wird die Ampel NICHT mehr nur dann neu berechnet, wenn das Statusfeld
 * selbst im aktuellen Save geändert wurde — sondern bei JEDEM Save der Entity, für JEDEN
 * zielStatus, für den aktive CPruefregel-Zeilen existieren. Grund: der Pilot-Test von Phase 7
 * deckte auf, dass die alte Logik (nur bei isAttributeChanged(statusFeld) und nur für den
 * aktuellen Wert) dazu führte, dass die Ampel nach einem von StatusGuardEngine (Phase 2,
 * BeforeSave) BLOCKIERTEN Übergangsversuch veraltet (grün) stehen blieb — der Save wird bei
 * einer Blockierung komplett abgebrochen, AfterSave läuft dann gar nicht erst. Das widerspricht
 * dem wörtlichen Beispiel aus dem 9. Dokument, Abschnitt 10: "Gesamtampel = RED. Status
 * „Einsatzbereit" blockieren." — die Ampel soll den aktuellen Bereitschaftsgrad IMMER live
 * zeigen, nicht nur den Zustand nach der letzten erfolgreichen Statusänderung.
 *
 * Зачем:
 * TechSpecs/Phase3/PHASE3_TECHSPEC.md — vollständige Herleitung, wörtliches Zitat 9. Dokument
 * Abschnitt 2 "Ampellogik". Berechnet pro betroffener Teilampel das strengste Ergebnis (Rangfolge
 * RED > GREY > YELLOW > GREEN), aggregiert daraus die Gesamtampel und schreibt das Ergebnis in
 * CAmpelStatus (ein Datensatz pro Ziel-Entity+Ziel-ID+Ziel-Status, wird bei jeder erneuten
 * Prüfung überschrieben — "letzte Prüfung", nicht Verlauf).
 */
class AmpelAggregationEngine
{
    private const RANG = [
        'RED' => 3,
        'GREY' => 2,
        'YELLOW' => 1,
        'GREEN' => 0,
    ];

    private const TEILAMPELN = [
        'technicalReadiness', 'personnelReadiness', 'qualificationReadiness',
        'materialReadiness', 'documentationReadiness', 'customerReadiness',
        'commercialReadiness', 'safetyReadiness',
    ];

    public function __construct(
        private EntityManager $entityManager,
        private RuleEvaluator $ruleEvaluator
    ) {}

    public function afterSave(Entity $entity, array $options = []): void
    {
        $entityType = $entity->getEntityType();

        if ($entityType === 'CPruefregel' || $entityType === 'CAmpelStatus') {
            return;
        }

        $rules = $this->loadActiveRules($entityType);
        if (count($rules) === 0) {
            return;
        }

        $byZielStatus = [];
        foreach ($rules as $rule) {
            $zielStatus = (string) $rule->get('zielStatus');
            if ($zielStatus === '') {
                continue;
            }
            $byZielStatus[$zielStatus][] = $rule;
        }

        foreach ($byZielStatus as $zielStatus => $matchingRules) {
            $this->aggregateAndStore($entity, $zielStatus, $matchingRules);
        }
    }

    private function aggregateAndStore(Entity $entity, string $zielStatus, array $rules): void
    {
        $teilampelResult = [];
        $begruendungen = [];
        $maxVersion = 0;

        $rulesByTeilampel = [];
        foreach ($rules as $rule) {
            $teilampel = (string) $rule->get('teilampel');
            if ($teilampel === '' || !in_array($teilampel, self::TEILAMPELN, true)) {
                continue;
            }
            $rulesByTeilampel[$teilampel][] = $rule;
        }

        if (count($rulesByTeilampel) === 0) {
            return;
        }

        foreach ($rulesByTeilampel as $teilampel => $teilampelRules) {
            $worst = 'GREEN';
            foreach ($teilampelRules as $rule) {
                $eval = $this->ruleEvaluator->evaluate($entity, $rule);
                $farbe = match ($eval['result']) {
                    RuleEvaluator::RESULT_VIOLATION => 'RED',
                    RuleEvaluator::RESULT_GREY => 'GREY',
                    RuleEvaluator::RESULT_WARNING => 'YELLOW',
                    default => 'GREEN',
                };

                if (self::RANG[$farbe] > self::RANG[$worst]) {
                    $worst = $farbe;
                }
                if ($eval['message'] !== null) {
                    $begruendungen[] = $eval['message'];
                }

                $version = (int) ($rule->get('version') ?? 0);
                if ($version > $maxVersion) {
                    $maxVersion = $version;
                }
            }
            $teilampelResult[$teilampel] = $worst;
        }

        $gesamt = 'GREEN';
        foreach ($teilampelResult as $farbe) {
            if (self::RANG[$farbe] > self::RANG[$gesamt]) {
                $gesamt = $farbe;
            }
        }

        $data = [
            'name' => $entity->getEntityType() . ' ' . $entity->getId() . ' — ' . $zielStatus,
            'zielEntitaet' => $entity->getEntityType(),
            'zielId' => $entity->getId(),
            'zielStatus' => $zielStatus,
            'gesamtampel' => $gesamt,
            'begruendung' => implode("\n", $begruendungen),
            'berechnetAm' => date('Y-m-d H:i:s'),
            'ruleSetVersion' => $maxVersion,
        ];
        foreach (self::TEILAMPELN as $t) {
            $data[$t] = $teilampelResult[$t] ?? '';
        }

        // Zusaetzliche echte belongsTo-Verknuepfung fuer CProjekt (10.09.2026) und CRechnung
        // (14.09.2026, gleicher Grund: Pavel wollte den Ampel-Stand sichtbar auf der
        // Detailseite, nicht nur in der DB) — der generische zielEntitaet/zielId-Mechanismus
        // bleibt fuer alle anderen Entity-Typen unveraendert.
        $data['projektId'] = $entity->getEntityType() === 'CProjekt' ? $entity->getId() : null;
        $data['rechnungId'] = $entity->getEntityType() === 'CRechnung' ? $entity->getId() : null;

        // Bekannte, aktuell nicht ausgeloeste Einschraenkung (Phase 7, PHASE7_TECHSPEC.md):
        // CAmpelStatus hat einen Unique-Index nur auf (zielEntitaet, zielId), nicht zusaetzlich
        // auf zielStatus. Existieren fuer denselben Entity-Typ jemals ZWEI unterschiedliche
        // zielStatus-Regelgruppen (aktuell bei keinem Entity-Typ der Fall — CProjekt hat nur
        // "einsatzbereit"), wuerde der zweite aggregateAndStore-Aufruf denselben Datensatz
        // ueberschreiben statt einen eigenen anzulegen. Nicht behoben, da ohne echten
        // Anwendungsfall — dokumentiert statt spekulativ geaendert.
        $existing = $this->entityManager
            ->getRDBRepository('CAmpelStatus')
            ->where([
                'zielEntitaet' => $entity->getEntityType(),
                'zielId' => $entity->getId(),
            ])
            ->findOne();

        if ($existing) {
            foreach ($data as $k => $v) {
                $existing->set($k, $v);
            }
            $this->entityManager->saveEntity($existing);
        } else {
            $this->entityManager->createEntity('CAmpelStatus', $data);
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

}
