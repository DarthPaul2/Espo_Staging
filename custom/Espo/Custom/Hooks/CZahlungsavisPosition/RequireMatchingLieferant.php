<?php

namespace Espo\Custom\Hooks\CZahlungsavisPosition;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Exceptions\BadRequest;

// Что это: verhindert, dass beim manuellen Anlegen einer Position (Button "+" im Panel)
// eine Eingangsrechnung eines ANDEREN Lieferanten als der des Zahlungsavis ausgewählt wird.
class RequireMatchingLieferant
{
    public function __construct(
        private EntityManager $em
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        $zahlungsavisId = $entity->get('zahlungsavisId');
        $eingangsrechnungId = $entity->get('eingangsrechnungId');

        if (!$zahlungsavisId || !$eingangsrechnungId) {
            return;
        }

        $zahlungsavis = $this->em->getEntityById('CZahlungsavis', $zahlungsavisId);
        $eingangsrechnung = $this->em->getEntityById('CEingangsrechnung', $eingangsrechnungId);

        if (!$zahlungsavis || !$eingangsrechnung) {
            return;
        }

        if ($zahlungsavis->get('lieferantId') !== $eingangsrechnung->get('lieferantId')) {
            throw new BadRequest(
                'Diese Eingangsrechnung gehört nicht zum Lieferanten dieses Zahlungsavis.'
            );
        }
    }
}
