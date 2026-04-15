<?php

namespace Espo\Custom\Controllers;

use Espo\Core\Templates\Controllers\Base;

class CRechnung extends Base
{
    /**
     * GET /CRechnung/action/bezahltUmsatzByMonth
     *
     * Параметры (query, опционально):
     *   year=YYYY
     *
     * Возвращает:
     * [
     *   { "month": "2025-01", "umsatzNetto": 1234.56, "umsatzBrutto": 1456.78, "cnt": 10 },
     *   ...
     * ]
     */
    public function getActionBezahltUmsatzByMonth($params, $data, $request)
    {
        $em  = $this->getEntityManager();
        $pdo = $em->getPDO();

        // ?year=2025 (опционально)
        $year = $request->getQueryParam('year');

        $sql = "
            SELECT
                DATE_FORMAT(bezahlt_am, '%Y-%m') AS month,
                SUM(betrag_netto)  AS umsatzNetto,
                SUM(betrag_brutto) AS umsatzBrutto,
                COUNT(*)           AS cnt
            FROM c_rechnung
            WHERE
                deleted = 0
                AND status = 'bezahlt'
                AND bezahlt_am IS NOT NULL
                " . ($year ? "AND YEAR(bezahlt_am) = :year" : "") . "
            GROUP BY DATE_FORMAT(bezahlt_am, '%Y-%m')
            ORDER BY month ASC
        ";

        try {
            $sth = $pdo->prepare($sql);

            if ($year) {
                $sth->bindValue(':year', (int) $year, \PDO::PARAM_INT);
            }

            $sth->execute();

            $rows = $sth->fetchAll(\PDO::FETCH_ASSOC) ?: [];

            foreach ($rows as &$row) {
                $row['umsatzNetto']  = (float) ($row['umsatzNetto']  ?? 0);
                $row['umsatzBrutto'] = (float) ($row['umsatzBrutto'] ?? 0);
                $row['cnt']          = (int)   ($row['cnt']          ?? 0);
            }

            return $rows;

        } catch (\Throwable $e) {
            $this->getContainer()->get('log')->error(
                'CRechnung::bezahltUmsatzByMonth SQL error: ' . $e->getMessage()
            );

            return [
                'success' => false,
                'error'   => 'SQL error in bezahltUmsatzByMonth',
            ];
        }
    }

    /**
     * GET /CRechnung/action/rechnungStatusSummary
     *
     * Параметры (query, опционально):
     *   year=YYYY
     *
     * Возвращает один объект с агрегатами ЗА ВЫБРАННЫЙ ГОД:
     *  - всего счетов (кроме storniert)
     *  - суммы Netto/Brutto по всем
     *  - суммы и количество по оплаченным
     *  - суммы и количество по не оплаченным (кроме storniert)
     */
    public function getActionRechnungStatusSummary($params, $data, $request)
    {
        $em  = $this->getEntityManager();
        $pdo = $em->getPDO();

        // ?year=2025 (опционально)
        $year = $request->getQueryParam('year');

        $yearFilterSql = '';
        if ($year && preg_match('/^\d{4}$/', $year)) {
            // фильтруем по году выставления счёта (created_at)
            $yearFilterSql = " AND YEAR(created_at) = :year ";
        }

        $sql = "
            SELECT
                -- все (кроме storniert)
                COUNT(*)                                          AS totalCount,
                SUM(betrag_netto)                                 AS totalNetto,
                SUM(betrag_brutto)                                AS totalBrutto,

                -- оплаченные
                SUM(CASE WHEN status = 'bezahlt' THEN 1 ELSE 0 END)             AS bezahltCount,
                SUM(CASE WHEN status = 'bezahlt' THEN betrag_netto  ELSE 0 END) AS bezahltNetto,
                SUM(CASE WHEN status = 'bezahlt' THEN betrag_brutto ELSE 0 END) AS bezahltBrutto,

                -- не оплаченные (все, кто НЕ bezahlt и НЕ storniert)
                SUM(CASE WHEN status <> 'bezahlt' THEN 1 ELSE 0 END)             AS offenCount,
                SUM(CASE WHEN status <> 'bezahlt' THEN betrag_netto  ELSE 0 END) AS offenNetto,
                SUM(CASE WHEN status <> 'bezahlt' THEN betrag_brutto ELSE 0 END) AS offenBrutto
            FROM c_rechnung
            WHERE
                deleted = 0
                AND status <> 'storniert'
                {$yearFilterSql}
        ";

        try {
            $sth = $pdo->prepare($sql);

            if ($yearFilterSql) {
                $sth->bindValue(':year', (int) $year, \PDO::PARAM_INT);
            }

            $sth->execute();

            $row = $sth->fetch(\PDO::FETCH_ASSOC) ?: [];

            $result = [
                'totalCount'    => (int)   ($row['totalCount']    ?? 0),
                'totalNetto'    => (float) ($row['totalNetto']    ?? 0),
                'totalBrutto'   => (float) ($row['totalBrutto']   ?? 0),

                'bezahltCount'  => (int)   ($row['bezahltCount']  ?? 0),
                'bezahltNetto'  => (float) ($row['bezahltNetto']  ?? 0),
                'bezahltBrutto' => (float) ($row['bezahltBrutto'] ?? 0),

                'offenCount'    => (int)   ($row['offenCount']    ?? 0),
                'offenNetto'    => (float) ($row['offenNetto']    ?? 0),
                'offenBrutto'   => (float) ($row['offenBrutto']   ?? 0),
            ];

            $this->getContainer()->get('log')->info(
                'CRechnung::rechnungStatusSummary result: ' . json_encode($result)
            );

            return $result;
        } catch (\Throwable $e) {
            $this->getContainer()->get('log')->error(
                'CRechnung::rechnungStatusSummary SQL error: ' . $e->getMessage()
            );

            return [
                'success' => false,
                'error'   => 'SQL error in rechnungStatusSummary',
            ];
        }
    }

    public function getActionMonatlicheStatistik($params, $data, $request)
{
    $year = $request->getQueryParam('year');
    if (!$year || !preg_match('/^\d{4}$/', $year)) {
        return ['success' => false, 'error' => 'year parameter missing or invalid'];
    }

    $em  = $this->getEntityManager();
    $pdo = $em->getPDO();

    /**
     * ЛОГИКА:
     *  - Umsatz (gestellt) считаем по created_at
     *  - Bezahlt           считаем по bezahlt_am
     *  - Offene Posten     считаем по faellig_am
     *
     * Каждый блок сначала агрегирует свои данные по месяцам,
     * потом мы их склеиваем по месяцу через JOIN.
     */
    $sql = "
        SELECT
            m.monat AS month,

            -- Umsatz (gestellt)
            COALESCE(u.umsatzNetto,  0) AS umsatzNetto,
            COALESCE(u.umsatzBrutto, 0) AS umsatzBrutto,
            COALESCE(u.umsatzCount,  0) AS umsatzCount,

            -- Bezahlt
            COALESCE(b.bezahltNetto,  0) AS bezahltNetto,
            COALESCE(b.bezahltBrutto, 0) AS bezahltBrutto,
            COALESCE(b.bezahltCount,  0) AS bezahltCount,

            -- Offene Posten
            COALESCE(o.offenNetto,  0) AS offenNetto,
            COALESCE(o.offenBrutto, 0) AS offenBrutto,
            COALESCE(o.offenCount,  0) AS offenCount

        FROM
            (
                -- 12 месяцев выбранного года
                SELECT DATE_FORMAT(
                           STR_TO_DATE(CONCAT(:year, '-', m, '-01'), '%Y-%m-%d'),
                           '%Y-%m'
                       ) AS monat
                FROM (
                    SELECT 1 AS m UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6
                    UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
                ) AS months
            ) AS m

            -- Umsatz (gestellt) по created_at
            LEFT JOIN (
                SELECT
                    DATE_FORMAT(created_at, '%Y-%m') AS monat,
                    SUM(betrag_netto)               AS umsatzNetto,
                    SUM(betrag_brutto)              AS umsatzBrutto,
                    COUNT(*)                        AS umsatzCount
                FROM c_rechnung
                WHERE
                    deleted = 0
                    AND status <> 'storniert'
                    AND YEAR(created_at) = :year
                GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ) AS u ON u.monat = m.monat

            -- Bezahlt по bezahlt_am
            LEFT JOIN (
                SELECT
                    DATE_FORMAT(bezahlt_am, '%Y-%m') AS monat,
                    SUM(betrag_netto)                AS bezahltNetto,
                    SUM(betrag_brutto)               AS bezahltBrutto,
                    COUNT(*)                         AS bezahltCount
                FROM c_rechnung
                WHERE
                    deleted = 0
                    AND status = 'bezahlt'
                    AND bezahlt_am IS NOT NULL
                    AND YEAR(bezahlt_am) = :year
                GROUP BY DATE_FORMAT(bezahlt_am, '%Y-%m')
            ) AS b ON b.monat = m.monat

            -- Offene Posten по faellig_am
            LEFT JOIN (
                SELECT
                    DATE_FORMAT(faellig_am, '%Y-%m') AS monat,
                    SUM(betrag_netto)                AS offenNetto,
                    SUM(betrag_brutto)               AS offenBrutto,
                    COUNT(*)                         AS offenCount
                FROM c_rechnung
                WHERE
                    deleted = 0
                    AND status <> 'bezahlt'
                    AND status <> 'storniert'
                    AND faellig_am IS NOT NULL
                    AND YEAR(faellig_am) = :year
                GROUP BY DATE_FORMAT(faellig_am, '%Y-%m')
            ) AS o ON o.monat = m.monat

        ORDER BY m.monat ASC
    ";

    try {
        $sth = $pdo->prepare($sql);
        $sth->execute(['year' => (int) $year]);
        $rows = $sth->fetchAll(\PDO::FETCH_ASSOC) ?: [];

        foreach ($rows as &$row) {
            foreach ($row as $k => $v) {

                if ($k === 'month') {
                    // строка вида "2025-12" – оставляем как есть
                    continue;
                }

                // поля с количеством → int
                if (substr($k, -5) === 'Count') {
                    $row[$k] = (int) $v;
                } else {
                    // суммы → float
                    $row[$k] = (float) $v;
                }
            }
        }

        // логируем, чтобы точно видеть, что вернула статистика по месяцам
        $this->getContainer()->get('log')->info(
            'CRechnung::monatlicheStatistik result: ' . json_encode($rows)
        );

        return $rows;


        return $rows;
    } catch (\Throwable $e) {
        $this->getContainer()->get('log')->error("monatlicheStatistik error: " . $e->getMessage());
        return ['success' => false, 'error' => 'SQL error'];
    }
}


    public function getActionJahresStatistik($params, $data, $request)
    {
        $em  = $this->getEntityManager();
        $pdo = $em->getPDO();

        $sql = "
            SELECT
                YEAR(r.created_at) AS year,

                SUM(r.betrag_netto)  AS umsatzNetto,
                SUM(r.betrag_brutto) AS umsatzBrutto,

                SUM(CASE WHEN r.status = 'bezahlt' THEN r.betrag_netto  ELSE 0 END) AS bezahltNetto,
                SUM(CASE WHEN r.status = 'bezahlt' THEN r.betrag_brutto ELSE 0 END) AS bezahltBrutto,

                SUM(CASE WHEN r.status <> 'bezahlt' AND r.status <> 'storniert'
                         THEN r.betrag_netto ELSE 0 END) AS offenNetto,

                SUM(CASE WHEN r.status <> 'bezahlt' AND r.status <> 'storniert'
                         THEN r.betrag_brutto ELSE 0 END) AS offenBrutto

            FROM c_rechnung r
            WHERE r.deleted = 0
            GROUP BY YEAR(r.created_at)
            ORDER BY year ASC
        ";

        try {
            $rows = $pdo->query($sql)->fetchAll(\PDO::FETCH_ASSOC) ?: [];

            foreach ($rows as &$row) {
                foreach ($row as $k => $v) {
                    if ($k !== 'year') {
                        $row[$k] = (float) $v;
                    } else {
                        $row[$k] = (int) $v;
                    }
                }
            }

            return $rows;
        } catch (\Throwable $e) {
            $this->getContainer()->get('log')->error("jahresStatistik error: " . $e->getMessage());
            return ['success' => false, 'error' => 'SQL error'];
        }
    }

    public function getActionUmsatzGestelltByMonth($params, $data, $request)
    {
        $em  = $this->getEntityManager();
        $pdo = $em->getPDO();

        $year = $request->getQueryParam('year');   // можно фильтровать по году

        $sql = "
            SELECT
                DATE_FORMAT(created_at, '%Y-%m') AS month,
                SUM(betrag_netto)  AS umsatzNetto,
                SUM(betrag_brutto) AS umsatzBrutto,
                COUNT(*) AS cnt
            FROM c_rechnung
            WHERE
                deleted = 0
                AND status <> 'storniert'
                " . ($year ? "AND YEAR(created_at) = :year" : "") . "
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month ASC
        ";

        try {
            $sth = $pdo->prepare($sql);
            if ($year) {
                $sth->bindValue(':year', $year, \PDO::PARAM_INT);
            }
            $sth->execute();

            $rows = $sth->fetchAll(\PDO::FETCH_ASSOC) ?: [];

            foreach ($rows as &$row) {
                $row['umsatzNetto']  = (float) ($row['umsatzNetto']  ?? 0);
                $row['umsatzBrutto'] = (float) ($row['umsatzBrutto'] ?? 0);
                $row['cnt']          = (int)   ($row['cnt']          ?? 0);
            }

            $this->getContainer()->get('log')->info(
                'CRechnung::umsatzGestelltByMonth result: ' . json_encode($rows)
            );

            return $rows;

        } catch (\Throwable $e) {
            $this->getContainer()->get('log')->error(
                'CRechnung::umsatzGestelltByMonth SQL error: ' . $e->getMessage()
            );

            return [
                'success' => false,
                'error'   => 'SQL error in umsatzGestelltByMonth',
            ];
        }
    }

    public function getActionUmsatzGestelltByYear($params, $data, $request)
    {
        $em  = $this->getEntityManager();
        $pdo = $em->getPDO();

        $sql = "
            SELECT
                YEAR(created_at)           AS year,
                SUM(betrag_netto)          AS umsatzNetto,
                SUM(betrag_brutto)         AS umsatzBrutto,
                COUNT(*)                   AS cnt
            FROM c_rechnung
            WHERE
                deleted = 0
                AND status <> 'storniert'
            GROUP BY YEAR(created_at)
            ORDER BY year ASC
        ";

        try {
            $sth = $pdo->prepare($sql);
            $sth->execute();

            $rows = $sth->fetchAll(\PDO::FETCH_ASSOC) ?: [];

            foreach ($rows as &$row) {
                $row['year']         = (int)   ($row['year']         ?? 0);
                $row['umsatzNetto']  = (float) ($row['umsatzNetto']  ?? 0);
                $row['umsatzBrutto'] = (float) ($row['umsatzBrutto'] ?? 0);
                $row['cnt']          = (int)   ($row['cnt']          ?? 0);
            }

            $this->getContainer()->get('log')->info(
                'CRechnung::umsatzGestelltByYear result: ' . json_encode($rows)
            );

            return $rows;

        } catch (\Throwable $e) {
            $this->getContainer()->get('log')->error(
                'CRechnung::umsatzGestelltByYear SQL error: ' . $e->getMessage()
            );

            return [
                'success' => false,
                'error'   => 'SQL error in umsatzGestelltByYear',
            ];
        }
    }

    public function postActionDownloadPdfZip($params, $data, $request)
{
    // права: чтение счетов
    $this->getAcl()->check('CRechnung', 'read');

    $ids = null;

// 1) обычный JSON: { "ids": [...] }
if (isset($data->ids)) {
    $ids = $data->ids;
}

// 2) если вдруг пришло строкой JSON: { "ids": "[...]" }
if (is_string($ids)) {
    $decoded = json_decode($ids, true);
    if (is_array($decoded)) {
        $ids = $decoded;
    }
}

// 3) финальная проверка
if (!is_array($ids) || !count($ids)) {
    return ['success' => false, 'error' => 'ids is required'];
}


    $em = $this->getEntityManager();

    $baseDir = '/var/www/espocrm/public/pdf/rechnungen';

    $zipName = 'rechnungen_' . date('Y-m-d_His') . '.zip';
    $tmpZip  = sys_get_temp_dir() . DIRECTORY_SEPARATOR . $zipName;

    $zip = new \ZipArchive();
    if ($zip->open($tmpZip, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
        return ['success' => false, 'error' => 'Cannot create zip'];
    }

    $missing = [];

    foreach ($ids as $id) {
        $e = $em->getEntity('CRechnung', $id);
        if (!$e) {
            $missing[] = "NOT_FOUND_ENTITY_ID_$id";
            continue;
        }

        $nr = trim((string) ($e->get('rechnungsnummer') ?? ''));
        if ($nr === '') {
            $missing[] = "NO_RECHNUNGSNUMMER_ID_$id";
            continue;
        }

        // основной вариант по вашей текущей логике
        $fn1 = $nr . '_zugferd.pdf';
        $p1  = $baseDir . DIRECTORY_SEPARATOR . $fn1;

        // fallback на старый формат без суффикса (если есть такие файлы)
        $fn2 = $nr . '.pdf';
        $p2  = $baseDir . DIRECTORY_SEPARATOR . $fn2;

        if (is_file($p1)) {
            $zip->addFile($p1, $fn1);
        } elseif (is_file($p2)) {
            $zip->addFile($p2, $fn2);
        } else {
            $missing[] = $fn1;
        }
    }

    if ($missing) {
        $zip->addFromString('MISSING.txt', implode("\n", $missing) . "\n");
    }

    $zip->close();

    // Отдаём zip как файл
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="' . $zipName . '"');
    header('Content-Length: ' . filesize($tmpZip));
    header('Cache-Control: no-store, no-cache, must-revalidate');
    header('Pragma: no-cache');

    readfile($tmpZip);
    @unlink($tmpZip);
    exit;
}

// Это action для fachlicher Freigabe счета.
// Он проверяет, можно ли перевести Rechnung в статус "freigabe".
public function postActionFreigeben($params, $data, $request)
{
    $this->getAcl()->check('CRechnung', 'edit');

    $id = $params['id'] ?? null;

    if (!$id && isset($data->id)) {
        $id = $data->id;
    }

    if (!$id) {
        return [
            'success' => false,
            'message' => 'Rechnung-ID fehlt.'
        ];
    }

    $em = $this->getEntityManager();
    $rechnung = $em->getEntity('CRechnung', $id);

    if (!$rechnung) {
        return [
            'success' => false,
            'message' => 'Rechnung wurde nicht gefunden.'
        ];
    }

    try {
        $rechnungstyp = strtolower((string) ($rechnung->get('rechnungstyp') ?? ''));
        $buchhaltungStatus = strtolower((string) ($rechnung->get('buchhaltungStatus') ?? 'entwurf'));

        if ($rechnungstyp !== 'einzelrechnung') {
            return [
                'success' => false,
                'message' => 'Nur Einzelrechnungen können in Phase 1 freigegeben werden.'
            ];
        }

        if ($buchhaltungStatus === 'festgeschrieben') {
            return [
                'success' => false,
                'message' => 'Die Rechnung ist bereits festgeschrieben.'
            ];
        }

        if (!$rechnung->get('accountId')) {
            return [
                'success' => false,
                'message' => 'Kunde fehlt.'
            ];
        }

        if (!trim((string) ($rechnung->get('rechnungsnummer') ?? ''))) {
            return [
                'success' => false,
                'message' => 'Rechnungsnummer fehlt.'
            ];
        }

        if (!$rechnung->get('belegdatum')) {
            return [
                'success' => false,
                'message' => 'Belegdatum fehlt.'
            ];
        }

        if (!$rechnung->get('faelligAm')) {
            return [
                'success' => false,
                'message' => 'Fälligkeitsdatum fehlt.'
            ];
        }

        $betragNetto = (float) ($rechnung->get('betragNetto') ?? 0);
        $betragBrutto = (float) ($rechnung->get('betragBrutto') ?? 0);

        if ($betragNetto <= 0 || $betragBrutto <= 0) {
            return [
                'success' => false,
                'message' => 'Netto- und Bruttobetrag müssen größer als 0 sein.'
            ];
        }

        $gesetzOption13b = (bool) ($rechnung->get('gesetzOption13b') ?? false);
        $gesetzOption12 = (bool) ($rechnung->get('gesetzOption12') ?? false);

        if ($gesetzOption13b && $gesetzOption12) {
            return [
                'success' => false,
                'message' => '§ 13b und § 12 dürfen nicht gleichzeitig aktiviert sein.'
            ];
        }

        $positionCollection = $em
            ->getRDBRepository('CRechnungsposition')
            ->where([
                'rechnungId' => $id,
                'deleted' => false,
            ])
            ->find();

        if (!$positionCollection || !count($positionCollection)) {
            return [
                'success' => false,
                'message' => 'Die Rechnung enthält keine Positionen.'
            ];
        }

        $user = $this->getUser();

        $rechnung->set('buchhaltungStatus', 'freigabe');
        $rechnung->set('freigabeAm', date('Y-m-d H:i:s'));

        if ($user) {
            $rechnung->set('freigegebeneRechnungenId', $user->getId());
            $rechnung->set('freigegebeneRechnungenName', $user->get('name'));
        }

        $em->saveEntity($rechnung);

        return [
            'success' => true,
            'message' => 'Rechnung wurde fachlich freigegeben.',
            'id' => $rechnung->getId(),
            'buchhaltungStatus' => $rechnung->get('buchhaltungStatus'),
            'freigabeAm' => $rechnung->get('freigabeAm'),
        ];
    } catch (\Throwable $e) {
        $this->getContainer()->get('log')->error(
            'CRechnung::postActionFreigeben error: ' . $e->getMessage()
        );

        return [
            'success' => false,
            'message' => 'Freigabe konnte nicht abgeschlossen werden.'
        ];
    }
}

/**
 * Zurück zu Entwurf.
 * Это action для обратного перехода: freigabe -> entwurf.
 */
public function postActionZurueckZuEntwurf($params, $data, $request)
{
    // Это проверка прав: нужен доступ на редактирование счета.
    $this->getAcl()->check('CRechnung', 'edit');

    // Это получение ID счета из URL-параметров или из POST-body.
    $id = $params['id'] ?? null;
    if (!$id && isset($data->id)) {
        $id = $data->id;
    }

    if (!$id) {
        return [
            'success' => false,
            'message' => 'Rechnung-ID fehlt.'
        ];
    }

    $em = $this->getEntityManager();
    $rechnung = $em->getEntity('CRechnung', $id);

    if (!$rechnung) {
        return [
            'success' => false,
            'message' => 'Rechnung wurde nicht gefunden.'
        ];
    }

    try {
        // Это чтение текущего бухгалтерического статуса.
        $buchhaltungStatus = strtolower((string) ($rechnung->get('buchhaltungStatus') ?? 'entwurf'));
        $istFestgeschrieben = (bool) ($rechnung->get('istFestgeschrieben') ?? false);

        // Уже в Entwurf — ничего менять не нужно.
        if ($buchhaltungStatus === 'entwurf') {
            return [
                'success' => true,
                'message' => 'Die Rechnung befindet sich bereits im Status Entwurf.'
            ];
        }

        // После Festschreibung возврат в Entwurf обычным путем запрещаем.
        if ($istFestgeschrieben || $buchhaltungStatus === 'festgeschrieben') {
            return [
                'success' => false,
                'message' => 'Festgeschriebene Rechnungen können nicht mehr in den Entwurf zurückgesetzt werden.'
            ];
        }

        // Обратный переход разрешаем только из Freigabe.
        if ($buchhaltungStatus !== 'freigabe') {
            return [
                'success' => false,
                'message' => 'Nur freigegebene Rechnungen können zurück in den Entwurf gesetzt werden.'
            ];
        }

        // Это сам переход назад в Entwurf.
        $rechnung->set('buchhaltungStatus', 'entwurf');

        // Это очистка данных Freigabe, потому что счет снова в работе.
        $rechnung->set('freigabeAm', null);
        $rechnung->set('freigegebeneRechnungenId', null);
        $rechnung->set('freigegebeneRechnungenName', null);

        $em->saveEntity($rechnung);

        return [
            'success' => true,
            'message' => 'Rechnung wurde zurück in den Entwurf gesetzt.',
            'id' => $rechnung->getId(),
            'buchhaltungStatus' => $rechnung->get('buchhaltungStatus'),
        ];
    } catch (\Throwable $e) {
        $this->getContainer()->get('log')->error(
            'CRechnung::postActionZurueckZuEntwurf error: ' . $e->getMessage()
        );

        return [
            'success' => false,
            'message' => 'Der Status konnte nicht auf Entwurf zurückgesetzt werden.'
        ];
    }
}

/**
 * Festschreibung der Rechnung.
 * Это главный бухгалтерический action Phase 1:
 * freigabe -> festgeschrieben + Journal + Buchungen.
 */
public function postActionFestschreiben($params, $data, $request)
{
    // Это проверка прав: нужен доступ на редактирование счета.
    $this->getAcl()->check('CRechnung', 'edit');

    // Это получение ID счета из URL-параметров или из POST-body.
    $id = $params['id'] ?? null;
    if (!$id && isset($data->id)) {
        $id = $data->id;
    }

    if (!$id) {
        return [
            'success' => false,
            'message' => 'Rechnung-ID fehlt.'
        ];
    }

    // Это EntityManager и PDO для дальнейшей транзакции.
    $em = $this->getEntityManager();
    $pdo = $em->getPDO();

    $rechnung = $em->getEntity('CRechnung', $id);

    if (!$rechnung) {
        return [
            'success' => false,
            'message' => 'Rechnung wurde nicht gefunden.'
        ];
    }

    try {
        // -----------------------------
        // 1) Grundvalidierung Rechnung
        // -----------------------------
        $rechnungstyp = strtolower((string) ($rechnung->get('rechnungstyp') ?? ''));
        $buchhaltungStatus = strtolower((string) ($rechnung->get('buchhaltungStatus') ?? 'entwurf'));
        $istFestgeschrieben = (bool) ($rechnung->get('istFestgeschrieben') ?? false);

        if ($rechnungstyp !== 'einzelrechnung') {
            return [
                'success' => false,
                'message' => 'Nur Einzelrechnungen können in Phase 1 festgeschrieben werden.'
            ];
        }

        if ($buchhaltungStatus !== 'freigabe') {
            return [
                'success' => false,
                'message' => 'Die Rechnung muss zuerst freigegeben werden.'
            ];
        }

        if ($istFestgeschrieben || $buchhaltungStatus === 'festgeschrieben') {
            return [
                'success' => false,
                'message' => 'Die Rechnung ist bereits festgeschrieben.'
            ];
        }

        if (!$rechnung->get('accountId')) {
            return [
                'success' => false,
                'message' => 'Kunde fehlt.'
            ];
        }

        if (!trim((string) ($rechnung->get('rechnungsnummer') ?? ''))) {
            return [
                'success' => false,
                'message' => 'Rechnungsnummer fehlt.'
            ];
        }

        if (!$rechnung->get('belegdatum')) {
            return [
                'success' => false,
                'message' => 'Belegdatum fehlt.'
            ];
        }

        if (!$rechnung->get('faelligAm')) {
            return [
                'success' => false,
                'message' => 'Fälligkeitsdatum fehlt.'
            ];
        }

        // Это берёт суммы из Rechnung и округляет их до 2 знаков.
        $betragNetto = round((float) ($rechnung->get('betragNetto') ?? 0), 2);
        $betragBrutto = round((float) ($rechnung->get('betragBrutto') ?? 0), 2);
        $ustBetrag = round((float) ($rechnung->get('ustBetrag') ?? ($betragBrutto - $betragNetto)), 2);

        if ($betragNetto <= 0 || $betragBrutto <= 0) {
            return [
                'success' => false,
                'message' => 'Netto- und Bruttobetrag müssen größer als 0 sein.'
            ];
        }

        $gesetzOption13b = (bool) ($rechnung->get('gesetzOption13b') ?? false);
        $gesetzOption12 = (bool) ($rechnung->get('gesetzOption12') ?? false);

        if ($gesetzOption13b && $gesetzOption12) {
            return [
                'success' => false,
                'message' => '§ 13b und § 12 dürfen nicht gleichzeitig aktiviert sein.'
            ];
        }

        if ($gesetzOption12) {
            return [
                'success' => false,
                'message' => 'Rechnungen mit § 12 UStG sind in Phase 1 noch nicht für die Festschreibung freigegeben.'
            ];
        }

        // Это отдельная проверка für 13b:
        // в стартовой модели Phase 1 при 13b Brutto = Netto и USt = 0.
        if ($gesetzOption13b) {
            if (round($betragBrutto, 2) !== round($betragNetto, 2)) {
                return [
                    'success' => false,
                    'message' => 'Bei § 13b muss der Bruttobetrag dem Nettobetrag entsprechen.'
                ];
            }

            $ustBetrag = 0.0;
        }

        // Это проверка, что у счета есть хотя бы одна активная позиция.
        $positionCollection = $em
            ->getRDBRepository('CRechnungsposition')
            ->where([
                'rechnungId' => $id,
                'deleted' => false,
            ])
            ->find();

        if (!$positionCollection || !count($positionCollection)) {
            return [
                'success' => false,
                'message' => 'Die Rechnung enthält keine Positionen.'
            ];
        }

        // -----------------------------
        // 2) Steuerfall bestimmen
        // -----------------------------
        $steuerFall = $gesetzOption13b ? '13b' : 'normal';

        // -----------------------------
        // 3) Passende Buchungsregel suchen
        // -----------------------------
        // Это поиск подходящей Buchungsregel.
        $regelList = $em
            ->getRDBRepository('CBuchungsregel')
            ->where([
                'aktiv' => true,
                'phase1Verwendet' => true,
                'quelleTyp' => 'CRechnung',
                'dokumentTyp' => 'einzelrechnung',
                'steuerFall' => $steuerFall,
                'deleted' => false,
            ])
            ->find();

        if (!$regelList || !count($regelList)) {
            return [
                'success' => false,
                'message' => 'Keine passende Buchungsregel für diese Rechnung gefunden.'
            ];
        }

        if (count($regelList) > 1) {
            return [
                'success' => false,
                'message' => 'Mehrere passende Buchungsregeln gefunden.'
            ];
        }

        // Это получение связанных Konten из CBuchungsregel.
        $regel = $regelList[0];

        $debitKontoId = $regel->get('buchungsregelnDebitId');
        $erloesKontoId = $regel->get('buchungsregelnErloesId');
        $steuerKontoId = $regel->get('buchungsregelnSteuerId');

        $debitKonto = $debitKontoId ? $em->getEntity('CKonto', $debitKontoId) : null;
        $erloesKonto = $erloesKontoId ? $em->getEntity('CKonto', $erloesKontoId) : null;
        $steuerKonto = $steuerKontoId ? $em->getEntity('CKonto', $steuerKontoId) : null;

        if (!$debitKonto || !$erloesKonto) {
            return [
                'success' => false,
                'message' => 'Die Buchungsregel ist unvollständig.'
            ];
        }

        if ($steuerFall === 'normal' && !$steuerKonto) {
            return [
                'success' => false,
                'message' => 'Die Buchungsregel ist unvollständig.'
            ];
        }

        // -----------------------------
        // 4) Journalnummer erzeugen
        // -----------------------------
        // Это простая стартовая Journalnummer für Phase 1.
        $journalNummer = 'JRN-' . date('Ymd-His') . '-' . substr($rechnung->getId(), -6);

        // -----------------------------
        // 5) Buchungszeilen vorbereiten
        // -----------------------------
        // Сначала готовим данные, чтобы проверить баланс ДО записи в БД.
        $buchungenData = [];

        if ($steuerFall === 'normal') {
            // Forderung (Debit)
            $buchungenData[] = [
                'buchungsart' => 'debit',
                'betrag' => $betragBrutto,
                'kontoEntity' => $debitKonto,
                'buchungstext' => 'Forderung aus Rechnung ' . (string) $rechnung->get('rechnungsnummer'),
                'steuerFall' => 'normal',
            ];

            // Erlös (Credit)
            $buchungenData[] = [
                'buchungsart' => 'credit',
                'betrag' => $betragNetto,
                'kontoEntity' => $erloesKonto,
                'buchungstext' => 'Erlös aus Rechnung ' . (string) $rechnung->get('rechnungsnummer'),
                'steuerFall' => 'normal',
            ];

            // Umsatzsteuer (Credit)
            $buchungenData[] = [
                'buchungsart' => 'credit',
                'betrag' => $ustBetrag,
                'kontoEntity' => $steuerKonto,
                'buchungstext' => 'Umsatzsteuer aus Rechnung ' . (string) $rechnung->get('rechnungsnummer'),
                'steuerFall' => 'normal',
            ];
        }

        if ($steuerFall === '13b') {
            // Forderung (Debit)
            $buchungenData[] = [
                'buchungsart' => 'debit',
                'betrag' => $betragBrutto,
                'kontoEntity' => $debitKonto,
                'buchungstext' => 'Forderung aus Rechnung ' . (string) $rechnung->get('rechnungsnummer'),
                'steuerFall' => '13b',
            ];

            // Erlös 13b (Credit)
            $buchungenData[] = [
                'buchungsart' => 'credit',
                'betrag' => $betragNetto,
                'kontoEntity' => $erloesKonto,
                'buchungstext' => 'Erlös 13b aus Rechnung ' . (string) $rechnung->get('rechnungsnummer'),
                'steuerFall' => '13b',
            ];
        }

        // -----------------------------
        // 6) Balance prüfen
        // -----------------------------
        $sumDebit = 0.0;
        $sumCredit = 0.0;

        foreach ($buchungenData as $row) {
            if (($row['buchungsart'] ?? '') === 'debit') {
                $sumDebit += (float) $row['betrag'];
            } else {
                $sumCredit += (float) $row['betrag'];
            }
        }

        $sumDebit = round($sumDebit, 2);
        $sumCredit = round($sumCredit, 2);

        if ($sumDebit !== $sumCredit) {
            return [
                'success' => false,
                'message' => 'Die Buchung ist nicht ausgeglichen.'
            ];
        }

        // -----------------------------
        // 7) DB-Transaktion starten
        // -----------------------------
        // Это старт DB-транзакции для атомарной Festschreibung.
        // Открываем её только после всех fachlichen проверок.
        if (!$pdo->inTransaction()) {
            $pdo->beginTransaction();
        }

        // -----------------------------
        // 8) Buchungsjournal anlegen
        // -----------------------------
        $journal = $em->getNewEntity('CBuchungsjournal');

        $journal->set('name', $journalNummer);
        $journal->set('journalNummer', $journalNummer);
        $journal->set('belegdatum', $rechnung->get('belegdatum'));
        $journal->set('buchungstext', 'Festschreibung Rechnung ' . (string) $rechnung->get('rechnungsnummer'));
        $journal->set('quelleTyp', 'ausgangsrechnung');
        $journal->set('quelleIdExtern', $rechnung->getId());
        $journal->set('quelleNummer', $rechnung->get('rechnungsnummer'));
        $journal->set('buchhaltungStatus', 'festgeschrieben');
        $journal->set('phase1Verwendet', true);

        // Это связь Journal -> Rechnung.
        $journal->set('rechnungId', $rechnung->getId());
        $journal->set('rechnungName', $rechnung->get('rechnungsnummer'));

        $em->saveEntity($journal);

        if (!$journal->getId()) {
            throw new \RuntimeException('Buchungsjournal konnte nicht erstellt werden.');
        }

        // -----------------------------
        // 9) Buchungen anlegen
        // -----------------------------
        $createdCount = 0;

        foreach ($buchungenData as $row) {
            $kontoEntity = $row['kontoEntity'];

            $kontoNummer = '';
            $kontoBezeichnung = '';

            if ($kontoEntity) {
                $kontoNummer = (string) ($kontoEntity->get('kontonummer') ?? '');
                $kontoBezeichnung = (string) ($kontoEntity->get('bezeichnung') ?? '');
            }

            $buchung = $em->getNewEntity('CBuchung');

            $buchung->set('name', ($row['buchungsart'] === 'debit' ? 'Soll ' : 'Haben ') . $kontoNummer);
            $buchung->set('buchungsart', $row['buchungsart']);
            $buchung->set('betrag', round((float) $row['betrag'], 2));
            $buchung->set('kontoNummer', $kontoNummer);
            $buchung->set('kontoBezeichnung', $kontoBezeichnung);
            $buchung->set('buchungstext', $row['buchungstext']);
            $buchung->set('belegdatum', $rechnung->get('belegdatum'));
            $buchung->set('quelleTyp', 'ausgangsrechnung');
            $buchung->set('quelleIdExtern', $rechnung->getId());
            $buchung->set('quelleNummer', $rechnung->get('rechnungsnummer'));
            $buchung->set('steuerFall', $row['steuerFall']);
            $buchung->set('phase1Verwendet', true);

            // Это связи Buchung -> Journal / Regel.
            $buchung->set('buchungsjournalId', $journal->getId());
            $buchung->set('buchungsjournalName', $journal->get('journalNummer'));

            $buchung->set('buchungsregelId', $regel->getId());
            $buchung->set('buchungsregelName', $regel->get('name'));

            $em->saveEntity($buchung);
            $createdCount++;
        }

        if ($createdCount !== count($buchungenData)) {
            throw new \RuntimeException('Buchungszeilen konnten nicht vollständig erstellt werden.');
        }

        // -----------------------------
        // 10) Rechnung final festschreiben
        // -----------------------------
        $user = $this->getUser();

        // Это сохраняет вычисленные суммы обратно в Rechnung,
        // чтобы после Festschreibung ustBetrag не оставался NULL.
        $rechnung->set('betragNetto', $betragNetto);
        $rechnung->set('betragBrutto', $betragBrutto);
        $rechnung->set('ustBetrag', $ustBetrag);

        // Что это:
        // стартовый offener Restbetrag после первой Festschreibung Rechnung.
        //
        // Зачем:
        // в момент Festschreibung Rechnung уже бухгалтерски зафиксирован,
        // но ещё не оплачен, значит весь Bruttobetrag пока остаётся offen.
        $rechnung->set('restbetragOffen', $betragBrutto);

        // Что это:
        // стартовый operativer Zahlungsstatus Rechnung.
        //
        // Зачем:
        // после Festschreibung и до первой оплаты Rechnung должна считаться offen.
        $rechnung->set('status', 'offen');

        $rechnung->set('buchhaltungStatus', 'festgeschrieben');
        $rechnung->set('istFestgeschrieben', true);
        $rechnung->set('festgeschriebenAm', date('Y-m-d H:i:s'));

        if ($user) {
            $rechnung->set('festgeschriebeneRechnungenId', $user->getId());
            $rechnung->set('festgeschriebeneRechnungenName', $user->get('name'));
        }

        $em->saveEntity($rechnung);

        // -----------------------------
        // 11) Commit
        // -----------------------------
        // Это commit: только здесь Festschreibung считается окончательно завершённой.
        if ($pdo->inTransaction()) {
            $pdo->commit();
        }

        return [
            'success' => true,
            'message' => 'Rechnung wurde festgeschrieben und ins Buchungsjournal übernommen.',
            'id' => $rechnung->getId(),
            'buchhaltungStatus' => $rechnung->get('buchhaltungStatus'),
            'journalId' => $journal->getId(),
            'journalNummer' => $journal->get('journalNummer'),
            'buchungen' => $createdCount,
            'steuerFall' => $steuerFall,
        ];
    } catch (\Throwable $e) {
        // Это rollback: если что-то пошло не так, откатываем всю Festschreibung целиком.
        try {
            if (isset($pdo) && $pdo->inTransaction()) {
                $pdo->rollBack();
            }
        } catch (\Throwable $rollbackError) {
            $this->getContainer()->get('log')->error(
                'CRechnung::postActionFestschreiben rollback error: ' . $rollbackError->getMessage()
            );
        }

        $this->getContainer()->get('log')->error(
            'CRechnung::postActionFestschreiben error: ' . $e->getMessage()
        );

        return [
            'success' => false,
            'message' => 'Festschreibung konnte nicht abgeschlossen werden. Es wurden keine endgültigen Änderungen übernommen.'
        ];
    }
}
}
