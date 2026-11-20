<?php
/**
 * Meraj Andisheh Studio Content Bank - weekly host backup receiver.
 * Configure MERAJ_BACKUP_SECRET on the host and set the same value in
 * Admin > Backups > Secret Token. The app POSTs a full JSON backup with
 * X-Backup-Token. Files are written atomically into ./backups.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'POST required']);
    exit;
}

$expectedSecret = getenv('MERAJ_BACKUP_SECRET') ?: '';
$providedSecret = $_SERVER['HTTP_X_BACKUP_TOKEN'] ?? '';
if ($expectedSecret === '' || !hash_equals($expectedSecret, $providedSecret)) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Invalid backup token']);
    exit;
}

$raw = file_get_contents('php://input');
$decoded = json_decode($raw, true);
if (!is_array($decoded) || !isset($decoded['payload']) || !is_array($decoded['payload'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid backup payload']);
    exit;
}

$dir = __DIR__ . '/backups';
if (!is_dir($dir) && !mkdir($dir, 0750, true) && !is_dir($dir)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Unable to create backup directory']);
    exit;
}

$name = 'meraj-backup-' . gmdate('Ymd-His') . '-' . bin2hex(random_bytes(4)) . '.json';
$path = $dir . '/' . $name;
$temp = $path . '.tmp';
if (file_put_contents($temp, $raw, LOCK_EX) === false || !rename($temp, $path)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Unable to persist backup']);
    exit;
}

// Keep only the most recent 12 weekly snapshots on the host.
$files = glob($dir . '/meraj-backup-*.json') ?: [];
usort($files, fn($a, $b) => filemtime($b) <=> filemtime($a));
foreach (array_slice($files, 12) as $old) {
    @unlink($old);
}

echo json_encode([
    'ok' => true,
    'file' => $name,
    'bytes' => filesize($path),
    'contents' => count($decoded['payload']['contents'] ?? []),
    'receivedAt' => gmdate('c'),
]);
