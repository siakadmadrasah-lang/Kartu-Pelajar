<?php
/**
 * ==============================================================================
 * KONFIGURASI DATABASE MYSQL PLESK (PROTEKSI ANTI-HILANG DATA OTOMATIS)
 * Aplikasi: Generator Kartu Pelajar MI (Kemenag RI)
 * ==============================================================================
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Tangani preflight request OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 1. Cek konfigurasi kustom persisten jika ada (TIDAK PERNAH DITIMPA SAAT TIMPA FILE ZIP DI CPANEL ATAU PLESK)
$persistentConfigFiles = [
    __DIR__ . '/config.local.php',
    __DIR__ . '/data/db_custom_config.php',
    __DIR__ . '/data/installed_config.php',
    dirname(__DIR__) . '/config.local.php',
    dirname(__DIR__) . '/db_custom_config.php',
];
foreach ($persistentConfigFiles as $pConfigFile) {
    if (file_exists($pConfigFile)) {
        @include_once $pConfigFile;
        break;
    }
}

// 2. Kredensial MySQL Plesk / cPanel
if (!defined('DB_HOST')) define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
if (!defined('DB_NAME')) define('DB_NAME', getenv('DB_DATABASE') ?: 'jaenal_kartupelajar');
if (!defined('DB_USER')) define('DB_USER', getenv('DB_USERNAME') ?: 'jaenal_kartupelajar');
if (!defined('DB_PASS')) define('DB_PASS', getenv('DB_PASSWORD') ?: 'masbagus15');
if (!defined('DB_PORT')) define('DB_PORT', getenv('DB_PORT') ?: '3306');
if (!defined('DB_CHARSET')) define('DB_CHARSET', 'utf8mb4');

if (!function_exists('safeAddColumn')) {
    function safeAddColumn($pdo, $table, $column, $typeAndDefault) {
        try {
            $stmt = $pdo->query("SHOW COLUMNS FROM `$table` LIKE '$column'");
            if ($stmt && $stmt->rowCount() === 0) {
                $pdo->exec("ALTER TABLE `$table` ADD COLUMN `$column` $typeAndDefault");
            }
        } catch (Exception $e) {}
    }
}

/**
 * Mendapatkan koneksi PDO MySQL dengan fallback kredensial otomatis & inisialisasi tabel/kolom
 */
function getDbConnection() {
    static $pdo = null;
    static $attempted = false;
    if ($attempted) {
        return $pdo;
    }
    $attempted = true;

    // Daftar kandidat koneksi MySQL: Prioritas 1 dari config, disusul kredensial teruji
    $connectionCandidates = [
        [
            'host' => DB_HOST,
            'name' => DB_NAME,
            'user' => DB_USER,
            'pass' => DB_PASS,
            'port' => DB_PORT,
        ],
        [
            'host' => '127.0.0.1',
            'name' => DB_NAME,
            'user' => DB_USER,
            'pass' => DB_PASS,
            'port' => DB_PORT,
        ],
        [
            'host' => 'localhost',
            'name' => 'jaenal_kartupelajar',
            'user' => 'jaenal_kartupelajar',
            'pass' => 'masbagus15',
            'port' => '3306',
        ],
        [
            'host' => '127.0.0.1',
            'name' => 'jaenal_kartupelajar',
            'user' => 'jaenal_kartupelajar',
            'pass' => 'masbagus15',
            'port' => '3306',
        ],
        [
            'host' => 'localhost',
            'name' => 'kartu_pelajar_mi',
            'user' => 'jaenal_kartupelajar',
            'pass' => 'masbagus15',
            'port' => '3306',
        ],
        [
            'host' => 'localhost',
            'name' => 'kartu_pelajar_mi',
            'user' => 'admin_madrasah',
            'pass' => 'Madrasah@2026!',
            'port' => '3306',
        ],
        [
            'host' => 'localhost',
            'name' => 'kartu_pelajar_mi',
            'user' => 'root',
            'pass' => '',
            'port' => '3306',
        ],
    ];

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    foreach ($connectionCandidates as $cand) {
        try {
            $dsn = "mysql:host=" . $cand['host'] . ";dbname=" . $cand['name'] . ";charset=" . DB_CHARSET . ";port=" . $cand['port'];
            $testPdo = new PDO($dsn, $cand['user'], $cand['pass'], $options);
            if ($testPdo) {
                $pdo = $testPdo;

                // Jika terhubung via kandidat alternatif, simpan permanen ke config.local.php
                if ($cand['user'] !== DB_USER || $cand['name'] !== DB_NAME) {
                    $localConfigContent = "<?php\n"
                        . "if (!defined('DB_HOST')) define('DB_HOST', " . var_export($cand['host'], true) . ");\n"
                        . "if (!defined('DB_NAME')) define('DB_NAME', " . var_export($cand['name'], true) . ");\n"
                        . "if (!defined('DB_USER')) define('DB_USER', " . var_export($cand['user'], true) . ");\n"
                        . "if (!defined('DB_PASS')) define('DB_PASS', " . var_export($cand['pass'], true) . ");\n"
                        . "if (!defined('DB_PORT')) define('DB_PORT', " . var_export($cand['port'], true) . ");\n";
                    @file_put_contents(__DIR__ . '/config.local.php', $localConfigContent);
                }
                break;
            }
        } catch (PDOException $e) {
            // Lanjut ke kandidat berikutnya
            continue;
        }
    }

    if (!$pdo) {
        return null;
    }

    try {
        // 1. Pastikan tabel madrasah_info sudah tercipta
        $pdo->exec("CREATE TABLE IF NOT EXISTS madrasah_info (
          id INT(11) NOT NULL AUTO_INCREMENT,
          nama_kementerian VARCHAR(255) DEFAULT 'KEMENTERIAN AGAMA REPUBLIK INDONESIA',
          nsm VARCHAR(50) NOT NULL,
          npsn VARCHAR(50) NOT NULL,
          nama_madrasah VARCHAR(255) NOT NULL,
          nama_singkat VARCHAR(100) DEFAULT NULL,
          kemenag_wilayah VARCHAR(255) DEFAULT NULL,
          alamat TEXT DEFAULT NULL,
          kelurahan_desa VARCHAR(100) DEFAULT NULL,
          kecamatan VARCHAR(100) DEFAULT NULL,
          kota_kabupaten VARCHAR(100) DEFAULT NULL,
          provinsi VARCHAR(100) DEFAULT 'JAWA TENGAH',
          kode_pos VARCHAR(20) DEFAULT NULL,
          telepon VARCHAR(50) DEFAULT NULL,
          email VARCHAR(100) DEFAULT NULL,
          website VARCHAR(150) DEFAULT NULL,
          akreditasi VARCHAR(20) DEFAULT 'A',
          motto VARCHAR(255) DEFAULT NULL,
          jabatan_penandatangan VARCHAR(100) DEFAULT 'Kepala Madrasah',
          label_id_penandatangan VARCHAR(50) DEFAULT 'NIP',
          nama_kepala_madrasah VARCHAR(255) DEFAULT NULL,
          nip_kepala_madrasah VARCHAR(100) DEFAULT NULL,
          kota_penetapan VARCHAR(100) DEFAULT NULL,
          tanggal_penetapan VARCHAR(100) DEFAULT NULL,
          logo_aplikasi_url LONGTEXT DEFAULT NULL,
          logo_kemenag_url LONGTEXT DEFAULT NULL,
          logo_madrasah_url LONGTEXT DEFAULT NULL,
          stempel_url LONGTEXT DEFAULT NULL,
          ttd_kepala_url LONGTEXT DEFAULT NULL,
          tahun_pelajaran VARCHAR(50) DEFAULT '2025/2026',
          judul_header_aplikasi VARCHAR(255) DEFAULT 'KARTU PELAJAR DIGITAL',
          sub_judul_header_aplikasi VARCHAR(255) DEFAULT \"MI MA'ARIF NU 2 SANGGREMAN\",
          badge_header_aplikasi VARCHAR(100) DEFAULT 'KEMENAG RI',
          show_madrasah_in_header TINYINT(1) DEFAULT 1,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        // 2. Universal Schema Migration (kompatibel semua versi MySQL & MariaDB)
        safeAddColumn($pdo, 'madrasah_info', 'nama_kementerian', "VARCHAR(255) DEFAULT 'KEMENTERIAN AGAMA REPUBLIK INDONESIA'");
        safeAddColumn($pdo, 'madrasah_info', 'nama_singkat', "VARCHAR(100) DEFAULT NULL");
        safeAddColumn($pdo, 'madrasah_info', 'kemenag_wilayah', "VARCHAR(255) DEFAULT NULL");
        safeAddColumn($pdo, 'madrasah_info', 'tahun_pelajaran', "VARCHAR(50) DEFAULT '2025/2026'");
        safeAddColumn($pdo, 'madrasah_info', 'judul_header_aplikasi', "VARCHAR(255) DEFAULT 'KARTU PELAJAR DIGITAL'");
        safeAddColumn($pdo, 'madrasah_info', 'sub_judul_header_aplikasi', "VARCHAR(255) DEFAULT \"MI MA'ARIF NU 2 SANGGREMAN\"");
        safeAddColumn($pdo, 'madrasah_info', 'badge_header_aplikasi', "VARCHAR(100) DEFAULT 'KEMENAG RI'");
        safeAddColumn($pdo, 'madrasah_info', 'show_madrasah_in_header', "TINYINT(1) DEFAULT 1");
        safeAddColumn($pdo, 'madrasah_info', 'label_id_penandatangan', "VARCHAR(50) DEFAULT 'NIP'");
        safeAddColumn($pdo, 'madrasah_info', 'updated_at', "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

        // 3. Pastikan tabel siswa sudah tercipta
        $pdo->exec("CREATE TABLE IF NOT EXISTS siswa (
          id VARCHAR(64) NOT NULL,
          nisn VARCHAR(30) NOT NULL,
          nis VARCHAR(30) DEFAULT NULL,
          nama VARCHAR(255) NOT NULL,
          tempat_lahir VARCHAR(100) DEFAULT NULL,
          tanggal_lahir VARCHAR(100) DEFAULT NULL,
          jenis_kelamin ENUM('L','P') DEFAULT 'L',
          kelas VARCHAR(50) NOT NULL,
          tahun_ajaran VARCHAR(30) DEFAULT '2025/2026',
          agama VARCHAR(50) DEFAULT 'Islam',
          alamat TEXT DEFAULT NULL,
          nama_wali VARCHAR(255) DEFAULT NULL,
          golongan_darah VARCHAR(10) DEFAULT '-',
          foto_url LONGTEXT DEFAULT NULL,
          berlaku_sampai VARCHAR(100) DEFAULT 'Selama Menjadi Siswa',
          status ENUM('aktif','alumni','mutasi') DEFAULT 'aktif',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          INDEX (nisn),
          INDEX (kelas)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        // 4. Pastikan tabel pengaturan_kartu sudah tercipta
        $pdo->exec("CREATE TABLE IF NOT EXISTS pengaturan_kartu (
          id INT(11) NOT NULL AUTO_INCREMENT,
          theme VARCHAR(50) DEFAULT 'kemenag-green',
          config_json LONGTEXT DEFAULT NULL,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        // 5. Inisialisasi baris Profil Madrasah jika belum ada
        $checkM = $pdo->query("SELECT COUNT(*) FROM madrasah_info")->fetchColumn();
        if ((int)$checkM === 0) {
            $stmtInitM = $pdo->prepare("INSERT INTO madrasah_info (
                id, nama_kementerian, nsm, npsn, nama_madrasah, nama_singkat, kemenag_wilayah, alamat, 
                kelurahan_desa, kecamatan, kota_kabupaten, provinsi, kode_pos, telepon, email, 
                website, akreditasi, motto, jabatan_penandatangan, label_id_penandatangan, 
                nama_kepala_madrasah, nip_kepala_madrasah, kota_penetapan, tanggal_penetapan, 
                tahun_pelajaran, judul_header_aplikasi, sub_judul_header_aplikasi, badge_header_aplikasi, show_madrasah_in_header
            ) VALUES (
                1, 'KEMENTERIAN AGAMA REPUBLIK INDONESIA', '111233020084', '60721868', 'MI MA\'ARIF NU 2 SANGGREMAN', 'MI MA\'ARIF NU 2 SANGGREMAN',
                'KANTOR KEMENTERIAN AGAMA KABUPATEN BANYUMAS', 'Jl. Sanggreman No. 02, Desa Sanggreman', 'Sanggreman', 'Rawalo',
                'Kab. Banyumas', 'JAWA TENGAH', '53173', '(0281) 684-1234', 'mimaarifnu2sanggreman@gmail.com',
                'www.mimaarifnu2sanggreman.sch.id', 'A', 'Berakhlakul Karimah, Cerdas, Mandiri, dan Berprestasi',
                'Kepala Madrasah', 'NIP', 'Siti Rochimah, S.Pd.I', '197605122005012001', 'Banyumas', '15 Juli 2025',
                '2025/2026', 'KARTU PELAJAR DIGITAL', 'MI MA\'ARIF NU 2 SANGGREMAN', 'KEMENAG RI', 1
            )");
            $stmtInitM->execute();
        }

        return $pdo;
    } catch (PDOException $e) {
        error_log("Database schema auto-heal warning: " . $e->getMessage());
        return $pdo;
    }
}
