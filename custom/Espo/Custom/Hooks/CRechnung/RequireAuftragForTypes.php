<?php
namespace Espo\Custom\Hooks\CRechnung;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Exceptions\BadRequest;

class RequireAuftragForTypes
{
    public function __construct(
        private EntityManager $em
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        $typ = $entity->get('rechnungstyp');
        $auftragId = $entity->get('auftragId');

        // только для Teilrechnung и Schlussrechnung
        if (in_array($typ, ['teilrechnung', 'schlussrechnung'], true) && !$auftragId) {
            throw new BadRequest(
                "Für {$typ} muss ein Auftrag ausgewählt werden."
            );
        }
    }
}
