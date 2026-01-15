<?php
namespace Espo\Custom\Hooks\CStundenbericht;

use Espo\ORM\Entity;

class TechnikerUnterschriftAutoFill
{
    public function beforeSave(Entity $entity, array $options = [])
    {
        // Если уже задано вручную — не трогаем
        $current = (string) ($entity->get('technikerUnterschrift') ?? '');
        if (trim($current) !== '') {
            return;
        }

        // ID техника 1 (link на User)
        $techId = $entity->get('stundenberichteTechniker1Id');
        if (!$techId) {
            return;
        }

        // Берём имя из связанного User
        $em = $entity->getEntityManager();
        $user = $em->getEntity('User', $techId);
        if (!$user) {
            return;
        }

        $name = (string) ($user->get('name') ?? '');
        $name = trim($name);

        if ($name !== '') {
            $entity->set('technikerUnterschrift', $name);
        }
    }
}
