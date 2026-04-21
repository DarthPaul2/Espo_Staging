<?php

namespace Espo\Custom\Hooks\CRechnung;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Utils\Log;

class UpdateAuftragStatusOnSchlussrechnungPayment
{
    private EntityManager $em;
    private Log $log;

    public function __construct(EntityManager $em, Log $log)
    {
        $this->em = $em;
        $this->log = $log;
    }

    /**
     * Это hook: автоматически закрывает Auftrag,
     * если Schlussrechnung vollständig bezahlt ist.
     *
     * Зачем:
     * чтобы Auftrag не закрывался от любой оплаты,
     * а только от действительно закрытой Schlussrechnung.
     */
    public function afterSave(Entity $entity, array $options = []): void
    {
        try {
            if ($entity->get('deleted')) {
                return;
            }

            $rechnungstyp = strtolower(trim((string) ($entity->get('rechnungstyp') ?? '')));
            if ($rechnungstyp !== 'schlussrechnung') {
                return;
            }

            $auftragId = (string) ($entity->get('auftragId') ?? '');
            if (!$auftragId) {
                return;
            }

            $buchhaltungStatus = strtolower(trim((string) ($entity->get('buchhaltungStatus') ?? '')));
            $status = strtolower(trim((string) ($entity->get('status') ?? '')));
            $restbetragOffen = round((float) ($entity->get('restbetragOffen') ?? 0), 2);

            // Schlussrechnung muss wirklich festgeschrieben sein
            if ($buchhaltungStatus !== 'festgeschrieben') {
                return;
            }

            // Auftrag schließen только если Schlussrechnung реально полностью оплачена
            if ($status !== 'bezahlt') {
                return;
            }

            if ($restbetragOffen > 0.0) {
                return;
            }

            $auftrag = $this->em->getEntity('CAuftrag', $auftragId);
            if (!$auftrag || $auftrag->get('deleted')) {
                return;
            }

            $auftragStatus = strtolower(trim((string) ($auftrag->get('status') ?? '')));
            if ($auftragStatus === 'abgeschlossen') {
                return;
            }

            $auftrag->set('status', 'abgeschlossen');
            $this->em->saveEntity($auftrag);

            $this->log->info(
                'UpdateAuftragStatusOnSchlussrechnungPayment: Auftrag ' . $auftragId .
                ' wurde automatisch auf abgeschlossen gesetzt. Schlussrechnung=' . $entity->getId()
            );
        } catch (\Throwable $e) {
            $this->log->error(
                'UpdateAuftragStatusOnSchlussrechnungPayment error: ' . $e->getMessage()
            );
        }
    }
}