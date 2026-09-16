<?php

namespace Espo\Custom\Controllers;

use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Templates\Controllers\Base;
use Espo\Custom\Core\RuleSet\QualifikationsMatchingResolver;
use Espo\Custom\Core\RuleSet\VerfuegbarkeitsResolver;

/**
 * Что это:
 * Minimaler Einstiegspunkt für den bisher toten QualifikationsMatchingResolver::finde()
 * (T4-21, TechSpecs/Phase6/PHASE6_TECHSPEC.md) — vom Audit am 11.09.2026 als "fertiger
 * Code ohne Aufrufer" identifiziert (project_phases1-8_audit_11-09.md). Pavel hat sich am
 * 14.09.2026 bewusst für die minimale Variante entschieden (Knopf + einfache Liste),
 * nicht für eine volle Dispositions-Oberfläche.
 *
 * Зачем:
 * "Passenden Techniker finden" auf CProjekt: Rollencode (Pflicht) + optional Fachbereich/
 * Termin/Region eingeben, Ergebnis ist eine reine Laufzeit-Anzeige (keine Persistierung,
 * wie im 8. Dokument für AssignmentResult vorgegeben).
 */
class CProjekt extends Base
{
    use \Espo\Custom\Traits\HasEntityManagerCompat;

    public function postActionFindeTechniker($params, $data, $request)
    {
        $this->acl->check('CProjekt', 'read');

        $projektId = $data->projektId ?? null;
        $rollencode = $data->rollencode ?? null;

        if (!$projektId) {
            throw new BadRequest('Projekt-ID fehlt.');
        }
        if (!$rollencode) {
            throw new BadRequest('Rollencode fehlt.');
        }

        $em = $this->getEntityManager();

        $projekt = $em->getEntityById('CProjekt', $projektId);
        if (!$projekt) {
            throw new BadRequest('Projekt wurde nicht gefunden.');
        }

        $fachbereich = $data->fachbereich ?? null;
        $terminDatum = $data->terminDatum ?? null;
        $regionFilter = $data->regionFilter ?? null;

        $verfuegbarkeitsResolver = new VerfuegbarkeitsResolver($em);
        $matchingResolver = new QualifikationsMatchingResolver($em, $verfuegbarkeitsResolver);

        $ergebnisse = $matchingResolver->finde(
            $rollencode,
            $fachbereich ?: null,
            'CProjekt',
            $projektId,
            $terminDatum ?: null,
            $regionFilter ?: null
        );

        return ['results' => $ergebnisse];
    }

    /**
     * Fügt einen von finde() gefundenen Kandidaten mit einem Klick als
     * CProjektteamzuordnung zum Projekt hinzu (logische Fortsetzung des Minimal-Buttons,
     * auf Pavels Wunsch vom 14.09.2026). Verhindert Duplikate (gleicher Mitarbeiter,
     * gleiches Projekt). Die eigentliche Readiness-Neuberechnung übernimmt automatisch
     * der bestehende Hook CProjektteamzuordnung/RecalcProjektReadiness.php.
     */
    public function postActionZumProjektHinzufuegen($params, $data, $request)
    {
        $this->acl->check('CProjekt', 'edit');
        $this->acl->check('CProjektteamzuordnung', 'create');

        $projektId = $data->projektId ?? null;
        $userId = $data->userId ?? null;
        $rollencode = $data->rollencode ?? null;

        if (!$projektId || !$userId) {
            throw new BadRequest('Projekt- oder Benutzer-ID fehlt.');
        }

        $em = $this->getEntityManager();

        $projekt = $em->getEntityById('CProjekt', $projektId);
        if (!$projekt) {
            throw new BadRequest('Projekt wurde nicht gefunden.');
        }

        $user = $em->getEntityById('User', $userId);
        if (!$user) {
            throw new BadRequest('Benutzer wurde nicht gefunden.');
        }

        $existing = $em->getRDBRepository('CProjektteamzuordnung')
            ->where(['projektId' => $projektId, 'mitarbeiterId' => $userId])
            ->findOne();

        if ($existing) {
            return ['success' => false, 'message' => $user->get('name') . ' ist bereits im Projektteam.'];
        }

        $rolleName = null;
        if ($rollencode) {
            $rolle = $em->getRDBRepository('CRollenkatalog')
                ->where(['rollencode' => $rollencode])
                ->findOne();
            $rolleName = $rolle ? $rolle->get('name') : null;
        }

        $zuordnung = $em->getNewEntity('CProjektteamzuordnung');
        $zuordnung->set([
            'name' => $user->get('name') . ' – ' . ($rollencode ?: 'Projektteam'),
            'projektId' => $projektId,
            'mitarbeiterId' => $userId,
            'teamrolle' => $rolleName,
        ]);
        $em->saveEntity($zuordnung);

        return ['success' => true, 'message' => $user->get('name') . ' wurde zum Projektteam hinzugefügt.'];
    }
}
