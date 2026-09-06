import React, { useState, useRef } from 'react';
import { KopSuratConfig, MadrasahInfo, CardConfig } from '../types';
import { 
  Building2, 
  FileText, 
  Image as ImageIcon, 
  Layers, 
  Sliders, 
  CheckCircle2, 
  Save, 
  RotateCcw, 
  RefreshCw, 
  Printer, 
  Download, 
  Copy, 
  Eye, 
  Upload, 
  Trash2, 
  Sparkles, 
  Maximize2, 
  Minus, 
  Plus, 
  ArrowRight,
  ExternalLink,
  Wand2,
  Check,
  AlignLeft,
  AlignCenter
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { 
  compressLogoOrGraphic, 
  makeStampOrSignatureTransparent 
} from '../utils/imageUtils';

interface KopSuratManagerProps {
  kopConfig: KopSuratConfig;
  onChange: (updated: KopSuratConfig) => void;
  madrasah: MadrasahInfo;
  onSave?: (updated: KopSuratConfig) => void;
  onResetToDefault?: () => void;
  onOpenSuratModal?: () => void;
}

export const KopSuratManager: React.FC<KopSuratManagerProps> = ({
  kopConfig,
  onChange,
  madrasah,
  onSave,
  onResetToDefault,
  onOpenSuratModal,
}) => {
  // Navigation tab inside Kop Surat Manager
  const [activeTab, setActiveTab] = useState<'text' | 'logo' | 'style' | 'export'>('text');

  // Preview options
  const [previewPaper, setPreviewPaper] = useState<'A4' | 'F4'>('A4');
  const [previewMode, setPreviewMode] = useState<'kop_only' | 'with_letter'>('with_letter');
  const [zoomScale, setZoomScale] = useState<number>(100);

  // States for feedback & processing
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // References
  const previewRef = useRef<HTMLDivElement>(null);
  const logoKiriInputRef = useRef<HTMLInputElement>(null);
  const logoKananInputRef = useRef<HTMLInputElement>(null);

  // Update helper
  const handleUpdate = (field: keyof KopSuratConfig, value: any) => {
    const updated = {
      ...kopConfig,
      [field]: value,
    };
    onChange(updated);
  };

  // Sync from Madrasah Info
  const handleSyncFromMadrasah = () => {
    const legalitasStr = `NSM: ${madrasah.nsm || '-'} • NPSN: ${madrasah.npsn || '-'}${madrasah.akreditasi && madrasah.akreditasi !== '-' ? ` • Terakreditasi ${madrasah.akreditasi}` : ''}`;
    const alamatStr = `${madrasah.alamat || ''}${madrasah.kecamatan ? `, Kec. ${madrasah.kecamatan}` : ''}${madrasah.kotaKab ? `, ${madrasah.kotaKab}` : ''}${madrasah.provinsi ? `, ${madrasah.provinsi}` : ''} ${madrasah.kodePos || ''}`.trim();
    
    const kontakParts: string[] = [];
    if (madrasah.telepon) kontakParts.push(`Telp: ${madrasah.telepon}`);
    if (madrasah.email) kontakParts.push(`Email: ${madrasah.email}`);
    if (madrasah.website) kontakParts.push(`Website: ${madrasah.website}`);
    const kontakStr = kontakParts.join(' | ');

    const updated: KopSuratConfig = {
      ...kopConfig,
      baris1Kementerian: madrasah.namaKementerian || 'KEMENTERIAN AGAMA REPUBLIK INDONESIA',
      baris2Wilayah: madrasah.kemenagWilayah || `KANTOR KEMENTERIAN AGAMA ${madrasah.kotaKab?.toUpperCase() || 'KABUPATEN BANYUMAS'}`,
      baris3Madrasah: madrasah.namaMadrasahKop || madrasah.namaMadrasah || "MI MA'ARIF NU 2 SANGGREMAN",
      baris4Legalitas: legalitasStr,
      baris5Alamat: alamatStr,
      baris6Kontak: kontakStr,
      logoKiriUrl: madrasah.logoKemenagUrl || kopConfig.logoKiriUrl,
      logoKananUrl: madrasah.logoMadrasahUrl || kopConfig.logoKananUrl,
    };

    onChange(updated);
    if (onSave) onSave(updated);

    setSaveFeedback('✓ Berhasil disinkronkan dari Profil Madrasah & Disimpan!');
    setTimeout(() => setSaveFeedback(null), 3500);
  };

  // Explicit Save
  const handleSave = () => {
    if (onSave) {
      onSave(kopConfig);
    } else {
      onChange(kopConfig);
    }
    setSaveFeedback('✓ Pengaturan Kop Surat Berhasil Disimpan!');
    setTimeout(() => setSaveFeedback(null), 3500);
  };

  // Upload Logo Kiri / Kanan
  const handleLogoUpload = async (side: 'kiri' | 'kanan', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingImage(side);
      const optimizedBase64 = await compressLogoOrGraphic(file, 512);

      if (side === 'kiri') {
        handleUpdate('logoKiriUrl', optimizedBase64);
        handleUpdate('showLogoKiri', true);
      } else {
        handleUpdate('logoKananUrl', optimizedBase64);
        handleUpdate('showLogoKanan', true);
      }

      setSaveFeedback(`✓ Logo ${side === 'kiri' ? 'Kiri' : 'Kanan'} berhasil diunggah!`);
      setTimeout(() => setSaveFeedback(null), 3000);
    } catch (err) {
      console.error('Failed to upload logo:', err);
    } finally {
      setIsProcessingImage(null);
      e.target.value = '';
    }
  };

  // Auto Transparent Logo
  const handleMakeLogoTransparent = async (side: 'kiri' | 'kanan') => {
    const url = side === 'kiri' ? kopConfig.logoKiriUrl : kopConfig.logoKananUrl;
    if (!url) return;

    try {
      setIsProcessingImage(side);
      const transparent = await makeStampOrSignatureTransparent(url, {
        type: 'logo',
        feather: 30,
        boostContrast: true,
        enhanceColor: true,
        sensitivity: 'high',
      });

      if (side === 'kiri') {
        handleUpdate('logoKiriUrl', transparent);
      } else {
        handleUpdate('logoKananUrl', transparent);
      }

      setSaveFeedback(`✓ Background Logo ${side === 'kiri' ? 'Kiri' : 'Kanan'} dijadikan transparan!`);
      setTimeout(() => setSaveFeedback(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessingImage(null);
    }
  };

  // Download High-Res PNG of Kop Surat for Microsoft Word / Docs
  const handleDownloadKopPng = async () => {
    const element = document.getElementById('kop-surat-render-box');
    if (!element) return;

    try {
      setIsExporting(true);
      const dataUrl = await toPng(element, {
        quality: 1.0,
        pixelRatio: 3, // 300 DPI high resolution
        backgroundColor: 'rgba(255, 255, 255, 0)', // transparent PNG
      });

      const link = document.createElement('a');
      link.download = `Kop_Surat_${(kopConfig.baris3Madrasah || 'Resmi').replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();

      setSaveFeedback('✓ Gambar Kop Surat PNG (Resolusi Tinggi) berhasil diunduh!');
      setTimeout(() => setSaveFeedback(null), 3500);
    } catch (err) {
      console.error('Failed to export PNG:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Copy HTML Snippet
  const handleCopyHtml = () => {
    const htmlSnippet = `<!-- KOP SURAT RESMI -->
<div style="text-align: ${kopConfig.textAlignment}; font-family: ${kopConfig.fontFamily}; color: ${kopConfig.textColor}; padding: ${kopConfig.paddingTop}px 0 ${kopConfig.paddingBottom}px 0;">
  ${kopConfig.showBaris1 ? `<div style="font-size: 13pt; font-weight: bold; text-transform: uppercase;">${kopConfig.baris1Kementerian}</div>` : ''}
  ${kopConfig.showBaris2 ? `<div style="font-size: 14pt; font-weight: bold; text-transform: uppercase;">${kopConfig.baris2Wilayah}</div>` : ''}
  ${kopConfig.showBaris3 ? `<div style="font-size: 17pt; font-weight: 800; text-transform: uppercase;">${kopConfig.baris3Madrasah}</div>` : ''}
  ${kopConfig.showBaris4 ? `<div style="font-size: 10.5pt;">${kopConfig.baris4Legalitas}</div>` : ''}
  ${kopConfig.showBaris5 ? `<div style="font-size: 9.5pt;">${kopConfig.baris5Alamat}</div>` : ''}
  ${kopConfig.showBaris6 ? `<div style="font-size: 9pt;">${kopConfig.baris6Kontak}</div>` : ''}
  <hr style="border: none; border-top: 3px double ${kopConfig.garisColor}; margin-top: 8px;" />
</div>`;

    navigator.clipboard.writeText(htmlSnippet);
    setSaveFeedback('✓ Kode HTML Kop Surat disalin ke clipboard!');
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  // Test Print Kop Surat
  const handlePrintTest = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const kopElement = document.getElementById('kop-surat-render-box');
    if (!kopElement) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cetak Uji Coba Kop Surat - ${kopConfig.baris3Madrasah}</title>
          <style>
            @page {
              size: ${previewPaper === 'F4' ? '215mm 330mm' : 'A4'};
              margin: 15mm 20mm 15mm 20mm;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: ${kopConfig.fontFamily === 'serif' ? 'Times New Roman, serif' : 'sans-serif'};
              color: ${kopConfig.textColor};
              background: white;
            }
          </style>
        </head>
        <body>
          ${kopElement.outerHTML}
          <div style="margin-top: 30px; font-size: 11pt; line-height: 1.6; text-align: justify;">
            <p><strong>[LEMBAR UJI COBA KOP SURAT RESMI]</strong></p>
            <p>Halaman ini mencetak tata letak Kop Surat resmi yang telah Anda atur. Pastikan logo kiri, logo kanan, baris teks kementerian, nama madrasah, alamat, kontak, dan garis ganda tercetak lurus serta proporsional.</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Active logo URLs with fallback to madrasah
  const activeLogoKiri = kopConfig.logoKiriUrl || madrasah.logoKemenagUrl || '';
  const activeLogoKanan = kopConfig.logoKananUrl || madrasah.logoMadrasahUrl || '';

  return (
    <div className="space-y-4">
      {/* Top Banner & Control Bar */}
      <div className="bg-slate-800/95 border border-slate-700/80 rounded-2xl p-4 shadow-lg backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">Modul Kop Surat Mandiri</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                  Full Edit
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Standar Kemenag & LP Ma'arif
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Kelola baris teks kop, tata letak logo kiri/kanan, tipografi, dan garis pemisah secara terpisah & bersih.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {saveFeedback && (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-500/50 flex items-center gap-1.5 shadow-sm animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {saveFeedback}
              </span>
            )}

            <button
              type="button"
              onClick={handleSyncFromMadrasah}
              className="px-3 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl border border-slate-600 flex items-center gap-1.5 transition active:scale-95"
              title="Tarik data otomatis dari Profil Madrasah"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tarik dari Profil</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md flex items-center gap-1.5 transition active:scale-95"
              title="Simpan pengaturan Kop Surat ke server"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Kop</span>
            </button>

            {onResetToDefault && (
              <button
                type="button"
                onClick={onResetToDefault}
                className="px-2.5 py-1.5 text-xs bg-slate-700/80 hover:bg-slate-600 text-slate-300 rounded-xl flex items-center gap-1 transition"
                title="Kembalikan ke template awal"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Sub-tabs Navigation */}
        <div className="mt-4 pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-700/70">
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition ${
                activeTab === 'text' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>📝 Teks & Legalitas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('logo')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition ${
                activeTab === 'logo' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>🖼️ Logo & Layout</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('style')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition ${
                activeTab === 'style' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>🎨 Desain & Garis</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('export')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition ${
                activeTab === 'export' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>🚀 Ekspor & Word</span>
            </button>
          </div>

          {onOpenSuratModal && (
            <button
              type="button"
              onClick={onOpenSuratModal}
              className="px-3 py-1.5 text-xs font-medium bg-indigo-600/90 hover:bg-indigo-500 text-white rounded-xl border border-indigo-400/30 flex items-center gap-1.5 shadow-sm transition active:scale-95"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-200" />
              <span>Buka di Surat Aktif</span>
              <ArrowRight className="w-3 h-3 text-indigo-300" />
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Left Controls (5 cols) & Right Live Preview (7 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        
        {/* ================= LEFT CONTROLS ================= */}
        <div className="xl:col-span-6 space-y-4">

          {/* TAB 1: TEKS KOP SURAT */}
          {activeTab === 'text' && (
            <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-700/70 pb-2.5">
                <div>
                  <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                    <span>1. Baris Teks Kop Surat</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Setiap baris dapat diedit bebas, diaktifkan/dinonaktifkan, dan diatur kapitalisasinya.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSyncFromMadrasah}
                  className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800/50 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Isi Otomatis</span>
                </button>
              </div>

              {/* Baris 1: Kementerian / Instansi Induk */}
              <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300">Baris 1: Instansi Induk / Kementerian</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdate('isUppercaseBaris1', !kopConfig.isUppercaseBaris1)}
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold transition ${
                        kopConfig.isUppercaseBaris1 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400'
                      }`}
                      title="Ubah huruf besar semua"
                    >
                      KAPITAL
                    </button>
                    <label className="flex items-center gap-1 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={kopConfig.showBaris1}
                        onChange={(e) => handleUpdate('showBaris1', e.target.checked)}
                        className="rounded border-slate-600 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                      />
                      <span className={kopConfig.showBaris1 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                        {kopConfig.showBaris1 ? 'Aktif' : 'Sembunyi'}
                      </span>
                    </label>
                  </div>
                </div>
                <input
                  type="text"
                  value={kopConfig.baris1Kementerian}
                  onChange={(e) => handleUpdate('baris1Kementerian', e.target.value)}
                  placeholder="Contoh: KEMENTERIAN AGAMA REPUBLIK INDONESIA atau YAYASAN LP MA'ARIF NU"
                  className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Baris 2: Wilayah / Kantor Kab/Kota */}
              <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300">Baris 2: Wilayah / Kantor Cabang</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdate('isUppercaseBaris2', !kopConfig.isUppercaseBaris2)}
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold transition ${
                        kopConfig.isUppercaseBaris2 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      KAPITAL
                    </button>
                    <label className="flex items-center gap-1 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={kopConfig.showBaris2}
                        onChange={(e) => handleUpdate('showBaris2', e.target.checked)}
                        className="rounded border-slate-600 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                      />
                      <span className={kopConfig.showBaris2 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                        {kopConfig.showBaris2 ? 'Aktif' : 'Sembunyi'}
                      </span>
                    </label>
                  </div>
                </div>
                <input
                  type="text"
                  value={kopConfig.baris2Wilayah}
                  onChange={(e) => handleUpdate('baris2Wilayah', e.target.value)}
                  placeholder="Contoh: KANTOR KEMENTERIAN AGAMA KABUPATEN BANYUMAS"
                  className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Baris 3: Nama Madrasah / Sekolah (Judul Utama) */}
              <div className="bg-slate-900/90 p-3.5 rounded-xl border border-emerald-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Baris 3: Nama Lembaga / Madrasah (Judul Utama)</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdate('isUppercaseBaris3', !kopConfig.isUppercaseBaris3)}
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold transition ${
                        kopConfig.isUppercaseBaris3 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      KAPITAL
                    </button>
                    <label className="flex items-center gap-1 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={kopConfig.showBaris3}
                        onChange={(e) => handleUpdate('showBaris3', e.target.checked)}
                        className="rounded border-slate-600 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                      />
                      <span className={kopConfig.showBaris3 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                        {kopConfig.showBaris3 ? 'Aktif' : 'Sembunyi'}
                      </span>
                    </label>
                  </div>
                </div>
                <input
                  type="text"
                  value={kopConfig.baris3Madrasah}
                  onChange={(e) => handleUpdate('baris3Madrasah', e.target.value)}
                  placeholder="Contoh: MADRASAH IBTIDAIYAH MA'ARIF NU 2 SANGGREMAN"
                  className="w-full text-sm font-bold bg-slate-950 border border-emerald-500/60 rounded-lg px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>

              {/* Baris 4: Legalitas (NSM, NPSN, Akreditasi) */}
              <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Baris 4: Legalitas (NSM, NPSN, Akreditasi)</span>
                  <label className="flex items-center gap-1 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={kopConfig.showBaris4}
                      onChange={(e) => handleUpdate('showBaris4', e.target.checked)}
                      className="rounded border-slate-600 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <span className={kopConfig.showBaris4 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                      {kopConfig.showBaris4 ? 'Aktif' : 'Sembunyi'}
                    </span>
                  </label>
                </div>
                <input
                  type="text"
                  value={kopConfig.baris4Legalitas}
                  onChange={(e) => handleUpdate('baris4Legalitas', e.target.value)}
                  placeholder="Contoh: NSM: 111233020050 • NPSN: 60710255 • Terakreditasi A"
                  className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Baris 5: Alamat Lengkap */}
              <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Baris 5: Alamat Lengkap Lembaga</span>
                  <label className="flex items-center gap-1 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={kopConfig.showBaris5}
                      onChange={(e) => handleUpdate('showBaris5', e.target.checked)}
                      className="rounded border-slate-600 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <span className={kopConfig.showBaris5 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                      {kopConfig.showBaris5 ? 'Aktif' : 'Sembunyi'}
                    </span>
                  </label>
                </div>
                <textarea
                  rows={2}
                  value={kopConfig.baris5Alamat}
                  onChange={(e) => handleUpdate('baris5Alamat', e.target.value)}
                  placeholder="Contoh: Jl. Sanggreman No. 02, Desa Sanggreman, Kec. Rawalo, Kab. Banyumas, Jawa Tengah 53173"
                  className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none resize-none"
                />
              </div>

              {/* Baris 6: Kontak & Website */}
              <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Baris 6: Kontak, Email & Website</span>
                  <label className="flex items-center gap-1 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={kopConfig.showBaris6}
                      onChange={(e) => handleUpdate('showBaris6', e.target.checked)}
                      className="rounded border-slate-600 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <span className={kopConfig.showBaris6 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                      {kopConfig.showBaris6 ? 'Aktif' : 'Sembunyi'}
                    </span>
                  </label>
                </div>
                <input
                  type="text"
                  value={kopConfig.baris6Kontak}
                  onChange={(e) => handleUpdate('baris6Kontak', e.target.value)}
                  placeholder="Contoh: Telp: (0281) 684-1234 | Email: mimaarifnu2sanggreman@gmail.com | Website: www.mimaarifnu2sanggreman.sch.id"
                  className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 2: LOGO & TATA LETAK */}
          {activeTab === 'logo' && (
            <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80 space-y-4 shadow-sm">
              <div className="border-b border-slate-700/70 pb-2.5">
                <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <span>2. Tata Letak & Logo Kop Surat</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Pilih konfigurasi logo yang sesuai: 2 logo (standar Kemenag), 1 logo kiri, atau 1 logo kanan.
                </p>
              </div>

              {/* Preset Layout Selector */}
              <div>
                <label className="block text-xs font-bold text-amber-300 mb-2">Preset Posisi Logo:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'dua-logo', label: '2 Logo (Kiri & Kanan)', desc: 'Standar Kemenag / Yayasan' },
                    { id: 'logo-kiri', label: '1 Logo Kiri Saja', desc: 'Formal Klasik' },
                    { id: 'logo-kanan', label: '1 Logo Kanan Saja', desc: 'Madrasah di Kanan' },
                    { id: 'logo-tengah', label: '1 Logo di Tengah', desc: 'Di Atas Judul Kop' },
                    { id: 'tanpa-logo', label: 'Tanpa Logo', desc: 'Hanya Teks' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleUpdate('layoutPreset', preset.id)}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        kopConfig.layoutPreset === preset.id
                          ? 'bg-emerald-950/70 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/50'
                          : 'bg-slate-900/60 border-slate-700/70 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-xs font-bold">{preset.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{preset.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload & Atur Logo Kiri */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Logo Kiri (Kementerian / Yayasan)</span>
                    <span className="text-[10px] text-slate-400">Posisi Kiri Atas</span>
                  </div>
                  <label className="flex items-center gap-1 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={kopConfig.showLogoKiri}
                      onChange={(e) => handleUpdate('showLogoKiri', e.target.checked)}
                      className="rounded border-slate-600 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <span className={kopConfig.showLogoKiri ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                      {kopConfig.showLogoKiri ? 'Tampilkan' : 'Sembunyikan'}
                    </span>
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center p-1 relative overflow-hidden">
                    {activeLogoKiri ? (
                      <img src={activeLogoKiri} alt="Logo Kiri" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-slate-500 text-center">Belum ada logo</span>
                    )}
                    {isProcessingImage === 'kiri' && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        ref={logoKiriInputRef}
                        onChange={(e) => handleLogoUpload('kiri', e)}
                        accept="image/png,image/jpeg,image/svg+xml"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => logoKiriInputRef.current?.click()}
                        className="px-2.5 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg flex items-center gap-1.5 transition"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload Logo Kiri</span>
                      </button>

                      {activeLogoKiri && (
                        <button
                          type="button"
                          onClick={() => handleMakeLogoTransparent('kiri')}
                          className="px-2.5 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-cyan-300 rounded-lg flex items-center gap-1.5 transition"
                          title="Hapus background putih/kusam otomatis"
                        >
                          <Wand2 className="w-3 h-3 text-cyan-400" />
                          <span>Buat Transparan</span>
                        </button>
                      )}

                      {activeLogoKiri && (
                        <button
                          type="button"
                          onClick={() => handleUpdate('logoKiriUrl', '')}
                          className="px-2 py-1.5 text-xs bg-rose-950/70 hover:bg-rose-900 text-rose-300 rounded-lg flex items-center gap-1 transition"
                          title="Hapus gambar logo kiri"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Ukuran Logo Kiri */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">Ukuran:</span>
                      <input
                        type="range"
                        min={50}
                        max={110}
                        value={kopConfig.logoKiriSize}
                        onChange={(e) => handleUpdate('logoKiriSize', Number(e.target.value))}
                        className="w-32 accent-emerald-500"
                      />
                      <span className="text-[11px] font-mono text-emerald-400">{kopConfig.logoKiriSize}px</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload & Atur Logo Kanan */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Logo Kanan (Madrasah / Lembaga)</span>
                    <span className="text-[10px] text-slate-400">Posisi Kanan Atas</span>
                  </div>
                  <label className="flex items-center gap-1 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={kopConfig.showLogoKanan}
                      onChange={(e) => handleUpdate('showLogoKanan', e.target.checked)}
                      className="rounded border-slate-600 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <span className={kopConfig.showLogoKanan ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                      {kopConfig.showLogoKanan ? 'Tampilkan' : 'Sembunyikan'}
                    </span>
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center p-1 relative overflow-hidden">
                    {activeLogoKanan ? (
                      <img src={activeLogoKanan} alt="Logo Kanan" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-slate-500 text-center">Belum ada logo</span>
                    )}
                    {isProcessingImage === 'kanan' && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        ref={logoKananInputRef}
                        onChange={(e) => handleLogoUpload('kanan', e)}
                        accept="image/png,image/jpeg,image/svg+xml"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => logoKananInputRef.current?.click()}
                        className="px-2.5 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg flex items-center gap-1.5 transition"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload Logo Kanan</span>
                      </button>

                      {activeLogoKanan && (
                        <button
                          type="button"
                          onClick={() => handleMakeLogoTransparent('kanan')}
                          className="px-2.5 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-cyan-300 rounded-lg flex items-center gap-1.5 transition"
                          title="Hapus background putih/kusam otomatis"
                        >
                          <Wand2 className="w-3 h-3 text-cyan-400" />
                          <span>Buat Transparan</span>
                        </button>
                      )}

                      {activeLogoKanan && (
                        <button
                          type="button"
                          onClick={() => handleUpdate('logoKananUrl', '')}
                          className="px-2 py-1.5 text-xs bg-rose-950/70 hover:bg-rose-900 text-rose-300 rounded-lg flex items-center gap-1 transition"
                          title="Hapus gambar logo kanan"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Ukuran Logo Kanan */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">Ukuran:</span>
                      <input
                        type="range"
                        min={50}
                        max={110}
                        value={kopConfig.logoKananSize}
                        onChange={(e) => handleUpdate('logoKananSize', Number(e.target.value))}
                        className="w-32 accent-emerald-500"
                      />
                      <span className="text-[11px] font-mono text-emerald-400">{kopConfig.logoKananSize}px</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DESAIN, GARIS & FONT */}
          {activeTab === 'style' && (
            <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80 space-y-4 shadow-sm">
              <div className="border-b border-slate-700/70 pb-2.5">
                <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <span>3. Tipografi & Garis Pemisah Kop</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Kustomisasi jenis huruf, ukuran, perataan teks, dan gaya garis pemisah dokumen resmi.
                </p>
              </div>

              {/* Font Family Selector */}
              <div>
                <label className="block text-xs font-bold text-amber-300 mb-2">Jenis Huruf (Font Family):</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'serif', name: 'Times New Roman / Serif', sub: 'Standar Resmi Surat Kedinasan' },
                    { id: 'sans', name: 'Plus Jakarta Sans / Arial', sub: 'Modern, Bersih & Minimalis' },
                    { id: 'amiri', name: 'Amiri / Formal Islami', sub: 'Karakter Kaligrafi Kemenag' },
                    { id: 'cinzel', name: 'Cinzel Classical', sub: 'Megah, Berwibawa & Elegan' },
                  ].map((font) => (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => handleUpdate('fontFamily', font.id)}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        kopConfig.fontFamily === font.id
                          ? 'bg-emerald-950/70 border-emerald-500 text-white ring-1 ring-emerald-500/50'
                          : 'bg-slate-900/60 border-slate-700/70 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-xs font-bold">{font.name}</div>
                      <div className="text-[10px] text-slate-400">{font.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Skala Ukuran Font & Perataan */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700">
                  <label className="block text-xs font-bold text-slate-300 mb-2">Skala Ukuran Teks:</label>
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    {(['compact', 'normal', 'large'] as const).map((sc) => (
                      <button
                        key={sc}
                        type="button"
                        onClick={() => handleUpdate('fontSizeScale', sc)}
                        className={`flex-1 py-1 text-xs font-semibold rounded capitalize transition ${
                          kopConfig.fontSizeScale === sc
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {sc === 'compact' ? 'Rapat' : sc === 'normal' ? 'Standar' : 'Besar'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700">
                  <label className="block text-xs font-bold text-slate-300 mb-2">Perataan Teks:</label>
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleUpdate('textAlignment', 'center')}
                      className={`flex-1 py-1 text-xs font-semibold rounded flex items-center justify-center gap-1 transition ${
                        kopConfig.textAlignment === 'center'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                      <span>Tengah</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdate('textAlignment', 'left')}
                      className={`flex-1 py-1 text-xs font-semibold rounded flex items-center justify-center gap-1 transition ${
                        kopConfig.textAlignment === 'left'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                      <span>Kiri</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Gaya Garis Pemisah (Divider Line) */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700 space-y-3">
                <label className="block text-xs font-bold text-amber-300">Gaya Garis Pemisah Kop (Separator):</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'ganda-resmi', label: 'Garis Ganda Resmi', desc: 'Atas tebal, bawah tipis (Kemenag)' },
                    { id: 'tunggal-tebal', label: 'Garis Tunggal Tebal', desc: 'Garis hitam tegas' },
                    { id: 'tunggal-tipis', label: 'Garis Minimalis', desc: '1px halus' },
                    { id: 'ganda-simetris', label: 'Ganda Simetris', desc: 'Dua garis kembar' },
                    { id: 'warna-kemenag', label: 'Aksen Hijau Kemenag', desc: 'Nuansa Islami' },
                    { id: 'none', label: 'Tanpa Garis', desc: 'Polos' },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => handleUpdate('garisStyle', style.id)}
                      className={`p-2 rounded-xl border text-left transition ${
                        kopConfig.garisStyle === style.id
                          ? 'bg-emerald-950/80 border-emerald-500 text-white ring-1 ring-emerald-500/50'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-xs font-bold">{style.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{style.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Garis Padding / Ketebalan */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400">Jarak Bawah Kop:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={4}
                        max={20}
                        value={kopConfig.paddingBottom}
                        onChange={(e) => handleUpdate('paddingBottom', Number(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                      <span className="text-xs font-mono text-emerald-400">{kopConfig.paddingBottom}px</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400">Ketebalan Garis:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={1}
                        max={5}
                        step={0.5}
                        value={kopConfig.garisThickness}
                        onChange={(e) => handleUpdate('garisThickness', Number(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                      <span className="text-xs font-mono text-emerald-400">{kopConfig.garisThickness}px</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EKSPOR & WORD */}
          {activeTab === 'export' && (
            <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80 space-y-4 shadow-sm">
              <div className="border-b border-slate-700/70 pb-2.5">
                <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <span>4. Integrasi & Ekspor Kop Surat</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Gunakan Kop Surat yang telah Anda desain pada Microsoft Word, Google Docs, atau cetak lembar uji coba.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Download PNG for Word */}
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 space-y-2.5 flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                      <Download className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-white">Unduh Gambar Kop (PNG Transparan)</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Kop surat diekspor dengan resolusi 300 DPI dan latar transparan, siap disisipkan langsung ke header Microsoft Word atau Google Docs!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadKopPng}
                    disabled={isExporting}
                    className="w-full py-2 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
                  >
                    {isExporting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Memproses PNG...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh PNG untuk Word</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Print Test */}
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 space-y-2.5 flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-2">
                      <Printer className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-white">Cetak Uji Coba Kop</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Cetak langsung ke kertas fisik untuk memastikan presisi garis, kerapatan margin, dan ketajaman logo madrasah.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handlePrintTest}
                    className="w-full py-2 px-3 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-md flex items-center justify-center gap-2 transition active:scale-95"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Lembar Tes Kop</span>
                  </button>
                </div>

                {/* Copy HTML */}
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 space-y-2.5 flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-2">
                      <Copy className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-white">Salin Kode HTML Kop</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Salin kode HTML inline terformat rapi untuk diintegrasikan ke laporan web, sistem emis, atau aplikasi lain.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyHtml}
                    className="w-full py-2 px-3 text-xs font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl flex items-center justify-center gap-2 transition active:scale-95"
                  >
                    <Copy className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Salin Kode HTML</span>
                  </button>
                </div>

                {/* Open in Surat Aktif */}
                {onOpenSuratModal && (
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-indigo-500/30 space-y-2.5 flex flex-col justify-between">
                    <div>
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-2">
                        <FileText className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-white">Surat Keterangan Aktif Siswa</h4>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Buka modul Surat Keterangan Aktif Siswa yang secara otomatis menggunakan desain kop surat ini.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenSuratModal}
                      className="w-full py-2 px-3 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md flex items-center justify-center gap-2 transition active:scale-95"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buat Surat Keterangan</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* ================= RIGHT LIVE PREVIEW ================= */}
        <div className="xl:col-span-6 sticky top-4 space-y-3">
          {/* Preview Toolbar */}
          <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700/80 flex flex-wrap items-center justify-between gap-2 shadow-md">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> Pratinjau Lembar Resmi
              </span>
              <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300 font-mono">
                {previewPaper}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Paper Size Switch */}
              <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-700 text-[11px]">
                <button
                  type="button"
                  onClick={() => setPreviewPaper('A4')}
                  className={`px-2 py-0.5 rounded font-bold transition ${
                    previewPaper === 'A4' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  A4
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPaper('F4')}
                  className={`px-2 py-0.5 rounded font-bold transition ${
                    previewPaper === 'F4' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  F4
                </button>
              </div>

              {/* Mode Switch */}
              <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-700 text-[11px]">
                <button
                  type="button"
                  onClick={() => setPreviewMode('kop_only')}
                  className={`px-2 py-0.5 rounded font-semibold transition ${
                    previewMode === 'kop_only' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Kop Saja
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('with_letter')}
                  className={`px-2 py-0.5 rounded font-semibold transition ${
                    previewMode === 'with_letter' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Isi Surat
                </button>
              </div>

              {/* Download PNG Button */}
              <button
                type="button"
                onClick={handleDownloadKopPng}
                className="p-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition"
                title="Unduh gambar kop PNG"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* White Realistic Paper Canvas */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-center overflow-x-auto shadow-inner">
            <div 
              ref={previewRef}
              className={`bg-white text-black rounded-sm shadow-2xl p-6 transition-all duration-300 ${
                previewPaper === 'F4' ? 'w-full max-w-[580px] min-h-[700px]' : 'w-full max-w-[580px] min-h-[660px]'
              }`}
              style={{
                fontFamily: kopConfig.fontFamily === 'serif' ? 'Times New Roman, Garamond, serif' : kopConfig.fontFamily === 'amiri' ? 'Amiri, serif' : kopConfig.fontFamily === 'cinzel' ? 'Cinzel, serif' : 'Plus Jakarta Sans, sans-serif'
              }}
            >
              
              {/* === RENDER KOP SURAT BOX (TARGET UNTUK EXPORT PNG) === */}
              <div 
                id="kop-surat-render-box" 
                className="w-full select-none"
                style={{
                  paddingTop: `${kopConfig.paddingTop}px`,
                  paddingBottom: `${kopConfig.paddingBottom}px`,
                  color: kopConfig.textColor,
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  
                  {/* LOGO KIRI */}
                  {kopConfig.showLogoKiri && (kopConfig.layoutPreset === 'dua-logo' || kopConfig.layoutPreset === 'logo-kiri') ? (
                    <div 
                      className="flex items-center justify-center flex-shrink-0"
                      style={{ width: `${kopConfig.logoKiriSize}px`, height: `${kopConfig.logoKiriSize}px` }}
                    >
                      {activeLogoKiri ? (
                        <img 
                          src={activeLogoKiri} 
                          alt="Logo Kiri" 
                          className="w-full h-full object-contain"
                          crossOrigin="anonymous" 
                        />
                      ) : (
                        <div className="w-full h-full border border-dashed border-neutral-300 rounded flex items-center justify-center text-[9px] text-neutral-400">
                          Logo Kiri
                        </div>
                      )}
                    </div>
                  ) : (
                    // Penjaga keseimbangan simetri jika logo kanan aktif pada mode dua-logo
                    kopConfig.showLogoKanan && kopConfig.layoutPreset === 'dua-logo' ? (
                      <div style={{ width: `${kopConfig.logoKiriSize}px` }} aria-hidden="true" />
                    ) : null
                  )}

                  {/* TEKS KOP TENGAH */}
                  <div className={`flex-1 ${kopConfig.textAlignment === 'left' ? 'text-left' : 'text-center'}`}>
                    
                    {/* Baris 1: Kementerian / Instansi Induk */}
                    {kopConfig.showBaris1 && kopConfig.baris1Kementerian && (
                      <div 
                        className={`font-bold tracking-wider leading-tight ${
                          kopConfig.fontSizeScale === 'compact' ? 'text-[11.5px]' : kopConfig.fontSizeScale === 'large' ? 'text-[14px]' : 'text-[12.5px]'
                        } ${kopConfig.isUppercaseBaris1 ? 'uppercase' : ''}`}
                      >
                        {kopConfig.baris1Kementerian}
                      </div>
                    )}

                    {/* Baris 2: Wilayah / Cabang */}
                    {kopConfig.showBaris2 && kopConfig.baris2Wilayah && (
                      <div 
                        className={`font-bold tracking-wider leading-tight mt-0.5 ${
                          kopConfig.fontSizeScale === 'compact' ? 'text-[12.5px]' : kopConfig.fontSizeScale === 'large' ? 'text-[15px]' : 'text-[13.5px]'
                        } ${kopConfig.isUppercaseBaris2 ? 'uppercase' : ''}`}
                      >
                        {kopConfig.baris2Wilayah}
                      </div>
                    )}

                    {/* Baris 3: Nama Madrasah / Lembaga */}
                    {kopConfig.showBaris3 && kopConfig.baris3Madrasah && (
                      <div 
                        className={`font-extrabold tracking-wide leading-tight mt-0.5 ${
                          kopConfig.fontSizeScale === 'compact' ? 'text-[15px]' : kopConfig.fontSizeScale === 'large' ? 'text-[18px]' : 'text-[16.5px]'
                        } ${kopConfig.isUppercaseBaris3 ? 'uppercase' : ''}`}
                      >
                        {kopConfig.baris3Madrasah}
                      </div>
                    )}

                    {/* Baris 4: Legalitas (NSM, NPSN, Akreditasi) */}
                    {kopConfig.showBaris4 && kopConfig.baris4Legalitas && (
                      <div 
                        className={`font-medium leading-tight mt-0.5 text-neutral-800 ${
                          kopConfig.fontSizeScale === 'compact' ? 'text-[9.5px]' : kopConfig.fontSizeScale === 'large' ? 'text-[11px]' : 'text-[10px]'
                        }`}
                      >
                        {kopConfig.baris4Legalitas}
                      </div>
                    )}

                    {/* Baris 5: Alamat Lengkap */}
                    {kopConfig.showBaris5 && kopConfig.baris5Alamat && (
                      <div 
                        className={`font-normal leading-tight mt-0.5 text-neutral-700 ${
                          kopConfig.fontSizeScale === 'compact' ? 'text-[8.5px]' : kopConfig.fontSizeScale === 'large' ? 'text-[10px]' : 'text-[9px]'
                        }`}
                      >
                        {kopConfig.baris5Alamat}
                      </div>
                    )}

                    {/* Baris 6: Kontak & Website */}
                    {kopConfig.showBaris6 && kopConfig.baris6Kontak && (
                      <div 
                        className={`font-normal leading-tight mt-0.5 text-neutral-700 ${
                          kopConfig.fontSizeScale === 'compact' ? 'text-[8px]' : kopConfig.fontSizeScale === 'large' ? 'text-[9.5px]' : 'text-[8.5px]'
                        }`}
                      >
                        {kopConfig.baris6Kontak}
                      </div>
                    )}

                  </div>

                  {/* LOGO KANAN */}
                  {kopConfig.showLogoKanan && (kopConfig.layoutPreset === 'dua-logo' || kopConfig.layoutPreset === 'logo-kanan') ? (
                    <div 
                      className="flex items-center justify-center flex-shrink-0"
                      style={{ width: `${kopConfig.logoKananSize}px`, height: `${kopConfig.logoKananSize}px` }}
                    >
                      {activeLogoKanan ? (
                        <img 
                          src={activeLogoKanan} 
                          alt="Logo Kanan" 
                          className="w-full h-full object-contain"
                          crossOrigin="anonymous" 
                        />
                      ) : (
                        <div className="w-full h-full border border-dashed border-neutral-300 rounded flex items-center justify-center text-[9px] text-neutral-400">
                          Logo Kanan
                        </div>
                      )}
                    </div>
                  ) : (
                    // Penjaga keseimbangan simetri jika logo kiri aktif pada mode dua-logo
                    kopConfig.showLogoKiri && kopConfig.layoutPreset === 'dua-logo' ? (
                      <div style={{ width: `${kopConfig.logoKiriSize}px` }} aria-hidden="true" />
                    ) : null
                  )}

                </div>

                {/* GARIS PEMISAH KOP (DIVIDER) */}
                {kopConfig.garisStyle !== 'none' && (
                  <div className="mt-2 w-full">
                    {kopConfig.garisStyle === 'ganda-resmi' && (
                      <div className="space-y-[1.5px]">
                        <div style={{ height: `${kopConfig.garisThickness}px`, backgroundColor: kopConfig.garisColor }}></div>
                        <div style={{ height: '1px', backgroundColor: kopConfig.garisColor }}></div>
                      </div>
                    )}

                    {kopConfig.garisStyle === 'tunggal-tebal' && (
                      <div style={{ height: `${Math.max(2, kopConfig.garisThickness)}px`, backgroundColor: kopConfig.garisColor }}></div>
                    )}

                    {kopConfig.garisStyle === 'tunggal-tipis' && (
                      <div style={{ height: '1px', backgroundColor: kopConfig.garisColor }}></div>
                    )}

                    {kopConfig.garisStyle === 'ganda-simetris' && (
                      <div className="space-y-[2px]">
                        <div style={{ height: '1.5px', backgroundColor: kopConfig.garisColor }}></div>
                        <div style={{ height: '1.5px', backgroundColor: kopConfig.garisColor }}></div>
                      </div>
                    )}

                    {kopConfig.garisStyle === 'warna-kemenag' && (
                      <div className="space-y-[1.5px]">
                        <div style={{ height: `${kopConfig.garisThickness}px`, backgroundColor: '#047857' }}></div>
                        <div style={{ height: '1px', backgroundColor: '#d97706' }}></div>
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* SIMULASI CONTOH ISI SURAT RESMI */}
              {previewMode === 'with_letter' && (
                <div className="mt-4 pt-2 text-[11px] leading-relaxed text-neutral-900 border-t border-dashed border-neutral-200">
                  <div className="text-center my-3">
                    <h3 className="text-[13px] font-bold tracking-wider uppercase underline underline-offset-4 decoration-1">
                      SURAT KETERANGAN AKTIF BELAJAR
                    </h3>
                    <p className="text-[11px] font-medium mt-0.5">
                      Nomor : B-412/MI.1112/PP.00.4/07/{new Date().getFullYear()}
                    </p>
                  </div>

                  <p className="text-justify mb-2">
                    Yang bertanda tangan di bawah ini, Kepala Madrasah Ibtidaiyah {kopConfig.baris3Madrasah}, menerangkan dengan sebenarnya bahwa:
                  </p>

                  <div className="grid grid-cols-12 gap-y-1 my-2 pl-4 text-[10.5px]">
                    <div className="col-span-4 font-semibold text-neutral-700">Nama Siswa</div>
                    <div className="col-span-8 font-bold">: AHMAD FAUZAN AL-FARISI</div>

                    <div className="col-span-4 font-semibold text-neutral-700">NISN / NIS</div>
                    <div className="col-span-8">: 0123456789 / 232401001</div>

                    <div className="col-span-4 font-semibold text-neutral-700">Kelas / Semester</div>
                    <div className="col-span-8">: IV (Empat) / Ganjil</div>

                    <div className="col-span-4 font-semibold text-neutral-700">Tahun Pelajaran</div>
                    <div className="col-span-8">: {madrasah.tahunPelajaran || '2025/2026'}</div>
                  </div>

                  <p className="text-justify my-2">
                    Adalah benar-benar peserta didik yang masih aktif belajar pada lembaga kami sampai dengan tahun pelajaran ini.
                  </p>

                  <div className="flex justify-end mt-8">
                    <div className="text-center w-48 text-[10.5px]">
                      <div>{madrasah.kotaPenetapan || 'Banyumas'}, {madrasah.tanggalPenetapan || '15 Juli 2025'}</div>
                      <div className="font-semibold">{madrasah.jabatanPenandatangan || 'Kepala Madrasah'},</div>
                      <div className="h-12 flex items-center justify-center text-neutral-300 italic text-[9px]">
                        [Tanda Tangan & Cap]
                      </div>
                      <div className="font-bold underline">{madrasah.namaKepalaMadrasah || 'Siti Rochimah, S.Pd.I'}</div>
                      <div>{madrasah.labelIdPenandatangan || 'NIP'}. {madrasah.nipKepalaMadrasah || '197605122005012001'}</div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
