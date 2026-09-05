import React, { useState } from 'react';
import { 
  AdminUser, 
  MadrasahInfo, 
  Student, 
  CardConfig, 
  ActivityLog,
  PageLoaderConfig 
} from '../types';
import { 
  Users, 
  Building2, 
  PenTool, 
  Stamp, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Layers, 
  ShieldCheck, 
  Server, 
  Database, 
  History, 
  CheckCircle2, 
  FileBadge, 
  Printer, 
  Sparkles,
  Calendar,
  MapPin,
  HelpCircle,
  Eye,
  Check,
  CreditCard,
  FileText,
  Palette,
  RotateCcw,
  RefreshCw,
  X
} from 'lucide-react';
import { KemenagLogo, MadrasahLogo, OfficialStamp, PrincipalSignature } from './Logos';
import { exportStudentsToEmisExcel, downloadEmisExcelTemplate } from '../utils/excelUtils';
import { StudentForm } from './StudentForm';
import { MadrasahForm } from './MadrasahForm';
import { DesignSettings } from './DesignSettings';

interface AdminDashboardViewProps {
  currentUser: AdminUser | null;
  madrasah: MadrasahInfo;
  students: Student[];
  config: CardConfig;
  activityLogs: ActivityLog[];
  onUpdateMadrasah: (updated: MadrasahInfo) => void;
  onUpdateStudents: (updated: Student[]) => void;
  onUpdateConfig?: (updated: CardConfig) => void;
  onSelectStudent: (student: Student) => void;
  onOpenSignaturePad: () => void;
  onOpenEmisExcelImport: () => void;
  onOpenPrintSheet: (student?: Student) => void;
  onOpenPlesk: () => void;
  onOpenBackupRestore: () => void;
  onOpenActivityLogs: () => void;
  onAddNewStudent: () => void;
  onSwitchToCardEditor: () => void;
  onOpenSuratAktif?: (student?: Student) => void;
  onOpenPageLoaderSettings?: () => void;
  loaderConfig?: PageLoaderConfig;
  onUpdateLoaderConfig?: (updated: PageLoaderConfig) => void;
  onResetMadrasahToDefault?: () => void;
  onExplicitSaveMadrasah?: (updated: MadrasahInfo, updatedConfig?: CardConfig) => void;
  syncStatus?: 'synced' | 'saving' | 'syncing' | 'error';
  onManualSync?: () => void;
  onRefreshFromServer?: () => void;
  lastServerUpdate?: string;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  currentUser,
  madrasah,
  students,
  config,
  activityLogs,
  onUpdateMadrasah,
  onUpdateStudents,
  onUpdateConfig,
  onSelectStudent,
  onOpenSignaturePad,
  onOpenEmisExcelImport,
  onOpenPrintSheet,
  onOpenPlesk,
  onOpenBackupRestore,
  onOpenActivityLogs,
  onAddNewStudent,
  onSwitchToCardEditor,
  onOpenSuratAktif,
  onOpenPageLoaderSettings,
  loaderConfig,
  onUpdateLoaderConfig,
  onResetMadrasahToDefault,
  onExplicitSaveMadrasah,
  syncStatus = 'synced',
  onManualSync,
  onRefreshFromServer,
  lastServerUpdate,
}) => {
  const [activeDashboardTab, setActiveDashboardTab] = useState<'students' | 'madrasah' | 'signature' | 'design' | 'logs'>('students');
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isCreatingNewStudent, setIsCreatingNewStudent] = useState(false);
  const [signatureSaveFeedback, setSignatureSaveFeedback] = useState<string | null>(null);
  const [designSaveFeedback, setDesignSaveFeedback] = useState<string | null>(null);

  // Stats calculation
  const totalStudents = students.length;
  const maleCount = students.filter((s) => s.jenisKelamin === 'L').length;
  const femaleCount = students.filter((s) => s.jenisKelamin === 'P').length;
  const classes = Array.from(new Set(students.map((s) => s.kelas))).filter(Boolean);

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nisn.includes(searchTerm) ||
      s.nis.includes(searchTerm);
    const matchesClass = classFilter === 'ALL' || s.kelas === classFilter;
    return matchesSearch && matchesClass;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleDeleteStudent = (id: string) => {
    const target = students.find((s) => s.id === id);
    const targetName = target ? `${target.nama} (${target.nisn || target.nis || 'Siswa'})` : 'siswa ini';
    if (confirm(`Apakah Anda yakin ingin menghapus data siswa:\n\n${targetName}\n\nData akan dihapus permanen dari sistem dan kartu pelajar.`)) {
      const remaining = students.filter((s) => s.id !== id);
      onUpdateStudents(remaining);
      showToast(`✓ Siswa ${target ? target.nama : ''} berhasil dihapus permanen`);
      if (editingStudent?.id === id) {
        setEditingStudent(null);
        setIsCreatingNewStudent(false);
      }
    }
  };

  const handleClearAllStudents = () => {
    if (students.length === 0) return;
    if (confirm(`PERINGATAN: Anda akan menghapus SELURUH (${students.length}) data siswa dari sistem dan server.\n\nLangkah ini cocok jika Anda ingin membersihkan data contoh/dummy dan mengisinya dengan data siswa asli dari Excel EMIS atau input baru.\n\nLanjutkan mengosongkan seluruh data siswa?`)) {
      onUpdateStudents([]);
      showToast(`✓ Seluruh (${students.length}) data siswa berhasil dikosongkan secara permanen.`);
      if (editingStudent) {
        setEditingStudent(null);
        setIsCreatingNewStudent(false);
      }
    }
  };

  const handleSaveStudentEdit = (updatedStudent: Student) => {
    if (isCreatingNewStudent) {
      onUpdateStudents([...students, updatedStudent]);
      onSelectStudent(updatedStudent);
      showToast(`✓ Siswa ${updatedStudent.nama} berhasil ditambahkan dan disimpan`);
    } else {
      const updatedList = students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s));
      onUpdateStudents(updatedList);
      showToast(`✓ Perubahan biodata ${updatedStudent.nama} berhasil disimpan permanen`);
    }
    setEditingStudent(null);
    setIsCreatingNewStudent(false);
  };

  const handleStartCreateStudent = () => {
    const activeTP = madrasah.tahunPelajaran || '2025/2026';
    const newStudent: Student = {
      id: 'std_' + Date.now(),
      nama: 'NAMA SISWA BARU',
      nisn: '00' + Math.floor(10000000 + Math.random() * 90000000),
      nis: 'MI' + Math.floor(1000 + Math.random() * 9000),
      tempatLahir: 'Banyumas',
      tanggalLahir: '12 Mei 2014',
      jenisKelamin: 'L',
      agama: 'Islam',
      kelas: '1-A',
      tahunAjaran: activeTP,
      alamat: 'Desa Sanggreman RT 02/03',
      namaWali: 'Wali Siswa',
      golonganDarah: 'O',
      fotoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&fit=crop&q=80',
      berlakuSampai: 'Selama Menjadi Siswa',
    };
    setEditingStudent(newStudent);
    setIsCreatingNewStudent(true);
  };

  const handleApplyTahunPelajaranToAllStudents = (newTP: string) => {
    if (!newTP) return;
    const updatedMadrasah = {
      ...madrasah,
      tahunPelajaran: newTP,
    };
    onUpdateMadrasah(updatedMadrasah);
    if (onExplicitSaveMadrasah) {
      onExplicitSaveMadrasah(updatedMadrasah);
    }
    if (students.length > 0) {
      const updated = students.map((s) => ({
        ...s,
        tahunAjaran: newTP,
      }));
      onUpdateStudents(updated);
    }
    showToast(`✓ Tahun Pelajaran "${newTP}" berhasil disimpan ke profil madrasah & diterapkan ke seluruh (${students.length}) siswa!`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* FLOATING ACTION TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-500 text-emerald-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* TOP WELCOME & SUMMARY BANNER */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-5 rounded-2xl border border-emerald-700/60 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div 
            onClick={() => setActiveDashboardTab('madrasah')}
            className="p-1 sm:p-1.5 bg-emerald-950/90 rounded-2xl border border-amber-400/70 shadow-lg ring-1 ring-amber-400/30 flex items-center justify-center h-16 sm:h-20 w-auto min-w-[4rem] sm:min-w-[5rem] max-w-[200px] shrink-0 overflow-hidden cursor-pointer hover:border-amber-300 hover:scale-[1.02] transition-all"
            title="Klik untuk ubah Logo Aplikasi / Madrasah di Profil"
          >
            {madrasah.logoAplikasiUrl ? (
              <img
                src={madrasah.logoAplikasiUrl}
                alt="Logo Aplikasi"
                className="h-full w-auto max-w-full max-h-full object-contain filter drop-shadow select-none"
                referrerPolicy="no-referrer"
              />
            ) : madrasah.logoKiriUrl || madrasah.logoMadrasahUrl ? (
              <img
                src={madrasah.logoKiriUrl || madrasah.logoMadrasahUrl}
                alt="Logo Madrasah"
                className="h-full w-auto max-w-full max-h-full object-contain filter drop-shadow select-none"
                referrerPolicy="no-referrer"
              />
            ) : (
              <KemenagLogo className="w-12 h-12" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black text-white uppercase tracking-tight">
                Dashboard Admin: {madrasah.namaMadrasah}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-xs">
                MODE ADMIN AKTIF
              </span>
            </div>
            <p className="text-xs text-emerald-200/90 mt-0.5">
              Pusat Pengelolaan Master Data Siswa EMIS • Legalitas Kepala Madrasah • Pengaturan Kartu • Ekspor Plesk
            </p>
          </div>
        </div>

        {/* Action Buttons in Header Banner */}
        <div className="flex flex-wrap items-center gap-2">
          {onRefreshFromServer && (
            <button
              onClick={onRefreshFromServer}
              className="px-3.5 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md border border-amber-500/40 transition active:scale-95"
              title="Kunci & Samakan Semua Perangkat: Ambil / Samakan Data HP & Wi-Fi ke Server"
            >
              <RefreshCw className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              <span>Sinkronkan ke Semua HP / Wi-Fi</span>
            </button>
          )}
          <button
            onClick={onSwitchToCardEditor}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg transition active:scale-95 border border-emerald-400/40"
          >
            <Eye className="w-4 h-4 text-emerald-200" />
            <span>Lihat Halaman Publik (Kartu Siswa)</span>
          </button>
        </div>
      </div>

      {/* 4 PRIMARY METRIC KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Siswa */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Siswa Terdaftar
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {totalStudents}{' '}
              <span className="text-xs font-normal text-emerald-400">Siswa</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {maleCount} Laki-laki • {femaleCount} Perempuan
            </span>
          </div>
          <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Legalitas EMIS & TP */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Tahun Pelajaran & Legalitas
            </span>
            <div className="text-base font-extrabold text-amber-300 mt-1 truncate max-w-[170px]">
              TP. {madrasah.tahunPelajaran || '2025/2026'}
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">
              Akreditasi: {madrasah.akreditasi || '-'} • {madrasah.kotaKab}
            </span>
          </div>
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: Penandatanganan & Stempel */}
        <div 
          onClick={onOpenSignaturePad}
          className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-md flex items-center justify-between cursor-pointer hover:border-emerald-500/60 transition group"
        >
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Penandatangan Kartu
            </span>
            <div className="text-sm font-bold text-white mt-1 truncate max-w-[170px]">
              {madrasah.namaKepalaMadrasah}
            </div>
            <span className="text-[10px] text-emerald-400 mt-1 block group-hover:underline flex items-center gap-1">
              <PenTool className="w-3 h-3" /> Edit TTD & Stempel
            </span>
          </div>
          <div className="p-3 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/30">
            <Stamp className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: Standar Cetak CR80 */}
        <div 
          onClick={onOpenPrintSheet}
          className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-md flex items-center justify-between cursor-pointer hover:border-amber-500/60 transition group"
        >
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Format Kartu CR80
            </span>
            <div className="text-sm font-bold text-white mt-1">
              85.60 × 53.98 mm
            </div>
            <span className="text-[10px] text-amber-400 mt-1 block group-hover:underline flex items-center gap-1">
              <Printer className="w-3 h-3" /> Cetak Lembar Massal A4
            </span>
          </div>
          <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* QUICK LAUNCH ACTION CENTER */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-md space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Pusat Pintasan & Operasional Utama
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
          {/* Button 1: Surat Keterangan Aktif */}
          {onOpenSuratAktif && (
            <button
              onClick={() => onOpenSuratAktif()}
              className="p-3 bg-gradient-to-br from-emerald-950 to-slate-900 hover:from-emerald-900 hover:to-slate-800 text-white rounded-xl border border-emerald-500/50 hover:border-emerald-400 text-left transition space-y-1.5 group shadow-sm"
            >
              <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-lg w-fit group-hover:scale-105 transition border border-emerald-500/30">
                <FileText className="w-4 h-4" />
              </div>
              <span className="font-bold block text-xs text-amber-300">Surat Aktif Siswa</span>
              <span className="text-[10px] text-emerald-200/70 block">Kemenag Form A4/F4</span>
            </button>
          )}

          {/* Button 2: Upload Excel EMIS */}
          <button
            onClick={onOpenEmisExcelImport}
            className="p-3 bg-slate-950/80 hover:bg-emerald-950/80 text-white rounded-xl border border-slate-800 hover:border-emerald-500/60 text-left transition space-y-1.5 group"
          >
            <div className="p-2 bg-emerald-600/30 text-emerald-400 rounded-lg w-fit group-hover:scale-105 transition">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <span className="font-bold block text-xs">Impor Excel EMIS</span>
            <span className="text-[10px] text-slate-400 block">Unggah .xlsx / .xls</span>
          </button>


          {/* Button 2: Tanda Tangan & Stempel */}
          <button
            onClick={onOpenSignaturePad}
            className="p-3 bg-slate-950/80 hover:bg-teal-950/80 text-white rounded-xl border border-slate-800 hover:border-teal-500/60 text-left transition space-y-1.5 group"
          >
            <div className="p-2 bg-teal-600/30 text-teal-400 rounded-lg w-fit group-hover:scale-105 transition">
              <PenTool className="w-4 h-4" />
            </div>
            <span className="font-bold block text-xs">Gores TTD Digital</span>
            <span className="text-[10px] text-slate-400 block">Canvas TTD & Stempel</span>
          </button>

          {/* Button 3: Unduh Template Excel EMIS */}
          <button
            onClick={downloadEmisExcelTemplate}
            className="p-3 bg-slate-950/80 hover:bg-amber-950/80 text-white rounded-xl border border-slate-800 hover:border-amber-500/60 text-left transition space-y-1.5 group"
          >
            <div className="p-2 bg-amber-600/30 text-amber-400 rounded-lg w-fit group-hover:scale-105 transition">
              <Download className="w-4 h-4" />
            </div>
            <span className="font-bold block text-xs">Template Excel</span>
            <span className="text-[10px] text-slate-400 block">Format EMIS MI 4.0</span>
          </button>

          {/* Button 4: Cetak Massal A4 */}
          <button
            onClick={onOpenPrintSheet}
            className="p-3 bg-slate-950/80 hover:bg-blue-950/80 text-white rounded-xl border border-slate-800 hover:border-blue-500/60 text-left transition space-y-1.5 group"
          >
            <div className="p-2 bg-blue-600/30 text-blue-400 rounded-lg w-fit group-hover:scale-105 transition">
              <Layers className="w-4 h-4" />
            </div>
            <span className="font-bold block text-xs">Cetak Massal A4</span>
            <span className="text-[10px] text-slate-400 block">Grid 8-10 Kartu</span>
          </button>

          {/* Button 5: Backup & Restore */}
          <button
            onClick={onOpenBackupRestore}
            className="p-3 bg-slate-950/80 hover:bg-violet-950/80 text-white rounded-xl border border-slate-800 hover:border-violet-500/60 text-left transition space-y-1.5 group"
          >
            <div className="p-2 bg-violet-600/30 text-violet-400 rounded-lg w-fit group-hover:scale-105 transition">
              <Database className="w-4 h-4" />
            </div>
            <span className="font-bold block text-xs">Cadangan JSON</span>
            <span className="text-[10px] text-slate-400 block">Backup / Restore</span>
          </button>

          {/* Button 6: Edit Page Loader */}
          {onOpenPageLoaderSettings && (
            <button
              onClick={onOpenPageLoaderSettings}
              className="p-3 bg-slate-950/80 hover:bg-emerald-950/80 text-white rounded-xl border border-slate-800 hover:border-amber-500/60 text-left transition space-y-1.5 group"
            >
              <div className="p-2 bg-amber-500/20 text-amber-300 rounded-lg w-fit group-hover:scale-105 transition border border-amber-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold block text-xs text-amber-300">Edit Page Loader</span>
              <span className="text-[10px] text-slate-400 block">Splash Screen Portal</span>
            </button>
          )}

          {/* Button 7: Unduh ZIP Plesk */}
          <button
            onClick={onOpenPlesk}
            className="p-3 bg-slate-950/80 hover:bg-emerald-950/80 text-white rounded-xl border border-slate-800 hover:border-emerald-500/60 text-left transition space-y-1.5 group"
          >
            <div className="p-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg w-fit group-hover:scale-105 transition">
              <Server className="w-4 h-4" />
            </div>
            <span className="font-bold block text-xs text-amber-300">Unduh ZIP Plesk</span>
            <span className="text-[10px] text-slate-400 block">Paket Siap Pasang</span>
          </button>
        </div>
      </div>

      {/* DASHBOARD SECTION TABS */}
      <div className="bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 flex flex-wrap gap-1">
        <button
          onClick={() => setActiveDashboardTab('students')}
          className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeDashboardTab === 'students'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>1. Master Data Siswa ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveDashboardTab('madrasah')}
          className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeDashboardTab === 'madrasah'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>2. Profil Madrasah & Legalitas</span>
        </button>

        <button
          onClick={() => setActiveDashboardTab('signature')}
          className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeDashboardTab === 'signature'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <PenTool className="w-4 h-4" />
          <span>3. Penandatanganan & Stempel</span>
        </button>

        <button
          onClick={() => setActiveDashboardTab('design')}
          className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeDashboardTab === 'design'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>4. Desain & Format Kartu</span>
        </button>

        <button
          onClick={() => setActiveDashboardTab('logs')}
          className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeDashboardTab === 'logs'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>5. Log Audit ({activityLogs.length})</span>
        </button>
      </div>

      {/* TAB CONTENT 1: STUDENTS DIRECTORY & EMIS MANAGEMENT */}
      {activeDashboardTab === 'students' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
          {/* Controls & Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search input */}
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama siswa, NISN 10 digit, atau NIS..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Class Filter & Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 flex-1 sm:flex-none cursor-pointer"
              >
                <option value="ALL">Semua Kelas ({students.length})</option>
                {classes.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls} ({students.filter((s) => s.kelas === cls).length})
                  </option>
                ))}
              </select>

              {/* Action Buttons */}
              <button
                onClick={onOpenEmisExcelImport}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm flex-1 sm:flex-none whitespace-nowrap"
                title="Unggah Excel EMIS Kemenag 4.0"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Excel EMIS</span>
              </button>

              <button
                onClick={() => exportStudentsToEmisExcel(students, madrasah.namaMadrasah)}
                className="p-2 sm:px-3 sm:py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-slate-700"
                title="Ekspor Seluruh Siswa ke Format Excel EMIS (.xlsx)"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">Ekspor Excel</span>
              </button>

              <button
                onClick={handleStartCreateStudent}
                className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm flex-1 sm:flex-none whitespace-nowrap"
                title="Tambah Data Siswa Baru"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Siswa</span>
              </button>

              {students.length > 0 && (
                <button
                  onClick={handleClearAllStudents}
                  className="px-3 py-2 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm flex-1 sm:flex-none whitespace-nowrap"
                  title="Hapus / Kosongkan Seluruh Data Siswa (Cocok untuk menghapus data contoh/dummy)"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Kosongkan Siswa ({students.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* MOBILE CARDS VIEW (md:hidden) */}
          <div className="md:hidden space-y-3">
            {filteredStudents.length === 0 ? (
              <div className="py-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800 text-xs">
                Tidak ada data siswa yang cocok dengan filter pencarian.
              </div>
            ) : (
              filteredStudents.map((s) => (
                <div key={s.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3 shadow-md">
                  <div className="flex items-start gap-3">
                    <img
                      src={s.fotoUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100&fit=crop'}
                      alt={s.nama}
                      className="w-12 h-16 object-cover rounded-lg border border-slate-700 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-white text-sm truncate">{s.nama}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700/60 text-emerald-300 font-bold shrink-0">
                          {s.kelas}
                        </span>
                      </div>
                      <div className="text-[11px] text-amber-300 font-mono mt-0.5">
                        NISN: {s.nisn} <span className="text-slate-500">•</span> NIS: {s.nis}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 truncate">
                        {s.tempatLahir}, {s.tanggalLahir} • {s.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons for Mobile Card */}
                  <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => {
                        setEditingStudent({ ...s });
                        setIsCreatingNewStudent(false);
                      }}
                      className="py-1.5 px-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectStudent(s);
                        onOpenPrintSheet(s);
                      }}
                      className="py-1.5 px-2 bg-teal-950/60 hover:bg-teal-900/80 text-teal-300 border border-teal-700/60 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Cetak</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectStudent(s);
                        onSwitchToCardEditor();
                      }}
                      className="py-1.5 px-2 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Kartu</span>
                    </button>

                    <button
                      onClick={() => handleDeleteStudent(s.id)}
                      className="py-1.5 px-2 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition"
                      title="Hapus Siswa Ini"
                    >
                      <Trash2 className="w-3 h-3 text-rose-400" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* DESKTOP Student Table (hidden on mobile) */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-800 shadow-inner">
            <table className="w-full text-left text-xs text-slate-300 min-w-[620px]">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Foto</th>
                  <th className="py-2.5 px-3">Nama Lengkap</th>
                  <th className="py-2.5 px-3">NISN / NIS</th>
                  <th className="py-2.5 px-3">Kelas & TP</th>
                  <th className="py-2.5 px-3">Tempat, Tgl Lahir</th>
                  <th className="py-2.5 px-3 text-right">Aksi Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Tidak ada data siswa yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-950/40 transition">
                      <td className="py-2 px-3">
                        <img
                          src={s.fotoUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100&fit=crop'}
                          alt={s.nama}
                          className="w-8 h-10 object-cover rounded border border-slate-700"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <span className="font-bold text-white block">{s.nama}</span>
                        <span className="text-[10px] text-slate-400">
                          {s.jenisKelamin === 'L' ? 'Laki-laki (Ikhwan)' : 'Perempuan (Akhwat)'} • {s.agama}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono">
                        <span className="text-amber-300 font-bold block">{s.nisn}</span>
                        <span className="text-[10px] text-slate-400">NIS: {s.nis}</span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-emerald-400 font-bold block">{s.kelas}</span>
                        <span className="text-[10px] text-slate-400">TP. {s.tahunAjaran}</span>
                      </td>
                      <td className="py-2 px-3 text-slate-300">
                        <span>{s.tempatLahir}, {s.tanggalLahir}</span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingStudent({ ...s });
                              setIsCreatingNewStudent(false);
                            }}
                            className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                            title="Edit Biodata Siswa Ini"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          {onOpenSuratAktif && (
                            <button
                              onClick={() => {
                                onSelectStudent(s);
                                onOpenSuratAktif(s);
                              }}
                              className="px-2 py-1 bg-slate-800 hover:bg-emerald-900/70 text-emerald-300 border border-slate-700 hover:border-emerald-600/50 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                              title="Buat Surat Keterangan Aktif Siswa Ini"
                            >
                              <FileText className="w-3 h-3 text-amber-400" />
                              <span className="hidden sm:inline">Surat</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              onSelectStudent(s);
                              onOpenPrintSheet(s);
                            }}
                            className="px-2 py-1 bg-slate-800 hover:bg-teal-900/70 text-teal-300 border border-slate-700 hover:border-teal-600/50 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                            title="Cetak Kartu Siswa Ini (2 Kolom • 4/Lembar)"
                          >
                            <Printer className="w-3 h-3 text-teal-400" />
                            <span className="hidden sm:inline">Cetak</span>
                          </button>
                          <button
                            onClick={() => {
                              onSelectStudent(s);
                              onSwitchToCardEditor();
                            }}
                            className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                            title="Pratinjau Kartu Pelajar Siswa Ini"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Kartu</span>
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(s.id)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 rounded-lg transition"
                            title="Hapus Siswa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: PROFIL MADRASAH & LEGALITAS LENGKAP */}
      {activeDashboardTab === 'madrasah' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                Manajemen Profil & Legalitas Madrasah Ibtidaiyah
              </h3>
              <p className="text-xs text-slate-400">
                Pengaturan identitas resmi MI, Nomor Statistik Madrasah (NSM), NPSN, Kemenag Wilayah, dan Legalitas Pejabat Penetap.
              </p>
            </div>
          </div>

          <MadrasahForm
            madrasah={madrasah}
            onChange={onUpdateMadrasah}
            onSave={onExplicitSaveMadrasah || onUpdateMadrasah}
            onResetToDefault={onResetMadrasahToDefault}
            onOpenSignaturePad={onOpenSignaturePad}
            config={config}
            onConfigChange={onUpdateConfig}
            loaderConfig={loaderConfig}
            onLoaderConfigChange={onUpdateLoaderConfig}
            onOpenPageLoaderSettings={onOpenPageLoaderSettings}
            studentsCount={students.length}
            onApplyTahunPelajaranToAllStudents={handleApplyTahunPelajaranToAllStudents}
          />
        </div>
      )}

      {/* TAB CONTENT 3: PENANDATANGANAN & STEMPEL */}
      {activeDashboardTab === 'signature' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <PenTool className="w-4 h-4 text-emerald-400" />
                Manajemen Penandatanganan & Stempel Madrasah
              </h3>
              <p className="text-xs text-slate-400">
                Konfigurasi pejabat penetap kartu, tanda tangan basah digital, dan cap stempel resmi Kemenag.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {signatureSaveFeedback && (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-500/50 flex items-center gap-1.5 animate-pulse">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {signatureSaveFeedback}
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  onUpdateMadrasah(madrasah);
                  setSignatureSaveFeedback('✓ Data Pejabat & TTD Tersimpan!');
                  setTimeout(() => setSignatureSaveFeedback(null), 3000);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Simpan Pejabat & TTD</span>
              </button>
              <button
                type="button"
                onClick={onOpenSignaturePad}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition active:scale-95"
              >
                <PenTool className="w-3.5 h-3.5 text-emerald-400" />
                <span>Buka Canvas Gores TTD</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left: Detail Form */}
            <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3 text-xs">
              <h4 className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">
                Data Pejabat Penetap
              </h4>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Nama Kepala Madrasah / Pejabat *
                </label>
                <input
                  type="text"
                  value={madrasah.namaKepalaMadrasah}
                  onChange={(e) => onUpdateMadrasah({ ...madrasah, namaKepalaMadrasah: e.target.value })}
                  placeholder="Siti Rochimah, S.Pd.I"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  NIP / NUPTK *
                </label>
                <input
                  type="text"
                  value={madrasah.nipKepalaMadrasah}
                  onChange={(e) => onUpdateMadrasah({ ...madrasah, nipKepalaMadrasah: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-amber-300 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Kota Penetapan
                  </label>
                  <input
                    type="text"
                    value={madrasah.kotaPenetapan}
                    onChange={(e) => onUpdateMadrasah({ ...madrasah, kotaPenetapan: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Tanggal Titimangsa
                  </label>
                  <input
                    type="text"
                    value={madrasah.tanggalPenetapan}
                    onChange={(e) => onUpdateMadrasah({ ...madrasah, tanggalPenetapan: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Right: Signature & Stamp Preview Box */}
            <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                Pratinjau Hasil Penandatanganan Kartu
              </span>

              <div className="p-4 bg-white rounded-xl border border-slate-300 text-slate-800 shadow-md w-full max-w-sm">
                <p className="text-[9px] text-slate-600">
                  Ditetapkan di: <strong>{madrasah.kotaPenetapan}</strong>
                </p>
                <p className="text-[9px] text-slate-600">
                  Pada tanggal: <strong>{madrasah.tanggalPenetapan}</strong>
                </p>
                <p className="text-[10px] font-bold text-emerald-950 uppercase mt-0.5">
                  Kepala Madrasah,
                </p>

                <div className="h-16 relative flex items-center justify-center my-1">
                  {/* Stamp */}
                  <div className="absolute -left-2 top-0 z-10">
                    {madrasah.stempelUrl ? (
                      <img
                        src={madrasah.stempelUrl}
                        alt="Stempel"
                        className="w-16 h-16 object-contain opacity-85 -rotate-12"
                      />
                    ) : (
                      <OfficialStamp
                        schoolName={madrasah.namaMadrasah}
                        location={madrasah.kotaKab}
                        className="w-16 h-16"
                      />
                    )}
                  </div>

                  {/* Signature */}
                  <div className="relative z-0">
                    {madrasah.ttdKepalaUrl ? (
                      <img
                        src={madrasah.ttdKepalaUrl}
                        alt="TTD"
                        className="w-32 h-14 object-contain mix-blend-multiply"
                      />
                    ) : (
                      <PrincipalSignature className="w-32 h-14" />
                    )}
                  </div>
                </div>

                <p className="text-[10px] font-extrabold text-slate-900 underline uppercase">
                  {madrasah.namaKepalaMadrasah}
                </p>
                <p className="text-[8.5px] font-mono text-slate-600">
                  NIP. {madrasah.nipKepalaMadrasah || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: DESAIN & FORMAT KARTU */}
      {activeDashboardTab === 'design' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-400" />
                Pengaturan Desain & Format Kartu Pelajar
              </h3>
              <p className="text-xs text-slate-400">
                Pilih tema warna resmi madrasah, watermark guilloche pengaman, barcode/QR code, dan tata letak teks tata tertib.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {designSaveFeedback && (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-500/50 flex items-center gap-1.5 animate-pulse">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {designSaveFeedback}
                </span>
              )}
              {onUpdateConfig && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateConfig(config);
                    setDesignSaveFeedback('✓ Desain Kartu Tersimpan!');
                    setTimeout(() => setDesignSaveFeedback(null), 3000);
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Desain</span>
                </button>
              )}
            </div>
          </div>

          <DesignSettings
            config={config}
            onChange={(updated) => onUpdateConfig?.(updated)}
            onOpenPageLoaderSettings={onOpenPageLoaderSettings}
          />
        </div>
      )}

      {/* TAB CONTENT 4: LOG AUDIT */}
      {activeDashboardTab === 'logs' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                Catatan Aktivitas & Log Audit Admin
              </h3>
              <p className="text-xs text-slate-400">
                Pencatatan riwayat penambahan siswa, impor EMIS, perubahan profil, dan cetak kartu.
              </p>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {activityLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{log.action}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-slate-800 text-slate-300">
                      {log.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{log.details}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-[10px] font-mono text-slate-500 block">{log.timestamp}</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">{log.operator}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: EDIT / TAMBAH SISWA DALAM DASHBOARD ADMIN */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-150 my-auto">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm sm:text-base uppercase tracking-tight">
                    {isCreatingNewStudent ? 'Tambah Data Siswa Baru (EMIS)' : `Edit Data Siswa: ${editingStudent.nama}`}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Formulir resmi master data peserta didik madrasah
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <StudentForm
                student={editingStudent}
                onChange={setEditingStudent}
                activeTahunPelajaran={madrasah.tahunPelajaran || '2025/2026'}
                onOpenSuratAktif={() => {
                  if (onOpenSuratAktif) {
                    onOpenSuratAktif(editingStudent);
                  }
                }}
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 rounded-b-2xl flex items-center justify-between gap-3">
              <div>
                {!isCreatingNewStudent && editingStudent && (
                  <button
                    type="button"
                    onClick={() => handleDeleteStudent(editingStudent.id)}
                    className="px-3.5 py-2 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                    title="Hapus data siswa ini secara permanen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Siswa</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleSaveStudentEdit(editingStudent)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg transition active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Data Siswa</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
