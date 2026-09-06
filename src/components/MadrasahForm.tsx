import React, { useState } from 'react';
import { MadrasahInfo, CardConfig, PageLoaderConfig } from '../types';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Award, 
  Sparkles,
  CheckCircle2,
  Save,
  School,
  Calendar,
  Check
} from 'lucide-react';

interface MadrasahFormProps {
  madrasah: MadrasahInfo;
  onChange: (updated: MadrasahInfo) => void;
  onSave?: (updated: MadrasahInfo, updatedConfig?: CardConfig) => void;
  onResetToDefault?: () => void;
  onOpenSignaturePad?: () => void;
  config?: CardConfig;
  onConfigChange?: (config: CardConfig) => void;
  loaderConfig?: PageLoaderConfig;
  onLoaderConfigChange?: (updated: PageLoaderConfig) => void;
  onOpenPageLoaderSettings?: () => void;
  studentsCount?: number;
  onApplyTahunPelajaranToAllStudents?: (newTahunPelajaran: string) => void;
}

export const MadrasahForm: React.FC<MadrasahFormProps> = ({
  madrasah,
  onChange,
  onSave,
  onResetToDefault,
  onOpenSignaturePad,
  config,
  onConfigChange,
  loaderConfig,
  onLoaderConfigChange,
  onOpenPageLoaderSettings,
  studentsCount,
  onApplyTahunPelajaranToAllStudents,
}) => {
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const handleFieldChange = (field: keyof MadrasahInfo, value: any) => {
    const updated = {
      ...madrasah,
      [field]: value,
      ...(field === 'namaMadrasah' ? { namaSatuanPendidikan: value } : {}),
    };
    onChange(updated);
  };

  const handleExplicitSave = () => {
    if (onSave) {
      onSave(madrasah, config);
    } else {
      onChange(madrasah);
      if (config && onConfigChange) {
        onConfigChange(config);
      }
    }
    setSaveFeedback('✓ Seluruh Profil & Logo Madrasah Berhasil Disimpan!');
    setTimeout(() => setSaveFeedback(null), 3500);
  };

  return (
    <div className="space-y-4 text-slate-200">
      {/* Top Header Actions with Explicit Save Button */}
      <div className="flex flex-wrap items-center justify-between bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 gap-3">
        <div>
          <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
            <Building2 className="w-4 h-4" /> Identitas Madrasah Ibtidaiyah & Kop Kartu
          </h3>
          <p className="text-xs text-slate-400">
            Pengaturan kop kartu, logo instansi, legalitas Kemenag, dan data penandatangan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveFeedback && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-500/50 flex items-center gap-1.5 animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {saveFeedback}
            </span>
          )}

          <button
            type="button"
            onClick={handleExplicitSave}
            className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 shadow-md transition active:scale-95"
            title="Simpan profil dan logo ke database server"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan Profil & Logo</span>
          </button>

          {onResetToDefault && (
            <button
              type="button"
              onClick={onResetToDefault}
              className="px-2.5 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg flex items-center gap-1 transition"
              title="Reset ke pengaturan awal"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span className="hidden sm:inline">Reset Default</span>
            </button>
          )}
        </div>
      </div>

      {/* Identitas Utama */}
      <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-3 shadow-sm">
        <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center justify-between">
          <span>Data Pokok Lembaga</span>
          <span className="text-[10px] text-emerald-400 font-semibold lowercase">Bisa diedit bebas</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* 1. NAMA MADRASAH UTAMA (MASTER & SATUAN PENDIDIKAN) */}
          <div className="md:col-span-2 space-y-2 p-3.5 bg-slate-950/80 rounded-xl border border-slate-700/80 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <School className="w-4 h-4 text-emerald-400" />
                <span>Nama Madrasah / Sekolah (Nama Utama Lembaga) *</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  Master Lembaga
                </span>
              </label>
              <span className="text-[11px] text-emerald-400/90 font-medium">Otomatis menjadi Satuan Pendidikan</span>
            </div>
            <input
              type="text"
              value={madrasah.namaMadrasah || ''}
              onChange={(e) => handleFieldChange('namaMadrasah', e.target.value)}
              placeholder="Contoh: MI MA'ARIF NU 2 SANGGREMAN"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-emerald-500 shadow-inner"
            />
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Nama resmi lembaga madrasah/sekolah Anda yang menjadi identitas global sistem, arsip database, serta otomatis digunakan sebagai nama satuan pendidikan pada kartu pelajar, cap stempel, dan surat keterangan aktif.
            </p>
          </div>

          {/* TAHUN PELAJARAN AKTIF (BERLAKU GLOBAL) */}
          <div className="md:col-span-2 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 p-3.5 rounded-xl border border-emerald-500/40 space-y-2.5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-emerald-800/40">
              <div>
                <label className="block text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Tahun Pelajaran Aktif (TP) Lembaga *
                </label>
                <span className="text-[10px] text-emerald-100/70">
                  Berlaku otomatis untuk cetak kartu baru, pita header kartu (TP), surat keterangan aktif, dan filter data madrasah.
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Berlaku Global
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={madrasah.tahunPelajaran ?? ''}
                onChange={(e) => handleFieldChange('tahunPelajaran', e.target.value)}
                placeholder="2025/2026"
                className="flex-1 bg-slate-950 border border-emerald-500/50 rounded-lg px-3 py-2 text-sm text-amber-300 font-mono font-black focus:outline-none focus:border-amber-400 tracking-wider shadow-inner"
              />

              {onApplyTahunPelajaranToAllStudents && (
                <button
                  type="button"
                  onClick={() => {
                    const activeTP = madrasah.tahunPelajaran || '2025/2026';
                    if (confirm(`Terapkan Tahun Pelajaran "${activeTP}" ke seluruh (${studentsCount ?? 0}) siswa saat ini?\n\nSemua data siswa yang ada akan diperbarui tahun ajarannya ke "${activeTP}".`)) {
                      onApplyTahunPelajaranToAllStudents(activeTP);
                    }
                  }}
                  className="px-3 py-2 text-xs font-bold bg-teal-700 hover:bg-teal-600 text-white rounded-lg flex items-center justify-center gap-1.5 shadow-md transition active:scale-95 flex-shrink-0"
                  title="Terapkan tahun pelajaran aktif ini ke seluruh data siswa yang terdaftar"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Terapkan ke Semua Siswa ({studentsCount ?? 0})</span>
                </button>
              )}
            </div>

            {/* Quick Presets for Tahun Pelajaran */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] text-slate-400 font-medium">Pilihan Cepat TP:</span>
              {['2024/2025', '2025/2026', '2026/2027', '2027/2028', '2028/2029'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    handleFieldChange('tahunPelajaran', preset);
                    if (onSave) {
                      onSave({ ...madrasah, tahunPelajaran: preset });
                    }
                  }}
                  className={`text-[10px] px-2.5 py-0.5 rounded border transition font-mono ${
                    (madrasah.tahunPelajaran || '2025/2026') === preset
                      ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 font-bold shadow-xs'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nomor Statistik Madrasah (NSM 12 Digit) *
            </label>
            <input
              type="text"
              value={madrasah.nsm}
              onChange={(e) => handleFieldChange('nsm', e.target.value)}
              placeholder="111232730015"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-amber-300 font-mono font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              NPSN (8 Digit) *
            </label>
            <input
              type="text"
              value={madrasah.npsn}
              onChange={(e) => handleFieldChange('npsn', e.target.value)}
              placeholder="60728192"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Wilayah Instansi Kemenag / Kantor Kemenag Kab/Kota
            </label>
            <input
              type="text"
              value={madrasah.kemenagWilayah || ''}
              onChange={(e) => handleFieldChange('kemenagWilayah', e.target.value)}
              placeholder="KANTOR KEMENTERIAN AGAMA KABUPATEN BANYUMAS"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-400" /> Status Akreditasi
            </label>
            <div className="space-y-1.5">
              <input
                type="text"
                value={madrasah.akreditasi || ''}
                onChange={(e) => handleFieldChange('akreditasi', e.target.value)}
                placeholder="A / Unggul / B"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-bold"
              />
              <div className="flex flex-wrap gap-1">
                {['A', 'B', 'C', 'Unggul', 'Baik Sekali', '-'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleFieldChange('akreditasi', preset)}
                    className={`text-[10px] px-2 py-0.5 rounded border transition ${
                      madrasah.akreditasi === preset
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {preset === '-' ? 'Belum' : preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Motto / Slogan Madrasah
            </label>
            <input
              type="text"
              value={madrasah.motto}
              onChange={(e) => handleFieldChange('motto', e.target.value)}
              placeholder="Madrasah Maju, Bermutu, dan Mendunia"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Alamat & Kontak */}
      <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-3 shadow-sm">
        <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" /> Alamat & Kontak Madrasah
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Jalan / Kompleks Madrasah
            </label>
            <input
              type="text"
              value={madrasah.alamat}
              onChange={(e) => handleFieldChange('alamat', e.target.value)}
              placeholder="Jl. Pesantren No. 45, Kompleks Madrasah"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Kota / Kabupaten
            </label>
            <input
              type="text"
              value={madrasah.kotaKab}
              onChange={(e) => handleFieldChange('kotaKab', e.target.value)}
              placeholder="Kab. Bandung"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Phone className="w-3 h-3 text-emerald-400" /> Nomor Telepon
            </label>
            <input
              type="text"
              value={madrasah.telepon}
              onChange={(e) => handleFieldChange('telepon', e.target.value)}
              placeholder="(022) 8752-9912"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Mail className="w-3 h-3 text-emerald-400" /> Email Resmi
            </label>
            <input
              type="email"
              value={madrasah.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              placeholder="info@mialikhlas.sch.id"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Globe className="w-3 h-3 text-emerald-400" /> Website Lembaga
            </label>
            <input
              type="text"
              value={madrasah.website}
              onChange={(e) => handleFieldChange('website', e.target.value)}
              placeholder="www.mialikhlas.sch.id"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Kepala Madrasah & Legalitas Penetapan */}
      <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
            <PenTool className="w-3.5 h-3.5" /> Pejabat Penandatangan & Pengesahan Kartu
          </h4>
          {onOpenSignaturePad && (
            <button
              type="button"
              onClick={onOpenSignaturePad}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-sm transition active:scale-95"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Gores TTD & Edit Penandatangan</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Jabatan / Posisi Penandatangan *
            </label>
            <div className="space-y-1.5">
              <input
                type="text"
                value={madrasah.jabatanPenandatangan ?? ''}
                onChange={(e) => handleFieldChange('jabatanPenandatangan', e.target.value)}
                placeholder="Contoh: Kepala Madrasah / Plt. Kepala Madrasah"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-semibold focus:outline-none focus:border-emerald-500"
              />
              <div className="flex flex-wrap gap-1">
                {['Kepala Madrasah', 'Plt. Kepala Madrasah', 'Kepala Tata Usaha', 'Waka Kesiswaan', 'Ketua Yayasan'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      handleFieldChange('jabatanPenandatangan', preset);
                      if (onSave) onSave({ ...madrasah, jabatanPenandatangan: preset });
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded border transition ${
                      (madrasah.jabatanPenandatangan || 'Kepala Madrasah') === preset
                        ? 'bg-emerald-700 border-emerald-500 text-white font-bold'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nama Lengkap Pejabat (Beserta Gelar) *
            </label>
            <input
              type="text"
              value={madrasah.namaKepalaMadrasah}
              onChange={(e) => handleFieldChange('namaKepalaMadrasah', e.target.value)}
              placeholder="Siti Rochimah, S.Pd.I"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-semibold focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Jenis & Nomor Identitas Pejabat
            </label>
            <div className="flex gap-2 items-start">
              <div className="w-1/3 space-y-1">
                <input
                  type="text"
                  value={madrasah.labelIdPenandatangan ?? 'NIP'}
                  onChange={(e) => handleFieldChange('labelIdPenandatangan', e.target.value)}
                  placeholder="NIP / NIY"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400"
                />
                <div className="flex flex-wrap gap-1">
                  {['NIP', 'NIY', 'NUPTK', 'NRG', 'PegID', 'NIK', '-'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleFieldChange('labelIdPenandatangan', preset === '-' ? '' : preset)}
                      className={`text-[9px] px-1 py-0.5 rounded border transition ${
                        (madrasah.labelIdPenandatangan || 'NIP') === preset
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {preset === '-' ? 'Kosong' : preset}
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-2/3">
                <input
                  type="text"
                  value={madrasah.nipKepalaMadrasah || ''}
                  onChange={(e) => handleFieldChange('nipKepalaMadrasah', e.target.value)}
                  placeholder="19760512 200501 1 003"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Kota Penetapan Kartu
            </label>
            <input
              type="text"
              value={madrasah.kotaPenetapan}
              onChange={(e) => handleFieldChange('kotaPenetapan', e.target.value)}
              placeholder="Bandung"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">
                Tanggal Penetapan Kartu
              </label>
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                    const formatted = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
                    handleFieldChange('tanggalPenetapan', formatted);
                  }}
                  className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-emerald-300 rounded text-[10px] font-semibold transition"
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => handleFieldChange('tanggalPenetapan', '15 Juli 2025')}
                  className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-amber-300 rounded text-[10px] font-semibold transition"
                >
                  Awal TP (15 Juli 2025)
                </button>
              </div>
            </div>
            <input
              type="text"
              value={madrasah.tanggalPenetapan}
              onChange={(e) => handleFieldChange('tanggalPenetapan', e.target.value)}
              placeholder="15 Juli 2025"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* BOTTOM ACTION BAR: EXPLICIT SAVE BUTTON */}
      <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-slate-300">
            Perubahan profil madrasah tersimpan otomatis dan disinkronkan ke seluruh berkas.
          </span>
        </div>

        <div className="flex items-center gap-2">
          {saveFeedback && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-500/50 flex items-center gap-1.5 animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {saveFeedback}
            </span>
          )}

          <button
            type="button"
            onClick={handleExplicitSave}
            className="px-5 py-2 text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl flex items-center gap-2 shadow-lg transition active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Profil Madrasah</span>
          </button>
        </div>
      </div>
    </div>
  );
};
