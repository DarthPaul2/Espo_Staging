<?php
namespace Espo\Custom\Hooks\CEingangsrechnungImportPosition;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

class RecalculateImportTotals
{
    public function __construct(private EntityManager $em) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        // Что это: серверный пересчёт суммы строки.
        // Зачем: relation-panel должен видеть реально сохранённое gesamtNetto из БД.
        $menge = $entity->get('menge');
        $einzelpreisNetto = $entity->get('einzelpreisNetto');
        $rabattProzent = $entity->get('rabattProzent');

        if ($menge !== null && $einzelpreisNetto !== null) {
            $menge = (float)$menge;
            $einzelpreisNetto = (float)$einzelpreisNetto;
            $rabattProzent = $rabattProzent !== null ? (float)$rabattProzent : 0.0;

            if ($rabattProzent < 0) {
                $rabattProzent = 0.0;
            }

            $zeilenNettoVorRabatt = $menge * $einzelpreisNetto;
            $rabattBetrag = round($zeilenNettoVorRabatt * $rabattProzent / 100, 2);
            $gesamtNetto = round($zeilenNettoVorRabatt - $rabattBetrag, 2);

            $entity->set('rabattBetrag', $rabattBetrag);
            $entity->set('gesamtNetto', $gesamtNetto);
        }
    }

    public function afterSave(Entity $entity, array $options = []): void
    {
        $this->recalculateParentImport($entity);
    }

    public function afterRemove(Entity $entity, array $options = []): void
    {
        $this->recalculateParentImport($entity);
    }

    private function recalculateParentImport(Entity $entity): void
    {
        $importId = $entity->get('eingangsrechnungImportId');

        if (!$importId) {
            return;
        }

        $import = $this->em->getEntityById('CEingangsrechnungImport', $importId);

        if (!$import) {
            return;
        }

        $rows = $this->em
            ->getRDBRepository('CEingangsrechnungImportPosition')
            ->where(['eingangsrechnungImportId' => $importId])
            ->find();

        $netto = 0.0;

        foreach ($rows as $row) {
            $gesamtNetto = $row->get('gesamtNetto');

            if ($gesamtNetto !== null) {
                $netto += (float)$gesamtNetto;
            }
        }

        $netto = round($netto, 2);

        $steuerfall = (string)($import->get('steuerfall') ?? 'unbekannt');

        $steuer = 0.0;

        if ($steuerfall === 'ust19') {
            $steuer = round($netto * 0.19, 2);
        } elseif ($steuerfall === 'ust7') {
            $steuer = round($netto * 0.07, 2);
        } elseif ($steuerfall === 'steuerfrei' || $steuerfall === 'unbekannt') {
            $steuer = 0.0;
        }

        $brutto = round($netto + $steuer, 2);

        $import->set('betragNetto', $netto);
        $import->set('steuerBetrag', $steuer);
        $import->set('betragBrutto', $brutto);

        $this->em->saveEntity($import);
    }
}