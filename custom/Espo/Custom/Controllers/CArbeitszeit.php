<?php
namespace Espo\Custom\Controllers;

use Espo\Core\Templates\Controllers\Base;     // шаблонный базовый контроллер (даёт стандартные CRUD)
use Espo\Core\Api\Request;                    // сюда приходит query string

class CArbeitszeit extends Base
{
    public function actionGetMonatsstatistik(array $params, $data, Request $request)
    {
        $q = $request->getQueryParams();  // <-- вот здесь берём параметры

        $technikerId = $q['technikerId'] ?? null;
        $month       = $q['month'] ?? null;
        $year        = $q['year'] ?? null;

        if (!$technikerId || !$month || !$year) {
            throw new \Espo\Core\Exceptions\BadRequest('Fehlende Parameter');
        }

        $pdo = $this->getEntityManager()->getPDO();

        $sql = "
            SELECT 
                DATE(startzeit) AS datum,
                TIME(startzeit) AS startzeit,
                TIME(endzeit)   AS endzeit,
                dauerminuten    AS dauer,
                nettominuten    AS netto,
                ueberstundenminuten AS ueberstunden,
                feiertagwochenende  AS wochenende
            FROM c_arbeitszeit
            WHERE 
                deleted = 0
                AND techniker_id = :tid
                AND MONTH(startzeit) = :m
                AND YEAR(startzeit)  = :y
            ORDER BY startzeit ASC
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'tid' => $technikerId,
            'm'   => (int) $month,
            'y'   => (int) $year,
        ]);

        return [
            'success' => true,
            'rows'    => $stmt->fetchAll(\PDO::FETCH_ASSOC),
        ];
    }

    public function actionGetJahresstatistik(array $params, $data, Request $request)
    {
        $q = $request->getQueryParams();

        $technikerId = $q['technikerId'] ?? null;
        $year        = $q['year'] ?? null;

        if (!$technikerId || !$year) {
            throw new \Espo\Core\Exceptions\BadRequest('Fehlende Parameter');
        }

        $pdo = $this->getEntityManager()->getPDO();

        $sql = "
            SELECT 
                MONTH(startzeit) AS monat,
                SUM(dauerminuten) AS summeDauer,
                SUM(nettominuten) AS summeNetto,
                SUM(ueberstundenminuten) AS summeUeberstunden,
                SUM( CASE WHEN feiertagwochenende = 1 THEN nettominuten ELSE 0 END ) AS summeFeiertagWochenende
            FROM c_arbeitszeit
            WHERE 
                deleted = 0
                AND techniker_id = :tid
                AND YEAR(startzeit) = :y
            GROUP BY MONTH(startzeit)
            ORDER BY monat ASC
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'tid' => $technikerId,
            'y'   => (int) $year,
        ]);

        return [
            'success' => true,
            'rows'    => $stmt->fetchAll(\PDO::FETCH_ASSOC),
        ];
    }
}
