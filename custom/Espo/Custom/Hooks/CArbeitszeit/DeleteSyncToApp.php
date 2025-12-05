<?php
namespace Espo\Custom\Hooks\CArbeitszeit;

use Espo\ORM\Entity;
use Espo\Core\Utils\Log;
use Espo\Core\Utils\Config;

class DeleteSyncToApp
{
    private Log $log;
    private Config $config;

    public function __construct(Log $log, Config $config)
    {
        $this->log    = $log;
        $this->config = $config;
    }

    public function afterRemove(Entity $entity, array $options = []): void
    {
        try {
            $externalId = $entity->get('externalid');

            if (!$externalId) {
                $this->log->debug("[CArbeitszeit→Flask-DELETE] no externalid, skip");
                return;
            }

            // URL из конфига (тот же что у SyncToApp)
            $baseUrl = rtrim($this->config->get('flaskPdfUrl'), '/');
            $user    = $this->config->get('flaskAuthUser');
            $pass    = $this->config->get('flaskAuthPass');
            $url     = "{$baseUrl}/arbeitszeiten/{$externalId}";

            $this->log->info("[CArbeitszeit→Flask-DELETE] DELETE $url");

            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_CUSTOMREQUEST  => 'DELETE',
                CURLOPT_USERPWD        => "$user:$pass",
            ]);

            $response = curl_exec($ch);
            $status   = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);

            curl_close($ch);

            if ($status >= 200 && $status < 300) {
                $this->log->info("[CArbeitszeit→Flask-DELETE] OK: externalId={$externalId} deleted in App");
            } else {
                $this->log->warning("[CArbeitszeit→Flask-DELETE] FAILED: HTTP $status, resp=$response");
            }

        } catch (\Throwable $e) {
            $this->log->error("[CArbeitszeit→Flask-DELETE] exception: {$e->getMessage()}");
        }
    }
}
