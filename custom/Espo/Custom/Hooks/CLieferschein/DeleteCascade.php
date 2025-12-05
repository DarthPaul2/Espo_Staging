<?php
namespace Espo\Custom\Hooks\CLieferschein;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Utils\Log;

class DeleteCascade
{
    public function __construct(
        private EntityManager $em,
        private Log $log
    ) {}

    private function removePositions(string $lieferscheinId): void
    {
        $repo = $this->em->getRepository('CLieferscheinposition');
        $positions = $repo->where(['lieferscheinId' => $lieferscheinId])->find();

        foreach ($positions as $pos) {
            // Мягкое удаление (как в UI). Если нужен «хард»-удалитель из БД — см. примечание ниже.
            $this->em->removeEntity($pos);
        }

        $this->log->info("[DeleteCascade] Entfernt ".count($positions)." Position(en) für Lieferschein {$lieferscheinId}.");
    }

    // Срабатывает при удалении записи через UI/массовое удаление/REST
    public function beforeRemove(Entity $entity, array $options = []): void
    {
        $id = $entity->getId();
        if ($id) {
            $this->removePositions($id);
        }
    }

    // Подстраховка (на случай нестандартных путей удаления)
    public function afterRemove(Entity $entity, array $options = []): void
    {
        $id = $entity->get('id') ?: $entity->getId();
        if ($id) {
            $this->removePositions($id);
        }
    }
}
