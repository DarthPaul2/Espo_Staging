<?php
namespace Espo\Custom\Hooks\CAuftrag;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Utils\Log;

class SyncAngebotspositionen
{
    public function __construct(
        private EntityManager $em,
        private Log $log
    ) {}

    /* ========================= Helpers ========================= */

    private function extractRelationName(array $data = [], mixed $arg3 = null): ?string
    {
        if (is_string($arg3)) return $arg3;
        if (is_array($arg3) && isset($arg3['relationName'])) return (string) $arg3['relationName'];
        return $data['relationName'] ?? null;
    }

    private function extractForeignId(array $data = [], mixed $arg3 = null): ?string
    {
        if (is_array($arg3) && !empty($arg3['foreignId'])) return (string) $arg3['foreignId'];
        foreach (['id', 'relatedId', 'foreignId'] as $k) {
            if (!empty($data[$k])) return (string) $data[$k];
        }
        return null;
    }

    private function triggerRecalc(string $auftragId, string $reason): void
    {
        $base = rtrim(getenv('KLESEC_API_BASE') ?: 'https://klesec.pagekite.me/api', '/');
        $url  = $base . '/auftrag/' . rawurlencode($auftragId) . '/recalc_totals';

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST   => 'POST',
            CURLOPT_RETURNTRANSFER  => true,
            CURLOPT_TIMEOUT         => 8,
            CURLOPT_SSL_VERIFYPEER  => false,
            CURLOPT_SSL_VERIFYHOST  => false,
            CURLOPT_HTTPHEADER      => ['Accept: application/json'],
        ]);
        $resp = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err  = curl_error($ch);
        curl_close($ch);

        if ($code >= 200 && $code < 300) {
            $this->log->warning("[SyncAngebotspositionen→Recalc] {$reason} OK ({$code})");
        } else {
            $this->log->warning("[SyncAngebotspositionen→Recalc] {$reason} FAILED code={$code} err={$err} resp=" . substr((string)$resp, 0, 300));
        }
    }

    /* ========================= Core ========================= */

    /**
     * Копируем/обновляем все позиции одного Angebots в CAuftragsposition.
     * Делает TИХИЕ save'ы (skipRecalc), а затем один общий пересчёт.
     */
    private function upsertFromAngebot(string $auftragId, string $angebotId): array
    {
        $created = 0; $updated = 0; $skipped = 0; $errors = 0;

        // Текущие позиции заказа: карта angebotspositionId -> auftragspositionId
        $existing = $this->em->getRepository('CAuftragsposition')
            ->select(['id', 'angebotspositionId'])
            ->where(['auftragId' => $auftragId, 'deleted' => false])
            ->find();

        $existingMap = [];
        foreach ($existing as $row) {
            $apId   = (string) $row->get('id');
            $apSrc  = (string) $row->get('angebotspositionId');
            if ($apSrc !== '') {
                $existingMap[$apSrc] = $apId;
            }
        }

        // Источник — все позиции конкретного Angebots
        $posList = $this->em->getRepository('CAngebotsposition')
            ->where(['angebotId' => $angebotId])
            ->order('sortierung')
            ->find();

        $this->log->warning("[SyncAngebotspositionen] upsert start: auftrag={$auftragId}, angebot={$angebotId}, srcCount=" . count($posList));

        foreach ($posList as $pos) {
            $posId = (string) $pos->getId();

            try {
                // если уже есть — обновляем существующую Auftragsposition
                if (isset($existingMap[$posId])) {
                    $apId = $existingMap[$posId];
                    $ap   = $this->em->getEntity('CAuftragsposition', $apId);
                    if ($ap && !$ap->get('deleted')) {
                        $ap->set([
                            'name'          => $pos->get('name'),
                            'beschreibung'  => $pos->get('beschreibung') ?: $pos->get('description'),
                            'materialId'    => $pos->get('materialId'),

                            'einheit'       => $pos->get('einheit'),
                            'menge'         => $pos->get('menge'),
                            'preis'         => $pos->get('preis'),
                            'netto'         => $pos->get('netto'),
                            'gesamt'        => $pos->get('gesamt'),
                            'rabatt'        => $pos->get('rabatt'),
                            'steuer'        => $pos->get('steuer'),
                            'einkaufspreis' => $pos->get('einkaufspreis'),
                            'sortierung'    => $pos->get('sortierung'),
                        ]);
                        $this->em->saveEntity($ap, ['skipRecalc' => true]);
                        $updated++;
                    } else {
                        $skipped++; // мягко: запись помечена deleted или не найдена
                    }
                    continue;
                }

                // иначе — создаём новую Auftragsposition
                $ap = $this->em->createEntity('CAuftragsposition');
                $ap->set([
                    'auftragId'          => $auftragId,
                    'angebotId'          => $angebotId,
                    'angebotspositionId' => $posId,

                    'name'          => $pos->get('name'),
                    'beschreibung'  => $pos->get('beschreibung') ?: $pos->get('description'),
                    'materialId'    => $pos->get('materialId'),

                    'einheit'       => $pos->get('einheit'),
                    'menge'         => $pos->get('menge'),
                    'preis'         => $pos->get('preis'),
                    'netto'         => $pos->get('netto'),
                    'gesamt'        => $pos->get('gesamt'),
                    'rabatt'        => $pos->get('rabatt'),
                    'steuer'        => $pos->get('steuer'),
                    'einkaufspreis' => $pos->get('einkaufspreis'),
                    'sortierung'    => $pos->get('sortierung'),

                    // по умолчанию включаем в заказ
                    'includeInAuftrag'  => true,
                ]);
                $this->em->saveEntity($ap, ['skipRecalc' => true]);
                $existingMap[$posId] = (string) $ap->getId();
                $created++;

            } catch (\Throwable $e) {
                $errors++;
                $this->log->warning("[SyncAngebotspositionen] upsert failed: auftrag={$auftragId}, angebot={$angebotId}, pos={$posId}, err=" . $e->getMessage());
            }
        }

        $this->log->warning("[SyncAngebotspositionen] upsert done: created={$created}, updated={$updated}, skipped={$skipped}, errors={$errors}");

        // один общий пересчёт после партии
        $this->triggerRecalc($auftragId, "upsertFromAngebot(angebotId={$angebotId})");

        return compact('created', 'updated', 'skipped', 'errors');
    }

    /* ========================= Hooks ========================= */

    /** Привязали Angebot к Auftrag */
    public function afterRelate(Entity $auftrag, array $data = [], $arg3 = null): void
    {
        $relation  = $this->extractRelationName($data, $arg3);
        $foreignId = $this->extractForeignId($data, $arg3);

        $this->log->warning("[SyncAngebotspositionen] afterRelate: relation=" . json_encode($relation) . ", foreignId=" . json_encode($foreignId) . ", auftrag=" . $auftrag->getId());

        if ($relation !== 'angebots') return;

        $auftragId = (string) $auftrag->getId();
        if (!$auftragId || !$foreignId) {
            $this->log->warning("[SyncAngebotspositionen] afterRelate: missing ids, abort.");
            return;
        }

        $res = $this->upsertFromAngebot($auftragId, (string) $foreignId);
        $this->log->warning("[SyncAngebotspositionen] afterRelate summary: " . json_encode($res));
    }

    /** Отвязали Angebot от Auftrag */
    public function afterUnrelate(Entity $auftrag, array $data = [], $arg3 = null): void
    {
        $relation  = $this->extractRelationName($data, $arg3);
        $foreignId = $this->extractForeignId($data, $arg3);

        $this->log->warning("[SyncAngebotspositionen] afterUnrelate: relation=" . json_encode($relation) . ", foreignId=" . json_encode($foreignId) . ", auftrag=" . $auftrag->getId());

        if ($relation !== 'angebots') return;

        $auftragId = (string) $auftrag->getId();
        if (!$auftragId || !$foreignId) {
            $this->log->warning("[SyncAngebotspositionen] afterUnrelate: missing ids, abort.");
            return;
        }

        try {
            $list = $this->em->getRepository('CAuftragsposition')
                ->where([
                    'auftragId' => $auftragId,
                    'angebotId' => (string) $foreignId,
                    'deleted'   => false,
                ])
                ->find();

            $cnt = 0;
            foreach ($list as $ap) {
                $ap->set('deleted', true);
                $this->em->saveEntity($ap, ['skipRecalc' => true]); // тихо
                $cnt++;
            }
            $this->log->warning("[SyncAngebotspositionen] afterUnrelate: soft-deleted={$cnt}");

            // один общий пересчёт после партии
            $this->triggerRecalc($auftragId, "afterUnrelate(angebotId={$foreignId})");

        } catch (\Throwable $e) {
            $this->log->warning("[SyncAngebotspositionen] afterUnrelate failed: " . $e->getMessage());
        }
    }
}
