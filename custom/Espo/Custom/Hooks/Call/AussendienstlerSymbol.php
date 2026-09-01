<?php

namespace Espo\Custom\Hooks\Call;

use Espo\ORM\Entity;

/**
 * Wunsch von Bianca Rally (28.08.2026): Anrufe mit Außendienstlern/Vertrieblern/Verkäufern
 * sollen im Kalender optisch sofort erkennbar sein, damit bei Terminüberschneidungen klar
 * ist, welcher Termin ggf. verschoben werden könnte — ohne eine neue Prioritäts-/
 * Überschneidungslogik (die es in Espo generell nicht gibt), nur ein Symbol im Titel.
 */
class AussendienstlerSymbol
{
    private const SYMBOL = '🚗 ';

    public function beforeSave(Entity $entity, array $options = []): void
    {
        $name = (string) ($entity->get('name') ?? '');
        $flag = (bool) $entity->get('aussendienstlerTermin');
        $hasSymbol = str_starts_with($name, self::SYMBOL);

        if ($flag && !$hasSymbol) {
            $entity->set('name', self::SYMBOL . $name);
        } elseif (!$flag && $hasSymbol) {
            $entity->set('name', substr($name, strlen(self::SYMBOL)));
        }
    }
}
