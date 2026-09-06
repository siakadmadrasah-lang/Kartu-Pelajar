import React, { useRef, useState } from 'react';
import { MadrasahInfo } from '../types';
import { 
  Sparkles, 
  Upload, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  Save, 
  Layout, 
  Sliders, 
  Layers, 
  Eye
} from 'lucide-react';
import { KemenagLogo } from './Logos';
import { compressLogoOrGraphic } from '../utils/imageUtils';

interface HeaderBrandingManagerProps {
  madrasah: MadrasahInfo;
  onChange: (updated: MadrasahInfo) => void;
  onSave?: (updated: MadrasahInfo) => void;
}

export const HeaderBrandingManager: React.FC<HeaderBrandingManagerProps> = ({
  madrasah,
  onChange,
  onSave,
}) => {
  const logoAppRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const handleFieldChange = (field: keyof MadrasahInfo, value: any) => {
    const updated = {
      ...madrasah,
      [field]: value,
    };
    onChange(updated);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const optimized = await compressLogoOrGraphic(file);
      const updated = {
        ...madrasah,
        logoAplikasiUrl: optimized,
      };
      onChange(updated);
      if (onSave) onSave(updated);
      setSaveFeedback('✓ Logo Header Berhasil Diunggah & Disimpan!');
      setTimeout(() => setSaveFeedback(null), 3500);
    } catch (err) {
      console.error('Error uploading app logo:', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(madrasah);
    } else {
      onChange(madrasah);
    }
    setSaveFeedback('✓ Pengaturan Judul & Branding Header Berhasil Disimpan!');
    setTimeout(() => setSaveFeedback(null), 3500);
  };

  return (
    <div className="space-y-5">
      {/* HEADER SECTION INFO */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 p-5 rounded-2xl border border-amber-500/40 space-y-4 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-700/80">
          <div>
            <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Judul & Branding Header Aplikasi Web (Terpisah dari Kop Madrasah)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Modul mandiri untuk mengkustomisasi navbar bilah atas web: nama aplikasi sistem, badge status, sub-judul, dan logo ikon navigasi.
            </p>
          </div>
          <span className="text-xs font-bold bg-amber-400/10 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
            <Layout className="w-3.5 h-3.5 text-amber-400" />
            <span>Modul Header Mandiri</span>
          </span>
        </div>

        {/* Real-time Header Preview Card */}
        <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 shadow-inner">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              Pratinjau Tampilan Header Web (Live Navbar Preview):
            </span>
            <span className="text-[10px] text-amber-300 font-mono">Tampilan Navbar Sticky Atas</span>
          </div>

          <div className="bg-slate-900/95 rounded-xl p-3 border border-slate-800 flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 px-1.5 py-0.5 rounded-xl bg-gradient-to-br from-emerald-950/90 to-slate-900 border border-emerald-400/60 ring-1 ring-emerald-400/20 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
                {madrasah.logoAplikasiUrl ? (
                  <img
                    src={madrasah.logoAplikasiUrl}
                    alt="Logo Header"
                    className="h-full w-auto max-w-[130px] max-h-full object-contain filter drop-shadow select-none"
                  />
                ) : (
                  <KemenagLogo className="w-6 h-6 text-amber-300" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-black text-white uppercase tracking-tight truncate">
                    {madrasah.judulHeaderAplikasi || 'KARTU PELAJAR DIGITAL'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {madrasah.badgeHeaderAplikasi || 'Kemenag'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Database Terhubung
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium truncate mt-0.5">
                  {madrasah.showMadrasahInHeader !== false && (
                    <span className="text-amber-300 font-semibold truncate">
                      {madrasah.subJudulHeaderAplikasi || madrasah.namaMadrasah || "MI MA'ARIF NU 2 SANGGREMAN"}
                    </span>
                  )}
                  {madrasah.showMadrasahInHeader !== false && (
                    <span className="text-slate-600">•</span>
                  )}
                  <span className="truncate">Portal Layanan Kartu Pelajar & Cetak ID Siswa</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
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
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-black tracking-wide focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition"
            />
            {/* Quick Presets for App Title */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-medium">Pilihan Cepat:</span>
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
                  className={`text-[10px] px-2.5 py-1 rounded-lg border transition ${
                    (madrasah.judulHeaderAplikasi || 'KARTU PELAJAR DIGITAL') === preset
                      ? 'bg-amber-500/25 border-amber-400 text-amber-300 font-bold'
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
              onChange={(e) => handleFieldChange('badgeHeaderAplikasi', e.target.value)}
              placeholder="KEMENAG"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-emerald-300 font-bold tracking-wider focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 transition"
            />
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {['KEMENAG', 'OFFICIAL', 'SIAKAD', 'PRO', '2025/2026'].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => {
                    handleFieldChange('badgeHeaderAplikasi', b);
                    if (onSave) onSave({ ...madrasah, badgeHeaderAplikasi: b });
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded-lg border transition ${
                    (madrasah.badgeHeaderAplikasi || 'KEMENAG') === b
                      ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 font-bold'
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
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300">
                Sub-Judul / Nama Instansi di Navbar Atas Web
              </label>
              <div className="flex items-center gap-2">
                {madrasah.namaMadrasah && (
                  <button
                    type="button"
                    onClick={() => handleFieldChange('subJudulHeaderAplikasi', madrasah.namaMadrasah)}
                    className="text-[10px] text-amber-400 hover:text-amber-200 underline cursor-pointer"
                  >
                    Samakan dengan Nama Madrasah
                  </button>
                )}
                <span className="text-[10px] text-slate-400 font-normal">Opsional</span>
              </div>
            </div>
            <input
              type="text"
              value={madrasah.subJudulHeaderAplikasi ?? ''}
              onChange={(e) => handleFieldChange('subJudulHeaderAplikasi', e.target.value)}
              placeholder={madrasah.namaMadrasah || "MI MA'ARIF NU 2 SANGGREMAN"}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-400"
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
              className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                madrasah.showMadrasahInHeader !== false
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${madrasah.showMadrasahInHeader !== false ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-500'}`} />
              <span>{madrasah.showMadrasahInHeader !== false ? 'Tampil di Header: Aktif' : 'Tampil di Header: Disembunyikan'}</span>
            </button>
          </div>
        </div>

        {/* Upload Logo Khusus Header Aplikasi */}
        <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div 
              className="h-16 sm:h-20 w-auto min-w-[4.5rem] sm:min-w-[5.5rem] max-w-[170px] p-1.5 rounded-xl bg-slate-900 border border-amber-400/70 ring-1 ring-amber-400/30 shadow-md flex items-center justify-center flex-shrink-0 select-none overflow-hidden"
              style={{
                backgroundImage: `linear-gradient(45deg, #1e293b 25%, transparent 25%), 
                                  linear-gradient(-45deg, #1e293b 25%, transparent 25%), 
                                  linear-gradient(45deg, transparent 75%, #1e293b 75%), 
                                  linear-gradient(-45deg, transparent 75%, #1e293b 75%)`,
                backgroundSize: '8px 8px',
                backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
              }}
            >
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
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Kustom
                  </span>
                ) : (
                  <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                    Standar
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Logo khusus untuk navigasi bilah atas web. Format PNG transparan atau SVG resolusi tinggi sangat disarankan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <input
              type="file"
              ref={logoAppRef}
              onChange={handleLogoUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => logoAppRef.current?.click()}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-emerald-950 rounded-xl flex items-center justify-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Unggah Logo Header</span>
                </>
              )}
            </button>
            {madrasah.logoAplikasiUrl && (
              <button
                type="button"
                onClick={() => {
                  handleFieldChange('logoAplikasiUrl', '');
                  if (onSave) onSave({ ...madrasah, logoAplikasiUrl: '' });
                }}
                className="px-3 py-2 text-xs bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 rounded-xl border border-slate-700 hover:border-rose-700/60 flex items-center gap-1.5 transition cursor-pointer"
                title="Kembalikan ke logo default"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset Default</span>
              </button>
            )}
          </div>
        </div>

        {/* BOTTOM SAVE ACTION */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-700/80">
          <div className="flex items-center gap-2">
            {saveFeedback && (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-500/50 flex items-center gap-1.5 animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {saveFeedback}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 text-xs font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-emerald-950 rounded-xl flex items-center gap-2 shadow-lg transition active:scale-95 cursor-pointer ml-auto"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Branding Header Web</span>
          </button>
        </div>
      </div>
    </div>
  );
};
