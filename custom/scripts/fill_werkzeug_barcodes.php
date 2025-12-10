#!/usr/bin/env php
<?php
// Скрипт для однократного проставления barcode для CWerkzeug

chdir('/var/www/espocrm-staging'); // путь к Espo
require 'bootstrap.php';

use Espo\Core\Application;
use Espo\ORM\EntityManager;

echo "=== CWerkzeug Barcode-Fill START ===\n";

$app = new Application();
$container = $app->getContainer();

if (!$container) {
    echo "[ERROR] Container nicht verfügbar\n";
    exit(1);
}

/** @var EntityManager $em */
$em = $container->get('entityManager');
$repo = $em->getRepository('CWerkzeug');

echo "[OK] Repository geladen: CWerkzeug\n";

// --- все Werkzeug без barcode ---
$qb = $repo
    ->where([
        'deleted' => false,
    ])
    ->where([
        'barcode' => null,
    ])
    ->order('createdAt', 'ASC');

$list = null;

try {
    $list = $qb->find();
} catch (\Throwable $e) {
    echo "[ERROR] qb->find() Fehler: {$e->getMessage()}\n";
    exit(1);
}

if (!$list) {
    echo "[INFO] Keine Datensätze ohne Barcode gefunden.\n";
    echo "=== ENDE ===\n";
    exit(0);
}

echo "[INFO] Datensätze ohne Barcode: " . count($list) . "\n";

// --- определяем текущий максимум счётчика в существующих баркодах ---
$pdo = $em->getPDO();

$stmt = $pdo->query("
    SELECT MAX(CAST(SUBSTRING(barcode, 7, 5) AS UNSIGNED))
    FROM c_werkzeug
    WHERE deleted = 0
      AND barcode REGEXP '^481[0-9]{2}[0-9]{5}24[0-9]$'
");

$currentSeq = (int) $stmt->fetchColumn();
echo "[INFO] Aktueller Max-Seq in Barcodes: {$currentSeq}\n";

$updated = 0;

// --- маппинг категорий как в хуке ---
$categoryMap = [
    'Werkzeug'         => '90',
    'Maschine'         => '91',
    'Prüfgerät'        => '92',
    'Fahrzeug-Zubehör' => '93',
    'Sonstiges'        => '94',
];

foreach ($list as $entity) {

    $id = $entity->get('id');
    $cat = (string) $entity->get('kategorie');

    $categoryCode = $categoryMap[$cat] ?? '94';

    $currentSeq++;
    $seq = $currentSeq;

    $idStr = str_pad((string) $seq, 5, '0', STR_PAD_LEFT);
    $base  = '481' . $categoryCode . $idStr . '24'; // 12 Stellen

    if (strlen($base) !== 12) {
        echo "[WARN] Ungültige Base für {$id}: {$base}\n";
        continue;
    }

    $checkDigit = calculateEan13CheckDigit($base);
    $barcode    = $base . $checkDigit;

    echo "[SET] {$id}  cat={$cat} ({$categoryCode})  seq={$seq}  barcode={$barcode}\n";

    $entity->set('barcode', $barcode);

    try {
        $em->saveEntity($entity, [
            'skipHooks' => true,      // чтобы GenerateBarcode не срабатывал
        ]);
        $updated++;
    } catch (\Throwable $e) {
        echo "[ERROR] Speichern fehlgeschlagen für {$id}: {$e->getMessage()}\n";
        continue;
    }
}

echo "=== FERTIG ===\n";
echo "Aktualisierte Einträge: {$updated}\n";

function calculateEan13CheckDigit(string $number): string
{
    $len = strlen($number);
    $sum = 0;

    for ($i = 0; $i < $len; $i++) {
        $digit = (int) $number[$i];
        $sum  += ($i % 2 === 0) ? $digit : $digit * 3;
    }

    return (string) ((10 - ($sum % 10)) % 10);
}
