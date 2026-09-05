<?php
if (file_exists(__DIR__ . '/../config.php')) {
    require_once __DIR__ . '/../config.php';
} else if (file_exists(__DIR__ . '/config.php')) {
    require_once __DIR__ . '/config.php';
}

header('Content-Type: application/json; charset=utf-8');

$totalStudents = 0;
$status = 'ok';
$mode = 'json-fallback';
$madrasah = 'Madrasah Ibtidaiyah';

try {
    if (function_exists('getDbConnection')) {
        $pdo = getDbConnection();
        if ($pdo) {
            $stmt = $pdo->query("SELECT COUNT(*) as c FROM siswa");
            $totalStudents = (int)($stmt->fetch()['c'] ?? 0);
            $stmtM = $pdo->query("SELECT nama_madrasah FROM madrasah_info LIMIT 1");
            $rowM = $stmtM->fetch();
            if ($rowM && !empty($rowM['nama_madrasah'])) {
                $madrasah = $rowM['nama_madrasah'];
            }
            $mode = 'mysql-connected';
        }
    }
} catch (Exception $e) {
    $mode = 'error-fallback';
}

if ($mode !== 'mysql-connected') {
    $jsonPath = __DIR__ . '/../data/database.json';
    if (file_exists($jsonPath)) {
        $data = json_decode(@file_get_contents($jsonPath), true);
        if ($data && isset($data['students']) && is_array($data['students'])) {
            $totalStudents = count($data['students']);
        }
        if ($data && isset($data['madrasah']['namaMadrasah'])) {
            $madrasah = $data['madrasah']['namaMadrasah'];
        }
    }
}

echo json_encode([
    'status' => $status,
    'mode' => $mode,
    'totalStudents' => $totalStudents,
    'madrasah' => $madrasah,
    'database' => defined('DB_NAME') ? DB_NAME : 'unknown',
    'serverTime' => date('c')
]);
