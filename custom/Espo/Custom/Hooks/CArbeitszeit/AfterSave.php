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
        $this->log = $log;
        $this->config = $config;
        $this->berlinTz = new DateTimeZone('Europe/Berlin');
    }

    public function afterSave(Entity $entity, array $options = []): void
    {
        try {
            // 🔹 1. Если сохранение пришло из Flask — выходим (чтобы не создать цикл)
            if (!empty($options['fromFlask']) || $entity->get('fromFlask')) {
                $this->log->debug("[CArbeitszeit→Flask] skip recursive update for {$entity->getId()}");
                return;
            }

            // 🔹 2. Проверка на наличие externalid
            $externalId = $entity->get('externalid');
            if (empty($externalId)) {
                $this->log->debug("[CArbeitszeit→Flask] no externalid for {$entity->getId()}");
                return;
            }

            // 🔹 3. Пропускаем, если нет реальных изменений (иначе будет зацикливание)
            $watched = [
                'startzeit', 'endzeit', 'pauseminuten', 'dauerminuten',
                'nettominuten', 'autoended', 'status',
                'ueberstundenminuten', 'feiertagwochenende'
            ];

            $hasChanges = false;
            foreach ($watched as $attr) {
                if ($entity->isAttributeChanged($attr)) {
                    $hasChanges = true;
                    break;
                }
            }

            if (!$hasChanges) {
                $this->log->debug("[CArbeitszeit→Flask] no relevant changes for {$entity->getId()}, skip");
                return;
            }

            // 🔹 4. Пропускаем изменения от системного пользователя
            $currentUser = $this->config->get('systemUserId') ?? null;
            $modifiedBy  = $entity->get('modifiedById');
            if ($modifiedBy === $currentUser) {
                $this->log->debug("[CArbeitszeit→Flask] skipped self-update for {$entity->getId()}");
                return;
            }

            // 🔹 5. Подготовка подключения
            $baseUrl = rtrim($this->config->get('flaskPdfUrl'), '/');
            $user    = $this->config->get('flaskAuthUser');
            $pass    = $this->config->get('flaskAuthPass');
            $url     = "{$baseUrl}/arbeitszeiten/{$externalId}";

            // 🔹 6. Конвертация времени (UTC → Berlin)
            $startLocal = null;
            $endLocal = null;

            if ($entity->get('startzeit')) {
                $dt = new DateTime($entity->get('startzeit'), new DateTimeZone('UTC'));
                $dt->setTimezone($this->berlinTz);
                $startLocal = $dt->format('Y-m-d H:i:s');
            }

            if ($entity->get('endzeit')) {
                $dt = new DateTime($entity->get('endzeit'), new DateTimeZone('UTC'));
                $dt->setTimezone($this->berlinTz);
                $endLocal = $dt->format('Y-m-d H:i:s');
            }

            // 🔹 7. Формируем тело запроса
            $payload = [
                'startzeit'      => $startLocal,
                'endzeit'        => $endLocal,
                'pause_minuten'  => $entity->get('pauseminuten'),
                'dauer_minuten'  => $entity->get('dauerminuten'),
                'netto_minuten'  => $entity->get('nettominuten'),
                'auto_ended'     => $entity->get('autoended') ?? false,
                'ueberstunden_minuten' => $entity->get('ueberstundenminuten'),
                'feiertagwochenende'   => $entity->get('feiertagwochenende'),
                'fromFlask'      => true,
            ];

            $this->log->info("[CArbeitszeit→Flask] send payload: " . json_encode($payload, JSON_UNESCAPED_UNICODE));

            // 🔹 8. Отправляем PUT во Flask
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
