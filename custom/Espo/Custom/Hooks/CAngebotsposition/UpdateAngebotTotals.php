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
     *
     * - normal  : участвуют в общем betragNetto / betragBrutto и в Zwischensumme-блоках
     * - header  : открывает новый блок, задаёт его название
     * - summary : получает сумму блока до себя и авто-заголовок "Zwischensumme <Header>"
     */
    private function updateAngebotTotals(Entity $entity): void
    {
        $currentAngebotId  = $entity->get('angebotId');
        $previousAngebotId = $entity->getFetched('angebotId');

        $idsToRecalc = array_values(array_unique(array_filter([
            $currentAngebotId ?: null,
            $previousAngebotId ?: null,
        ])));

        if (empty($idsToRecalc)) {
            return;
        }

        $pdo = $this->entityManager->getPDO();

        foreach ($idsToRecalc as $angebotId) {
            $angebot = $this->entityManager->getEntity('CAngebot', $angebotId);
            if (!$angebot) {
                continue;
            }

            // Берём ВСЕ позиции этого Angebots в порядке Positions-Nr.
            $stmt = $pdo->prepare("
                SELECT
                    id,
                    netto,
                    gesamt,
                    position_type,
                    positions_nummer,
                    titel,
                    beschreibung,
                    name,
                    created_at
                FROM c_angebotsposition
                WHERE angebot_id = :angebotId
                  AND deleted = 0
                ORDER BY
                    CASE
                        WHEN positions_nummer IS NULL OR positions_nummer = '' THEN 1
                        ELSE 0
                    END,
                    positions_nummer,
                    created_at
            ");
            $stmt->execute([':angebotId' => $angebotId]);
            $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            $totalNettoAll   = 0.0; // общая сумма только по normal
            $totalBruttoAll  = 0.0;

            $blockNetto      = 0.0; // текущий блок для Zwischensumme
            $blockBrutto     = 0.0;
            $currentHeaderTitle = ''; // название текущего блока (из header)

            $summaryUpdates  = [];

            foreach ($rows as $row) {
                $type  = $row['position_type'] ?? 'normal';
                $netto = (float) ($row['netto'] ?? 0);
                $brutt = (float) ($row['gesamt'] ?? 0);

                switch ($type) {

                    case 'header':
                        // Запоминаем название блока из titel / beschreibung / name
                        $title = trim(
                            ($row['titel'] ?? '') !== '' ? $row['titel']
                            : (($row['beschreibung'] ?? '') !== '' ? $row['beschreibung']
                                : ($row['name'] ?? ''))
                        );
                        $currentHeaderTitle = $title;

                        // Новый раздел — обнуляем промежуточную сумму
                        $blockNetto  = 0.0;
                        $blockBrutto = 0.0;
                        break;

                    case 'summary':
                        // Формируем подпись Zwischensumme
                        $label = 'Zwischensumme';
                        if ($currentHeaderTitle !== '') {
                            $label .= ' ' . $currentHeaderTitle;
                        }

                        $summaryUpdates[] = [
                            'id'     => $row['id'],
                            'netto'  => $blockNetto,
                            'gesamt' => $blockBrutto,
                            'titel'  => $label,
                        ];

                        // После Zwischensumme начинаем следующий блок "с нуля"
                        $blockNetto  = 0.0;
                        $blockBrutto = 0.0;
                        break;

                    case 'normal':
                    default:
                        // Обычная позиция
                        $blockNetto  += $netto;
                        $blockBrutto += $brutt;

                        $totalNettoAll  += $netto;
                        $totalBruttoAll += $brutt;
                        break;
                }
            }

            // Обновляем summary-позиции (нетто/брутто + заголовок), без хуков
            if (!empty($summaryUpdates)) {
                $updateStmt = $pdo->prepare("
                    UPDATE c_angebotsposition
                    SET netto = :netto,
                        gesamt = :gesamt,
                        titel = :titel
                    WHERE id = :id
                ");

                foreach ($summaryUpdates as $s) {
                    $updateStmt->execute([
                        ':netto'  => $s['netto'],
                        ':gesamt' => $s['gesamt'],
                        ':titel'  => $s['titel'],
                        ':id'     => $s['id'],
                    ]);
                }
            }

            // Общая сумма по normal-позициям
            $angebot->set('betragNetto',  $totalNettoAll);
            $angebot->set('betragBrutto', $totalBruttoAll);

            $this->entityManager->saveEntity($angebot, [
                'skipHooks'        => true,
                'skipWorkflow'     => true,
                'skipTotalsUpdate' => true,
            ]);
        }
    }
}
