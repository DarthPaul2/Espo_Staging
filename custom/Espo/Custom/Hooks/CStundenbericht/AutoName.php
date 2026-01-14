<?php

namespace Espo\Custom\Hooks\CStundenbericht;

use Espo\ORM\Entity;

class AutoName
{
    public function beforeSave(Entity $entity, array $options = []): void
    {
        $name = (string) ($entity->get('name') ?? '');
        if (trim($name) !== '') {
            return;
        }

        $kunde = (string) ($entity->get('accountName') ?? '');
        $kunde = trim($kunde) !== '' ? trim($kunde) : 'Unbekannter Kunde';

        $createdAt = (string) ($entity->get('createdAt') ?? '');
        $datum = '';

        if (strlen($createdAt) >= 10) {
            $y = substr($createdAt, 0, 4);
            $m = substr($createdAt, 5, 2);
            $d = substr($createdAt, 8, 2);
            if (ctype_digit($y.$m.$d)) {
                $datum = $d . '.' . $m . '.' . $y;
            }
        }

        if ($datum === '') {
            $datum = date('d.m.Y');
        }

        $entity->set('name', $kunde . ' – ' . $datum);
    }
}
