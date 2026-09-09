<?php

namespace Espo\Custom\Classes\Api;

use Espo\Core\Api\Action;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Api\ResponseComposer;
use Espo\Core\Exceptions\BadRequest;

/**
 * Liefert Ort/Bundesland zu einer deutschen PLZ, für die Live-Autofill-Felder beim Tippen
 * (client/custom/src/views/fields/plz-lookup.js). Nutzt dieselbe lokale Zuordnungstabelle wie
 * die beforeSave-Hooks (Account/CObjekt/CLieferant PlzAutoFill.php).
 */
class PlzLookup implements Action
{
    private static ?array $lookup = null;

    public function process(Request $request): Response
    {
        $plz = trim((string) $request->getQueryParam('plz'));

        if ($plz === '' || !preg_match('/^\d{4,5}$/', $plz)) {
            throw new BadRequest('plz fehlt oder ungültig');
        }

        $eintrag = $this->nachschlagen($plz);

        return ResponseComposer::json($eintrag ?? new \stdClass());
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
