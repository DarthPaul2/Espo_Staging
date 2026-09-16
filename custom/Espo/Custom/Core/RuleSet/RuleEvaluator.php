<?php

namespace Espo\Custom\Core\RuleSet;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

/**
 * Что это:
 * Gemeinsame Auswertungslogik für eine einzelne CPruefregel-Zeile gegen eine Entity.
 * Wird von StatusGuardEngine (Phase 2, BeforeSave-Block) UND AmpelAggregationEngine
 * (Phase 3, AfterSave-Aggregation) verwendet, damit beide dieselbe Definition von
 * "Regel erfüllt/verletzt/nicht prüfbar" benutzen (TechSpecs/Phase3, Grundsatzentscheidung 6).
 *
 * Seit Phase 4 (T4-27, TechSpecs/Phase4/PHASE4_TECHSPEC.md) implementiert: checkRequiredFields
 * (generischer Feldvergleich), checkRoleAssignment und checkSubstitution (beide gegen
 * CRollenzuordnung). Die übrigen 11 Prüfservices bleiben GREY — die dafür nötigen Entities
 * (Qualifikation, Projekt/Servicevorgang, offene Punkte, Dokument-Verknüpfung, Duplikate)
 * existieren noch nicht (siehe Blocker-Tabelle in PHASE4_TECHSPEC.md).
 *
 * Зачем:
 * Ohne diese Auslagerung müsste die Operator-Vergleichslogik zweimal gepflegt werden —
 * Risiko, dass Guard und Ampel-Anzeige bei einer künftigen Änderung auseinanderlaufen.
 */
class RuleEvaluator
{
    private const IMPLEMENTED_SERVICES = ['checkRequiredFields', 'checkRoleAssignment', 'checkSubstitution'];

    public const RESULT_OK = 'OK';
    public const RESULT_VIOLATION = 'VIOLATION';
    public const RESULT_WARNING = 'WARNING';
    public const RESULT_GREY = 'GREY';

    public function __construct(
        private EntityManager $entityManager
    ) {}

    /**
     * @return array{result: string, message: ?string}
     */
    public function evaluate(Entity $entity, Entity $rule): array
    {
        $service = (string) $rule->get('pruefservice');

        if (!in_array($service, self::IMPLEMENTED_SERVICES, true)) {
            $regelcode = (string) $rule->get('regelcode');
            return [
                'result' => self::RESULT_GREY,
                'message' => "[$regelcode] kann noch nicht geprüft werden (Prüfservice noch nicht implementiert).",
            ];
        }

        return match ($service) {
            'checkRoleAssignment' => $this->evaluateRoleAssignment($entity, $rule, false),
            'checkSubstitution' => $this->evaluateRoleAssignment($entity, $rule, true),
            default => $this->evaluateRequiredFields($entity, $rule),
        };
    }

    private function evaluateRequiredFields(Entity $entity, Entity $rule): array
    {
        $feld = (string) ($rule->get('feldOderBeziehung') ?? '');
        if ($feld === '') {
            return ['result' => self::RESULT_OK, 'message' => null];
        }

        $operator = (string) ($rule->get('operator') ?? 'existiert');
        $erwarteterWert = (string) ($rule->get('erwarteterWert') ?? '');
        $istWert = $entity->get($feld);

        $ok = $this->compare($istWert, $operator, $erwarteterWert);
        if ($ok) {
            return ['result' => self::RESULT_OK, 'message' => null];
        }

        $wert = is_scalar($istWert) ? (string) $istWert : json_encode($istWert);
        return $this->violation($rule, $wert ?? '');
    }

    /**
     * checkRoleAssignment: prüft, ob der über feldOderBeziehung referenzierte User aktuell als
     * inhaber einer aktiven CRollenzuordnung mit rolle.rollencode = erwarteterWert geführt wird.
     * checkSubstitution (gleicher Lookup, $requireVertreter=true): prüft zusätzlich, ob diese
     * CRollenzuordnung ein gesetztes vertreter-Feld hat.
     */
    private function evaluateRoleAssignment(Entity $entity, Entity $rule, bool $requireVertreter): array
    {
        $feld = (string) ($rule->get('feldOderBeziehung') ?? '');
        $rollencode = (string) ($rule->get('erwarteterWert') ?? '');

        if ($feld === '' || $rollencode === '') {
            $regelcode = (string) $rule->get('regelcode');
            return [
                'result' => self::RESULT_GREY,
                'message' => "[$regelcode] Regel unvollständig konfiguriert (feldOderBeziehung/erwarteterWert fehlt).",
            ];
        }

        $userId = $entity->get($feld);
        if (!$userId) {
            return $this->violation($rule, '(kein User zugeordnet)');
        }

        $today = date('Y-m-d');
        $zuordnung = $this->entityManager
            ->getRDBRepository('CRollenzuordnung')
            ->where(['inhaberId' => $userId, 'status' => 'aktiv'])
            ->where(['gueltigVon<=' => $today])
            ->where([
                'OR' => [
                    ['gueltigBis' => null],
                    ['gueltigBis>=' => $today],
                ],
            ])
            ->join('rolle')
            ->where(['rolle.rollencode' => $rollencode])
            ->findOne();

        if (!$zuordnung) {
            return $this->violation($rule, "(keine aktive Zuordnung zu $rollencode)");
        }

        if ($requireVertreter && !$zuordnung->get('vertreterId')) {
            return $this->violation($rule, '(keine Vertretung konfiguriert)');
        }

        return ['result' => self::RESULT_OK, 'message' => null];
    }

    private function violation(Entity $rule, string $wert): array
    {
        $kriteriumTyp = (string) $rule->get('kriteriumTyp');
        $regelcode = (string) $rule->get('regelcode');
        $meldungstext = (string) ($rule->get('meldungstext') ?: 'Prüfregel verletzt.');
        $message = str_replace('{wert}', $wert, $meldungstext) . " Regel: [$regelcode]";

        $isMust = in_array($kriteriumTyp, ['MUST', 'EXTERNAL_MUST'], true);

        return [
            'result' => $isMust ? self::RESULT_VIOLATION : self::RESULT_WARNING,
            'message' => $message,
        ];
    }

    private function compare(mixed $istWert, string $operator, string $erwarteterWert): bool
    {
        $isEmpty = $istWert === null || $istWert === '';

        return match ($operator) {
            'existiert' => !$isEmpty,
            'existiertNicht' => $isEmpty,
            'enthaltenIn' => in_array((string) $istWert, array_map('trim', explode(',', $erwarteterWert)), true),
            'nichtEnthaltenIn' => !in_array((string) $istWert, array_map('trim', explode(',', $erwarteterWert)), true),
            '=' => (string) $istWert === $erwarteterWert,
            '!=' => (string) $istWert !== $erwarteterWert,
            '>' => is_numeric($istWert) && is_numeric($erwarteterWert) && (float) $istWert > (float) $erwarteterWert,
            '<' => is_numeric($istWert) && is_numeric($erwarteterWert) && (float) $istWert < (float) $erwarteterWert,
            '>=' => is_numeric($istWert) && is_numeric($erwarteterWert) && (float) $istWert >= (float) $erwarteterWert,
            '<=' => is_numeric($istWert) && is_numeric($erwarteterWert) && (float) $istWert <= (float) $erwarteterWert,
            default => true,
        };
    }
}
