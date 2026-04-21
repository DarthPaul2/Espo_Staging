<?php

namespace Espo\Custom\Hooks\CZahlung;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Utils\Log;
use Espo\ORM\Repository\Option\RemoveOptions;

// Что это:
// запрещает удаление festgeschriebene Zahlung
// и одновременно чистит связанные Ausgleich у не-festgeschriebene Zahlung.
//
// Зачем:
// 1. festgeschriebene Zahlung нельзя удалять обычным способом;
// 2. если удаляется черновая/нефинальная Zahlung, её CAusgleich не должны оставаться активными.
class PreventDeleteIfFestgeschrieben
{
    public function __construct(
        private EntityManager $entityManager,
        private Log $log
    ) {}

    public function beforeRemove(Entity $entity, RemoveOptions $options): void
    {
        $status = strtolower((string) ($entity->get('status') ?? ''));
        $zahlungId = $entity->getId();

        if (!$zahlungId) {
            return;
        }

        // 1) Festgeschriebene Zahlung löschen запрещено
        if ($status === 'festgeschrieben') {
            throw new Forbidden('Festgeschriebene Zahlungen dürfen nicht gelöscht werden.');
        }

        // 2) Если Zahlung ещё НЕ festgeschrieben, то перед удалением
        //    деактивируем и soft-delete все связанные Ausgleich
        $ausgleichList = $this->entityManager
            ->getRDBRepository('CAusgleich')
            ->where([
                'zahlungId' => $zahlungId,
                'deleted' => false,
            ])
            ->find();

        foreach ($ausgleichList as $ausgleich) {
            $ausgleich->set('istAktiv', false);
            $ausgleich->set('deleted', true);

            // служебное сохранение
            $this->entityManager->saveEntity($ausgleich);
        }

        $this->log->info(
            '[PreventDeleteIfFestgeschrieben] Ausgleiche deaktiviert vor Zahlung-Löschung. zahlungId='
            . $zahlungId
            . ', count=' . count($ausgleichList)
        );
    }
}