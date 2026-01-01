<?php
namespace Espo\Custom\Hooks\CAngebot;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Utils\Log;

class AutoNumber
{
    private const PREFIX = 'AG';
    private const PAD    = 6;                   // 000001
    private const LOCK   = 'angebotnummer_lock';

    public function __construct(
        private EntityManager $em,
        private Log $log
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        // Только при создании и если номер ещё не задан
        if (!$entity->isNew() || $entity->get('angebotsnummer')) {
            return;
        }

        $year = date('y');                             // '26'
        $pfx  = self::PREFIX . '-' . $year . '-';     // 'AG-26-'

        $pdo = $this->em->getPDO();

        // Глобальная блокировка на последовательность (ПРИВЯЗКА К ТИПУ, НЕ К ГОДУ)
        $stmt = $pdo->prepare("SELECT GET_LOCK(:k, 5)");
        $stmt->execute([':k' => self::LOCK]);
        $gotLock = (int) $stmt->fetchColumn() === 1;

        try {
            // Берём максимальный правый 6-значный блок ПО ВСЕМ ГОДАМ (AG-XX-******)
            $sql  = "
                SELECT MAX(CAST(RIGHT(angebotsnummer, :len) AS UNSIGNED))
                FROM c_angebot
                WHERE angebotsnummer LIKE :like
            ";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':len'  => self::PAD,
                ':like' => self::PREFIX . '-%',   // <-- без привязки к году
            ]);

            $max = $stmt->fetchColumn();
            $max = $max !== null ? (int) $max : 0;

            $next  = $max + 1;
            $value = $pfx . str_pad((string) $next, self::PAD, '0', STR_PAD_LEFT);

            // Проставляем номер
            $entity->set('angebotsnummer', $value);

            // Если name пуст — заполняем его (номер · клиент)
            if (!$entity->get('name')) {
                $accName = $entity->get('accountName');        // label для link 'account'
                $label = $accName ? ($value . ' · ' . $accName) : $value;
                // гарантируем длину поля name (обычно 255)
                $entity->set('name', mb_substr($label, 0, 255));
            }

            $this->log->debug('Generated Angebotsnummer: ' . $value);
        } finally {
            if ($gotLock) {
                $pdo->prepare("SELECT RELEASE_LOCK(:k)")->execute([':k' => self::LOCK]);
            }
        }
    }
}
