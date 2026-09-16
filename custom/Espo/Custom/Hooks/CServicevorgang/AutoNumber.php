<?php
namespace Espo\Custom\Hooks\CServicevorgang;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Utils\Log;

/**
 * Что это: Nummernkreis "SV-YY-NNNNN" fuer CServicevorgang, analog CRechnung/AutoNumber.php.
 * Kein Zuruecksetzen des Zaehlers pro Jahr (Jahr im Namen ist nur das Erstellungsjahr).
 */
class AutoNumber
{
    private const PREFIX = 'SV';
    private const LOCK = 'servicevorgang_nummer_lock';

    public function __construct(
        private EntityManager $em,
        private Log $log
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        if (!$entity->isNew() || $entity->get('name')) {
            return;
        }

        $year = date('y');
        $prefixForYear = self::PREFIX . '-' . $year . '-';

        $pdo = $this->em->getPDO();

        $stmt = $pdo->prepare("SELECT GET_LOCK(:k, 5)");
        $stmt->execute([':k' => self::LOCK]);
        $gotLock = ((int) $stmt->fetchColumn() === 1);

        try {
            $sql = "
                SELECT MAX(CAST(SUBSTRING_INDEX(name, '-', -1) AS UNSIGNED))
                FROM c_servicevorgang
                WHERE name LIKE :like
                  AND deleted = 0
            ";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':like' => self::PREFIX . '-%']);

            $max = $stmt->fetchColumn();
            $max = $max !== null ? (int) $max : 0;
            $next = $max >= 1000 ? $max + 1 : 1001;

            $value = $prefixForYear . $next;
            $entity->set('name', $value);

            $this->log->debug('Generated Servicevorgang-Nummer: ' . $value);
        } finally {
            if ($gotLock) {
                $pdo->prepare("SELECT RELEASE_LOCK(:k)")->execute([':k' => self::LOCK]);
            }
        }
    }
}
