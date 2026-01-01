<?php
namespace Espo\Custom\Hooks\CAuftrag;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Utils\Log;

class AutoNumber
{
    private const PREFIX = 'KSA';
    private const LOCK   = 'auftragsnummer_lock';

    public function __construct(
        private EntityManager $em,
        private Log $log
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        $pdo   = $this->em->getPDO();
        $isNew = $entity->isNew();

        // === 1) Генерация Auftragsnummer (только при создании и если номера нет)
        if ($isNew && !$entity->get('auftragsnummer')) {

            $year = date('y');                           // напр. "26"
            $pfx  = self::PREFIX . '-' . $year . '-';    // "KSA-26-"

            // глобальная блокировка на последовательность (БЕЗ привязки к году)
            $stmt = $pdo->prepare("SELECT GET_LOCK(:k, 5)");
            $stmt->execute([':k' => self::LOCK]);
            $gotLock = (int) $stmt->fetchColumn() === 1;

            try {
                // MAX ПО ВСЕМ ГОДАМ, только по не-удалённым (удалённые "освобождают" номер, если были последними)
                $sql = "
                    SELECT MAX(CAST(SUBSTRING_INDEX(auftragsnummer, '-', -1) AS UNSIGNED))
                    FROM c_auftrag
                    WHERE auftragsnummer LIKE :like
                      AND deleted = 0
                ";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([':like' => self::PREFIX . '-%']); // KSA-%
                $max = $stmt->fetchColumn();
                $max = $max !== null ? (int) $max : 0;

                // стартуем с 1, дальше 2,3...
                $next = $max > 0 ? $max + 1 : 1;

                // форматируем в 4 знака с ведущими нулями: 0001, 0002, 0118, 1234
                $numberPart = str_pad((string) $next, 4, '0', STR_PAD_LEFT);

                $value = $pfx . $numberPart; // KSA-26-0001 ...

                $entity->set('auftragsnummer', $value);
                $this->log->debug('Generated Auftragsnummer: ' . $value);

            } finally {
                if (!empty($gotLock)) {
                    $pdo->prepare("SELECT RELEASE_LOCK(:k)")->execute([':k' => self::LOCK]);
                }
            }
        }

        // === 2) Автозаполнение name (Nr · Firma)
        $nr       = (string) ($entity->get('auftragsnummer') ?? '');
        $accName  = (string) ($entity->get('accountName') ?? '');
        $curName  = (string) ($entity->get('name') ?? '');
        $autoName = $nr ? trim($nr . ($accName ? ' · ' . $accName : '')) : '';

        $startsWithNr = ($nr !== '') && str_starts_with($curName, $nr);
        $looksLikeNr  = (bool) preg_match(
            '/^' . preg_quote(self::PREFIX, '/') . '-\d{2}-\d+/',
            $curName
        );

        // На создании: если name пустой или не похоже на авто-имя — ставим "<Nr> · <Firma>"
        if ($isNew && $autoName !== '') {
            if ($curName === '' || !$looksLikeNr) {
                $entity->set('name', mb_substr($autoName, 0, 255));
                return;
            }
        }

        // При смене accountId: обновим хвост, если name выглядел как авто-имя
        if ($entity->isAttributeChanged('accountId') && $autoName !== '') {
            if ($curName === '' || $startsWithNr) {
                $entity->set('name', mb_substr($autoName, 0, 255));
            }
        }
    }
}
