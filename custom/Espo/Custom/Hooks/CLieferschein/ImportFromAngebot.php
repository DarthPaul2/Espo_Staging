<?php
namespace Espo\Custom\Hooks\CLieferschein;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Utils\Log;

class ImportFromAngebot
{
    private EntityManager $em;
    private Log $log;

    public function __construct(EntityManager $em, Log $log)
    {
        $this->em  = $em;
        $this->log = $log;
        $this->log->debug('[ImportFromAngebot] Hook loaded');
    }

    /**
     * Срабатывает при связывании CLieferschein с другой сущностью.
     */
    public function afterRelate(Entity $entity, string $relationName, Entity $relatedEntity, array $params = []): void
    {
        $this->log->debug('[ImportFromAngebot] afterRelate triggered', [
            'lieferscheinId' => $entity->getId(),
            'relation'       => $relationName,
            'relatedId'      => $relatedEntity->getId(),
            'relatedType'    => $relatedEntity->getEntityType(),
        ]);

        // Нам нужен линк именно на Angebot
        if ($relationName !== 'angebot') {
            return;
        }

        $angebotId      = $relatedEntity->getId();
        $lieferscheinId = $entity->getId();

        if (!$angebotId || !$lieferscheinId) {
            $this->log->debug('[ImportFromAngebot] Missing IDs → skip');
            return;
        }

        try {
            $posRepo = $this->em->getRepository('CAngebotsposition');
            $positions = $posRepo->where([
                'angebotId' => $angebotId,
                'deleted'   => false,
            ])->order('sortierung')->find();

            $this->log->debug('[ImportFromAngebot] Found positions', [
                'count' => count($positions),
                'ids'   => array_map(fn($p) => $p->getId(), $positions),
            ]);

            $count = 0;
            foreach ($positions as $pos) {
                $newPos = $this->em->getEntity('CLieferscheinposition');
                $newPos->set([
                    'lieferscheinId'      => $lieferscheinId,
                    'beschreibung'        => $pos->get('beschreibung'),
                    'einheit'             => $pos->get('einheit'),
                    'menge'               => $pos->get('menge'),
                    'preis'               => $pos->get('preis'),
                    'gesamt'              => $pos->get('gesamt'),
                    'rabatt'              => $pos->get('rabatt'),
                    'materialId'          => $pos->get('materialId'),
                    'materialDescription' => $pos->get('materialDescription'),
                    'materialEinheit'     => $pos->get('materialEinheit'),
                    'sortierung'          => $pos->get('sortierung'),
                    'assignedUserId'      => $entity->get('assignedUserId'),
                    'createdById'         => $entity->get('createdById'),
                    'modifiedById'        => $entity->get('modifiedById'),
                    'teamsIds'            => $entity->get('teamsIds'),
                ]);

                $this->em->saveEntity($newPos, ['skipHooks' => true]);
                $count++;
            }

            $this->log->debug("[ImportFromAngebot] Imported {$count} positions into Lieferschein {$lieferscheinId}");
        } catch (\Throwable $e) {
            $this->log->error('[ImportFromAngebot] Exception: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }
}
