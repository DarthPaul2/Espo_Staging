<?php
namespace Espo\Custom\Hooks\CAngebotsposition;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

class UpdateAngebotTotals
{
    private $entityManager;

    public function __construct(EntityManager $entityManager)
    {
        $this->entityManager = $entityManager;
    }

    public function afterSave(Entity $entity, array $options = []): void
    {
        if (!empty($options['skipTotalsUpdate'])) {
            return;
        }
        $this->updateAngebotTotals($entity);
    }

    public function afterRemove(Entity $entity, array $options = []): void
    {
        if (!empty($options['skipTotalsUpdate'])) {
            return;
        }
        $this->updateAngebotTotals($entity);
    }

    /**
     * Пересчитывает суммы для текущего и/или предыдущего Angebots.
     * Это закрывает кейсы unlink (angebotId -> null) и перенос позиции между разными Angeboten.
     */
    private function updateAngebotTotals(Entity $entity): void
    {
        // Текущее значение (после save/remove)
        $currentAngebotId  = $entity->get('angebotId');

        // Предыдущее значение из БД (до сохранения)
        // Важно: при unlink текущее станет null, а вот fetched даст нужный старый ID.
        $previousAngebotId = $entity->getFetched('angebotId');

        // Соберём уникальные валидные ID, которые нужно пересчитать
        $idsToRecalc = array_values(array_unique(array_filter([
            $currentAngebotId ?: null,
            $previousAngebotId ?: null,
        ])));

        if (empty($idsToRecalc)) {
            return;
        }

        $pdo = $this->entityManager->getPDO();

        foreach ($idsToRecalc as $angebotId) {
            // Защита: вдруг такого Angebots уже нет
            $angebot = $this->entityManager->getEntity('CAngebot', $angebotId);
            if (!$angebot) {
                continue;
            }

            // Пересчитываем СУММы netto и brutto по всем НЕудалённым позициям, привязанным к этому Angebot
            $stmt = $pdo->prepare("
                SELECT 
                    COALESCE(SUM(netto), 0)  AS total_netto,
                    COALESCE(SUM(gesamt), 0) AS total_brutto
                FROM c_angebotsposition
                WHERE angebot_id = :angebotId AND deleted = 0
            ");
            $stmt->execute([':angebotId' => $angebotId]);
            $result = $stmt->fetch(\PDO::FETCH_ASSOC) ?: ['total_netto' => 0, 'total_brutto' => 0];

            $totalNetto  = (float) $result['total_netto'];
            $totalBrutto = (float) $result['total_brutto'];

            // Обновляем поля в родителе (без запуска лишних хуков/воркфлоу и повторного пересчёта)
            $angebot->set('betragNetto',  $totalNetto);
            $angebot->set('betragBrutto', $totalBrutto);

            $this->entityManager->saveEntity($angebot, [
                'skipHooks'         => true,
                'skipWorkflow'      => true,
                'skipTotalsUpdate'  => true,
            ]);
        }
    }
}
