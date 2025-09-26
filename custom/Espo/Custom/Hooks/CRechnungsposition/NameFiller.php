<?php
namespace Espo\Custom\Hooks\CRechnungsposition;

use Espo\ORM\Entity;

class NameFiller
{
    public function beforeSave(Entity $entity, array $options = []): void
    {
        if ($entity->get('name')) {
            return;
        }

        $material = $entity->get('material');
        $menge = $entity->get('menge') ? $entity->get('menge') . ' ' : '';
        $einheit = $entity->get('einheit') ? $entity->get('einheit') . ' ' : '';

        // берем приоритетно unsere "beschreibung", иначе имя материала
        $beschreibung = $entity->get('beschreibung') ?: ($material ? $material->get('name') : '');

        $label = trim($menge . $einheit . $beschreibung);
        $entity->set('name', $label ?: 'Position');
    }
}
