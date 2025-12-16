<?php
namespace Espo\Custom\Hooks\CAngebotsposition;

use Espo\ORM\Entity;

class NameFiller
{
    public function beforeSave(Entity $entity, array $options = []): void
    {
        $maxLen = 100;

        $name = trim((string) $entity->get('name'));

        // Если name уже есть — только ограничиваем длину.
        if ($name !== '') {
            if (mb_strlen($name) > $maxLen) {
                $entity->set('name', mb_substr($name, 0, $maxLen));
            }
            return;
        }

        // name пустой -> только material.name
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
