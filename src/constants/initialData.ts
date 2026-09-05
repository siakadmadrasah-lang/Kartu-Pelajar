import { CardConfig, MadrasahInfo, Student, PageLoaderConfig } from '../types';

export const INITIAL_LOADER_CONFIG: PageLoaderConfig = {
  enabled: true,
  title: 'KARTU PELAJAR MI',
  badgeText: 'KEMENAG RI',
  subtitle: 'Sistem Generator & Cetak Kartu Siswa Madrasah Ibtidaiyah',
  footerText: 'Kementerian Agama Republik Indonesia • Madrasah Mandiri Berprestasi',
  theme: 'dark-emerald',
  logoType: 'kemenag',
  customLogoUrl: '',
  autoTransparentBg: true,
  logoAnimation: 'spin-glow',
  showRadialGlow: true,
  showProgressBar: true,
  showChecklist: true,
  checklistItems: ['Standar CR80', 'Basis EMIS', 'Cetak PVC/A4'],
  loadingDurationMs: 1200,
  step1Text: 'Memverifikasi Basis Data EMIS & Format CR80...',
  step2Text: 'Menyiapkan Engine Pratinjau 3D & Template Kemenag...',
  step3Text: 'Sistem Siap Digunakan!',
};

export const INITIAL_MADRASAH: MadrasahInfo = {
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
  badgeHeaderAplikasi: 'KEMENAG',
  showMadrasahInHeader: true,
};

export const SAMPLE_STUDENT: Student = {
  id: 'std-sample',
  nama: 'NAMA LENGKAP SISWA',
  nisn: '0123456789',
  nis: '232401001',
  tempatLahir: 'Banyumas',
  tanggalLahir: '01 Januari 2015',
  jenisKelamin: 'L',
  kelas: 'I - Abu Bakar',
  tahunAjaran: '2025/2026',
  agama: 'Islam',
  golonganDarah: 'O',
  alamat: 'Desa Sanggreman RT 02 / RW 03, Kec. Rawalo, Kab. Banyumas',
  namaWali: 'Wali Siswa',
  fotoUrl: '',
  berlakuSampai: 'Selama Menjadi Siswa',
};

export const DEFAULT_EMPTY_STUDENT: Student = {
  id: 'std-empty',
  nama: '',
  nisn: '',
  nis: '',
  tempatLahir: '',
  tanggalLahir: '',
  jenisKelamin: 'L',
  kelas: '',
  tahunAjaran: '2025/2026',
  agama: 'Islam',
  golonganDarah: '-',
  alamat: '',
  namaWali: '',
  fotoUrl: '',
  berlakuSampai: 'Selama Menjadi Siswa',
};

export const INITIAL_STUDENTS: Student[] = [];

export const INITIAL_CARD_CONFIG: CardConfig = {
  orientation: 'landscape',
  theme: 'kemenag-green',
  watermark: 'islamic-star',
  showBarcode: true,
  barcodeType: 'nisn',
  showQrCode: true,
  qrContent: 'verification_url',
  showHologram: true,
  logoMode: 'both',
  showKemenagLogo: true,
  showMadrasahLogo: true,
  showNamaKementerian: true,
  showNamaKementerianSurat: true,
  showSignature: true,
  showStamp: true,
  signatoryPosition: 'back',
  stampOpacity: 0.85,
  backContentPreset: 'tata-tertib',
  customBackNotes: [
    'Kartu ini adalah bukti sah sebagai peserta didik Madrasah Ibtidaiyah.',
    'Wajib dibawa setiap hari saat kegiatan belajar mengajar berlangsung.',
    'Dilarang meminjamkan, menyalahgunakan, atau merusak kartu ini.',
    'Apabila kartu hilang/rusak, segera laporkan ke bagian Tata Usaha Madrasah.',
    'Barangsiapa menemukan kartu ini, harap mengembalikan ke alamat madrasah yang tertera.'
  ],
  customBackTitle: 'KETENTUAN DAN TATA TERTIB SISWA',
  cardRadius: 'rounded-xl',
  showBloodType: true,
  showAddress: true,
  showParentName: false,
  showExpiryDate: true,
};

export const BACK_CONTENT_PRESETS: Record<string, { title: string; items: string[] }> = {
  'tata-tertib': {
    title: 'TATA TERTIB SISWA MADRASAH IBTIDAIYAH',
    items: [
      'Hadir di madrasah 15 menit sebelum bel masuk berbunyi (07.00 WIB).',
      'Berpakaian seragam madrasah yang bersih, rapi, dan menutup aurat.',
      'Melaksanakan ibadah Shalat Dhuha dan Shalat Zhuhur berjamaah di madrasah.',
      'Menjaga adab, akhlak mulia, dan sopan santun kepada guru serta sesama teman.',
      'Menjaga kebersihan madrasah dan merawat sarana prasarana belajar.'
    ]
  },
  'janji-siswa': {
    title: 'JANJI SANTRI / SISWA MADRASAH',
    items: [
      'Bertaqwa kepada Allah Subhanahu wa Ta\'ala.',
      'Berbakti kepada orang tua dan taat kepada Bapak/Ibu Guru.',
      'Rajin belajar, berakhlakul karimah, dan beramal sholeh.',
      'Menjunjung tinggi nama baik dan martabat madrasah.',
      'Menjadi generasi muslim yang mandiri, berilmu, dan berprestasi.'
    ]
  },
  'visi-misi': {
    title: 'VISI DAN MISI MADRASAH',
    items: [
      'VISI: Terwujudnya generasi Qur\'ani yang cerdas, berakhlak mulia, dan berwawasan global.',
      'MISI 1: Menyelenggarakan pendidikan Islam yang integratif dan berkualitas.',
      'MISI 2: Membina karakter religius, mandiri, dan cinta tanah air.',
      'MISI 3: Mengembangkan potensi bakat dan literasi sains-teknologi siswa.'
    ]
  },
  'ketentuan-kartu': {
    title: 'KETENTUAN PENGGUNAAN KARTU PELAJAR',
    items: [
      'Kartu Tanda Pelajar ini adalah identitas resmi siswa yang sah.',
      'Kartu berlaku sebagai kartu akses perpustakaan dan laboratorium madrasah.',
      'Kartu tidak dapat dipindahtangankan kepada orang lain.',
      'Penggantian kartu yang hilang dikenakan biaya administrasi cetak ulang.',
      'Jika menemukan kartu ini, mohon hubungi nomor kontak madrasah.'
    ]
  }
};

export const THEME_CONFIGS: Record<string, {
  name: string;
  badge: string;
  headerBg: string;
  headerText: string;
  headerAccent: string;
  cardBg: string;
  accentBorder: string;
  accentColor: string;
  subColor: string;
  primaryHex: string;
  secondaryHex: string;
}> = {
  'kemenag-green': {
    name: 'Hijau Kemenag Resmi',
    badge: 'Standar Kemenag',
    headerBg: 'bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800',
    headerText: 'text-amber-300',
    headerAccent: 'border-amber-400',
    cardBg: 'bg-emerald-50/40',
    accentBorder: 'border-emerald-600',
    accentColor: 'text-emerald-900',
    subColor: 'text-emerald-700',
    primaryHex: '#047857',
    secondaryHex: '#f59e0b'
  },
  'royal-emerald': {
    name: 'Emerald Emas Elegan',
    badge: 'Modern Islami',
    headerBg: 'bg-gradient-to-r from-green-900 via-emerald-800 to-emerald-950',
    headerText: 'text-yellow-400',
    headerAccent: 'border-yellow-500',
    cardBg: 'bg-green-50/40',
    accentBorder: 'border-green-700',
    accentColor: 'text-green-950',
    subColor: 'text-green-800',
    primaryHex: '#064e3b',
    secondaryHex: '#eab308'
  },
  'gold-madrasah': {
    name: 'Emas Kemenag Cendekia',
    badge: 'Premium Gold',
    headerBg: 'bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-800',
    headerText: 'text-white',
    headerAccent: 'border-amber-300',
    cardBg: 'bg-amber-50/50',
    accentBorder: 'border-amber-600',
    accentColor: 'text-amber-950',
    subColor: 'text-amber-800',
    primaryHex: '#b45309',
    secondaryHex: '#10b981'
  },
  'navy-islamic': {
    name: 'Biru Navy Prestasi',
    badge: 'Formal',
    headerBg: 'bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950',
    headerText: 'text-sky-300',
    headerAccent: 'border-sky-400',
    cardBg: 'bg-slate-50/50',
    accentBorder: 'border-blue-700',
    accentColor: 'text-slate-900',
    subColor: 'text-blue-800',
    primaryHex: '#1e3a8a',
    secondaryHex: '#38bdf8'
  },
  'maroon-classic': {
    name: 'Marun Klasik',
    badge: 'Klasik',
    headerBg: 'bg-gradient-to-r from-red-950 via-rose-900 to-red-900',
    headerText: 'text-amber-300',
    headerAccent: 'border-amber-400',
    cardBg: 'bg-rose-50/40',
    accentBorder: 'border-rose-700',
    accentColor: 'text-rose-950',
    subColor: 'text-rose-800',
    primaryHex: '#881337',
    secondaryHex: '#fbbf24'
  },
  'modern-teal': {
    name: 'Teal Modern Madrasah',
    badge: 'Fresh',
    headerBg: 'bg-gradient-to-r from-teal-900 via-cyan-800 to-teal-950',
    headerText: 'text-amber-300',
    headerAccent: 'border-cyan-400',
    cardBg: 'bg-cyan-50/40',
    accentBorder: 'border-teal-700',
    accentColor: 'text-teal-950',
    subColor: 'text-teal-800',
    primaryHex: '#0f766e',
    secondaryHex: '#f59e0b'
  }
};
