<?php

namespace Espo\Custom\Controllers;

use Espo\Core\Templates\Controllers\Base;

class CStundenbericht extends Base
{
    public function postActionDownloadPdfZip($params, $data, $request)
    {
        // права: чтение Stundenberichte
        $this->getAcl()->check('CStundenbericht', 'read');

        $ids = null;

        // 1) обычный JSON: { "ids": [...] }
        if (isset($data->ids)) {
            $ids = $data->ids;
        }

        // 2) если вдруг пришло строкой JSON: { "ids": "[...]" }
        if (is_string($ids)) {
            $decoded = json_decode($ids, true);
            if (is_array($decoded)) {
                $ids = $decoded;
            }
        }

        // 3) финальная проверка
        if (!is_array($ids) || !count($ids)) {
            return ['success' => false, 'error' => 'ids is required'];
        }

        $em = $this->getEntityManager();

        $zipName = 'stundenberichte_' . date('Y-m-d_His') . '.zip';
        $tmpZip  = sys_get_temp_dir() . DIRECTORY_SEPARATOR . $zipName;

        $zip = new \ZipArchive();
        if ($zip->open($tmpZip, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
            return ['success' => false, 'error' => 'Cannot create zip'];
        }

        $missing = [];

        foreach ($ids as $id) {
            $e = $em->getEntity('CStundenbericht', $id);
            if (!$e) {
                $missing[] = "NOT_FOUND_ENTITY_ID_$id";
                continue;
            }

            $url = trim((string) ($e->get('pdfUrl') ?? ''));
            if ($url === '') {
                $missing[] = "NO_PDFURL_ID_$id";
                continue;
            }

            // имя файла в ZIP: берём basename без query (?v=...)
            $urlNoQuery = preg_replace('/\?.*$/', '', $url);
            $fileNameInZip = basename($urlNoQuery);
            if ($fileNameInZip === '' || stripos($fileNameInZip, '.pdf') === false) {
                $fileNameInZip = 'stundenbericht_' . $id . '.pdf';
            }

            // скачиваем PDF (без авторизации, как вы указали)
            $context = stream_context_create([
                'http' => [
                    'method'  => 'GET',
                    'timeout' => 30,
                    'header'  => "User-Agent: EspoCRM\r\n",
                ],
                'ssl' => [
                    'verify_peer'      => true,
                    'verify_peer_name' => true,
                ],
            ]);

            $pdfBytes = @file_get_contents($url, false, $context);
            if ($pdfBytes === false || $pdfBytes === '') {
                $missing[] = "DOWNLOAD_FAILED_$fileNameInZip";
                continue;
            }

            // минимальная проверка: PDF обычно начинается с %PDF
            if (substr($pdfBytes, 0, 4) !== '%PDF') {
                $missing[] = "NOT_A_PDF_$fileNameInZip";
                continue;
            }

            $zip->addFromString($fileNameInZip, $pdfBytes);
        }

        if ($missing) {
            $zip->addFromString('MISSING.txt', implode("\n", $missing) . "\n");
        }

        $zip->close();

        // Отдаём zip как файл
        header('Content-Type: application/zip');
        header('Content-Disposition: attachment; filename="' . $zipName . '"');
        header('Content-Length: ' . filesize($tmpZip));
        header('Cache-Control: no-store, no-cache, must-revalidate');
        header('Pragma: no-cache');

        readfile($tmpZip);
        @unlink($tmpZip);
        exit;
    }
}
