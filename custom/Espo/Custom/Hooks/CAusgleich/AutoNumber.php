<?php

namespace Espo\Custom\Hooks\CAusgleich;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Utils\Log;
use Espo\Core\Exceptions\BadRequest;

/**
 * Что это:
 * Автонумерация Ausgleich и автозаполнение name.
 *
 * Зачем:
 * Даёт понятный внутренний номер Ausgleich для UI, логов и поиска,
 * а также сразу формирует читаемое имя записи.
 */
class AutoNumber
{
    private const PREFIX = 'AUS';
    private const TEST_PREFIX = 'TEST-AUS';
    private const LOCK = 'ausgleichsnummer_lock';

    public function __construct(
        private EntityManager $em,
        private Log $log
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        // Что это:
        // Проверка fachlicher базовой связи.
        //
        // Зачем:
        // Ausgleich должен относиться ровно к одному документу.
        $rechnungId = $entity->get('rechnungId');
        $eingangsrechnungId = $entity->get('eingangsrechnungId');

        $hasRechnung = !empty($rechnungId);
        $hasEingangsrechnung = !empty($eingangsrechnungId);

        if (!$hasRechnung && !$hasEingangsrechnung) {
            throw new BadRequest('Es muss entweder eine Rechnung oder eine Eingangsrechnung ausgewählt sein.');
        }

        if ($hasRechnung && $hasEingangsrechnung) {
            throw new BadRequest('Es darf nur entweder eine Rechnung oder eine Eingangsrechnung ausgewählt werden, nicht beide gleichzeitig.');
        }

        // Что это:
        // Номер присваиваем только при создании, если он ещё пустой.
        if ($entity->isNew() && !$entity->get('ausgleichsnummer')) {
            $entity->set('ausgleichsnummer', $this->generateNumber($entity));
        }

        // Что это:
        // Всегда поддерживаем name в понятном виде.
        //
        // Зачем:
        // Чтобы запись была читаемой в списках и связях.
        $entity->set('name', $this->buildName($entity));
    }

    /**
     * Что это:
     * Генерация следующего номера Ausgleich.
     *
     * Зачем:
     * Чтобы избежать дублей даже при одновременном создании.
     */
    private function generateNumber(Entity $entity): string
    {
        $isTest = (bool) ($entity->get('testmodus') ?? false);

        $prefix = $isTest ? self::TEST_PREFIX : self::PREFIX;
        $year = date('y');
        $numberPrefix = $prefix . '-' . $year . '-';

        $pdo = $this->em->getPDO();

        $lockStmt = $pdo->prepare("SELECT GET_LOCK(:lockKey, 10)");
        $lockStmt->execute([
            'lockKey' => self::LOCK,
        ]);

        try {
            $sql = "
                SELECT ausgleichsnummer
                FROM c_ausgleich
                WHERE deleted = 0
                  AND ausgleichsnummer LIKE :prefix
                ORDER BY ausgleichsnummer DESC
                LIMIT 1
            ";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'prefix' => $numberPrefix . '%',
            ]);

            $lastNumber = $stmt->fetchColumn();

            $next = 1;

            if ($lastNumber && preg_match('/(\d+)$/', (string) $lastNumber, $m)) {
                $next = (int) $m[1] + 1;
            }

            return $numberPrefix . str_pad((string) $next, 6, '0', STR_PAD_LEFT);
        } finally {
            try {
                $unlockStmt = $pdo->prepare("DO RELEASE_LOCK(:lockKey)");
                $unlockStmt->execute([
                    'lockKey' => self::LOCK,
                ]);
            } catch (\Throwable $e) {
                $this->log->error('CAusgleich AutoNumber unlock error: ' . $e->getMessage());
            }
        }
    }

    /**
     * Что это:
     * Формирует понятное имя Ausgleich.
     *
     * Зачем:
     * Чтобы в UI сразу было видно, к какому документу относится запись.
     */
    private function buildName(Entity $entity): string
    {
        $ausgleichsnummer = trim((string) ($entity->get('ausgleichsnummer') ?? ''));
        if ($ausgleichsnummer === '') {
            $ausgleichsnummer = 'AUSGLEICH';
        }

        $rechnungId = $entity->get('rechnungId');
        $eingangsrechnungId = $entity->get('eingangsrechnungId');

        if ($rechnungId) {
            $rechnung = $this->em->getEntity('CRechnung', $rechnungId);

            $nummer = '';
            if ($rechnung) {
                $nummer = trim((string) ($rechnung->get('rechnungsnummer') ?? ''));
            }

            if ($nummer !== '') {
                return $ausgleichsnummer . ' - Rechnung ' . $nummer;
            }

            return $ausgleichsnummer . ' - Rechnung';
        }

        if ($eingangsrechnungId) {
            $eingangsrechnung = $this->em->getEntity('CEingangsrechnung', $eingangsrechnungId);

            $nummer = '';
            if ($eingangsrechnung) {
                $nummer = trim((string) ($eingangsrechnung->get('eingangsrechnungsnummer') ?? ''));
            }

            if ($nummer !== '') {
                return $ausgleichsnummer . ' - Eingangsrechnung ' . $nummer;
            }

            return $ausgleichsnummer . ' - Eingangsrechnung';
        }

        return $ausgleichsnummer . ' - Beleg';
    }
}