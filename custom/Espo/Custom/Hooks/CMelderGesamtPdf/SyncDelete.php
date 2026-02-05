<?php

namespace Espo\Custom\Hooks\CMelderGesamtPdf;

use Espo\Core\Utils\Log;
use Espo\ORM\Entity;

class SyncDelete
{
    private Log $log;

    private const FALLBACK_URL = 'https://klesec.pagekite.me/api/espo/webhook/delete';
    private const FALLBACK_SECRET = '46356316ca66c2eb81e0f234626e1rr3';

    public function __construct(Log $log)
    {
        $this->log = $log;
    }

    public function afterRemove(Entity $entity, array $options = []): void
    {
        $sourceId = $entity->get('sourceId');

        $this->log->info('[CMelderGesamtPdf][afterRemove] start id=' . (string)$entity->getId() . ' sourceId=' . (string)$sourceId);

        if (!$sourceId) {
            $this->log->warning('[CMelderGesamtPdf][afterRemove] sourceId empty -> skip');
            return;
        }

        $url = getenv('APPKLESEC_WEBHOOK_URL') ?: self::FALLBACK_URL;
        $secret = getenv('ESPO_WEBHOOK_SECRET') ?: self::FALLBACK_SECRET;

        $payload = json_encode([
            'entity'   => 'CMelderGesamtPdf',
            'sourceId' => (string) $sourceId,
        ], JSON_UNESCAPED_UNICODE);

        $this->send($url, $secret, $payload, 'CMelderGesamtPdf');
    }

    private function send(string $url, string $secret, string $payload, string $tag): void
    {
        if (!$url) {
            $this->log->error("[$tag][afterRemove] url empty -> skip");
            return;
        }

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'X-Webhook-Secret: ' . $secret,
        ]);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);

        $resp = curl_exec($ch);
        $errNo = curl_errno($ch);
        $err   = curl_error($ch);
        $code  = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($errNo) {
            $this->log->error("[$tag][afterRemove] curl error $errNo: $err");
            return;
        }

        $this->log->info("[$tag][afterRemove] webhook http=$code resp=" . (string)$resp);

        if ($code < 200 || $code >= 300) {
            $this->log->error("[$tag][afterRemove] webhook failed http=$code resp=" . (string)$resp);
        }
    }
}
