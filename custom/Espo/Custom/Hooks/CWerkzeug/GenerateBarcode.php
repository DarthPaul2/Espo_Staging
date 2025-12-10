<?php

namespace Espo\Custom\Hooks\CWerkzeug;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

class GenerateBarcode
{
    private EntityManager $em;

    public function __construct(EntityManager $em)
    {
        $this->em = $em;
    }

    public function beforeSave(Entity $entity, array $options = []): void
    {
        // Только для новых записей
        if (!$entity->isNew()) {
            return;
        }

        // Если штрихкод уже заполнен вручную – не трогаем
        if ($entity->get('barcode')) {
            return;
        }

        // --- Категория → 2-значный код (как у материалов, но под Werkzeug) ---
        $cat = (string) $entity->get('kategorie');

        $map = [
            'Werkzeug'         => '90',
            'Maschine'         => '91',
            'Prüfgerät'        => '92',
            'Fahrzeug-Zubehör' => '93',
            'Sonstiges'        => '94',
        ];

        $categoryCode = $map[$cat] ?? '94';

        // --- Ищем следующий внутренний счётчик в существующих баркодах ---
        // Шаблон: 481 CC IIIII 24 X  (как у материалов: префикс/категория/счётчик/серия/контрольная)
        $pdo = $this->em->getPDO();

        $stmt = $pdo->query("
            SELECT MAX(CAST(SUBSTRING(barcode, 7, 5) AS UNSIGNED))
            FROM c_werkzeug
            WHERE deleted = 0
              AND barcode REGEXP '^481[0-9]{2}[0-9]{5}24[0-9]$'
        ");

        $maxSeq = (int) $stmt->fetchColumn();
        $seq    = $maxSeq + 1;

        // 5-значный счётчик
        $idStr = str_pad((string) $seq, 5, '0', STR_PAD_LEFT);

        // 12-значная основа EAN-13
        $base = '481' . $categoryCode . $idStr . '24';   // 3 + 2 + 5 + 2 = 12

        $checkDigit = $this->calculateEan13CheckDigit($base);

        $entity->set('barcode', $base . $checkDigit);
    }

    private function calculateEan13CheckDigit(string $number): string
    {
        $sum = 0;
        $len = strlen($number);

        for ($i = 0; $i < $len; $i++) {
            $digit = (int) $number[$i];
            $sum  += ($i % 2 === 0) ? $digit : $digit * 3;
        }

        return (string) ((10 - ($sum % 10)) % 10);
    }
}
