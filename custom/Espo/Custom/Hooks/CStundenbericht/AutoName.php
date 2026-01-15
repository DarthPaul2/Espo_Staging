<?php

namespace Espo\Custom\Hooks\CStundenbericht;

use Espo\ORM\Entity;

class AutoName
{
    public function beforeSave(Entity $entity, array $options = []): void
    {
        $name = trim((string) ($entity->get('name') ?? ''));

        // Если name уже нормальный — не трогаем.
        // Но если там "Unbekannter Kunde – ..." — разрешаем пересчитать.
        if ($name !== '' && strpos($name, 'Unbekannter Kunde') !== 0) {
            return;
        }

        $kunde = trim((string) ($entity->get('accountName') ?? ''));
        if ($kunde === '') {
            $kunde = trim((string) ($entity->get('objektName') ?? ''));
        }
        if ($kunde === '') {
            $kunde = 'Unbekannter Kunde';
        }

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
