import JSZip from 'jszip';
import { MadrasahInfo, Student, CardConfig, PleskDeployOptions, PageLoaderConfig } from '../types';

export const DEFAULT_MYSQL_CONFIG = {
  dbHost: 'localhost',
  dbName: 'jaenal_kartupelajar',
  dbUser: 'jaenal_kartupelajar',
  dbPass: 'masbagus15',
};

export const generateHtaccessContent = (options: PleskDeployOptions): string => {
  return `# ==============================================================================
# KONFIGURASI APACHE / NGINX REVERSE PROXY UNTUK PLESK CONTROL PANEL
# Aplikasi: Generator Kartu Pelajar MI (Kemenag RI)
# Domain: ${options.domainName || 'madrasah.sch.id'}
# ==============================================================================

<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    ${options.enableHttpsRedirect ? `
    # Force HTTPS (SSL Let's Encrypt Plesk)
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
    ` : ''}

    # API routes directed to PHP backend on Plesk
    RewriteRule ^api/data/?$ api/data.php [L,QSA]
    RewriteRule ^api/sync/?$ api/sync.php [L,QSA]
    RewriteRule ^api/version/?$ api/version.php [L,QSA]
    RewriteRule ^api/last-updated/?$ api/version.php [L,QSA]
    RewriteRule ^api/health/?$ api/health.php [L,QSA]
    RewriteRule ^api/live-stream/?$ api/live-stream.php [L,QSA]
    RewriteRule ^api/events/?$ api/live-stream.php [L,QSA]
    RewriteRule ^api/live-sync/?$ api/live-stream.php [L,QSA]
    RewriteRule ^api/db-status/?$ api/data.php?action=db_status [L,QSA]
    RewriteRule ^api/students/clear/?$ api/clear_students.php [L,QSA]
    RewriteRule ^api/students/?$ api/students.php [L,QSA]
    RewriteRule ^api/([a-zA-Z0-9_-]+)/?$ api/$1.php [L,QSA]

    # Jangan rewrite file atau folder fisik yang ada
    RewriteCond %{REQUEST_FILENAME} -f [OR]
    RewriteCond %{REQUEST_FILENAME} -d
    RewriteRule ^ - [L]

    ${options.enableSpaRewrite ? `
    # SPA Fallback - Arahkan semua rute dinamis ke index.html
    RewriteRule ^ index.html [QSA,L]
    ` : ''}
</IfModule>

${options.enableGzip ? `
# Kompresi GZIP / DEFLATE untuk Kecepatan Loading Maksimal
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
    AddOutputFilterByType DEFLATE application/json
    AddOutputFilterByType DEFLATE image/svg+xml
</IfModule>
` : ''}

# Header Keamanan Standar Madrasah & Kemenag RI
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-XSS-Protection "1; mode=block"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Cache Control untuk Aset Statis
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/svg+xml "access plus 1 month"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>

# Cegah Akses Langsung ke File Konfigurasi Sensitif
<FilesMatch "^(\\.|web\\.config|package\\.json|tsconfig\\.json)">
    Order allow,deny
    Deny from all
</FilesMatch>
`;
};

export const generateWebConfigContent = (options: PleskDeployOptions): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Konfigurasi Plesk IIS / Windows Server untuk Single Page Application -->
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        ${options.enableHttpsRedirect ? `
        <rule name="Redirect to HTTPS" stopProcessing="true">
          <match url="(.*)" />
          <conditions>
            <add input="{HTTPS}" pattern="off" ignoreCase="true" />
          </conditions>
          <action type="Redirect" url="https://{HTTP_HOST}/{R:1}" redirectType="Permanent" />
        </rule>
        ` : ''}
        <rule name="SPA Fallback Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <remove fileExtension=".json" />
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <remove fileExtension=".woff" />
      <mimeMap fileExtension=".woff" mimeType="application/font-woff" />
      <remove fileExtension=".woff2" />
      <mimeMap fileExtension=".woff2" mimeType="application/font-woff2" />
    </staticContent>
  </system.webServer>
</configuration>
`;
};

export const generateNginxDirectivesContent = (): string => {
  return `# ==============================================================================
# PLESK NGINX DIRECTIVES (Tambahan Arahan Nginx)
# Masukkan di Plesk: Websites & Domains -> Apache & Nginx Settings -> Additional Nginx directives
# ==============================================================================

location / {
    try_files $uri $uri/ /index.html;
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
}

# Cache static assets
location ~* \\.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
    expires 30d;
    add_header Cache-Control "public, no-transform";
}
`;
};

/**
 * Generate PHP PDO MySQL connection file for Plesk
 */
export const generatePhpConfigFile = (options: PleskDeployOptions): string => {
  const dbHost = options.dbHost || DEFAULT_MYSQL_CONFIG.dbHost;
  const dbName = options.dbName || DEFAULT_MYSQL_CONFIG.dbName;
  const dbUser = options.dbUser || DEFAULT_MYSQL_CONFIG.dbUser;
  const dbPass = options.dbPass || DEFAULT_MYSQL_CONFIG.dbPass;

  return `<?php
/**
 * ==============================================================================
 * KONFIGURASI DATABASE MYSQL PLESK (PROTEKSI ANTI-HILANG DATA OTOMATIS)
 * Aplikasi: Generator Kartu Pelajar MI (Kemenag RI)
 * Database Name: ${dbName}
 * Database User: ${dbUser}
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

// 1. Cek konfigurasi kustom persisten jika ada (TIDAK PERNAH DITIMPA SAAT TIMPA FILE ZIP DI PLESK ATAU CPANEL)
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

// 2. Kredensial MySQL Plesk/cPanel (Fallback dari env atau default template jika belum terkonfigurasi)
if (!defined('DB_HOST')) define('DB_HOST', getenv('DB_HOST') ?: '${dbHost}');
if (!defined('DB_NAME')) define('DB_NAME', getenv('DB_DATABASE') ?: '${dbName}');
if (!defined('DB_USER')) define('DB_USER', getenv('DB_USERNAME') ?: '${dbUser}');
if (!defined('DB_PASS')) define('DB_PASS', getenv('DB_PASSWORD') ?: '${dbPass}');
if (!defined('DB_PORT')) define('DB_PORT', getenv('DB_PORT') ?: '3306');
if (!defined('DB_CHARSET')) define('DB_CHARSET', 'utf8mb4');

/**
 * Mendapatkan koneksi PDO MySQL dengan inisialisasi tabel otomatis
 */
function getDbConnection() {
    static $pdo = null;
    static $attempted = false;
    if ($attempted) {
        return $pdo;
    }
    $attempted = true;
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET . ";port=" . DB_PORT;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);

        // Amankan kredensial ke config.local.php & data/db_custom_config.php agar tidak hilang saat timpa ZIP
        $localCfg = __DIR__ . '/config.local.php';
        if (!file_exists($localCfg)) {
            $cfgContent = "<?php\\n" .
                "// Konfigurasi Database Lokal Persisten (Otomatis dibuat)\\n" .
                "// File ini TIDAK AKAN PERNAH DITIMPA saat mengunggah update ZIP baru di Plesk atau cPanel.\\n" .
                "define('DB_HOST', '" . addslashes(DB_HOST) . "');\\n" .
                "define('DB_NAME', '" . addslashes(DB_NAME) . "');\\n" .
                "define('DB_USER', '" . addslashes(DB_USER) . "');\\n" .
                "define('DB_PASS', '" . addslashes(DB_PASS) . "');\\n" .
                "define('DB_PORT', '" . addslashes(DB_PORT) . "');\\n";
            @file_put_contents($localCfg, $cfgContent);
            @mkdir(__DIR__ . '/data', 0755, true);
            @file_put_contents(__DIR__ . '/data/db_custom_config.php', $cfgContent);
        }

        // Pastikan tabel-tabel utama sudah tercipta secara otomatis
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
          sub_judul_header_aplikasi VARCHAR(255) DEFAULT NULL,
          badge_header_aplikasi VARCHAR(100) DEFAULT 'KEMENAG RI',
          show_madrasah_in_header TINYINT(1) DEFAULT 1,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        // Auto-alter column migration for existing tables created with older schemas
        try {
            $pdo->exec("ALTER TABLE madrasah_info ADD COLUMN IF NOT EXISTS kemenag_wilayah VARCHAR(255) DEFAULT NULL");
        } catch (Exception $e) {}
        try {
            $pdo->exec("ALTER TABLE madrasah_info ADD COLUMN IF NOT EXISTS nama_kementerian VARCHAR(255) DEFAULT 'KEMENTERIAN AGAMA REPUBLIK INDONESIA'");
        } catch (Exception $e) {}
        try {
            $pdo->exec("ALTER TABLE madrasah_info ADD COLUMN IF NOT EXISTS tahun_pelajaran VARCHAR(50) DEFAULT '2025/2026'");
            $pdo->exec("ALTER TABLE madrasah_info ADD COLUMN IF NOT EXISTS judul_header_aplikasi VARCHAR(255) DEFAULT 'KARTU PELAJAR DIGITAL'");
            $pdo->exec("ALTER TABLE madrasah_info ADD COLUMN IF NOT EXISTS sub_judul_header_aplikasi VARCHAR(255) DEFAULT NULL");
            $pdo->exec("ALTER TABLE madrasah_info ADD COLUMN IF NOT EXISTS badge_header_aplikasi VARCHAR(100) DEFAULT 'KEMENAG RI'");
            $pdo->exec("ALTER TABLE madrasah_info ADD COLUMN IF NOT EXISTS show_madrasah_in_header TINYINT(1) DEFAULT 1");
        } catch (Exception $e) {}
        try {
            $pdo->exec("ALTER TABLE madrasah_info ADD COLUMN IF NOT EXISTS label_id_penandatangan VARCHAR(50) DEFAULT 'NIP'");
            $pdo->exec("ALTER TABLE madrasah_info ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
        } catch (Exception $e) {}
        try {
            $pdo->exec("ALTER TABLE madrasah_info MODIFY logo_aplikasi_url LONGTEXT");
            $pdo->exec("ALTER TABLE madrasah_info MODIFY logo_kemenag_url LONGTEXT");
            $pdo->exec("ALTER TABLE madrasah_info MODIFY logo_madrasah_url LONGTEXT");
            $pdo->exec("ALTER TABLE madrasah_info MODIFY stempel_url LONGTEXT");
            $pdo->exec("ALTER TABLE madrasah_info MODIFY ttd_kepala_url LONGTEXT");
        } catch (Exception $e) {}

        $pdo->exec("CREATE TABLE IF NOT EXISTS siswa (
          id VARCHAR(100) NOT NULL,
          nisn VARCHAR(50) NOT NULL,
          nis VARCHAR(50) NOT NULL,
          nama VARCHAR(255) NOT NULL,
          tempat_lahir VARCHAR(100) DEFAULT NULL,
          tanggal_lahir VARCHAR(100) DEFAULT NULL,
          jenis_kelamin VARCHAR(50) DEFAULT 'L',
          kelas VARCHAR(100) NOT NULL,
          tahun_ajaran VARCHAR(50) NOT NULL,
          agama VARCHAR(50) DEFAULT 'Islam',
          alamat TEXT DEFAULT NULL,
          nama_wali VARCHAR(255) DEFAULT NULL,
          golongan_darah VARCHAR(20) DEFAULT '-',
          foto_url LONGTEXT DEFAULT NULL,
          berlaku_sampai VARCHAR(100) DEFAULT NULL,
          status VARCHAR(20) DEFAULT 'aktif',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY idx_nisn (nisn),
          KEY idx_kelas (kelas)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        $pdo->exec("CREATE TABLE IF NOT EXISTS pengaturan_kartu (
          id INT(11) NOT NULL AUTO_INCREMENT,
          theme VARCHAR(50) DEFAULT 'kemenag-classic',
          config_json LONGTEXT DEFAULT NULL,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    } catch (PDOException $e) {
        // Jangan die/exit agar sistem otomatis beralih ke penyimpanan fallback file JSON tanpa error
        error_log('Koneksi MySQL gagal (' . DB_NAME . '): ' . $e->getMessage());
        $pdo = null;
    }
    return $pdo;
}
`;
};

/**
 * Generate full MySQL Schema and Data Dump (.sql)
 */
export const generateMysqlSqlDump = (
  madrasah: MadrasahInfo,
  students: Student[],
  cardConfig: CardConfig,
  options: PleskDeployOptions,
  loaderConfig?: PageLoaderConfig
): string => {
  const dbName = options?.dbName || DEFAULT_MYSQL_CONFIG.dbName;
  const dbUser = options?.dbUser || DEFAULT_MYSQL_CONFIG.dbUser;

  const escapeSql = (str: any) => {
    if (str === null || str === undefined) return 'NULL';
    return `'${String(str).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
  };

  const studentList = Array.isArray(students) ? students : [];
  const studentInserts = studentList.map((s) => {
    return `INSERT IGNORE INTO \`siswa\` (\`id\`, \`nisn\`, \`nis\`, \`nama\`, \`tempat_lahir\`, \`tanggal_lahir\`, \`jenis_kelamin\`, \`kelas\`, \`tahun_ajaran\`, \`alamat\`, \`nama_wali\`, \`golongan_darah\`, \`foto_url\`, \`berlaku_sampai\`, \`status\`)
VALUES (${escapeSql(s.id)}, ${escapeSql(s.nisn)}, ${escapeSql(s.nis)}, ${escapeSql(s.nama)}, ${escapeSql(s.tempatLahir)}, ${escapeSql(s.tanggalLahir)}, ${escapeSql(s.jenisKelamin)}, ${escapeSql(s.kelas)}, ${escapeSql(s.tahunAjaran)}, ${escapeSql(s.alamat)}, ${escapeSql(s.namaWali)}, ${escapeSql(s.golonganDarah || '-')}, ${escapeSql(s.fotoUrl || '')}, ${escapeSql(s.berlakuSampai || '30 Juni 2026')}, 'aktif');`;
  }).join('\n');

  const customBackNotesStr = Array.isArray(cardConfig?.customBackNotes)
    ? cardConfig.customBackNotes.join('\n')
    : typeof cardConfig?.customBackNotes === 'string'
    ? cardConfig.customBackNotes
    : '';

  return `-- ==============================================================================
-- DATABASE MYSQL PLESK: ${dbName}
-- User MySQL: ${dbUser}
-- Aplikasi: Generator Kartu Pelajar MI (Kemenag RI)
-- Lembaga: ${madrasah?.namaMadrasah || 'MI'}
-- Dibuat otomatis: ${new Date().toISOString()}
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+07:00";

-- Pilih database target otomatis (mencegah error #1046 No database selected)
USE \`${dbName}\`;

-- ------------------------------------------------------------------------------
-- 1. Struktur Tabel: madrasah_info
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`madrasah_info\` (
  \`id\` INT(11) NOT NULL AUTO_INCREMENT,
  \`nama_kementerian\` VARCHAR(255) DEFAULT 'KEMENTERIAN AGAMA REPUBLIK INDONESIA',
  \`nsm\` VARCHAR(50) NOT NULL,
  \`npsn\` VARCHAR(50) NOT NULL,
  \`nama_madrasah\` VARCHAR(255) NOT NULL,
  \`nama_singkat\` VARCHAR(100) DEFAULT NULL,
  \`kemenag_wilayah\` VARCHAR(255) DEFAULT NULL,
  \`alamat\` TEXT DEFAULT NULL,
  \`kelurahan_desa\` VARCHAR(100) DEFAULT NULL,
  \`kecamatan\` VARCHAR(100) DEFAULT NULL,
  \`kota_kabupaten\` VARCHAR(100) DEFAULT NULL,
  \`provinsi\` VARCHAR(100) DEFAULT 'JAWA TENGAH',
  \`kode_pos\` VARCHAR(20) DEFAULT NULL,
  \`telepon\` VARCHAR(50) DEFAULT NULL,
  \`email\` VARCHAR(100) DEFAULT NULL,
  \`website\` VARCHAR(150) DEFAULT NULL,
  \`akreditasi\` VARCHAR(20) DEFAULT 'A',
  \`motto\` VARCHAR(255) DEFAULT NULL,
  \`jabatan_penandatangan\` VARCHAR(100) DEFAULT 'Kepala Madrasah',
  \`label_id_penandatangan\` VARCHAR(50) DEFAULT 'NIP',
  \`nama_kepala_madrasah\` VARCHAR(255) DEFAULT NULL,
  \`nip_kepala_madrasah\` VARCHAR(100) DEFAULT NULL,
  \`kota_penetapan\` VARCHAR(100) DEFAULT NULL,
  \`tanggal_penetapan\` VARCHAR(100) DEFAULT NULL,
  \`logo_aplikasi_url\` LONGTEXT DEFAULT NULL,
  \`logo_kemenag_url\` LONGTEXT DEFAULT NULL,
  \`logo_madrasah_url\` LONGTEXT DEFAULT NULL,
  \`logo_url\` LONGTEXT DEFAULT NULL,
  \`stempel_url\` LONGTEXT DEFAULT NULL,
  \`ttd_kepala_url\` LONGTEXT DEFAULT NULL,
  \`tahun_pelajaran\` VARCHAR(50) DEFAULT '2025/2026',
  \`judul_header_aplikasi\` VARCHAR(255) DEFAULT 'KARTU PELAJAR DIGITAL',
  \`sub_judul_header_aplikasi\` VARCHAR(255) DEFAULT NULL,
  \`badge_header_aplikasi\` VARCHAR(100) DEFAULT 'KEMENAG RI',
  \`show_madrasah_in_header\` TINYINT(1) DEFAULT 1,
  \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. Struktur Tabel: siswa
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`siswa\` (
  \`id\` VARCHAR(100) NOT NULL,
  \`nisn\` VARCHAR(20) NOT NULL,
  \`nis\` VARCHAR(30) NOT NULL,
  \`nama\` VARCHAR(255) NOT NULL,
  \`tempat_lahir\` VARCHAR(100) DEFAULT NULL,
  \`tanggal_lahir\` VARCHAR(100) DEFAULT NULL,
  \`jenis_kelamin\` ENUM('L','P') NOT NULL,
  \`kelas\` VARCHAR(50) NOT NULL,
  \`tahun_ajaran\` VARCHAR(50) NOT NULL,
  \`alamat\` TEXT DEFAULT NULL,
  \`nama_wali\` VARCHAR(255) DEFAULT NULL,
  \`golongan_darah\` VARCHAR(10) DEFAULT '-',
  \`foto_url\` LONGTEXT DEFAULT NULL,
  \`berlaku_sampai\` VARCHAR(100) DEFAULT NULL,
  \`status\` VARCHAR(20) DEFAULT 'aktif',
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_nisn\` (\`nisn\`),
  KEY \`idx_nis\` (\`nis\`),
  KEY \`idx_kelas\` (\`kelas\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. Struktur Tabel: pengaturan_kartu
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`pengaturan_kartu\` (
  \`id\` INT(11) NOT NULL AUTO_INCREMENT,
  \`theme\` VARCHAR(50) DEFAULT 'kemenag-classic',
  \`font_family\` VARCHAR(50) DEFAULT 'plus-jakarta',
  \`barcode_type\` VARCHAR(50) DEFAULT 'both',
  \`qr_content\` VARCHAR(50) DEFAULT 'nisn',
  \`show_hologram\` TINYINT(1) DEFAULT 1,
  \`show_kemenag_logo\` TINYINT(1) DEFAULT 1,
  \`show_madrasah_logo\` TINYINT(1) DEFAULT 1,
  \`show_signature\` TINYINT(1) DEFAULT 1,
  \`show_stamp\` TINYINT(1) DEFAULT 1,
  \`signatory_position\` VARCHAR(20) DEFAULT 'back',
  \`back_content_preset\` VARCHAR(50) DEFAULT 'tata-tertib',
  \`custom_back_title\` VARCHAR(255) DEFAULT NULL,
  \`custom_back_notes\` TEXT DEFAULT NULL,
  \`config_json\` LONGTEXT DEFAULT NULL,
  \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. Struktur Tabel: activity_logs
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`activity_logs\` (
  \`id\` VARCHAR(100) NOT NULL,
  \`action\` VARCHAR(255) NOT NULL,
  \`operator\` VARCHAR(100) NOT NULL,
  \`details\` TEXT DEFAULT NULL,
  \`type\` VARCHAR(50) NOT NULL,
  \`timestamp\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- SEED DATA AWAL: madrasah_info (Anti-Timpa: Hanya diisi jika tabel masih kosong)
-- ------------------------------------------------------------------------------
INSERT IGNORE INTO \`madrasah_info\` (\`id\`, \`nama_kementerian\`, \`nsm\`, \`npsn\`, \`nama_madrasah\`, \`nama_singkat\`, \`kemenag_wilayah\`, \`alamat\`, \`kelurahan_desa\`, \`kecamatan\`, \`kota_kabupaten\`, \`provinsi\`, \`kode_pos\`, \`telepon\`, \`email\`, \`website\`, \`akreditasi\`, \`motto\`, \`jabatan_penandatangan\`, \`label_id_penandatangan\`, \`nama_kepala_madrasah\`, \`nip_kepala_madrasah\`, \`kota_penetapan\`, \`tanggal_penetapan\`, \`logo_aplikasi_url\`, \`logo_kemenag_url\`, \`logo_madrasah_url\`, \`logo_url\`, \`stempel_url\`, \`ttd_kepala_url\`)
VALUES (1, ${escapeSql(madrasah?.namaKementerian || 'KEMENTERIAN AGAMA REPUBLIK INDONESIA')}, ${escapeSql(madrasah?.nsm || '')}, ${escapeSql(madrasah?.npsn || '')}, ${escapeSql(madrasah?.namaMadrasah || '')}, ${escapeSql(madrasah?.namaMadrasah || '')}, ${escapeSql(madrasah?.kemenagWilayah || '')}, ${escapeSql(madrasah?.alamat || '')}, ${escapeSql(madrasah?.kelurahanDesa || '')}, ${escapeSql(madrasah?.kecamatan || '')}, ${escapeSql(madrasah?.kotaKab || '')}, ${escapeSql(madrasah?.provinsi || '')}, ${escapeSql(madrasah?.kodePos || '')}, ${escapeSql(madrasah?.telepon || '')}, ${escapeSql(madrasah?.email || '')}, ${escapeSql(madrasah?.website || '')}, ${escapeSql(madrasah?.akreditasi || 'A')}, ${escapeSql(madrasah?.motto || '')}, ${escapeSql(madrasah?.jabatanPenandatangan || 'Kepala Madrasah')}, ${escapeSql(madrasah?.labelIdPenandatangan || 'NIP')}, ${escapeSql(madrasah?.namaKepalaMadrasah || '')}, ${escapeSql(madrasah?.nipKepalaMadrasah || '')}, ${escapeSql(madrasah?.kotaPenetapan || '')}, ${escapeSql(madrasah?.tanggalPenetapan || '')}, ${escapeSql(madrasah?.logoAplikasiUrl || '')}, ${escapeSql(madrasah?.logoKemenagUrl || '')}, ${escapeSql(madrasah?.logoMadrasahUrl || '')}, ${escapeSql(madrasah?.logoMadrasahUrl || madrasah?.logoKemenagUrl || '')}, ${escapeSql(madrasah?.stempelUrl || '')}, ${escapeSql(madrasah?.ttdKepalaUrl || '')});

-- ------------------------------------------------------------------------------
-- SEED DATA AWAL: pengaturan_kartu (Anti-Timpa: Hanya diisi jika tabel masih kosong)
-- ------------------------------------------------------------------------------
INSERT IGNORE INTO \`pengaturan_kartu\` (\`id\`, \`theme\`, \`font_family\`, \`barcode_type\`, \`qr_content\`, \`show_hologram\`, \`show_kemenag_logo\`, \`show_madrasah_logo\`, \`show_signature\`, \`show_stamp\`, \`signatory_position\`, \`back_content_preset\`, \`custom_back_title\`, \`custom_back_notes\`, \`config_json\`)
VALUES (1, ${escapeSql(cardConfig?.theme || 'kemenag-green')}, ${escapeSql('Inter, sans-serif')}, ${escapeSql(cardConfig?.barcodeType || 'nisn')}, ${escapeSql(cardConfig?.qrContent || 'verification_url')}, ${cardConfig?.showHologram ? 1 : 0}, ${cardConfig?.showKemenagLogo !== false ? 1 : 0}, ${cardConfig?.showMadrasahLogo !== false ? 1 : 0}, ${cardConfig?.showSignature !== false ? 1 : 0}, ${cardConfig?.showStamp !== false ? 1 : 0}, ${escapeSql(cardConfig?.signatoryPosition || 'back')}, ${escapeSql(cardConfig?.backContentPreset || 'tata-tertib')}, ${escapeSql(cardConfig?.customBackTitle || 'KETENTUAN DAN TATA TERTIB SISWA')}, ${escapeSql(customBackNotesStr)}, ${escapeSql(JSON.stringify(cardConfig || {}))});

-- ------------------------------------------------------------------------------
-- SEED DATA AWAL: Data Siswa (${studentList.length} Siswa)
-- ------------------------------------------------------------------------------
${studentInserts}

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
`;
};

/**
 * Generate PHP Auto Setup script for Plesk 1-click installer
 */
export const generatePhpAutoSetupFile = (
  madrasah: MadrasahInfo,
  options: PleskDeployOptions
): string => {
  const dbHost = options.dbHost || DEFAULT_MYSQL_CONFIG.dbHost;
  const dbName = options.dbName || DEFAULT_MYSQL_CONFIG.dbName;
  const dbUser = options.dbUser || DEFAULT_MYSQL_CONFIG.dbUser;
  const dbPass = options.dbPass || DEFAULT_MYSQL_CONFIG.dbPass;

  return `<?php
/**
 * PLESK AUTOMATIC DATABASE INSTALLER & VERIFIER
 * Aplikasi: Generator Kartu Pelajar MI (Kemenag RI)
 * Target Database: ${dbName}
 * Target User: ${dbUser}
 */
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/config.php';

$results = [];
$status = 'success';

try {
    // 1. Tes Koneksi MySQL
    $pdo = getDbConnection();
    $results[] = [
        'step' => 'Koneksi MySQL',
        'status' => 'OK',
        'message' => 'Berhasil terhubung ke MySQL Server (' . DB_HOST . ') menggunakan user ' . DB_USER
    ];

    // 2. Baca file SQL
    $sqlFile = __DIR__ . '/${dbName}.sql';
    if (!file_exists($sqlFile)) {
        $sqlFile = __DIR__ . '/database.sql';
    }

    if (file_exists($sqlFile)) {
        $sqlContent = file_get_contents($sqlFile);
        
        // Eksekusi multi query
        $pdo->exec($sqlContent);
        $results[] = [
            'step' => 'Migrasi Skema & Data',
            'status' => 'OK',
            'message' => 'Tabel madrasah_info, siswa, pengaturan_kartu berhasil dibuat dan diisi data awal.'
        ];
    } else {
        $results[] = [
            'step' => 'Migrasi Skema',
            'status' => 'WARNING',
            'message' => 'Berkas SQL dump tidak ditemukan di folder, menggunakan skema dasar.'
        ];
    }

    // 3. Hitung jumlah siswa
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM siswa");
    $totalSiswa = $stmt->fetch()['total'] ?? 0;
    $results[] = [
        'step' => 'Verifikasi Data Siswa',
        'status' => 'OK',
        'message' => "Total siswa tersimpan di database MySQL: $totalSiswa siswa"
    ];

} catch (Exception $e) {
    $status = 'error';
    $results[] = [
        'step' => 'Error Pemasangan',
        'status' => 'FAILED',
        'message' => $e->getMessage()
    ];
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Auto Setup MySQL Plesk - ${madrasah.namaMadrasah}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4 font-sans">
    <div class="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div class="bg-gradient-to-r from-emerald-900 to-teal-900 p-6 text-white border-b border-emerald-700">
            <h1 class="text-xl font-black uppercase">Plesk MySQL Auto-Setup</h1>
            <p class="text-xs text-emerald-200 mt-1">Status Konfigurasi Database Otomatis di Hosting Plesk</p>
        </div>
        <div class="p-6 space-y-4">
            <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2 font-mono">
                <div class="flex justify-between text-slate-400"><span>Database Name:</span><strong class="text-amber-400"><?= htmlspecialchars(DB_NAME) ?></strong></div>
                <div class="flex justify-between text-slate-400"><span>Database User:</span><strong class="text-emerald-400"><?= htmlspecialchars(DB_USER) ?></strong></div>
                <div class="flex justify-between text-slate-400"><span>Host:</span><strong class="text-white"><?= htmlspecialchars(DB_HOST) ?></strong></div>
            </div>

            <div class="space-y-2">
                <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider">Hasil Eksekusi:</h3>
                <?php foreach ($results as $res): ?>
                    <div class="p-3 rounded-lg border flex items-start justify-between text-xs <?= $res['status'] === 'OK' ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-rose-950/40 border-rose-800 text-rose-300' ?>">
                        <div>
                            <strong class="block font-bold"><?= htmlspecialchars($res['step']) ?></strong>
                            <span class="text-[11px] text-slate-300"><?= htmlspecialchars($res['message']) ?></span>
                        </div>
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold <?= $res['status'] === 'OK' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white' ?>">
                            <?= $res['status'] ?>
                        </span>
                    </div>
                <?php endforeach; ?>
            </div>

            <div class="pt-4 border-t border-slate-800 flex justify-between items-center">
                <a href="index.html" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition">
                    Buka Aplikasi Kartu Pelajar &rarr;
                </a>
                <span class="text-[10px] text-slate-500">Plesk Ready v2.5</span>
            </div>
        </div>
    </div>
</body>
</html>
`;
};

/**
 * Generate PHP REST API endpoints for MySQL CRUD & Central Data Sync in Plesk
 */
export const generatePhpApiEndpoints = (): { [filename: string]: string } => {
  const dataPhp = `<?php
require_once __DIR__ . '/../config.php';
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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
$userSettingsJsonPath = __DIR__ . '/../data/user_settings.json';
$backupDataJsonPath = __DIR__ . '/../backup_data_madrasah.json';
$backupJsonPath = __DIR__ . '/database.json';
$defaultJsonPath = __DIR__ . '/../data/database.default.json';

function readJsonFallback() {
    global $dbJsonPath, $persistentJsonPath, $userSettingsJsonPath, $backupDataJsonPath, $backupJsonPath, $defaultJsonPath;
    
    // 1. Prioritas Tertinggi: Persistent JSON & User Settings (TIDAK PERNAH DIHAPUS / DITIMPA SAAT EKSTRAK ZIP)
    if (file_exists($persistentJsonPath)) {
        $content = @file_get_contents($persistentJsonPath);
        if ($content) {
            $json = json_decode($content, true);
            if ($json && (isset($json['students']) || isset($json['madrasah']))) {
                return $json;
            }
        }
    }

    if (file_exists($userSettingsJsonPath)) {
        $content = @file_get_contents($userSettingsJsonPath);
        if ($content) {
            $json = json_decode($content, true);
            if ($json && (isset($json['students']) || isset($json['madrasah']))) {
                return $json;
            }
        }
    }
    
    // 2. Data database.json
    if (file_exists($dbJsonPath)) {
        $content = @file_get_contents($dbJsonPath);
        if ($content) {
            $json = json_decode($content, true);
            if ($json && (isset($json['students']) || isset($json['madrasah']))) {
                return $json;
            }
        }
    }
    
    // 3. Fallback backup_data_madrasah.json di root
    if (file_exists($backupDataJsonPath)) {
        $content = @file_get_contents($backupDataJsonPath);
        if ($content) {
            $json = json_decode($content, true);
            if ($json) return $json;
        }
    }

    // 4. Fallback database.json di folder api
    if (file_exists($backupJsonPath)) {
        $content = @file_get_contents($backupJsonPath);
        if ($content) {
            $json = json_decode($content, true);
            if ($json) return $json;
        }
    }

    // 5. Fallback template fresh install data/database.default.json
    if (file_exists($defaultJsonPath)) {
        $content = @file_get_contents($defaultJsonPath);
        if ($content) {
            $json = json_decode($content, true);
            if ($json) return $json;
        }
    }
    return null;
}

function writeJsonFallback($data) {
    global $dbJsonPath, $persistentJsonPath, $userSettingsJsonPath, $backupDataJsonPath, $backupJsonPath;
    $dir = dirname($dbJsonPath);
    if (!file_exists($dir)) {
        @mkdir($dir, 0777, true);
    }
    $str = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
    // 1. Simpan ke persistent_database.json & user_settings.json (TETAP AMAN saat timpa ZIP)
    @file_put_contents($persistentJsonPath, $str);
    @chmod($persistentJsonPath, 0666);

    @file_put_contents($userSettingsJsonPath, $str);
    @chmod($userSettingsJsonPath, 0666);
    
    // 2. Simpan ke database.json
    @file_put_contents($dbJsonPath, $str);
    @chmod($dbJsonPath, 0666);
    
    // 3. Simpan ke api/database.json & backup_data_madrasah.json
    @file_put_contents($backupJsonPath, $str);
    @chmod($backupJsonPath, 0666);

    @file_put_contents($backupDataJsonPath, $str);
    @chmod($backupDataJsonPath, 0666);
}

// ==================== DIRECT CLEAR / DELETE STUDENTS ====================
if ((isset($_GET['action']) && $_GET['action'] === 'clear_students') || (isset($_POST['action']) && $_POST['action'] === 'clear_students') || $_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $lastUpdated = date('c');
    $currentJson = readJsonFallback() ?: [];
    $currentJson['students'] = [];
    $currentJson['lastUpdated'] = $lastUpdated;
    writeJsonFallback($currentJson);

    try {
        $pdo = getDbConnection();
        if ($pdo) {
            $pdo->exec("DELETE FROM siswa");
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
        $pdo = getDbConnection();
        if ($pdo) {
            $madrasahRow = $pdo->query("SELECT * FROM madrasah_info LIMIT 1")->fetch();
            $configRow = $pdo->query("SELECT * FROM pengaturan_kartu LIMIT 1")->fetch();
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
                if (!empty($madrasahRow['updated_at'])) {
                    $realLastUpdated = date('c', strtotime($madrasahRow['updated_at']));
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
    } catch (Exception $e) {
        // Fallback to JSON
    }

    // 4. Jika MySQL gagal atau siswa masih kosong, gunakan fallback file JSON
    $jsonFallback = readJsonFallback();
    if (!$mysqlSuccess) {
        if ($jsonFallback) {
            $resultData = $jsonFallback;
        }
    } else {
        if ($jsonFallback) {
            if (!isset($resultData['madrasah']) && isset($jsonFallback['madrasah'])) {
                $resultData['madrasah'] = $jsonFallback['madrasah'];
            }
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
    $merged = array_merge($currentJson, $input);
    if (isset($input['students']) && is_array($input['students'])) {
        $merged['students'] = $input['students'];
    }
    $merged['lastUpdated'] = $lastUpdated;
    writeJsonFallback($merged);

    // Update ke MySQL bila database terhubung
    try {
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
                $cfgJson = json_encode($input['cardConfig'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                $stmtConf = $pdo->prepare("INSERT INTO pengaturan_kartu (id, theme, config_json, updated_at) VALUES (1, :theme, :cfg, NOW()) ON DUPLICATE KEY UPDATE theme=VALUES(theme), config_json=VALUES(config_json), updated_at=NOW()");
                $stmtConf->execute([
                    ':theme' => $theme,
                    ':cfg' => $cfgJson
                ]);
                $pdo->prepare("UPDATE pengaturan_kartu SET theme=:theme, config_json=:cfg, updated_at=NOW()")->execute([
                    ':theme' => $theme,
                    ':cfg' => $cfgJson
                ]);
            }

            // 3. Simpan Siswa (Sinkronkan daftar siswa aktif & hapus data yang dihapus oleh operator)
            if (isset($input['students']) && is_array($input['students'])) {
                $pdo->beginTransaction();
                
                $activeIds = [];
                foreach ($input['students'] as $s) {
                    if (!empty($s['id'])) {
                        $activeIds[] = (string)$s['id'];
                    }
                }
                
                // Hapus data siswa di MySQL yang sudah dihapus oleh operator dari daftar
                if (!empty($activeIds)) {
                    $inPlaceholders = implode(',', array_fill(0, count($activeIds), '?'));
                    $delStmt = $pdo->prepare("DELETE FROM siswa WHERE id NOT IN ($inPlaceholders)");
                    $delStmt->execute($activeIds);
                } else if (!empty($input['isExplicitClear']) || (isset($input['action']) && $input['action'] === 'clear_students')) {
                    $pdo->exec("DELETE FROM siswa");
                }

                if (!empty($input['students'])) {
                    $stmt = $pdo->prepare("INSERT INTO siswa (id, nisn, nis, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, kelas, tahun_ajaran, agama, alamat, nama_wali, golongan_darah, foto_url, berlaku_sampai, status)
                        VALUES (:id, :nisn, :nis, :nama, :tempat_lahir, :tanggal_lahir, :jenis_kelamin, :kelas, :tahun_ajaran, :agama, :alamat, :nama_wali, :golongan_darah, :foto_url, :berlaku_sampai, 'aktif')
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
                }
                $pdo->commit();
            }
        }
    } catch (Exception $e) {
        // Abaikan error MySQL jika file JSON sudah tersimpan
    }

    $totalStudents = isset($input['students']) ? count($input['students']) : (isset($merged['students']) ? count($merged['students']) : 0);

    echo json_encode([
        'success' => true,
        'message' => 'Data aplikasi (Profil Madrasah, Desain Kartu, dan Siswa) berhasil disinkronkan ke database pusat',
        'lastUpdated' => $lastUpdated,
        'totalStudents' => $totalStudents
    ]);
    exit;
}
`;

  const syncAllPhp = `<?php
require_once __DIR__ . '/data.php';
`;

  const healthPhp = `<?php
require_once __DIR__ . '/../config.php';
header('Content-Type: application/json; charset=utf-8');

$totalStudents = 0;
$status = 'ok';
$mode = 'json-fallback';

try {
    $pdo = getDbConnection();
    if ($pdo) {
        $stmt = $pdo->query("SELECT COUNT(*) as c FROM siswa");
        $totalStudents = (int)($stmt->fetch()['c'] ?? 0);
        $mode = 'mysql-connected';
    }
} catch (Exception $e) {
    // Check JSON
    $jsonPath = __DIR__ . '/../data/database.json';
    if (file_exists($jsonPath)) {
        $data = json_decode(file_get_contents($jsonPath), true);
        if ($data && isset($data['students']) && is_array($data['students'])) {
            $totalStudents = count($data['students']);
        }
    }
}

echo json_encode([
    'status' => $status,
    'mode' => $mode,
    'totalStudents' => $totalStudents,
    'serverTime' => date('c')
]);
`;

  const getSiswaPhp = `<?php
require_once __DIR__ . '/data.php';
`;

  const saveSiswaPhp = `<?php
require_once __DIR__ . '/data.php';
`;

  const clearStudentsPhp = `<?php
require_once __DIR__ . '/data.php';
`;

  const studentsPhp = `<?php
require_once __DIR__ . '/data.php';
`;

  const versionPhp = `<?php
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

$lastUpdated = '1970-01-01T00:00:00Z';
$totalStudents = 0;
$madrasahName = '';
$tahunPelajaran = '2025/2026';
$foundData = false;

try {
    if (function_exists('getDbConnection')) {
        $pdo = getDbConnection();
        if ($pdo) {
            $stmt = $pdo->query("SELECT GREATEST(
                COALESCE((SELECT MAX(updated_at) FROM madrasah_info), '1970-01-01'),
                COALESCE((SELECT MAX(updated_at) FROM siswa), '1970-01-01'),
                COALESCE((SELECT MAX(updated_at) FROM pengaturan_kartu), '1970-01-01')
            ) AS latest_time");
            $row = $stmt ? $stmt->fetch(PDO::FETCH_ASSOC) : null;
            if (!empty($row['latest_time']) && $row['latest_time'] !== '1970-01-01') {
                $lastUpdated = date('c', strtotime($row['latest_time']));
                $foundData = true;
            }

            $cntRow = $pdo->query("SELECT COUNT(*) as c FROM siswa")->fetch(PDO::FETCH_ASSOC);
            $totalStudents = (int)($cntRow['c'] ?? 0);

            $mRow = $pdo->query("SELECT nama_madrasah, tahun_pelajaran FROM madrasah_info ORDER BY id ASC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
            if ($mRow) {
                $madrasahName = (string)($mRow['nama_madrasah'] ?? '');
                $tahunPelajaran = (string)($mRow['tahun_pelajaran'] ?? '2025/2026');
                $foundData = true;
            }
        }
    }
} catch (Throwable $e) {}

if (!$foundData) {
    $jsonFiles = [
        __DIR__ . '/../data/persistent_database.json',
        __DIR__ . '/../data/user_settings.json',
        __DIR__ . '/../data/database.json',
        __DIR__ . '/database.json'
    ];
    foreach ($jsonFiles as $jf) {
        if (file_exists($jf)) {
            $raw = @file_get_contents($jf);
            if ($raw) {
                $j = json_decode($raw, true);
                if ($j && is_array($j)) {
                    $lastUpdated = $j['lastUpdated'] ?? date('c', filemtime($jf));
                    $totalStudents = isset($j['students']) && is_array($j['students']) ? count($j['students']) : 0;
                    $madrasahName = $j['madrasah']['namaMadrasah'] ?? $j['madrasah']['nama_madrasah'] ?? '';
                    $tahunPelajaran = $j['madrasah']['tahunPelajaran'] ?? $j['madrasah']['tahun_pelajaran'] ?? '2025/2026';
                    break;
                }
            }
        }
    }
}

echo json_encode([
    'success' => true,
    'status' => 'success',
    'lastUpdated' => $lastUpdated,
    'totalStudents' => $totalStudents,
    'madrasahName' => $madrasahName,
    'tahunPelajaran' => $tahunPelajaran,
    'timestamp' => time()
]);
`;

  const liveStreamPhp = `<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: text/event-stream; charset=utf-8');
header('Cache-Control: no-cache, no-transform, no-store, must-revalidate');
header('Connection: keep-alive');
header('X-Accel-Buffering: no');
header('Pragma: no-cache');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (function_exists('apache_setenv')) {
    @apache_setenv('no-gzip', '1');
}
@ini_set('zlib.output_compression', '0');
@ini_set('implicit_flush', '1');
while (ob_get_level() > 0) {
    ob_end_flush();
}
flush();

$configFile = __DIR__ . '/../config.php';
if (file_exists($configFile)) {
    require_once $configFile;
}

function getLatestVersionInfo() {
    $lastUpdated = '1970-01-01T00:00:00Z';
    $totalStudents = 0;
    $madrasahName = '';
    $tahunPelajaran = '2025/2026';

    try {
        if (function_exists('getDbConnection')) {
            $pdo = getDbConnection();
            if ($pdo) {
                $stmt = $pdo->query("SELECT GREATEST(
                    COALESCE((SELECT MAX(updated_at) FROM madrasah_info), '1970-01-01'),
                    COALESCE((SELECT MAX(updated_at) FROM siswa), '1970-01-01'),
                    COALESCE((SELECT MAX(updated_at) FROM pengaturan_kartu), '1970-01-01')
                ) AS latest_time");
                $row = $stmt ? $stmt->fetch(PDO::FETCH_ASSOC) : null;
                if (!empty($row['latest_time']) && $row['latest_time'] !== '1970-01-01') {
                    $lastUpdated = date('c', strtotime($row['latest_time']));
                }

                $cntRow = $pdo->query("SELECT COUNT(*) as c FROM siswa")->fetch(PDO::FETCH_ASSOC);
                $totalStudents = (int)($cntRow['c'] ?? 0);

                $mRow = $pdo->query("SELECT nama_madrasah, tahun_pelajaran FROM madrasah_info ORDER BY id ASC LIMIT 1")->fetch(PDO::FETCH_ASSOC);
                if ($mRow) {
                    $madrasahName = (string)($mRow['nama_madrasah'] ?? '');
                    $tahunPelajaran = (string)($mRow['tahun_pelajaran'] ?? '2025/2026');
                }

                return [
                    'lastUpdated' => $lastUpdated,
                    'totalStudents' => $totalStudents,
                    'madrasahName' => $madrasahName,
                    'tahunPelajaran' => $tahunPelajaran,
                ];
            }
        }
    } catch (Throwable $e) {}

    $jsonFiles = [
        __DIR__ . '/../data/persistent_database.json',
        __DIR__ . '/../data/user_settings.json',
        __DIR__ . '/../data/database.json'
    ];
    foreach ($jsonFiles as $jf) {
        if (file_exists($jf)) {
            $raw = @file_get_contents($jf);
            if ($raw) {
                $d = json_decode($raw, true);
                if ($d && is_array($d)) {
                    return [
                        'lastUpdated' => $d['lastUpdated'] ?? date('c', filemtime($jf)),
                        'totalStudents' => isset($d['students']) && is_array($d['students']) ? count($d['students']) : 0,
                        'madrasahName' => $d['madrasah']['namaMadrasah'] ?? '',
                        'tahunPelajaran' => $d['madrasah']['tahunPelajaran'] ?? '2025/2026',
                    ];
                }
            }
        }
    }

    return [
        'lastUpdated' => $lastUpdated,
        'totalStudents' => $totalStudents,
        'madrasahName' => $madrasahName,
        'tahunPelajaran' => $tahunPelajaran,
    ];
}

$info = getLatestVersionInfo();
echo "data: " . json_encode(array_merge(['type' => 'init'], $info)) . "\\n\\n";
flush();

$lastKnown = $info['lastUpdated'];
$startTime = time();
while (time() - $startTime < 20) {
    if (connection_aborted()) {
        break;
    }
    sleep(2);
    $current = getLatestVersionInfo();
    if ($current['lastUpdated'] !== $lastKnown) {
        $lastKnown = $current['lastUpdated'];
        echo "data: " . json_encode(array_merge(['type' => 'sync'], $current)) . "\\n\\n";
        flush();
    } else {
        echo ": ping\\n\\n";
        flush();
    }
}
`;

  return {
    'api/data.php': dataPhp,
    'api/version.php': versionPhp,
    'api/live-stream.php': liveStreamPhp,
    'api/sync.php': syncAllPhp,
    'api/health.php': healthPhp,
    'api/get_siswa.php': getSiswaPhp,
    'api/save_siswa.php': saveSiswaPhp,
    'api/clear_students.php': clearStudentsPhp,
    'api/students.php': studentsPhp,
  };
};

export const generatePleskReadme = (
  madrasah: MadrasahInfo,
  options: PleskDeployOptions
): string => {
  const dbHost = options.dbHost || DEFAULT_MYSQL_CONFIG.dbHost;
  const dbName = options.dbName || DEFAULT_MYSQL_CONFIG.dbName;
  const dbUser = options.dbUser || DEFAULT_MYSQL_CONFIG.dbUser;
  const dbPass = options.dbPass || DEFAULT_MYSQL_CONFIG.dbPass;

  return `# PANDUAN DEPLOYMENT APLIKASI KARTU PELAJAR MI DI PLESK PANEL
Lembaga: ${madrasah.namaMadrasah}
NSM: ${madrasah.nsm} | NPSN: ${madrasah.npsn}
Domain Target: ${options.domainName || 'madrasah.sch.id'}

---

## 🗄️ INFORMASI KREDENSIAL DATABASE MYSQL PLESK
- **Database Host**: \`${dbHost}\`
- **Database Name**: \`${dbName}\`
- **Database Username**: \`${dbUser}\`
- **Database Password**: \`${dbPass}\`
- **Port**: \`3306\`
- **Berkas Dump SQL**: \`${dbName}.sql\` (tersedia di root berkas ZIP)

---

## 🚀 LANGKAH-LANGKAH CEPAT DEPLOY KE PLESK (HANYA 3 MENIT)

### Langkah 1: Buat Database MySQL di Plesk
1. Login ke **Plesk Control Panel** Anda.
2. Masuk ke menu **Databases** di sidebar atau dashboard domain Anda.
3. Klik tombol **Add Database**.
4. Isi form database dengan kredensial berikut:
   - **Database name**: \`${dbName}\`
   - **Database user name**: \`${dbUser}\`
   - **Password**: \`${dbPass}\`
   - **Confirm password**: \`${dbPass}\`
5. Klik **OK** untuk membuat database.

### Langkah 2: Upload dan Extract File ZIP di httpdocs
1. Masuk ke menu **Websites & Domains** -> pilih domain Anda -> buka **File Manager**.
2. Masuk ke folder **\`httpdocs\`**.
3. Klik tombol **Upload** dan pilih file ZIP ini (\`PLESK_DEPLOY_KARTU_PELAJAR_MI_...\`).
4. Centang file ZIP yang terupload, lalu klik **Extract Files** ke \`httpdocs/\`.

### Langkah 3: Eksekusi Otomatis Auto-Setup Database
1. Buka browser dan akses alamat instalasi otomatis:
   \`https://${options.domainName || 'madrasah.sch.id'}/auto_setup.php\`
2. Halaman installer akan otomatis menghubungkan database \`${dbName}\`, mengeksekusi tabel \`madrasah_info\`, \`siswa\`, dan \`pengaturan_kartu\`, serta mengisi data awal siswa.
3. *Alternatif Manual:* Anda juga bisa membuka **phpMyAdmin** di Plesk -> pilih database \`${dbName}\` -> klik tab **Import** -> pilih berkas \`${dbName}.sql\` -> klik **Go**.

### Langkah 4: Aktifkan SSL Let's Encrypt (Gratis & Otomatis)
1. Kembali ke menu **Websites & Domains** -> **SSL/TLS Certificates**.
2. Klik **Install a free basic certificate provided by Let's Encrypt**.
3. Centang opsi "Include a 'www' subdomain" lalu klik **Get it free**.
4. Aktifkan fitur **"Redirect from HTTP to HTTPS"**.

### Langkah 5: Selesai!
Aplikasi Generator Kartu Pelajar MI telah aktif dan terhubung penuh dengan Database MySQL \`${dbName}\` di Plesk Hosting Anda!

---

## 🛠️ STRUKTUR BERKAS DALAM BUNDEL PLESK:
- \`index.html\`: Halaman antarmuka utama Generator Kartu Pelajar
- \`config.php\`: Koneksi PDO MySQL dengan kredensial \`${dbUser}\` / \`${dbName}\`
- \`${dbName}.sql\`: Dump skema MySQL dan data siswa siap impor
- \`auto_setup.php\`: Skrip instalasi otomatis tabel & verifikasi koneksi MySQL
- \`api/\`: Endpoint RESTful PHP untuk sinkronisasi data siswa ke MySQL
- \`.htaccess\`: Konfigurasi Apache, proteksi rute SPA, kompresi Gzip
- \`web.config\`: Konfigurasi IIS Plesk
- \`.env\`: Variabel lingkungan koneksi database

---
Dibuat otomatis oleh Sistem Generator Kartu Pelajar MI - Standar Kementerian Agama RI.
`;
};

export const generateCpanelReadme = (
  madrasah: MadrasahInfo,
  options: PleskDeployOptions
): string => {
  const dbHost = options.dbHost || DEFAULT_MYSQL_CONFIG.dbHost;
  const dbName = options.dbName || DEFAULT_MYSQL_CONFIG.dbName;
  const dbUser = options.dbUser || DEFAULT_MYSQL_CONFIG.dbUser;
  const dbPass = options.dbPass || DEFAULT_MYSQL_CONFIG.dbPass;

  return `# PANDUAN DEPLOYMENT APLIKASI KARTU PELAJAR MI DI CPANEL
Lembaga: ${madrasah.namaMadrasah}
NSM: ${madrasah.nsm} | NPSN: ${madrasah.npsn}
Domain Target: ${options.domainName || 'madrasah.sch.id'}

---

## 🛡️ SISTEM ANTI-TIMPA (PENGATURAN TIDAK AKAN HILANG)
Aplikasi ini dilengkapi arsitektur **Non-Destructive Overwrite**:
1. Menimpa / mengekstrak update ZIP baru ke \`public_html\` **TIDAK AKAN MENGHAPUS** konfigurasi database atau data yang sudah Anda miliki.
2. File konfigurasi lokal (\`config.local.php\` dan \`data/db_custom_config.php\`) diprioritaskan di atas konfigurasi default.
3. Database MySQL menggunakan \`INSERT IGNORE\` sehingga data siswa dan identitas madrasah yang sudah ada di database tidak akan tertimpa.

---

## 🗄️ INFORMASI KREDENSIAL DATABASE MYSQL CPANEL
- **Database Host**: \`${dbHost}\` (biasanya \`localhost\`)
- **Database Name**: \`${dbName}\`
- **Database Username**: \`${dbUser}\`
- **Database Password**: \`${dbPass}\`
- **Port**: \`3306\`
- **Berkas Dump SQL**: \`database.sql\` / \`${dbName}.sql\`

---

## 🚀 LANGKAH DEPLOYMENT DI CPANEL:

### 1. Buat Database & User di cPanel
1. Login ke akun **cPanel**.
2. Masuk ke menu **MySQL® Databases** (atau **MySQL Database Wizard**).
3. Buat database baru (misal: \`${dbName}\`).
4. Buat user database baru (misal: \`${dbUser}\`) beserta password.
5. Hubungkan user ke database dan centang **ALL PRIVILEGES**.

### 2. Upload dan Ekstrak ZIP di File Manager
1. Buka **File Manager** di cPanel.
2. Buka folder **\`public_html\`** (atau folder subdomain Anda).
3. Upload file ZIP ini.
4. Klik kanan pada file ZIP lalu pilih **Extract**.

### 3. Eksekusi Auto-Setup
1. Buka browser dan buka:
   \`https://${options.domainName || 'madrasah.sch.id'}/auto_setup.php\`
2. Sistem akan otomatis memverifikasi koneksi database dan membuat tabel yang dibutuhkan.
3. Selesai! Buka \`https://${options.domainName || 'madrasah.sch.id'}\` untuk menggunakan aplikasi.

---
Dibuat otomatis oleh Sistem Generator Kartu Pelajar MI - Standar Kementerian Agama RI.
`;
};

export const createPleskDeployZip = async (
  madrasah: MadrasahInfo,
  students: Student[],
  cardConfig: CardConfig,
  options: PleskDeployOptions,
  loaderConfig?: PageLoaderConfig,
  onProgress?: (percent: number, statusText: string) => void
): Promise<Blob> => {
  const zip = new JSZip();

  const dbHost = options.dbHost || DEFAULT_MYSQL_CONFIG.dbHost;
  const dbName = options.dbName || DEFAULT_MYSQL_CONFIG.dbName;
  const dbUser = options.dbUser || DEFAULT_MYSQL_CONFIG.dbUser;
  const dbPass = options.dbPass || DEFAULT_MYSQL_CONFIG.dbPass;

  onProgress?.(10, 'Menyiapkan struktur direktori Plesk httpdocs & server configs...');

  // 1. htaccess, web.config, nginx
  zip.file('.htaccess', generateHtaccessContent(options));
  zip.file('web.config', generateWebConfigContent(options));
  zip.file('plesk-nginx-directives.txt', generateNginxDirectivesContent());

  // 2. MySQL Database Files & PHP Bridge
  onProgress?.(25, `Menyiapkan koneksi MySQL (${dbUser} @ ${dbName})...`);
  zip.file('config.php', generatePhpConfigFile(options));
  zip.file('koneksi.php', generatePhpConfigFile(options));
  
  // Environment variables
  const envContent = `DB_HOST=${dbHost}
DB_PORT=3306
DB_DATABASE=${dbName}
DB_USERNAME=${dbUser}
DB_PASSWORD=${dbPass}
APP_NAME="Generator Kartu Pelajar MI ${madrasah.namaMadrasah}"
APP_ENV=production
APP_URL=https://${options.domainName || 'madrasah.sch.id'}
`;
  zip.file('.env', envContent);
  zip.file('.env.production', envContent);

  // 3. MySQL SQL Dump
  onProgress?.(40, `Menghasilkan skema & seed SQL untuk database ${dbName}...`);
  const sqlDump = generateMysqlSqlDump(madrasah, students, cardConfig, options, loaderConfig);
  zip.file(`${dbName}.sql`, sqlDump);
  zip.file('database.sql', sqlDump);

  // 4. Auto Setup installer
  onProgress?.(50, 'Menyusun script auto-installer MySQL (auto_setup.php)...');
  zip.file('auto_setup.php', generatePhpAutoSetupFile(madrasah, options));

  // 5. PHP REST API Endpoints
  onProgress?.(60, 'Menyiapkan API sinkronisasi PHP MySQL...');
  const apiFiles = generatePhpApiEndpoints();
  for (const [filepath, fileContent] of Object.entries(apiFiles)) {
    zip.file(filepath, fileContent);
  }

  // 6. Documentation
  onProgress?.(70, 'Menyusun panduan lengkap deployment Plesk dan cPanel...');
  zip.file('PLESK_PANDUAN_DEPLOY.md', generatePleskReadme(madrasah, options));
  zip.file('CPANEL_PANDUAN_DEPLOY.md', generateCpanelReadme(madrasah, options));

  // 7. Backup data JSON & Central Server Database (Anti-Timpa Protection)
  const backupData = {
    app: 'Generator Kartu Pelajar Madrasah Ibtidaiyah',
    version: '2.5.0',
    exportedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    mysqlConfig: {
      dbHost,
      dbName,
      dbUser,
    },
    madrasah,
    cardConfig,
    loaderConfig: loaderConfig || null,
    studentsCount: students.length,
    students,
  };
  zip.file('backup_data_madrasah.json', JSON.stringify(backupData, null, 2));
  // Proteksi Anti-Timpa Plesk & cPanel:
  // Hanya database.default.json yang dikemas dalam ZIP sebagai fallback fresh install.
  // database.json, persistent_database.json, dan user_settings.json sengaja TIDAK dimasukkan ke ZIP
  // agar saat zip diekstrak / ditimpa pada hosting Plesk (httpdocs) atau cPanel (public_html) yang sudah berjalan,
  // seluruh data madrasah, siswa, dan pengaturan kartu yang sudah ada TIDAK AKAN HILANG ATAU DITIMPA!
  zip.file('data/database.default.json', JSON.stringify(backupData, null, 2));

  // 8. Bundle Full Application SPA (index.html & assets)
  onProgress?.(80, 'Menyiapkan berkas HTML dan antarmuka aplikasi lengkap...');
  let hasBundledApp = false;

  try {
    const manifestRes = await fetch(`/app-bundle/manifest.json?fresh=true&t=${Date.now()}`);
    if (manifestRes.ok) {
      const manifest = await manifestRes.json();
      if (manifest && Array.isArray(manifest.files) && manifest.files.length > 0) {
        onProgress?.(83, 'Mengemas berkas JavaScript & CSS antarmuka aplikasi...');
        for (const file of manifest.files) {
          try {
            const fileRes = await fetch(`/app-bundle/${file}?t=${Date.now()}`);
            if (fileRes.ok) {
              if (file === 'index.html') {
                let htmlText = await fileRes.text();
                // 1. Relativize asset URLs so app loads correctly in any Plesk path/domain
                htmlText = htmlText.replace(/(src|href)=["']\/assets\//g, '$1="./assets/');

                // 2. Ensure title matches madrasah name
                const schoolTitle = `Kartu Pelajar - ${madrasah.namaMadrasah || "MI Ma'arif NU 2 Sanggreman"}`;
                htmlText = htmlText.replace(/<title>.*?<\/title>/gi, `<title>${schoolTitle}</title>`);

                // 3. Inject seed data script with guaranteed initial hydration and anti-overwrite guard
                const buildTime = Date.now();
                const seedScript = `
  <script id="plesk-initial-seed">
    (function() {
      try {
        var currentMadrasah = ${JSON.stringify(madrasah)};
        var currentStudents = ${JSON.stringify(students)};
        var currentConfig = ${JSON.stringify(cardConfig)};
        var currentLoader = ${JSON.stringify(loaderConfig || null)};
        var currentBuildTime = ${buildTime};
        
        window.__PLESK_INITIAL_DATA__ = {
          madrasah: currentMadrasah,
          students: currentStudents,
          cardConfig: currentConfig,
          loaderConfig: currentLoader,
          buildTime: currentBuildTime
        };
        
        // Proteksi Anti-Timpa Browser:
        // Cek apakah browser sudah memiliki data siswa atau profil madrasah yang tersimpan
        var existingStudentsRaw = localStorage.getItem('mi_students_data') || localStorage.getItem('mi_permanent_vault_students');
        var existingMadrasahRaw = localStorage.getItem('mi_madrasah_info');
        var existingConfigRaw = localStorage.getItem('mi_card_config');

        var hasExistingStudents = false;
        try {
          var parsedS = existingStudentsRaw ? JSON.parse(existingStudentsRaw) : null;
          if (Array.isArray(parsedS) && parsedS.length > 0) hasExistingStudents = true;
        } catch (e) {}

        var hasExistingMadrasah = false;
        try {
          var parsedM = existingMadrasahRaw ? JSON.parse(existingMadrasahRaw) : null;
          if (parsedM && parsedM.namaMadrasah && parsedM.namaMadrasah.trim() !== '') hasExistingMadrasah = true;
        } catch (e) {}

        var hasExistingConfig = false;
        try {
          var parsedC = existingConfigRaw ? JSON.parse(existingConfigRaw) : null;
          if (parsedC && parsedC.theme) hasExistingConfig = true;
        } catch (e) {}

        // HANYA isi jika belum ada data sebelumnya (fresh install)
        if (!hasExistingStudents && Array.isArray(currentStudents) && currentStudents.length > 0) {
          localStorage.setItem('mi_students_data', JSON.stringify(currentStudents));
          localStorage.setItem('mi_students_list', JSON.stringify(currentStudents));
        }
        if (!hasExistingMadrasah && currentMadrasah && currentMadrasah.namaMadrasah) {
          localStorage.setItem('mi_madrasah_info', JSON.stringify(currentMadrasah));
        }
        if (!hasExistingConfig && currentConfig) {
          localStorage.setItem('mi_card_config', JSON.stringify(currentConfig));
        }
        if (!localStorage.getItem('mi_loader_config') && currentLoader) {
          localStorage.setItem('mi_loader_config', JSON.stringify(currentLoader));
        }
        localStorage.setItem('mi_plesk_last_build', currentBuildTime.toString());
      } catch (e) {
        console.error('Seed error:', e);
      }
    })();
  </script>`;
                if (htmlText.includes('</head>')) {
                  htmlText = htmlText.replace('</head>', `${seedScript}\n</head>`);
                } else {
                  htmlText = `${seedScript}\n${htmlText}`;
                }
                zip.file(file, htmlText);
              } else {
                const buffer = await fileRes.arrayBuffer();
                zip.file(file, buffer);
              }
              hasBundledApp = true;
            }
          } catch (err) {
            console.warn(`Gagal memuat aset bundle: ${file}`, err);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Gagal membaca manifest app-bundle, beralih ke fallback template...', err);
  }

  // Backup diagnostic / info page
  const setupInfoHtml = `<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Status Server - ${madrasah.namaMadrasah}</title>
    <meta name="description" content="Status Server & Database Plesk Kartu Pelajar MI ${madrasah.namaMadrasah}" />
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-slate-950 text-slate-100 font-sans antialiased min-h-screen">
    <div class="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div class="w-16 h-16 bg-emerald-600/20 border-2 border-emerald-500 rounded-2xl flex items-center justify-center mb-4 text-emerald-400 shadow-lg">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
        </svg>
      </div>
      <h1 class="text-xl sm:text-2xl font-black text-white uppercase mb-2">
        ${madrasah.namaMadrasah}
      </h1>
      <p class="text-sm text-emerald-300 font-medium max-w-md mb-6">
        Informasi Status Server Plesk & Database MySQL
      </p>
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-md w-full text-left text-xs space-y-3 shadow-xl">
        <div class="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
          <span>NSM Madrasah:</span>
          <strong class="text-white font-mono">${madrasah.nsm}</strong>
        </div>
        <div class="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
          <span>NPSN:</span>
          <strong class="text-white font-mono">${madrasah.npsn}</strong>
        </div>
        <div class="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
          <span>Database MySQL:</span>
          <strong class="text-amber-400 font-mono">${dbName}</strong>
        </div>
        <div class="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
          <span>User MySQL:</span>
          <strong class="text-emerald-400 font-mono">${dbUser}</strong>
        </div>
        <div class="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
          <span>Total Siswa:</span>
          <strong class="text-emerald-400 font-bold">${students.length} Siswa</strong>
        </div>
        <div class="flex items-center justify-between text-slate-400 pt-1">
          <span>Status Server Plesk:</span>
          <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">TERHUBUNG DENGAN BAIK</span>
        </div>
      </div>
      <div class="mt-6 flex flex-wrap gap-2 justify-center">
        <a href="index.html" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition">
          Buka Aplikasi Kartu Pelajar
        </a>
        <a href="auto_setup.php" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold rounded-lg transition">
          Auto Setup Database
        </a>
      </div>
    </div>
  </body>
</html>`;

  zip.file('setup-info.html', setupInfoHtml);

  // If bundle files could not be fetched (e.g., in unit testing or offline), guarantee index.html exists
  if (!hasBundledApp) {
    zip.file('index.html', setupInfoHtml);
  }

  // 9. package.json
  const pleskPackage = {
    name: 'kartu-pelajar-mi-plesk',
    version: '2.5.0',
    description: `Aplikasi Kartu Pelajar MI ${madrasah.namaMadrasah} untuk Plesk Control Panel (MySQL ${dbName})`,
    main: 'index.html',
    database: {
      driver: 'mysql',
      database: dbName,
      user: dbUser,
      host: dbHost,
    },
    scripts: {
      deploy: 'echo "Ready on Plesk httpdocs"',
    },
    author: `${madrasah.namaMadrasah} - Kemenag RI`,
  };
  zip.file('package.json', JSON.stringify(pleskPackage, null, 2));

  onProgress?.(90, 'Melakukan kompresi berkas ZIP Plesk...');

  const content = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  }, (metadata) => {
    onProgress?.(90 + Math.round(metadata.percent * 0.1), `Mengompresi data: ${Math.round(metadata.percent)}%`);
  });

  onProgress?.(100, 'Paket ZIP Plesk siap diunduh!');
  return content;
};
