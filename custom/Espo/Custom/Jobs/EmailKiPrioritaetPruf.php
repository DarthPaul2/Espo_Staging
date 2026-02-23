<?php

namespace Espo\Custom\Jobs;

use Espo\Core\Job\Job;
use Espo\Core\Job\Job\Data;
use Espo\ORM\EntityManager;

class EmailKiPrioritaetPruf implements Job
{
    private EntityManager $entityManager;

    private string $endpoint = 'http://127.0.0.1:5000/api/email/ai_check_priority';
    private float $minConfidenceToChange = 0.65;

    private int $maxPerRun = 30;
    private int $maxBodyChars = 2000;

    private int $maxAgeDays = 14;

    public function __construct(EntityManager $entityManager)
    {
        $this->entityManager = $entityManager;
    }

    public function run(Data $data): void
    {
        $logPath = '/var/www/espocrm-staging/data/logs/email_ai_prioritaet_pruf.log';
        $repo = $this->entityManager->getRepository('Email');

        $cutoff = (new \DateTimeImmutable('now'))
            ->modify('-' . $this->maxAgeDays . ' days')
            ->format('Y-m-d H:i:s');

        // Берём только письма:
        // - приоритет уже есть (после EmailAutoPrioritaet)
        // - ещё не проверены ИИ по приоритету
        // - не старше cutoff
        $emails = $repo
            ->where([
                'cEmailPrioritaet!=' => null,
                'cPrioAiCheckedAt'   => null,
                'createdAt>='        => $cutoff,
            ])
            ->order('createdAt', true)
            ->limit($this->maxPerRun)
            ->find();

        $checked = 0;
        $changed = 0;
        $errors  = 0;

        foreach ($emails as $email) {
            $checked++;

            $id      = (string) $email->getId();
            $curPrio = (string) ($email->get('cEmailPrioritaet') ?? '');
            $cat     = (string) ($email->get('cEmailKategorie') ?? '');

            // ✅ HARD RULE: spam всегда "keineReaktion" и без вызова ИИ
            if ($cat === 'spam') {
                $email->set('cPrioAiCheckedAt', date('Y-m-d H:i:s'));
                $email->set('cPrioAiStatus', 'skipped');
                $email->set('cPrioAiConfidence', 1.0);
                $email->set('cPrioAiReason', 'HARD RULE: Kategorie=spam => Priorität=keineReaktion (ohne KI).');
                $email->set('cPrioAiModel', 'rule');

                if ($curPrio !== 'keineReaktion') {
                    $email->set('cPrioAiOldPrioritaet', $curPrio);
                    $email->set('cEmailPrioritaet', 'keineReaktion');
                    $email->set('cPrioAiStatus', 'changed');

                    file_put_contents(
                        $logPath,
                        date('Y-m-d H:i:s') . " CHANGED_RULE id={$id} {$curPrio} -> keineReaktion (cat=spam)\n",
                        FILE_APPEND
                    );
                } else {
                    file_put_contents(
                        $logPath,
                        date('Y-m-d H:i:s') . " SKIP_RULE id={$id} cur=keineReaktion (cat=spam)\n",
                        FILE_APPEND
                    );
                }

                $this->entityManager->saveEntity($email, ['skipHooks' => true, 'silent' => true]);
                continue;
            }

            // lock
            $email->set('cPrioAiCheckedAt', date('Y-m-d H:i:s'));
            $email->set('cPrioAiStatus', 'running');
            $this->entityManager->saveEntity($email, ['skipHooks' => true, 'silent' => true]);

            $subject = (string) (($email->get('name') ?? '') ?: ($email->get('subject') ?? ''));
            $from    = (string) ($email->get('fromString') ?? '');

            $bodyPlain = (string) ($email->get('bodyPlain') ?? '');
            $bodyHtml  = (string) ($email->get('body') ?? '');
            $body = $bodyPlain !== '' ? $bodyPlain : $bodyHtml;
            $body = $this->truncateUtf8($body, $this->maxBodyChars);

            $payload = [
                'subject'          => $subject,
                'body'             => $body,
                'from'             => $from,
                'current_priority' => $curPrio,
                'category'         => $cat,
            ];

            $resp = $this->httpPostJson($this->endpoint, $payload, 30);

            $aiStatusOut = 'error';
            $aiFinal  = null;
            $aiConf   = 0.0;
            $aiReason = '';
            $aiModel  = 'meta-llama/llama-4-scout-17b-16e-instruct';

            if ($resp['ok'] && is_array($resp['json'])) {
                $json = $resp['json'];

                if (($json['status'] ?? '') === 'ok') {
                    $aiFinal  = (string) ($json['final_priority'] ?? '');
                    $aiConf   = (float) ($json['confidence'] ?? 0.0);
                    $aiReason = (string) ($json['reason'] ?? '');
                    $aiStatusOut = 'ok';
                } else {
                    $aiStatusOut = 'error';
                    $aiReason = 'AI error: ' . (string) ($json['error'] ?? 'unknown');
                    $errors++;
                }
            } else {
                $aiStatusOut = 'error';
                $aiReason = 'HTTP error: ' . $resp['error'];
                $errors++;
            }

            // метаданные
            $email->set('cPrioAiConfidence', $aiConf);
            $email->set('cPrioAiReason', $this->truncateUtf8($aiReason, 1000));
            $email->set('cPrioAiModel', $aiModel);
            $email->set('cPrioAiStatus', $aiStatusOut);

            if ($aiStatusOut === 'ok' && $aiFinal && $aiFinal !== $curPrio) {
                if ($aiConf >= $this->minConfidenceToChange) {
                    $email->set('cPrioAiOldPrioritaet', $curPrio);
                    $email->set('cEmailPrioritaet', $aiFinal);
                    $email->set('cPrioAiStatus', 'changed');
                    $changed++;

                    file_put_contents(
                        $logPath,
                        date('Y-m-d H:i:s') . " CHANGED id={$id} {$curPrio} -> {$aiFinal} conf={$aiConf} reason=" . $this->oneLine($aiReason) . "\n",
                        FILE_APPEND
                    );
                } else {
                    $email->set('cPrioAiStatus', 'skipped');
                    file_put_contents(
                        $logPath,
                        date('Y-m-d H:i:s') . " SKIP_LOW_CONF id={$id} cur={$curPrio} ai={$aiFinal} conf={$aiConf} reason=" . $this->oneLine($aiReason) . "\n",
                        FILE_APPEND
                    );
                }
            } else {
                file_put_contents(
                    $logPath,
                    date('Y-m-d H:i:s') . " CHECK id={$id} cur={$curPrio} ai=" . ($aiFinal ?? '-') . " conf={$aiConf} status={$aiStatusOut} reason=" . $this->oneLine($aiReason) . "\n",
                    FILE_APPEND
                );
            }

            $this->entityManager->saveEntity($email, ['skipHooks' => true, 'silent' => true]);
        }

        file_put_contents(
            $logPath,
            date('Y-m-d H:i:s') . " SUMMARY checked={$checked} changed={$changed} errors={$errors} cutoff={$cutoff}\n",
            FILE_APPEND
        );
    }

    private function httpPostJson(string $url, array $payload, int $timeoutSec): array
    {
        $ch = curl_init($url);
        $json = json_encode($payload, JSON_UNESCAPED_UNICODE);

        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS     => $json,
            CURLOPT_TIMEOUT        => $timeoutSec,
        ]);

        $body = curl_exec($ch);
        $err  = curl_error($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($body === false || $code < 200 || $code >= 300) {
            return [
                'ok'    => false,
                'error' => trim("code={$code} err={$err} body=" . (is_string($body) ? $this->truncateUtf8($body, 300) : '')),
                'json'  => null,
            ];
        }

        $decoded = json_decode($body, true);

        return [
            'ok'    => is_array($decoded),
            'error' => is_array($decoded) ? '' : 'invalid_json',
            'json'  => $decoded,
        ];
    }

    private function oneLine(string $s): string
    {
        $s = trim($s);
        $s = preg_replace("/\s+/", " ", $s);
        return $this->truncateUtf8($s, 300);
    }

    private function truncateUtf8(string $s, int $maxChars): string
    {
        $s = (string) $s;
        if ($s === '') return '';
        if (function_exists('mb_strlen') && function_exists('mb_substr')) {
            if (mb_strlen($s, 'UTF-8') > $maxChars) {
                return mb_substr($s, 0, $maxChars, 'UTF-8');
            }
            return $s;
        }
        return strlen($s) > $maxChars ? substr($s, 0, $maxChars) : $s;
    }
}