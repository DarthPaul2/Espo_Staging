<?php

namespace Espo\Custom\Hooks\CPruefregel;

use Espo\ORM\Entity;
use Espo\Core\Exceptions\BadRequest;

/**
 * Что это:
 * Erzwingt die Fail-Safe-Regeln der RuleSet-Engine auf CPruefregel selbst.
 *
 * Зачем:
 * Laut 9. Dokument (RuleSet/Ampel/Validierung) Abschnitt 3 darf ein EXTERNAL_MUST-Kriterium
 * NIE übersteuerbar sein — das muss serverseitig erzwungen werden, nicht nur per UI-Validierung,
 * da sonst eine gesetzliche/behördliche Vorgabe versehentlich aushebelbar wäre.
 */
class EnforceExternalMustRules
{
    public function beforeSave(Entity $entity, array $options = []): void
    {
        if ($entity->get('kriteriumTyp') === 'EXTERNAL_MUST' && $entity->get('uebersteuerbar')) {
            $entity->set('uebersteuerbar', false);
        }

        $von = $entity->get('gueltigVon');
        $bis = $entity->get('gueltigBis');

        if ($von && $bis && $bis < $von) {
            throw new BadRequest('"Gültig bis" muss nach "Gültig von" liegen.');
        }
    }
}
