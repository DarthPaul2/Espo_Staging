<?php

namespace Espo\Custom\Hooks\CZahlung;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

/**
 * Что это:
 * AfterSave-Hook für CZahlung.
 *
 * Зачем:
 * Синхронизирует Abstimmungsstatus связанных CBankbewegung,
 * wenn eine Zahlung den fachlichen Status ändert.
 *
 * Wichtig:
 * Hook erzeugt keine Buchungen, keinen Ausgleich und keine Bankbewegung.
 * Er synchronisiert nur den Bankabstimmungsstatus.
 */
class AfterSave
{
    private EntityManager $entityManager;

    public function __construct(EntityManager $entityManager)
    {
        $this->entityManager = $entityManager;
    }

    public function afterSave(Entity $entity, array $options = []): void
    {
        $zahlungId = (string) $entity->get('id');

        if ($zahlungId === '') {
            return;
        }

        $status = (string) ($entity->get('status') ?? '');
        $istStorniert = (bool) ($entity->get('istStorniert') ?? false);

        $bankbewegungen = $this->entityManager
            ->getRDBRepository('CBankbewegung')
            ->where([
                'zahlungId' => $zahlungId,
            ])
            ->find();

        foreach ($bankbewegungen as $bankbewegung) {
            $this->syncBankbewegung($bankbewegung, $entity, $status, $istStorniert);
        }
    }

    /**
     * Что это:
     * Setzt den Abstimmungsstatus der Bankbewegung passend zur Zahlung.
     *
     * Зачем:
     * Bankbewegung soll zeigen, ob sie nur zugeordnet oder bereits
     * buchhalterisch über eine festgeschriebene Zahlung verarbeitet wurde.
     */
    private function syncBankbewegung(Entity $bankbewegung, Entity $zahlung, string $status, bool $istStorniert): void
    {
        $currentStatus = (string) ($bankbewegung->get('status') ?? '');
        $currentAbstimmung = (string) ($bankbewegung->get('abstimmungsstatus') ?? '');

        if ($currentStatus === 'ignoriert' || $currentAbstimmung === 'nicht_relevant') {
            return;
        }

        if ($istStorniert) {
            $bankbewegung->set('status', 'unklar');
            $bankbewegung->set('abstimmungsstatus', 'offen');
            $this->appendHinweis(
                $bankbewegung,
                'Verknüpfte Zahlung wurde storniert. Bankbewegung muss erneut geprüft werden.'
            );

            $this->entityManager->saveEntity($bankbewegung);
            return;
        }

        if ($status === 'festgeschrieben') {
            $bankbewegung->set('status', 'manuell_zugeordnet');
            $bankbewegung->set('abstimmungsstatus', 'gebucht');
            $this->appendHinweis(
                $bankbewegung,
                'Verknüpfte Zahlung ist festgeschrieben. Bankbewegung gilt als gebucht.'
            );

            $this->entityManager->saveEntity($bankbewegung);
            return;
        }

        if ($status === 'entwurf' || $status === 'freigabe') {
            $bankbewegung->set('status', 'manuell_zugeordnet');
            $bankbewegung->set('abstimmungsstatus', 'zugeordnet');

            $this->entityManager->saveEntity($bankbewegung);
        }
    }

    /**
     * Что это:
     * Ergänzt Zuordnungshinweis ohne alte Hinweise zu verlieren.
     *
     * Зачем:
     * Die Bankbewegung bleibt nachvollziehbar.
     */
    private function appendHinweis(Entity $bankbewegung, string $text): void
    {
        $old = trim((string) ($bankbewegung->get('zuordnungsHinweis') ?? ''));

        if ($old !== '' && str_contains($old, $text)) {
            return;
        }

        if ($old === '') {
            $bankbewegung->set('zuordnungsHinweis', $text);
            return;
        }

        $bankbewegung->set('zuordnungsHinweis', $old . "\n" . $text);
    }
}