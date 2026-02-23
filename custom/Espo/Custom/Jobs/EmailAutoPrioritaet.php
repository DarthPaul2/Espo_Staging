<?php

namespace Espo\Custom\Jobs;

use Espo\Core\Job\Job;
use Espo\Core\Job\Job\Data;
use Espo\ORM\EntityManager;

class EmailAutoPrioritaet implements Job
{
    private EntityManager $entityManager;

    private int $maxPerRun = 200;
    private int $maxAgeDays = 14;

    private string $logPath = '/var/www/espocrm-staging/data/logs/email_auto_prioritaet.log';

    public function __construct(EntityManager $entityManager)
    {
        $this->entityManager = $entityManager;
    }

    public function run(Data $data): void
    {
        $repo = $this->entityManager->getRepository('Email');

        $cutoff = (new \DateTimeImmutable('now'))
            ->modify('-' . $this->maxAgeDays . ' days')
            ->format('Y-m-d H:i:s');

        // Берём только новые письма (не старше cutoff),
        // у которых приоритет ещё не стоит (NULL или пусто).
        $where = [
            'createdAt>=' => $cutoff,
            'OR' => [
                ['cEmailPrioritaet' => null],
                ['cEmailPrioritaet' => ''],
            ],
        ];

        $emails = $repo
            ->where($where)
            ->order('createdAt', true)
            ->limit($this->maxPerRun)
            ->find();

        $found     = is_iterable($emails) ? count($emails) : 0;
        $checked   = 0;
        $processed = 0;

        file_put_contents(
            $this->logPath,
            date('Y-m-d H:i:s') . " START cutoff={$cutoff} found={$found}\n",
            FILE_APPEND
        );

        foreach ($emails as $email) {
            $checked++;

            $prio = $this->detectPriority($email);
            if ($prio === null) {
                continue;
            }

            $email->set('cEmailPrioritaet', $prio);

            $this->entityManager->saveEntity($email, [
                'skipHooks' => true,
                'silent'    => true,
            ]);

            $processed++;
        }

        file_put_contents(
            $this->logPath,
            date('Y-m-d H:i:s') . " SUMMARY checked={$checked} processed={$processed} cutoff={$cutoff}\n",
            FILE_APPEND
        );
    }

    private function detectPriority($entity): ?string
    {
        // Если уже выставлено (не пусто) — не трогаем
        $current = $entity->get('cEmailPrioritaet');
        if (is_string($current) && trim($current) !== '') {
            return null;
        }

        $lower = function (string $s): string {
            if ($s === '') return '';
            return function_exists('mb_strtolower') ? mb_strtolower($s, 'UTF-8') : strtolower($s);
        };

        $subject  = (string) ($entity->get('name') ?? '');
        $subject2 = (string) ($entity->get('subject') ?? '');

        $bodyPlain = (string) ($entity->get('bodyPlain') ?? '');
        $bodyHtml  = (string) ($entity->get('body') ?? '');

        $from    = (string) ($entity->get('fromString') ?? '');
        $replyTo = (string) ($entity->get('replyToString') ?? '');

        $cat = (string) ($entity->get('cEmailKategorie') ?? '');

        $text = $lower(
            $subject . "\n" .
            $subject2 . "\n" .
            $bodyPlain . "\n" .
            $bodyHtml . "\n" .
            $from . "\n" .
            $replyTo
        );

        $hasAny = function (array $needles) use ($text, $lower): bool {
            foreach ($needles as $n) {
                $n = trim((string) $n);
                if ($n === '') continue;
                if (strpos($text, $lower($n)) !== false) return true;
            }
            return false;
        };

        // 1) Немедленно (Sofort): авария / инцидент / критическая неисправность
        if ($hasAny([
            'störung','stoerung','alarm','brand','feuer','sabota','sabotage',
            'ausfall','totalausfall','keine verbindung','offline','notdienst',
            'einbruch','einbruchalarm','bma störung','ema störung','iq8 störung'
        ])) {
            return 'sofort';
        }

        // 2) Высокое (Hoch): срочные сроки, сегодня/завтра, коды/верификация
        if ($hasAny([
            'dringend','eilig','asap','so schnell wie möglich','bitte sofort',
            'heute','noch heute','bis heute','morgen','bis morgen',
            'frist','abgabefrist','deadline',
            'otp','tan','pin','einmalcode','sicherheitscode','verifizierung','verification','bestätigung','bestaetigung','confirm'
        ])) {
            return 'hoch';
        }

        // 3) “Не требует реакции” — если уже помечено как spam (или явный newsletter)
        if ($cat === 'spam' || $hasAny([
            'newsletter','webinar','jetzt anmelden','marketing','aktion','rabatt','sale'
        ])) {
            return 'keineReaktion';
        }

        // 4) Категорийные дефолты (консервативно)
        // service без явной аварии = normal
        if ($cat === 'service') {
            return 'normal';
        }

        // buchhaltung обычно normal (если не было “frist/letzte mahnung” — это ловится выше)
        if ($cat === 'buchhaltung') {
            return 'normal';
        }

        // angebot обычно normal
        if ($cat === 'angebot') {
            return 'normal';
        }

        // bericht чаще niedrig (документы/протоколы обычно не пожар)
        if ($cat === 'bericht') {
            return 'niedrig';
        }

        // intern по умолчанию niedrig (если не было “codes/heute/dringend” — это ловится выше)
        if ($cat === 'intern') {
            return 'niedrig';
        }

        return null;
    }
}