<?php
namespace Espo\Custom\Hooks\CRechnungsposition;

use Espo\ORM\Entity;

class NameFiller
{
    public function beforeSave(Entity $entity, array $options = []): void
    {
        // 1) Берём текущее name (может уже быть заполнено где-то ещё)
        $name = (string) $entity->get('name');

        // 2) Если name пустой – формируем его из полей
        if ($name === '') {
            $material = $entity->get('material');
            $menge    = $entity->get('menge') ? $entity->get('menge') . ' ' : '';
            $einheit  = $entity->get('einheit') ? $entity->get('einheit') . ' ' : '';

            // приоритетно берем наше beschreibung, иначе имя материала
            $beschreibung = $entity->get('beschreibung') ?: ($material ? $material->get('name') : '');

            // только первая строка beschreibung (до первого переноса)
            if ($beschreibung) {
                $teile = preg_split("/\r\n|\n|\r/", $beschreibung);
                $beschreibung = trim($teile[0] ?? '');
            }

            $label = trim($menge . $einheit . $beschreibung);
            $name = $label !== '' ? $label : 'Position';
        }

        // 3) Жёсткий лимит длины name (под размер колонки в БД)
        $maxLen = 100; // если у тебя name VARCHAR(100); при VARCHAR(255) можно увеличить
        if (mb_strlen($name) > $maxLen) {
            $name = mb_substr($name, 0, $maxLen);
        }

        $entity->set('name', $name);
    }
}
