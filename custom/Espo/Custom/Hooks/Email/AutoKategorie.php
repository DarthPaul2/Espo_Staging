<?php

namespace Espo\Custom\Hooks\Email;

use Espo\ORM\Entity;

class AutoKategorie
{
    public function beforeSave(Entity $entity, array $options = []): void
    {
        // Если уже выставлено вручную — не трогаем
        $current = $entity->get('cEmailKategorie');
        if (is_string($current) && trim($current) !== '') {
            return;
        }

        // На случай: при каких-то сохранениях вы хотите вообще не трогать (опционально)
        // Например, если кто-то массово правит письма скриптом и передаёт silent/skipHooks.
        if (!empty($options['skipHooks']) || !empty($options['silent'])) {
            return;
        }

        $cat = $this->detectCategory($entity);
        if ($cat !== null) {
            $entity->set('cEmailKategorie', $cat);
        }
    }

    private function detectCategory(Entity $entity): ?string
    {
        $lower = function (string $s): string {
            if ($s === '') return '';
            return function_exists('mb_strtolower') ? mb_strtolower($s, 'UTF-8') : strtolower($s);
        };

        // В Email subject обычно лежит в поле "name", но подстрахуемся
        $subject  = (string) ($entity->get('name') ?? '');
        $subject2 = (string) ($entity->get('subject') ?? '');

        $bodyPlain = (string) ($entity->get('bodyPlain') ?? '');
        $bodyHtml  = (string) ($entity->get('body') ?? '');

        $from    = (string) ($entity->get('fromString') ?? '');
        $replyTo = (string) ($entity->get('replyToString') ?? '');

        $text = $lower($subject . "\n" . $subject2 . "\n" . $bodyPlain . "\n" . $bodyHtml . "\n" . $from . "\n" . $replyTo);

        $hasAny = function (array $needles) use ($text, $lower): bool {
            foreach ($needles as $n) {
                $n = trim((string) $n);
                if ($n === '') continue;
                if (strpos($text, $lower($n)) !== false) {
                    return true;
                }
            }
            return false;
        };

        // 1) SPAM
        if ($hasAny([
            'viagra','casino','crypto','bitcoin','forex','investment',
            'winner','congratulations','unsubscribe','newsletter','lottery',
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
            '@klesec', 'klesec gmbh', 'intern', 'internes', 'team', 'Tobi', 'Tobias', 'Bianca', 'Pavel'
        ])) {
            return 'intern';
        }

        return null;
    }
}
