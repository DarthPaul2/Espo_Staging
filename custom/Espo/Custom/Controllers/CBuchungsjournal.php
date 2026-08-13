<?php

namespace Espo\Custom\Controllers;

use Espo\Core\Templates\Controllers\Base;

class CBuchungsjournal extends Base
{
    use \Espo\Custom\Traits\HasEntityManagerCompat;

    /**
     * Что это:
     * SQL-отчёт по сторнированным Kontenbewegungen.
     *
     * Зачем:
     * Берём данные напрямую из c_buchung + c_buchungsjournal,
     * чтобы стабильно видеть именно storno-проводки,
     * без старых проблем с выборкой через collection.
     */
    public function getActionStornierteKontenbewegungenReport($params, $data, $request)
    {
        $this->acl->check('CBuchungsjournal', 'read');

        $em = $this->getEntityManager();
        $pdo = $em->getPDO();

        $von = $request->getQueryParam('von');
        $bis = $request->getQueryParam('bis');

        $where = "
            b.deleted = 0
            AND COALESCE(b.ist_storno, 0) = 1
            AND j.deleted = 0
            AND COALESCE(j.ist_storno, 0) = 1
        ";

        $bind = [];

        if ($von) {
            $where .= " AND b.belegdatum >= :von ";
            $bind['von'] = $von;
        }

        if ($bis) {
            $where .= " AND b.belegdatum <= :bis ";
            $bind['bis'] = $bis;
        }

        $sql = "
            SELECT
                b.id,
                b.name,
                b.belegdatum,
                b.buchungsart,
                b.betrag,
                b.konto_nummer AS kontoNummer,
                b.konto_bezeichnung AS kontoBezeichnung,
                b.buchungstext,
                b.quelle_typ AS quelleTyp,
                b.quelle_id_extern AS quelleIdExtern,
                b.quelle_nummer AS quelleNummer,
                b.buchungsjournal_id AS buchungsjournalId,
                j.journal_nummer AS journalNummer,
                j.storno_grund AS stornoGrund,
                j.created_at AS storniertAm
            FROM c_buchung b
            INNER JOIN c_buchungsjournal j
                ON j.id = b.buchungsjournal_id
            WHERE {$where}
            ORDER BY b.belegdatum DESC, j.created_at DESC, b.created_at DESC, b.id DESC
        ";

        try {
            $sth = $pdo->prepare($sql);
            $sth->execute($bind);

            $rows = $sth->fetchAll(\PDO::FETCH_ASSOC) ?: [];

            foreach ($rows as &$row) {
                $row['betrag'] = (float) ($row['betrag'] ?? 0);
            }

            return $rows;
        } catch (\Throwable $e) {
            $GLOBALS['log']->error(
                'CBuchungsjournal::getActionStornierteKontenbewegungenReport error: ' . $e->getMessage()
            );

            return [
                'success' => false,
                'error' => 'SQL error in stornierteKontenbewegungenReport',
            ];
        }
    }

        /**
     * Что это:
     * SQL-отчёт по сторнированным Journalen.
     *
     * Зачем:
     * Берём данные напрямую из c_buchungsjournal + c_buchung,
     * чтобы стабильно видеть именно Storno-Journale,
     * без старых проблем с выборкой через collection.
     */
    public function getActionStornierteJournaleReport($params, $data, $request)
    {
        $this->acl->check('CBuchungsjournal', 'read');

        $em = $this->getEntityManager();
        $pdo = $em->getPDO();

        $von = $request->getQueryParam('von');
        $bis = $request->getQueryParam('bis');

        $where = "
            j.deleted = 0
            AND COALESCE(j.ist_storno, 0) = 1
        ";

        $bind = [];

        if ($von) {
            $where .= " AND j.created_at >= :von ";
            $bind['von'] = $von . ' 00:00:00';
        }

        if ($bis) {
            $where .= " AND j.created_at <= :bis ";
            $bind['bis'] = $bis . ' 23:59:59';
        }

        $sql = "
            SELECT
                j.id,
                j.name,
                j.journal_nummer AS journalNummer,
                j.belegdatum,
                j.buchungstext,
                j.quelle_typ AS quelleTyp,
                j.quelle_id_extern AS quelleIdExtern,
                j.quelle_nummer AS quelleNummer,
                j.buchhaltung_status AS buchhaltungStatus,
                j.storno_grund AS stornoGrund,
                j.created_at AS storniertAm,
                COUNT(b.id) AS anzahlBuchungen,
                SUM(CASE WHEN b.buchungsart = 'debit' THEN b.betrag ELSE 0 END) AS sumSoll,
                SUM(CASE WHEN b.buchungsart = 'credit' THEN b.betrag ELSE 0 END) AS sumHaben
            FROM c_buchungsjournal j
            LEFT JOIN c_buchung b
                ON b.buchungsjournal_id = j.id
                AND b.deleted = 0
            WHERE {$where}
            GROUP BY
                j.id,
                j.name,
                j.journal_nummer,
                j.belegdatum,
                j.buchungstext,
                j.quelle_typ,
                j.quelle_id_extern,
                j.quelle_nummer,
                j.buchhaltung_status,
                j.storno_grund,
                j.created_at
            ORDER BY j.created_at DESC, j.id DESC
        ";

        try {
            $sth = $pdo->prepare($sql);
            $sth->execute($bind);

            $rows = $sth->fetchAll(\PDO::FETCH_ASSOC) ?: [];

            foreach ($rows as &$row) {
                $row['anzahlBuchungen'] = (int) ($row['anzahlBuchungen'] ?? 0);
                $row['sumSoll'] = (float) ($row['sumSoll'] ?? 0);
                $row['sumHaben'] = (float) ($row['sumHaben'] ?? 0);
            }

            return $rows;
        } catch (\Throwable $e) {
            $GLOBALS['log']->error(
                'CBuchungsjournal::getActionStornierteJournaleReport error: ' . $e->getMessage()
            );

            return [
                'success' => false,
                'error' => 'SQL error in stornierteJournaleReport',
            ];
        }
    }
}