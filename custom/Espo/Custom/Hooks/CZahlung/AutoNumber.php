<?php

namespace Espo\Custom\Hooks\CZahlung;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Utils\Log;
use Espo\Core\Exceptions\Error;

class AutoNumber
{
    private const PREFIX = 'ZLG';
    private const TEST_PREFIX = 'TEST-ZLG';
    private const PAD = 6; // 000001
    private const LOCK = 'zahlung_nummer_lock';

    public function __construct(
        private EntityManager $em,
        private Log $log
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        // Что это:
        // номер создаём только при новой записи и только если его ещё нет.
        if (!$entity->isNew() || $entity->get('zahlungsnummer')) {
            return;
        }

        // Что это:
        // в CZahlung клиент хранится в поле account, поставщик — в lieferant.
        $accountId = (string) ($entity->get('accountId') ?? '');
        $lieferantId = (string) ($entity->get('lieferantId') ?? '');

        $accountName = trim((string) ($entity->get('accountName') ?? ''));
        $lieferantName = trim((string) ($entity->get('lieferantName') ?? ''));

        // Что это:
        // без клиента или поставщика Zahlung создавать нельзя.
        if ($accountId === '' && $lieferantId === '') {
            throw new Error('Fuer eine Zahlung muss ein Kunde oder ein Lieferant ausgewaehlt sein.');
        }

        $isTest = (bool) $entity->get('testmodus');
        $prefixBase = $isTest ? self::TEST_PREFIX : self::PREFIX;

        $year = date('y');                        // z. B. 26
        $pfx  = $prefixBase . '-' . $year . '-'; // z. B. ZLG-26- oder TEST-ZLG-26-

        $pdo = $this->em->getPDO();

        // Что это:
        // глобальная блокировка, чтобы не получить одинаковые номера при одновременном создании.
        $stmt = $pdo->prepare("SELECT GET_LOCK(:k, 5)");
        $stmt->execute([':k' => self::LOCK]);
        $gotLock = (int) $stmt->fetchColumn() === 1;

        try {
            // Что это:
            // ищем максимальный уже существующий порядковый номер отдельно по обычному или тестовому префиксу.
            $sql = "
                SELECT MAX(CAST(RIGHT(zahlungsnummer, :len) AS UNSIGNED))
                FROM c_zahlung
                WHERE deleted = 0
                  AND zahlungsnummer LIKE :like
            ";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':len'  => self::PAD,
                ':like' => $prefixBase . '-%',
            ]);

            $max = $stmt->fetchColumn();
            $max = $max !== null ? (int) $max : 0;

            $next  = $max + 1;
            $value = $pfx . str_pad((string) $next, self::PAD, '0', STR_PAD_LEFT);

            // Что это:
            // сохраняем внутренний номер оплаты.
            $entity->set('zahlungsnummer', $value);

            // Что это:
            // если служебное поле name пустое, заполняем его как "номер - клиент/поставщик".
            if (!$entity->get('name')) {
                $partnerName = $accountName !== ''
                    ? $accountName
                    : ($lieferantName !== '' ? $lieferantName : 'Ohne Partner');

                $label = $value . ' - ' . $partnerName;
                $entity->set('name', mb_substr($label, 0, 255));
            }

            $this->log->debug('Generated Zahlungsnummer: ' . $value);
        } finally {
            // Что это:
            // обязательно снимаем блокировку после генерации номера.
            if ($gotLock) {
                $pdo->prepare("SELECT RELEASE_LOCK(:k)")->execute([':k' => self::LOCK]);
            }
        }
    }
}