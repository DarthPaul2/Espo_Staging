<?php
namespace Espo\Custom\Hooks\CRechnungsposition;

use Espo\ORM\Entity;

class NameFiller
{
    public function beforeSave(Entity $entity, array $options = []): void
    {
        $maxLen = 100;

        $name = trim((string) $entity->get('name'));

        // Если name уже задан пользователем/импортом — НЕ трогаем (только режем по длине).
        if ($name !== '') {
            if (mb_strlen($name) > $maxLen) {
                $name = mb_substr($name, 0, $maxLen);
                $entity->set('name', $name);
            }
            return;
        }

        // name пустой -> берём ТОЛЬКО material.name (без menge/einheit/beschreibung)
        $material = $entity->get('material');
        $label = $material ? trim((string) $material->get('name')) : '';

        if ($label === '') {
            $label = 'Position';
        }

        if (mb_strlen($label) > $maxLen) {
            $label = mb_substr($label, 0, $maxLen);
        }

        $entity->set('name', $label);
    }
}
