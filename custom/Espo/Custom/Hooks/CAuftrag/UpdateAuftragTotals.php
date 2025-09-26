<?php
namespace Espo\Custom\Hooks\CAuftrag;

use Espo\ORM\Entity;
use Espo\Core\Utils\Log;

class UpdateAuftragTotals
{
    private Log $log;

    // подхватываем базу API из ENV; дефолт — твой pagekite
    private string $flaskBase;
    private ?string $basicAuth;

    public function __construct(Log $log)
    {
        $this->log = $log;

        $this->flaskBase = rtrim(getenv('KLESEC_API_BASE') ?: 'https://klesec.pagekite.me/api', '/');
        // базовая авторизация опциональна; если нужна — задай в ENV KLESEC_API_BASIC=Base64(admin:pass)
        $this->basicAuth = getenv('KLESEC_API_BASIC') ?: null;
    }

    private function triggerRecalc(string $auftragId, string $reason): void
    {
        $url = $this->flaskBase . '/auftrag/' . rawurlencode($auftragId) . '/recalc_totals';

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 8,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
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
            $this->log->debug("[AuftragTotalsHook] {$reason} → server recalc OK ({$code})");
        } else {
            $this->log->warning("[AuftragTotalsHook] {$reason} → server recalc FAILED code={$code} err={$err} resp=" . substr((string)$resp, 0, 300));
        }
    }

    /**
     * Пересчитываем ТОЛЬКО на relate/unrelate, чтобы избежать зацикливания.
     * Сигнатуры могут отличаться между версиями, поэтому берём relationName гибко.
     */
    public function afterRelate(Entity $entity, array $data = [], $arg3 = null): void
    {
        $relation = is_string($arg3) ? $arg3 : ($data['relationName'] ?? null);
        $this->log->debug("[AuftragTotalsHook] afterRelate relation=" . json_encode($relation) . " data=" . json_encode($data));

        if (!$relation) return;
        if ($relation !== 'angebots' && $relation !== 'rechnungs') return;

        $id = $entity->getId();
        if (!$id) return;

        $this->triggerRecalc($id, "afterRelate:{$relation}");
    }

    public function afterUnrelate(Entity $entity, array $data = [], $arg3 = null): void
    {
        $relation = is_string($arg3) ? $arg3 : ($data['relationName'] ?? null);
        $this->log->debug("[AuftragTotalsHook] afterUnrelate relation=" . json_encode($relation) . " data=" . json_encode($data));

        if (!$relation) return;
        if ($relation !== 'angebots' && $relation !== 'rechnungs') return;

        $id = $entity->getId();
        if (!$id) return;

        $this->triggerRecalc($id, "afterUnrelate:{$relation}");
    }
}
