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

    // Что это: рассчитывает техническую сортировку из видимого номера позиции.
    // Зачем: positionsNummer 01 -> sortierung 10, 02 -> 20, 1.1 -> 1010, 1.2 -> 1020.
    private function buildSortierungFromPositionsNummer(?string $positionsNummer, int $fallback): int
    {
        $value = trim((string) $positionsNummer);

        if ($value === '') {
            return $fallback;
        }

        $parts = explode('.', $value);

        $mainRaw = trim((string) ($parts[0] ?? ''));
        $subRaw  = trim((string) ($parts[1] ?? ''));

        $main = (int) ltrim($mainRaw, '0');
        $sub  = $subRaw !== '' ? (int) ltrim($subRaw, '0') : 0;

        if ($main <= 0) {
            return $fallback;
        }

        // Простые номера:
        // 01 -> 10
        // 02 -> 20
        // 09 -> 90
        if ($sub <= 0 && count($parts) === 1) {
            return $main * 10;
        }

        // Подпозиции:
        // 1.1  -> 1010
        // 1.2  -> 1020
        // 1.10 -> 1100
        // 2.1  -> 2010
        return ($main * 1000) + ($sub * 10);
    }

    // Что это: разбирает видимый номер позиции вида 1, 1.1, 1.2, 2.10.
    // Зачем: чтобы сортировать позиции так же, как они видны в Angebot.
    private function parsePositionsNummer(?string $value): array
    {
        $value = trim((string) $value);

        if ($value === '') {
            return [];
        }

        return array_map(
            function ($part) {
                $part = trim((string) $part);

                return ctype_digit($part) ? (int) $part : $part;
            },
            explode('.', $value)
        );
    }

    // Что это: сравнивает номера позиций 1, 1.1, 1.2, 1.10, 2.
    // Зачем: обычная строковая сортировка поставила бы 1.10 перед 1.2, а это неправильно.
    private function comparePositionsNummer(?string $a, ?string $b): int
    {
        $aa = $this->parsePositionsNummer($a);
        $bb = $this->parsePositionsNummer($b);

        $len = max(count($aa), count($bb));

        for ($i = 0; $i < $len; $i++) {
            if (!array_key_exists($i, $aa)) return -1;
            if (!array_key_exists($i, $bb)) return 1;

            $va = $aa[$i];
            $vb = $bb[$i];

            if ($va === $vb) {
                continue;
            }

            if (is_int($va) && is_int($vb)) {
                return $va <=> $vb;
            }

            return strnatcasecmp((string) $va, (string) $vb);
        }

        return 0;
    }

    // Что это: строит ключ сортировки как в Angebot-JS.
    // Зачем: header идёт перед подпозициями, summary — после подпозиций.
    private function getPositionSortKey(Entity $pos): string
    {
        $key = trim((string) ($pos->get('positionsNummer') ?: $pos->get('name') ?: ''));
        $type = strtolower((string) ($pos->get('positionType') ?: 'normal'));

        if ($key !== '') {
            if ($type === 'header') {
                return $key . '.0';
            }

            if ($type === 'summary') {
                return $key . '.999';
            }
        }

        return $key;
    }

    // Что это: сортирует список позиций Angebot по positionsNummer.
    // Зачем: Auftrag должен получить позиции точно в том же логическом порядке.
    private function sortPositionsLikeAngebot(array &$list): void
    {
        usort($list, function (Entity $a, Entity $b): int {
            $aKey = $this->getPositionSortKey($a);
            $bKey = $this->getPositionSortKey($b);

            if ($aKey !== '' || $bKey !== '') {
                if ($aKey === '') return 1;
                if ($bKey === '') return -1;

                $cmp = $this->comparePositionsNummer($aKey, $bKey);

                if ($cmp !== 0) {
                    return $cmp;
                }
            }

            $aSort = $a->get('sortierung');
            $bSort = $b->get('sortierung');

            if ($aSort !== null && $aSort !== '' && $bSort !== null && $bSort !== '') {
                $cmp = ((int) $aSort) <=> ((int) $bSort);

                if ($cmp !== 0) {
                    return $cmp;
                }
            }

            return strcmp((string) $a->getId(), (string) $b->getId());
        });
    }


    /* ========================= Core ========================= */

    /**
     * Копируем/обновляем все позиции одного Angebots в CAuftragsposition.
     * Делает TИХИЕ save'ы (skipRecalc), а затем один общий пересчёт.
     */
    public function upsertFromAngebot(string $auftragId, string $angebotId): array
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

        // Что это: загружаем позиции Angebot в стабильном порядке.
        // Зачем: Auftragspositionen должны получить тот же порядок, что и позиции Angebot.

        $posList = $this->em->getRepository('CAngebotsposition')
            ->where([
                'angebotId' => $angebotId,
                'deleted'   => false,
            ])
            ->find();

        $this->log->warning("[SyncAngebotspositionen] upsert start: auftrag={$auftragId}, angebot={$angebotId}, srcCount=" . count($posList));

        // Что это: fallback-порядок с шагом 10.
        // Зачем: если у Angebotsposition sortierung пустая, Auftragsposition всё равно получит стабильный порядок.

        $fallbackSortierung = 10;

        foreach ($posList as $pos) {
            $posId = (string) $pos->getId();
            // Что это: рассчитываем sortierung напрямую из positionsNummer.
            // Зачем: порядок Auftrag должен соответствовать видимому номеру позиции в Angebot.
            $sortierung = $this->buildSortierungFromPositionsNummer(
                $pos->get('positionsNummer'),
                $fallbackSortierung
            );
            $fallbackSortierung += 10;

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
                            'positionsNummer' => $pos->get('positionsNummer'),
                            'positionType'    => $pos->get('positionType'),
                            'titel'           => $pos->get('titel'),
                            'sortierung'      => $sortierung,
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
                    'positionsNummer' => $pos->get('positionsNummer'),
                    'positionType'    => $pos->get('positionType'),
                    'titel'           => $pos->get('titel'),
                    'sortierung'      => $sortierung,

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

        /**
     * Полное пересоздание Auftragspositionen ИЗ СЧЕТОВ для заданного Auftrags.
     * Берём только Rechnungen со статусом aus $statusList (по умолчанию ['offen', 'bezahlt']).
     * Удаляем (soft-delete) старые позиции, у которых angebotId IS NULL (т.е. "из счетов").
     */
    public function rebuildFromInvoices(string $auftragId, array $statusList = ['offen', 'bezahlt']): array
    {
        $deletedOld = 0;
        $created    = 0;
        $errors     = 0;

        // 1) Убираем ВСЕ старые Auftragspositionen этого Auftrags
        try {
            $oldList = $this->em->getRepository('CAuftragsposition')
                ->where([
                    'auftragId' => $auftragId,
                    'deleted'   => false,
                ])
                ->find();

            foreach ($oldList as $ap) {
                $ap->set('deleted', true);
                $this->em->saveEntity($ap, ['skipRecalc' => true]);
                $deletedOld++;
            }

            $this->log->warning("[SyncAngebotspositionen] rebuildFromInvoices: soft-deleted ALL old positions for auftrag={$auftragId}: {$deletedOld}");
        } catch (\Throwable $e) {
            $this->log->warning("[SyncAngebotspositionen] rebuildFromInvoices: failed to delete old positions: " . $e->getMessage());
        }


        // 2) Находим все Rechnungen по Auftrags, со статусом из $statusList
        $rechnungen = $this->em->getRepository('CRechnung')
            ->where([
                'auftragId' => $auftragId,
                'deleted'   => false,
                'status'    => $statusList,   // IN (offen, bezahlt)
            ])
            ->find();

        $this->log->warning("[SyncAngebotspositionen] rebuildFromInvoices: auftrag={$auftragId}, rechnungenCount=" . count($rechnungen));

        foreach ($rechnungen as $rechnung) {
            $rechnungId = (string) $rechnung->getId();

            // все позиции этой Rechnung
            $posList = $this->em->getRepository('CRechnungsposition')
                ->where([
                    'rechnungId' => $rechnungId,
                    'deleted'    => false,
                ])
                ->order('sortierung')
                ->find();

            $this->log->warning("[SyncAngebotspositionen] rebuildFromInvoices: rechnung={$rechnungId}, srcCount=" . count($posList));

            foreach ($posList as $pos) {
                $posId = (string) $pos->getId();

                try {
                    $ap = $this->em->createEntity('CAuftragsposition');
                    $ap->set([
                        'auftragId' => $auftragId,

                        // ВАЖНО: не трогаем поля Angebot*, чтобы можно было отличить "из ангебота" и "из счетов"
                        // 'angebotId'          => null,
                        // 'angebotspositionId' => null,

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

                        'includeInAuftrag' => true,
                    ]);

                    $this->em->saveEntity($ap, ['skipRecalc' => true]);
                    $created++;
                } catch (\Throwable $e) {
                    $errors++;
                    $this->log->warning("[SyncAngebotspositionen] rebuildFromInvoices: create failed: auftrag={$auftragId}, rechnung={$rechnungId}, pos={$posId}, err=" . $e->getMessage());
                }
            }
        }

        $this->log->warning("[SyncAngebotspositionen] rebuildFromInvoices done: deletedOld={$deletedOld}, created={$created}, errors={$errors}");

        // один общий пересчёт после партии
        $this->triggerRecalc($auftragId, "rebuildFromInvoices(status=" . implode(',', $statusList) . ")");

        return [
            'deletedOld' => $deletedOld,
            'created'    => $created,
            'errors'     => $errors,
        ];
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
