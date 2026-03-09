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

        $selected = $entity->get('bemerkungVorlage');
        $this->log->debug('bemerkungVorlage(raw) = ' . var_export($selected, true));

        if ($selected === null || $selected === '') {
            return;
        }

        $file = 'data/bemerkungen.json';

        if (!file_exists($file)) {
            $this->log->error("❌ Datei nicht gefunden: {$file}");
            return;
        }

        $json = file_get_contents($file);
        if ($json === false || trim($json) === '') {
            $this->log->error("❌ Datei leer oder nicht lesbar: {$file}");
            return;
        }

        $items = json_decode($json, true);
        if (!is_array($items)) {
            $this->log->error("❌ Fehler beim JSON-Dekodieren: {$file}");
            return;
        }

        $selectedNorm = $this->norm((string) $selected);

        foreach ($items as $idx => $item) {
            $titel = (string) ($item['titel'] ?? '');
            $text  = (string) ($item['text'] ?? '');

            if ($titel === '') {
                continue;
            }

            $titelNorm = $this->norm($titel);

            // 1) точное совпадение после нормализации
            if ($titelNorm === $selectedNorm) {
                $entity->set('bemerkung', $text);
                $this->log->debug("✅ Bemerkung gesetzt (exact) idx={$idx} titel={$titel}");
                return;
            }

            // 2) contains-match в обе стороны
            if (
                $selectedNorm !== '' &&
                (
                    mb_stripos($titelNorm, $selectedNorm) !== false ||
                    mb_stripos($selectedNorm, $titelNorm) !== false
                )
            ) {
                $entity->set('bemerkung', $text);
                $this->log->debug("✅ Bemerkung gesetzt (contains) idx={$idx} titel={$titel}");
                return;
            }
        }

        $this->log->warning("⚠️ Vorlage nicht gefunden. Selected={$selected}");
    }

    private function norm(string $s): string
    {
        $s = trim($s);
        $s = str_replace('…', '...', $s);
        $s = preg_replace('/\s+/u', ' ', $s) ?? $s;

        return $s;
    }
}