<?php
namespace Espo\Custom\Hooks\CRechnung;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Utils\Log;

class AutoNumber
{
    private const PREFIX = 'RE';
    private const TEST_PREFIX = 'TEST-RE';
    private const LOCK = 'rechnungsnummer_lock';

    public function __construct(
        private EntityManager $em,
        private Log $log
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        // Что это: номер создаём только для новой записи и только если он ещё пустой
        if (!$entity->isNew() || $entity->get('rechnungsnummer')) {
            return;
        }

        $isTest = (bool) $entity->get('istTest');
        $year = date('y'); // '26'

        // Что это: выбираем префикс в зависимости от тестового режима
        $prefixBase = $isTest ? self::TEST_PREFIX : self::PREFIX;
        $prefixForYear = $prefixBase . '-' . $year . '-'; // TEST-RE-26- или RE-26-

        $pdo = $this->em->getPDO();

        // Что это: одна блокировка на генерацию номера, чтобы не было дублей
        $stmt = $pdo->prepare("SELECT GET_LOCK(:k, 5)");
        $stmt->execute([':k' => self::LOCK]);
        $gotLock = ((int) $stmt->fetchColumn() === 1);

        try {
            // Что это: ищем последний номер только в своём контуре
            // для обычных: RE-%
            // для тестовых: TEST-RE-%
            $sql = "
                SELECT MAX(CAST(SUBSTRING_INDEX(rechnungsnummer, '-', -1) AS UNSIGNED))
                FROM c_rechnung
                WHERE rechnungsnummer LIKE :like
                  AND deleted = 0
            ";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':like' => $prefixBase . '-%' // RE-% или TEST-RE-%
            ]);

            $max = $stmt->fetchColumn();
            $max = $max !== null ? (int) $max : 0;

            // Что это: стартуем с 10001, как и раньше
            $next = $max >= 10000 ? $max + 1 : 10001;

            $value = $prefixForYear . $next;
            $entity->set('rechnungsnummer', $value);

            // Что это: автозаполнение name
            if (!$entity->get('name')) {
                $accName = $entity->get('accountName');
                $label = $accName ? ($value . ' · ' . $accName) : $value;
                $entity->set('name', mb_substr($label, 0, 255));
            }

            $this->log->debug('Generated Rechnungsnummer: ' . $value);
        } finally {
            if ($gotLock) {
                $pdo->prepare("SELECT RELEASE_LOCK(:k)")->execute([':k' => self::LOCK]);
            }
        }
    }
}