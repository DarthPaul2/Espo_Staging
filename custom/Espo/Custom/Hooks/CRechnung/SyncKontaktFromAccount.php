<?php

namespace Espo\Custom\Hooks\CRechnung;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

class SyncKontaktFromAccount
{
    protected EntityManager $entityManager;

    public function __construct(EntityManager $entityManager)
    {
        $this->entityManager = $entityManager;
    }

    public function beforeSave(Entity $entity, array $options = []): void
    {
        // ✅ автоподстановка ТОЛЬКО при создании
        if (!$entity->isNew()) {
            return;
        }

        // если в счете уже выбран контакт вручную — не трогаем
        if ($entity->get('contactId')) {
            return;
        }

        $accountId = $entity->get('accountId');
        if (!$accountId) {
            return;
        }

        $account = $this->entityManager->getEntityById('Account', $accountId);
        if (!$account) {
            return;
        }

        $contactId = $account->get('cFirmenHauptkontaktId');
        if (!$contactId) {
            return;
        }

        $entity->set('contactId', $contactId);
    }

}
