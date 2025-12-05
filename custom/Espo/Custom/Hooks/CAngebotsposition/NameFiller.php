<?php
namespace Espo\Custom\Hooks\CAngebotsposition;

use Espo\ORM\Entity;

class NameFiller
{
    public function beforeSave(Entity $entity, array $options = [])
    {
        // Если имя ещё не установлено
        if ($entity->get('name')) {
            return;
        }

        $material = $entity->get('material');
        $menge    = $entity->get('menge') ? $entity->get('menge') . ' ' : '';
        $einheit  = $entity->get('einheit') ? $entity->get('einheit') . ' ' : '';

        // Берём beschreibung или имя материала
        $beschreibung = $entity->get('beschreibung') ?: ($material ? $material->get('name') : '');

        // 1) Берём только первую строку описания (до первого переноса)
        if ($beschreibung) {
            $teile = preg_split("/\r\n|\n|\r/", $beschreibung);
            $beschreibung = trim($teile[0] ?? '');
        }

        $label = trim($menge . $einheit . $beschreibung);

        // 2) Жёсткий лимит длины name (подгони под свой VARCHAR)
        $maxLen = 100; // если колонка name у тебя VARCHAR(100); при VARCHAR(255) можно увеличить
        if (mb_strlen($label) > $maxLen) {
            $label = mb_substr($label, 0, $maxLen);
        }

        $entity->set('name', $label ?: 'Position');
    }
}
