#!/usr/bin/env php  Скрипт для однократного проставления barcode
<?php

chdir('/var/www/espocrm-staging'); // путь к Espo
require 'bootstrap.php';

use Espo\Core\Application;
use Espo\ORM\EntityManager;

echo "=== DEBUG START ===\n";

// Инициализируем приложение Espo
$app = new Application();
$container = $app->getContainer();

if (!$container) {
    echo "[ERROR] Container nicht verfügbar\n";
    exit(1);
}

echo "[OK] Container geladen\n";

/** @var EntityManager $em */
$em = $container->get('entityManager');
$repo = $em->getRepository('CMaterial');

echo "[OK] Repository geladen: CMaterial\n";

// ==============================
// Создаем QueryBuilder
// ==============================

$qb = $repo
    ->where([
        'deleted' => false,
    ])
    ->where([
        'barcode' => null,    // У тебя в БД точно NULL — мы проверили!
    ])
    ->order('barcodeId', 'ASC');

echo "[DEBUG] QueryBuilder erstellt\n";

// Попробуем вывести SQL, который генерирует Espo
try {
    $sql = $qb->toString();
    echo "[DEBUG] ORM SQL: $sql\n";
} catch (\Throwable $e) {
    echo "[WARN] Konnte SQL nicht auslesen: {$e->getMessage()}\n";
}

// ==============================
// Выполняем запрос
// ==============================

echo "[DEBUG] Starte qb->find()...\n";

$list = null;
try {
    $list = $qb->find();
    echo "[DEBUG] qb->find() ausgeführt\n";
} catch (\Throwable $e) {
    echo "[ERROR] qb->find() Fehler: {$e->getMessage()}\n";
    exit(1);
}

if (!$list) {
    echo "[INFO] Liste ist leer (0 Treffer)\n";
    echo "=== DEBUG ENDE ===\n";
    exit(0);
}

$countList = count($list);
echo "[INFO] Anzahl gefundener Datensätze: $countList\n";

// Выведем первые 5 ID
$counter = 0;
foreach ($list as $entity) {
    echo "[ID] {$entity->get('id')} (barcodeId={$entity->get('barcodeId')})\n";
    $counter++;
    if ($counter >= 5) break;
}

echo "[DEBUG] Beginne Verarbeitung...\n";


// ==============================
// ОСНОВНОЙ ЦИКЛ
// ==============================

$updated = 0;

foreach ($list as $entity) {

    echo "[PROCESS] Material {$entity->get('id')} mit barcodeId={$entity->get('barcodeId')}\n";

    $barcodeId = (int) $entity->get('barcodeId');
    if (!$barcodeId) {
        echo "[SKIP] Kein barcodeId für {$entity->get('id')}\n";
        continue;
    }

    $category = (string) ($entity->get('kategorie') ?: '99');
    $category = preg_replace('/\D/', '', $category) ?: '99';
    $category = str_pad($category, 2, '0', STR_PAD_LEFT);

    $idStr = str_pad((string) $barcodeId, 5, '0', STR_PAD_LEFT);
    $base = '481' . $category . $idStr . '24';

    echo "[DEBUG] base=$base\n";

    if (strlen($base) !== 12) {
        echo "[WARN] Ungültige Base für {$entity->get('id')}: $base\n";
        continue;
    }

    $checkDigit = calculateEan13CheckDigit($base);
    $barcode = $base . $checkDigit;

    echo "[DEBUG] barcode=$barcode\n";

    $entity->set('barcode', $barcode);

    try {
        // можно без опций, но на всякий случай явно
        $em->saveEntity($entity, [
            'skipHooks' => true,   // чтобы наш GenerateBarcode не мешался
        ]);
        echo "[OK] Gespeichert: {$entity->get('id')}\n";
        $updated++;
    } catch (\Throwable $e) {
        echo "[ERROR] Fehler beim Speichern von {$entity->get('id')}: "
            . $e->getMessage() . "\n";
        // если нужно увидеть стек:
        // echo $e->getTraceAsString() . "\n";
        // не выходим, а идём дальше по другим записям
        continue;
    }
}


echo "=== FERTIG ===\n";
echo "Aktualisierte Einträge: $updated\n";


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
