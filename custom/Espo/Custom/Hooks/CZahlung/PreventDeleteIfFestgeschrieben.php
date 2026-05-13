<?php

namespace Espo\Custom\Hooks\CZahlung;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Utils\Log;

// Что это:
// запрещает удаление festgeschriebene Zahlung
// и одновременно чистит связанные Ausgleich у не-festgeschriebene Zahlung.
//
// Зачем:
// 1. festgeschriebene Zahlung нельзя удалять обычным способом;
// 2. если удаляется черновая/нефинальная Zahlung, её CAusgleich не должны оставаться активными.
class PreventDeleteIfFestgeschrieben
{
    public function __construct(
        private EntityManager $entityManager,
        private Log $log
    ) {}

    public function beforeRemove(Entity $entity, array $options = []): void
    {
        $status = strtolower((string) ($entity->get('status') ?? ''));
        $zahlungId = $entity->getId();

        if (!$zahlungId) {
            return;
        }

        // 1) Festgeschriebene Zahlung löschen запрещено
        if ($status === 'festgeschrieben') {
            throw new Forbidden('Festgeschriebene Zahlungen dürfen nicht gelöscht werden.');
        }

        // 2) Если Zahlung ещё НЕ festgeschrieben, то перед удалением
        //    деактивируем и soft-delete все связанные Ausgleich
        $ausgleichList = $this->entityManager
            ->getRDBRepository('CAusgleich')
            ->where([
                'zahlungId' => $zahlungId,
                'deleted' => false,
            ])
            ->find();

        foreach ($ausgleichList as $ausgleich) {
            $ausgleich->set('istAktiv', false);
            $ausgleich->set('deleted', true);

            // Что это:
            // служебное сохранение Ausgleich перед удалением Zahlung.
            $this->entityManager->saveEntity($ausgleich);
        }

        $this->log->info(
            '[PreventDeleteIfFestgeschrieben] Ausgleiche deaktiviert vor Zahlung-Löschung. zahlungId='
            . $zahlungId
            . ', count=' . count($ausgleichList)
        );

        // Что это:
        // Если удаляется не-festgeschriebene Zahlung, очищаем связь у Bankbewegungen.
        //
        // Зачем:
        // Иначе CBankbewegung.zahlungId остаётся ссылаться на уже удалённую CZahlung,
        // и повторное "Zahlung vorbereiten" будет ошибочно блокироваться.
        $bankbewegungList = $this->entityManager
            ->getRDBRepository('CBankbewegung')
            ->where([
                'zahlungId' => $zahlungId,
                'deleted' => false,
            ])
            ->find();

        foreach ($bankbewegungList as $bankbewegung) {
            $oldHinweis = trim((string) ($bankbewegung->get('zuordnungsHinweis') ?? ''));

            $newHinweis = 'Verknüpfte Entwurf-/Freigabe-Zahlung wurde gelöscht. Bankbewegung muss erneut geprüft werden.';

            if ($oldHinweis !== '' && !str_contains($oldHinweis, $newHinweis)) {
                $newHinweis = $oldHinweis . "\n" . $newHinweis;
            } elseif ($oldHinweis !== '' && str_contains($oldHinweis, $newHinweis)) {
                $newHinweis = $oldHinweis;
            }

            $bankbewegung->set('zahlungId', null);
            $bankbewegung->set('status', 'unklar');
            $bankbewegung->set('abstimmungsstatus', 'offen');
            $bankbewegung->set('zuordnungsHinweis', $newHinweis);

            // Что это:
            // Служебное сохранение Bankbewegung nach Zahlung-Löschung.
            //
            // Зачем:
            // Bankbewegung bleibt real vorhanden und soll wieder in Arbeitslisten erscheinen.
            $this->entityManager->saveEntity($bankbewegung, [
                'skipBankbewegungZuordnungsStatus' => true,
            ]);
        }

        $this->log->info(
            '[PreventDeleteIfFestgeschrieben] Bankbewegungen von gelöschter Zahlung getrennt. zahlungId='
            . $zahlungId
            . ', count=' . count($bankbewegungList)
        );
    }
}