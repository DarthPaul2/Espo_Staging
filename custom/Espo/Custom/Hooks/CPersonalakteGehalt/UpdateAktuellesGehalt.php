<?php

namespace Espo\Custom\Hooks\CPersonalakteGehalt;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

/**
 * Что это:
 * After-Save/After-Remove-Hook für CPersonalakteGehalt.
 *
 * Зачем:
 * Bianca-Anforderung (Personalakte, Punkt 5): "Im Personalbereich des Benutzers soll
 * automatisch das aktuell gültige Gehalt angezeigt werden." Die Felder
 * aktuellesBruttogehalt/aktuellerStundenlohn/datumLetzteGehaltsaenderung auf CPersonalakte
 * sind readOnly und werden hier aus dem Gehaltsverlauf-Eintrag mit dem neuesten gueltigAb
 * abgeleitet — nie manuell überschrieben.
 */
class UpdateAktuellesGehalt
{
    public function __construct(
        private EntityManager $entityManager
    ) {}

    public function afterSave(Entity $entity, array $options = []): void
    {
        $this->recalculate($entity);
    }

    public function afterRemove(Entity $entity, array $options = []): void
    {
        $this->recalculate($entity);
    }

    private function recalculate(Entity $entity): void
    {
        $personalakteId = $entity->get('personalakteId');

        if (!$personalakteId) {
            return;
        }

        $personalakte = $this->entityManager->getEntity('CPersonalakte', $personalakteId);

        if (!$personalakte) {
            return;
        }

        $latest = $this->entityManager
            ->getRDBRepository('CPersonalakteGehalt')
            ->where([
                'personalakteId' => $personalakteId,
            ])
            ->order('gueltigAb', true)
            ->findOne();

        if (!$latest) {
            $personalakte->set('aktuellesBruttogehalt', null);
            $personalakte->set('aktuellerStundenlohn', null);
            $personalakte->set('datumLetzteGehaltsaenderung', null);
        } else {
            $personalakte->set('aktuellesBruttogehalt', $latest->get('bruttogehalt'));
            $personalakte->set('aktuellerStundenlohn', $latest->get('stundenlohn'));
            $personalakte->set('datumLetzteGehaltsaenderung', $latest->get('gueltigAb'));
        }

        $this->entityManager->saveEntity($personalakte);
    }
}
