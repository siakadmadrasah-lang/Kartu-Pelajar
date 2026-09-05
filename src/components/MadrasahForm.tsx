import React, { useRef, useState } from 'react';
import { MadrasahInfo, CardConfig, PageLoaderConfig } from '../types';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Award, 
  PenTool, 
  Stamp, 
  Upload, 
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Trash2,
  Layers,
  CreditCard,
  FileText,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  Save,
  Loader2,
  Wand2,
  Sliders,
  ShieldCheck,
  School,
  Calendar
} from 'lucide-react';
import { KemenagLogo, MadrasahLogo } from './Logos';
import { 
  compressLogoOrGraphic, 
  processStampUpload, 
  processSignatureUpload, 
  makeStampOrSignatureTransparent,
  compressImage
} from '../utils/imageUtils';

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
  const logoAppRef = useRef<HTMLInputElement>(null);
  const logoMadrasahRef = useRef<HTMLInputElement>(null);
  const logoKemenagRef = useRef<HTMLInputElement>(null);
  const logoPageLoaderRef = useRef<HTMLInputElement>(null);
  const stempelRef = useRef<HTMLInputElement>(null);
  const ttdRef = useRef<HTMLInputElement>(null);

  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const handleFieldChange = (field: keyof MadrasahInfo, value: any) => {
    const updated = {
      ...madrasah,
      [field]: value,
    };
    if (field === 'namaMadrasah') {
      if (!updated.subJudulHeaderAplikasi || updated.subJudulHeaderAplikasi === "MI MA'ARIF NU 2 SANGGREMAN" || updated.subJudulHeaderAplikasi === madrasah.namaMadrasah) {
        updated.subJudulHeaderAplikasi = value;
      }
    }
    onChange(updated);
  };

  const handleFileUpload = async (field: keyof MadrasahInfo, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setUploadingField(field);
        let optimizedBase64 = '';

        if (field === 'stempelUrl') {
          // Auto transparent background removal specifically tuned for stamp ink (purple/blue/red/black)
          optimizedBase64 = await processStampUpload(file);
          setSaveFeedback('✓ Stempel berhasil diunggah & dibuat transparan otomatis!');
        } else if (field === 'ttdKepalaUrl') {
          // Auto transparent background removal specifically tuned for handwritten signatures on paper
          optimizedBase64 = await processSignatureUpload(file);
          setSaveFeedback('✓ Tanda tangan berhasil diunggah & dibuat transparan otomatis!');
        } else {
          // Compress logo / graphics while preserving PNG transparency
          optimizedBase64 = await compressLogoOrGraphic(file, 512);
          setSaveFeedback('✓ Logo berhasil diperbarui dan disimpan!');
        }

        const updated = {
          ...madrasah,
          [field]: optimizedBase64,
        };
        onChange(updated);
        if (onSave) {
          onSave(updated);
        }
        setTimeout(() => setSaveFeedback(null), 3500);
      } catch (err) {
        console.error('Failed to process image file:', err);
        // Fallback to direct FileReader if compression fails
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const updated = {
              ...madrasah,
              [field]: event.target.result as string,
            };
            onChange(updated);
            if (onSave) {
              onSave(updated);
            }
          }
        };
        reader.readAsDataURL(file);
      } finally {
        setUploadingField(null);
        e.target.value = '';
      }
    }
  };

  const handleMakeTransparentManual = async (field: 'stempelUrl' | 'ttdKepalaUrl' | 'logoMadrasahUrl') => {
    const currentUrl = madrasah[field];
    if (!currentUrl) return;

    try {
      setUploadingField(field);
      const type = field === 'stempelUrl' ? 'stamp' : field === 'ttdKepalaUrl' ? 'signature' : 'logo';
      const transparent = await makeStampOrSignatureTransparent(currentUrl, {
        type,
        feather: 30,
        boostContrast: true,
        enhanceColor: true,
        sensitivity: 'ultra',
        inkColorMode: 'auto',
      });

      const updated = {
        ...madrasah,
        [field]: transparent,
      };
      onChange(updated);
      if (onSave) {
        onSave(updated);
      }
      setSaveFeedback('✓ Background berhasil dibersihkan & dijadikan 100% transparan!');
      setTimeout(() => setSaveFeedback(null), 3500);
    } catch (e) {
      console.error(e);
    } finally {
      setUploadingField(null);
    }
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
          <span>Data Pokok Lembaga & Header Instansi</span>
          <span className="text-[10px] text-emerald-400 font-semibold lowercase">Bisa diedit bebas</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* EDIT NAMA KEMENTERIAN / INSTANSI INDUK */}
          <div className="md:col-span-2 bg-slate-900/90 p-3.5 rounded-xl border border-amber-500/30 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-800">
              <div>
                <label className="block text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Nama Kementerian / Instansi Induk (Baris 1 Kop Kartu & Surat) *
                </label>
                <span className="text-[10px] text-slate-400">Header Tingkat Pusat / Yayasan</span>
              </div>

              {/* Status & Toggle On/Off Nama Kementerian di Kartu & Surat */}
              {config && onConfigChange && (
                <div className="flex flex-wrap items-center gap-2">
                  {/* Toggle untuk Kop Kartu */}
                  <button
                    type="button"
                    onClick={() => onConfigChange({ ...config, showNamaKementerian: !(config.showNamaKementerian ?? true) })}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 shadow-sm ${
                      (config.showNamaKementerian ?? true)
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700'
                    }`}
                    title="Klik untuk aktifkan / nonaktifkan nama kementerian pada kop kartu pelajar"
                  >
                    <CreditCard className="w-3 h-3 text-emerald-400" />
                    <span className={`w-1.5 h-1.5 rounded-full ${(config.showNamaKementerian ?? true) ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                    <span>{(config.showNamaKementerian ?? true) ? 'Kartu: Aktif' : 'Kartu: Nonaktif'}</span>
                  </button>

                  {/* Toggle untuk Kop Surat */}
                  <button
                    type="button"
                    onClick={() => onConfigChange({ ...config, showNamaKementerianSurat: !(config.showNamaKementerianSurat ?? true) })}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 shadow-sm ${
                      (config.showNamaKementerianSurat ?? true)
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700'
                    }`}
                    title="Klik untuk aktifkan / nonaktifkan nama kementerian pada kop surat keterangan aktif"
                  >
                    <FileText className="w-3 h-3 text-amber-400" />
                    <span className={`w-1.5 h-1.5 rounded-full ${(config.showNamaKementerianSurat ?? true) ? 'bg-amber-400' : 'bg-slate-500'}`} />
                    <span>{(config.showNamaKementerianSurat ?? true) ? 'Surat: Aktif' : 'Surat: Nonaktif'}</span>
                  </button>
                </div>
              )}
            </div>
            <input
              type="text"
              value={madrasah.namaKementerian ?? ''}
              onChange={(e) => handleFieldChange('namaKementerian', e.target.value.toUpperCase())}
              placeholder="KEMENTERIAN AGAMA REPUBLIK INDONESIA"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-amber-200 font-bold focus:outline-none focus:border-amber-400 tracking-wide"
            />
            {/* Quick Presets for Kementerian / Instansi */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-medium">Pilihan Cepat:</span>
              {[
                'KEMENTERIAN AGAMA REPUBLIK INDONESIA',
                'KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI',
                'YAYASAN PENDIDIKAN ISLAM',
                'LEMBAGA PENDIDIKAN MA\'ARIF NU',
                'MAJELIS DIKDASMEN MUHAMMADIYAH',
                'DINAS PENDIDIKAN DAN KEBUDAYAAN'
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    handleFieldChange('namaKementerian', preset);
                    if (onSave) onSave({ ...madrasah, namaKementerian: preset });
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded border transition ${
                    (madrasah.namaKementerian || 'KEMENTERIAN AGAMA REPUBLIK INDONESIA') === preset
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {preset.length > 30 ? preset.slice(0, 27) + '...' : preset}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 space-y-3 p-3.5 bg-slate-950/80 rounded-xl border border-emerald-500/40">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1 flex items-center justify-between">
                <span>Nama Madrasah / Sekolah (Utama) *</span>
                <span className="text-[11px] text-amber-400 font-normal">Nama dasar lembaga</span>
              </label>
              <input
                type="text"
                value={madrasah.namaMadrasah}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  onChange({
                    ...madrasah,
                    namaMadrasah: val,
                    namaMadrasahKop: (!madrasah.namaMadrasahKop || madrasah.namaMadrasahKop === madrasah.namaMadrasah) ? val : madrasah.namaMadrasahKop,
                    namaSatuanPendidikan: (!madrasah.namaSatuanPendidikan || madrasah.namaSatuanPendidikan === madrasah.namaMadrasah) ? val : madrasah.namaSatuanPendidikan,
                  });
                }}
                placeholder="MI MA'ARIF NU 2 SANGGREMAN"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Pembedaan Nama Kop vs Satuan Pendidikan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <span>📌 Nama Madrasah di KOP (Kartu & Surat)</span>
                </label>
                <input
                  type="text"
                  value={madrasah.namaMadrasahKop ?? madrasah.namaMadrasah}
                  onChange={(e) => handleFieldChange('namaMadrasahKop', e.target.value.toUpperCase())}
                  placeholder="e.g. MI MA'ARIF NU 2 SANGGREMAN"
                  className="w-full bg-slate-900 border border-amber-400/50 rounded-lg px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-amber-400"
                />
                <p className="text-[10px] text-slate-400">Tampil sebagai baris judul pada KOP atas kartu pelajar dan kop surat.</p>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <span>🏫 Nama Satuan Pendidikan (Identitas Siswa)</span>
                </label>
                <input
                  type="text"
                  value={madrasah.namaSatuanPendidikan ?? madrasah.namaMadrasah}
                  onChange={(e) => handleFieldChange('namaSatuanPendidikan', e.target.value.toUpperCase())}
                  placeholder="e.g. MI MA'ARIF NU 2 SANGGREMAN"
                  className="w-full bg-slate-900 border border-emerald-500/50 rounded-lg px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-emerald-400"
                />
                <p className="text-[10px] text-slate-400">Tampil pada rincian biodata siswa (baris 'Madrasah: ...' di kartu & surat).</p>
              </div>
            </div>
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
              value={madrasah.kemenagWilayah}
              onChange={(e) => handleFieldChange('kemenagWilayah', e.target.value.toUpperCase())}
              placeholder="KANTOR KEMENTERIAN AGAMA KABUPATEN BANYUMAS"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-400" /> Status Akreditasi
            </label>
            <select
              value={madrasah.akreditasi}
              onChange={(e) => handleFieldChange('akreditasi', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="A">Akreditasi A (Unggul)</option>
              <option value="B">Akreditasi B (Baik)</option>
              <option value="C">Akreditasi C</option>
              <option value="Unggul">Unggul</option>
              <option value="-">Belum Terakreditasi</option>
            </select>
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
              Jenis Nomor Identitas Pejabat
            </label>
            <div className="flex gap-2">
              <select
                value={madrasah.labelIdPenandatangan || 'NIP'}
                onChange={(e) => handleFieldChange('labelIdPenandatangan', e.target.value)}
                className="w-1/3 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-amber-300 font-bold focus:outline-none focus:border-emerald-500"
              >
                <option value="NIP">NIP</option>
                <option value="NIY">NIY</option>
                <option value="NUPTK">NUPTK</option>
                <option value="NRG">NRG</option>
                <option value="PegID">PegID</option>
                <option value="NIK">NIK</option>
                <option value="ID">ID</option>
              </select>
              <input
                type="text"
                value={madrasah.nipKepalaMadrasah}
                onChange={(e) => handleFieldChange('nipKepalaMadrasah', e.target.value)}
                placeholder="19760512 200501 1 003"
                className="w-2/3 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
              />
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

      {/* 1. SEPARATE SECTION: PENGATURAN JUDUL & BRANDING HEADER APLIKASI (WEB / NAVBAR SISTEM) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 rounded-xl border border-amber-500/40 space-y-4 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-700/80">
          <div>
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> 1. Judul & Branding Header Aplikasi Web (Terpisah dari Kop Madrasah)
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Pengaturan judul bilah atas (navbar web), badge status, dan logo aplikasi. Tidak mempengaruhi kop resmi cetak kartu pelajar & surat aktif.
            </p>
          </div>
          <span className="text-[10px] font-bold bg-amber-400/10 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
            Header Navbar Web
          </span>
        </div>

        {/* Real-time Header Preview Card */}
        <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-700/80 shadow-inner">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Pratinjau Tampilan Header Web (Real-time Navbar Preview):
          </span>
          <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 flex items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 px-1 py-0.5 rounded-lg bg-gradient-to-br from-emerald-950/90 to-slate-900 border border-emerald-400/60 ring-1 ring-emerald-400/20 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
                {madrasah.logoAplikasiUrl ? (
                  <img
                    src={madrasah.logoAplikasiUrl}
                    alt="Logo Header"
                    className="h-full w-auto max-w-[120px] max-h-full object-contain filter drop-shadow select-none"
                  />
                ) : (
                  <KemenagLogo className="w-5 h-5 text-amber-300" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black text-white uppercase tracking-tight truncate">
                    {madrasah.judulHeaderAplikasi || 'KARTU PELAJAR DIGITAL'}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {madrasah.badgeHeaderAplikasi || 'Kemenag'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[8px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1 h-1 rounded-full bg-emerald-400" />
                    Database Sinkron
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-medium truncate mt-0.5">
                  {madrasah.showMadrasahInHeader !== false && (
                    <span className="text-amber-300 font-semibold truncate">
                      {madrasah.subJudulHeaderAplikasi || madrasah.namaMadrasah || "MI MA'ARIF NU 2 SANGGREMAN"}
                    </span>
                  )}
                  {madrasah.showMadrasahInHeader !== false && (
                    <span className="text-slate-600">•</span>
                  )}
                  <span className="truncate">Portal Layanan Kartu Pelajar & Surat Keterangan Aktif</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Inputs for Title, Subtitle, and Badge */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Judul Utama Header */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-xs font-bold text-amber-300 flex items-center justify-between">
              <span>Judul Utama Header Aplikasi (Navbar) *</span>
              <span className="text-[10px] text-emerald-400 font-normal">Kustom Bebas</span>
            </label>
            <input
              type="text"
              value={madrasah.judulHeaderAplikasi ?? ''}
              onChange={(e) => handleFieldChange('judulHeaderAplikasi', e.target.value.toUpperCase())}
              placeholder="KARTU PELAJAR DIGITAL"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-black tracking-wide focus:outline-none focus:border-amber-400"
            />
            {/* Quick Presets for App Title */}
            <div className="flex flex-wrap items-center gap-1 pt-1">
              <span className="text-[9px] text-slate-400 font-medium">Pilihan Cepat:</span>
              {[
                'KARTU PELAJAR DIGITAL',
                'SIAKAD KARTU PELAJAR',
                'PORTAL KARTU MADRASAH',
                'KARTU IDENTITAS SANTRI',
                'SISTEM KARTU SISWA MI'
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    handleFieldChange('judulHeaderAplikasi', preset);
                    if (onSave) onSave({ ...madrasah, judulHeaderAplikasi: preset });
                  }}
                  className={`text-[9px] px-2 py-0.5 rounded border transition ${
                    (madrasah.judulHeaderAplikasi || 'KARTU PELAJAR DIGITAL') === preset
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Badge Samping Judul */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Teks Badge Header
            </label>
            <input
              type="text"
              value={madrasah.badgeHeaderAplikasi ?? ''}
              onChange={(e) => handleFieldChange('badgeHeaderAplikasi', e.target.value.toUpperCase())}
              placeholder="KEMENAG"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-emerald-300 font-bold tracking-wider focus:outline-none focus:border-emerald-400"
            />
            <div className="flex flex-wrap items-center gap-1 pt-1">
              {['KEMENAG', 'OFFICIAL', 'SIAKAD', 'PRO', '2025/2026'].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => {
                    handleFieldChange('badgeHeaderAplikasi', b);
                    if (onSave) onSave({ ...madrasah, badgeHeaderAplikasi: b });
                  }}
                  className={`text-[9px] px-1.5 py-0.5 rounded border transition ${
                    (madrasah.badgeHeaderAplikasi || 'KEMENAG') === b
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-Judul / Keterangan Samping Judul Header */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Sub-Judul / Nama Instansi di Navbar Atas Web</span>
              <span className="text-[10px] text-slate-400 font-normal">Opsional (Muncul di baris bawah judul navbar aplikasi)</span>
            </label>
            <input
              type="text"
              value={madrasah.subJudulHeaderAplikasi ?? madrasah.namaMadrasah}
              onChange={(e) => handleFieldChange('subJudulHeaderAplikasi', e.target.value)}
              placeholder="MI MA'ARIF NU 2 SANGGREMAN"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Switch Toggle Tampilkan Sub-judul Madrasah di Header */}
          <div className="space-y-1.5 flex flex-col justify-between">
            <label className="block text-xs font-semibold text-slate-300">
              Tampilkan Madrasah di Header
            </label>
            <button
              type="button"
              onClick={() => handleFieldChange('showMadrasahInHeader', !(madrasah.showMadrasahInHeader !== false))}
              className={`w-full py-2 px-3 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-2 ${
                madrasah.showMadrasahInHeader !== false
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${madrasah.showMadrasahInHeader !== false ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              <span>{madrasah.showMadrasahInHeader !== false ? 'Tampil di Header: Aktif' : 'Tampil di Header: Disembunyikan'}</span>
            </button>
          </div>
        </div>

        {/* Upload Logo Khusus Header Aplikasi */}
        <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="h-16 sm:h-20 w-auto min-w-[4rem] sm:min-w-[5rem] max-w-[160px] p-1 rounded-xl bg-slate-900 border border-amber-400/70 ring-1 ring-amber-400/30 shadow-md flex items-center justify-center flex-shrink-0 select-none overflow-hidden">
              {madrasah.logoAplikasiUrl ? (
                <img
                  src={madrasah.logoAplikasiUrl}
                  alt="Logo Aplikasi"
                  className="h-full w-auto max-w-full max-h-full object-contain filter drop-shadow select-none"
                />
              ) : (
                <KemenagLogo className="w-12 h-12" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  {madrasah.logoAplikasiUrl ? 'Logo Kustom Header Aktif' : 'Logo Default Kemenag RI'}
                </span>
                {madrasah.logoAplikasiUrl ? (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Kustom
                  </span>
                ) : (
                  <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                    Standar
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Logo khusus navigasi atas web (PNG Transparan/SVG disarankan).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <input
              type="file"
              ref={logoAppRef}
              onChange={(e) => handleFileUpload('logoAplikasiUrl', e)}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              disabled={uploadingField === 'logoAplikasiUrl'}
              onClick={() => logoAppRef.current?.click()}
              className="flex-1 sm:flex-initial px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-emerald-950 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              {uploadingField === 'logoAplikasiUrl' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Unggah Logo Header</span>
                </>
              )}
            </button>
            {madrasah.logoAplikasiUrl && (
              <button
                type="button"
                onClick={() => handleFieldChange('logoAplikasiUrl', '')}
                className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 rounded-lg border border-slate-700 hover:border-rose-700/60 flex items-center gap-1 transition"
                title="Kembalikan ke logo default"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Reset Default</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. SEPARATE SECTION: LOGO PAGE LOADER / SPLASH SCREEN */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 p-4 rounded-xl border border-emerald-500/40 space-y-3 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" /> 2. Logo Page Loader (Animasi Splash Screen Pembuka)
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Logo yang tampil di tengah layar saat aplikasi dimuat pertama kali dengan efek ring cahaya dan progress bar.
            </p>
          </div>
          <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            Splash Screen
          </span>
        </div>

        <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Logo Preview Container with Checkerboard */}
            <div 
              className="w-14 h-14 p-1 rounded-xl bg-slate-900 border border-emerald-500/50 flex items-center justify-center flex-shrink-0 shadow-inner"
              style={{
                backgroundImage: `linear-gradient(45deg, #1e293b 25%, transparent 25%), 
                                  linear-gradient(-45deg, #1e293b 25%, transparent 25%), 
                                  linear-gradient(45deg, transparent 75%, #1e293b 75%), 
                                  linear-gradient(-45deg, transparent 75%, #1e293b 75%)`,
                backgroundSize: '6px 6px',
                backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
                backgroundColor: '#0f172a'
              }}
            >
              {loaderConfig?.logoType === 'custom' && loaderConfig?.customLogoUrl ? (
                <img
                  src={loaderConfig.customLogoUrl}
                  alt="Logo Page Loader Kustom"
                  className="w-11 h-11 object-contain drop-shadow"
                />
              ) : loaderConfig?.logoType === 'madrasah' ? (
                madrasah.logoMadrasahUrl ? (
                  <img
                    src={madrasah.logoMadrasahUrl}
                    alt="Logo Madrasah"
                    className="w-11 h-11 object-contain drop-shadow"
                  />
                ) : (
                  <MadrasahLogo className="w-11 h-11" />
                )
              ) : loaderConfig?.logoType === 'none' ? (
                <School className="w-8 h-8 text-amber-400 opacity-80" />
              ) : (
                <KemenagLogo className="w-11 h-11" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  {loaderConfig?.logoType === 'custom' && loaderConfig?.customLogoUrl
                    ? 'Logo Kustom Page Loader Aktif'
                    : loaderConfig?.logoType === 'madrasah'
                    ? 'Menggunakan Logo Profil Madrasah'
                    : loaderConfig?.logoType === 'none'
                    ? 'Ikon Minimalis (Tanpa Logo)'
                    : 'Logo Resmi Kementerian Agama RI'}
                </span>
                {loaderConfig?.logoType === 'custom' && loaderConfig?.customLogoUrl ? (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Kustom
                  </span>
                ) : (
                  <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                    Bawaan
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Mendukung PNG Transparan resolusi tinggi (otomatis disesuaikan maksimal 512x512px).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <input
              type="file"
              ref={logoPageLoaderRef}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file && onLoaderConfigChange) {
                  try {
                    setUploadingField('pageLoaderLogo');
                    const optimized = await compressImage(file, {
                      maxWidth: 512,
                      maxHeight: 512,
                      quality: 0.95,
                      mimeType: 'image/png'
                    });
                    if (loaderConfig) {
                      onLoaderConfigChange({
                        ...loaderConfig,
                        logoType: 'custom',
                        customLogoUrl: optimized
                      });
                    }
                  } catch (err) {
                    console.error('Error uploading page loader logo:', err);
                  } finally {
                    setUploadingField(null);
                    e.target.value = '';
                  }
                }
              }}
              accept="image/*"
              className="hidden"
            />

            <button
              type="button"
              disabled={uploadingField === 'pageLoaderLogo'}
              onClick={() => logoPageLoaderRef.current?.click()}
              className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              {uploadingField === 'pageLoaderLogo' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Unggah Logo Loader</span>
                </>
              )}
            </button>

            {onOpenPageLoaderSettings && (
              <button
                type="button"
                onClick={onOpenPageLoaderSettings}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 rounded-lg flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Kustomisasi Lengkap</span>
              </button>
            )}

            {loaderConfig?.logoType === 'custom' && loaderConfig?.customLogoUrl && onLoaderConfigChange && (
              <button
                type="button"
                onClick={() => {
                  if (loaderConfig) {
                    onLoaderConfigChange({
                      ...loaderConfig,
                      logoType: 'kemenag',
                      customLogoUrl: ''
                    });
                  }
                }}
                className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 rounded-lg border border-slate-700 hover:border-rose-700/60 flex items-center gap-1 transition"
                title="Kembalikan logo loader ke standar Kemenag RI"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Reset Default</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. SEPARATE SECTION: PENGATURAN LOGO & LEGALITAS KARTU PELAJAR (CETAK FISIK) */}
      <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" /> 2. Logo & Legalitas Fisik Kartu Pelajar (Cetak PVC / CR80)
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Logo instansi Kemenag (kiri), logo madrasah (kanan), stempel cap, dan tanda tangan khusus untuk fisik kartu siswa.
            </p>
          </div>
          {onOpenSignaturePad && (
            <button
              type="button"
              onClick={onOpenSignaturePad}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-sm transition active:scale-95"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Gores TTD & Cap Pad</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          {/* Logo Kemenag (Kop Kiri Kartu) */}
          {(() => {
            const isKemenagActive = config ? (config.showKemenagLogo !== false && config.logoMode !== 'right_only' && config.logoMode !== 'none' && config.logoMode !== 'madrasah_only') : true;
            const isMadrasahActive = config ? (config.showMadrasahLogo !== false && config.logoMode !== 'left_only' && config.logoMode !== 'none' && config.logoMode !== 'kemenag_only') : true;

            return (
              <div className={`p-3 rounded-xl border flex flex-col items-center justify-between transition ${
                !isKemenagActive
                  ? 'bg-slate-950/60 border-slate-800 opacity-75'
                  : 'bg-slate-900/70 border-slate-700/80'
              }`}>
                <div className="w-full mb-1 flex flex-col items-center">
                  <span className="text-[11px] font-bold text-slate-200 block">Logo Kiri (Kemenag)</span>
                  <span className="text-[9px] text-amber-400 block font-medium">(Kop Kartu Sisi Kiri)</span>
                  
                  {/* Status & Toggle On/Off Logo Kiri */}
                  {config && onConfigChange && (
                    <button
                      type="button"
                      onClick={() => {
                        const nextKemenag = !isKemenagActive;
                        const nextMadrasah = isMadrasahActive;
                        const nextMode = nextKemenag && nextMadrasah ? 'both' : nextKemenag ? 'left_only' : nextMadrasah ? 'right_only' : 'none';
                        onConfigChange({
                          ...config,
                          showKemenagLogo: nextKemenag,
                          showMadrasahLogo: nextMadrasah,
                          logoMode: nextMode,
                        });
                      }}
                      className={`mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full border transition flex items-center gap-1 ${
                        isKemenagActive
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                      }`}
                      title="Klik untuk aktifkan / nonaktifkan logo kiri"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isKemenagActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                      <span>{isKemenagActive ? 'Aktif di Kartu' : 'Nonaktif'}</span>
                    </button>
                  )}
                </div>
            <div className="w-14 h-14 flex items-center justify-center my-1 bg-slate-950/60 rounded-lg p-1 border border-slate-800">
              {madrasah.logoKemenagUrl ? (
                <img src={madrasah.logoKemenagUrl} alt="Logo Kemenag" className="w-12 h-12 object-contain drop-shadow" />
              ) : (
                <KemenagLogo className="w-12 h-12" />
              )}
            </div>
            <input
              type="file"
              ref={logoKemenagRef}
              onChange={(e) => handleFileUpload('logoKemenagUrl', e)}
              accept="image/*"
              className="hidden"
            />
            <div className="w-full space-y-1 mt-2">
              <button
                type="button"
                disabled={uploadingField === 'logoKemenagUrl'}
                onClick={() => logoKemenagRef.current?.click()}
                className="text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-400 px-2 py-1 rounded-lg border border-slate-600 w-full transition flex items-center justify-center gap-1 disabled:opacity-50"
              >
                {uploadingField === 'logoKemenagUrl' ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3 h-3" />
                    <span>Ganti Logo</span>
                  </>
                )}
              </button>
              {madrasah.logoKemenagUrl && (
                <button
                  type="button"
                  onClick={() => handleFieldChange('logoKemenagUrl', '')}
                  className="text-[9px] text-slate-400 hover:text-rose-300 w-full"
                >
                  Reset Default
                </button>
              )}
            </div>
          </div>
        );
      })()}

          {/* Logo Madrasah / Sekolah (Kop Kanan Kartu) */}
          {(() => {
            const isKemenagActive = config ? (config.showKemenagLogo !== false && config.logoMode !== 'right_only' && config.logoMode !== 'none' && config.logoMode !== 'madrasah_only') : true;
            const isMadrasahActive = config ? (config.showMadrasahLogo !== false && config.logoMode !== 'left_only' && config.logoMode !== 'none' && config.logoMode !== 'kemenag_only') : true;

            return (
              <div className={`p-3 rounded-xl border flex flex-col items-center justify-between transition ${
                !isMadrasahActive
                  ? 'bg-slate-950/60 border-slate-800 opacity-75'
                  : 'bg-slate-900/70 border-slate-700/80'
              }`}>
                <div className="w-full mb-1 flex flex-col items-center">
                  <span className="text-[11px] font-bold text-slate-200 block">Logo Kanan (Madrasah)</span>
                  <span className="text-[9px] text-emerald-400 block font-medium">(Kop Kartu Sisi Kanan)</span>

                  {/* Status & Toggle On/Off Logo Kanan */}
                  {config && onConfigChange && (
                    <button
                      type="button"
                      onClick={() => {
                        const nextMadrasah = !isMadrasahActive;
                        const nextKemenag = isKemenagActive;
                        const nextMode = nextKemenag && nextMadrasah ? 'both' : nextKemenag ? 'left_only' : nextMadrasah ? 'right_only' : 'none';
                        onConfigChange({
                          ...config,
                          showKemenagLogo: nextKemenag,
                          showMadrasahLogo: nextMadrasah,
                          logoMode: nextMode,
                        });
                      }}
                      className={`mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full border transition flex items-center gap-1 ${
                        isMadrasahActive
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                      }`}
                      title="Klik untuk aktifkan / nonaktifkan logo kanan"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isMadrasahActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                      <span>{isMadrasahActive ? 'Aktif di Kartu' : 'Nonaktif'}</span>
                    </button>
                  )}
                </div>
            <div className="w-14 h-14 flex items-center justify-center my-1 bg-slate-950/60 rounded-lg p-1 border border-slate-800">
              {madrasah.logoMadrasahUrl ? (
                <img src={madrasah.logoMadrasahUrl} alt="Logo Madrasah" className="w-12 h-12 object-contain drop-shadow" />
              ) : (
                <MadrasahLogo className="w-12 h-12" />
              )}
            </div>
            <input
              type="file"
              ref={logoMadrasahRef}
              onChange={(e) => handleFileUpload('logoMadrasahUrl', e)}
              accept="image/*"
              className="hidden"
            />
            <div className="w-full space-y-1 mt-2">
              <button
                type="button"
                disabled={uploadingField === 'logoMadrasahUrl'}
                onClick={() => logoMadrasahRef.current?.click()}
                className="text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-400 px-2 py-1 rounded-lg border border-slate-600 w-full transition flex items-center justify-center gap-1 disabled:opacity-50"
              >
                {uploadingField === 'logoMadrasahUrl' ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3 h-3" />
                    <span>Upload Logo MI</span>
                  </>
                )}
              </button>
              {madrasah.logoMadrasahUrl && (
                <button
                  type="button"
                  onClick={() => handleFieldChange('logoMadrasahUrl', '')}
                  className="text-[9px] text-slate-400 hover:text-rose-300 w-full"
                >
                  Reset Default
                </button>
              )}
            </div>
              </div>
            );
          })()}

          {/* Stempel Cap Basah Kartu */}
          <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-700/80 flex flex-col items-center justify-between">
            <div className="w-full mb-1">
              <span className="text-[11px] font-bold text-slate-200 block">Stempel Cap</span>
              <span className="text-[9px] text-violet-400 block font-medium">(Auto Transparan)</span>
            </div>
            <div 
              className="w-14 h-14 flex items-center justify-center my-1 rounded-lg p-1 border border-slate-700"
              style={{
                backgroundImage: `linear-gradient(45deg, #1e293b 25%, transparent 25%), 
                                  linear-gradient(-45deg, #1e293b 25%, transparent 25%), 
                                  linear-gradient(45deg, transparent 75%, #1e293b 75%), 
                                  linear-gradient(-45deg, transparent 75%, #1e293b 75%)`,
                backgroundSize: '8px 8px',
                backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                backgroundColor: '#0f172a'
              }}
            >
              {madrasah.stempelUrl ? (
                <img src={madrasah.stempelUrl} alt="Stempel Transparan" className="w-12 h-12 object-contain filter drop-shadow-sm" />
              ) : (
                <div className="text-center">
                  <Stamp className="w-6 h-6 text-violet-400 mx-auto" />
                  <span className="text-violet-400 text-[8px] font-bold block mt-0.5">Auto Stamp</span>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={stempelRef}
              onChange={(e) => handleFileUpload('stempelUrl', e)}
              accept="image/*"
              className="hidden"
            />
            <div className="w-full space-y-1 mt-2">
              <button
                type="button"
                disabled={uploadingField === 'stempelUrl'}
                onClick={() => stempelRef.current?.click()}
                className="text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-violet-400 px-2 py-1 rounded-lg border border-slate-600 w-full transition flex items-center justify-center gap-1 disabled:opacity-50"
              >
                {uploadingField === 'stempelUrl' ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3 h-3" />
                    <span>Upload Cap</span>
                  </>
                )}
              </button>

              {madrasah.stempelUrl && (
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    disabled={uploadingField === 'stempelUrl'}
                    onClick={() => handleMakeTransparentManual('stempelUrl')}
                    className="text-[9px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-1 py-0.5 rounded border border-amber-500/40 w-full flex items-center justify-center gap-1 transition disabled:opacity-50"
                    title="Hilangkan background putih stempel"
                  >
                    <Wand2 className="w-2.5 h-2.5" />
                    <span>✨ Transparan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFieldChange('stempelUrl', '')}
                    className="text-[9px] text-slate-400 hover:text-rose-300 w-full text-center"
                  >
                    Reset Auto Stamp
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tanda Tangan Kepala Madrasah */}
          <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-700/80 flex flex-col items-center justify-between">
            <div className="w-full mb-1">
              <span className="text-[11px] font-bold text-slate-200 block">TTD Pejabat</span>
              <span className="text-[9px] text-blue-400 block font-medium">(Auto Transparan)</span>
            </div>
            <div 
              className="w-14 h-14 flex items-center justify-center my-1 rounded-lg p-1 border border-slate-700"
              style={{
                backgroundImage: `linear-gradient(45deg, #1e293b 25%, transparent 25%), 
                                  linear-gradient(-45deg, #1e293b 25%, transparent 25%), 
                                  linear-gradient(45deg, transparent 75%, #1e293b 75%), 
                                  linear-gradient(-45deg, transparent 75%, #1e293b 75%)`,
                backgroundSize: '8px 8px',
                backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                backgroundColor: '#0f172a'
              }}
            >
              {madrasah.ttdKepalaUrl ? (
                <img src={madrasah.ttdKepalaUrl} alt="TTD Transparan" className="w-12 h-12 object-contain filter drop-shadow-sm" />
              ) : (
                <div className="text-center">
                  <PenTool className="w-6 h-6 text-blue-400 mx-auto" />
                  <span className="text-blue-400 text-[8px] font-bold block mt-0.5">Auto TTD</span>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={ttdRef}
              onChange={(e) => handleFileUpload('ttdKepalaUrl', e)}
              accept="image/*"
              className="hidden"
            />
            <div className="w-full space-y-1 mt-2">
              <button
                type="button"
                disabled={uploadingField === 'ttdKepalaUrl'}
                onClick={() => ttdRef.current?.click()}
                className="text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-blue-400 px-2 py-1 rounded-lg border border-slate-600 w-full transition flex items-center justify-center gap-1 disabled:opacity-50"
              >
                {uploadingField === 'ttdKepalaUrl' ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3 h-3" />
                    <span>Upload TTD</span>
                  </>
                )}
              </button>

              {madrasah.ttdKepalaUrl && (
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    disabled={uploadingField === 'ttdKepalaUrl'}
                    onClick={() => handleMakeTransparentManual('ttdKepalaUrl')}
                    className="text-[9px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-1 py-0.5 rounded border border-amber-500/40 w-full flex items-center justify-center gap-1 transition disabled:opacity-50"
                    title="Hilangkan background kertas tanda tangan"
                  >
                    <Wand2 className="w-2.5 h-2.5" />
                    <span>✨ Transparan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFieldChange('ttdKepalaUrl', '')}
                    className="text-[9px] text-slate-400 hover:text-rose-300 w-full text-center"
                  >
                    Reset Auto TTD
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ACTION BAR: EXPLICIT SAVE BUTTON */}
      <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-slate-300">
            Perubahan logo dan profil tersimpan otomatis dan disinkronkan ke seluruh kartu.
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
            <span>Simpan Profil & Seluruh Logo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
