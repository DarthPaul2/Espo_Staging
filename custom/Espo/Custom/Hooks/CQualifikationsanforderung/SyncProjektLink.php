<?php

namespace Espo\Custom\Hooks\CQualifikationsanforderung;

use Espo\ORM\Entity;

/**
 * Что это:
 * Spiegelt bezugEntitaet/bezugId (polymorpher Bezug, T4-19) zusaetzlich in ein echtes
 * belongsTo-Feld projekt, wenn bezugEntitaet=CProjekt ist.
 *
 * Зачем:
 * Auf Wunsch von Pavel (10.09.2026): die CProjekt-Detailseite soll wie bei CAuftrag alle
 * verknuepften Datensaetze als Panel am unteren Rand zeigen. Der polymorphe bezugEntitaet/
 * bezugId-Mechanismus selbst bleibt unveraendert (weiterhin generisch fuer beliebige
 * Ziel-Entities nutzbar) — projekt ist nur eine zusaetzliche, automatisch gepflegte
 * Bequemlichkeits-Verknuepfung fuer den Sonderfall CProjekt.
 */
class SyncProjektLink
{
    public function beforeSave(Entity $entity, array $options = []): void
    {
        if ((string) $entity->get('bezugEntitaet') === 'CProjekt') {
            $entity->set('projektId', $entity->get('bezugId'));
        } else {
            $entity->set('projektId', null);
        }
    }
}
