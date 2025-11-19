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
        $auftragId = $entity->get('auftragId');

        $this->log->debug('[ImportFromAuftrag] Triggered afterSave', [
            'lieferscheinId' => $lieferscheinId,
            'auftragId'      => $auftragId,
            'isNew'          => $entity->isNew(),
            'createdAt'      => $entity->get('createdAt'),
            'options'        => $options,
        ]);

        // --- 1. Проверяем базовые условия
        if (!$auftragId || !$lieferscheinId) {
            return;
        }

        // --- 2. Отбрасываем автосейвы сразу после создания
        if ($entity->isNew()) {
            $this->log->debug("[ImportFromAuftrag] Abgebrochen: entity ist noch neu (autosave).");
            return;
        }

        $createdAt = strtotime($entity->get('createdAt') ?? 'now');
        if (time() - $createdAt < 2) {
            $this->log->debug("[ImportFromAuftrag] Abgebrochen: Lieferschein zu frisch (".(time()-$createdAt)."s alt).");
            return;
        }

        // --- 3. Если уже выполняется импорт — выходим
        if ($entity->get('isImportingFromAuftrag')) {
            $this->log->debug("[ImportFromAuftrag] Wird bereits importiert → übersprungen.");
            return;
        }

        $entity->set('isImportingFromAuftrag', true);

        try {
            // --- 4. Проверка, есть ли уже позиции
            $repo = $this->em->getRepository('CLieferscheinposition');
            $existingCount = $repo->where(['lieferscheinId' => $lieferscheinId])->count();

            if ($existingCount > 0) {
                $this->log->debug("[ImportFromAuftrag] Lieferschein {$lieferscheinId} hat bereits {$existingCount} Position(en) → kein Import notwendig.");
                return;
            }

            // --- 5. Импорт из Auftrag
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
