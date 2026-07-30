<?php

namespace Espo\Custom\Hooks\CRechnung;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Exceptions\BadRequest;

/**
 * Что это:
 * запрещает обычное редактирование уже festgeschriebene Rechnung.
 *
 * Зачем:
 * бухгалтерское содержание Rechnung после Festschreibung нельзя менять,
 * но служебные изменения для Zahlung, Storno и Mahnwesen должны оставаться возможны.
 */
class PreventEditAfterFestschreibung
{
    public function __construct(
        private EntityManager $entityManager
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        // Что это:
        // разрешение для внутренних служебных сохранений.
        //
        // Зачем:
        // Phase 3/4/5 используют это для Zahlung, Ausgleich, Storno
        // и других kontrollierten Systemaktionen.
        if (!empty($options['allowFestgeschriebenSave'])) {
            return;
        }

        // Это защита только для уже существующих записей.
        if (!$entity->getId()) {
            return;
        }

        // Это текущее состояние счета в базе ДО нового сохранения.
        $stored = $this->entityManager->getEntity('CRechnung', $entity->getId());
        if (!$stored) {
            return;
        }

        $alreadyFestgeschrieben = (bool) ($stored->get('istFestgeschrieben') ?? false);
        if (!$alreadyFestgeschrieben) {
            return;
        }

        // Что это:
        // специальное узкое разрешение für das Nachtragen des Stornobeleg-PDFs.
        //
        // Зачем:
        // der Stornobeleg wird asynchron (nach dem Stornieren) vom Flask-Backend
        // erzeugt und die URL per API zurückgeschrieben. Alle anderen Felder
        // bleiben nach Festschreibung geschützt.
        if (
            $entity->isAttributeChanged('stornobelegUrl')
            && $stored->get('istStorniert')
        ) {
            $onlyStornobelegUrlChanged = true;
            $technicalFields = ['stornobelegUrl', 'modifiedAt', 'modifiedById', 'modifiedByName'];

            foreach ($entity->getAttributeList() as $field) {
                if (in_array($field, $technicalFields, true)) {
                    continue;
                }
                if ($entity->isAttributeChanged($field)) {
                    $onlyStornobelegUrlChanged = false;
                    break;
                }
            }

            if ($onlyStornobelegUrlChanged) {
                return;
            }
        }

        // Что это:
        // специальное узкое разрешение для Mahnwesen.
        //
        // Зачем:
        // automatische Mahnung-Logik darf bei festgeschriebener Rechnung
        // nur Mahnstufe und letzteMahnungAm ändern.
        // Все бухгалтерские поля Rechnung остаются защищены.
        $oldMahnstufe = $stored->get('mahnstufe');
        $newMahnstufe = $entity->get('mahnstufe');

        $oldLetzteMahnungAm = $stored->get('letzteMahnungAm');
        $newLetzteMahnungAm = $entity->get('letzteMahnungAm');

        $mahnungFieldsChanged =
            $oldMahnstufe !== $newMahnstufe ||
            $oldLetzteMahnungAm !== $newLetzteMahnungAm;

        if ($mahnungFieldsChanged) {
            $protectedFields = [
                'name',
                'description',
                'rechnungsnummer',
                'einleitung',
                'bemerkung',
                'betragNetto',
                'betragBrutto',
                'ustBetrag',
                'faelligAm',
                'leistungsdatumVon',
                'leistungsdatumBis',
                'gesetzOption13b',
                'gesetzOption12',
                'accountId',
                'angebotId',
                'status',
                'serviceNummer',
                'pdfUrl',
                'sachbearbeiter',
                'bemerkungVorlage',
                'auftragId',
                'mahnregelId',
                'rechnungstyp',
                'bezahltAm',
                'objektId',
                'contactId',
                'belegdatum',
                'buchhaltungStatus',
                'freigabeAm',
                'festgeschriebenAm',
                'istFestgeschrieben',
                'festschreibungHinweis',
                'freigegebeneRechnungenId',
                'festgeschriebeneRechnungenId',
                'istTest',
                'restbetragOffen',
                'istStorniert',
                'storniertAm',
                'stornoGrund',
                'storniertVonId',
                'istKorrekturbeleg',
                'korrekturTyp',
                'korrekturGrund',
                'ersetztBelegId',
                'ersetztBelegName',
                'nachfolgeBelegId',
                'nachfolgeBelegName',
                'assignedUserId',
            ];

            $onlyMahnwesenChanged = true;

            foreach ($protectedFields as $field) {
                if ($stored->get($field) !== $entity->get($field)) {
                    $onlyMahnwesenChanged = false;
                    break;
                }
            }

            if ($onlyMahnwesenChanged) {
                return;
            }
        }

        // Это жесткий запрет обычного редактирования.
        throw new BadRequest(
            'Festgeschriebene Rechnungen dürfen nicht mehr bearbeitet werden.'
        );
    }
}