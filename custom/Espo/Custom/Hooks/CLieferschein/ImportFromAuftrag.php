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
    $lieferscheinId = $entity->getId();
    $auftragId      = $entity->get('auftragId');

    $this->log->debug('[ImportFromAuftrag] Triggered afterSave', [
        'lieferscheinId' => $lieferscheinId,
        'auftragId'      => $auftragId,
        'isNew'          => $entity->isNew(),
        'createdAt'      => $entity->get('createdAt'),
        'options'        => $options,
    ]);

    // 1) Без заказа или без ID лифершайна – выходим
    if (!$auftragId || !$lieferscheinId) {
        return;
    }

    // 2) Защита от рекурсии
    if ($entity->get('isImportingFromAuftrag')) {
        $this->log->debug("[ImportFromAuftrag] Wird bereits importiert → übersprungen.");
        return;
    }

    $entity->set('isImportingFromAuftrag', true);

    try {
        // 3) Если уже есть позиции – ничего не импортируем
        $repo = $this->em->getRepository('CLieferscheinposition');
        $existingCount = $repo->where(['lieferscheinId' => $lieferscheinId])->count();

        if ($existingCount > 0) {
            $this->log->debug("[ImportFromAuftrag] Lieferschein {$lieferscheinId} hat bereits {$existingCount} Position(en) → kein Import notwendig.");
            return;
        }

        // 4) Тянем позиции из Auftragsposition
        $auftragPositions = $this->em->getRepository('CAuftragsposition')
            ->where(['auftragId' => $auftragId, 'deleted' => false])
            ->order('sortierung')
            ->find();

        $imported = 0;
        foreach ($auftragPositions as $pos) {
            $lsPos = $this->em->getEntity('CLieferscheinposition');
            $lsPos->set([
                'lieferscheinId'      => $lieferscheinId,
                'beschreibung'        => $pos->get('beschreibung'),
                'menge'               => $pos->get('menge'),
                'einheit'             => $pos->get('einheit'),
                'preis'               => $pos->get('preis'),
                'gesamt'              => $pos->get('gesamt'),
                'rabatt'              => $pos->get('rabatt'),
                'sortierung'          => $pos->get('sortierung'),
                'materialId'          => $pos->get('materialId'),
                'materialName'        => $pos->get('materialName'),
                'materialDescription' => $pos->get('materialDescription'),
                'createdById'         => $entity->get('createdById'),
                'assignedUserId'      => $entity->get('assignedUserId'),
            ]);

            $this->em->saveEntity($lsPos, ['importFromAuftrag' => true]);
            $imported++;
        }

        $this->log->info("[ImportFromAuftrag] {$imported} Position(en) aus Auftrag {$auftragId} in Lieferschein {$lieferscheinId} importiert.");
    } catch (\Throwable $e) {
        $this->log->error('[ImportFromAuftrag] Fehler: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
    } finally {
        $entity->set('isImportingFromAuftrag', false);
    }
}

}
