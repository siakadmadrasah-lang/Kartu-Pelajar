export type Gender = 'L' | 'P';

export type CardOrientation = 'landscape' | 'portrait';

export type CardTheme = 
  | 'kemenag-green'
  | 'royal-emerald'
  | 'gold-madrasah'
  | 'navy-islamic'
  | 'maroon-classic'
  | 'modern-teal';

export type WatermarkPattern = 'islamic-star' | 'arabesque' | 'batik-kemenag' | 'guilloche' | 'none';

export type BackContentPreset = 'tata-tertib' | 'janji-siswa' | 'visi-misi' | 'ketentuan-kartu' | 'custom';

export type StudentImportMode = 'merge' | 'append' | 'replace';

export interface Student {
  id: string;
  nama: string;
  nisn: string;
  nis: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: Gender;
  kelas: string; // e.g. "I-A", "IV-B", "VI"
  tahunAjaran: string;
  agama: string;
  golonganDarah?: string;
  alamat: string;
  namaWali?: string;
  fotoUrl: string;
  berlakuSampai: string;
}

export interface MadrasahInfo {
  namaKementerian?: string; // e.g. "KEMENTERIAN AGAMA REPUBLIK INDONESIA" (Dapat diedit bebas sesuai instansi/yayasan)
  namaMadrasah: string; // e.g. "MADRASAH IBTIDAIYAH NEGERI 1 KOTA MALANG"
  namaMadrasahKop?: string; // e.g. "MI MA'ARIF NU 2 SANGGREMAN" - Khusus judul kop kartu & kop surat
  namaSatuanPendidikan?: string; // e.g. "MI MA'ARIF NU 2 SANGGREMAN" - Khusus rincian biodata identitas siswa
  nsm: string; // Nomor Statistik Madrasah 12 digit
  npsn: string; // Nomor Pokok Sekolah Nasional 8 digit
  kemenagWilayah: string; // e.g. "KANTOR KEMENTERIAN AGAMA KOTA MALANG"
  provinsi: string;
  alamat: string;
  kelurahanDesa: string;
  kecamatan: string;
  kotaKab: string;
  kodePos: string;
  telepon: string;
  email: string;
  website: string;
  akreditasi: 'A' | 'B' | 'C' | 'Unggul' | '-';
  motto: string; // e.g. "Madrasah Mandiri Berprestasi"
  jabatanPenandatangan?: string; // e.g. "Kepala Madrasah", "Plt. Kepala Madrasah", "Waka Kesiswaan", "Ketua Yayasan"
  labelIdPenandatangan?: string; // e.g. "NIP", "NIY", "NUPTK", "NRG", "PegID"
  namaKepalaMadrasah: string;
  nipKepalaMadrasah: string;
  kotaPenetapan: string;
  tanggalPenetapan: string;
  tahunPelajaran?: string; // e.g. "2025/2026" - Tahun Pelajaran Aktif Lembaga yang berlaku global (Kartu, Surat, Filter, Siswa)
  logoAplikasiUrl?: string; // Logo khusus untuk Web Application / Header / Navigasi
  judulHeaderAplikasi?: string; // Judul khusus Header Aplikasi Web (Terpisah dari nama madrasah kop kartu)
  subJudulHeaderAplikasi?: string; // Sub-judul / Keterangan di bawah Judul Header Aplikasi
  badgeHeaderAplikasi?: string; // Teks badge samping judul header (e.g. "Kemenag", "Official", "SIAKAD")
  showMadrasahInHeader?: boolean; // Tampilkan nama madrasah sebagai sub-judul / label di header
  logoKemenagUrl?: string;  // Logo Kemenag RI di kop kiri kartu
  logoMadrasahUrl?: string; // Logo Madrasah / Sekolah di kop kanan kartu
  stempelUrl?: string;      // Stempel cap basah kartu
  ttdKepalaUrl?: string;    // Tanda tangan pejabat pengesahan kartu
}

export interface CardConfig {
  orientation: CardOrientation;
  theme: CardTheme;
  watermark: WatermarkPattern;
  showBarcode: boolean;
  barcodeType: 'nisn' | 'nis';
  showQrCode: boolean;
  qrContent: 'nisn' | 'verification_url' | 'vcard' | 'nis';
  customQrUrl?: string;
  showHologram: boolean;
  logoMode?: 'both' | 'left_only' | 'right_only' | 'none' | 'kemenag_only' | 'madrasah_only'; // Pilihan 1 logo (kiri/kanan), 2 logo (kiri & kanan), atau tanpa logo
  singleLogoSource?: 'kemenag' | 'madrasah'; // Sumber gambar logo jika memilih 1 logo saja (apakah memakai file Logo Kemenag atau Logo Madrasah)
  showKemenagLogo: boolean;
  showMadrasahLogo: boolean;
  showNamaKementerian?: boolean; // Aktifkan / Nonaktifkan nama kementerian di baris 1 kop kartu
  showNamaKementerianSurat?: boolean; // Aktifkan / Nonaktifkan nama kementerian di baris 1 kop surat
  showSignature: boolean;
  showStamp: boolean;
  signatoryPosition?: 'back' | 'front' | 'both';
  stampOpacity?: number;
  backContentPreset: BackContentPreset;
  customBackNotes: string[];
  customBackTitle: string;
  cardRadius: 'rounded-md' | 'rounded-xl' | 'rounded-none';
  showBloodType: boolean;
  showAddress: boolean;
  showParentName: boolean;
  showExpiryDate: boolean;
}

export type AdminRole = 'superadmin' | 'operator' | 'viewer';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: AdminRole;
  roleTitle: string;
  institution: string;
  avatarUrl?: string;
  lastLogin: string;
  isAuthenticated: boolean;
}

export interface ActivityLog {
  id: string;
  action: string;
  timestamp: string;
  operator: string;
  details: string;
  type: 'create' | 'edit' | 'delete' | 'print' | 'export' | 'backup' | 'auth';
}

export interface PleskDeployOptions {
  domainName: string;
  phpVersion: string;
  enableHttpsRedirect: boolean;
  enableGzip: boolean;
  enableSpaRewrite: boolean;
  includeCurrentData: boolean;
  dbHost?: string;
  dbName?: string;
  dbUser?: string;
  dbPass?: string;
  includeMysqlBridge?: boolean;
}

export interface SuratKeteranganAktifConfig {
  nomorSurat: string;
  perihal: string;
  tahunAjaran: string;
  semester: 'Ganjil' | 'Genap';
  keperluan: string;
  keteranganTambahan: string;
  tanggalSurat: string;
  kotaSurat: string;
  tampilkanKop: boolean;
  tampilkanNamaKementerian?: boolean;
  tampilkanLogoKemenag: boolean;
  tampilkanLogoMadrasah: boolean;
  tampilkanTtd: boolean;
  tampilkanStempel: boolean;
  tampilkanQrVerifikasi: boolean;
  tampilkanFotoSiswa: boolean;
  ukuranKertas: 'A4' | 'F4' | 'Letter';
}

export type LoaderTheme = 'dark-emerald' | 'royal-navy' | 'islamic-green' | 'gold-amber' | 'minimalist-dark';
export type LoaderLogoType = 'kemenag' | 'madrasah' | 'custom' | 'none';
export type LoaderAnimation = 'spin-glow' | 'bounce-soft' | 'glow-pulse' | 'float' | 'none';

export interface PageLoaderConfig {
  enabled: boolean;
  title: string;
  badgeText: string;
  subtitle: string;
  footerText: string;
  theme: LoaderTheme;
  logoType: LoaderLogoType;
  customLogoUrl?: string;
  autoTransparentBg?: boolean;
  logoAnimation: LoaderAnimation;
  showRadialGlow: boolean;
  showProgressBar: boolean;
  showChecklist: boolean;
  checklistItems: [string, string, string];
  loadingDurationMs: number;
  step1Text: string;
  step2Text: string;
  step3Text: string;
}


