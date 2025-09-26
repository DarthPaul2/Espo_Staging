<?php
namespace Espo\Custom\Hooks\CRechnungsposition;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

class UpdateRechnungTotals
{
    public function __construct(private EntityManager $em) {}

    public function afterSave(Entity $entity, array $options = []): void
    {
        if (!empty($options['skipTotalsUpdate'])) {
            return;
        }
        $this->recalcForRelated($entity);
    }

    public function afterRemove(Entity $entity, array $options = []): void
    {
        if (!empty($options['skipTotalsUpdate'])) {
            return;
        }
        $this->recalcForRelated($entity);
    }

    /**
     * Пересчитывает суммы для текущей и/или предыдущей Rechnung.
     * Закрывает кейсы unlink и перенос позиции между счетами.
     */
    private function recalcForRelated(Entity $entity): void
    {
        $currentId  = $entity->get('rechnungId');            // после сохранения
        $previousId = $entity->getFetched('rechnungId');     // до сохранения

        $ids = array_values(array_unique(array_filter([
            $currentId ?: null,
            $previousId ?: null,
        ])));

        if (!$ids) {
            return;
        }

        $pdo = $this->em->getPDO();

        foreach ($ids as $rid) {
            $rechnung = $this->em->getEntity('CRechnung', $rid);
            if (!$rechnung) {
                continue;
            }

            // Суммируем по всем НЕудалённым позициям этой Rechnung
            // Используем ту же модель, что и у Angebot-хука: netto = SUM(netto), brutto = SUM(gesamt)
            $stmt = $pdo->prepare("
                SELECT 
                    COALESCE(SUM(netto), 0)  AS total_netto,
                    COALESCE(SUM(gesamt), 0) AS total_brutto
                FROM c_rechnungsposition
                WHERE rechnung_id = :rid AND deleted = 0
            ");
            $stmt->execute([':rid' => $rid]);
            $row = $stmt->fetch(\PDO::FETCH_ASSOC) ?: ['total_netto' => 0, 'total_brutto' => 0];

            $totalNetto  = (float) $row['total_netto'];
            $totalBrutto = (float) $row['total_brutto'];

            // Обновляем поля родителя. Без лишних хуков/воркфлоу/повторного триггера.
            $rechnung->set('betragNetto',  $totalNetto);
            $rechnung->set('betragBrutto', $totalBrutto);

            // ustBetrag можно оставить на расчёт PDF/клиента; либо вычислять тут:
            // $rechnung->set('ustBetrag', max(0, $totalBrutto - $totalNetto));

            $this->em->saveEntity($rechnung, [
                'skipHooks'        => true,
                'skipWorkflow'     => true,
                'skipTotalsUpdate' => true,
            ]);
        }
    }
}
