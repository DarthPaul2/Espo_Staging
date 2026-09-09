<?php

namespace Espo\Custom\Hooks\CObjekt;

use Espo\ORM\Entity;

/**
 * Wie Account/PlzAutoFill.php: Ort und Bundesland werden aus der PLZ abgeleitet (lokale
 * Zuordnungstabelle, kein Live-API-Aufruf). Füllt nur leere Felder, manuell gesetzte Werte
 * werden nie überschrieben.
 */
class PlzAutoFill
{
    private static ?array $lookup = null;

    public function beforeSave(Entity $entity, array $options = []): void
    {
        $plz = trim((string) $entity->get('cPLZ'));

        if ($plz === '') {
            return;
        }

        $ort = (string) ($entity->get('cOrt') ?? '');
        $bundesland = (string) ($entity->get('cBundesland') ?? '');
        $land = (string) ($entity->get('cLand') ?? '');

        if ($ort !== '' && $bundesland !== '' && $land !== '') {
            return;
        }

        $eintrag = $this->nachschlagen($plz);

        if (!$eintrag) {
            return;
        }

        if ($ort === '') {
            $entity->set('cOrt', $eintrag['ort']);
        }

        if ($bundesland === '') {
            $entity->set('cBundesland', $eintrag['bundesland']);
        }

        if ($land === '') {
            $entity->set('cLand', 'Deutschland');
        }
    }

    private function nachschlagen(string $plz): ?array
    {
        if (self::$lookup === null) {
            $pfad = dirname(__DIR__, 2) . '/Resources/data/plz_lookup.json';
            $inhalt = @file_get_contents($pfad);
            self::$lookup = $inhalt ? (json_decode($inhalt, true) ?: []) : [];
        }

        return self::$lookup[$plz] ?? null;
    }
}
