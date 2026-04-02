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

// Espera { "userName": "...", "userData": { palpites: {...} } }
if (!isset($incoming['userName']) || !isset($incoming['userData'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing userName or userData']);
    exit;
}

$userName = $incoming['userName'];
$userData = $incoming['userData'];

// Abre com lock exclusivo para leitura + escrita segura
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

// Lê o estado atual do arquivo (com o lock já adquirido)
$content = '';
rewind($fp);
while (!feof($fp)) {
    $content .= fread($fp, 8192);
}

$current = [];
if ($content !== '') {
    $parsed = json_decode($content, true);
    if (json_last_error() === JSON_ERROR_NONE && isset($parsed['users'])) {
        $current = $parsed['users'];
    }
}

// Merge: atualiza apenas o usuário que salvou, preserva os demais
$current[$userName] = $userData;

$newContent = json_encode(
    ['users' => $current],
    JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT
);

ftruncate($fp, 0);
rewind($fp);
fwrite($fp, $newContent);
fflush($fp);
flock($fp, LOCK_UN);
fclose($fp);

echo json_encode(['ok' => true, 'users' => count($current)]);