<?php
namespace Espo\Custom\Hooks\Task;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Utils\Log;

class TestLog
{
    public function __construct(
        private EntityManager $em,
        private Log $log
    ) {}

    public function afterSave(Entity $entity, array $options = []): void
    {
        $this->log->info("TEST HOOK: Task gespeichert, ID=" . $entity->getId());
    }
}
