<?php

namespace Espo\Custom\Jobs;

use Espo\ORM\EntityManager;

class TaskRepeatGenerator
{
    public function run(): void
    {
        $em = $this->getEntityManager();

        // 1. Берём все задачи с включённым повторением
        $tasks = $em->getRepository('Task')->where([
            'repeatEnabled' => true
        ])->find();

        $now = new \DateTime('today');

        foreach ($tasks as $task) {

            $from = $task->get('repeatFrom');
            $to   = $task->get('repeatTo');

            if (!$from || !$to) {
                continue;
            }

            $fromDt = new \DateTime($from);
            $toDt   = new \DateTime($to);

            // Если мы вне периода — ничего не делаем
            if ($now < $fromDt || $now > $toDt) {
                continue;
            }

            $every = max(1, (int) $task->get('repeatEvery'));
            $unit  = $task->get('repeatUnit') ?: 'week';

            // Серия
            $seriesId = $task->get('repeatSeriesId');
            if (!$seriesId) {
                $seriesId = $task->getId();
                $task->set('repeatSeriesId', $seriesId);
                $em->saveEntity($task, ['silent' => true]);
            }

            // Проверяем: есть ли уже задача на сегодня в этой серии
            $exists = $em->getRepository('Task')->where([
                'repeatSeriesId' => $seriesId,
                'dateStart>=' => $now->format('Y-m-d 00:00:00'),
                'dateStart<=' => $now->format('Y-m-d 23:59:59'),
            ])->findOne();

            if ($exists) {
                continue;
            }

            // Определяем, должна ли сегодня быть задача по интервалу
            $base = new \DateTime($from);
            $diffDays = $base->diff($now)->days;

            $shouldCreate = false;

            switch ($unit) {
                case 'day':
                    $shouldCreate = ($diffDays % $every === 0);
                    break;
                case 'week':
                    $shouldCreate = (int) floor($diffDays / 7) % $every === 0;
                    break;
                case 'month':
                    $months = ($now->format('Y') - $base->format('Y')) * 12
                            + ($now->format('n') - $base->format('n'));
                    $shouldCreate = ($months % $every === 0);
                    break;
            }

            if (!$shouldCreate) {
                continue;
            }

            // Создаём новую задачу
            $new = $em->getEntity('Task');
            $new->set([
                'name'        => $task->get('name'),
                'description' => $task->get('description'),
                'status'      => 'Not Started',
                'priority'    => $task->get('priority'),
                'dateStart'   => $now->format('Y-m-d 08:00:00'),
                'dateEnd'     => $now->format('Y-m-d 17:00:00'),
                'assignedUserId' => $task->get('assignedUserId'),
                'accountId'      => $task->get('accountId'),
                'contactId'      => $task->get('contactId'),
                'parentId'       => $task->get('parentId'),
                'parentType'     => $task->get('parentType'),
                'repeatSeriesId' => $seriesId,
                'repeatEnabled'  => false
            ]);

            if ($task->has('teamsIds')) {
                $new->set('teamsIds', $task->get('teamsIds'));
            }

            $em->saveEntity($new);
        }
    }

    protected function getEntityManager(): EntityManager
    {
        return \Espo\Core\Container::getInstance()->get('entityManager');
    }
}
