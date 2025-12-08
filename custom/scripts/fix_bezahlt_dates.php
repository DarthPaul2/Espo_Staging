<?php

/**
 * Одноразовый скрипт:
 *  - читает оплаченные Rechnungen (status = 'bezahlt', bezahlt_am IS NULL)
 *  - вытаскивает из description:
 *      | Rechnungsdatum: 28.10.2024 | Mahngebühren: 15,00 |
 *    или
 *      | Rechnungsdatum: 28.10.2024
 *  - считает bezahlt_am:
 *      нет / 0,00 Mahngebühren  -> +10 дней
 *      5,00                     -> +20 дней
 *      10,00                    -> +25 дней
 *      15,00                    -> +30 дней
 *
 *  ВНИМАНИЕ: сейчас режим ЗАПИСИ (DRY RUN = false).
 */

error_reporting(E_ALL & ~E_NOTICE);
ini_set('display_errors', 1);

$dryRun = false;   // <-- если хочешь сначала проверить, поставь true

echo "== Fix bezahlt_am based on description ==\n";
echo "MODE: " . ($dryRun ? "DRY-RUN (НЕ записываем в БД)" : "WRITE (записываем в БД)") . "\n";

// ---- 1. Загружаем конфиг Espo и подключаемся к БД ----

$configFile = '/var/www/espocrm-staging/data/config-internal.php';
if (!file_exists($configFile)) {
    echo "FATAL: Config file not found: {$configFile}\n";
    exit(1);
}

$config = require $configFile;

if (empty($config['database'])) {
    echo "FATAL: database config not found in {$configFile}\n";
    exit(1);
}

$db = $config['database'];

$host     = $db['host']    ?? 'localhost';
$port     = $db['port']    ?? 3306;
$dbname   = $db['dbname']  ?? 'espocrm';
$user     = $db['user']    ?? 'root';
$password = $db['password'] ?? '';

$dsn = sprintf(
    'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
    $host,
    $port,
    $dbname
);

try {
    $pdo = new PDO($dsn, $user, $password, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    echo "FATAL: DB connection error: " . $e->getMessage() . "\n";
    exit(1);
}

// ---- 2. Выбираем все оплаченные счета без bezahlt_am ----

$sql = "
    SELECT
        id,
        rechnungsnummer,
        status,
        description,
        bezahlt_am,
        betrag_netto
    FROM c_rechnung
    WHERE
        deleted = 0
        AND status = 'bezahlt'
        AND bezahlt_am IS NULL
";

$stmt = $pdo->query($sql);
$rows = $stmt->fetchAll();

$total = count($rows);
echo "Found: {$total} paid invoices without bezahlt_am.\n";

if ($total === 0) {
    exit(0);
}

// подготовим UPDATE
$updateStmt = $pdo->prepare("
    UPDATE c_rechnung
    SET bezahlt_am = :bezahlt_am
    WHERE id = :id
");

// ---- 3. Обработка каждой строки ----

$tz = new DateTimeZone('Europe/Berlin');
$updated = 0;
$skipped = 0;

foreach ($rows as $row) {
    $id          = $row['id'];
    $nr          = $row['rechnungsnummer'] ?? '';
    $desc        = $row['description'] ?? '';
    $status      = $row['status'] ?? '';
    $bezahltAmDb = $row['bezahlt_am'];

    // safety: интересуют только статус 'bezahlt'
    if ($status !== 'bezahlt') {
        echo "[SKIP] {$id} {$nr}: status != 'bezahlt' ({$status})\n";
        $skipped++;
        continue;
    }

    // 3.1. Ищем Rechnungsdatum
    if (!preg_match('/Rechnungsdatum:\s*([0-3]?\d\.[01]?\d\.\d{4})/u', $desc, $mDate)) {
        echo "[SKIP] {$id} {$nr}: Rechnungsdatum not found in description\n";
        $skipped++;
        continue;
    }

    $rechnungsdatumStr = $mDate[1];

    $rechnungsdatum = DateTime::createFromFormat('d.m.Y', $rechnungsdatumStr, $tz);
    if (!$rechnungsdatum) {
        echo "[SKIP] {$id} {$nr}: bad Rechnungsdatum '{$rechnungsdatumStr}'\n";
        $skipped++;
        continue;
    }

    // 3.2. Ищем Mahngebühren (если есть)
    $mahnStr   = '0,00';
    $mahnValue = 0.0;

    if (preg_match('/Mahngebühren:\s*([\d.,]+)/u', $desc, $mFee)) {
        $mahnStr = $mFee[1];

        // заменяем пробелы, точки и запятую -> стандартный float
        $normalized = str_replace(['.', ' '], ['', ''], $mahnStr);
        $normalized = str_replace(',', '.', $normalized);

        if (is_numeric($normalized)) {
            $mahnValue = (float)$normalized;
        } else {
            echo "[SKIP] {$id} {$nr}: Mahngebühren '{$mahnStr}' is not numeric\n";
            $skipped++;
            continue;
        }
    } else {
        // нет Mahngebühren в описании — считаем как 0,00
        $mahnValue = 0.0;
        $mahnStr   = '0,00';
    }

    // 3.3. Определяем количество дней добавки
    if ($mahnValue < 0.01) {
        $daysToAdd = 10;
    } elseif (abs($mahnValue - 5.0) < 0.01) {
        $daysToAdd = 20;
    } elseif (abs($mahnValue - 10.0) < 0.01) {
        $daysToAdd = 25;
    } elseif (abs($mahnValue - 15.0) < 0.01) {
        $daysToAdd = 30;
    } else {
        echo "[SKIP] {$id} {$nr}: unsupported Mahngebühren '{$mahnStr}' (parsed={$mahnValue})\n";
        $skipped++;
        continue;
    }

    // 3.4. Считаем дату оплаты (без коррекции выходных)
    $bezahltDt = clone $rechnungsdatum;
    $bezahltDt->modify("+{$daysToAdd} days");

    $bezahltDateStr = $bezahltDt->format('Y-m-d');

    echo sprintf(
        "[OK]    %s | %s | Rechnungsdatum=%s | Mahngebühren=%s | +%d Tage => bezahltAm=%s\n",
        $id,
        $nr,
        $rechnungsdatumStr,
        $mahnStr,
        $daysToAdd,
        $bezahltDateStr
    );

    if ($dryRun) {
        continue;
    }

    // 3.5. Записываем в БД
    try {
        $updateStmt->execute([
            ':bezahlt_am' => $bezahltDateStr,
            ':id'         => $id,
        ]);
        $updated++;
    } catch (Throwable $e) {
        echo "[ERROR] {$id} {$nr}: DB update failed: " . $e->getMessage() . "\n";
    }
}

echo "\nDone.\n";
echo "Updated: {$updated}\n";
echo "Skipped: {$skipped}\n";
