<?php

namespace Espo\Custom\Hooks\Opportunity;

use Espo\ORM\Entity;

/**
 * Wunsch von Bianca Rally (KUG-Wertschöpfungsprozess, 29.08.2026): automatisch dokumentieren,
 * wann eine Chance jede Stufe erreicht UND wann sie diese wieder verlassen hat. Nach dem Muster
 * von CRechnung/SetBezahltAm.php — bei jedem Wechsel wird das jeweilige Datum gesetzt, sofern es
 * noch leer ist. Manuell gesetzte Werte werden nie überschrieben. "bestandskunde" ist Endstufe
 * ohne eigenes Verlassen-Datum (kein "Danach" in diesem Prozess vorgesehen).
 */
class StageDatesTracker
{
    private const ERREICHT_FELD_MAP = [
        'adresseNeu' => 'stufeAdresseAm',
        'kontaktOffen' => 'stufeKontaktAm',
        'interessentAngebotAngefordert' => 'stufeInteressentAngebotAngefordertAm',
        'interessentAngebotInErstellung' => 'stufeInteressentAngebotInErstellungAm',
        'kaeuferAngebotErhalten' => 'stufeKaeuferAngebotErhaltenAm',
        'kundeInDisposition' => 'stufeKundeInDispositionAm',
        'kundeLeistungserbringung' => 'stufeKundeLeistungserbringungAm',
        'bestandskunde' => 'stufeBestandskundeAm',
    ];

    private const VERLASSEN_FELD_MAP = [
        'adresseNeu' => 'stufeAdresseVerlassenAm',
        'kontaktOffen' => 'stufeKontaktVerlassenAm',
        'interessentAngebotAngefordert' => 'stufeInteressentAngebotAngefordertVerlassenAm',
        'interessentAngebotInErstellung' => 'stufeInteressentAngebotInErstellungVerlassenAm',
        'kaeuferAngebotErhalten' => 'stufeKaeuferAngebotErhaltenVerlassenAm',
        'kundeInDisposition' => 'stufeKundeInDispositionVerlassenAm',
        'kundeLeistungserbringung' => 'stufeKundeLeistungserbringungVerlassenAm',
        // 'bestandskunde' bewusst nicht drin — Endstufe, kein Verlassen vorgesehen.
    ];

    public function beforeSave(Entity $entity, array $options = []): void
    {
        $stage = (string) $entity->get('stage');
        $oldStage = (string) $entity->getFetched('stage');

        if ($stage === $oldStage) {
            return;
        }

        $heute = (new \DateTimeImmutable('now', new \DateTimeZone('Europe/Berlin')))->format('Y-m-d');

        // Alte Stufe als verlassen markieren (nur bei echtem Stufenwechsel eines bereits
        // existierenden Datensatzes — bei Neuanlage ist oldStage leer, nichts zu verlassen).
        if ($oldStage !== '') {
            $verlassenFeld = self::VERLASSEN_FELD_MAP[$oldStage] ?? null;

            if ($verlassenFeld && empty($entity->get($verlassenFeld))) {
                $entity->set($verlassenFeld, $heute);
            }
        }

        // Neue Stufe als erreicht markieren.
        $erreichtFeld = self::ERREICHT_FELD_MAP[$stage] ?? null;

        if ($erreichtFeld && empty($entity->get($erreichtFeld))) {
            $entity->set($erreichtFeld, $heute);
        }
    }
}
