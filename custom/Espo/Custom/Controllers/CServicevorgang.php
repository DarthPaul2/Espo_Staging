<?php

namespace Espo\Custom\Controllers;

use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Templates\Controllers\Base;
use Espo\Custom\Core\RuleSet\QualifikationsMatchingResolver;
use Espo\Custom\Core\RuleSet\VerfuegbarkeitsResolver;

/**
 * Что это:
 * Gleiche Minimalanbindung an QualifikationsMatchingResolver::finde() wie bei CProjekt
 * (14.09.2026), jetzt auch für CServicevorgang — auf ausdrücklichen Wunsch von Pavel
 * (15.09.2026): "Надо сделать это также". Anders als bei CProjekt (eigene Team-Zuordnungs-
 * Entity) gibt es hier ein einfaches `technikers`-linkMultiple-Feld (mehrere Techniker
 * möglich, z. B. weil Einsätze oft zu zweit gefahren werden — Pavels ausdrückliche Korrektur),
 * bewusst NICHT das native `assignedUser` (Pavel: das soll nicht mit "wer führt den Einsatz
 * technisch aus" vermischt werden). "Zuweisen" fügt den Techniker der Liste hinzu (relate),
 * ersetzt NICHT bereits zugewiesene Techniker.
 */
class CServicevorgang extends Base
{
    use \Espo\Custom\Traits\HasEntityManagerCompat;

    public function postActionFindeTechniker($params, $data, $request)
    {
        $this->acl->check('CServicevorgang', 'read');

        $servicevorgangId = $data->servicevorgangId ?? null;
        $rollencode = $data->rollencode ?? null;

        if (!$servicevorgangId) {
            throw new BadRequest('Servicevorgang-ID fehlt.');
        }
        if (!$rollencode) {
            throw new BadRequest('Rollencode fehlt.');
        }

        $em = $this->getEntityManager();

        $servicevorgang = $em->getEntityById('CServicevorgang', $servicevorgangId);
        if (!$servicevorgang) {
            throw new BadRequest('Servicevorgang wurde nicht gefunden.');
        }

        $fachbereich = $data->fachbereich ?? null;
        $terminDatum = $data->terminDatum ?? null;
        $regionFilter = $data->regionFilter ?? null;

        $verfuegbarkeitsResolver = new VerfuegbarkeitsResolver($em);
        $matchingResolver = new QualifikationsMatchingResolver($em, $verfuegbarkeitsResolver);

        $ergebnisse = $matchingResolver->finde(
            $rollencode,
            $fachbereich ?: null,
            'CServicevorgang',
            $servicevorgangId,
            $terminDatum ?: null,
            $regionFilter ?: null
        );

        return ['results' => $ergebnisse];
    }

    public function postActionTechnikerZuweisen($params, $data, $request)
    {
        $this->acl->check('CServicevorgang', 'edit');

        $servicevorgangId = $data->servicevorgangId ?? null;
        $userId = $data->userId ?? null;

        if (!$servicevorgangId || !$userId) {
            throw new BadRequest('Servicevorgang- oder Benutzer-ID fehlt.');
        }

        $em = $this->getEntityManager();

        $servicevorgang = $em->getEntityById('CServicevorgang', $servicevorgangId);
        if (!$servicevorgang) {
            throw new BadRequest('Servicevorgang wurde nicht gefunden.');
        }

        $user = $em->getEntityById('User', $userId);
        if (!$user) {
            throw new BadRequest('Benutzer wurde nicht gefunden.');
        }

        $relation = $em->getRDBRepository('CServicevorgang')->getRelation($servicevorgang, 'technikers');

        $bereitsZugeordnet = $relation->isRelated($user);

        if ($bereitsZugeordnet) {
            return ['success' => false, 'message' => $user->get('name') . ' ist bereits als Techniker zugeordnet.'];
        }

        $relation->relate($user);

        return ['success' => true, 'message' => $user->get('name') . ' wurde als Techniker hinzugefügt.'];
    }

    /**
     * Что это:
     * P-38 "Offene Servicepunkte" (9. Dokument, Zitat 102/118 — "dürfen nicht verschwinden").
     * Block erscheint direkt auf dem Servicevorgang, sobald status=rueckfrageMaterial
     * (automatisch gesetzt durch AdvanceServicevorgangStatus/AdvanceStatusOnStundenberichtRelate,
     * ausgelöst durch restarbeiten=true auf einem Stundenbericht). Erstellt eine normale Task,
     * direkt mit diesem Servicevorgang verknüpft (15.09.2026, Pavels Korrektur — Block gehört
     * auf den Servicevorgang, nicht in den einzelnen Stundenbericht).
     */
    public function postActionOffenerPunktErstellen($params, $data, $request)
    {
        $this->acl->check('CServicevorgang', 'read');
        $this->acl->check('Task', 'create');

        $servicevorgangId = $data->servicevorgangId ?? null;
        $name = trim((string) ($data->name ?? ''));
        $description = (string) ($data->description ?? '');
        $assignedUserId = $data->assignedUserId ?? null;
        $dateEnd = $data->dateEnd ?? null;

        if (!$servicevorgangId) {
            throw new BadRequest('Servicevorgang-ID fehlt.');
        }
        if ($name === '') {
            throw new BadRequest('Titel fehlt.');
        }

        $em = $this->getEntityManager();

        $servicevorgang = $em->getEntityById('CServicevorgang', $servicevorgangId);
        if (!$servicevorgang) {
            throw new BadRequest('Servicevorgang wurde nicht gefunden.');
        }

        // Task.dateEnd ist "datetimeOptional" (voller Zeitstempel), unser Frist-Feld liefert
        // nur ein Datum — dafür ist das Begleitfeld "dateEndDate" (reiner date-Typ) da.
        $task = $em->getNewEntity('Task');
        $task->set([
            'name' => $name,
            'description' => $description ?: null,
            'assignedUserId' => $assignedUserId ?: null,
            'dateEndDate' => $dateEnd ?: null,
            'cServicevorgangId' => $servicevorgangId,
        ]);
        $em->saveEntity($task);

        return ['success' => true, 'id' => $task->getId()];
    }
}
