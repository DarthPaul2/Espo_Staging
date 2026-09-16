<?php

namespace Espo\Custom\Hooks\CWartung;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

class CWartung
{
    public function __construct(private EntityManager $em) {}

    /**
     * Обрабатываем даты и статусы до сохранения записи.
     */
    public function beforeSave(Entity $entity, array $options = [])
    {
        // --- 0. Автогенерация Name, если пусто
        if (!$entity->get('name')) {
            $accountName = trim((string) $entity->get('accountName'));

            // Bei einem frisch erstellten Datensatz ist der denormalisierte
            // "accountName"-Cache noch leer (wird erst nach dem Speichern
            // über die Relation aufgefüllt) — direkt nachschlagen, damit der
            // Name nicht fälschlich auf "Ohne Firma" fällt.
            if (!$accountName && $entity->get('accountId')) {
                $account = $this->em->getEntity('Account', $entity->get('accountId'));
                $accountName = $account ? trim((string) $account->get('name')) : '';
            }

            $anlage = (string) $entity->get('anlageTyp');

            $labels = [
                'bma'     => 'BMA',
                'ema'     => 'EMA',
                'video'   => 'Video',
                'zutritt' => 'Zutritt',
                'other'   => 'Sonstiges',
            ];
            $anlageLabel = $labels[$anlage] ?? ucfirst($anlage ?: 'Wartung');

            $title = trim(($accountName ?: 'Ohne Firma') . " - " . $anlageLabel . " - Wartung");
            $entity->set('name', $title);
        }

        // --- 1. Проверяем наличие базовых полей
        $intervall     = $entity->get('intervall');
        $regelModus    = $entity->get('regelModus') ?? 'abLetzterWartung';
        $startDatum    = $entity->get('startDatum');
        $letzteWartung = $entity->get('letzteWartung');
        $status        = $entity->get('status');

        if (!$intervall || (!$startDatum && !$letzteWartung)) {
            if ($status === 'beendet') {
                $entity->set('faelligkeitsStatus', 'beendet');
            }
            return; // нечего считать
        }

        // --- 2. Рассчитываем следующую дату обслуживания ТОЛЬКО если она ещё не задана вручную.
        // Wichtig: das gilt UNABHÄNGIG vom Status — auch wenn "beendet" gerade gesetzt wird
        // (z. B. durch Task/WartungUpdate.php nach Abschluss eines Wartungsbesuchs), muss die
        // nächste fällige Wartung trotzdem korrekt (unter Beachtung von regelModus) berechnet
        // werden. Nur das faelligkeitsStatus-Label wird unten für "beendet" überschrieben.
        $naechste = $entity->get('naechsteWartung');

        if (empty($naechste)) {
            switch ($regelModus) {
                case 'abStartdatum':
                    $basis = new \DateTime($startDatum);
                    break;

                case 'abLetzterWartung':
                default:
                    $basis = $letzteWartung
                        ? new \DateTime($letzteWartung)
                        : new \DateTime($startDatum);
                    break;
            }

            switch ($intervall) {
                case 'monatlich':
                    $basis->modify('+1 month');
                    break;
                case 'quartal':
                    $basis->modify('+3 months');
                    break;
                case 'halbjaehrlich':
                    $basis->modify('+6 months');
                    break;
                case 'jaehrlich':
                    $basis->modify('+1 year');
                    break;
            }

            $naechste = $basis->format('Y-m-d');
            $entity->set('naechsteWartung', $naechste);
        }

        // --- 3. Bei "beendet" bleibt das Label immer "beendet", unabhängig vom Datum
        // (die Reaktivierung auf "aktiv" übernimmt wartung_check() im Flask-Cron).
        if ($status === 'beendet') {
            $entity->set('faelligkeitsStatus', 'beendet');
            return;
        }

        // --- 4. Определяем статус фаличности (по фактической naechsteWartung)
        if (empty($naechste)) {
            return;
        }

        $today    = new \DateTime();
        $due      = new \DateTime($naechste);
        $warnDays = (int) ($entity->get('vorwarnTage') ?? 30);

        $faelligkeitsStatus = 'nichtFaellig';

        if ($today > $due) {
            $faelligkeitsStatus = 'faellig';
        } else {
            $todayPlus = new \DateTime(); // ✅ отдельный объект, чтобы не менять $today
            if ($todayPlus->modify("+{$warnDays} days") >= $due) {
                $faelligkeitsStatus = 'baldFaellig';
            }
        }

        $entity->set('faelligkeitsStatus', $faelligkeitsStatus);
    }

    /**
     * Обновление после сохранения (если нужно логировать или делать что-то после изменений)
     */
    public function afterSave(Entity $entity, array $options = [])
    {
        // Здесь можно добавить логи или интеграцию (например, уведомление менеджера)
    }
}
