<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate, max-age=0, post-check=0, pre-check=0');
header('Pragma: no-cache');
header('Expires: Thu, 01 Jan 1970 00:00:00 GMT');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$configFile = __DIR__ . '/../config.php';
if (file_exists($configFile)) {
    require_once $configFile;
}

$lastUpdated = '';

// 1. Cek dari file JSON fallback
$jsonFile = __DIR__ . '/../../data/database.json';
if (!file_exists($jsonFile)) {
    $jsonFile = __DIR__ . '/../data/database.json';
}
if (!file_exists($jsonFile)) {
    $jsonFile = __DIR__ . '/data/database.json';
}

if (file_exists($jsonFile)) {
    $jsonContent = @file_get_contents($jsonFile);
    if ($jsonContent) {
        $data = @json_decode($jsonContent, true);
        if ($data && !empty($data['lastUpdated'])) {
            $lastUpdated = $data['lastUpdated'];
        } else {
            $lastUpdated = date('c', filemtime($jsonFile));
        }
    }
}

// 2. Cek dari MySQL jika aktif
try {
    if (function_exists('getDbConnection')) {
        $pdo = getDbConnection();
        if ($pdo) {
            // Pastikan kolom updated_at ada di madrasah_info
            try {
                $pdo->exec("ALTER TABLE madrasah_info ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
                $pdo->exec("ALTER TABLE madrasah_info ADD COLUMN IF NOT EXISTS label_id_penandatangan VARCHAR(50) DEFAULT 'NIP'");
            } catch (Exception $e) {}

            $stmt = $pdo->query("SELECT GREATEST(
                COALESCE((SELECT MAX(updated_at) FROM madrasah_info), '1970-01-01'),
                COALESCE((SELECT MAX(updated_at) FROM siswa), '1970-01-01'),
                COALESCE((SELECT MAX(updated_at) FROM pengaturan_kartu), '1970-01-01')
            ) AS latest_time");
            $row = $stmt ? $stmt->fetch(PDO::FETCH_ASSOC) : null;
            if (!empty($row['latest_time']) && $row['latest_time'] !== '1970-01-01') {
                $mysqlTime = date('c', strtotime($row['latest_time']));
                if (!$lastUpdated || strtotime($mysqlTime) > strtotime($lastUpdated)) {
                    $lastUpdated = $mysqlTime;
                }
            }

            $countStmt = $pdo->query("SELECT COUNT(*) FROM siswa");
            if ($countStmt) {
                $mysqlStudentsCount = (int)$countStmt->fetchColumn();
            }

            $tpStmt = $pdo->query("SELECT tahun_pelajaran FROM madrasah_info LIMIT 1");
            if ($tpStmt) {
                $mysqlTahunPelajaran = (string)$tpStmt->fetchColumn();
            }
        }
    }
} catch (Exception $e) {
    // Abaikan error MySQL
}

if (!$lastUpdated) {
    $lastUpdated = date('c', strtotime('2026-01-01 00:00:00'));
}

echo json_encode([
    'success' => true,
    'status' => 'success',
    'lastUpdated' => $lastUpdated,
    'totalStudents' => isset($mysqlStudentsCount) ? $mysqlStudentsCount : (isset($data['students']) ? count($data['students']) : 0),
    'tahunPelajaran' => isset($mysqlTahunPelajaran) ? $mysqlTahunPelajaran : ($data['madrasah']['tahunPelajaran'] ?? '2025/2026'),
    'timestamp' => time()
]);
