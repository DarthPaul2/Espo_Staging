<?php
namespace Espo\Custom\Hooks\CAngebotsposition;

use Espo\ORM\Entity;

class NameFiller
{
    public function beforeSave(Entity $entity, array $options = [])
    {
        // Если имя ещё не установлено
        if (!$entity->get('name')) {
            $material = $entity->get('material');
            $menge = $entity->get('menge') ? $entity->get('menge') . ' ' : '';
            $einheit = $entity->get('einheit') ? $entity->get('einheit') . ' ' : '';
            $beschreibung = $entity->get('beschreibung') ?: ($material ? $material->get('name') : '');

            $label = trim($menge . $einheit . $beschreibung);
            $entity->set('name', $label ?: 'Position');
        }
    }
}
