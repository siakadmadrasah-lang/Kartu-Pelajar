import React, { useRef, useState } from 'react';
import { PageLoaderConfig, MadrasahInfo, LoaderTheme, LoaderLogoType, LoaderAnimation } from '../types';
import { 
  Layers, 
  Sliders, 
  Upload, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  Sparkles, 
  Save, 
  Play, 
  School, 
  ShieldCheck, 
  Palette, 
  Eye, 
  RotateCcw
} from 'lucide-react';
import { KemenagLogo, MadrasahLogo } from './Logos';
import { LOADER_THEMES } from './PageLoader';
import { processPageLoaderLogoUpload } from '../utils/imageUtils';
import { INITIAL_LOADER_CONFIG } from '../constants/initialData';

interface PageLoaderManagerProps {
  loaderConfig?: PageLoaderConfig;
  onLoaderConfigChange?: (updated: PageLoaderConfig) => void;
  madrasah: MadrasahInfo;
  onOpenPageLoaderSettings?: () => void;
}

export const PageLoaderManager: React.FC<PageLoaderManagerProps> = ({
  loaderConfig = INITIAL_LOADER_CONFIG,
  onLoaderConfigChange,
  madrasah,
  onOpenPageLoaderSettings,
}) => {
  const logoFileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [previewProgress, setPreviewProgress] = useState(76);

  const currentConfig: PageLoaderConfig = loaderConfig || INITIAL_LOADER_CONFIG;
  const currentTheme = LOADER_THEMES[currentConfig.theme] || LOADER_THEMES['dark-emerald'];

  const handleUpdate = <K extends keyof PageLoaderConfig>(key: K, value: PageLoaderConfig[K]) => {
    if (!onLoaderConfigChange) return;
    const updated: PageLoaderConfig = {
      ...currentConfig,
      [key]: value,
    };
    onLoaderConfigChange(updated);
  };

  const handleCustomLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onLoaderConfigChange) return;

    try {
      setUploading(true);
      const transparentDataUrl = await processPageLoaderLogoUpload(file);
      const updated: PageLoaderConfig = {
        ...currentConfig,
        logoType: 'custom',
        customLogoUrl: transparentDataUrl,
      };
      onLoaderConfigChange(updated);
      setSaveFeedback('✓ Logo Kustom Page Loader Transparan Berhasil Diunggah!');
      setTimeout(() => setSaveFeedback(null), 3500);
    } catch (err) {
      console.error('Error uploading page loader logo:', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = () => {
    if (onLoaderConfigChange) {
      onLoaderConfigChange(currentConfig);
    }
    setSaveFeedback('✓ Seluruh Pengaturan Page Loader Berhasil Disimpan!');
    setTimeout(() => setSaveFeedback(null), 3500);
  };

  const handleResetToDefault = () => {
    if (!onLoaderConfigChange) return;
    if (confirm('Kembalikan logo & tema Page Loader ke standar Kementerian Agama RI?')) {
      onLoaderConfigChange({
        ...INITIAL_LOADER_CONFIG,
      });
      setSaveFeedback('✓ Page Loader Berhasil Direset ke Default!');
      setTimeout(() => setSaveFeedback(null), 3500);
    }
  };

  // Resolve logo source for preview
  const getPreviewLogo = () => {
    if (currentConfig.logoType === 'custom' && currentConfig.customLogoUrl) {
      return (
        <img
          src={currentConfig.customLogoUrl}
          alt="Custom Logo"
          className="w-16 h-16 object-contain filter drop-shadow"
        />
      );
    }
    if (currentConfig.logoType === 'madrasah') {
      return madrasah.logoMadrasahUrl ? (
        <img
          src={madrasah.logoMadrasahUrl}
          alt="Logo Madrasah"
          className="w-16 h-16 object-contain filter drop-shadow"
        />
      ) : (
        <MadrasahLogo className="w-16 h-16" />
      );
    }
    if (currentConfig.logoType === 'none') {
      return <School className="w-12 h-12 text-amber-400 opacity-80" />;
    }
    return <KemenagLogo className="w-16 h-16" />;
  };

  return (
    <div className="space-y-5">
      {/* TOP HEADER SECTION */}
      <div className="bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-900 p-5 rounded-2xl border border-emerald-500/40 space-y-4 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-700/80">
          <div>
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Modul Logo & Animasi Page Loader (Splash Screen Pembuka)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Modul mandiri untuk mengelola layar sambutan pembuka aplikasi (Splash Screen): logo tengah bercahaya, animasi putar, palet tema warna, dan progress bar.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onOpenPageLoaderSettings && (
              <button
                type="button"
                onClick={onOpenPageLoaderSettings}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-sm cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Modal Full Kustomisasi</span>
              </button>
            )}
            <span className="text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Modul Splash Mandiri</span>
            </span>
          </div>
        </div>

        {/* TOP TOGGLE: ENABLE / DISABLE LOADER */}
        <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Status Layar Pembuka (Splash Loader)</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                currentConfig.enabled !== false
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}>
                {currentConfig.enabled !== false ? 'AKTIF' : 'NONAKTIF'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Jika aktif, aplikasi akan menampilkan animasi splash screen megah saat pertama kali dibuka.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleUpdate('enabled', !(currentConfig.enabled !== false))}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 cursor-pointer ${
              currentConfig.enabled !== false
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${currentConfig.enabled !== false ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-500'}`} />
            <span>{currentConfig.enabled !== false ? 'Splash Loader: AKTIF' : 'Splash Loader: DIMATIKAN'}</span>
          </button>
        </div>

        {/* TWO-COLUMN LAYOUT: PREVIEW & CONTROLS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
          {/* LEFT: MINIATURE LIVE SPLASH PREVIEW */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                Live Pratinjau Splash Screen
              </span>
              <span className="text-[10px] text-amber-300 font-mono">
                {currentTheme.name}
              </span>
            </div>

            {/* Simulated Miniature Splash Window */}
            <div className={`relative h-72 rounded-2xl border border-slate-700/80 overflow-hidden shadow-2xl flex flex-col items-center justify-center p-6 text-center ${currentTheme.bg}`}>
              {/* Radial Glow */}
              <div className={`absolute w-44 h-44 rounded-full blur-3xl opacity-60 pointer-events-none ${currentTheme.radialGlow}`} />

              {/* Central Logo Container with Outer Glow Ring */}
              <div className="relative z-10 flex flex-col items-center">
                <div className={`relative p-1 rounded-3xl bg-gradient-to-tr ${currentTheme.ringGradient} shadow-2xl shadow-emerald-950/60`}>
                  <div 
                    className={`w-24 h-24 rounded-[22px] bg-gradient-to-b ${currentTheme.logoContainer} flex items-center justify-center p-3.5 border shadow-inner`}
                    style={{
                      backgroundImage: `linear-gradient(45deg, #1e293b 25%, transparent 25%), 
                                        linear-gradient(-45deg, #1e293b 25%, transparent 25%), 
                                        linear-gradient(45deg, transparent 75%, #1e293b 75%), 
                                        linear-gradient(-45deg, transparent 75%, #1e293b 75%)`,
                      backgroundSize: '6px 6px',
                      backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
                    }}
                  >
                    {getPreviewLogo()}
                  </div>
                </div>

                {/* Subtitle / Title simulation */}
                <div className="mt-3 space-y-1">
                  <h4 className="text-xs font-black text-white tracking-wide uppercase">
                    {currentConfig.title || madrasah.judulHeaderAplikasi || 'KARTU PELAJAR DIGITAL'}
                  </h4>
                  <p className="text-[10px] text-slate-300/80 font-medium">
                    {currentConfig.subtitle || madrasah.namaMadrasah || "MI MA'ARIF NU 2 SANGGREMAN"}
                  </p>
                </div>

                {/* Simulated Progress Bar */}
                <div className="w-48 mt-3 space-y-1">
                  <div className="h-1.5 w-full bg-slate-800/90 rounded-full overflow-hidden border border-slate-700/60 p-0.5">
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r ${currentTheme.progressBar} transition-all duration-300`}
                      style={{ width: `${previewProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                    <span>MEMUAT DATABASE...</span>
                    <span>{previewProgress}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Progress Slider for Testing */}
            <div className="flex items-center gap-2 p-2 bg-slate-950/70 rounded-xl border border-slate-800 text-[10px]">
              <span className="text-slate-400 font-mono">Test Progress:</span>
              <input
                type="range"
                min="10"
                max="100"
                value={previewProgress}
                onChange={(e) => setPreviewProgress(Number(e.target.value))}
                className="flex-1 accent-emerald-500 cursor-pointer"
              />
              <span className="text-emerald-400 font-bold font-mono">{previewProgress}%</span>
            </div>
          </div>

          {/* RIGHT: LOGO SELECTION & CUSTOM UPLOADER */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <label className="block text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2">
                1. Pilih Sumber Logo Page Loader
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Option: Kemenag */}
                <button
                  type="button"
                  onClick={() => handleUpdate('logoType', 'kemenag')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                    currentConfig.logoType === 'kemenag'
                      ? 'bg-emerald-500/20 border-emerald-400 ring-1 ring-emerald-400/50'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center flex-shrink-0">
                    <KemenagLogo className="w-8 h-8" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-white block truncate">Logo Kemenag RI</span>
                    <span className="text-[10px] text-slate-400 block">Bawaan Resmi Kemenag</span>
                  </div>
                </button>

                {/* Option: Madrasah */}
                <button
                  type="button"
                  onClick={() => handleUpdate('logoType', 'madrasah')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                    currentConfig.logoType === 'madrasah'
                      ? 'bg-emerald-500/20 border-emerald-400 ring-1 ring-emerald-400/50'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center flex-shrink-0">
                    {madrasah.logoMadrasahUrl ? (
                      <img src={madrasah.logoMadrasahUrl} alt="Logo MI" className="w-8 h-8 object-contain" />
                    ) : (
                      <MadrasahLogo className="w-8 h-8" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-white block truncate">Logo Profil MI</span>
                    <span className="text-[10px] text-slate-400 block">Sesuai Profil Madrasah</span>
                  </div>
                </button>

                {/* Option: Custom Logo */}
                <button
                  type="button"
                  onClick={() => handleUpdate('logoType', 'custom')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                    currentConfig.logoType === 'custom'
                      ? 'bg-emerald-500/20 border-emerald-400 ring-1 ring-emerald-400/50'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center flex-shrink-0">
                    {currentConfig.customLogoUrl ? (
                      <img src={currentConfig.customLogoUrl} alt="Logo Kustom" className="w-8 h-8 object-contain" />
                    ) : (
                      <Upload className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-white block truncate">Logo Kustom Transparan</span>
                    <span className="text-[10px] text-slate-400 block">Upload File Khusus</span>
                  </div>
                </button>

                {/* Option: None / Minimalist */}
                <button
                  type="button"
                  onClick={() => handleUpdate('logoType', 'none')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                    currentConfig.logoType === 'none'
                      ? 'bg-emerald-500/20 border-emerald-400 ring-1 ring-emerald-400/50'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center flex-shrink-0">
                    <School className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-white block truncate">Tanpa Logo (Ikon Saja)</span>
                    <span className="text-[10px] text-slate-400 block">Tampilan Minimalis</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Custom Logo Uploader Box */}
            {currentConfig.logoType === 'custom' && (
              <div className="p-4 bg-slate-950/80 rounded-xl border border-amber-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    Unggah Logo Kustom Khusus Page Loader
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">Auto Transparan PNG</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Sistem otomatis menghapus background putih menjadi PNG transparan dengan resolusi tajam maksimal 512x512px.
                </p>

                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={logoFileRef}
                    onChange={handleCustomLogoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => logoFileRef.current?.click()}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Memproses Transparan...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Pilih Gambar Logo</span>
                      </>
                    )}
                  </button>

                  {currentConfig.customLogoUrl && (
                    <button
                      type="button"
                      onClick={() => handleUpdate('customLogoUrl', '')}
                      className="px-3 py-2 bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 text-xs rounded-xl border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Logo Kustom</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Quick Themes */}
            <div>
              <label className="block text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2">
                2. Tema Warna Splash Screen
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(LOADER_THEMES) as LoaderTheme[]).map((themeKey) => {
                  const theme = LOADER_THEMES[themeKey];
                  const isSelected = currentConfig.theme === themeKey;
                  return (
                    <button
                      key={themeKey}
                      type="button"
                      onClick={() => handleUpdate('theme', themeKey)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-400 ring-1 ring-emerald-400/50'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-white truncate">{theme.name}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                      </div>
                      <div className={`h-2 rounded-full w-full bg-gradient-to-r ${theme.progressBar}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Animations */}
            <div>
              <label className="block text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2">
                3. Efek Animasi Logo Tengah
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { key: 'spin-glow', label: 'Putar Berkilau' },
                  { key: 'bounce-soft', label: 'Denyut Lembut' },
                  { key: 'glow-pulse', label: 'Cahaya Berkedip' },
                  { key: 'float', label: 'Melayang Tenang' },
                  { key: 'none', label: 'Diam Statis' },
                ].map((anim) => {
                  const isSelected = currentConfig.logoAnimation === anim.key;
                  return (
                    <button
                      key={anim.key}
                      type="button"
                      onClick={() => handleUpdate('logoAnimation', anim.key as LoaderAnimation)}
                      className={`p-2 rounded-xl border text-center transition cursor-pointer text-xs font-semibold ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {anim.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTIONS BAR */}
        <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-700/80">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Standar Kemenag</span>
            </button>

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
            className="px-5 py-2.5 text-xs font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl flex items-center gap-2 shadow-lg transition active:scale-95 cursor-pointer ml-auto"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Pengaturan Page Loader</span>
          </button>
        </div>
      </div>
    </div>
  );
};
