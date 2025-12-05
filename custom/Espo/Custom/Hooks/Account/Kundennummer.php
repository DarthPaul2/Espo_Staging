<?php
namespace Espo\Custom\Hooks\Account;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Utils\Log;

class Kundennummer
{
    private const PREFIX     = 'KD-';
    private const PAD_LEN    = 5;
    private const START_FROM = 22109;          // последний существующий -> следующий будет +1
    private const LOCK_NAME  = 'kundennummer_lock';

    public function __construct(
        private EntityManager $em,
        private Log $log
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        // Только для новых и только если поле пустое
        if (!$entity->isNew() || $entity->get('cKundennummer')) {
            return;
        }

        $pdo = $this->em->getPDO();

        // Берём глобальную блокировку на последовательность
        $stmt = $pdo->prepare("SELECT GET_LOCK(:k, 5)");
        $stmt->execute([':k' => self::LOCK_NAME]);
        $gotLock = (int) $stmt->fetchColumn() === 1;

        try {
            $sql = "
                SELECT MAX(CAST(SUBSTRING(c_kundennummer, :pos) AS UNSIGNED))
                FROM account
                WHERE c_kundennummer LIKE :like
            ";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':pos'  => strlen(self::PREFIX) + 1,
                ':like' => self::PREFIX . '%',
            ]);

            $max = $stmt->fetchColumn();
            $max = $max !== null ? (int) $max : self::START_FROM;

            $next  = $max + 1;
            $value = self::PREFIX . str_pad((string) $next, self::PAD_LEN, '0', STR_PAD_LEFT);

            $entity->set('cKundennummer', $value);
            $this->log->debug('Generated cKundennummer: ' . $value);
        } finally {
            if ($gotLock) {
                $pdo->prepare("SELECT RELEASE_LOCK(:k)")->execute([':k' => self::LOCK_NAME]);
            }
        }
    }

    /**
     * После сохранения отправляем Account в Flask API.
     * Если deleted = true → Flask удалит клиента из appklesec.kunden.
     */
    public function afterSave(Entity $entity, array $options = []): void
    {
        try {
            $payload = [
                'id'                        => $entity->getId(),
                'name'                      => $entity->get('name'),
                'cKundennummer'             => $entity->get('cKundennummer'),
                'cHausnummer'               => $entity->get('cHausnummer'),
                'billingAddressStreet'      => $entity->get('billingAddressStreet'),
                'billingAddressPostalCode'  => $entity->get('billingAddressPostalCode'),
                'billingAddressCity'        => $entity->get('billingAddressCity'),
                'emailAddress'              => $entity->get('emailAddress'),
                'phoneNumber'               => $entity->get('phoneNumber'),
                'assignedUserId'            => $entity->get('assignedUserId'),
                'modifiedAt'                => $entity->get('modifiedAt'),
                'deleted'                   => $entity->get('deleted') ? true : false,
            ];

            $ch = curl_init("https://klesec.pagekite.me/api/accounts/upsert");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));

            $response = curl_exec($ch);
            if (curl_errno($ch)) {
                $this->log->error("Curl error: " . curl_error($ch));
            }
            curl_close($ch);

            $this->log->debug("Sent Account to Flask API: " . json_encode($payload));
            $this->log->debug("Response: " . $response);

        } catch (\Throwable $e) {
            $this->log->error("Kundennummer afterSave error: " . $e->getMessage());
        }
    }

    public function afterRemove(Entity $entity, array $options = []): void
{
    try {
        $payload = [
            'id'        => $entity->getId(),
            'name'      => $entity->get('name'),
            'deleted'   => true,
            'modifiedAt'=> date('Y-m-d H:i:s'),
        ];

        $ch = curl_init("https://klesec.pagekite.me/api/accounts/upsert");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));

        $response = curl_exec($ch);
        if (curl_errno($ch)) {
            $this->log->error("Curl error (afterRemove): " . curl_error($ch));
        }
        curl_close($ch);

        $this->log->debug("Sent Account DELETE to Flask API: " . json_encode($payload));
        $this->log->debug("Response: " . $response);

    } catch (\Throwable $e) {
        $this->log->error("Kundennummer afterRemove error: " . $e->getMessage());
    }
}

}
