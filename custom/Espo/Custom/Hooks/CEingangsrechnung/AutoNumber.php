<?php

namespace Espo\Custom\Hooks\CEingangsrechnung;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Utils\Log;

class AutoNumber
{
    private const PREFIX = 'ERE';
    private const PAD    = 6; // 000001
    private const LOCK   = 'eingangsrechnungsnummer_lock';

    public function __construct(
        private EntityManager $em,
        private Log $log
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        // Что это: номер создаём только при новой записи и только если его ещё нет.
        if (!$entity->isNew() || $entity->get('eingangsrechnungsnummer')) {
            return;
        }

        $year = date('y');                         // '26'
        $pfx  = self::PREFIX . '-' . $year . '-'; // 'ERE-26-'

        $pdo = $this->em->getPDO();

        // Что это: глобальная блокировка, чтобы не получить одинаковые номера при одновременном создании.
        $stmt = $pdo->prepare("SELECT GET_LOCK(:k, 5)");
        $stmt->execute([':k' => self::LOCK]);
        $gotLock = (int) $stmt->fetchColumn() === 1;

        try {
            // Что это: ищем максимальный уже существующий порядковый номер.
            $sql = "
                SELECT MAX(CAST(RIGHT(eingangsrechnungsnummer, :len) AS UNSIGNED))
                FROM c_eingangsrechnung
                WHERE deleted = 0
                AND eingangsrechnungsnummer LIKE :like
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

            // Что это: сохраняем внутренний номер входящего счёта.
            $entity->set('eingangsrechnungsnummer', $value);

            // Что это: если служебное поле name пустое, заполняем его как "номер - поставщик".
            if (!$entity->get('name')) {
                $lieferantName = trim((string) ($entity->get('lieferantName') ?? ''));
                $label = $lieferantName !== ''
                    ? ($value . ' - ' . $lieferantName)
                    : $value;

                $entity->set('name', mb_substr($label, 0, 255));
            }

            $this->log->debug('Generated Eingangsrechnungsnummer: ' . $value);
        } finally {
            // Что это: обязательно снимаем блокировку после генерации номера.
            if ($gotLock) {
                $pdo->prepare("SELECT RELEASE_LOCK(:k)")->execute([':k' => self::LOCK]);
            }
        }
    }
}