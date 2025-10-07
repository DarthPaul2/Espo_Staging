<?php
namespace Espo\Custom\Hooks\CAuftragsposition;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Utils\Log;

class TriggerServerRecalc
{
    private string $flaskBase;
    private ?string $basicAuth;

    public function __construct(
        private EntityManager $em,
        private Log $log
    ) {
        $this->flaskBase = rtrim(getenv('KLESEC_API_BASE') ?: 'https://klesec.pagekite.me/api', '/');
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
            $this->log->warning("[CAuftragsposition→Recalc] {$reason} → server recalc OK ({$code})");
        } else {
            $this->log->warning("[CAuftragsposition→Recalc] {$reason} → server recalc FAILED code={$code} err={$err} resp=" . substr((string)$resp, 0, 300));
        }
    }

    public function afterSave(Entity $pos, array $options = []): void
    {
        // ← новый ранний выход
        if (!empty($options['skipRecalc'])) {
            $this->log->warning('[CAuftragsposition→Recalc] skipped by option afterSave');
            return;
        }

        $auftragId = (string) $pos->get('auftragId');
        if ($auftragId) {
            $this->triggerRecalc($auftragId, 'afterSave(CAuftragsposition)');
        }
    }

    public function afterRemove(Entity $pos, array $options = []): void
    {
        // ← новый ранний выход
        if (!empty($options['skipRecalc'])) {
            $this->log->warning('[CAuftragsposition→Recalc] skipped by option afterRemove');
            return;
        }

        $auftragId = (string) $pos->get('auftragId');
        if ($auftragId) {
            $this->triggerRecalc($auftragId, 'afterRemove(CAuftragsposition)');
        }
    }

}
