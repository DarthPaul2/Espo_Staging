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
    // 1) Обрабатываем только НОВЫЕ материалы
    if (!$entity->isNew()) {
        return;
    }

    // 2) Если barcode уже задан (импорт и пр.) – не трогаем
    if ($entity->get('barcode')) {
        return;
    }

    // 3) Категория – две цифры, по умолчанию "99"
    $category = (string) ($entity->get('kategorie') ?: '99');
    $category = preg_replace('/\D/', '', $category) ?: '99';
    $category = str_pad($category, 2, '0', STR_PAD_LEFT);

    $repo = $this->em->getRepository('CMaterial');

    // 4) Берём barcodeId из сущности или генерируем стартовый (max + 1)
    $barcodeId = $entity->get('barcodeId');

    if (!$barcodeId) {
        $q = $repo
            ->where(['deleted' => false])
            ->order('barcodeId', 'DESC')
            ->limit(1);

        $last = $repo->findOne($q);
        $nextId = $last ? ((int) $last->get('barcodeId') + 1) : 1;
        $barcodeId = $nextId;
    }

    // 4.1) Дополнительная защита:
    //       пока такой barcodeId уже есть в БД – увеличиваем
    while ($repo->where([
        'barcodeId' => (int) $barcodeId,
        'deleted'   => false,
    ])->findOne()) {
        $barcodeId++;
    }

    // окончательно записываем в сущность
    $entity->set('barcodeId', $barcodeId);

    // 4.2) Автоматическое заполнение поля code, если оно пустое
$code = $entity->get('code');

if (!$code) {

    // Берём максимальный числовой code в системе
    $qCode = $repo
        ->where(['deleted' => false])
        ->order('code', 'DESC')
        ->limit(1);

    $lastCodeEntity = $repo->findOne($qCode);

    if ($lastCodeEntity && is_numeric($lastCodeEntity->get('code'))) {
        $codeNum = (int) $lastCodeEntity->get('code') + 1;
    } else {
        // Если кодов нет или они нечисловые
        $codeNum = 1;
    }

    // Проверка уникальности — на случай дыр или ручных ошибок
    while ($repo->where([
        'code'    => (string) $codeNum,
        'deleted' => false
    ])->findOne()) {
        $codeNum++;
    }

    $entity->set('code', (string) $codeNum);
}

    // 5) Собираем основу: 481 + CC + ID(5) + 24  → 12 цифр
    $idStr = str_pad((string) $barcodeId, 5, '0', STR_PAD_LEFT);
    $base  = '481' . $category . $idStr . '24';

    if (strlen($base) !== 12) {
        throw new \RuntimeException('Fehler beim Aufbau des EAN-13-Basiscodes.');
    }

    // 6) Считаем контрольную цифру
    $checkDigit = $this->calculateEan13CheckDigit($base);
    $barcode    = $base . $checkDigit;

    // 7) Проверяем уникальность штрихкода (EAN-13)
    $existing = $repo->where([
        'barcode' => $barcode,
        'deleted' => false,
    ])->findOne();

    if ($existing) {
        throw new \RuntimeException('Generierter Barcode existiert bereits in CMaterial.');
    }

    // 8) Записываем результат в сущность
    $entity->set('barcode', $barcode);
}


    private function calculateEan13CheckDigit(string $number): string
    {
        $len = strlen($number);
        $sum = 0;

        // Та же логика, что в твоём Python-коде:
        // sum(int(d) if i % 2 == 0 else int(d) * 3 for i, d in enumerate(number))
        for ($i = 0; $i < $len; $i++) {
            $digit = (int) $number[$i];
            $sum  += ($i % 2 === 0) ? $digit : $digit * 3;
        }

        $check = (10 - ($sum % 10)) % 10;
        return (string) $check;
    }
}
