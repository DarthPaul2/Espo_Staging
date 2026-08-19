<?php

namespace Espo\Custom\Hooks\CAbwesenheit;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

/**
 * Пересчитывает cUrlaubTage / cKrankTage на User при изменении Abwesenheit.
 * Urlaub (typ=U) — только рабочие дни (Пн-Пт). Krank (typ=K) — календарные дни.
 * Учитывается только текущий календарный год, статусы кроме "Nicht durchgeführt",
 * и только дни ДО СЕГОДНЯ включительно — запланированные будущие дни не считаются.
 */
class RecalcUserTage
{
    public function __construct(private EntityManager $entityManager) {}

    public function afterSave(Entity $entity, array $options = []): void
    {
        $this->recalcForUser($entity->get('assignedUserId'));

        $prevAssignedUserId = $entity->getFetched('assignedUserId');
        if ($prevAssignedUserId && $prevAssignedUserId !== $entity->get('assignedUserId')) {
            $this->recalcForUser($prevAssignedUserId);
        }
    }

    public function afterRemove(Entity $entity, array $options = []): void
    {
        $this->recalcForUser($entity->get('assignedUserId'));
    }

    private function recalcForUser(?string $userId): void
    {
        if (!$userId) {
            return;
        }

        $user = $this->entityManager->getEntityById('User', $userId);
        if (!$user) {
            return;
        }

        [$urlaubTage, $krankTage] = self::calc($this->entityManager, $userId);

        $user->set('cUrlaubTage', $urlaubTage);
        $user->set('cKrankTage', $krankTage);

        $this->entityManager->saveEntity($user, ['skipHooks' => true, 'silent' => true]);
    }

    /**
     * @return array{0: int, 1: int}
     */
    public static function calc(EntityManager $entityManager, string $userId): array
    {
        $year = (int) date('Y');
        $tz = new \DateTimeZone('Europe/Berlin');
        $utc = new \DateTimeZone('UTC');
        $today = (new \DateTimeImmutable('now', $tz))->setTime(0, 0, 0);

        $records = $entityManager
            ->getRepository('CAbwesenheit')
            ->where([
                'assignedUserId' => $userId,
                'status!=' => 'Nicht durchgeführt',
            ])
            ->find();

        $urlaubTage = 0;
        $krankTage = 0;

        foreach ($records as $record) {
            $start = $record->get('dateStart');
            $end = $record->get('dateEnd');
            $typ = $record->get('typ');

            if (!$start || !$end) {
                continue;
            }

            try {
                $startLocal = (new \DateTimeImmutable($start, $utc))->setTimezone($tz)->setTime(0, 0, 0);
                $endLocal = (new \DateTimeImmutable($end, $utc))->setTimezone($tz)->setTime(0, 0, 0);
            } catch (\Throwable $e) {
                continue;
            }

            if ((int) $startLocal->format('Y') !== $year) {
                continue;
            }

            if ($typ === 'U') {
                $urlaubTage += self::countDays($startLocal, $endLocal, true, $today);
            } elseif ($typ === 'K') {
                $krankTage += self::countDays($startLocal, $endLocal, false, $today);
            }
        }

        return [$urlaubTage, $krankTage];
    }

    private static function countDays(
        \DateTimeImmutable $startLocal,
        \DateTimeImmutable $endLocal,
        bool $workdaysOnly,
        \DateTimeImmutable $today
    ): int {
        if ($startLocal > $today) {
            return 0;
        }

        $spanDays = max(1, (int) $startLocal->diff($endLocal)->days);

        $count = 0;
        for ($i = 0; $i < $spanDays; $i++) {
            $day = $startLocal->modify("+{$i} day");
            if ($day > $today) {
                break;
            }
            if (!$workdaysOnly || (int) $day->format('N') <= 5) {
                $count++;
            }
        }

        return $count;
    }
}
