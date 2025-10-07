<?php
namespace Espo\Custom\Hooks\Task;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Utils\Log;
use Espo\Core\Utils\Config;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

class OutlookSync
{
    public function __construct(
        private EntityManager $em,
        private Log $log,
        private Config $config
    ) {}

    public function afterSave(Entity $entity, array $options = []): void
    {
        $this->log->info("OutlookSync: afterSave HOOK вызван. Task ID=" . $entity->getId());

        $assignedUserId = $entity->get('assignedUserId');
        if (!$assignedUserId) {
            $this->log->warning("OutlookSync: assignedUserId отсутствует.");
            return;
        }

        $user = $this->em->getEntity('User', $assignedUserId);
        if (!$user) {
            $this->log->warning("OutlookSync: Пользователь {$assignedUserId} не найден.");
            return;
        }

        $userEmail = $user->get('emailAddress');
        if (!$userEmail) {
            $this->log->warning("OutlookSync: У пользователя нет email.");
            return;
        }

        $subject     = $entity->get('name') ?? 'Neue Aufgabe';
        $description = $entity->get('description') ?? '';
        $start       = $entity->get('dateStart');
        $end         = $entity->get('dateEnd');
        $location    = $entity->get('location') ?? 'EspoCRM';

        $startDateTime = $start ? (new \DateTime($start))->format(\DateTime::ATOM) : null;
        $endDateTime   = $end ? (new \DateTime($end))->format(\DateTime::ATOM) : null;

        $eventData = [
            'subject' => $subject,
            'body' => [
                'contentType' => 'HTML',
                'content' => $description
            ],
            'start' => [
                'dateTime' => $startDateTime,
                'timeZone' => 'Europe/Berlin'
            ],
            'end' => [
                'dateTime' => $endDateTime,
                'timeZone' => 'Europe/Berlin'
            ],
            'location' => [
                'displayName' => $location
            ],
            'attendees' => [
                [
                    'emailAddress' => [
                        'address' => $userEmail,
                        'name'    => $user->get('name')
                    ],
                    'type' => 'required'
                ]
            ]
        ];

        $token = $this->getAccessToken();
        if (!$token) {
            $this->log->error("OutlookSync: токен не получен.");
            return;
        }

        try {
            $client = new Client();
            $eventId = $entity->get('outlookEventId'); // поле в Task

            if ($eventId) {
                // Обновляем событие
                $this->log->info("OutlookSync: обновляем событие ID={$eventId}.");
                $res = $client->patch("https://graph.microsoft.com/v1.0/users/$userEmail/events/$eventId", [
                    'headers' => [
                        'Authorization' => 'Bearer ' . $token,
                        'Content-Type'  => 'application/json'
                    ],
                    'body' => json_encode($eventData, JSON_UNESCAPED_UNICODE),
                    'timeout' => 10,
                    'connect_timeout' => 5
                ]);
                $this->log->info("OutlookSync: событие обновлено. Response=" . $res->getBody()->getContents());
            } else {
                // Создаём новое событие
                $this->log->info("OutlookSync: создаём новое событие для {$userEmail}.");
                $res = $client->post("https://graph.microsoft.com/v1.0/users/$userEmail/calendar/events", [
                    'headers' => [
                        'Authorization' => 'Bearer ' . $token,
                        'Content-Type'  => 'application/json'
                    ],
                    'body' => json_encode($eventData, JSON_UNESCAPED_UNICODE),
                    'timeout' => 10,
                    'connect_timeout' => 5
                ]);

                $body = $res->getBody()->getContents();
                $response = json_decode($body, true);

                if (!empty($response['id'])) {
                    $entity->set('outlookEventId', $response['id']);
                    $entity->set('auftragsbestaetigungGesendetAm', (new \DateTime())->format('Y-m-d H:i:s'));
                    if (!empty($options['currentUser'])) {
                        $entity->set('auftragsbestaetigungGesendetVonId', $options['currentUser']->getId());
                        $entity->set('auftragsbestaetigungGesendetVonName', $options['currentUser']->get('name'));
                        $entity->set('auftragsbestaetigungGesendetVonType', 'User');
                    }
                    $this->em->saveEntity($entity, ['skipHooks' => true]);
                    $this->log->info("OutlookSync: событие создано, ID=" . $response['id']);
                } else {
                    $this->log->warning("OutlookSync: событие не создано, нет ID в ответе.");
                }
            }
        } catch (RequestException $e) {
            $this->log->error("OutlookSync RequestException: " . $e->getMessage());
            if ($e->hasResponse()) {
                $this->log->error("Graph API Response: " . $e->getResponse()->getBody()->getContents());
            }
        } catch (\Exception $e) {
            $this->log->error("OutlookSync Exception: " . $e->getMessage());
        }
    }

    private function getAccessToken(): ?string
    {
        $config = $this->config->get('outlook') ?? [];
        $clientId     = $config['clientId'] ?? null;
        $tenantId     = $config['tenantId'] ?? null;
        $clientSecret = $config['clientSecret'] ?? null;

        if (!$clientId || !$tenantId || !$clientSecret) {
            $this->log->error("OutlookSync: clientId/tenantId/clientSecret не заданы в config.php");
            return null;
        }

        try {
            $client = new Client();
            $res = $client->post("https://login.microsoftonline.com/$tenantId/oauth2/v2.0/token", [
                'form_params' => [
                    'client_id'     => $clientId,
                    'scope'         => 'https://graph.microsoft.com/.default',
                    'client_secret' => $clientSecret,
                    'grant_type'    => 'client_credentials'
                ]
            ]);
            $data = json_decode($res->getBody()->getContents(), true);
            return $data['access_token'] ?? null;
        } catch (\Exception $e) {
            $this->log->error("Token Exception: " . $e->getMessage());
            return null;
        }
    }
}
