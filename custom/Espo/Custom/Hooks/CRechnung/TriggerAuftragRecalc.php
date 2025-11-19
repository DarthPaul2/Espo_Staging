<?php
namespace Espo\Custom\Hooks\CRechnung;

use Espo\ORM\Entity;
use Espo\Core\Utils\Log;

class TriggerAuftragRecalc
{
    private Log $log;
    private string $flaskBase;
    private ?string $basicAuth;

    public function __construct(Log $log)
    {
        $this->log = $log;
        $this->flaskBase = rtrim(getenv('KLESEC_API_BASE') ?: 'https://klesec.pagekite.me/api', '/');
        $this->basicAuth = getenv('KLESEC_API_BASIC') ?: null;
    }

    private function triggerRecalc(?string $auftragId, string $reason): void
    {
        if (!$auftragId) {
            return;
        }
        $url = $this->flaskBase . '/auftrag/' . rawurlencode($auftragId) . '/recalc_totals';

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST   => 'POST',
            CURLOPT_RETURNTRANSFER  => true,
            CURLOPT_TIMEOUT         => 8,
            CURLOPT_SSL_VERIFYPEER  => false,
            CURLOPT_SSL_VERIFYHOST  => false,
        ]);
        $headers = ['Accept: application/json'];
        if ($this->basicAuth) {
            $headers[] = 'Authorization: Basic ' . $this->basicAuth;
        }
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $resp = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err  = curl_error($ch);
        curl_close($ch);

        if ($code >= 200 && $code < 300) {
            $this->log->debug("[RechnungTotalsHook] {$reason} → recalc OK ({$code})");
        } else {
            $this->log->warning("[RechnungTotalsHook] {$reason} → recalc FAILED code={$code} err={$err} resp=" . substr((string)$resp, 0, 300));
        }
    }

    public function afterSave(Entity $entity, array $data = []): void
    {
        // реагируем только на значимые изменения
        $modified = (array)($data['modifiedFields'] ?? []);
        $significant = array_intersect($modified, [
            'status', 'betragNetto', 'betragBrutto', 'auftragId', 'rechnungstyp'
        ]);
        if (empty($significant)) {
            return;
        }

        // если сменился Auftrag — пересчитать старый и новый
        $currentAuftragId = $entity->get('auftragId') ?: null;
        $prevAuftragId = $data['previous']['auftragId'] ?? null;

        if ($prevAuftragId && $prevAuftragId !== $currentAuftragId) {
            $this->triggerRecalc($prevAuftragId, 'afterSave:prevAuftrag');
        }
        $this->triggerRecalc($currentAuftragId, 'afterSave:currentAuftrag');
    }

    public function afterRemove(Entity $entity, array $data = []): void
    {
        // у удаления нет текущих полей, берем из $data['previous'] если есть
        $auftragId = $entity->get('auftragId') ?: ($data['previous']['auftragId'] ?? null);
        $this->triggerRecalc($auftragId, 'afterRemove');
    }
}
