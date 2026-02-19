<?php

namespace Espo\Custom\Jobs;

use Espo\Core\Job\Job;
use Espo\Core\Job\Job\Data;
use Espo\ORM\EntityManager;

class EmailAutoKategorie implements Job
{
    private EntityManager $entityManager;

    // safety
    private int $maxPerRun = 200;

    // ✅ не трогаем письма старше N дней (чтобы не гонять историю)
    private int $maxAgeDays = 14;

    private string $logPath = '/var/www/espocrm-staging/data/logs/email_auto_kategorie.log';

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

        // ✅ ВАЖНО:
        // Отбираем письма без категории: NULL ИЛИ пустая строка.
        // Плюс ограничение по возрасту.
        $where = [
            'createdAt>=' => $cutoff,
            'OR' => [
                ['cEmailKategorie' => null],
                ['cEmailKategorie' => ''],
            ],
        ];

        $emails = $repo
            ->where($where)
            ->order('createdAt', true)
            ->limit($this->maxPerRun)
            ->find();

        $found     = is_iterable($emails) ? count($emails) : 0; // в Espo обычно это Collection (count работает)
        $checked   = 0;
        $processed = 0;

        file_put_contents(
            $this->logPath,
            date('Y-m-d H:i:s') . " START cutoff={$cutoff} found={$found}\n",
            FILE_APPEND
        );

        foreach ($emails as $email) {
            $checked++;

            $cat = $this->detectCategory($email);
            if ($cat === null) {
                continue;
            }

            $email->set('cEmailKategorie', $cat);

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

    private function detectCategory($entity): ?string
    {
        // Если уже выставлено вручную — не трогаем (и пустоту тоже считаем "не выставлено")
        $current = $entity->get('cEmailKategorie');
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

        // 1) SPAM (лучше раньше, чтобы "Rechnung" в спаме не перебило, но оставляю ваш порядок логики — как вы привыкли)
        if ($hasAny([
            'viagra','casino','für ihre','bitcoin','forex','investment',
            'winner','congratulations','lottery',
            'gewinn','kostenlos','free money','sex','porn'
        ])) {
            return 'spam';
        }

        // 2) Buchhaltung
        if ($hasAny([
            'rechnung','invoice','mahnung','zahlungserinnerung','inkasso',
            'fällig','faellig','zahlung','bezahlt','payment',
            'überweisung','ueberweisung','bankverbindung','iban','bic',
            'konto','offener betrag','offene forderung',
            'ust','mwst','umsatzsteuer','brutto','netto'
        ])) {
            return 'buchhaltung';
        }

        // 3) Bericht / Protokoll
        if ($hasAny([
            'protokoll','bericht','prüfbericht','pruefbericht',
            'dokumentation','sv','prüfung','pruefung',
            'melderprüfliste','melderpruefliste',
            'stundenbericht','dienstleistungsnachweis',
            'bma','ema'
        ])) {
            return 'bericht';
        }

        // 4) Angebot
        if ($hasAny([
            'angebot','kostenvoranschlag','preisangebot',
            'bitte anbieten','angebot zukommen','angebot erstellen'
        ])) {
            return 'angebot';
        }

        // 5) Service
        if ($hasAny([
            'wartung','instandhaltung','service','störung','stoerung','fehler',
            'termin','einsatz','auftrag','notdienst','techniker'
        ])) {
            return 'service';
        }

        // 6) Intern
        if ($hasAny([
            '@klesec', 'klesec gmbh', 'intern', 'internes', 'team',
            'tobi', 'tobias', 'bianca', 'pavel'
        ])) {
            return 'intern';
        }

        return null;
    }
}
