<?php
namespace Espo\Custom\Hooks\CRechnung;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Utils\Log;

class ResetBereitsabgerechnetOnDelete
{
    public function __construct(
        private EntityManager $em,
        private Log $log
    ) {}

    /**
     * 1) УДАЛЕНИЕ СЧЁТА: сбрасываем флаги (если нет других активных Rechnungen) и мягко удаляем позиции.
     */
    public function beforeRemove(Entity $rechnung, array $options = []): void
    {
        try {
            $rechnungId = (string) $rechnung->getId();
            if ($rechnungId === '') return;

            $resetCount = $this->resetFlagsForRechnung($rechnungId, $rechnungId);
            $deletedPos = $this->softDeletePositionsForRechnung($rechnungId);

            $this->log->info("[ResetBereitsabgerechnetOnDelete] beforeRemove: rechnung={$rechnungId}, flagsReset={$resetCount}, posSoftDeleted={$deletedPos}");
        } catch (\Throwable $e) {
            $this->log->warning('[ResetBereitsabgerechnetOnDelete] beforeRemove ERROR: ' . $e->getMessage());
        }
    }

    /**
     * 2) ИЗМЕНЕНИЕ СТАТУСА:
     *    - если стал 'storniert' → сбрасываем флаги;
     *    - если был 'storniert', а стал активным → возвращаем флаги.
     */
    public function afterSave(Entity $rechnung, array $options = []): void
    {
        try {
            if (!$rechnung->isAttributeChanged('status')) return;

            $newStatus = (string) $rechnung->get('status');
            $oldStatus = (string) ($rechnung->getFetched('status') ?? '');

            $rechnungId = (string) $rechnung->getId();
            if ($rechnungId === '') return;

            $typ = (string) $rechnung->get('rechnungstyp');

            // 2a) Переведён в storniert → сбросить флаги
            if ($newStatus === 'storniert') {
                $resetCount = $this->resetFlagsForRechnung($rechnungId, $rechnungId);
                $this->log->info("[ResetBereitsabgerechnetOnDelete] afterSave(storniert): rechnung={$rechnungId}, flagsReset={$resetCount}");
                return;
            }

            // 2b) ВЕРНУЛИ из 'storniert' в активный статус → восстановить флаги,
            //     только для типов teilrechnung | schlussrechnung
            if ($oldStatus === 'storniert' && $newStatus !== 'storniert' && ($typ === 'teilrechnung' || $typ === 'schlussrechnung')) {
                $setCount = $this->setFlagsTrueForRechnung($rechnungId);
                $this->log->info("[ResetBereitsabgerechnetOnDelete] afterSave(restore): rechnung={$rechnungId}, flagsSet={$setCount}");
            }
        } catch (\Throwable $e) {
            $this->log->warning('[ResetBereitsabgerechnetOnDelete] afterSave ERROR: ' . $e->getMessage());
        }
    }

    /**
     * Помечает (deleted = true) все позиции данного счёта.
     */
    private function softDeletePositionsForRechnung(string $rechnungId): int
    {
        $posList = $this->em->getRepository('CRechnungsposition')
            ->where(['rechnungId' => $rechnungId, 'deleted' => false])
            ->select(['id'])
            ->find();

        if (!$posList || count($posList) === 0) {
            return 0;
        }

        $cnt = 0;
        foreach ($posList as $pos) {
            /** @var Entity $pos */
            $pos->set('deleted', true);
            $this->em->saveEntity($pos, ['skipHooks' => true, 'skipWorkflow' => true]);
            $cnt++;
        }
        return $cnt;
    }

    /**
     * Сбросить флаги по rechnungId: для каждой связанной Auftragsposition
     * ставим bereitsabgerechnet=false, ЕСЛИ нет других активных Rechnungen по той же позиции.
     *
     * @param string      $rechnungId
     * @param string|null $excludeRechnungId  исключаем этот счёт из поиска «других активных»
     */
    private function resetFlagsForRechnung(string $rechnungId, ?string $excludeRechnungId = null): int
    {
        $posList = $this->em->getRepository('CRechnungsposition')
            ->where(['rechnungId' => $rechnungId, 'deleted' => false])
            ->select(['id', 'auftragspositionId'])
            ->find();

        if (!$posList || count($posList) === 0) {
            $this->log->debug("[ResetBereitsabgerechnetOnDelete] rechnung={$rechnungId}: keine Positionen.");
            return 0;
        }

        $affectedIds = [];
        foreach ($posList as $pos) {
            $apId = (string) ($pos->get('auftragspositionId') ?? '');
            if ($apId !== '') $affectedIds[$apId] = true;
        }
        if (empty($affectedIds)) {
            $this->log->debug("[ResetBereitsabgerechnetOnDelete] rechnung={$rechnungId}: keine verknüpften Auftragspositionen.");
            return 0;
        }

        $resetCount = 0;
        foreach (array_keys($affectedIds) as $auftragsPosId) {
            if (!$this->hasAnyOtherActiveInvoiceForAuftragsposition($auftragsPosId, $excludeRechnungId, $rechnungId)) {
                $ap = $this->em->getEntity('CAuftragsposition', $auftragsPosId);
                if ($ap && !$ap->get('deleted') && (bool) $ap->get('bereitsabgerechnet') === true) {
                    $ap->set('bereitsabgerechnet', false);
                    $this->em->saveEntity($ap, ['skipHooks' => true, 'skipWorkflow' => true]);
                    $resetCount++;
                }
            }
        }

        return $resetCount;
    }

    /**
     * ВОССТАНОВИТЬ флаги для всех Auftragsposition, связанных с данным счётом:
     * ставим bereitsabgerechnet=true, если позиция привязана к этому счёту.
     * (Тип проверяется на уровне вызывающего afterSave; здесь — прямое восстановление.)
     */
    private function setFlagsTrueForRechnung(string $rechnungId): int
    {
        $posList = $this->em->getRepository('CRechnungsposition')
            ->where(['rechnungId' => $rechnungId, 'deleted' => false])
            ->select(['id', 'auftragspositionId'])
            ->find();

        if (!$posList || count($posList) === 0) {
            return 0;
        }

        $affected = [];
        foreach ($posList as $pos) {
            $apId = (string) ($pos->get('auftragspositionId') ?? '');
            if ($apId !== '') $affected[$apId] = true;
        }
        if (empty($affected)) return 0;

        $set = 0;
        foreach (array_keys($affected) as $auftragsPosId) {
            $ap = $this->em->getEntity('CAuftragsposition', $auftragsPosId);
            if ($ap && !$ap->get('deleted') && (bool) $ap->get('bereitsabgerechnet') !== true) {
                $ap->set('bereitsabgerechnet', true);
                $this->em->saveEntity($ap, ['skipHooks' => true, 'skipWorkflow' => true]);
                $set++;
            }
        }
        return $set;
    }

    /**
     * Есть ли ДРУГИЕ (≠ $excludeRechnungId) активные счета по данной Auftragsposition?
     * Активный = status != 'storniert' и typ ∈ {'teilrechnung','schlussrechnung'}.
     */
    private function hasAnyOtherActiveInvoiceForAuftragsposition(
        string $auftragsPosId,
        ?string $excludeRechnungId,
        string $debugCurrentRechnungId
    ): bool
    {
        $posList = $this->em->getRepository('CRechnungsposition')
            ->where(['auftragspositionId' => $auftragsPosId, 'deleted' => false])
            ->select(['id', 'rechnungId'])
            ->find();

        if (!$posList) return false;

        foreach ($posList as $pos) {
            $rechnungId = (string) ($pos->get('rechnungId') ?? '');
            if ($rechnungId === '' || ($excludeRechnungId && $rechnungId === $excludeRechnungId)) {
                continue;
            }

            $r = $this->em->getEntity('CRechnung', $rechnungId);
            if (!$r || $r->get('deleted')) continue;

            $typ    = (string) $r->get('rechnungstyp');
            $status = (string) $r->get('status');

            if ($status !== 'storniert' && ($typ === 'teilrechnung' || $typ === 'schlussrechnung')) {
                $this->log->debug(
                    "[ResetBereitsabgerechnetOnDelete] keep flag: auftragsPos={$auftragsPosId} hat aktive rechnung={$rechnungId} (typ={$typ}, status={$status}), current={$debugCurrentRechnungId}"
                );
                return true;
            }
        }
        return false;
    }
}
