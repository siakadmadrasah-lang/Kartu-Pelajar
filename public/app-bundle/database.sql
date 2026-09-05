-- ==============================================================================
-- STRUKTUR DATABASE MYSQL KARTU PELAJAR MADRASAH IBTIDAIYAH
-- ==============================================================================

SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- Struktur tabel madrasah_info
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `madrasah_info` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama_kementerian` varchar(255) DEFAULT 'KEMENTERIAN AGAMA REPUBLIK INDONESIA',
  `nsm` varchar(50) NOT NULL,
  `npsn` varchar(50) NOT NULL,
  `nama_madrasah` varchar(255) NOT NULL,
  `nama_singkat` varchar(100) DEFAULT NULL,
  `kemenag_wilayah` varchar(255) DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  `kelurahan_desa` varchar(100) DEFAULT NULL,
  `kecamatan` varchar(100) DEFAULT NULL,
  `kota_kabupaten` varchar(100) DEFAULT NULL,
  `provinsi` varchar(100) DEFAULT 'JAWA TENGAH',
  `kode_pos` varchar(20) DEFAULT NULL,
  `telepon` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `website` varchar(150) DEFAULT NULL,
  `akreditasi` varchar(20) DEFAULT 'A',
  `motto` varchar(255) DEFAULT NULL,
  `jabatan_penandatangan` varchar(100) DEFAULT 'Kepala Madrasah',
  `label_id_penandatangan` varchar(50) DEFAULT 'NIP',
  `nama_kepala_madrasah` varchar(255) DEFAULT NULL,
  `nip_kepala_madrasah` varchar(100) DEFAULT NULL,
  `kota_penetapan` varchar(100) DEFAULT NULL,
  `tanggal_penetapan` varchar(100) DEFAULT NULL,
  `logo_aplikasi_url` longtext DEFAULT NULL,
  `logo_kemenag_url` longtext DEFAULT NULL,
  `logo_madrasah_url` longtext DEFAULT NULL,
  `stempel_url` longtext DEFAULT NULL,
  `ttd_kepala_url` longtext DEFAULT NULL,
  `tahun_pelajaran` varchar(50) DEFAULT '2025/2026',
  `judul_header_aplikasi` varchar(255) DEFAULT 'KARTU PELAJAR DIGITAL',
  `sub_judul_header_aplikasi` varchar(255) DEFAULT "MI MA'ARIF NU 2 SANGGREMAN",
  `badge_header_aplikasi` varchar(100) DEFAULT 'KEMENAG RI',
  `show_madrasah_in_header` tinyint(1) DEFAULT 1,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Data awal untuk tabel madrasah_info
-- --------------------------------------------------------
INSERT INTO `madrasah_info` (`id`, `nama_kementerian`, `nsm`, `npsn`, `nama_madrasah`, `nama_singkat`, `kemenag_wilayah`, `alamat`, `kelurahan_desa`, `kecamatan`, `kota_kabupaten`, `provinsi`, `kode_pos`, `telepon`, `email`, `website`, `akreditasi`, `motto`, `jabatan_penandatangan`, `label_id_penandatangan`, `nama_kepala_madrasah`, `nip_kepala_madrasah`, `kota_penetapan`, `tanggal_penetapan`, `tahun_pelajaran`, `judul_header_aplikasi`, `sub_judul_header_aplikasi`, `badge_header_aplikasi`, `show_madrasah_in_header`) VALUES
(1, 'KEMENTERIAN AGAMA REPUBLIK INDONESIA', '111233020084', '60721868', "MI MA'ARIF NU 2 SANGGREMAN", "MI MA'ARIF NU 2 SANGGREMAN", 'KANTOR KEMENTERIAN AGAMA KABUPATEN BANYUMAS', 'Jl. Sanggreman No. 02, Desa Sanggreman', 'Sanggreman', 'Rawalo', 'Kab. Banyumas', 'JAWA TENGAH', '53173', '(0281) 684-1234', 'mimaarifnu2sanggreman@gmail.com', 'www.mimaarifnu2sanggreman.sch.id', 'A', 'Berakhlakul Karimah, Cerdas, Mandiri, dan Berprestasi', 'Kepala Madrasah', 'NIP', 'Siti Rochimah, S.Pd.I', '197605122005012001', 'Banyumas', '15 Juli 2025', '2025/2026', 'KARTU PELAJAR DIGITAL', "MI MA'ARIF NU 2 SANGGREMAN", 'KEMENAG RI', 1)
ON DUPLICATE KEY UPDATE `nama_madrasah`=VALUES(`nama_madrasah`);

-- --------------------------------------------------------
-- Struktur tabel siswa
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `siswa` (
  `id` varchar(64) NOT NULL,
  `nisn` varchar(30) NOT NULL,
  `nis` varchar(30) DEFAULT NULL,
  `nama` varchar(255) NOT NULL,
  `tempat_lahir` varchar(100) DEFAULT NULL,
  `tanggal_lahir` varchar(100) DEFAULT NULL,
  `jenis_kelamin` enum('L','P') DEFAULT 'L',
  `kelas` varchar(50) NOT NULL,
  `tahun_ajaran` varchar(30) DEFAULT '2025/2026',
  `agama` varchar(50) DEFAULT 'Islam',
  `alamat` text DEFAULT NULL,
  `nama_wali` varchar(255) DEFAULT NULL,
  `golongan_darah` varchar(10) DEFAULT '-',
  `foto_url` longtext DEFAULT NULL,
  `berlaku_sampai` varchar(100) DEFAULT 'Selama Menjadi Siswa',
  `status` enum('aktif','alumni','mutasi') DEFAULT 'aktif',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `nisn` (`nisn`),
  KEY `kelas` (`kelas`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Struktur tabel pengaturan_kartu
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `pengaturan_kartu` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `theme` varchar(50) DEFAULT 'kemenag-green',
  `config_json` longtext DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `pengaturan_kartu` (`id`, `theme`, `config_json`) VALUES
(1, 'kemenag-green', '{"theme":"kemenag-green","cardWidth":85.6,"cardHeight":53.98,"borderRadius":10,"showBarcode":true,"barcodeType":"QR","showPhoto":true,"showSignature":true,"showStamp":true}')
ON DUPLICATE KEY UPDATE `theme`=VALUES(`theme`);

SET FOREIGN_KEY_CHECKS=1;
COMMIT;
