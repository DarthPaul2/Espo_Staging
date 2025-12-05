<?php
namespace Espo\Custom\Hooks\CRechnung;

use Espo\ORM\Entity;
use Espo\Core\Utils\Log;

class BemerkungVorlage
{
    public function __construct(private Log $log) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        // Всегда очищаем поле bemerkung перед новым заполнением (как у Angebot)
        $entity->set('bemerkung', null);

        $selected = $entity->get('bemerkungVorlage');
        if (!$selected || $selected === 'Bitte auswählen…') {
            return;
        }

        // Используем существующий файл для Rechnung (у тебя уже есть REST /rechnungen/bemerkungen)
        $file = '/var/www/AppKleSecProjekt/Server/app/data/rechnung_bemerkungen.json';
        $templateText = null;

        if (file_exists($file)) {
            $json = file_get_contents($file);
            $items = json_decode($json, true);
            if (is_array($items)) {
                foreach ($items as $item) {
                    if (($item['titel'] ?? null) === $selected) {
                        $templateText = $item['text'] ?? '';
                        break;
                    }
                }
            } else {
                $this->log->error("❌ Fehler beim JSON-Dekodieren: {$file}");
            }
        } else {
            $this->log->warning("ℹ️ Datei nicht gefunden: {$file}. Fallback auf eingebaute Vorlage.");
        }

        // Fallback: вшитый вариант на случай отсутствия файла
        if ($templateText === null) {
            if ($selected === 'Bitte überweisen Sie den Rechnungsbetrag...') {
                $templateText = "Bitte überweisen Sie den Rechnungsbetrag unter Angabe der Rechnungsnummer im Verwendungszweck bis zum {faelligAm} auf das unten angegebene Konto.\n\nIhr KleSec Team";
            } else {
                // неизвестный ключ
                return;
            }
        }

        // Подстановка {faelligAm} из поля сущности (формат DD.MM.YYYY)
        $faelligRaw = $entity->get('faelligAm');
        $faelligStr = '';

        if ($faelligRaw instanceof \DateTimeInterface) {
            $faelligStr = $faelligRaw->format('d.m.Y');
        } elseif (is_string($faelligRaw) && $faelligRaw !== '') {
            $dt = \DateTime::createFromFormat('Y-m-d', $faelligRaw)
            ?: \DateTime::createFromFormat('d.m.Y', $faelligRaw);
            if (!$dt) {
                // Последняя попытка: универсальный парсер (может сработать для ISO-строк)
                try { $dt = new \DateTime($faelligRaw); } catch (\Exception $e) { $dt = null; }
            }
            if ($dt) {
                $faelligStr = $dt->format('d.m.Y');
            }
        }

        $finalText = str_replace('{faelligAm}', $faelligStr, $templateText);
        $entity->set('bemerkung', $finalText);

    }
}
