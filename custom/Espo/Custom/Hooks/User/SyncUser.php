<?php
namespace Espo\Custom\Hooks\User;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Utils\Log;

class SyncUser
{
    public function __construct(
        private EntityManager $em,
        private Log $log
    ) {}

    /**
     * После сохранения пользователя отправляем JSON в Flask (/api/users/upsert).
     * Синхронизирует name/isActive/phoneNumber в appklesec.techniker по espo_user_id.
     */
    public function afterSave(Entity $entity, array $options = []): void
    {
        try {
            $payload = [
                'id'          => $entity->getId(),
                'name'        => $entity->get('name'),
                'isActive'    => $entity->get('isActive') ? true : false,
                'phoneNumber' => $entity->get('phoneNumber'),
            ];

            $url = "https://klesec.pagekite.me/api/users/upsert";

            // 🔐 секрет из окружения (мы уже прокинули его в PHP-FPM)
            $secret  = getenv('ESPO_WEBHOOK_SECRET') ?: '';
            $headers = ['Content-Type: application/json'];
            if ($secret !== '') {
                $headers[] = 'X-Secret: ' . $secret;
            }

            $this->log->debug('[SyncUser] Payload -> ' . json_encode($payload, JSON_UNESCAPED_UNICODE));

            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER     => $headers,
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => json_encode($payload),
                CURLOPT_CONNECTTIMEOUT => 3,
                CURLOPT_TIMEOUT        => 5,
            ]);

            $response = curl_exec($ch);
            $errno    = curl_errno($ch);
            $errstr   = curl_error($ch);
            $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($errno) {
                $this->log->error("[SyncUser] cURL error {$errno}: {$errstr}");
                return;
            }

            $this->log->debug("[SyncUser] HTTP {$httpCode}, response: " . (string) $response);

        } catch (\Throwable $e) {
            $this->log->error('SyncUser afterSave exception: ' . $e->getMessage());
        }
    }
}
