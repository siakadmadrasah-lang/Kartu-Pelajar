import React, { useState, useEffect, useRef } from 'react';
import { 
  PageLoaderConfig, 
  LoaderTheme, 
  LoaderLogoType, 
  LoaderAnimation, 
  MadrasahInfo 
} from '../types';
import { INITIAL_LOADER_CONFIG } from '../constants/initialData';
import { LOADER_THEMES, InitialPageLoader } from './PageLoader';
import { compressImage, processPageLoaderLogoUpload, makeLogoTransparent } from '../utils/imageUtils';
import { 
  Sparkles, 
  X, 
  Save, 
  RotateCcw, 
  Play, 
  Sliders, 
  Type, 
  Palette, 
  Image as ImageIcon, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Eye, 
  Upload, 
  Maximize2,
  Trash2,
  Loader2,
  School,
  ShieldCheck,
  RefreshCw,
  FolderHeart,
  Wand2
} from 'lucide-react';

interface PageLoaderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PageLoaderConfig;
  onSave: (updated: PageLoaderConfig) => void;
  madrasah: MadrasahInfo;
}

export const PageLoaderSettingsModal: React.FC<PageLoaderSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  madrasah,
}) => {
  const [formData, setFormData] = useState<PageLoaderConfig>(config || INITIAL_LOADER_CONFIG);
  const [activeTab, setActiveTab] = useState<'text' | 'visual' | 'timing'>('text');
  
  // Interactive Simulation State in Modal Preview
  const [previewProgress, setPreviewProgress] = useState<number>(100);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const [isFullscreenTesting, setIsFullscreenTesting] = useState<boolean>(false);
  const [fullscreenProgress, setFullscreenProgress] = useState<number>(15);

  const [isUploadingCustomLogo, setIsUploadingCustomLogo] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const customLogoInputRef = useRef<HTMLInputElement>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(config || INITIAL_LOADER_CONFIG);
      setPreviewProgress(100);
      setIsPlayingPreview(false);
      setIsFullscreenTesting(false);
    }
  }, [isOpen, config]);

  // Preview Playback Simulator
  useEffect(() => {
    let interval: any;
    if (isPlayingPreview) {
      setPreviewProgress(10);
      let p = 10;
      const duration = formData.loadingDurationMs || 1200;
      const stepInterval = Math.max(20, duration / 50);

      interval = setInterval(() => {
        p += 2;
        if (p >= 100) {
          p = 100;
          setPreviewProgress(100);
          setIsPlayingPreview(false);
          clearInterval(interval);
        } else {
          setPreviewProgress(p);
        }
      }, stepInterval);
    }
    return () => clearInterval(interval);
  }, [isPlayingPreview, formData.loadingDurationMs]);

  // Fullscreen Testing Simulator
  useEffect(() => {
    let timer1: any, timer2: any, timer3: any, timer4: any;
    if (isFullscreenTesting) {
      const dur = formData.loadingDurationMs || 1200;
      setFullscreenProgress(15);

      timer1 = setTimeout(() => {
        setFullscreenProgress(45);
      }, dur * 0.25);

      timer2 = setTimeout(() => {
        setFullscreenProgress(80);
      }, dur * 0.6);

      timer3 = setTimeout(() => {
        setFullscreenProgress(100);
      }, dur * 0.9);

      timer4 = setTimeout(() => {
        setIsFullscreenTesting(false);
      }, dur + 400);
    }
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [isFullscreenTesting, formData.loadingDurationMs]);

  const handleUpdate = <K extends keyof PageLoaderConfig>(key: K, value: PageLoaderConfig[K]) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleChecklistChange = (index: 0 | 1 | 2, text: string) => {
    const updated: [string, string, string] = [...formData.checklistItems] as [string, string, string];
    updated[index] = text;
    handleUpdate('checklistItems', updated);
  };

  const [isProcessingTransparency, setIsProcessingTransparency] = useState<boolean>(false);

  const processLogoFile = async (file: File) => {
    if (!file) return;
    try {
      setIsUploadingCustomLogo(true);
      // Automatically detect and remove background (white, off-white, light gray or solid) -> transparent PNG
      const transparentDataUrl = await processPageLoaderLogoUpload(file);
      handleUpdate('customLogoUrl', transparentDataUrl);
      handleUpdate('logoType', 'custom');
    } catch (err) {
      console.warn('Error processing transparent logo, falling back to direct compression:', err);
      try {
        const optimizedDataUrl = await compressImage(file, {
          maxWidth: 512,
          maxHeight: 512,
          quality: 0.95,
          mimeType: 'image/png',
        });
        handleUpdate('customLogoUrl', optimizedDataUrl);
        handleUpdate('logoType', 'custom');
      } catch {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            handleUpdate('customLogoUrl', reader.result);
            handleUpdate('logoType', 'custom');
          }
        };
        reader.readAsDataURL(file);
      }
    } finally {
      setIsUploadingCustomLogo(false);
    }
  };

  const handleMakeCustomLogoTransparent = async () => {
    if (!formData.customLogoUrl) return;
    try {
      setIsProcessingTransparency(true);
      const transparentDataUrl = await makeLogoTransparent(formData.customLogoUrl, {
        tolerance: 40,
        feather: 14,
        autoCrop: true
      });
      if (transparentDataUrl) {
        handleUpdate('customLogoUrl', transparentDataUrl);
      }
    } catch (err) {
      console.error('Failed to make logo transparent:', err);
    } finally {
      setIsProcessingTransparency(false);
    }
  };

  const handleCustomLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processLogoFile(file);
      // Reset input value to allow re-uploading the same file
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processLogoFile(file);
    }
  };

  const handleUseMadrasahLogo = async () => {
    const madrasahLogo = madrasah.logoMadrasahUrl || madrasah.logoAplikasiUrl;
    if (madrasahLogo) {
      try {
        setIsUploadingCustomLogo(true);
        // Automatically make background transparent when copying from madrasah profile
        const transparentLogo = await processPageLoaderLogoUpload(madrasahLogo);
        handleUpdate('customLogoUrl', transparentLogo || madrasahLogo);
        handleUpdate('logoType', 'custom');
      } catch {
        handleUpdate('customLogoUrl', madrasahLogo);
        handleUpdate('logoType', 'custom');
      } finally {
        setIsUploadingCustomLogo(false);
      }
    } else {
      handleUpdate('logoType', 'madrasah');
    }
  };

  const handleUseKemenagLogo = () => {
    const kemenagLogo = madrasah.logoKemenagUrl;
    if (kemenagLogo) {
      handleUpdate('customLogoUrl', kemenagLogo);
      handleUpdate('logoType', 'custom');
    } else {
      handleUpdate('logoType', 'kemenag');
    }
  };

  const handleRemoveCustomLogo = () => {
    handleUpdate('customLogoUrl', '');
    handleUpdate('logoType', 'kemenag');
  };

  const handleResetToDefault = () => {
    if (confirm('Kembalikan seluruh pengaturan Page Loader ke konfigurasi awal standar Kemenag?')) {
      setFormData(INITIAL_LOADER_CONFIG);
    }
  };

  const handleApply = () => {
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto no-print">
      {/* Fullscreen Test Simulation Overlay */}
      {isFullscreenTesting && (
        <div className="fixed inset-0 z-[100]">
          <InitialPageLoader
            config={formData}
            progress={fullscreenProgress}
            madrasahLogoUrl={madrasah.logoMadrasahUrl || madrasah.logoAplikasiUrl}
          />
          <button
            onClick={() => setIsFullscreenTesting(false)}
            className="absolute top-4 right-4 z-[101] px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold border border-slate-700 backdrop-blur-sm transition"
          >
            Tutup Pratinjau (ESC)
          </button>
        </div>
      )}

      {/* Main Modal Card */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white uppercase tracking-tight">
                  Pengaturan & Edit Page Loader
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Splash Screen
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Kustomisasi teks, animasi logo, tema visual, dan durasi transisi layar pembuka
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreenTesting(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
              title="Uji Coba Layar Penuh"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Uji Layar Penuh</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700 transition"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MODAL BODY (TWO COLUMNS: FORM CONFIG & LIVE PREVIEW) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
          
          {/* LEFT COLUMN: SETTINGS TABS & FORM CONTROLS (7 COLS) */}
          <div className="lg:col-span-7 p-4 sm:p-5 space-y-4 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900/60 overflow-y-auto max-h-[68vh]">
            
            {/* Top Toggle: Enable / Disable Loader */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-white block">
                  Aktifkan Splash Page Loader
                </span>
                <span className="text-[11px] text-slate-400">
                  Tampilkan animasi loading saat portal aplikasi pertama kali dibuka
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) => handleUpdate('enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex border-b border-slate-800 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition ${
                  activeTab === 'text'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>1. Teks & Identitas</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('visual')}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition ${
                  activeTab === 'visual'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>2. Tema & Logo</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('timing')}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition ${
                  activeTab === 'timing'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>3. Durasi & Tahapan</span>
              </button>
            </div>

            {/* TAB 1: TEKS & IDENTITAS */}
            {activeTab === 'text' && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Judul Utama Splash Screen
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleUpdate('title', e.target.value)}
                    placeholder="Contoh: KARTU PELAJAR MI"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Bisa diisi nama madrasah atau judul sistem kartu pelajar
                  </span>
                </div>

                {/* Badge Text */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Label / Badge Tag
                    </label>
                    <input
                      type="text"
                      value={formData.badgeText}
                      onChange={(e) => handleUpdate('badgeText', e.target.value)}
                      placeholder="Contoh: KEMENAG RI, TERAKREDITASI A"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Preset Cepat Badge
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {['KEMENAG RI', 'EMIS 4.0', 'TERAKREDITASI A', 'MADRASAH HEBAT'].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => handleUpdate('badgeText', b)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 rounded border border-slate-700"
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Subtitle */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Deskripsi / Subtitle
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => handleUpdate('subtitle', e.target.value)}
                    placeholder="Sistem Generator & Cetak Kartu Siswa Madrasah Ibtidaiyah"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Footer Note */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Teks Footer Bawah
                  </label>
                  <input
                    type="text"
                    value={formData.footerText}
                    onChange={(e) => handleUpdate('footerText', e.target.value)}
                    placeholder="Kementerian Agama Republik Indonesia • Madrasah Mandiri Berprestasi"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* 3 Checklist Items */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                  <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    3 Butir Indikator Checklist
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Poin 1</span>
                      <input
                        type="text"
                        value={formData.checklistItems[0] || ''}
                        onChange={(e) => handleChecklistChange(0, e.target.value)}
                        placeholder="Standar CR80"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Poin 2</span>
                      <input
                        type="text"
                        value={formData.checklistItems[1] || ''}
                        onChange={(e) => handleChecklistChange(1, e.target.value)}
                        placeholder="Basis EMIS"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Poin 3</span>
                      <input
                        type="text"
                        value={formData.checklistItems[2] || ''}
                        onChange={(e) => handleChecklistChange(2, e.target.value)}
                        placeholder="Cetak PVC/A4"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: TEMA & LOGO */}
            {activeTab === 'visual' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Background Theme Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Skema Warna & Latar Belakang
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(LOADER_THEMES).map(([key, t]) => {
                      const isSelected = formData.theme === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleUpdate('theme', key as LoaderTheme)}
                          className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                            isSelected
                              ? 'border-amber-400 bg-slate-800 ring-2 ring-emerald-500/50'
                              : 'border-slate-800 bg-slate-950/80 hover:bg-slate-800/60'
                          }`}
                        >
                          <span className="text-xs font-bold text-white truncate">{t.name}</span>
                          <div className="flex items-center gap-1 mt-2">
                            <div className={`w-3.5 h-3.5 rounded-full ${t.radialGlow} border border-white/20`} />
                            <span className="text-[10px] text-slate-400 uppercase font-mono">{key}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Logo Selection & Custom Uploader */}
                <div className="bg-slate-950 p-3.5 sm:p-4 rounded-xl border border-slate-800 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                      Pilihan & Upload Logo Splash Screen
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Format: PNG / JPG / SVG / WebP
                    </span>
                  </div>

                  {/* 4 Selection Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdate('logoType', 'kemenag')}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                        formData.logoType === 'kemenag'
                          ? 'border-emerald-500 bg-emerald-950/60 text-white ring-1 ring-emerald-500/50 shadow-sm'
                          : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold block">Logo Kemenag</span>
                      <span className="text-[9px] text-slate-400">Resmi RI</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdate('logoType', 'madrasah')}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                        formData.logoType === 'madrasah'
                          ? 'border-emerald-500 bg-emerald-950/60 text-white ring-1 ring-emerald-500/50 shadow-sm'
                          : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <School className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold block">Logo Madrasah</span>
                      <span className="text-[9px] text-slate-400">Dari Profil</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdate('logoType', 'custom')}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                        formData.logoType === 'custom'
                          ? 'border-emerald-500 bg-emerald-950/60 text-white ring-1 ring-emerald-500/50 shadow-sm'
                          : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <Upload className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold block">Upload Kustom</span>
                      <span className="text-[9px] text-amber-400/80">File Gambar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdate('logoType', 'none')}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                        formData.logoType === 'none'
                          ? 'border-emerald-500 bg-emerald-950/60 text-white ring-1 ring-emerald-500/50 shadow-sm'
                          : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold block">Ikon Saja</span>
                      <span className="text-[9px] text-slate-400">Minimalis</span>
                    </button>
                  </div>

                  {/* Auto Background Transparency Option Banner */}
                  <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 flex-shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-200">Latar Belakang Transparan Otomatis</span>
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-semibold px-1.5 py-0.5 rounded border border-emerald-500/30">
                            Aktif Default
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Menghapus background putih/solid pada foto logo otomatis saat dimuat pada splash screen
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={formData.autoTransparentBg !== false}
                        onChange={(e) => {
                          const val = e.target.checked;
                          handleUpdate('autoTransparentBg', val);
                          if (val && formData.customLogoUrl) {
                            handleMakeCustomLogoTransparent();
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {/* Hidden Input for Custom Logo */}
                  <input
                    type="file"
                    ref={customLogoInputRef}
                    accept="image/*"
                    onChange={handleCustomLogoUpload}
                    className="hidden"
                  />

                  {/* CUSTOM UPLOAD / MANAGEMENT BOX */}
                  {formData.logoType === 'custom' && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-3">
                      {formData.customLogoUrl ? (
                        /* Preview & Management when custom logo is active */
                        <div className="bg-slate-900/90 rounded-xl border border-emerald-500/40 p-3.5 space-y-3 shadow-inner">
                          <div className="flex flex-col sm:flex-row items-center gap-3.5">
                            {/* Checkerboard Image Container */}
                            <div 
                              className="w-20 h-20 rounded-xl p-1.5 flex items-center justify-center border border-slate-700 shadow-md flex-shrink-0"
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
                              <img
                                src={formData.customLogoUrl}
                                alt="Custom Logo Preview"
                                className="w-16 h-16 object-contain filter drop-shadow-sm"
                              />
                            </div>

                              {/* Details & Status */}
                            <div className="flex-1 text-center sm:text-left space-y-1">
                              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                                <span className="text-xs font-bold text-white">Logo Kustom Page Loader</span>
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 font-semibold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  Aktif
                                </span>
                                <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full border border-sky-500/40 font-semibold flex items-center gap-1">
                                  <Sparkles className="w-2.5 h-2.5 text-sky-400" />
                                  Transparan Otomatis
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400">
                                Background latar belakang otomatis dipotong transparan sehingga menyatu sempurna dengan efek animasi dan tema gelap splash screen.
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800">
                            <button
                              type="button"
                              disabled={isUploadingCustomLogo}
                              onClick={() => customLogoInputRef.current?.click()}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 active:scale-95"
                            >
                              {isUploadingCustomLogo ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Mengunggah...</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>Ganti File Logo</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              disabled={isProcessingTransparency}
                              onClick={handleMakeCustomLogoTransparent}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-semibold border border-amber-500/40 transition flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                              title="Deteksi dan hapus background latar belakang gambar menjadi transparan"
                            >
                              {isProcessingTransparency ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                                  <span>Memproses Transparansi...</span>
                                </>
                              ) : (
                                <>
                                  <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Hapus Background Otomatis</span>
                                </>
                              )}
                            </button>

                            {(madrasah.logoMadrasahUrl || madrasah.logoAplikasiUrl) && (
                              <button
                                type="button"
                                onClick={handleUseMadrasahLogo}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition flex items-center gap-1.5 active:scale-95"
                                title="Salin logo madrasah dari profil dan hapus background secara otomatis"
                              >
                                <School className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Salin dari Profil</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={handleRemoveCustomLogo}
                              className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg text-xs font-medium border border-rose-500/30 transition flex items-center gap-1.5 ml-auto active:scale-95"
                              title="Hapus logo kustom dan kembalikan ke standar"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Dropzone when no custom logo is uploaded yet */
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => customLogoInputRef.current?.click()}
                          className={`p-6 rounded-xl border-2 border-dashed transition flex flex-col items-center justify-center text-center cursor-pointer ${
                            isDragOver
                              ? 'border-emerald-400 bg-emerald-950/40 ring-2 ring-emerald-500/50 scale-[1.01]'
                              : 'border-slate-700 bg-slate-900/60 hover:border-emerald-500/70 hover:bg-slate-900'
                          }`}
                        >
                          {isUploadingCustomLogo ? (
                            <div className="py-2 flex flex-col items-center space-y-2">
                              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                              <span className="text-xs font-bold text-white">Menghapus Background & Mengoptimalkan Logo...</span>
                            </div>
                          ) : (
                            <>
                              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-2.5">
                                <Upload className="w-6 h-6 text-emerald-400" />
                              </div>
                              <span className="text-xs font-bold text-white block mb-0.5">
                                Klik untuk Upload atau Tarik & Lepas Logo ke Sini
                              </span>
                              <span className="text-[11px] text-slate-400 block max-w-xs">
                                Latar belakang (background) otomatis dihapus transparan, ukuran disesuaikan secara optimal.
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* INFO BAR FOR DEFAULT LOGOS */}
                  {formData.logoType === 'madrasah' && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                      <div className="flex items-center gap-2">
                        <School className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-[11px]">
                          Menggunakan Logo Madrasah resmi dari Data Profil Madrasah.
                        </span>
                      </div>
                      {madrasah.logoMadrasahUrl && (
                        <span className="text-[10px] text-emerald-400 font-semibold">Tersedia</span>
                      )}
                    </div>
                  )}

                  {formData.logoType === 'kemenag' && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-[11px]">
                          Menggunakan Logo Resmi Kementerian Agama RI (Ikhlas Beramal).
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-semibold">Vektor Resmi</span>
                    </div>
                  )}
                </div>

                {/* Animation Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Efek Animasi Logo
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { key: 'spin-glow', name: 'Ring Bercahaya Putar', desc: 'Spin Glow Ring' },
                      { key: 'bounce-soft', name: 'Membal Lembut', desc: 'Bouncing Logo' },
                      { key: 'glow-pulse', name: 'Denyut Cahaya', desc: 'Pulsing Glow' },
                      { key: 'float', name: 'Mengambang Halus', desc: 'Floating Motion' },
                      { key: 'none', name: 'Statik Bersih', desc: 'Tanpa Gerak' },
                    ].map((anim) => {
                      const isSelected = formData.logoAnimation === anim.key;
                      return (
                        <button
                          key={anim.key}
                          type="button"
                          onClick={() => handleUpdate('logoAnimation', anim.key as LoaderAnimation)}
                          className={`p-2.5 rounded-xl border text-left transition ${
                            isSelected
                              ? 'border-amber-400 bg-slate-800'
                              : 'border-slate-800 bg-slate-950 hover:bg-slate-850'
                          }`}
                        >
                          <span className="text-xs font-bold text-white block truncate">{anim.name}</span>
                          <span className="text-[10px] text-slate-400 block">{anim.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Radial Glow Toggle */}
                <label className="flex items-center gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showRadialGlow}
                    onChange={(e) => handleUpdate('showRadialGlow', e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded bg-slate-900 border-slate-700"
                  />
                  <span className="text-xs text-slate-300 font-medium">
                    Tampilkan Efek Cahaya Latar Belakang (Radial Ambient Glow)
                  </span>
                </label>
              </div>
            )}

            {/* TAB 3: DURASI & TAHAPAN STATUS */}
            {activeTab === 'timing' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Duration Slider */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">Durasi Tampilan Loading</span>
                    <span className="text-amber-400 font-mono font-bold">
                      {(formData.loadingDurationMs / 1000).toFixed(1)} Detik ({formData.loadingDurationMs} ms)
                    </span>
                  </div>

                  <input
                    type="range"
                    min={500}
                    max={3500}
                    step={100}
                    value={formData.loadingDurationMs}
                    onChange={(e) => handleUpdate('loadingDurationMs', parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />

                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>0.5s (Sangat Cepat)</span>
                    <span>1.2s (Standar)</span>
                    <span>2.0s (Sedang)</span>
                    <span>3.5s (Sinematik)</span>
                  </div>
                </div>

                {/* 3 Step Status Messages */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Teks Status per Tahapan Loading
                  </label>

                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Tahap 1 (Awal 0% - 35%)</span>
                    <input
                      type="text"
                      value={formData.step1Text}
                      onChange={(e) => handleUpdate('step1Text', e.target.value)}
                      placeholder="Memverifikasi Basis Data EMIS & Format CR80..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Tahap 2 (Tengah 35% - 75%)</span>
                    <input
                      type="text"
                      value={formData.step2Text}
                      onChange={(e) => handleUpdate('step2Text', e.target.value)}
                      placeholder="Menyiapkan Engine Pratinjau 3D & Template Kemenag..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Tahap 3 (Selesai 75% - 100%)</span>
                    <input
                      type="text"
                      value={formData.step3Text}
                      onChange={(e) => handleUpdate('step3Text', e.target.value)}
                      placeholder="Sistem Siap Digunakan!"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Element Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <label className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showProgressBar}
                      onChange={(e) => handleUpdate('showProgressBar', e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded bg-slate-900 border-slate-700"
                    />
                    <span className="text-xs text-slate-300">Tampilkan Bar & % Progres</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showChecklist}
                      onChange={(e) => handleUpdate('showChecklist', e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded bg-slate-900 border-slate-700"
                    />
                    <span className="text-xs text-slate-300">Tampilkan 3 Poin Checklist</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: INTERACTIVE LIVE PREVIEW BOX (5 COLS) */}
          <div className="lg:col-span-5 p-4 sm:p-5 bg-slate-950 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-amber-400" /> Pratinjau Interaktif Langsung
                </span>
                
                <button
                  type="button"
                  onClick={() => setIsPlayingPreview(true)}
                  disabled={isPlayingPreview}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition active:scale-95 shadow-sm"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Uji Simulasi</span>
                </button>
              </div>

              {/* LIVE EMBEDDED PREVIEW CONTAINER */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-800 aspect-[4/5] sm:aspect-square flex items-center justify-center">
                <InitialPageLoader
                  config={formData}
                  progress={previewProgress}
                  madrasahLogoUrl={madrasah.logoMadrasahUrl || madrasah.logoAplikasiUrl}
                  isInlinePreview={true}
                />
              </div>

              {/* Progress Slider Controller */}
              <div className="mt-3 bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>Simulasi Manual Progres:</span>
                  <span className="text-emerald-400 font-bold">{previewProgress}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={previewProgress}
                  onChange={(e) => setPreviewProgress(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-500 text-center">
              Pengaturan ini otomatis tersimpan di peramban dan akan aktif setiap kali aplikasi dibuka.
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-2 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Default Kemenag</span>
            <span className="sm:hidden">Reset</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition active:scale-95 border border-emerald-400/30"
            >
              <Save className="w-4 h-4" />
              <span>Terapkan & Simpan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
