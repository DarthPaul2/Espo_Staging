<?php
namespace Espo\Custom\Hooks\CRechnung;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Utils\Log;

class AutoNumber
{
    private const PREFIX = 'RE';
    private const LOCK   = 'rechnungsnummer_lock';

    public function __construct(
        private EntityManager $em,
        private Log $log
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        // Только при создании и если номер ещё не задан
        if (!$entity->isNew() || $entity->get('rechnungsnummer')) {
            return;
        }

        $year = date('y');                     // '25'
        $pfx  = self::PREFIX . '-' . $year . '-';  // 'RE-25-'

        $pdo = $this->em->getPDO();

        // Глобальная блокировка на последовательность (привязываем к году)
        $stmt = $pdo->prepare("SELECT GET_LOCK(:k, 5)");
        $stmt->execute([':k' => self::LOCK . '_' . $year]);
        $gotLock = (int) $stmt->fetchColumn() === 1;

        try {
            // Берём максимальное правое число у номеров текущего года
            $sql  = "
                SELECT MAX(CAST(SUBSTRING_INDEX(rechnungsnummer, '-', -1) AS UNSIGNED))
                FROM c_rechnung
                WHERE rechnungsnummer LIKE :like
            ";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':like' => $pfx . '%']);
            $max = $stmt->fetchColumn();
            $max = $max !== null ? (int) $max : 0;

            // Схема у вас 'RE-YY-1xxxx' (стартуем с 10001, как в маршруте next_number)
            $next = $max >= 10000 ? $max + 1 : 10001;

            $value = $pfx . (string) $next;
            $entity->set('rechnungsnummer', $value);

            // Если name пуст — заполняем его (номер · Kunde)
            if (!$entity->get('name')) {
                $accName = $entity->get('accountName'); // label линка account
                $label = $accName ? ($value . ' · ' . $accName) : $value;
                $entity->set('name', mb_substr($label, 0, 255));
            }

            $this->log->debug('Generated Rechnungsnummer: ' . $value);
        } finally {
            if ($gotLock) {
                $pdo->prepare("SELECT RELEASE_LOCK(:k)")->execute([':k' => self::LOCK . '_' . $year]);
            }
        }
    }
}
