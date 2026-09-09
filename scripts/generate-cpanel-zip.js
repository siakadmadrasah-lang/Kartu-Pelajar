import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const dataDir = path.join(rootDir, 'data');
const publicDir = path.join(rootDir, 'public');

const dbConfig = {
  dbHost: 'localhost',
  dbName: 'masbagoes_kartupelajar',
  dbUser: 'masbagoes_kartupelajar',
  dbPass: 'masbagus15',
  domainName: 'kartu.madrasah.sch.id',
};

// 1. Read existing data
let dbData = {
  madrasah: {
    namaKementerian: 'KEMENTERIAN AGAMA REPUBLIK INDONESIA',
    namaMadrasah: "MI MA'ARIF NU 2 SANGGREMAN",
    nsm: '111233020050',
    npsn: '60710255',
    kemenagWilayah: 'KANTOR KEMENTERIAN AGAMA KABUPATEN BANYUMAS',
    provinsi: 'JAWA TENGAH',
    alamat: 'Jl. Sanggreman No. 02, Desa Sanggreman',
    kelurahanDesa: 'Sanggreman',
    kecamatan: 'Rawalo',
    kotaKab: 'Kab. Banyumas',
    kodePos: '53173',
    telepon: '(0281) 684-1234',
    email: 'mimaarifnu2sanggreman@gmail.com',
    website: 'www.mimaarifnu2sanggreman.sch.id',
    akreditasi: 'A',
    motto: 'Berakhlakul Karimah, Cerdas, Mandiri, dan Berprestasi',
    jabatanPenandatangan: 'Kepala Madrasah',
    labelIdPenandatangan: 'NIP',
    namaKepalaMadrasah: 'Siti Rochimah, S.Pd.I',
    nipKepalaMadrasah: '197605122005012001',
    kotaPenetapan: 'Banyumas',
    tanggalPenetapan: '15 Juli 2025',
    tahunPelajaran: '2025/2026',
    judulHeaderAplikasi: 'KARTU PELAJAR DIGITAL',
    subJudulHeaderAplikasi: "MI MA'ARIF NU 2 SANGGREMAN",
    badgeHeaderAplikasi: 'KEMENAG RI',
    showMadrasahInHeader: true,
  },
  students: [],
  cardConfig: {
    theme: 'kemenag-classic',
    barcodeType: 'both',
    qrContent: 'nisn',
    showHologram: true,
    showKemenagLogo: true,
    showMadrasahLogo: true,
    showSignature: true,
    showStamp: true,
    signatoryPosition: 'back',
    backContentPreset: 'tata-tertib',
    customBackTitle: 'KETENTUAN DAN TATA TERTIB SISWA',
    customBackNotes: [
      'Kartu ini adalah identitas resmi siswa Madrasah Ibtidaiyah.',
      'Wajib dibawa saat kegiatan belajar, ujian, dan kunjungan madrasah.',
      'Apabila kartu hilang atau rusak, segera hubungi bagian tata usaha madrasah.',
      'Dilarang menyalahgunakan kartu ini untuk keperluan yang melanggar tata tertib.',
    ],
  },
};

const candidateJson = [
  path.join(dataDir, 'database.json'),
  path.join(dataDir, 'persistent_database.json'),
  path.join(rootDir, 'backup_data_madrasah.json'),
];

for (const fp of candidateJson) {
  if (fs.existsSync(fp)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(fp, 'utf-8'));
      if (parsed) {
        if (parsed.madrasah) dbData.madrasah = parsed.madrasah;
        if (Array.isArray(parsed.students) && parsed.students.length > 0) dbData.students = parsed.students;
        if (parsed.cardConfig) dbData.cardConfig = parsed.cardConfig;
        break;
      }
    } catch (e) {}
  }
}

const madrasah = dbData.madrasah;
const students = dbData.students;
const cardConfig = dbData.cardConfig;

async function generateCpanelZip() {
  console.log(`Generating cPanel & Plesk Deployment ZIP with Database: ${dbConfig.dbName}...`);
  const zip = new JSZip();

  // 1. .htaccess
  const htaccess = `# ==============================================================================
# KONFIGURASI APACHE / NGINX REVERSE PROXY UNTUK CPANEL & PLESK
# Aplikasi: Generator Kartu Pelajar MI (Kemenag RI)
# Akun Database: ${dbConfig.dbName} (User: ${dbConfig.dbUser})
# ==============================================================================

<IfModule mod_rewrite.c>
    RewriteEngine On

    # API routes directed to PHP backend
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

    # SPA Fallback - Arahkan semua rute dinamis ke index.html
    RewriteRule ^ index.html [QSA,L]
</IfModule>

<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
</IfModule>
`;
  zip.file('.htaccess', htaccess);
  zip.file('web.config', `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="API Rewrite" stopProcessing="true">
          <match url="^api/(.*)$" />
          <action type="Rewrite" url="api/{R:1}.php" />
        </rule>
        <rule name="SPA Fallback" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>`);

  // 2. config.php & koneksi.php
  const configPhp = `<?php
/**
 * ==============================================================================
 * KONFIGURASI DATABASE MYSQL CPANEL & PLESK (PROTEKSI ANTI-HILANG DATA OTOMATIS)
 * Aplikasi: Generator Kartu Pelajar MI (Kemenag RI)
 * Database Name: ${dbConfig.dbName}
 * Database User: ${dbConfig.dbUser}
 * ==============================================================================
 */

// Cek custom config lokal jika pernah disimpan sebelumnya (Anti-Timpa)
if (file_exists(__DIR__ . '/config.local.php')) {
    require_once __DIR__ . '/config.local.php';
} elseif (file_exists(__DIR__ . '/data/db_custom_config.php')) {
    require_once __DIR__ . '/data/db_custom_config.php';
}

if (!defined('DB_HOST')) define('DB_HOST', getenv('DB_HOST') ?: '${dbConfig.dbHost}');
if (!defined('DB_NAME')) define('DB_NAME', getenv('DB_DATABASE') ?: '${dbConfig.dbName}');
if (!defined('DB_USER')) define('DB_USER', getenv('DB_USERNAME') ?: '${dbConfig.dbUser}');
if (!defined('DB_PASS')) define('DB_PASS', getenv('DB_PASSWORD') ?: '${dbConfig.dbPass}');
if (!defined('DB_PORT')) define('DB_PORT', getenv('DB_PORT') ?: 3306);

function getDbConnection() {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    try {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
        ];
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);

        // Auto-create essential tables if they do not exist
        $pdo->exec("CREATE TABLE IF NOT EXISTS madrasah_info (
          id INT(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
          nama_kementerian VARCHAR(255) DEFAULT 'KEMENTERIAN AGAMA REPUBLIK INDONESIA',
          nsm VARCHAR(50) DEFAULT NULL,
          npsn VARCHAR(50) DEFAULT NULL,
          nama_madrasah VARCHAR(255) NOT NULL,
          nama_singkat VARCHAR(100) DEFAULT NULL,
          kemenag_wilayah VARCHAR(255) DEFAULT NULL,
          alamat TEXT DEFAULT NULL,
          kelurahan_desa VARCHAR(100) DEFAULT NULL,
          kecamatan VARCHAR(100) DEFAULT NULL,
          kota_kabupaten VARCHAR(100) DEFAULT NULL,
          provinsi VARCHAR(100) DEFAULT NULL,
          kode_pos VARCHAR(20) DEFAULT NULL,
          telepon VARCHAR(50) DEFAULT NULL,
          email VARCHAR(100) DEFAULT NULL,
          website VARCHAR(100) DEFAULT NULL,
          akreditasi VARCHAR(10) DEFAULT 'A',
          motto TEXT DEFAULT NULL,
          jabatan_penandatangan VARCHAR(100) DEFAULT 'Kepala Madrasah',
          label_id_penandatangan VARCHAR(20) DEFAULT 'NIP',
          nama_kepala_madrasah VARCHAR(255) DEFAULT NULL,
          nip_kepala_madrasah VARCHAR(100) DEFAULT NULL,
          kota_penetapan VARCHAR(100) DEFAULT NULL,
          tanggal_penetapan VARCHAR(100) DEFAULT NULL,
          tahun_pelajaran VARCHAR(50) DEFAULT '2025/2026',
          judul_header_aplikasi VARCHAR(255) DEFAULT 'KARTU PELAJAR DIGITAL',
          sub_judul_header_aplikasi VARCHAR(255) DEFAULT NULL,
          badge_header_aplikasi VARCHAR(100) DEFAULT 'KEMENAG RI',
          show_madrasah_in_header TINYINT(1) DEFAULT 1,
          logo_aplikasi_url LONGTEXT DEFAULT NULL,
          logo_kemenag_url LONGTEXT DEFAULT NULL,
          logo_madrasah_url LONGTEXT DEFAULT NULL,
          logo_url LONGTEXT DEFAULT NULL,
          stempel_url LONGTEXT DEFAULT NULL,
          ttd_kepala_url LONGTEXT DEFAULT NULL,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

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

        $pdo->exec("CREATE TABLE IF NOT EXISTS kop_surat (
          id INT(11) NOT NULL AUTO_INCREMENT,
          config_json LONGTEXT DEFAULT NULL,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        $pdo->exec("CREATE TABLE IF NOT EXISTS activity_logs (
          id VARCHAR(100) NOT NULL,
          action VARCHAR(255) NOT NULL,
          operator VARCHAR(100) NOT NULL,
          details TEXT DEFAULT NULL,
          type VARCHAR(50) NOT NULL,
          timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    } catch (PDOException $e) {
        error_log('Koneksi MySQL gagal (' . DB_NAME . '): ' . $e->getMessage());
        $pdo = null;
    }
    return $pdo;
}
`;
  zip.file('config.php', configPhp);
  zip.file('koneksi.php', configPhp);

  // 3. .env
  const envContent = `DB_HOST=${dbConfig.dbHost}
DB_PORT=3306
DB_DATABASE=${dbConfig.dbName}
DB_USERNAME=${dbConfig.dbUser}
DB_PASSWORD=${dbConfig.dbPass}
APP_NAME="Generator Kartu Pelajar MI ${madrasah.namaMadrasah}"
APP_ENV=production
APP_URL=https://${dbConfig.domainName}
`;
  zip.file('.env', envContent);
  zip.file('.env.production', envContent);

  // 4. SQL Dump
  const escapeSql = (val) => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return val.toString();
    const str = String(val)
      .replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
        switch (char) {
          case '\0': return '\\0';
          case '\x08': return '\\b';
          case '\x09': return '\\t';
          case '\x1a': return '\\z';
          case '\n': return '\\n';
          case '\r': return '\\r';
          case '"':
          case "'":
          case '\\':
          case '%': return '\\' + char;
          default: return char;
        }
      });
    return `'${str}'`;
  };

  let studentInserts = '-- Tidak ada data siswa awal';
  if (students.length > 0) {
    const rows = students.map((s) => {
      const id = escapeSql(s.id);
      const nisn = escapeSql(s.nisn);
      const nis = escapeSql(s.nis);
      const nama = escapeSql(s.nama);
      const tempatLahir = escapeSql(s.tempatLahir || '');
      const tanggalLahir = escapeSql(s.tanggalLahir || '');
      const jenisKelamin = escapeSql(s.jenisKelamin === 'P' ? 'P' : 'L');
      const kelas = escapeSql(s.kelas || '1-A');
      const tahunAjaran = escapeSql(s.tahunAjaran || '2025/2026');
      const alamat = escapeSql(s.alamat || '');
      const namaWali = escapeSql(s.namaWali || '');
      const golonganDarah = escapeSql(s.golonganDarah || '-');
      const fotoUrl = escapeSql(s.fotoUrl || '');
      const berlakuSampai = escapeSql(s.berlakuSampai || 'Selama Menjadi Siswa');
      const status = escapeSql('aktif');
      return `(${id}, ${nisn}, ${nis}, ${nama}, ${tempatLahir}, ${tanggalLahir}, ${jenisKelamin}, ${kelas}, ${tahunAjaran}, ${alamat}, ${namaWali}, ${golonganDarah}, ${fotoUrl}, ${berlakuSampai}, ${status})`;
    });

    studentInserts = `INSERT IGNORE INTO \`siswa\` (\`id\`, \`nisn\`, \`nis\`, \`nama\`, \`tempat_lahir\`, \`tanggal_lahir\`, \`jenis_kelamin\`, \`kelas\`, \`tahun_ajaran\`, \`alamat\`, \`nama_wali\`, \`golongan_darah\`, \`foto_url\`, \`berlaku_sampai\`, \`status\`) VALUES\n` + rows.join(',\n') + ';';
  }

  const sqlDump = `-- ==============================================================================
-- DATABASE MYSQL CPANEL & PLESK: KARTU PELAJAR MI
-- Target Database: ${dbConfig.dbName}
-- Target User: ${dbConfig.dbUser}
-- Tanggal: ${new Date().toISOString()}
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+07:00";

CREATE TABLE IF NOT EXISTS \`madrasah_info\` (
  \`id\` INT(11) NOT NULL AUTO_INCREMENT,
  \`nama_kementerian\` VARCHAR(255) DEFAULT 'KEMENTERIAN AGAMA REPUBLIK INDONESIA',
  \`nsm\` VARCHAR(50) DEFAULT NULL,
  \`npsn\` VARCHAR(50) DEFAULT NULL,
  \`nama_madrasah\` VARCHAR(255) NOT NULL,
  \`nama_singkat\` VARCHAR(100) DEFAULT NULL,
  \`kemenag_wilayah\` VARCHAR(255) DEFAULT NULL,
  \`alamat\` TEXT DEFAULT NULL,
  \`kelurahan_desa\` VARCHAR(100) DEFAULT NULL,
  \`kecamatan\` VARCHAR(100) DEFAULT NULL,
  \`kota_kabupaten\` VARCHAR(100) DEFAULT NULL,
  \`provinsi\` VARCHAR(100) DEFAULT NULL,
  \`kode_pos\` VARCHAR(20) DEFAULT NULL,
  \`telepon\` VARCHAR(50) DEFAULT NULL,
  \`email\` VARCHAR(100) DEFAULT NULL,
  \`website\` VARCHAR(100) DEFAULT NULL,
  \`akreditasi\` VARCHAR(10) DEFAULT 'A',
  \`motto\` TEXT DEFAULT NULL,
  \`jabatan_penandatangan\` VARCHAR(100) DEFAULT 'Kepala Madrasah',
  \`label_id_penandatangan\` VARCHAR(20) DEFAULT 'NIP',
  \`nama_kepala_madrasah\` VARCHAR(255) DEFAULT NULL,
  \`nip_kepala_madrasah\` VARCHAR(100) DEFAULT NULL,
  \`kota_penetapan\` VARCHAR(100) DEFAULT NULL,
  \`tanggal_penetapan\` VARCHAR(100) DEFAULT NULL,
  \`tahun_pelajaran\` VARCHAR(50) DEFAULT '2025/2026',
  \`judul_header_aplikasi\` VARCHAR(255) DEFAULT 'KARTU PELAJAR DIGITAL',
  \`sub_judul_header_aplikasi\` VARCHAR(255) DEFAULT NULL,
  \`badge_header_aplikasi\` VARCHAR(100) DEFAULT 'KEMENAG RI',
  \`show_madrasah_in_header\` TINYINT(1) DEFAULT 1,
  \`logo_aplikasi_url\` LONGTEXT DEFAULT NULL,
  \`logo_kemenag_url\` LONGTEXT DEFAULT NULL,
  \`logo_madrasah_url\` LONGTEXT DEFAULT NULL,
  \`logo_url\` LONGTEXT DEFAULT NULL,
  \`stempel_url\` LONGTEXT DEFAULT NULL,
  \`ttd_kepala_url\` LONGTEXT DEFAULT NULL,
  \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`siswa\` (
  \`id\` VARCHAR(100) NOT NULL,
  \`nisn\` VARCHAR(50) NOT NULL,
  \`nis\` VARCHAR(50) NOT NULL,
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

CREATE TABLE IF NOT EXISTS \`kop_surat\` (
  \`id\` INT(11) NOT NULL AUTO_INCREMENT,
  \`config_json\` LONGTEXT DEFAULT NULL,
  \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`activity_logs\` (
  \`id\` VARCHAR(100) NOT NULL,
  \`action\` VARCHAR(255) NOT NULL,
  \`operator\` VARCHAR(100) NOT NULL,
  \`details\` TEXT DEFAULT NULL,
  \`type\` VARCHAR(50) NOT NULL,
  \`timestamp\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO \`madrasah_info\` (\`id\`, \`nama_kementerian\`, \`nsm\`, \`npsn\`, \`nama_madrasah\`, \`nama_singkat\`, \`kemenag_wilayah\`, \`alamat\`, \`kelurahan_desa\`, \`kecamatan\`, \`kota_kabupaten\`, \`provinsi\`, \`kode_pos\`, \`telepon\`, \`email\`, \`website\`, \`akreditasi\`, \`motto\`, \`jabatan_penandatangan\`, \`label_id_penandatangan\`, \`nama_kepala_madrasah\`, \`nip_kepala_madrasah\`, \`kota_penetapan\`, \`tanggal_penetapan\`, \`tahun_pelajaran\`, \`logo_aplikasi_url\`, \`logo_kemenag_url\`, \`logo_madrasah_url\`, \`stempel_url\`, \`ttd_kepala_url\`)
VALUES (1, ${escapeSql(madrasah.namaKementerian)}, ${escapeSql(madrasah.nsm)}, ${escapeSql(madrasah.npsn)}, ${escapeSql(madrasah.namaMadrasah)}, ${escapeSql(madrasah.namaMadrasah)}, ${escapeSql(madrasah.kemenagWilayah)}, ${escapeSql(madrasah.alamat)}, ${escapeSql(madrasah.kelurahanDesa)}, ${escapeSql(madrasah.kecamatan)}, ${escapeSql(madrasah.kotaKab)}, ${escapeSql(madrasah.provinsi)}, ${escapeSql(madrasah.kodePos)}, ${escapeSql(madrasah.telepon)}, ${escapeSql(madrasah.email)}, ${escapeSql(madrasah.website)}, ${escapeSql(madrasah.akreditasi)}, ${escapeSql(madrasah.motto)}, ${escapeSql(madrasah.jabatanPenandatangan)}, ${escapeSql(madrasah.labelIdPenandatangan)}, ${escapeSql(madrasah.namaKepalaMadrasah)}, ${escapeSql(madrasah.nipKepalaMadrasah)}, ${escapeSql(madrasah.kotaPenetapan)}, ${escapeSql(madrasah.tanggalPenetapan)}, ${escapeSql(madrasah.tahunPelajaran || '2025/2026')}, ${escapeSql(madrasah.logoAplikasiUrl || '')}, ${escapeSql(madrasah.logoKemenagUrl || '')}, ${escapeSql(madrasah.logoMadrasahUrl || '')}, ${escapeSql(madrasah.stempelUrl || '')}, ${escapeSql(madrasah.ttdKepalaUrl || '')});

INSERT IGNORE INTO \`pengaturan_kartu\` (\`id\`, \`theme\`, \`config_json\`)
VALUES (1, ${escapeSql(cardConfig.theme || 'kemenag-classic')}, ${escapeSql(JSON.stringify(cardConfig))});

${studentInserts}

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
`;
  zip.file(`${dbConfig.dbName}.sql`, sqlDump);
  zip.file('database.sql', sqlDump);

  // 5. auto_setup.php
  const autoSetupPhp = `<?php
/**
 * CPANEL & PLESK AUTOMATIC DATABASE INSTALLER & VERIFIER
 * Aplikasi: Generator Kartu Pelajar MI (Kemenag RI)
 * Target Database: ${dbConfig.dbName}
 * Target User: ${dbConfig.dbUser}
 */
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/config.php';

$results = [];
$status = 'success';

try {
    // 1. Tes Koneksi MySQL
    $pdo = getDbConnection();
    if (!$pdo) {
        throw new Exception('Koneksi PDO ke database gagal. Pastikan nama database, user, dan password di cPanel sudah sesuai.');
    }
    $results[] = [
        'step' => 'Koneksi MySQL',
        'status' => 'OK',
        'message' => 'Berhasil terhubung ke MySQL Server (' . DB_HOST . ') dengan user ' . DB_USER
    ];

    // 2. Baca file SQL
    $sqlFile = __DIR__ . '/${dbConfig.dbName}.sql';
    if (!file_exists($sqlFile)) {
        $sqlFile = __DIR__ . '/database.sql';
    }

    if (file_exists($sqlFile)) {
        $sqlContent = file_get_contents($sqlFile);
        $pdo->exec($sqlContent);
        $results[] = [
            'step' => 'Migrasi Skema & Data',
            'status' => 'OK',
            'message' => 'Tabel madrasah_info, siswa, pengaturan_kartu, kop_surat berhasil dipasang dan siap sinkronisasi otomatis.'
        ];
    } else {
        $results[] = [
            'step' => 'Migrasi Skema',
            'status' => 'WARNING',
            'message' => 'Berkas SQL dump tidak ditemukan di folder, tabel dasar dibuat otomatis oleh config.php.'
        ];
    }

    // 3. Hitung jumlah siswa
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM siswa");
    $totalSiswa = $stmt->fetch()['total'] ?? 0;
    $results[] = [
        'step' => 'Verifikasi Data Siswa & Sinkronisasi',
        'status' => 'OK',
        'message' => "Total siswa tersimpan di database MySQL: $totalSiswa siswa. Sinkronisasi otomatis AKTIF."
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
    <title>Auto Setup MySQL cPanel & Plesk - ${madrasah.namaMadrasah}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4 font-sans">
    <div class="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div class="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 text-white border-b border-emerald-700">
            <div class="flex items-center justify-between">
                <h1 class="text-xl font-black uppercase tracking-wide">cPanel & Plesk MySQL Auto-Setup</h1>
                <span class="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-black rounded-full uppercase">1-Click Auto</span>
            </div>
            <p class="text-xs text-emerald-200 mt-1">Status Verifikasi & Migrasi Database MySQL Otomatis (public_html / httpdocs)</p>
        </div>
        <div class="p-6 space-y-4">
            <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2 font-mono">
                <div class="flex justify-between text-slate-400"><span>Database Name:</span><strong class="text-amber-400"><?= htmlspecialchars(DB_NAME) ?></strong></div>
                <div class="flex justify-between text-slate-400"><span>Database User:</span><strong class="text-emerald-400"><?= htmlspecialchars(DB_USER) ?></strong></div>
                <div class="flex justify-between text-slate-400"><span>Host:</span><strong class="text-white"><?= htmlspecialchars(DB_HOST) ?></strong></div>
                <div class="flex justify-between text-slate-400"><span>Mode Sync:</span><strong class="text-emerald-400">Otomatis Simpan ke MySQL</strong></div>
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
                <span class="text-[10px] text-slate-500">cPanel & Plesk Ready v2.5</span>
            </div>
        </div>
    </div>
</body>
</html>
`;
  zip.file('auto_setup.php', autoSetupPhp);

  // 6. Copy PHP API Endpoints from dist/api or generate them
  const apiDir = path.join(distDir, 'api');
  if (fs.existsSync(apiDir)) {
    const apiFiles = fs.readdirSync(apiDir);
    for (const f of apiFiles) {
      if (f.endsWith('.php')) {
        zip.file(`api/${f}`, fs.readFileSync(path.join(apiDir, f), 'utf-8'));
      }
    }
  }

  // Fallback / guarantee core API scripts exist
  const dataPhp = `<?php
require_once __DIR__ . '/../config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$action = $_GET['action'] ?? '';

if ($action === 'db_status') {
    $connected = false;
    $totalSiswa = 0;
    try {
        $pdo = getDbConnection();
        if ($pdo) {
            $connected = true;
            $stmt = $pdo->query("SELECT COUNT(*) as c FROM siswa");
            $totalSiswa = (int)($stmt->fetch()['c'] ?? 0);
        }
    } catch (Exception $e) {}

    echo json_encode([
        'connected' => $connected,
        'mysqlConnected' => $connected,
        'totalSiswa' => $totalSiswa,
        'dbName' => DB_NAME,
        'dbUser' => DB_USER,
        'serverTime' => date('c')
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);

    if (!$input) {
        echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
        exit;
    }

    $lastUpdated = date('c');
    $pdo = getDbConnection();
    $mysqlOk = false;

    if ($pdo) {
        try {
            $pdo->beginTransaction();

            // 1. Simpan Profil Madrasah
            if (isset($input['madrasah']) && is_array($input['madrasah'])) {
                $m = $input['madrasah'];
                $stmtM = $pdo->prepare("INSERT INTO madrasah_info (
                    id, nama_kementerian, nsm, npsn, nama_madrasah, kemenag_wilayah, alamat,
                    kelurahan_desa, kecamatan, kota_kabupaten, provinsi, kode_pos, telepon,
                    email, website, akreditasi, motto, jabatan_penandatangan, label_id_penandatangan,
                    nama_kepala_madrasah, nip_kepala_madrasah, kota_penetapan, tanggal_penetapan,
                    tahun_pelajaran, logo_aplikasi_url, logo_kemenag_url, logo_madrasah_url,
                    stempel_url, ttd_kepala_url, updated_at
                ) VALUES (
                    1, :kemen, :nsm, :npsn, :nama, :wil, :alamat,
                    :desa, :kec, :kota, :prov, :kpos, :tel,
                    :email, :web, :akred, :motto, :jab, :lbl,
                    :kepala, :nip, :k_tetap, :t_tetap,
                    :thn, :logo_app, :logo_kemen, :logo_mad,
                    :stempel, :ttd, NOW()
                ) ON DUPLICATE KEY UPDATE
                    nama_kementerian=VALUES(nama_kementerian), nsm=VALUES(nsm), npsn=VALUES(npsn),
                    nama_madrasah=VALUES(nama_madrasah), kemenag_wilayah=VALUES(kemenag_wilayah),
                    alamat=VALUES(alamat), kelurahan_desa=VALUES(kelurahan_desa), kecamatan=VALUES(kecamatan),
                    kota_kabupaten=VALUES(kota_kabupaten), provinsi=VALUES(provinsi), kode_pos=VALUES(kode_pos),
                    telepon=VALUES(telepon), email=VALUES(email), website=VALUES(website),
                    akreditasi=VALUES(akreditasi), motto=VALUES(motto), jabatan_penandatangan=VALUES(jabatan_penandatangan),
                    label_id_penandatangan=VALUES(label_id_penandatangan), nama_kepala_madrasah=VALUES(nama_kepala_madrasah),
                    nip_kepala_madrasah=VALUES(nip_kepala_madrasah), kota_penetapan=VALUES(kota_penetapan),
                    tanggal_penetapan=VALUES(tanggal_penetapan), tahun_pelajaran=VALUES(tahun_pelajaran),
                    logo_aplikasi_url=VALUES(logo_aplikasi_url), logo_kemenag_url=VALUES(logo_kemenag_url),
                    logo_madrasah_url=VALUES(logo_madrasah_url), stempel_url=VALUES(stempel_url),
                    ttd_kepala_url=VALUES(ttd_kepala_url), updated_at=NOW()");

                $stmtM->execute([
                    ':kemen' => (string)($m['namaKementerian'] ?? 'KEMENTERIAN AGAMA REPUBLIK INDONESIA'),
                    ':nsm' => (string)($m['nsm'] ?? ''),
                    ':npsn' => (string)($m['npsn'] ?? ''),
                    ':nama' => (string)($m['namaMadrasah'] ?? ''),
                    ':wil' => (string)($m['kemenagWilayah'] ?? ''),
                    ':alamat' => (string)($m['alamat'] ?? ''),
                    ':desa' => (string)($m['kelurahanDesa'] ?? ''),
                    ':kec' => (string)($m['kecamatan'] ?? ''),
                    ':kota' => (string)($m['kotaKab'] ?? ''),
                    ':prov' => (string)($m['provinsi'] ?? ''),
                    ':kpos' => (string)($m['kodePos'] ?? ''),
                    ':tel' => (string)($m['telepon'] ?? ''),
                    ':email' => (string)($m['email'] ?? ''),
                    ':web' => (string)($m['website'] ?? ''),
                    ':akred' => (string)($m['akreditasi'] ?? 'A'),
                    ':motto' => (string)($m['motto'] ?? ''),
                    ':jab' => (string)($m['jabatanPenandatangan'] ?? 'Kepala Madrasah'),
                    ':lbl' => (string)($m['labelIdPenandatangan'] ?? 'NIP'),
                    ':kepala' => (string)($m['namaKepalaMadrasah'] ?? ''),
                    ':nip' => (string)($m['nipKepalaMadrasah'] ?? ''),
                    ':k_tetap' => (string)($m['kotaPenetapan'] ?? ''),
                    ':t_tetap' => (string)($m['tanggalPenetapan'] ?? ''),
                    ':thn' => (string)($m['tahunPelajaran'] ?? '2025/2026'),
                    ':logo_app' => (string)($m['logoAplikasiUrl'] ?? ''),
                    ':logo_kemen' => (string)($m['logoKemenagUrl'] ?? ''),
                    ':logo_mad' => (string)($m['logoMadrasahUrl'] ?? ''),
                    ':stempel' => (string)($m['stempelUrl'] ?? ''),
                    ':ttd' => (string)($m['ttdKepalaUrl'] ?? '')
                ]);
            }

            // 2. Simpan Desain Kartu
            if (isset($input['cardConfig']) && is_array($input['cardConfig'])) {
                $c = $input['cardConfig'];
                $configJson = json_encode($c, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                $stmtC = $pdo->prepare("INSERT INTO pengaturan_kartu (id, theme, config_json, updated_at) VALUES (1, :theme, :cfg, NOW()) ON DUPLICATE KEY UPDATE theme=VALUES(theme), config_json=VALUES(config_json), updated_at=NOW()");
                $stmtC->execute([
                    ':theme' => (string)($c['theme'] ?? 'kemenag-classic'),
                    ':cfg' => $configJson
                ]);
            }

            // 3. Simpan Kop Surat
            if (isset($input['kopSuratConfig']) && is_array($input['kopSuratConfig'])) {
                $k = $input['kopSuratConfig'];
                $kopJson = json_encode($k, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                $stmtK = $pdo->prepare("INSERT INTO kop_surat (id, config_json, updated_at) VALUES (1, :cfg, NOW()) ON DUPLICATE KEY UPDATE config_json=VALUES(config_json), updated_at=NOW()");
                $stmtK->execute([':cfg' => $kopJson]);
            }

            // 4. Simpan Siswa
            if (isset($input['students']) && is_array($input['students'])) {
                $pdo->exec("DELETE FROM siswa");
                $stmtS = $pdo->prepare("INSERT INTO siswa (
                    id, nisn, nis, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, kelas, tahun_ajaran,
                    agama, alamat, nama_wali, golongan_darah, foto_url, berlaku_sampai, status, created_at, updated_at
                ) VALUES (
                    :id, :nisn, :nis, :nama, :tempat, :tanggal, :jk, :kelas, :tahun,
                    :agama, :alamat, :wali, :goldar, :foto, :berlaku, 'aktif', NOW(), NOW()
                )");

                foreach ($input['students'] as $s) {
                    if (empty($s['nama']) && empty($s['nisn']) && empty($s['nis'])) continue;
                    $stmtS->execute([
                        ':id' => (string)($s['id'] ?? uniqid('std_')),
                        ':nisn' => (string)($s['nisn'] ?? ''),
                        ':nis' => (string)($s['nis'] ?? ''),
                        ':nama' => (string)($s['nama'] ?? ''),
                        ':tempat' => (string)($s['tempatLahir'] ?? ''),
                        ':tanggal' => (string)($s['tanggalLahir'] ?? ''),
                        ':jk' => (strtoupper($s['jenisKelamin'] ?? 'L') === 'P' ? 'P' : 'L'),
                        ':kelas' => (string)($s['kelas'] ?? '1-A'),
                        ':tahun' => (string)($s['tahunAjaran'] ?? '2025/2026'),
                        ':agama' => (string)($s['agama'] ?? 'Islam'),
                        ':alamat' => (string)($s['alamat'] ?? ''),
                        ':wali' => (string)($s['namaWali'] ?? ''),
                        ':goldar' => (string)($s['golonganDarah'] ?? '-'),
                        ':foto' => (string)($s['fotoUrl'] ?? ''),
                        ':berlaku' => (string)($s['berlakuSampai'] ?? 'Selama Menjadi Siswa')
                    ]);
                }
            }

            $pdo->commit();
            $mysqlOk = true;
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            error_log("Gagal sync ke MySQL: " . $e->getMessage());
        }
    }

    // File backup lokal anti-timpa
    $dataDir = __DIR__ . '/../data';
    if (!is_dir($dataDir)) @mkdir($dataDir, 0755, true);
    $input['lastUpdated'] = $lastUpdated;
    @file_put_contents($dataDir . '/database.json', json_encode($input, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    @file_put_contents($dataDir . '/persistent_database.json', json_encode($input, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    $totalStudents = isset($input['students']) ? count($input['students']) : 0;
    echo json_encode([
        'success' => true,
        'status' => 'success',
        'message' => $mysqlOk ? 'Data tersimpan otomatis ke MySQL cPanel & Backup Lokal' : 'Data tersimpan di penyimpanan fallback',
        'mysqlConnected' => $mysqlOk,
        'lastUpdated' => $lastUpdated,
        'totalStudents' => $totalStudents
    ]);
    exit;
}

// GET REQUEST: Ambil data dari MySQL atau JSON
$response = [
    'success' => true,
    'status' => 'success',
    'mysqlConnected' => false,
    'data' => null
];

$pdo = getDbConnection();
$foundInMysql = false;

if ($pdo) {
    try {
        $mRow = $pdo->query("SELECT * FROM madrasah_info LIMIT 1")->fetch();
        if ($mRow) {
            $madrasahData = [
                'namaKementerian' => $mRow['nama_kementerian'] ?? '',
                'nsm' => $mRow['nsm'] ?? '',
                'npsn' => $mRow['npsn'] ?? '',
                'namaMadrasah' => $mRow['nama_madrasah'] ?? '',
                'namaSingkat' => $mRow['nama_singkat'] ?? '',
                'kemenagWilayah' => $mRow['kemenag_wilayah'] ?? '',
                'alamat' => $mRow['alamat'] ?? '',
                'kelurahanDesa' => $mRow['kelurahan_desa'] ?? '',
                'kecamatan' => $mRow['kecamatan'] ?? '',
                'kotaKab' => $mRow['kota_kabupaten'] ?? '',
                'provinsi' => $mRow['provinsi'] ?? '',
                'kodePos' => $mRow['kode_pos'] ?? '',
                'telepon' => $mRow['telepon'] ?? '',
                'email' => $mRow['email'] ?? '',
                'website' => $mRow['website'] ?? '',
                'akreditasi' => $mRow['akreditasi'] ?? 'A',
                'motto' => $mRow['motto'] ?? '',
                'jabatanPenandatangan' => $mRow['jabatan_penandatangan'] ?? 'Kepala Madrasah',
                'labelIdPenandatangan' => $mRow['label_id_penandatangan'] ?? 'NIP',
                'namaKepalaMadrasah' => $mRow['nama_kepala_madrasah'] ?? '',
                'nipKepalaMadrasah' => $mRow['nip_kepala_madrasah'] ?? '',
                'kotaPenetapan' => $mRow['kota_penetapan'] ?? '',
                'tanggalPenetapan' => $mRow['tanggal_penetapan'] ?? '',
                'tahunPelajaran' => $mRow['tahun_pelajaran'] ?? '2025/2026',
                'logoAplikasiUrl' => $mRow['logo_aplikasi_url'] ?? '',
                'logoKemenagUrl' => $mRow['logo_kemenag_url'] ?? '',
                'logoMadrasahUrl' => $mRow['logo_madrasah_url'] ?? '',
                'stempelUrl' => $mRow['stempel_url'] ?? '',
                'ttdKepalaUrl' => $mRow['ttd_kepala_url'] ?? ''
            ];

            // Card Config
            $cRow = $pdo->query("SELECT * FROM pengaturan_kartu LIMIT 1")->fetch();
            $cardConfigData = [];
            if ($cRow && !empty($cRow['config_json'])) {
                $cardConfigData = json_decode($cRow['config_json'], true) ?: [];
            }

            // Kop Surat
            $kRow = $pdo->query("SELECT * FROM kop_surat LIMIT 1")->fetch();
            $kopConfigData = null;
            if ($kRow && !empty($kRow['config_json'])) {
                $kopConfigData = json_decode($kRow['config_json'], true);
            }

            // Siswa
            $sRows = $pdo->query("SELECT * FROM siswa ORDER BY kelas ASC, nama ASC")->fetchAll();
            $studentsData = [];
            foreach ($sRows as $s) {
                $studentsData[] = [
                    'id' => $s['id'],
                    'nisn' => $s['nisn'],
                    'nis' => $s['nis'],
                    'nama' => $s['nama'],
                    'tempatLahir' => $s['tempat_lahir'] ?? '',
                    'tanggalLahir' => $s['tanggal_lahir'] ?? '',
                    'jenisKelamin' => $s['jenis_kelamin'] ?? 'L',
                    'kelas' => $s['kelas'] ?? '1-A',
                    'tahunAjaran' => $s['tahun_ajaran'] ?? '2025/2026',
                    'agama' => $s['agama'] ?? 'Islam',
                    'alamat' => $s['alamat'] ?? '',
                    'namaWali' => $s['nama_wali'] ?? '',
                    'golonganDarah' => $s['golongan_darah'] ?? '-',
                    'fotoUrl' => $s['foto_url'] ?? '',
                    'berlakuSampai' => $s['berlaku_sampai'] ?? 'Selama Menjadi Siswa'
                ];
            }

            $response['mysqlConnected'] = true;
            $response['data'] = [
                'madrasah' => $madrasahData,
                'cardConfig' => $cardConfigData,
                'kopSuratConfig' => $kopConfigData,
                'students' => $studentsData,
                'lastUpdated' => date('c'),
                'mysqlConnected' => true
            ];
            $foundInMysql = true;
        }
    } catch (Exception $e) {}
}

if (!$foundInMysql) {
    $fallbackFiles = [
        __DIR__ . '/../data/persistent_database.json',
        __DIR__ . '/../data/database.json',
        __DIR__ . '/../backup_data_madrasah.json'
    ];
    foreach ($fallbackFiles as $ff) {
        if (file_exists($ff)) {
            $raw = @file_get_contents($ff);
            $parsed = json_decode($raw, true);
            if ($parsed && isset($parsed['madrasah'])) {
                $response['data'] = $parsed;
                break;
            }
        }
    }
}

echo json_encode($response);
`;
  zip.file('api/data.php', dataPhp);
  zip.file('api/sync.php', dataPhp);
  zip.file('api/students.php', dataPhp);

  // 7. Read documentation
  const cpanelReadme = `# PANDUAN DEPLOYMENT APLIKASI KARTU PELAJAR MI DI CPANEL
Lembaga: ${madrasah.namaMadrasah}
NSM: ${madrasah.nsm} | NPSN: ${madrasah.npsn}
Domain Target: ${dbConfig.domainName}

---

## 🛡️ SISTEM SINKRONISASI & PENYIMPANAN OTOMATIS KE MYSQL
Aplikasi ini sudah diprogram untuk menyimpan dan melakukan sinkronisasi otomatis ke database MySQL cPanel:
1. **Auto-Table Migration**: Skrip \`config.php\` dan \`auto_setup.php\` akan otomatis memverifikasi dan membuat tabel (\`madrasah_info\`, \`siswa\`, \`pengaturan_kartu\`, \`kop_surat\`, \`activity_logs\`).
2. **Instant Sync**: Setiap penambahan siswa, pembaruan identitas madrasah, atau desain kartu akan otomatis tersimpan langsung ke MySQL via REST API \`api/data.php\`.
3. **Anti-Timpa**: Ekstraksi ZIP baru di \`public_html\` tidak akan menghapus data yang telah tersimpan di MySQL.

---

## 🗄️ INFORMASI KREDENSIAL DATABASE MYSQL CPANEL
- **Database Host**: \`${dbConfig.dbHost}\` (biasanya \`localhost\`)
- **Database Name**: \`${dbConfig.dbName}\`
- **Database Username**: \`${dbConfig.dbUser}\`
- **Database Password**: \`${dbConfig.dbPass}\`
- **Port**: \`3306\`
- **Berkas Dump SQL**: \`database.sql\` / \`${dbConfig.dbName}.sql\`

---

## 🚀 3 LANGKAH MUDAH DEPLOY DI CPANEL:

### 1. Buat Database & User di cPanel
1. Login ke **cPanel**.
2. Buka menu **MySQL® Databases** (atau **MySQL Database Wizard**).
3. Buat database: \`${dbConfig.dbName}\`
4. Buat user database: \`${dbConfig.dbUser}\` dengan password: \`${dbConfig.dbPass}\`
5. Hubungkan user ke database dan centang **ALL PRIVILEGES** & klik **Make Changes**.

### 2. Upload & Ekstrak ZIP di File Manager
1. Buka **File Manager** di cPanel.
2. Buka folder **\`public_html\`** (atau folder subdomain Anda).
3. Upload berkas ZIP ini.
4. Klik kanan pada file ZIP, lalu pilih **Extract**.

### 3. Eksekusi Auto-Setup
1. Buka browser dan kunjungi:
   \`https://${dbConfig.domainName}/auto_setup.php\`
2. Anda akan melihat laporan hijau: **Status Verifikasi & Migrasi Database MySQL Otomatis**.
3. Selesai! Buka \`https://${dbConfig.domainName}\` untuk menggunakan aplikasi. Semua data akan tersimpan langsung di MySQL!
`;
  zip.file('CPANEL_PANDUAN_DEPLOY.md', cpanelReadme);
  zip.file('PLESK_PANDUAN_DEPLOY.md', cpanelReadme.replace(/cPanel/g, 'Plesk').replace(/public_html/g, 'httpdocs'));

  // 8. Bundle production app files from dist
  if (fs.existsSync(distDir)) {
    const addDirFiles = (currentDir, relDir = '') => {
      const files = fs.readdirSync(currentDir);
      for (const f of files) {
        // Exclude server.cjs and maps
        if (f.startsWith('server.cjs') || f.endsWith('.map') || f.endsWith('.zip')) continue;
        const fullPath = path.join(currentDir, f);
        const relPath = relDir ? `${relDir}/${f}` : f;
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          addDirFiles(fullPath, relPath);
        } else {
          // If index.html, relativize asset paths
          if (f === 'index.html') {
            let htmlText = fs.readFileSync(fullPath, 'utf-8');
            htmlText = htmlText.replace(/(src|href)=["']\/assets\//g, '$1="./assets/');
            const schoolTitle = `Kartu Pelajar - ${madrasah.namaMadrasah}`;
            htmlText = htmlText.replace(/<title>.*?<\/title>/gi, `<title>${schoolTitle}</title>`);
            zip.file(relPath, htmlText);
          } else {
            zip.file(relPath, fs.readFileSync(fullPath));
          }
        }
      }
    };
    addDirFiles(distDir);
  }

  // Backup data madrasah JSON
  const backupData = {
    app: 'Generator Kartu Pelajar Madrasah Ibtidaiyah',
    version: '2.5.0',
    exportedAt: new Date().toISOString(),
    mysqlConfig: dbConfig,
    madrasah,
    cardConfig,
    studentsCount: students.length,
    students,
  };
  zip.file('backup_data_madrasah.json', JSON.stringify(backupData, null, 2));
  zip.file('data/database.default.json', JSON.stringify(backupData, null, 2));

  // Generate buffer
  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  const targetFileName = `CPANEL_DEPLOY_${dbConfig.dbName}.zip`;
  const outPublic = path.join(publicDir, targetFileName);
  const outDist = path.join(distDir, targetFileName);
  const outAliasPublic = path.join(publicDir, 'cpanel_deploy_kartu_pelajar.zip');
  const outAliasDist = path.join(distDir, 'cpanel_deploy_kartu_pelajar.zip');

  fs.writeFileSync(outPublic, buffer);
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(outDist, buffer);
    fs.writeFileSync(outAliasDist, buffer);
  }
  fs.writeFileSync(outAliasPublic, buffer);

  console.log(`[ZIP Created Successfully] File size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
  console.log(`- ${outPublic}`);
  console.log(`- ${outDist}`);
}

generateCpanelZip().catch(console.error);
