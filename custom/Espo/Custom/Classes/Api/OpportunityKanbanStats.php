<?php

namespace Espo\Custom\Classes\Api;

use Espo\Core\Acl;
use Espo\Core\Api\Action;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Api\ResponseComposer;
use Espo\Core\Exceptions\Forbidden;
use Espo\ORM\EntityManager;

/**
 * Wunsch von Bianca Rally (04.09.2026): über jeder Kanban-Spalte der Verkaufschancen soll die
 * Anzahl der enthaltenen Chancen und deren Summe (€) stehen. Liefert je Stufe (stage) Anzahl +
 * Summe über ALLE Datensätze dieser Stufe (nicht nur die aktuell auf der Kanban-Seite geladenen,
 * dort wird ja paginiert — deshalb ein eigener, schneller Aggregations-Endpoint statt das im
 * Frontend aus den geladenen Karten zu berechnen).
 */
class OpportunityKanbanStats implements Action
{
    public function __construct(
        private EntityManager $entityManager,
        private Acl $acl
    ) {}

    public function process(Request $request): Response
    {
        if (!$this->acl->checkScope('Opportunity')) {
            throw new Forbidden();
        }

        $pdo = $this->entityManager->getPDO();

        $sql = "
            SELECT stage, COUNT(*) AS anzahl, COALESCE(SUM(amount), 0) AS summe
            FROM opportunity
            WHERE deleted = 0
            GROUP BY stage
        ";

        $rows = $pdo->query($sql)->fetchAll(\PDO::FETCH_ASSOC) ?: [];

        $ergebnis = [];

        foreach ($rows as $row) {
            $ergebnis[$row['stage']] = [
                'anzahl' => (int) $row['anzahl'],
                'summe' => (float) $row['summe'],
            ];
        }

        return ResponseComposer::json($ergebnis);
    }
}
