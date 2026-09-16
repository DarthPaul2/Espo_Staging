<?php

namespace Espo\Custom\Hooks\CStundenbericht;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

/**
 * Что это:
 * Bewegt den Status des verknüpften CServicevorgang vorwärts, wenn ein CStundenbericht
 * dazu gespeichert wird (15.09.2026, auf Pavels Wunsch — vorher änderte sich am
 * Servicevorgang-Status durch einen eingehenden Bericht gar nichts, obwohl das App-Sync
 * (siehe project_stundenbericht_app_sync) jetzt regelmäßig echte Berichte anlegt).
 *
 * Regel: NUR vorwärts, und NUR solange der Servicevorgang noch "früh" ist
 * (neu/geprueft/geplant/inArbeit). Ist er bereits bei rueckfrageMaterial oder weiter,
 * wird NICHTS automatisch angefasst — das ist dann eine bewusste Entscheidung des Büros,
 * die nicht überschrieben werden soll.
 *
 * - CStundenbericht.auftragAbgeschlossen = true      -> Servicevorgang.status = "abgeschlossen"
 * - sonst restarbeiten = true ODER neuerTermin = true -> "rueckfrageMaterial" (15.09.26, Pavel
 *   bestätigt — beides sind laut 9. Dokument Zitat 102 gleichwertige Gründe für einen
 *   offenen Punkt: "Material fehlt, Angebot erforderlich, zweiter Termin, ...")
 * - sonst                                             -> "inArbeit"
 */
class AdvanceServicevorgangStatus
{
    private const REIHENFOLGE = [
        'neu', 'geprueft', 'geplant', 'inArbeit', 'rueckfrageMaterial', 'abgeschlossen', 'abrechnungsfaehig',
    ];

    public function __construct(
        private EntityManager $entityManager
    ) {}

    public function afterSave(Entity $entity, array $options = []): void
    {
        $servicevorgangId = $entity->get('servicevorgangId');
        if (!$servicevorgangId) {
            return;
        }

        $servicevorgang = $this->entityManager->getEntityById('CServicevorgang', $servicevorgangId);
        if (!$servicevorgang) {
            return;
        }

        $aktuellerIndex = array_search((string) $servicevorgang->get('status'), self::REIHENFOLGE, true);
        $rueckfrageIndex = array_search('rueckfrageMaterial', self::REIHENFOLGE, true);

        if ($aktuellerIndex === false || $aktuellerIndex >= $rueckfrageIndex) {
            // Unbekannter Status oder schon weiter fortgeschritten -> nicht automatisch anfassen.
            return;
        }

        $zielStatus = match (true) {
            (bool) $entity->get('auftragAbgeschlossen') => 'abgeschlossen',
            (bool) $entity->get('restarbeiten') || (bool) $entity->get('neuerTermin') => 'rueckfrageMaterial',
            default => 'inArbeit',
        };
        $zielIndex = array_search($zielStatus, self::REIHENFOLGE, true);

        if ($zielIndex === false || $zielIndex <= $aktuellerIndex) {
            return;
        }

        $servicevorgang->set('status', $zielStatus);
        $this->entityManager->saveEntity($servicevorgang);
    }
}
