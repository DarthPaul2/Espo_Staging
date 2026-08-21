<?php

namespace Espo\Custom\Services;

use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Select\SearchParams;
use Espo\Core\Select\Where\Item as WhereItem;
use Espo\ORM\Entity;
use stdClass;

/**
 * Siehe CAiConversation.php — dieselbe strikte Eigentümer-Filterung, ausnahmslos auch für
 * Admin-Konten, für die einzelnen Nachrichten einer KI-Unterhaltung.
 */
class CAiMessage extends \Espo\Core\Templates\Services\Base
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
            throw new Forbidden("Eigene KI-Nachrichten sind nur für den Besitzer sichtbar.");
        }

        return $entity;
    }

    protected function beforeDeleteEntity(Entity $entity): void
    {
        parent::beforeDeleteEntity($entity);

        if (!$this->user->isApi() && $entity->get('assignedUserId') !== $this->user->getId()) {
            throw new Forbidden("Eigene KI-Nachrichten können nur vom Besitzer gelöscht werden.");
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
