<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$dataFile = __DIR__ . '/../data/bolao.json';

if (!file_exists($dataFile)) {
    echo json_encode(['users' => []]);
    exit;
}

$content = file_get_contents($dataFile);
if ($content === false || $content === '') {
    echo json_encode(['users' => []]);
    exit;
}

echo $content;
