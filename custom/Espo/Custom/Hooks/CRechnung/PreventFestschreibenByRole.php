<?php

namespace Espo\Custom\Hooks\CRechnung;

use Espo\Entities\User;
use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Exceptions\Forbidden;

/**
 * Что это:
 * запрещает Chef-Techniker переводить Rechnung в Status "festgeschrieben"
 * напрямую (Inline-Edit, Mass Update usw.), в обход des CRechnung/action/festschreiben.
 *
 * Зачем:
 * Chef-Techniker darf Rechnungen freigeben (Freigabe), aber die finale
 * Festschreibung bleibt Buchhaltung/Geschäftsleitung vorbehalten. Der
 * Action-Endpoint hat dieselbe Sperre - dieser Hook ist das Sicherheitsnetz
 * gegen jeden anderen Speicherweg.
 */
class PreventFestschreibenByRole
{
    public function __construct(
        private EntityManager $entityManager,
        private User $user
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        if (!$entity->isAttributeChanged('buchhaltungStatus')) {
            return;
        }

        if (strtolower((string) $entity->get('buchhaltungStatus')) !== 'festgeschrieben') {
            return;
        }

        if (!$this->userIsRestricted()) {
            return;
        }

        throw new Forbidden(
            'Für die Festschreibung dieser Rechnung wenden Sie sich bitte an die Geschäftsführung.'
        );
    }

    private function userIsRestricted(): bool
    {
        if ($this->user->isAdmin()) {
            return false;
        }

        $roleCollection = $this->entityManager
            ->getRDBRepository('User')
            ->getRelation($this->user, 'roles')
            ->find();

        $roleNames = [];
        foreach ($roleCollection as $role) {
            $roleNames[] = (string) $role->get('name');
        }

        if (!in_array('Chef-Techniker', $roleNames, true)) {
            return false;
        }

        $hasOverrideRole = (bool) array_intersect(['Buchhaltung', 'Geschäftsleitung'], $roleNames);

        return !$hasOverrideRole;
    }
}
