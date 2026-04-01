<?php

namespace Espo\Custom\Hooks\CLieferant;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Utils\Log;

class AutoNumber
{
    private const PREFIX = 'LF';
    private const PAD    = 5; // 00001
    private const LOCK   = 'lieferantennummer_lock';

    public function __construct(
        private EntityManager $em,
        private Log $log
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        // Только при создании и если номер ещё не задан
        if (!$entity->isNew() || $entity->get('lieferantennummer')) {
            return;
        }

        $year = date('y');                         // '26'
        $pfx  = self::PREFIX . '-' . $year . '-'; // 'LF-26-'

        $pdo = $this->em->getPDO();

        // Глобальная блокировка на последовательность
        $stmt = $pdo->prepare("SELECT GET_LOCK(:k, 5)");
        $stmt->execute([':k' => self::LOCK]);
        $gotLock = (int) $stmt->fetchColumn() === 1;

        try {
            // Берём максимальный правый 5-значный блок по всем годам: LF-XX-00001
            $sql = "
                SELECT MAX(CAST(RIGHT(lieferantennummer, :len) AS UNSIGNED))
                FROM c_lieferant
                WHERE deleted = 0
                AND lieferantennummer LIKE :like
            ";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':len'  => self::PAD,
                ':like' => self::PREFIX . '-%',
            ]);

            $max = $stmt->fetchColumn();
            $max = $max !== null ? (int) $max : 0;

            $next  = $max + 1;
            $value = $pfx . str_pad((string) $next, self::PAD, '0', STR_PAD_LEFT);

            // Проставляем номер
            $entity->set('lieferantennummer', $value);

            // Если name пуст — подставляем номер
            if (!$entity->get('name')) {
                $entity->set('name', $value);
            }

            $this->log->debug('Generated Lieferantennummer: ' . $value);
        } finally {
            if ($gotLock) {
                $pdo->prepare("SELECT RELEASE_LOCK(:k)")->execute([':k' => self::LOCK]);
            }
        }
    }
}