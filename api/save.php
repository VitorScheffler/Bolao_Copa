<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$dataFile = __DIR__ . '/../data/bolao.json';
$dataDir  = dirname($dataFile);

// Cria a pasta /data se não existir
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

$raw = file_get_contents('php://input');

if (!$raw) {
    http_response_code(400);
    echo json_encode(['error' => 'Empty body']);
    exit;
}

$decoded = json_decode($raw, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON: ' . json_last_error_msg()]);
    exit;
}

// Valida estrutura mínima
if (!isset($decoded['users']) || !is_array($decoded['users'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing users field']);
    exit;
}

// Salva com lock para evitar race condition
$fp = fopen($dataFile, 'c+');
if (!$fp) {
    http_response_code(500);
    echo json_encode(['error' => 'Cannot open file for writing']);
    exit;
}

if (flock($fp, LOCK_EX)) {
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($decoded, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    fflush($fp);
    flock($fp, LOCK_UN);
}

fclose($fp);

echo json_encode(['ok' => true, 'users' => count($decoded['users'])]);
