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
        // Всегда очищаем поле bemerkung перед новым заполнением
        $entity->set('bemerkung', null);

        // Берём выбранный вариант из dropdown
        $selected = $entity->get('bemerkungVorlage');
        if (!$selected) {
            return;
        }

        $file = '/var/www/AppKleSecProjekt/Server/app/data/bemerkungen.json';
        if (!file_exists($file)) {
            $this->log->error("❌ Datei nicht gefunden: {$file}");
            return;
        }

        $json = file_get_contents($file);
        $items = json_decode($json, true);

        if (!is_array($items)) {
            $this->log->error("❌ Fehler beim JSON-Dekodieren: {$file}");
            return;
        }

        foreach ($items as $item) {
            if (($item['titel'] ?? null) === $selected) {
                $entity->set('bemerkung', $item['text'] ?? '');
                $this->log->debug("✅ Bemerkung gesetzt: " . $item['titel']);
                break;
            }
        }
    }
}
