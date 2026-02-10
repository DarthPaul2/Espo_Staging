<?php

namespace Espo\Custom\Hooks\CBrief;

use Espo\ORM\Entity;

class AutoName
{
    public function beforeSave(Entity $entity, array $options = [])
    {
        // Если name уже есть — не трогаем
        $name = trim((string) $entity->get('name'));
        if ($name !== '') {
            return;
        }

        // Дата письма (datum) — в Espo обычно 'YYYY-MM-DD'
        $datum = (string) $entity->get('datum');
        $datePart = '';
        if ($datum !== '') {
            // YYYY-MM-DD -> DD_MM_YYYY
            $y = substr($datum, 0, 4);
            $m = substr($datum, 5, 2);
            $d = substr($datum, 8, 2);
            if ($y && $m && $d) {
                $datePart = $d . '_' . $m . '_' . $y;
            }
        }
        if ($datePart === '') {
            $datePart = date('d_m_Y');
        }

        // Empfänger: если выбран Account → accountName, иначе contactName
        $empfaenger = trim((string) $entity->get('accountName'));
        if ($empfaenger === '') {
            $empfaenger = trim((string) $entity->get('contactName'));
        }
        if ($empfaenger === '') {
            $empfaenger = 'Empfaenger';
        }

        // Нормализация (в стиле твоего safe_name)
        $empfaenger = preg_replace('/[\/\\\\:;,\.\(\)\[\]\{\}\|\\"\']+/u', '', $empfaenger);
        $empfaenger = preg_replace('/\s+/u', '_', trim($empfaenger));
        if (mb_strlen($empfaenger) > 60) {
            $empfaenger = mb_substr($empfaenger, 0, 60);
        }

        $entity->set('name', $empfaenger . '_' . $datePart);
    }
}
