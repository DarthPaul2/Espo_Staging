<?php

namespace Espo\Custom\Hooks\CAngebot;

use Espo\ORM\Entity;
use Espo\Core\Utils\Log;

class BemerkungVorlage
{
    public function __construct(
        private Log $log
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        $this->log->debug('### HOOK BemerkungVorlage FIRED ###');

        // 1) Что реально пришло из dropdown
        $selected = $entity->get('bemerkungVorlage');
        $this->log->debug('bemerkungVorlage(raw) = ' . var_export($selected, true));

        if ($selected === null || $selected === '') {
            // ничего не выбрано -> не трогаем bemerkung
            return;
        }

        $file = 'data/bemerkungen.json';
        if (!file_exists($file)) {
            $this->log->error("❌ Datei nicht gefunden: {$file}");
            // чтобы не было "пусто", покажем причину прямо в поле
            $entity->set('bemerkung', '❌ Datei nicht gefunden: ' . $file);
            return;
        }

        $json = file_get_contents($file);
        if ($json === false || trim($json) === '') {
            $this->log->error("❌ Datei leer oder nicht lesbar: {$file}");
            $entity->set('bemerkung', '❌ Datei leer/nicht lesbar: ' . $file);
            return;
        }

        $items = json_decode($json, true);
        if (!is_array($items)) {
            $this->log->error("❌ Fehler beim JSON-Dekodieren: {$file}");
            $entity->set('bemerkung', '❌ JSON decode error: ' . $file);
            return;
        }

        $selectedNorm = $this->norm((string)$selected);

        // 2) Поиск совпадения
        foreach ($items as $idx => $item) {
            $titel = (string)($item['titel'] ?? '');
            $text  = (string)($item['text'] ?? '');

            if ($titel === '') {
                continue;
            }

            $titelNorm = $this->norm($titel);

            // a) точное совпадение после нормализации
            if ($titelNorm === $selectedNorm) {
                $entity->set('bemerkung', $text);
                $this->log->debug("✅ Bemerkung gesetzt (exact) idx={$idx} titel=" . $titel);
                return;
            }

            // b) contains-match в обе стороны (на случай, если dropdown хранит укороченный ключ/label)
            if (
                $selectedNorm !== '' &&
                (
                    mb_stripos($titelNorm, $selectedNorm) !== false ||
                    mb_stripos($selectedNorm, $titelNorm) !== false
                )
            ) {
                $entity->set('bemerkung', $text);
                $this->log->debug("✅ Bemerkung gesetzt (contains) idx={$idx} titel=" . $titel);
                return;
            }
        }

        // 3) Если не нашли — НЕ оставляем пусто, а пишем диагностический текст
        $msg = "⚠️ Vorlage nicht gefunden. Selected=" . (string)$selected;
        $this->log->warning($msg);
        $entity->set('bemerkung', $msg);
    }

    private function norm(string $s): string
    {
        $s = trim($s);
        $s = str_replace("…", "...", $s);          // unicode ellipsis -> "..."
        $s = preg_replace('/\s+/u', ' ', $s) ?? $s; // multiple spaces -> one
        return $s;
    }
}