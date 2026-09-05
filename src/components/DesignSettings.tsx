import React from 'react';
import { CardConfig, CardOrientation, CardTheme, WatermarkPattern, BackContentPreset } from '../types';
import { THEME_CONFIGS, BACK_CONTENT_PRESETS } from '../constants/initialData';
import { 
  Palette, 
  Layout, 
  Shield, 
  QrCode, 
  FileText, 
  CreditCard,
  Sliders,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';

interface DesignSettingsProps {
  config: CardConfig;
  onChange: (updated: CardConfig) => void;
  onOpenPageLoaderSettings?: () => void;
}

export const DesignSettings: React.FC<DesignSettingsProps> = ({ 
  config, 
  onChange,
  onOpenPageLoaderSettings
}) => {
  const handleUpdate = (field: keyof CardConfig, value: any) => {
    onChange({
      ...config,
      [field]: value,
    });
  };

  const handleAddCustomNote = () => {
    handleUpdate('customBackNotes', [...config.customBackNotes, 'Poin aturan baru...']);
  };

  const handleUpdateCustomNote = (idx: number, text: string) => {
    const updated = [...config.customBackNotes];
    updated[idx] = text;
    handleUpdate('customBackNotes', updated);
  };

  const handleRemoveCustomNote = (idx: number) => {
    const updated = config.customBackNotes.filter((_, i) => i !== idx);
    handleUpdate('customBackNotes', updated);
  };

  const isLeftActive = (config.showKemenagLogo !== false) && config.logoMode !== 'right_only' && config.logoMode !== 'madrasah_only' && config.logoMode !== 'none';
  const isRightActive = (config.showMadrasahLogo !== false) && config.logoMode !== 'left_only' && config.logoMode !== 'kemenag_only' && config.logoMode !== 'none';

  return (
    <div className="space-y-4 text-slate-200">
      {/* 0. Page Loader Quick Settings Banner */}
      {onOpenPageLoaderSettings && (
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-amber-950/80 p-4 rounded-xl border border-emerald-600/50 shadow-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-400/30">
              <Sparkles className="w-5 h-5 text-amber-400 animate-spin-slow" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-2">
                <span>Kustomisasi Splash Page Loader</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 font-extrabold">
                  PORTAL
                </span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Ubah judul pembuka, tema warna, animasi logo, indikator progres, dan durasi transisi loading
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenPageLoaderSettings}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 flex-shrink-0"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Edit Loader</span>
          </button>
        </div>
      )}

      {/* 1. Theme Selection */}
      <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 shadow-sm space-y-3">
        <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-emerald-400" /> Tema Warna Kartu Madrasah
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {Object.entries(THEME_CONFIGS).map(([key, t]) => {
            const isSelected = config.theme === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleUpdate('theme', key as CardTheme)}
                className={`p-2.5 rounded-xl border text-left transition relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-400 bg-slate-700/90 ring-2 ring-emerald-500/50'
                    : 'border-slate-700 bg-slate-900/60 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <div
                    className="w-4 h-4 rounded-full border border-white/40 shadow-xs flex-shrink-0"
                    style={{ backgroundColor: t.primaryHex }}
                  />
                  <div
                    className="w-3 h-3 rounded-full border border-white/40 -ml-2 shadow-xs flex-shrink-0"
                    style={{ backgroundColor: t.secondaryHex }}
                  />
                  <span className="text-[10px] font-bold text-slate-200 truncate">{t.name}</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium self-start">
                  {t.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Orientation & Layout */}
      <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 shadow-sm space-y-3">
        <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
          <Layout className="w-3.5 h-3.5 text-emerald-400" /> Orientasi & Bentuk Kartu
        </label>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleUpdate('orientation', 'landscape' as CardOrientation)}
            className={`p-3 rounded-xl border flex items-center gap-3 transition ${
              config.orientation === 'landscape'
                ? 'border-emerald-500 bg-emerald-950/40 text-white'
                : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="w-10 h-6 rounded border-2 border-current bg-current/10 flex-shrink-0" />
            <div className="text-left">
              <p className="text-xs font-bold">Landscape (Mendatar)</p>
              <p className="text-[10px] text-slate-400">Standar ID Card CR80</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleUpdate('orientation', 'portrait' as CardOrientation)}
            className={`p-3 rounded-xl border flex items-center gap-3 transition ${
              config.orientation === 'portrait'
                ? 'border-emerald-500 bg-emerald-950/40 text-white'
                : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="w-6 h-10 rounded border-2 border-current bg-current/10 flex-shrink-0" />
            <div className="text-left">
              <p className="text-xs font-bold">Portrait (Tegak)</p>
              <p className="text-[10px] text-slate-400">Format Gantung / Lanyard</p>
            </div>
          </button>
        </div>

        {/* Watermark Pattern Selection */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Pola Watermark / Pengaman Kartu
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'islamic-star', label: 'Bintang 8 (Islami)' },
              { id: 'guilloche', label: 'Guilloche Security' },
              { id: 'batik-kemenag', label: 'Motif Batik' },
              { id: 'none', label: 'Polos / Tanpa Pola' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleUpdate('watermark', p.id as WatermarkPattern)}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition ${
                  config.watermark === p.id
                    ? 'border-emerald-500 bg-emerald-900/30 text-emerald-300'
                    : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2.5. PENGATURAN FITUR AKTIFKAN / NONAKTIFKAN LOGO KOP KARTU */}
      <div className="bg-slate-800/80 p-4 sm:p-5 rounded-xl border border-emerald-500/40 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-700">
          <div>
            <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" /> Fitur Aktifkan & Nonaktifkan Logo Kop Kartu
            </label>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Atur status aktif atau nonaktif untuk logo sisi kiri dan logo sisi kanan header kartu pelajar.
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
              isLeftActive && isRightActive
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                : isLeftActive || isRightActive
                ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-700'
            }`}>
              {isLeftActive && isRightActive
                ? '2 Logo Aktif'
                : isLeftActive
                ? 'Hanya Logo Kiri'
                : isRightActive
                ? 'Hanya Logo Kanan'
                : 'Semua Logo Nonaktif'}
            </span>
          </div>
        </div>

        {/* DUA SAKELAR UTAMA: LOGO KIRI & LOGO KANAN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* SAKELAR 1: LOGO SISI KIRI */}
          <div className={`p-3.5 rounded-xl border transition flex flex-col justify-between space-y-3 ${
            isLeftActive
              ? 'bg-slate-900/90 border-emerald-500/60 shadow-sm ring-1 ring-emerald-500/30'
              : 'bg-slate-950/70 border-slate-800 opacity-80'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">👈</span>
                <div>
                  <span className="text-xs font-bold text-white block">Logo Sisi Kiri</span>
                  <span className="text-[10px] text-slate-400 block">Kemenag / Instansi Resmi</span>
                </div>
              </div>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                isLeftActive
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {isLeftActive ? '● AKTIF' : '○ NONAKTIF'}
              </span>
            </div>

            {/* Tombol Toggle Aktifkan / Nonaktifkan */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const nextLeft = !isLeftActive;
                  const nextRight = isRightActive;
                  const nextMode = nextLeft && nextRight ? 'both' : nextLeft ? 'left_only' : nextRight ? 'right_only' : 'none';
                  onChange({
                    ...config,
                    showKemenagLogo: nextLeft,
                    showMadrasahLogo: nextRight,
                    logoMode: nextMode,
                  });
                }}
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  isLeftActive
                    ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                }`}
              >
                {isLeftActive ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                    <span>✕ Nonaktifkan Logo Kiri</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-emerald-200" />
                    <span>✓ Aktifkan Logo Kiri</span>
                  </>
                )}
              </button>
            </div>

            {/* Jika Logo Kiri Aktif dan Logo Kanan Mati, beri opsi gambar */}
            {isLeftActive && !isRightActive && (
              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <span className="text-[10px] font-bold text-amber-300 block">Gambar Logo Kiri:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onChange({ ...config, singleLogoSource: 'kemenag' })}
                    className={`px-2 py-1 rounded text-[10px] font-semibold border text-center transition ${
                      (config.singleLogoSource || 'kemenag') === 'kemenag'
                        ? 'bg-amber-500/20 text-amber-200 border-amber-400 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    🟢 Kemenag
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...config, singleLogoSource: 'madrasah' })}
                    className={`px-2 py-1 rounded text-[10px] font-semibold border text-center transition ${
                      config.singleLogoSource === 'madrasah'
                        ? 'bg-amber-500/20 text-amber-200 border-amber-400 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    🏫 Madrasah
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SAKELAR 2: LOGO SISI KANAN */}
          <div className={`p-3.5 rounded-xl border transition flex flex-col justify-between space-y-3 ${
            isRightActive
              ? 'bg-slate-900/90 border-emerald-500/60 shadow-sm ring-1 ring-emerald-500/30'
              : 'bg-slate-950/70 border-slate-800 opacity-80'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">👉</span>
                <div>
                  <span className="text-xs font-bold text-white block">Logo Sisi Kanan</span>
                  <span className="text-[10px] text-slate-400 block">Madrasah / Sekolah</span>
                </div>
              </div>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                isRightActive
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {isRightActive ? '● AKTIF' : '○ NONAKTIF'}
              </span>
            </div>

            {/* Tombol Toggle Aktifkan / Nonaktifkan */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const nextLeft = isLeftActive;
                  const nextRight = !isRightActive;
                  const nextMode = nextLeft && nextRight ? 'both' : nextLeft ? 'left_only' : nextRight ? 'right_only' : 'none';
                  onChange({
                    ...config,
                    showKemenagLogo: nextLeft,
                    showMadrasahLogo: nextRight,
                    logoMode: nextMode,
                  });
                }}
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  isRightActive
                    ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                }`}
              >
                {isRightActive ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                    <span>✕ Nonaktifkan Logo Kanan</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-emerald-200" />
                    <span>✓ Aktifkan Logo Kanan</span>
                  </>
                )}
              </button>
            </div>

            {/* Jika Logo Kanan Aktif dan Logo Kiri Mati, beri opsi gambar */}
            {isRightActive && !isLeftActive && (
              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <span className="text-[10px] font-bold text-amber-300 block">Gambar Logo Kanan:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onChange({ ...config, singleLogoSource: 'madrasah' })}
                    className={`px-2 py-1 rounded text-[10px] font-semibold border text-center transition ${
                      (config.singleLogoSource || 'madrasah') === 'madrasah'
                        ? 'bg-amber-500/20 text-amber-200 border-amber-400 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    🏫 Madrasah
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...config, singleLogoSource: 'kemenag' })}
                    className={`px-2 py-1 rounded text-[10px] font-semibold border text-center transition ${
                      config.singleLogoSource === 'kemenag'
                        ? 'bg-amber-500/20 text-amber-200 border-amber-400 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    🟢 Kemenag
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PRESET KOMBINASI CEPAT 4 PILIHAN */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
            <span>⚡</span> Pintasan Cepat Kombinasi Logo:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              {
                mode: 'both' as const,
                title: '2 Logo Aktif',
                subtitle: 'Kiri & Kanan',
                icon: '🌟',
                kemenag: true,
                madrasah: true,
                activeCheck: isLeftActive && isRightActive,
              },
              {
                mode: 'left_only' as const,
                title: 'Hanya Kiri',
                subtitle: 'Kanan Nonaktif',
                icon: '👈',
                kemenag: true,
                madrasah: false,
                activeCheck: isLeftActive && !isRightActive,
              },
              {
                mode: 'right_only' as const,
                title: 'Hanya Kanan',
                subtitle: 'Kiri Nonaktif',
                icon: '👉',
                kemenag: false,
                madrasah: true,
                activeCheck: !isLeftActive && isRightActive,
              },
              {
                mode: 'none' as const,
                title: 'Nonaktif Semua',
                subtitle: 'Polos Teks Saja',
                icon: '⚪',
                kemenag: false,
                madrasah: false,
                activeCheck: !isLeftActive && !isRightActive,
              },
            ].map((item) => {
              const isSelected = item.activeCheck;

              return (
                <button
                  key={item.mode}
                  type="button"
                  onClick={() => {
                    onChange({
                      ...config,
                      logoMode: item.mode,
                      showKemenagLogo: item.kemenag,
                      showMadrasahLogo: item.madrasah,
                    });
                  }}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-400 bg-emerald-950/80 ring-2 ring-emerald-500/50 text-white shadow-sm'
                      : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-xs font-bold text-slate-200">{item.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {item.subtitle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2.6. PENGATURAN NAMA KEMENTERIAN / INSTANSI INDUK DI KOP */}
      <div className="bg-slate-800/80 p-4 sm:p-5 rounded-xl border border-amber-500/40 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-700">
          <div>
            <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" /> Tampilkan Nama Kementerian / Instansi Induk (Baris 1)
            </label>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Atur keterlihatan baris kementerian (contoh: <em>KEMENTERIAN AGAMA REPUBLIK INDONESIA</em>) pada Kop Kartu Pelajar dan Kop Surat Keterangan Aktif.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
              (config.showNamaKementerian ?? true)
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-700'
            }`}>
              Kartu: {(config.showNamaKementerian ?? true) ? '● AKTIF' : '○ NONAKTIF'}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
              (config.showNamaKementerianSurat ?? true)
                ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-700'
            }`}>
              Surat: {(config.showNamaKementerianSurat ?? true) ? '● AKTIF' : '○ NONAKTIF'}
            </span>
          </div>
        </div>

        {/* DUA KOTAK SAKELAR: KARTU DAN SURAT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* SAKELAR 1: KOP KARTU */}
          <div className={`p-3.5 rounded-xl border transition flex flex-col justify-between space-y-3 ${
            (config.showNamaKementerian ?? true)
              ? 'bg-slate-900/90 border-emerald-500/60 shadow-sm ring-1 ring-emerald-500/30'
              : 'bg-slate-950/70 border-slate-800 opacity-80'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-xs font-bold text-white block">Kop Kartu Pelajar</span>
                  <span className="text-[10px] text-slate-400 block">Baris 1 di atas Nama Madrasah</span>
                </div>
              </div>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                (config.showNamaKementerian ?? true)
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {(config.showNamaKementerian ?? true) ? '● AKTIF' : '○ NONAKTIF'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleUpdate('showNamaKementerian', !(config.showNamaKementerian ?? true))}
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                (config.showNamaKementerian ?? true)
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              {(config.showNamaKementerian ?? true) ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Aktif di Kartu (Klik Sembunyikan)</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  <span>Nonaktif di Kartu (Klik Tampilkan)</span>
                </>
              )}
            </button>
          </div>

          {/* SAKELAR 2: KOP SURAT KETERANGAN */}
          <div className={`p-3.5 rounded-xl border transition flex flex-col justify-between space-y-3 ${
            (config.showNamaKementerianSurat ?? true)
              ? 'bg-slate-900/90 border-amber-500/60 shadow-sm ring-1 ring-amber-500/30'
              : 'bg-slate-950/70 border-slate-800 opacity-80'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-xs font-bold text-white block">Kop Surat Keterangan</span>
                  <span className="text-[10px] text-slate-400 block">Baris 1 di atas Kantor Kemenag</span>
                </div>
              </div>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                (config.showNamaKementerianSurat ?? true)
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {(config.showNamaKementerianSurat ?? true) ? '● AKTIF' : '○ NONAKTIF'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleUpdate('showNamaKementerianSurat', !(config.showNamaKementerianSurat ?? true))}
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                (config.showNamaKementerianSurat ?? true)
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              {(config.showNamaKementerianSurat ?? true) ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-200" />
                  <span>Aktif di Surat (Klik Sembunyikan)</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  <span>Nonaktif di Surat (Klik Tampilkan)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Barcode & QR Code Config */}
      <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 shadow-sm space-y-3">
        <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
          <QrCode className="w-3.5 h-3.5 text-emerald-400" /> Pengaturan Barcode & QR Code
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Barcode toggle & source */}
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">Barcode Sisi Depan</span>
              <input
                type="checkbox"
                checked={config.showBarcode}
                onChange={(e) => handleUpdate('showBarcode', e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded bg-slate-800 border-slate-700 focus:ring-emerald-500"
              />
            </div>
            {config.showBarcode && (
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Nilai Data Barcode:</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdate('barcodeType', 'nisn')}
                    className={`flex-1 py-1 text-xs rounded border ${
                      config.barcodeType === 'nisn'
                        ? 'border-emerald-500 bg-emerald-900/40 text-emerald-300 font-bold'
                        : 'border-slate-700 bg-slate-800 text-slate-400'
                    }`}
                  >
                    Gunakan NISN
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdate('barcodeType', 'nis')}
                    className={`flex-1 py-1 text-xs rounded border ${
                      config.barcodeType === 'nis'
                        ? 'border-emerald-500 bg-emerald-900/40 text-emerald-300 font-bold'
                        : 'border-slate-700 bg-slate-800 text-slate-400'
                    }`}
                  >
                    Gunakan NIS
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* QR Code toggle & source */}
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">QR Code Verifikasi</span>
              <input
                type="checkbox"
                checked={config.showQrCode}
                onChange={(e) => handleUpdate('showQrCode', e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded bg-slate-800 border-slate-700 focus:ring-emerald-500"
              />
            </div>
            {config.showQrCode && (
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Konten QR Code:</label>
                <select
                  value={config.qrContent}
                  onChange={(e) => handleUpdate('qrContent', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                >
                  <option value="verification_url">Link Verifikasi EMIS Kemenag</option>
                  <option value="nisn">Nomor NISN Siswa</option>
                  <option value="vcard">vCard Kontak Siswa & Madrasah</option>
                  <option value="nis">Nomor Induk Siswa (NIS)</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Back Content Presets */}
      <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 shadow-sm space-y-3">
        <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-emerald-400" /> Teks Sisi Belakang Kartu
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(BACK_CONTENT_PRESETS).map(([key, item]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleUpdate('backContentPreset', key as BackContentPreset)}
              className={`p-2 rounded-lg text-xs font-semibold border text-left transition ${
                config.backContentPreset === key
                  ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                  : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.title.split(' ')[0]} {item.title.split(' ')[1]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleUpdate('backContentPreset', 'custom')}
            className={`p-2 rounded-lg text-xs font-semibold border text-left transition ${
              config.backContentPreset === 'custom'
                ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            ✏️ Kustom Teks Sendiri
          </button>
        </div>

        {/* If custom is selected */}
        {config.backContentPreset === 'custom' && (
          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-700 space-y-2 mt-2">
            <div>
              <label className="block text-[11px] text-slate-300 font-semibold mb-1">Judul Belakang:</label>
              <input
                type="text"
                value={config.customBackTitle}
                onChange={(e) => handleUpdate('customBackTitle', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] text-slate-300 font-semibold">Poin Aturan / Catatan:</label>
              {config.customBackNotes.map((note, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-bold w-4">{idx + 1}.</span>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => handleUpdateCustomNote(idx, e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomNote(idx)}
                    className="text-rose-400 hover:text-rose-300 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddCustomNote}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 mt-1 font-semibold"
              >
                <Plus className="w-3 h-3" /> Tambah Poin Catatan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Fine-grained Element Visibility Toggles */}
      <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 shadow-sm space-y-3">
        <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-emerald-400" /> Tampilkan / Sembunyikan Elemen
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 text-xs text-slate-300">
          <label className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-900">
            <input
              type="checkbox"
              checked={config.showNamaKementerian ?? true}
              onChange={(e) => handleUpdate('showNamaKementerian', e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded bg-slate-800 border-slate-700 focus:ring-emerald-500"
            />
            <span className="font-medium text-amber-200">Kementerian (Kartu)</span>
          </label>

          <label className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-900">
            <input
              type="checkbox"
              checked={config.showNamaKementerianSurat ?? true}
              onChange={(e) => handleUpdate('showNamaKementerianSurat', e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded bg-slate-800 border-slate-700 focus:ring-emerald-500"
            />
            <span className="font-medium text-amber-300">Kementerian (Surat)</span>
          </label>

          <label className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-900">
            <input
              type="checkbox"
              checked={config.showHologram}
              onChange={(e) => handleUpdate('showHologram', e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded bg-slate-800 border-slate-700 focus:ring-emerald-500"
            />
            <span>Stiker Hologram</span>
          </label>

          <label className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-900">
            <input
              type="checkbox"
              checked={config.showStamp}
              onChange={(e) => handleUpdate('showStamp', e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded bg-slate-800 border-slate-700 focus:ring-emerald-500"
            />
            <span>Stempel Cap Basah</span>
          </label>

          <label className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-900">
            <input
              type="checkbox"
              checked={config.showSignature}
              onChange={(e) => handleUpdate('showSignature', e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded bg-slate-800 border-slate-700 focus:ring-emerald-500"
            />
            <span>Tanda Tangan Kepala</span>
          </label>

          <label className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-900">
            <input
              type="checkbox"
              checked={config.showBloodType}
              onChange={(e) => handleUpdate('showBloodType', e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded bg-slate-800 border-slate-700 focus:ring-emerald-500"
            />
            <span>Golongan Darah</span>
          </label>

          <label className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-900">
            <input
              type="checkbox"
              checked={config.showAddress}
              onChange={(e) => handleUpdate('showAddress', e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded bg-slate-800 border-slate-700 focus:ring-emerald-500"
            />
            <span>Alamat Domisili</span>
          </label>

          <label className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-900">
            <input
              type="checkbox"
              checked={config.showExpiryDate}
              onChange={(e) => handleUpdate('showExpiryDate', e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded bg-slate-800 border-slate-700 focus:ring-emerald-500"
            />
            <span>Masa Berlaku</span>
          </label>
        </div>
      </div>
    </div>
  );
};
