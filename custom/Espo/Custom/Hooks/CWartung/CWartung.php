<?php

namespace Espo\Custom\Hooks\CWartung;

use Espo\ORM\Entity;

class CWartung
{
    /**
     * Обрабатываем даты и статусы до сохранения записи.
     */
    public function beforeSave(Entity $entity, array $options = [])
    {

         // --- 0. Автогенерация Name, если пусто
    if (!$entity->get('name')) {
        $accountName = trim((string) $entity->get('accountName'));
        $anlage      = (string) $entity->get('anlageTyp');

        // Небольшая карта для красивого лейбла без обращения к Language
        $labels = [
            'bma'     => 'BMA',
            'ema'     => 'EMA',
            'video'   => 'Video',
            'zutritt' => 'Zutritt',
            'other'   => 'Sonstiges',
        ];
        $anlageLabel = $labels[$anlage] ?? ucfirst($anlage ?: 'Wartung');

        $title = trim(($accountName ?: 'Ohne Firma') . " - " . $anlageLabel . " - Wartung");
        $entity->set('name', $title);
    }

        // --- 1. Если статус "beendet" — ничего не пересчитываем
        if ($entity->get('status') === 'beendet') {
            $entity->set('faelligkeitsStatus', 'beendet');
            return;
        }

        // --- 2. Проверяем наличие базовых полей
        $intervall = $entity->get('intervall');
        $regelModus = $entity->get('regelModus') ?? 'abLetzterWartung';
        $startDatum = $entity->get('startDatum');
        $letzteWartung = $entity->get('letzteWartung');

        if (!$intervall || (!$startDatum && !$letzteWartung)) {
            return; // нечего считать
        }

        // --- 3. Рассчитываем следующую дату обслуживания
        $naechste = null;
        switch ($regelModus) {
            case 'abStartdatum':
                $basis = new \DateTime($startDatum);
                break;
            case 'abLetzterWartung':
            default:
                $basis = $letzteWartung ? new \DateTime($letzteWartung) : new \DateTime($startDatum);
                break;
        }

        switch ($intervall) {
            case 'monatlich':
                $basis->modify('+1 month');
                break;
            case 'quartal':
                $basis->modify('+3 months');
                break;
            case 'halbjaehrlich':
                $basis->modify('+6 months');
                break;
            case 'jaehrlich':
                $basis->modify('+1 year');
                break;
        }

        $naechste = $basis->format('Y-m-d');
        $entity->set('naechsteWartung', $naechste);

        // --- 4. Определяем статус фаличности
        $today = new \DateTime();
        $due = new \DateTime($naechste);
        $warnDays = (int)($entity->get('vorwarnTage') ?? 30);

        $status = 'nichtFaellig';
        if ($today > $due) {
            $status = 'faellig';
        } elseif ($today->modify("+{$warnDays} days") >= $due) {
            $status = 'baldFaellig';
        }

        $entity->set('faelligkeitsStatus', $status);
    }

    /**
     * Обновление после сохранения (если нужно логировать или делать что-то после изменений)
     */
    public function afterSave(Entity $entity, array $options = [])
    {
        // Здесь можно добавить логи или интеграцию (например, уведомление менеджера)
    }
}
