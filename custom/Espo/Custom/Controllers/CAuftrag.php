<?php

namespace Espo\Custom\Controllers;

use Espo\Core\Templates\Controllers\Base;
use Espo\ORM\EntityManager;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\NotFound;
use Espo\Custom\Hooks\CAuftrag\SyncAngebotspositionen;

class CAuftrag extends Base
{
    /**
     * Кнопка: "Aus Angeboten übernehmen"
     */
    public function postActionFillPositionsFromOffers($params, $data, $request)
    {
        $auftragId = $data->id ?? null;
        if (!$auftragId) {
            throw new BadRequest("Missing id.");
        }

        /** @var EntityManager $em */
        $em  = $this->getContainer()->get('entityManager');
        $log = $this->getContainer()->get('log');

        $auftrag = $em->getEntity('CAuftrag', $auftragId);
        if (!$auftrag) {
            throw new NotFound("Auftrag not found.");
        }

        // hasMany: Angebote hängen über feld CAngebot.auftragId
        $angebotList = $em->getRepository('CAngebot')
            ->select(['id'])
            ->where([
                'auftragId' => $auftragId,
                'deleted'   => false,
            ])
            ->find();

        $angebotIds = [];
        foreach ($angebotList as $row) {
            $angebotIds[] = (string) $row->getId();
        }

        if (!$angebotIds) {
            // НИЧЕГО не чистим, просто сообщаем
            return [
                'success' => true,
                'message' => 'Keine verknüpften Angebote gefunden.',
                'details' => [],
            ];
        }

        // 1) СНАЧАЛА очищаем ВСЕ текущие Auftragspositionen этого Auftrags
        $oldList = $em->getRepository('CAuftragsposition')
            ->where([
                'auftragId' => $auftragId,
                'deleted'   => false,
            ])
            ->find();

        $deletedOld = 0;
        foreach ($oldList as $ap) {
            $ap->set('deleted', true);
            $em->saveEntity($ap, ['skipRecalc' => true]);
            $deletedOld++;
        }

        $log->warning("[CAuftrag::fillPositionsFromOffers] soft-deleted ALL old positions for auftrag={$auftragId}: {$deletedOld}");

        // 2) Используем твой хук-класс как сервис
        $sync = new SyncAngebotspositionen($em, $log);

        $result = [];
        foreach ($angebotIds as $angId) {
            $result[$angId] = $sync->upsertFromAngebot($auftragId, $angId);
        }

        return [
            'success' => true,
            'message' => 'Auftragspositionen aus Angeboten übernommen.',
            'details' => [
                'deletedOld' => $deletedOld,
                'perAngebot' => $result,
            ],
        ];
    }

    /**
     * Кнопка: "Aus Rechnungen übernehmen"
     * Берём Rechnungen этого Auftrags со статусом 'offen' или 'bezahlt'
     * и пересоздаём Auftragspositionen из CRechnungsposition.
     */
    public function postActionFillPositionsFromInvoices($params, $data, $request)
    {
        $auftragId = $data->id ?? null;
        if (!$auftragId) {
            throw new BadRequest("Missing id.");
        }

        /** @var EntityManager $em */
        $em  = $this->getContainer()->get('entityManager');
        $log = $this->getContainer()->get('log');

        $auftrag = $em->getEntity('CAuftrag', $auftragId);
        if (!$auftrag) {
            throw new NotFound("Auftrag not found.");
        }

        // используем тот же класс, что и для Angebots-Sync
        $sync = new SyncAngebotspositionen($em, $log);

        $result = $sync->rebuildFromInvoices($auftragId, ['offen', 'bezahlt']);

        return [
            'success' => true,
            'message' => 'Auftragspositionen aus Rechnungen übernommen.',
            'details' => $result,
        ];
    }
}
