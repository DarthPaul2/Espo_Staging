<?php
namespace Espo\Custom\Hooks\CWerkzeug;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Utils\Log;

class AutoInventarnummer
{
    // Формат: N-0000001 и т. д.
    private const PREFIX = 'N-';
    private const PAD    = 7;                  // 0000001
    private const LOCK   = 'inventarnummer_lock';

    public function __construct(
        private EntityManager $em,
        private Log $log
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        // Только при создании
        if (!$entity->isNew()) {
            return;
        }

        // Если уже есть inventarnummer (или вручную задана) — не трогаем
        $current = (string) $entity->get('inventarnummer');
        if ($current !== '' && $current !== '-' && $current !== null) {
            return;
        }

        $pdo = $this->em->getPDO();

        // Блокировка, чтобы не было гонки при одновременных сохранениях
        $stmt = $pdo->prepare("SELECT GET_LOCK(:k, 5)");
        $stmt->execute([':k' => self::LOCK]);
        $gotLock = (int) $stmt->fetchColumn() === 1;

        try {
            // Берём максимальный числовой хвост после "N-"
            $sql = "
                SELECT MAX(CAST(SUBSTRING_INDEX(inventarnummer, '-', -1) AS UNSIGNED))
                FROM c_werkzeug
                WHERE inventarnummer LIKE :prefixLike
                  AND inventarnummer IS NOT NULL
                  AND inventarnummer <> '-'
            ";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':prefixLike' => self::PREFIX . '%',
            ]);

            $max = $stmt->fetchColumn();
            $max = $max !== null ? (int) $max : 0;

            $next  = $max + 1;
            $num   = str_pad((string) $next, self::PAD, '0', STR_PAD_LEFT);
            $value = self::PREFIX . $num;

            // Проставляем инвентарный номер
            $entity->set('inventarnummer', $value);

            $this->log->debug('Generated Inventarnummer for CWerkzeug: ' . $value);
        } finally {
            if ($gotLock) {
                $pdo->prepare("SELECT RELEASE_LOCK(:k)")
                    ->execute([':k' => self::LOCK]);
            }
        }
    }
}
