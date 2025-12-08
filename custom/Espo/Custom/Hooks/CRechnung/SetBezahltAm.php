<?php

namespace Espo\Custom\Hooks\CRechnung;

use Espo\ORM\Entity;

class SetBezahltAm
{
    /**
     * Автоматически проставляет bezahltAm при переходе статуса в "bezahlt".
     *
     * Логика:
     *  - если новый status = 'bezahlt'
     *  - и раньше статус НЕ был 'bezahlt'
     *  - и поле bezahltAm пустое
     *  → ставим сегодняшнюю дату (Europe/Berlin) в формате YYYY-MM-DD.
     *
     *  Если бухгалтер поставил дату руками – мы её НЕ трогаем.
     */
    public function beforeSave(Entity $entity, array $options = []): void
    {
        $status = (string) $entity->get('status');
        $oldStatus = (string) $entity->getFetched('status');  // старое значение из БД
        $bezahltAm = $entity->get('bezahltAm');

        // интересует только переход В оплаченный
        if ($status !== 'bezahlt') {
            return;
        }

        // если уже был "bezahlt" – ничего не делаем
        if ($oldStatus === 'bezahlt') {
            return;
        }

        // если дата уже стоит (вручную) – не трогаем
        if (!empty($bezahltAm)) {
            return;
        }

        // ставим сегодняшнюю дату по Берлину
        $dt = new \DateTimeImmutable('now', new \DateTimeZone('Europe/Berlin'));
        $entity->set('bezahltAm', $dt->format('Y-m-d'));
    }
}
