<?php
namespace Espo\Custom\Hooks\CArbeitszeit;

use Espo\ORM\Entity;
use Espo\Core\Utils\Log;
use Espo\Core\Utils\Config;
use Espo\ORM\EntityManager;
use DateTime;
use DateTimeZone;

class SyncToApp
{
    private Log $log;
    private Config $config;
    private EntityManager $entityManager;
    private DateTimeZone $berlinTz;

    public function __construct(
        Log $log,
        Config $config,
        EntityManager $entityManager
    ) {
        $this->log = $log;
        $this->config = $config;
        $this->entityManager = $entityManager;
        $this->berlinTz = new DateTimeZone('Europe/Berlin');
    }

    public function afterSave(Entity $entity, array $options = []): void
    {
        try {
            $id = $entity->getId();

            // 0) Запуск, для логов
            $this->log->debug("[CArbeitszeit→App] afterSave for {$id}");

            // 🔹 1. Если вызов из самого Espo для тех. сохранения — пропускаем (чтобы не зациклиться)
            if (!empty($options['fromFlask'])) {
                $this->log->debug("[CArbeitszeit→App] skip (fromFlask) for {$id}");
                return;
            }

            // 🔹 2. Следим только за реально важными изменениями
            $watched = [
                'startzeit', 'endzeit',
                'pauseminuten', 'dauerminuten', 'nettominuten',
                'autoended',
                'ueberstundenminuten', 'feiertagwochenende',
                'technikerId', 'startlat', 'startlng', 'endlat', 'endlng',
            ];

            $hasChanges = false;
            foreach ($watched as $attr) {
                if ($entity->isAttributeChanged($attr)) {
                    $hasChanges = true;
                    break;
                }
            }

            if (!$hasChanges) {
                $this->log->debug("[CArbeitszeit→App] no relevant changes for {$id}, skip");
                return;
            }

            // 🔹 3. Базовые настройки для запроса в Flask
            $baseUrl = rtrim($this->config->get('flaskPdfUrl'), '/');
            $user    = $this->config->get('flaskAuthUser');
            $pass    = $this->config->get('flaskAuthPass');

            if (!$baseUrl || !$user || !$pass) {
                $this->log->warning("[CArbeitszeit→App] missing Flask config, abort for {$id}");
                return;
            }

            // 🔹 4. Время: из UTC в локальное Berlin (строкой для Flask)
            $startLocal = null;
            $endLocal   = null;

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

            // 🔹 5. Общие данные для payload
            $payloadBase = [
                'startzeit'            => $startLocal,
                'endzeit'              => $endLocal,
                'pause_minuten'        => $entity->get('pauseminuten'),
                'dauer_minuten'        => $entity->get('dauerminuten'),
                'netto_minuten'        => $entity->get('nettominuten'),
                'auto_ended'           => $entity->get('autoended') ?? false,
                'ueberstunden_minuten' => $entity->get('ueberstundenminuten'),
                'feiertagwochenende'   => $entity->get('feiertagwochenende'),
                'start_lat'            => $entity->get('startlat'),
                'start_lng'            => $entity->get('startlng'),
                'end_lat'              => $entity->get('endlat'),
                'end_lng'              => $entity->get('endlng'),
                // флаг, чтобы Flask понимал: это инициатива Espo
                'fromEspo'             => true,
            ];

            $externalId = $entity->get('externalid');

            // =====================================================
            // ВЕТКА 1: externalid ЕСТЬ → обновляем существующую запись в App
            // =====================================================
            if (!empty($externalId)) {
                $url = "{$baseUrl}/arbeitszeiten/{$externalId}";
                $payload = $payloadBase;

                $this->log->info("[CArbeitszeit→App] PUT {$url} payload=" . json_encode($payload, JSON_UNESCAPED_UNICODE));

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
                    $this->log->info("[CArbeitszeit→App] PUT ok: externalid={$externalId}, HTTP {$status}");
                } else {
                    $this->log->warning("[CArbeitszeit→App] PUT failed: externalid={$externalId}, HTTP {$status}, resp={$response}");
                }

                return;
            }

            // =====================================================
            // ВЕТКА 2: externalid НЕТ → нужно СОЗДАТЬ запись в App
            // =====================================================

            // Без техником из Espo смысла нет — App не поймёт, кому принадлежит смена
            $technikerEspoId = $entity->get('technikerId');
            if (empty($technikerEspoId)) {
                $this->log->warning("[CArbeitszeit→App] no technikerId for {$id}, skip creation in App");
                return;
            }

            $url = "{$baseUrl}/arbeitszeiten";
            $payload = $payloadBase + [
                'techniker_espo_id' => $technikerEspoId,
            ];

            $this->log->info("[CArbeitszeit→App] POST {$url} payload=" . json_encode($payload, JSON_UNESCAPED_UNICODE));

            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST           => true,
                CURLOPT_USERPWD        => "$user:$pass",
                CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
                CURLOPT_POSTFIELDS     => json_encode($payload, JSON_UNESCAPED_UNICODE),
            ]);

            $response = curl_exec($ch);
            $status   = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
            curl_close($ch);

            if ($status < 200 || $status >= 300) {
                $this->log->warning("[CArbeitszeit→App] POST failed: HTTP {$status}, resp={$response}");
                return;
            }

            $data = json_decode($response, true);
            if (!is_array($data) || empty($data['id'])) {
                $this->log->warning("[CArbeitszeit→App] POST ok, aber keine ID im Response: {$response}");
                return;
            }

            $newId = (string) $data['id'];
            $this->log->info("[CArbeitszeit→App] POST ok, neue Arbeitszeit-ID={$newId}, schreibe in externalid");

            // Прописываем externalid и сохраняем сущность БЕЗ повторного вызова hook-а
            $entity->set('externalid', $newId);
            $this->entityManager->saveEntity($entity, ['fromFlask' => true]);

        } catch (\Throwable $e) {
            $this->log->error("[CArbeitszeit→App] exception: " . $e->getMessage());
        }
    }
}
