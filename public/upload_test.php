<?php
header('Content-Type: application/json; charset=utf-8');
echo json_encode([
  'sapi' => PHP_SAPI,
  'method' => $_SERVER['REQUEST_METHOD'] ?? null,
  'content_type' => $_SERVER['CONTENT_TYPE'] ?? null,
  'content_length' => $_SERVER['CONTENT_LENGTH'] ?? null,
  'files' => $_FILES,
  'post_keys' => array_keys($_POST),
], JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);
