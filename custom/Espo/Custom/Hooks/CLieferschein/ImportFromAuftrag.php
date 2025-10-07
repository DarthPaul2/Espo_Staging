<?php
namespace Espo\Custom\Hooks\CLieferschein;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Utils\Log;

class ImportFromAuftrag
{
    public function __construct(
        private EntityManager $em,
        private Log $log
    ) {}

    public function afterSave(Entity $entity, array $options = []): void
    {
        $auftragId = $entity->get('auftragId');
        if (!$auftragId) {
            return;
        }

        $lieferscheinId = $entity->getId();   // <-- вместо $entity->id

        // проверим: если уже есть позиции, то не дублируем
        $existing = $this->em->getRepository('CLieferscheinposition')
            ->where(['lieferscheinId' => $lieferscheinId])
            ->find();

        if (count($existing) > 0) {
            return;
        }

        // подтянем все позиции из CAuftragsposition
        $auftragPositions = $this->em->getRepository('CAuftragsposition')
            ->where(['auftragId' => $auftragId])
            ->find();

        foreach ($auftragPositions as $pos) {
            $lsPos = $this->em->getEntity('CLieferscheinposition');
            $lsPos->set([
                'beschreibung'   => $pos->get('beschreibung'),
                'menge'          => $pos->get('menge'),
                'einheit'        => $pos->get('einheit'),
                'preis'          => $pos->get('preis'),
                'gesamt'         => $pos->get('gesamt'),
                'rabatt'         => $pos->get('rabatt'),
                'sortierung'     => $pos->get('sortierung'),
                'materialId'     => $pos->get('materialId'),
                'lieferscheinId' => $lieferscheinId,   // <-- тоже через переменную
            ]);
            $this->em->saveEntity($lsPos);
        }

        $this->log->info("Auftragspositionen ($auftragId) импортированы в Lieferschein $lieferscheinId");
    }
}
