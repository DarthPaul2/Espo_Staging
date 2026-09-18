<?php
namespace Espo\Custom\Hooks\Task;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Utils\Log;

class SyncTask
{
    public function __construct(
        private EntityManager $em,
        private Log $log
    ) {}

    /**
     * После сохранения задачи отправляем JSON в Flask (/api/tasks/import).
     */
public function afterSave(Entity $entity, array $options = []): void
{
    try {
        $payload = [
            'espoTaskId'     => $entity->getId(),
            'name'           => $entity->get('name'),
            'status'         => $entity->get('status'),
            'description'    => $entity->get('description'),
            'assignedUserId' => $entity->get('assignedUserId'),
            'parentType'     => $entity->get('parentType'),
            'parentId'       => $entity->get('parentId'),
            'parentName'     => $entity->get('parentName') ?: null,
        ];

        $url = "https://klesec.pagekite.me/api/tasks/import";

        // 🔐 секрет из окружения (мы уже прокинули его в PHP-FPM)
        $secret  = getenv('ESPO_WEBHOOK_SECRET') ?: '';
        $headers = ['Content-Type: application/json'];
        if ($secret !== '') {
            $headers[] = 'X-Secret: ' . $secret;
        }

        $this->log->debug('[SyncTask] Payload -> ' . json_encode($payload, JSON_UNESCAPED_UNICODE));

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode($payload),
            CURLOPT_CONNECTTIMEOUT => 3,   // ⏱ быстрее фейлим коннект
            CURLOPT_TIMEOUT        => 5,   // ⏱ общий таймаут
        ]);

        $response = curl_exec($ch);
        $errno    = curl_errno($ch);
        $errstr   = curl_error($ch);
        $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($errno) {
            $this->log->error("[SyncTask] cURL error {$errno}: {$errstr}");
            return;
        }

        $this->log->debug("[SyncTask] HTTP {$httpCode}, response: " . (string) $response);

    } catch (\Throwable $e) {
        $this->log->error('SyncTask afterSave exception: ' . $e->getMessage());
    }
}
}
