<?php

namespace Espo\Custom\Hooks\CEingangsrechnung;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Exceptions\Forbidden;

// Зачем:
// Предотвращает сохранение счёта, если в базе уже есть незаменённый (не сторнированный)
// Eingangsrechnung с тем же Lieferant + Lieferantenrechnungsnummer + Belegdatum + Betrag Brutto.
class CheckDuplicates
{
    public function __construct(
        private EntityManager $entityManager
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        if (!empty($options['skipDuplicateCheck'])) {
            return;
        }

        $lieferantId      = (string) ($entity->get('lieferantId') ?? '');
        $lieferantenNr    = trim((string) ($entity->get('lieferantenRechnungsnummer') ?? ''));
        $belegdatum       = $entity->get('belegdatum');
        $betragBrutto     = $entity->get('betragBrutto');

        // Проверяем только если все четыре ключевых поля заполнены.
        if ($lieferantId === '' || $lieferantenNr === '' || $belegdatum === null || $betragBrutto === null) {
            return;
        }

        $betragRounded = round((float) $betragBrutto, 2);

        $pdo = $this->entityManager->getPDO();

        $excludeClause = '';
        $params = [
            ':lieferantId'   => $lieferantId,
            ':lieferantenNr' => $lieferantenNr,
            ':belegdatum'    => $belegdatum,
            ':betragBrutto'  => $betragRounded,
        ];

        // При редактировании исключаем текущую запись из поиска.
        if (!$entity->isNew() && $entity->getId()) {
            $excludeClause = 'AND id != :currentId';
            $params[':currentId'] = (string) $entity->getId();
        }

        $sql = "
            SELECT id, eingangsrechnungsnummer
            FROM c_eingangsrechnung
            WHERE deleted = 0
              AND (ist_storniert = 0 OR ist_storniert IS NULL)
              AND lieferant_id = :lieferantId
              AND lieferanten_rechnungsnummer = :lieferantenNr
              AND belegdatum = :belegdatum
              AND ROUND(betrag_brutto, 2) = :betragBrutto
              $excludeClause
            LIMIT 1
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $duplicate = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$duplicate) {
            return;
        }

        $nr = !empty($duplicate['eingangsrechnungsnummer'])
            ? $duplicate['eingangsrechnungsnummer']
            : $duplicate['id'];

        throw new Forbidden(
            'Es existiert bereits ein Eingangsrechnungs-Datensatz mit identischen Daten '
            . '(Lieferant, Rechnungsnummer, Belegdatum, Betrag Brutto): ' . $nr . '. '
            . 'Bitte prüfen Sie, ob die Rechnung bereits erfasst wurde.'
        );
    }
}
