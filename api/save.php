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

if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

$raw = file_get_contents('php://input');

if (!$raw) {
    http_response_code(400);
    echo json_encode(['error' => 'Empty body']);
    exit;
}

$incoming = json_decode($raw, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON: ' . json_last_error_msg()]);
    exit;
}

if (!isset($incoming['userName']) || !isset($incoming['userData'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing userName or userData']);
    exit;
}

$userName = $incoming['userName'];
$userData = $incoming['userData'];

/* ---------------- FILE LOCK ---------------- */

$fp = fopen($dataFile, 'c+');
if (!$fp) {
    http_response_code(500);
    echo json_encode(['error' => 'Cannot open file']);
    exit;
}

if (!flock($fp, LOCK_EX)) {
    fclose($fp);
    http_response_code(500);
    echo json_encode(['error' => 'Cannot lock file']);
    exit;
}

/* ---------------- READ CURRENT DATA ---------------- */

rewind($fp);
$content = stream_get_contents($fp);

$current = [
    'users' => [],
    'jogos' => []
];

if (!empty($content)) {
    $parsed = json_decode($content, true);

    if (json_last_error() === JSON_ERROR_NONE && is_array($parsed)) {
        $current['users'] = $parsed['users'] ?? [];
        $current['jogos'] = $parsed['jogos'] ?? [];
    }
}

/* ---------------- UPDATE USER ---------------- */

$current['users'][$userName] = $userData;

/* ---------------- SAVE BACK ---------------- */

ftruncate($fp, 0);
rewind($fp);

fwrite(
    $fp,
    json_encode($current, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)
);

fflush($fp);
flock($fp, LOCK_UN);
fclose($fp);

/* ---------------- RESPONSE ---------------- */

echo json_encode([
    'ok' => true,
    'users' => count($current['users'])
]);