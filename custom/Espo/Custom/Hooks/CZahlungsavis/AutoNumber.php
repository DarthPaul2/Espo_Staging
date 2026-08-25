<?php
namespace Espo\Custom\Hooks\CZahlungsavis;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Utils\Log;

class AutoNumber
{
    private const LOCK = 'avisnummer_lock';

    // Manuell vergebene Nummer 26-100 (vor Einführung dieser Funktion) — erste
    // automatisch generierte Nummer muss daher bei 101 beginnen.
    private const START = 100;

    public function __construct(
        private EntityManager $em,
        private Log $log
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        // Что это: номер создаём только для новой записи и только если он ещё пустой
        if (!$entity->isNew() || $entity->get('avisNummer')) {
            return;
        }

        $year = date('y'); // '26'

        $pdo = $this->em->getPDO();

        // Что это: одна блокировка на генерацию номера, чтобы не было дублей
        $stmt = $pdo->prepare("SELECT GET_LOCK(:k, 5)");
        $stmt->execute([':k' => self::LOCK]);
        $gotLock = ((int) $stmt->fetchColumn() === 1);

        try {
            // Что это: максимум по ВСЕМ Zahlungsavis-Nummern (nicht nur aktuelles Jahr) —
            // Nummer läuft jahresübergreifend durch, das Jahr in der Nummer ist nur Label
            // (identisches Verhalten wie AutoNumber.php bei CRechnung).
            $sql = "
                SELECT MAX(CAST(SUBSTRING_INDEX(avis_nummer, '-', -1) AS UNSIGNED))
                FROM c_zahlungsavis
                WHERE deleted = 0
            ";

            $stmt = $pdo->query($sql);
            $max = $stmt->fetchColumn();
            $max = $max !== null ? (int) $max : 0;

            $next = $max >= self::START ? $max + 1 : self::START + 1;

            $value = $year . '-' . $next;
            $entity->set('avisNummer', $value);

            if (!$entity->get('name')) {
                $lieferantName = $entity->get('lieferantName');
                $label = $lieferantName ? ($value . ' · ' . $lieferantName) : $value;
                $entity->set('name', mb_substr($label, 0, 255));
            }

            $this->log->debug('Generated Avis-Nummer: ' . $value);
        } finally {
            if ($gotLock) {
                $pdo->prepare("SELECT RELEASE_LOCK(:k)")->execute([':k' => self::LOCK]);
            }
        }
    }
}
