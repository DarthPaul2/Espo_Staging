<?php
namespace Espo\Custom\Hooks\CLieferschein;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Utils\Log;

class AutoNumber
{
    private const PREFIX = 'LS';                      // Префикс для Lieferschein
    private const LOCK   = 'lieferscheinnummer_lock'; // Имя блокировки

    public function __construct(
        private EntityManager $em,
        private Log $log
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        // Только при создании и если номер ещё не задан
        if (!$entity->isNew() || $entity->get('lieferscheinnummer')) {
            return;
        }

        $year = date('y');                         // например "26"
        $pfx  = self::PREFIX . '-' . $year . '-';  // "LS-26-"

        $pdo = $this->em->getPDO();

        // Глобальная блокировка на последовательность (без привязки к году)
        $stmt = $pdo->prepare("SELECT GET_LOCK(:k, 5)");
        $stmt->execute([':k' => self::LOCK]);
        $gotLock = (int) $stmt->fetchColumn() === 1;

        try {
            // MAX ПО ВСЕМ ГОДАМ, только по не-удалённым (удалённые "освобождают" номер, если были последними)
            $sql = "
                SELECT MAX(CAST(SUBSTRING_INDEX(lieferscheinnummer, '-', -1) AS UNSIGNED))
                FROM c_lieferschein
                WHERE lieferscheinnummer LIKE :like
                  AND deleted = 0
            ";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':like' => self::PREFIX . '-%']); // LS-%
            $max = $stmt->fetchColumn();
            $max = $max !== null ? (int) $max : 0;

            // стартуем с 10001, дальше наращиваем
            $next = $max >= 10000 ? $max + 1 : 10001;

            $value = $pfx . (string) $next;
            $entity->set('lieferscheinnummer', $value);

            // Если поле Name пустое — подставляем "LS-YY-xxxxx · <Kunde>"
            if (!$entity->get('name')) {
                $accName = $entity->get('accountName'); // через link Account
                $label = $accName ? ($value . ' · ' . $accName) : $value;
                $entity->set('name', mb_substr($label, 0, 255));
            }

            $this->log->debug('Generated Lieferscheinnummer: ' . $value);
        } finally {
            if ($gotLock) {
                $pdo->prepare("SELECT RELEASE_LOCK(:k)")->execute([':k' => self::LOCK]);
            }
        }
    }
}
