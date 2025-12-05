<?php

namespace Espo\Custom\Hooks\CMaterial;

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
        if (!$entity->isNew()) {
            return;
        }

        if ($entity->get('barcode')) {
            return;
        }

        // Категория
        $category = (string) ($entity->get('kategorie') ?: '99');
        $category = preg_replace('/\D/', '', $category) ?: '99';
        $category = str_pad($category, 2, '0', STR_PAD_LEFT);

        // --------------------------------------------
        // ✔ Быстрый SQL через официальное API Espo
        // --------------------------------------------
        $pdo = $this->em->getPDO();

        // barcode_id
        $stmt = $pdo->query(
            "SELECT MAX(barcode_id) 
             FROM c_material 
             WHERE deleted = 0"
        );
        $maxBarcodeId = (int) $stmt->fetchColumn();
        $barcodeId = $maxBarcodeId + 1;

        // проверка уникальности (SQL быстро)
        while (true) {
            $check = $pdo->prepare(
                "SELECT id FROM c_material 
                 WHERE barcode_id = ? AND deleted = 0 
                 LIMIT 1"
            );
            $check->execute([$barcodeId]);

            if (!$check->fetchColumn()) {
                break;
            }

            $barcodeId++;
        }

        $entity->set('barcodeId', $barcodeId);

        // code
        $stmt2 = $pdo->query(
            "SELECT MAX(CASE WHEN code REGEXP '^[0-9]+$' THEN code+0 ELSE 0 END)
             FROM c_material
             WHERE deleted = 0"
        );
        $maxCode = (int) $stmt2->fetchColumn();
        $code = $maxCode + 1;

        while (true) {
            $check = $pdo->prepare(
                "SELECT id FROM c_material 
                 WHERE code = ? AND deleted = 0 
                 LIMIT 1"
            );
            $check->execute([(string)$code]);

            if (!$check->fetchColumn()) {
                break;
            }

            $code++;
        }

        $entity->set('code', (string)$code);

        // EAN-13
        $idStr = str_pad((string) $barcodeId, 5, '0', STR_PAD_LEFT);
        $base  = "481" . $category . $idStr . "24";
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
