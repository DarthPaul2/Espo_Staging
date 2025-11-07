<?php
namespace Espo\Custom\Hooks\CRechnung;

use Espo\ORM\Entity;

class MarkAuftragspositionAbgerechnet
{
    /* ====== helper: мягкий лог ====== */
    protected function logSafe(Entity $entity, string $msg, array $ctx = []): void
    {
        try {
            $em = $entity->getEntityManager();
            if (!$em) return;
            $log = $em->getContainer()->get('log');
            $log->warning('[CRechnung.MarkAuftragspositionAbgerechnet] ' . $msg . ' ' . json_encode($ctx, JSON_UNESCAPED_UNICODE));
        } catch (\Throwable $e) {
            // ignore
        }
    }

    /* ====== центральная логика: проставить флажки по всем позициям счета ====== */
    protected function applyForRechnung(Entity $rechnung): void
    {
        $em = $rechnung->getEntityManager();
        if (!$em) return;

        // Работает только для Teilrechnung и не для "storniert"
        $typ    = (string) $rechnung->get('rechnungstyp');
        $status = (string) $rechnung->get('status');
        if ($typ !== 'teilrechnung' || $status === 'storniert') {
            return;
        }

        $auftragId = $rechnung->get('auftragId') ?: null;
        if (!$auftragId) return;

        // Берём все позиции этого счета
        $posList = $em->getRepository('CRechnungsposition')->find([
            'whereClause' => [
                ['rechnungId' => $rechnung->getId()],
                ['deleted' => false],
            ],
            'select' => ['id', 'auftragspositionId'],
            'limit'  => 10000,
        ]);

        foreach ($posList as $pos) {
            /** @var Entity $pos */
            $auftragsPosId = $pos->get('auftragspositionId') ?: null;
            if (!$auftragsPosId) continue;

            $aufPos = $em->getEntity('CAuftragsposition', $auftragsPosId);
            if (!$aufPos || $aufPos->get('deleted')) continue;

            // безопасность: позиция заказа того же Auftrags?
            if ((string)$aufPos->get('auftragId') !== (string)$auftragId) {
                continue;
            }

            if (!$aufPos->get('bereitsabgerechnet')) {
                $aufPos->set('bereitsabgerechnet', true);
                $em->saveEntity($aufPos, ['skipWorkflow' => true]);
                $this->logSafe($rechnung, 'set true', [
                    'auftragspositionId' => $auftragsPosId,
                    'rechnung'           => $rechnung->getId()
                ]);
            }
        }
    }

    /* ====== снять флаг у позиции заказа, если активных Teilrechnungen больше нет ====== */
    protected function unmarkIfNoTeilrechnungenLeft(Entity $ctxEntity, string $auftragsPosId): void
    {
        $em = $ctxEntity->getEntityManager();
        if (!$em) return;

        if (!$this->hasAnyActiveTeilrechnungForAuftragsposition($ctxEntity, $auftragsPosId)) {
            $ap = $em->getEntity('CAuftragsposition', $auftragsPosId);
            if ($ap && !$ap->get('deleted') && $ap->get('bereitsabgerechnet')) {
                $ap->set('bereitsabgerechnet', false);
                $em->saveEntity($ap, ['skipWorkflow' => true]);
                $this->logSafe($ctxEntity, 'set false', ['auftragspositionId' => $auftragsPosId]);
            }
        }
    }

    protected function hasAnyActiveTeilrechnungForAuftragsposition(Entity $ctxEntity, string $auftragsPosId): bool
    {
        $em = $ctxEntity->getEntityManager();
        if (!$em) return false;

        // Находим все позиции счетов, сославшиеся на данную Auftragsposition
        $posList = $em->getRepository('CRechnungsposition')->find([
            'whereClause' => [
                ['auftragspositionId' => $auftragsPosId],
                ['deleted' => false],
            ],
            'select' => ['id', 'rechnungId'],
            'limit'  => 10000,
        ]);

        foreach ($posList as $pos) {
            $rechnungId = $pos->get('rechnungId') ?: null;
            if (!$rechnungId) continue;

            $r = $em->getEntity('CRechnung', $rechnungId);
            if (!$r || $r->get('deleted')) continue;

            if ((string)$r->get('rechnungstyp') === 'teilrechnung' && (string)$r->get('status') !== 'storniert') {
                return true;
            }
        }
        return false;
    }

    /* ====== HOOKS ====== */

    /**
     * afterSave на CRechnung:
     * — важно поставить ПОСЛЕ AngebotImporter, чтобы позиции уже существовали.
     * — проставит bereitsabgerechnet=true для всех связанных Auftragsposition’ов.
     */
    public function afterSave(Entity $rechnung, array $options = []): void
    {
        try {
            $this->applyForRechnung($rechnung);
        } catch (\Throwable $e) {
            $this->logSafe($rechnung, 'ERROR afterSave: ' . $e->getMessage());
        }
    }

    /**
     * afterRelate у CRechnung:
     * — ловим присоединение позиции счёта (relationName = 'rechnungspositions').
     * — применяем массовую установку (на случай пакетного импорта/ручного добавления).
     */
    public function afterRelate(Entity $rechnung, array $data = [], $arg3 = null): void
    {
        try {
            $relationName = null;
            if (is_string($arg3)) $relationName = $arg3;
            elseif (is_array($arg3) && isset($arg3['relationName'])) $relationName = (string)$arg3['relationName'];
            elseif (is_array($data) && isset($data['relationName'])) $relationName = (string)$data['relationName'];

            if ($relationName !== 'rechnungspositions') return;

            $this->applyForRechnung($rechnung);
        } catch (\Throwable $e) {
            $this->logSafe($rechnung, 'ERROR afterRelate: ' . $e->getMessage());
        }
    }

    /**
     * afterUnrelate у CRechnung:
     * — если от счета отвязали позицию (rechnungspositions), проверяем соответствующую Auftragsposition:
     *   если активных Teilrechnungen на неё больше нет — снимаем флаг.
     */
    public function afterUnrelate(Entity $rechnung, array $data = [], $arg3 = null): void
    {
        try {
            $relationName = null;
            if (is_string($arg3)) $relationName = $arg3;
            elseif (is_array($arg3) && isset($arg3['relationName'])) $relationName = (string)$arg3['relationName'];
            elseif (is_array($data) && isset($data['relationName'])) $relationName = (string)$data['relationName'];

            if ($relationName !== 'rechnungspositions') return;

            $posId = $data['foreignId'] ?? $data['id'] ?? $data['relatedId'] ?? null;
            if (!$posId) return;

            $em  = $rechnung->getEntityManager();
            $pos = $em->getEntity('CRechnungsposition', $posId);
            if (!$pos) return;

            $auftragsPosId = $pos->get('auftragspositionId');
            if (!$auftragsPosId) return;

            $this->unmarkIfNoTeilrechnungenLeft($rechnung, (string)$auftragsPosId);
        } catch (\Throwable $e) {
            $this->logSafe($rechnung, 'ERROR afterUnrelate: ' . $e->getMessage());
        }
    }
}
