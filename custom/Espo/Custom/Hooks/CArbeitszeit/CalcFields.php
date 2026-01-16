<?php

namespace Espo\Custom\Hooks\CArbeitszeit;

use Espo\ORM\Entity;

class CalcFields
{
    public function beforeSave(Entity $entity, array $options = []): void
    {
        $start = $entity->get('startzeit');
        $end   = $entity->get('endzeit');

        // status (по вашей логике)
        $entity->set('status', $end ? 'closed' : 'open');

        // Считаем только если есть обе даты
        if (empty($start) || empty($end)) {
            // если конца нет — чистим вычисляемые поля, чтобы не было "мусора"
            $entity->set('dauerminuten', null);
            $entity->set('nettominuten', null);
            $entity->set('ueberstundenminuten', null);
            return;
        }

        try {
            // Espo хранит datetime как UTC-строку; для длительности TZ не важен
            $dtStart = new \DateTimeImmutable($start, new \DateTimeZone('UTC'));
            $dtEnd   = new \DateTimeImmutable($end, new \DateTimeZone('UTC'));

            $diffSeconds = $dtEnd->getTimestamp() - $dtStart->getTimestamp();
            $dauer = (int) floor($diffSeconds / 60);

            if ($dauer < 0) {
                // если ввели конец раньше начала — не считаем
                $entity->set('dauerminuten', null);
                $entity->set('pauseminuten', null);
                $entity->set('nettominuten', null);
                $entity->set('ueberstundenminuten', null);
                return;
            }

            // Авто-пауза как у вас на сервере
            if ($dauer >= 540) {
                $pause = 45;
            } elseif ($dauer >= 360) {
                $pause = 30;
            } else {
                $pause = 0;
            }

            $netto = max($dauer - $pause, 0);
            $ueberstunden = max($netto - 480, 0);

            $entity->set('dauerminuten', $dauer);
            $entity->set('pauseminuten', $pause);
            $entity->set('nettominuten', $netto);
            $entity->set('ueberstundenminuten', $ueberstunden);

            // Wochenende (Feiertage sind separat – если нужно, можно расширить)
            $berlin = new \DateTimeZone('Europe/Berlin');
            $localDate = $dtStart->setTimezone($berlin);
            $dow = (int) $localDate->format('N'); // 6=Sa, 7=So
            $isWeekend = ($dow >= 6);
            $entity->set('feiertagwochenende', $isWeekend);

        } catch (\Throwable $e) {
            // молча не падаем, просто не считаем
        }
    }
}
