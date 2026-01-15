<?php

namespace Espo\Custom\Hooks\CStundenbericht;

use Espo\ORM\Entity;

class TechnikerUnterschriftAutoFill
{
    public function beforeSave(Entity $entity, array $options = [])
    {
        // если уже заполнено — не трогаем
        $current = trim((string) ($entity->get('technikerUnterschrift') ?? ''));
        if ($current !== '') {
            return;
        }

        // берём имя техника 1 прямо из поля linkName (обычно оно есть)
        $techName = trim((string) ($entity->get('stundenberichteTechniker1Name') ?? ''));
        if ($techName === '') {
            return; // имени нет — нечего подставлять
        }

        $entity->set('technikerUnterschrift', $techName);
    }
}
