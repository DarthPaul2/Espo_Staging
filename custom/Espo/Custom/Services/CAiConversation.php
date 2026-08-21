<?php

namespace Espo\Custom\Services;

use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Select\SearchParams;
use Espo\Core\Select\Where\Item as WhereItem;
use Espo\ORM\Entity;
use stdClass;

/**
 * Private KI-Chat-Unterhaltungen — jeder Benutzer sieht/löscht NUR seine eigenen, ausnahmslos
 * auch Admin-Benutzer (bewusste Ausnahme vom sonst üblichen Admin-Bypass in EspoCRM, siehe
 * project_ai_standalone_chat_design). Die Filterung läuft hier auf Service-Ebene statt über
 * ACL, weil ACL für Admin-Konten grundsätzlich nicht greift. Der Flask-Backend-API-Key-Benutzer
 * ("pythonserver", type=api) ist ausgenommen — er schreibt/liest im Namen des jeweiligen echten
 * Mitarbeiters und filtert selbst korrekt nach conversationId.
 */
class CAiConversation extends \Espo\Core\Templates\Services\Base
{
    public function prepareSearchParams(SearchParams $searchParams): SearchParams
    {
        $searchParams = parent::prepareSearchParams($searchParams);

        if ($this->user->isApi()) {
            return $searchParams;
        }

        return $searchParams->withWhereAdded(
            WhereItem::fromRaw([
                'type' => 'equals',
                'attribute' => 'assignedUserId',
                'value' => $this->user->getId(),
            ])
        );
    }

    public function getEntity(string $id): ?Entity
    {
        $entity = parent::getEntity($id);

        if ($entity && !$this->user->isApi() && $entity->get('assignedUserId') !== $this->user->getId()) {
            throw new Forbidden("Eigene KI-Unterhaltungen sind nur für den Besitzer sichtbar.");
        }

        return $entity;
    }

    protected function beforeDeleteEntity(Entity $entity): void
    {
        parent::beforeDeleteEntity($entity);

        if (!$this->user->isApi() && $entity->get('assignedUserId') !== $this->user->getId()) {
            throw new Forbidden("Eigene KI-Unterhaltungen können nur vom Besitzer gelöscht werden.");
        }
    }

    protected function beforeCreateEntity(Entity $entity, stdClass $data): void
    {
        parent::beforeCreateEntity($entity, $data);

        if (!$this->user->isApi()) {
            $entity->set('assignedUserId', $this->user->getId());
        }
    }
}
