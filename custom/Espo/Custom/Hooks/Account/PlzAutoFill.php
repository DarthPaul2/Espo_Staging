<?php

namespace Espo\Custom\Hooks\Account;

use Espo\ORM\Entity;

/**
 * Wunsch von Bianca Rally (KUG-Wertschöpfungsprozess, 29.08.2026): Ort, Bundesland und Land
 * sollen sich aus der Postleitzahl selbst ziehen. Nutzt eine lokale, statische Zuordnungstabelle
 * (custom/Espo/Custom/Resources/data/plz_lookup.json, ~8200 deutsche PLZ) — bewusst kein
 * Live-API-Aufruf, da der Pagekite-Tunnel gelegentlich instabil ist. Füllt nur leere Felder,
 * manuell gesetzte Werte werden nie überschrieben. Gilt für Rechnungs- UND Lieferadresse.
 */
class PlzAutoFill
{
    private const PRAEFIXE = ['billingAddress', 'shippingAddress'];

    private static ?array $lookup = null;

    public function beforeSave(Entity $entity, array $options = []): void
    {
        foreach (self::PRAEFIXE as $praefix) {
            $this->fuelleAdresse($entity, $praefix);
        }
    }

    private function fuelleAdresse(Entity $entity, string $praefix): void
    {
        $plz = trim((string) $entity->get($praefix . 'PostalCode'));

        if ($plz === '') {
            return;
        }

        $city = (string) ($entity->get($praefix . 'City') ?? '');
        $state = (string) ($entity->get($praefix . 'State') ?? '');
        $country = (string) ($entity->get($praefix . 'Country') ?? '');

        if ($city !== '' && $state !== '' && $country !== '') {
            return;
        }

        $eintrag = $this->nachschlagen($plz);

        if (!$eintrag) {
            return;
        }

        if ($city === '') {
            $entity->set($praefix . 'City', $eintrag['ort']);
        }

        if ($state === '') {
            $entity->set($praefix . 'State', $eintrag['bundesland']);
        }

        if ($country === '') {
            $entity->set($praefix . 'Country', 'Deutschland');
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
