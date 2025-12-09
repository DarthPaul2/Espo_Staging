<?php
namespace Espo\Custom\Hooks\CAngebotsposition;

use Espo\ORM\Entity;

class NameFiller
{
    public function beforeSave(Entity $entity, array $options = [])
    {
        $maxLen = 100; // под размер колонки VARCHAR

        $name = (string) $entity->get('name');

        if ($name === '') {
            // --- формируем name, если он ещё не задан ---
            $material = $entity->get('material');
            $menge    = $entity->get('menge') ? $entity->get('menge') . ' ' : '';
            $einheit  = $entity->get('einheit') ? $entity->get('einheit') . ' ' : '';

            // Берём beschreibung или имя материала
            $beschreibung = $entity->get('beschreibung') ?: ($material ? $material->get('name') : '');

            // 1) Только первая строка описания
            if ($beschreibung) {
                $teile = preg_split("/\r\n|\n|\r/", $beschreibung);
                $beschreibung = trim($teile[0] ?? '');
            }

            $label = trim($menge . $einheit . $beschreibung);

            // 2) Обрезаем под лимит
            if (mb_strlen($label) > $maxLen) {
                $label = mb_substr($label, 0, $maxLen);
            }

            $entity->set('name', $label ?: 'Position');
        } else {
            // --- name уже есть → просто гарантированно режем ---
            if (mb_strlen($name) > $maxLen) {
                $entity->set('name', mb_substr($name, 0, $maxLen));
            }
        }
    }
}
