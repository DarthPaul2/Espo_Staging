<?php

namespace Espo\Custom\Hooks\CServicevorgang;

use Espo\ORM\Entity;

/**
 * Что это:
 * Berechnet "Reaktionszeit (Minuten)" automatisch aus "Alarmierung am" und "Rückruf am"
 * (17.09.2026, Pavel), solange das Feld noch nie manuell bearbeitet wurde. Sobald jemand
 * über das Formular einen eigenen Wert einträgt (bei einer Bearbeitung, nicht beim
 * erstmaligen Anlegen), wird das dauerhaft im versteckten Flag "reaktionszeitManuell"
 * gemerkt — danach fasst die Automatik das Feld nie wieder an, auch wenn sich
 * "Alarmierung am"/"Rückruf am" später noch ändern.
 */
class BerechneReaktionszeit
{
    public function beforeSave(Entity $entity, array $options = []): void
    {
        if ($entity->get('reaktionszeitManuell')) {
            return;
        }

        if (!$entity->isNew() && $entity->isAttributeChanged('reaktionszeitMinuten')) {
            $entity->set('reaktionszeitManuell', true);
            return;
        }

        $alarmierung = $entity->get('alarmierungAm');
        $rueckruf = $entity->get('rueckrufAm');

        if (!$alarmierung || !$rueckruf) {
            return;
        }

        try {
            $start = new \DateTime($alarmierung);
            $ende = new \DateTime($rueckruf);
        } catch (\Exception $e) {
            return;
        }

        $minuten = (int) round(($ende->getTimestamp() - $start->getTimestamp()) / 60);

        $entity->set('reaktionszeitMinuten', $minuten);
    }
}
