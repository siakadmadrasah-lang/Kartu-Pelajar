<?php
if (file_exists(__DIR__ . '/../config.php')) {
    require_once __DIR__ . '/../config.php';
} else if (file_exists(__DIR__ . '/config.php')) {
    require_once __DIR__ . '/config.php';
}

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate, max-age=0, post-check=0, pre-check=0');
header('Pragma: no-cache');
header('Expires: Thu, 01 Jan 1970 00:00:00 GMT');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dbJsonPath = __DIR__ . '/../data/database.json';
$persistentJsonPath = __DIR__ . '/../data/persistent_database.json';
$studentsVaultJsonPath = __DIR__ . '/../data/students_vault.json';
$userSettingsJsonPath = __DIR__ . '/../data/user_settings.json';
$backupDataJsonPath = __DIR__ . '/../backup_data_madrasah.json';
$backupJsonPath = __DIR__ . '/database.json';

function readJsonFallback() {
    global $dbJsonPath, $persistentJsonPath, $studentsVaultJsonPath, $userSettingsJsonPath, $backupDataJsonPath, $backupJsonPath;
    
    $vaultStudents = [];
    if (file_exists($studentsVaultJsonPath)) {
        $vContent = @file_get_contents($studentsVaultJsonPath);
        if ($vContent) {
            $vJson = json_decode($vContent, true);
            if (is_array($vJson) && !empty($vJson)) {
                $vaultStudents = $vJson;
            }
        }
    }

    $candidate = null;

    // 1. Persistent JSON & User Settings
    if (file_exists($persistentJsonPath)) {
        $content = @file_get_contents($persistentJsonPath);
        if ($content) {
            $json = json_decode($content, true);
            if ($json && (isset($json['students']) || isset($json['madrasah']))) {
                $candidate = $json;
            }
        }
    }

    if (!$candidate && file_exists($userSettingsJsonPath)) {
        $content = @file_get_contents($userSettingsJsonPath);
        if ($content) {
            $json = json_decode($content, true);
            if ($json && (isset($json['students']) || isset($json['madrasah']))) {
                $candidate = $json;
            }
        }
    }
    
    // 2. database.json
    if (!$candidate && file_exists($dbJsonPath)) {
        $content = @file_get_contents($dbJsonPath);
        if ($content) {
            $json = json_decode($content, true);
            if ($json && (isset($json['students']) || isset($json['madrasah']))) {
                $candidate = $json;
            }
        }
    }
    
    // 3. backup_data_madrasah.json
    if (!$candidate && file_exists($backupDataJsonPath)) {
        $content = @file_get_contents($backupDataJsonPath);
        if ($content) {
            $json = json_decode($content, true);
            if ($json) $candidate = $json;
        }
    }

    // 4. api/database.json
    if (!$candidate && file_exists($backupJsonPath)) {
        $content = @file_get_contents($backupJsonPath);
        if ($content) {
            $json = json_decode($content, true);
            if ($json) $candidate = $json;
        }
    }

    if ($candidate && is_array($candidate)) {
        if ((!isset($candidate['students']) || empty($candidate['students'])) && !empty($vaultStudents)) {
            $candidate['students'] = $vaultStudents;
        }
        return $candidate;
    }

    if (!empty($vaultStudents)) {
        return ['students' => $vaultStudents];
    }

    return null;
}

function writeJsonFallback($data, $isExplicitClear = false) {
    global $dbJsonPath, $persistentJsonPath, $studentsVaultJsonPath, $userSettingsJsonPath, $backupDataJsonPath, $backupJsonPath;
    $dir = dirname($dbJsonPath);
    if (!file_exists($dir)) {
        @mkdir($dir, 0777, true);
    }

    if (isset($data['students']) && is_array($data['students']) && !empty($data['students'])) {
        @file_put_contents($studentsVaultJsonPath, json_encode($data['students'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        @chmod($studentsVaultJsonPath, 0666);
    } else if ($isExplicitClear) {
        @file_put_contents($studentsVaultJsonPath, json_encode([], JSON_PRETTY_PRINT));
        @chmod($studentsVaultJsonPath, 0666);
    } else if (file_exists($studentsVaultJsonPath)) {
        $vContent = @file_get_contents($studentsVaultJsonPath);
        if ($vContent) {
            $vJson = json_decode($vContent, true);
            if (is_array($vJson) && !empty($vJson)) {
                $data['students'] = $vJson;
            }
        }
    }

    $str = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
    @file_put_contents($persistentJsonPath, $str);
    @chmod($persistentJsonPath, 0666);

    @file_put_contents($userSettingsJsonPath, $str);
    @chmod($userSettingsJsonPath, 0666);
    
    @file_put_contents($dbJsonPath, $str);
    @chmod($dbJsonPath, 0666);
    
    @file_put_contents($backupJsonPath, $str);
    @chmod($backupJsonPath, 0666);

    @file_put_contents($backupDataJsonPath, $str);
    @chmod($backupDataJsonPath, 0666);
}

// ==================== DATABASE STATUS & TEST CONNECTION ====================
if (isset($_GET['action']) && $_GET['action'] === 'db_status') {
    $status = [
        'connected' => false,
        'driver' => 'mysql',
        'host' => defined('DB_HOST') ? DB_HOST : 'localhost',
        'database' => defined('DB_NAME') ? DB_NAME : 'kartu_pelajar_mi',
        'user' => defined('DB_USER') ? DB_USER : 'admin_madrasah',
        'studentsCount' => 0,
        'madrasahName' => '',
        'error' => null
    ];
    try {
        if (function_exists('getDbConnection')) {
            $pdo = getDbConnection();
            if ($pdo) {
                $status['connected'] = true;
                $status['studentsCount'] = (int)$pdo->query("SELECT COUNT(*) FROM siswa")->fetchColumn();
                $m = $pdo->query("SELECT nama_madrasah FROM madrasah_info LIMIT 1")->fetch();
                if ($m && !empty($m['nama_madrasah'])) {
                    $status['madrasahName'] = $m['nama_madrasah'];
                }
            } else {
                $status['error'] = 'Koneksi ke MySQL gagal. Cek host, database, user, dan password di config.local.php';
            }
        }
    } catch (Exception $e) {
        $status['error'] = $e->getMessage();
    }
    echo json_encode($status);
    exit;
}

// ==================== SAVE DB CONFIGURATION (ADMIN MODAL) ====================
if ((isset($_GET['action']) && $_GET['action'] === 'save_db_config') || (isset($_POST['action']) && $_POST['action'] === 'save_db_config')) {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true) ?: $_POST;
    
    $host = !empty($input['host']) ? trim($input['host']) : 'localhost';
    $dbname = !empty($input['database']) ? trim($input['database']) : 'kartu_pelajar_mi';
    $user = !empty($input['user']) ? trim($input['user']) : 'root';
    $pass = isset($input['password']) ? (string)$input['password'] : '';
    $port = !empty($input['port']) ? (string)$input['port'] : '3306';

    $localConfigContent = "<?php\n"
        . "if (!defined('DB_HOST')) define('DB_HOST', " . var_export($host, true) . ");\n"
        . "if (!defined('DB_NAME')) define('DB_NAME', " . var_export($dbname, true) . ");\n"
        . "if (!defined('DB_USER')) define('DB_USER', " . var_export($user, true) . ");\n"
        . "if (!defined('DB_PASS')) define('DB_PASS', " . var_export($pass, true) . ");\n"
        . "if (!defined('DB_PORT')) define('DB_PORT', " . var_export($port, true) . ");\n";
    
    @file_put_contents(__DIR__ . '/config.local.php', $localConfigContent);
    @file_put_contents(__DIR__ . '/../config.local.php', $localConfigContent);

    // Tes koneksi
    $testSuccess = false;
    $testErr = null;
    try {
        $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4;port={$port}";
        $pdoTest = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        if ($pdoTest) $testSuccess = true;
    } catch (Exception $e) {
        $testErr = $e->getMessage();
    }

    echo json_encode([
        'success' => $testSuccess,
        'message' => $testSuccess ? 'Konfigurasi MySQL berhasil disimpan dan koneksi sukses!' : 'Konfigurasi disimpan tetapi koneksi MySQL gagal: ' . $testErr,
        'config' => ['host' => $host, 'database' => $dbname, 'user' => $user]
    ]);
    exit;
}

// ==================== DIRECT CLEAR / DELETE STUDENTS ====================
if ((isset($_GET['action']) && $_GET['action'] === 'clear_students') || (isset($_POST['action']) && $_POST['action'] === 'clear_students') || $_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $lastUpdated = date('c');
    $currentJson = readJsonFallback() ?: [];
    $currentJson['students'] = [];
    $currentJson['lastUpdated'] = $lastUpdated;
    writeJsonFallback($currentJson);

    try {
        if (function_exists('getDbConnection')) {
            $pdo = getDbConnection();
            if ($pdo) {
                $pdo->exec("DELETE FROM siswa");
            }
        }
    } catch (Exception $e) {}

    echo json_encode([
        'success' => true,
        'message' => 'Seluruh data siswa berhasil dikosongkan secara permanen',
        'lastUpdated' => $lastUpdated,
        'totalStudents' => 0
    ]);
    exit;
}

// ==================== GET: AMBIL SELURUH DATA TERPUSAT ====================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $mysqlSuccess = false;
    $resultData = [];

    try {
        if (function_exists('getDbConnection')) {
            $pdo = getDbConnection();
            if ($pdo) {
                $madrasahRow = $pdo->query("SELECT * FROM madrasah_info ORDER BY updated_at DESC, id DESC LIMIT 1")->fetch();
                $configRow = $pdo->query("SELECT * FROM pengaturan_kartu ORDER BY id DESC LIMIT 1")->fetch();
                $studentsRows = $pdo->query("SELECT * FROM siswa ORDER BY kelas ASC, nama ASC")->fetchAll();

                $mappedStudents = [];
                if (!empty($studentsRows)) {
                    foreach ($studentsRows as $row) {
                        $mappedStudents[] = [
                            'id' => (string)($row['id'] ?? uniqid('std-')),
                            'nisn' => (string)($row['nisn'] ?? ''),
                            'nis' => (string)($row['nis'] ?? ''),
                            'nama' => (string)($row['nama'] ?? ''),
                            'tempatLahir' => (string)($row['tempat_lahir'] ?? ''),
                            'tanggalLahir' => (string)($row['tanggal_lahir'] ?? ''),
                            'jenisKelamin' => (string)($row['jenis_kelamin'] ?? 'L'),
                            'kelas' => (string)($row['kelas'] ?? 'I'),
                            'tahunAjaran' => (string)($row['tahun_ajaran'] ?? '2025/2026'),
                            'agama' => (string)($row['agama'] ?? 'Islam'),
                            'golonganDarah' => (string)($row['golongan_darah'] ?? '-'),
                            'alamat' => (string)($row['alamat'] ?? ''),
                            'namaWali' => (string)($row['nama_wali'] ?? ''),
                            'fotoUrl' => (string)($row['foto_url'] ?? ''),
                            'berlakuSampai' => (string)($row['berlaku_sampai'] ?? 'Selama Menjadi Siswa')
                        ];
                    }
                }

                $mappedMadrasah = null;
                if (!empty($madrasahRow)) {
                    $mappedMadrasah = [
                        'namaKementerian' => (string)($madrasahRow['nama_kementerian'] ?? 'KEMENTERIAN AGAMA REPUBLIK INDONESIA'),
                        'namaMadrasah' => (string)($madrasahRow['nama_madrasah'] ?? ''),
                        'namaSingkat' => (string)($madrasahRow['nama_singkat'] ?? $madrasahRow['nama_madrasah'] ?? ''),
                        'nsm' => (string)($madrasahRow['nsm'] ?? ''),
                        'npsn' => (string)($madrasahRow['npsn'] ?? ''),
                        'kemenagWilayah' => (string)($madrasahRow['kemenag_wilayah'] ?? ''),
                        'provinsi' => (string)($madrasahRow['provinsi'] ?? 'JAWA TENGAH'),
                        'alamat' => (string)($madrasahRow['alamat'] ?? ''),
                        'kelurahanDesa' => (string)($madrasahRow['kelurahan_desa'] ?? ''),
                        'kecamatan' => (string)($madrasahRow['kecamatan'] ?? ''),
                        'kotaKab' => (string)($madrasahRow['kota_kabupaten'] ?? ''),
                        'kodePos' => (string)($madrasahRow['kode_pos'] ?? ''),
                        'telepon' => (string)($madrasahRow['telepon'] ?? ''),
                        'email' => (string)($madrasahRow['email'] ?? ''),
                        'website' => (string)($madrasahRow['website'] ?? ''),
                        'akreditasi' => (string)($madrasahRow['akreditasi'] ?? 'A'),
                        'motto' => (string)($madrasahRow['motto'] ?? ''),
                        'jabatanPenandatangan' => (string)($madrasahRow['jabatan_penandatangan'] ?? 'Kepala Madrasah'),
                        'labelIdPenandatangan' => (string)($madrasahRow['label_id_penandatangan'] ?? 'NIP'),
                        'namaKepalaMadrasah' => (string)($madrasahRow['nama_kepala_madrasah'] ?? ''),
                        'nipKepalaMadrasah' => (string)($madrasahRow['nip_kepala_madrasah'] ?? ''),
                        'kotaPenetapan' => (string)($madrasahRow['kota_penetapan'] ?? ''),
                        'tanggalPenetapan' => (string)($madrasahRow['tanggal_penetapan'] ?? ''),
                        'logoAplikasiUrl' => (string)($madrasahRow['logo_aplikasi_url'] ?? ''),
                        'logoKemenagUrl' => (string)($madrasahRow['logo_kemenag_url'] ?? ''),
                        'logoMadrasahUrl' => (string)($madrasahRow['logo_madrasah_url'] ?? ''),
                        'stempelUrl' => (string)($madrasahRow['stempel_url'] ?? ''),
                        'ttdKepalaUrl' => (string)($madrasahRow['ttd_kepala_url'] ?? ''),
                        'tahunPelajaran' => (string)($madrasahRow['tahun_pelajaran'] ?? '2025/2026'),
                        'judulHeaderAplikasi' => (string)($madrasahRow['judul_header_aplikasi'] ?? 'KARTU PELAJAR DIGITAL'),
                        'subJudulHeaderAplikasi' => (string)($madrasahRow['sub_judul_header_aplikasi'] ?? "MI MA'ARIF NU 2 SANGGREMAN"),
                        'badgeHeaderAplikasi' => (string)($madrasahRow['badge_header_aplikasi'] ?? 'KEMENAG RI'),
                        'showMadrasahInHeader' => isset($madrasahRow['show_madrasah_in_header']) ? (bool)$madrasahRow['show_madrasah_in_header'] : true
                    ];
                }

                $jsonFallback = readJsonFallback();
                if (empty($mappedStudents) && $jsonFallback && !empty($jsonFallback['students'])) {
                    $mappedStudents = $jsonFallback['students'];
                }

                if (!empty($mappedStudents) || !empty($mappedMadrasah)) {
                    $cardConfig = null;
                    if ($configRow && !empty($configRow['config_json'])) {
                        $cardConfig = json_decode($configRow['config_json'], true);
                    }

                    $realLastUpdated = null;
                    $madrasahTime = !empty($madrasahRow['updated_at']) ? strtotime($madrasahRow['updated_at']) : 0;
                    $configTime = !empty($configRow['updated_at']) ? strtotime($configRow['updated_at']) : 0;
                    $maxTime = max($madrasahTime, $configTime);
                    if ($maxTime > 0) {
                        $realLastUpdated = date('c', $maxTime);
                    }

                    $resultData = [
                        'madrasah' => $mappedMadrasah,
                        'students' => $mappedStudents,
                        'cardConfig' => $cardConfig,
                        'lastUpdated' => $realLastUpdated ?: ($jsonFallback['lastUpdated'] ?? date('c'))
                    ];
                    $mysqlSuccess = true;
                }
            }
        }
    } catch (Exception $e) {
        // Fallback
    }

    if (!isset($jsonFallback)) {
        $jsonFallback = readJsonFallback();
    }
    if (!$mysqlSuccess) {
        if ($jsonFallback) {
            $resultData = $jsonFallback;
        }
    } else {
        // MySQL is Authoritative Single Source of Truth
        // Only complement non-database supplementary fields if missing from MySQL
        if ($jsonFallback) {
            if (!isset($resultData['cardConfig']) && isset($jsonFallback['cardConfig'])) {
                $resultData['cardConfig'] = $jsonFallback['cardConfig'];
            }
            if (!isset($resultData['loaderConfig']) && isset($jsonFallback['loaderConfig'])) {
                $resultData['loaderConfig'] = $jsonFallback['loaderConfig'];
            }
            if (!isset($resultData['activityLogs']) && isset($jsonFallback['activityLogs'])) {
                $resultData['activityLogs'] = $jsonFallback['activityLogs'];
            }
        }
    }

    $resultData['mysqlConnected'] = $mysqlSuccess;
    $resultData['dbType'] = $mysqlSuccess ? 'mysql' : 'json_file';

    echo json_encode([
        'success' => true,
        'data' => $resultData
    ]);
    exit;
}

// ==================== POST: SIMPAN PERUBAHAN KE SERVER & MYSQL ====================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);
    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Format payload JSON tidak valid']);
        exit;
    }

    $lastUpdated = date('c');
    $currentJson = readJsonFallback() ?: [];
    $isExplicitClear = (isset($input['action']) && $input['action'] === 'clear_students') || (isset($input['isExplicitClear']) && $input['isExplicitClear'] === true);

    $merged = array_merge($currentJson, $input);
    if (isset($input['students']) && is_array($input['students'])) {
        if (!empty($input['students'])) {
            $merged['students'] = $input['students'];
        } else if ($isExplicitClear) {
            $merged['students'] = [];
        } else {
            // Keep current students if input is empty array but not explicit clear
            $merged['students'] = (!empty($currentJson['students']) && is_array($currentJson['students'])) ? $currentJson['students'] : [];
        }
    }
    $merged['lastUpdated'] = $lastUpdated;
    writeJsonFallback($merged, $isExplicitClear);

    // Update ke MySQL bila database terhubung
    try {
        if (function_exists('getDbConnection')) {
            $pdo = getDbConnection();
            if ($pdo) {
                // 1. Simpan Profil Madrasah
                $m = null;
                if (isset($input['madrasah']) && is_array($input['madrasah'])) {
                    $m = $input['madrasah'];
                } else if (isset($input['namaMadrasah']) || isset($input['nsm']) || isset($input['nama_madrasah'])) {
                    $m = $input;
                }

                if ($m && is_array($m)) {
                    try {
                        $pdo->exec("ALTER TABLE madrasah_info ADD COLUMN IF NOT EXISTS label_id_penandatangan VARCHAR(50) DEFAULT 'NIP'");
                        $pdo->exec("ALTER TABLE madrasah_info ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
                    } catch (Exception $e) {}

                    $existingRow = $pdo->query("SELECT id FROM madrasah_info ORDER BY id ASC LIMIT 1")->fetch();
                    if ($existingRow && !empty($existingRow['id'])) {
                        $stmtM = $pdo->prepare("UPDATE madrasah_info SET 
                            nama_kementerian=:nama_kementerian, nsm=:nsm, npsn=:npsn, nama_madrasah=:nama_madrasah, nama_singkat=:nama_singkat, kemenag_wilayah=:kemenag_wilayah, alamat=:alamat, kelurahan_desa=:kelurahan_desa, kecamatan=:kecamatan, kota_kabupaten=:kota_kabupaten, provinsi=:provinsi, kode_pos=:kode_pos, telepon=:telepon, email=:email, website=:website, akreditasi=:akreditasi, motto=:motto, jabatan_penandatangan=:jabatan_penandatangan, label_id_penandatangan=:label_id_penandatangan, nama_kepala_madrasah=:nama_kepala_madrasah, nip_kepala_madrasah=:nip_kepala_madrasah, kota_penetapan=:kota_penetapan, tanggal_penetapan=:tanggal_penetapan, logo_aplikasi_url=:logo_aplikasi_url, logo_kemenag_url=:logo_kemenag_url, logo_madrasah_url=:logo_madrasah_url, stempel_url=:stempel_url, ttd_kepala_url=:ttd_kepala_url, tahun_pelajaran=:tahun_pelajaran, judul_header_aplikasi=:judul_header_aplikasi, sub_judul_header_aplikasi=:sub_judul_header_aplikasi, badge_header_aplikasi=:badge_header_aplikasi, show_madrasah_in_header=:show_madrasah_in_header
                            WHERE id=:id");
                        $stmtM->execute([
                            ':id' => (int)$existingRow['id'],
                            ':nama_kementerian' => (string)($m['namaKementerian'] ?? $m['nama_kementerian'] ?? 'KEMENTERIAN AGAMA REPUBLIK INDONESIA'),
                            ':nsm' => (string)($m['nsm'] ?? ''),
                            ':npsn' => (string)($m['npsn'] ?? ''),
                            ':nama_madrasah' => (string)($m['namaMadrasah'] ?? $m['nama_madrasah'] ?? ''),
                            ':nama_singkat' => (string)($m['namaSingkat'] ?? $m['nama_singkat'] ?? $m['namaMadrasah'] ?? ''),
                            ':kemenag_wilayah' => (string)($m['kemenagWilayah'] ?? $m['kemenag_wilayah'] ?? ''),
                            ':alamat' => (string)($m['alamat'] ?? ''),
                            ':kelurahan_desa' => (string)($m['kelurahanDesa'] ?? $m['kelurahan_desa'] ?? ''),
                            ':kecamatan' => (string)($m['kecamatan'] ?? ''),
                            ':kota_kabupaten' => (string)($m['kotaKab'] ?? $m['kota_kabupaten'] ?? ''),
                            ':provinsi' => (string)($m['provinsi'] ?? 'JAWA TENGAH'),
                            ':kode_pos' => (string)($m['kodePos'] ?? $m['kode_pos'] ?? ''),
                            ':telepon' => (string)($m['telepon'] ?? ''),
                            ':email' => (string)($m['email'] ?? ''),
                            ':website' => (string)($m['website'] ?? ''),
                            ':akreditasi' => (string)($m['akreditasi'] ?? 'A'),
                            ':motto' => (string)($m['motto'] ?? ''),
                            ':jabatan_penandatangan' => (string)($m['jabatanPenandatangan'] ?? 'Kepala Madrasah'),
                            ':label_id_penandatangan' => (string)($m['labelIdPenandatangan'] ?? 'NIP'),
                            ':nama_kepala_madrasah' => (string)($m['namaKepalaMadrasah'] ?? $m['nama_kepala_madrasah'] ?? ''),
                            ':nip_kepala_madrasah' => (string)($m['nipKepalaMadrasah'] ?? $m['nip_kepala_madrasah'] ?? ''),
                            ':kota_penetapan' => (string)($m['kotaPenetapan'] ?? $m['kota_penetapan'] ?? ''),
                            ':tanggal_penetapan' => (string)($m['tanggalPenetapan'] ?? $m['tanggal_penetapan'] ?? ''),
                            ':logo_aplikasi_url' => (string)($m['logoAplikasiUrl'] ?? $m['logo_aplikasi_url'] ?? ''),
                            ':logo_kemenag_url' => (string)($m['logoKemenagUrl'] ?? $m['logo_kemenag_url'] ?? ''),
                            ':logo_madrasah_url' => (string)($m['logoMadrasahUrl'] ?? $m['logo_madrasah_url'] ?? ''),
                            ':stempel_url' => (string)($m['stempelUrl'] ?? $m['stempel_url'] ?? ''),
                            ':ttd_kepala_url' => (string)($m['ttdKepalaUrl'] ?? $m['ttd_kepala_url'] ?? ''),
                            ':tahun_pelajaran' => (string)($m['tahunPelajaran'] ?? $m['tahun_pelajaran'] ?? '2025/2026'),
                            ':judul_header_aplikasi' => (string)($m['judulHeaderAplikasi'] ?? $m['judul_header_aplikasi'] ?? 'KARTU PELAJAR DIGITAL'),
                            ':sub_judul_header_aplikasi' => (string)($m['subJudulHeaderAplikasi'] ?? $m['sub_judul_header_aplikasi'] ?? "MI MA'ARIF NU 2 SANGGREMAN"),
                            ':badge_header_aplikasi' => (string)($m['badgeHeaderAplikasi'] ?? $m['badge_header_aplikasi'] ?? 'KEMENAG RI'),
                            ':show_madrasah_in_header' => (isset($m['showMadrasahInHeader']) ? ($m['showMadrasahInHeader'] ? 1 : 0) : 1)
                        ]);
                    } else {
                        $stmtM = $pdo->prepare("INSERT INTO madrasah_info 
                            (id, nama_kementerian, nsm, npsn, nama_madrasah, nama_singkat, kemenag_wilayah, alamat, kelurahan_desa, kecamatan, kota_kabupaten, provinsi, kode_pos, telepon, email, website, akreditasi, motto, jabatan_penandatangan, label_id_penandatangan, nama_kepala_madrasah, nip_kepala_madrasah, kota_penetapan, tanggal_penetapan, logo_aplikasi_url, logo_kemenag_url, logo_madrasah_url, stempel_url, ttd_kepala_url, tahun_pelajaran, judul_header_aplikasi, sub_judul_header_aplikasi, badge_header_aplikasi, show_madrasah_in_header)
                            VALUES (1, :nama_kementerian, :nsm, :npsn, :nama_madrasah, :nama_singkat, :kemenag_wilayah, :alamat, :kelurahan_desa, :kecamatan, :kota_kabupaten, :provinsi, :kode_pos, :telepon, :email, :website, :akreditasi, :motto, :jabatan_penandatangan, :label_id_penandatangan, :nama_kepala_madrasah, :nip_kepala_madrasah, :kota_penetapan, :tanggal_penetapan, :logo_aplikasi_url, :logo_kemenag_url, :logo_madrasah_url, :stempel_url, :ttd_kepala_url, :tahun_pelajaran, :judul_header_aplikasi, :sub_judul_header_aplikasi, :badge_header_aplikasi, :show_madrasah_in_header)
                            ON DUPLICATE KEY UPDATE
                            nama_kementerian=VALUES(nama_kementerian), nsm=VALUES(nsm), npsn=VALUES(npsn), nama_madrasah=VALUES(nama_madrasah), nama_singkat=VALUES(nama_singkat), kemenag_wilayah=VALUES(kemenag_wilayah), alamat=VALUES(alamat), kelurahan_desa=VALUES(kelurahan_desa), kecamatan=VALUES(kecamatan), kota_kabupaten=VALUES(kota_kabupaten), provinsi=VALUES(provinsi), kode_pos=VALUES(kode_pos), telepon=VALUES(telepon), email=VALUES(email), website=VALUES(website), akreditasi=VALUES(akreditasi), motto=VALUES(motto), jabatan_penandatangan=VALUES(jabatan_penandatangan), label_id_penandatangan=VALUES(label_id_penandatangan), nama_kepala_madrasah=VALUES(nama_kepala_madrasah), nip_kepala_madrasah=VALUES(nip_kepala_madrasah), kota_penetapan=VALUES(kota_penetapan), tanggal_penetapan=VALUES(tanggal_penetapan), logo_aplikasi_url=VALUES(logo_aplikasi_url), logo_kemenag_url=VALUES(logo_kemenag_url), logo_madrasah_url=VALUES(logo_madrasah_url), stempel_url=VALUES(stempel_url), ttd_kepala_url=VALUES(ttd_kepala_url), tahun_pelajaran=VALUES(tahun_pelajaran), judul_header_aplikasi=VALUES(judul_header_aplikasi), sub_judul_header_aplikasi=VALUES(sub_judul_header_aplikasi), badge_header_aplikasi=VALUES(badge_header_aplikasi), show_madrasah_in_header=VALUES(show_madrasah_in_header)");
                        
                        $stmtM->execute([
                            ':nama_kementerian' => (string)($m['namaKementerian'] ?? $m['nama_kementerian'] ?? 'KEMENTERIAN AGAMA REPUBLIK INDONESIA'),
                            ':nsm' => (string)($m['nsm'] ?? ''),
                            ':npsn' => (string)($m['npsn'] ?? ''),
                            ':nama_madrasah' => (string)($m['namaMadrasah'] ?? $m['nama_madrasah'] ?? ''),
                            ':nama_singkat' => (string)($m['namaSingkat'] ?? $m['nama_singkat'] ?? $m['namaMadrasah'] ?? ''),
                            ':kemenag_wilayah' => (string)($m['kemenagWilayah'] ?? $m['kemenag_wilayah'] ?? ''),
                            ':alamat' => (string)($m['alamat'] ?? ''),
                            ':kelurahan_desa' => (string)($m['kelurahanDesa'] ?? $m['kelurahan_desa'] ?? ''),
                            ':kecamatan' => (string)($m['kecamatan'] ?? ''),
                            ':kota_kabupaten' => (string)($m['kotaKab'] ?? $m['kota_kabupaten'] ?? ''),
                            ':provinsi' => (string)($m['provinsi'] ?? 'JAWA TENGAH'),
                            ':kode_pos' => (string)($m['kodePos'] ?? $m['kode_pos'] ?? ''),
                            ':telepon' => (string)($m['telepon'] ?? ''),
                            ':email' => (string)($m['email'] ?? ''),
                            ':website' => (string)($m['website'] ?? ''),
                            ':akreditasi' => (string)($m['akreditasi'] ?? 'A'),
                            ':motto' => (string)($m['motto'] ?? ''),
                            ':jabatan_penandatangan' => (string)($m['jabatanPenandatangan'] ?? 'Kepala Madrasah'),
                            ':label_id_penandatangan' => (string)($m['labelIdPenandatangan'] ?? 'NIP'),
                            ':nama_kepala_madrasah' => (string)($m['namaKepalaMadrasah'] ?? $m['nama_kepala_madrasah'] ?? ''),
                            ':nip_kepala_madrasah' => (string)($m['nipKepalaMadrasah'] ?? $m['nip_kepala_madrasah'] ?? ''),
                            ':kota_penetapan' => (string)($m['kotaPenetapan'] ?? $m['kota_penetapan'] ?? ''),
                            ':tanggal_penetapan' => (string)($m['tanggalPenetapan'] ?? $m['tanggal_penetapan'] ?? ''),
                            ':logo_aplikasi_url' => (string)($m['logoAplikasiUrl'] ?? $m['logo_aplikasi_url'] ?? ''),
                            ':logo_kemenag_url' => (string)($m['logoKemenagUrl'] ?? $m['logo_kemenag_url'] ?? ''),
                            ':logo_madrasah_url' => (string)($m['logoMadrasahUrl'] ?? $m['logo_madrasah_url'] ?? ''),
                            ':stempel_url' => (string)($m['stempelUrl'] ?? $m['stempel_url'] ?? ''),
                            ':ttd_kepala_url' => (string)($m['ttdKepalaUrl'] ?? $m['ttd_kepala_url'] ?? ''),
                            ':tahun_pelajaran' => (string)($m['tahunPelajaran'] ?? $m['tahun_pelajaran'] ?? '2025/2026'),
                            ':judul_header_aplikasi' => (string)($m['judulHeaderAplikasi'] ?? $m['judul_header_aplikasi'] ?? 'KARTU PELAJAR DIGITAL'),
                            ':sub_judul_header_aplikasi' => (string)($m['subJudulHeaderAplikasi'] ?? $m['sub_judul_header_aplikasi'] ?? "MI MA'ARIF NU 2 SANGGREMAN"),
                            ':badge_header_aplikasi' => (string)($m['badgeHeaderAplikasi'] ?? $m['badge_header_aplikasi'] ?? 'KEMENAG RI'),
                            ':show_madrasah_in_header' => (isset($m['showMadrasahInHeader']) ? ($m['showMadrasahInHeader'] ? 1 : 0) : 1)
                        ]);
                    }
                }

                // 2. Simpan Pengaturan Desain Kartu & Loader
                if (isset($input['cardConfig']) && is_array($input['cardConfig'])) {
                    $theme = (string)($input['cardConfig']['theme'] ?? 'kemenag-green');
                    try {
                        $pdo->exec("CREATE TABLE IF NOT EXISTS `pengaturan_kartu` (
                            `id` int(11) NOT NULL AUTO_INCREMENT,
                            `theme` varchar(50) DEFAULT 'kemenag-green',
                            `config_json` longtext DEFAULT NULL,
                            `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            PRIMARY KEY (`id`)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

                        $cfgJson = json_encode($input['cardConfig'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                        $stmtConf = $pdo->prepare("INSERT INTO `pengaturan_kartu` (`id`, `theme`, `config_json`, `updated_at`) VALUES (1, :theme, :cfg, NOW()) ON DUPLICATE KEY UPDATE `theme`=VALUES(`theme`), `config_json`=VALUES(`config_json`), `updated_at`=NOW()");
                        $stmtConf->execute([
                            ':theme' => $theme,
                            ':cfg' => $cfgJson
                        ]);
                        $pdo->prepare("UPDATE `pengaturan_kartu` SET `theme`=:theme, `config_json`=:cfg, `updated_at`=NOW()")->execute([
                            ':theme' => $theme,
                            ':cfg' => $cfgJson
                        ]);
                    } catch (Exception $eConf) {
                        $mysqlError = ($mysqlError ? $mysqlError . '; ' : '') . 'Config save error: ' . $eConf->getMessage();
                    }
                }

                // 3. Simpan Siswa
                if (isset($input['students']) && is_array($input['students'])) {
                    $pdo->beginTransaction();
                    $incomingIds = [];
                    foreach ($input['students'] as $s) {
                        if (!empty($s['id'])) $incomingIds[] = (string)$s['id'];
                    }

                    if (!empty($incomingIds)) {
                        $inPlaceholders = implode(',', array_fill(0, count($incomingIds), '?'));
                        $stmtDel = $pdo->prepare("DELETE FROM siswa WHERE id NOT IN ($inPlaceholders)");
                        $stmtDel->execute($incomingIds);
                    } else if (!empty($input['isExplicitClear']) || (isset($input['action']) && $input['action'] === 'clear_students')) {
                        $pdo->exec("DELETE FROM siswa");
                    }

                    $stmt = $pdo->prepare("INSERT INTO siswa 
                        (id, nisn, nis, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, kelas, tahun_ajaran, agama, alamat, nama_wali, golongan_darah, foto_url, berlaku_sampai, status)
                        VALUES 
                        (:id, :nisn, :nis, :nama, :tempat_lahir, :tanggal_lahir, :jenis_kelamin, :kelas, :tahun_ajaran, :agama, :alamat, :nama_wali, :golongan_darah, :foto_url, :berlaku_sampai, 'aktif')
                        ON DUPLICATE KEY UPDATE 
                        nisn=:nisn, nis=:nis, nama=:nama, tempat_lahir=:tempat_lahir, tanggal_lahir=:tanggal_lahir, jenis_kelamin=:jenis_kelamin, kelas=:kelas, tahun_ajaran=:tahun_ajaran, agama=:agama, alamat=:alamat, nama_wali=:nama_wali, golongan_darah=:golongan_darah, foto_url=:foto_url, berlaku_sampai=:berlaku_sampai, status='aktif'");
                    
                    foreach ($input['students'] as $s) {
                        $stmt->execute([
                            ':id' => (string)($s['id'] ?? uniqid('std_')),
                            ':nisn' => (string)($s['nisn'] ?? ''),
                            ':nis' => (string)($s['nis'] ?? ''),
                            ':nama' => (string)($s['nama'] ?? ''),
                            ':tempat_lahir' => (string)($s['tempatLahir'] ?? $s['tempat_lahir'] ?? ''),
                            ':tanggal_lahir' => (string)($s['tanggalLahir'] ?? $s['tanggal_lahir'] ?? ''),
                            ':jenis_kelamin' => (string)($s['jenisKelamin'] ?? $s['jenis_kelamin'] ?? 'L'),
                            ':kelas' => (string)($s['kelas'] ?? 'I'),
                            ':tahun_ajaran' => (string)($s['tahunAjaran'] ?? $s['tahun_ajaran'] ?? '2025/2026'),
                            ':agama' => (string)($s['agama'] ?? 'Islam'),
                            ':alamat' => (string)($s['alamat'] ?? ''),
                            ':nama_wali' => (string)($s['namaWali'] ?? $s['nama_wali'] ?? ''),
                            ':golongan_darah' => (string)($s['golonganDarah'] ?? $s['golongan_darah'] ?? '-'),
                            ':foto_url' => (string)($s['fotoUrl'] ?? $s['foto_url'] ?? ''),
                            ':berlaku_sampai' => (string)($s['berlakuSampai'] ?? $s['berlaku_sampai'] ?? 'Selama Menjadi Siswa')
                        ]);
                    }
                    $pdo->commit();
                }
            }
        }
    } catch (Exception $e) {
        if (isset($pdo) && $pdo && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        $mysqlError = $e->getMessage();
        error_log("MySQL sync error: " . $mysqlError);
    }

    $totalStudents = isset($input['students']) ? count($input['students']) : (isset($merged['students']) ? count($merged['students']) : 0);

    echo json_encode([
        'success' => true,
        'mysqlConnected' => (isset($pdo) && $pdo !== null),
        'mysqlError' => isset($mysqlError) ? $mysqlError : null,
        'message' => !empty($mysqlError) ? 'Data dicadangkan ke JSON lokal, MySQL error: ' . $mysqlError : 'Data aplikasi berhasil disinkronkan ke database MySQL pusat',
        'lastUpdated' => $lastUpdated,
        'totalStudents' => $totalStudents
    ]);
    exit;
}
