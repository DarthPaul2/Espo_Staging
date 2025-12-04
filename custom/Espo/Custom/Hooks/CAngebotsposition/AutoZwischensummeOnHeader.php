<?php

namespace Espo\Custom\Hooks\CAngebotsposition;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

class AutoZwischensummeOnHeader
{
    public function __construct(
        private EntityManager $em
    ) {}

    public function afterSave(Entity $entity, array $options = []): void
    {
        // Защита от рекурсии
        if (!empty($options['skipAutoZw'])) {
            return;
        }

        // Нас интересуют только подзаголовки
        if ($entity->get('positionType') !== 'header') {
            return;
        }

        $angebotId = $entity->get('angebotId');
        if (!$angebotId) {
            return;
        }

        $pdo = $this->em->getPDO();

        // Тот же порядок, что и в пересчёте сумм
        $stmt = $pdo->prepare("
            SELECT
                id,
                angebot_id,
                position_type,
                positions_nummer,
                netto,
                gesamt,
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

        $currentId = $entity->get('id');
        $idx = null;

        foreach ($rows as $i => $row) {
            if ($row['id'] === $currentId) {
                $idx = $i;
                break;
            }
        }

        if ($idx === null) {
            return;
        }

        // Если прямо перед этим header уже стоит summary – ничего не делаем
        if ($idx > 0 && $rows[$idx - 1]['position_type'] === 'summary') {
            return;
        }

        // Ищем границы блока: от предыдущего header (или начала) до строки перед текущим header
        $start = 0;
        for ($j = $idx - 1; $j >= 0; $j--) {
            if ($rows[$j]['position_type'] === 'header') {
                $start = $j + 1;
                break;
            }
        }

        $blockNetto  = 0.0;
        $blockBrutto = 0.0;
        $hasNormal   = false;

        for ($k = $start; $k <= $idx - 1; $k++) {
            $t = $rows[$k]['position_type'];

            if ($t === 'normal' || $t === null || $t === '') {
                $hasNormal = true;
                $blockNetto  += (float) ($rows[$k]['netto']  ?? 0);
                $blockBrutto += (float) ($rows[$k]['gesamt'] ?? 0);
            }
        }

        // Если между предыдущим header и этим не было обычных позиций – нечего суммировать
        if (!$hasNormal) {
            return;
        }

        // Заголовок блока – из текущего header (titel / beschreibung / name)
        $headerTitle = trim(
            ($entity->get('titel') ?: '') !== '' ? $entity->get('titel')
            : (($entity->get('beschreibung') ?: '') !== '' ? $entity->get('beschreibung')
                : ($entity->get('name') ?: ''))
        );

        $label = 'Zwischensumme';
        if ($headerTitle !== '') {
            $label .= ' ' . $headerTitle;
        }

        // Номер для Zwischensumme: "<номер предыдущего header>Z"
        $prevHeaderNumber = null;
        for ($j = $idx - 1; $j >= 0; $j--) {
            if (
                $rows[$j]['position_type'] === 'header' &&
                !empty($rows[$j]['positions_nummer'])
            ) {
                $prevHeaderNumber = $rows[$j]['positions_nummer'];
                break;
            }
        }

        $summaryNumber = null;
        if ($prevHeaderNumber !== null) {
            $summaryNumber = $prevHeaderNumber . 'Z';
        }

        // Создаём summary-позицию
        $summary = $this->em->getEntity('CAngebotsposition');
        $summary->set('angebotId', $angebotId);
        $summary->set('positionType', 'summary');

        if ($summaryNumber !== null) {
            $summary->set('positionsNummer', $summaryNumber);
        }

        // Эти значения потом всё равно подкорректирует твой UpdateAngebotTotals,
        // но и так уже будут "правдоподобные".
        $summary->set('titel', $label);
        $summary->set('netto', $blockNetto);
        $summary->set('gesamt', $blockBrutto);

        // Сохраняем, при этом:
        //  - не запускаем AutoZw ещё раз (skipAutoZw)
        //  - но позволяем UpdateAngebotTotals доработать суммы (skipTotalsUpdate = false)
        $this->em->saveEntity($summary, [
            'skipAutoZw'       => true,
        ]);
    }
}
