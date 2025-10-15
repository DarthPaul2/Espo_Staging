<?php
namespace Espo\Custom\Hooks\CArbeitszeit;

use Espo\ORM\Entity;
use Espo\Core\Utils\Log;
use Espo\Core\Utils\Config;
use DateTime;
use DateTimeZone;

class AfterSave
{
    private Log $log;
    private Config $config;
    private DateTimeZone $berlinTz;

    public function __construct(Log $log, Config $config)
    {
        $this->log    = $log;
        $this->config = $config;
        $this->berlinTz = new DateTimeZone('Europe/Berlin');
    }

    public function afterSave(Entity $entity, array $options = []): void
    {
        try {
            // 🔹 Пропускаем, если сохранение инициировано Flask (во избежание рекурсии)
            if (!empty($options['fromFlask']) || $entity->get('fromFlask')) {
                $this->log->debug("[CArbeitszeit→Flask] skip recursive update for {$entity->getId()}");
                return;
            }

            // 🔹 Пропускаем, если нет externalid (значит, запись не синхронизирована)
            $externalId = $entity->get('externalid');
            if (empty($externalId)) {
                $this->log->debug("[CArbeitszeit→Flask] no externalid for {$entity->getId()}");
                return;
            }

            // 🔹 Пропускаем, если изменение пришло от системного пользователя Espo
            $currentUser = $this->config->get('systemUserId') ?? null;
            $modifiedBy  = $entity->get('modifiedById');
            if ($modifiedBy === $currentUser) {
                $this->log->debug("[CArbeitszeit→Flask] skipped self-update for {$entity->getId()}");
                return;
            }

            // 🔹 Настройки подключения к Flask (берутся из config.php)
            $baseUrl = rtrim($this->config->get('flaskPdfUrl'), '/');
            $user    = $this->config->get('flaskAuthUser');
            $pass    = $this->config->get('flaskAuthPass');
            $url     = "{$baseUrl}/arbeitszeiten/{$externalId}";

            // 🔹 Преобразуем время UTC → Berlin (без смещения)
            $startzeit = $entity->get('startzeit');
            $endzeit   = $entity->get('endzeit');

            $startLocal = null;
            $endLocal = null;

            if (!empty($startzeit)) {
                $dt = new DateTime($startzeit, new DateTimeZone('UTC'));
                $dt->setTimezone($this->berlinTz);
                $startLocal = $dt->format('Y-m-d H:i:s');
            }

            if (!empty($endzeit)) {
                $dt = new DateTime($endzeit, new DateTimeZone('UTC'));
                $dt->setTimezone($this->berlinTz);
                $endLocal = $dt->format('Y-m-d H:i:s');
            }

            // 🔹 Формируем тело запроса (теперь с корректным временем)
            $payload = [
                'startzeit'      => $startLocal,
                'endzeit'        => $endLocal,
                'pause_minuten'  => $entity->get('pauseminuten'),
                'dauer_minuten'  => $entity->get('dauerminuten'),
                'netto_minuten'  => $entity->get('nettominuten'),
                'auto_ended'     => $entity->get('autoEnded') ?? false,
                'fromFlask'      => true,
            ];

            $this->log->info("[CArbeitszeit→Flask] send payload: " . json_encode($payload, JSON_UNESCAPED_UNICODE));

            // 🔹 Отправляем PUT во Flask
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_CUSTOMREQUEST  => 'PUT',
                CURLOPT_USERPWD        => "$user:$pass",
                CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
                CURLOPT_POSTFIELDS     => json_encode($payload, JSON_UNESCAPED_UNICODE),
            ]);

            $response = curl_exec($ch);
            $status   = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
            curl_close($ch);

            if ($status >= 200 && $status < 300) {
                $this->log->info("[CArbeitszeit→Flask] PUT ok: id={$externalId}, HTTP {$status}");
            } else {
                $this->log->warning("[CArbeitszeit→Flask] PUT failed: id={$externalId}, HTTP {$status}, resp={$response}");
            }

        } catch (\Throwable $e) {
            $this->log->error("[CArbeitszeit→Flask] exception: " . $e->getMessage());
        }
    }
}
