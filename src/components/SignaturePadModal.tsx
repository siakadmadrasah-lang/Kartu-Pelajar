import React, { useRef, useState, useEffect } from 'react';
import { MadrasahInfo } from '../types';
import { 
  PenTool, 
  Stamp, 
  Trash2, 
  RotateCcw, 
  Download, 
  Upload, 
  Check, 
  X, 
  Sparkles, 
  Eye, 
  UserCheck,
  Calendar,
  MapPin,
  Palette,
  Loader2,
  Wand2,
  CheckCircle2
} from 'lucide-react';
import { OfficialStamp, PrincipalSignature } from './Logos';
import { processSignatureUpload, processStampUpload, makeStampOrSignatureTransparent } from '../utils/imageUtils';

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  madrasah: MadrasahInfo;
  onSaveSignature: (updatedMadrasah: MadrasahInfo) => void;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  isOpen,
  onClose,
  madrasah,
  onSaveSignature,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stampFileInputRef = useRef<HTMLInputElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeHistory, setStrokeHistory] = useState<ImageData[]>([]);
  const [penColor, setPenColor] = useState<string>('#0f172a');
  const [penWidth, setPenWidth] = useState<number>(2.5);
  const [hasDrawn, setHasDrawn] = useState<boolean>(false);

  // Loading and processing states
  const [isProcessingSig, setIsProcessingSig] = useState<boolean>(false);
  const [isProcessingStamp, setIsProcessingStamp] = useState<boolean>(false);
  const [transparencyFeedback, setTransparencyFeedback] = useState<string | null>(null);

  // Form states
  const [jabatanPenandatangan, setJabatanPenandatangan] = useState(madrasah.jabatanPenandatangan || 'Kepala Madrasah');
  const [labelIdPenandatangan, setLabelIdPenandatangan] = useState(madrasah.labelIdPenandatangan || 'NIP');
  const [namaKepala, setNamaKepala] = useState(madrasah.namaKepalaMadrasah);
  const [nipKepala, setNipKepala] = useState(madrasah.nipKepalaMadrasah);
  const [kotaPenetapan, setKotaPenetapan] = useState(madrasah.kotaPenetapan);
  const [tanggalPenetapan, setTanggalPenetapan] = useState(madrasah.tanggalPenetapan);
  const [customSignatureUrl, setCustomSignatureUrl] = useState<string>(madrasah.ttdKepalaUrl || '');
  const [customStampUrl, setCustomStampUrl] = useState<string>(madrasah.stempelUrl || '');

  const [activeSubTab, setActiveSubTab] = useState<'draw' | 'presets' | 'upload' | 'stamp'>('draw');

  useEffect(() => {
    if (isOpen) {
      setJabatanPenandatangan(madrasah.jabatanPenandatangan || 'Kepala Madrasah');
      setLabelIdPenandatangan(madrasah.labelIdPenandatangan || 'NIP');
      setNamaKepala(madrasah.namaKepalaMadrasah);
      setNipKepala(madrasah.nipKepalaMadrasah);
      setKotaPenetapan(madrasah.kotaPenetapan);
      setTanggalPenetapan(madrasah.tanggalPenetapan);
      setCustomSignatureUrl(madrasah.ttdKepalaUrl || '');
      setCustomStampUrl(madrasah.stempelUrl || '');

      // Initialize canvas when modal opens
      setTimeout(() => {
        initCanvas();
      }, 100);
    }
  }, [isOpen, madrasah]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setStrokeHistory([]);
    setHasDrawn(false);
  };

  // Drawing event handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save history before new stroke
    const currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setStrokeHistory((prev) => [...prev.slice(-15), currentImageData]);

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setCustomSignatureUrl(dataUrl);
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas || strokeHistory.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previousState = strokeHistory[strokeHistory.length - 1];
    ctx.putImageData(previousState, 0, 0);
    setStrokeHistory((prev) => prev.slice(0, -1));
    const dataUrl = canvas.toDataURL('image/png');
    setCustomSignatureUrl(dataUrl);
  };

  const handleClearCanvas = () => {
    initCanvas();
    setCustomSignatureUrl('');
  };

  // Generate SVG Presets
  const handleSelectPreset = (presetType: 'formal' | 'classic' | 'modern') => {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 300, 120);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (presetType === 'formal') {
      ctx.beginPath();
      ctx.moveTo(30, 80);
      ctx.bezierCurveTo(40, 20, 70, 20, 80, 85);
      ctx.bezierCurveTo(90, 40, 110, 30, 130, 70);
      ctx.bezierCurveTo(150, 40, 180, 60, 200, 65);
      ctx.bezierCurveTo(220, 70, 250, 40, 270, 50);
      ctx.stroke();

      // Underline
      ctx.beginPath();
      ctx.moveTo(25, 95);
      ctx.bezierCurveTo(100, 90, 200, 100, 275, 88);
      ctx.stroke();
    } else if (presetType === 'classic') {
      ctx.beginPath();
      ctx.moveTo(40, 90);
      ctx.bezierCurveTo(30, 30, 80, 15, 90, 75);
      ctx.bezierCurveTo(100, 45, 120, 40, 140, 75);
      ctx.bezierCurveTo(160, 95, 190, 30, 220, 70);
      ctx.bezierCurveTo(240, 90, 260, 60, 280, 65);
      ctx.stroke();

      // Loop flourish
      ctx.beginPath();
      ctx.arc(60, 55, 20, 0, Math.PI * 1.8);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(35, 75);
      ctx.quadraticCurveTo(80, 20, 120, 80);
      ctx.quadraticCurveTo(160, 30, 200, 75);
      ctx.quadraticCurveTo(240, 40, 275, 60);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(45, 92);
      ctx.lineTo(265, 88);
      ctx.stroke();
    }

    const dataUrl = canvas.toDataURL('image/png');
    setCustomSignatureUrl(dataUrl);
  };

  const handleUploadSignatureFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingSig(true);
      setTransparencyFeedback('Memproses & menghapus background tanda tangan...');
      // Automatically remove paper background and create transparent PNG
      const transparentSig = await processSignatureUpload(file);
      setCustomSignatureUrl(transparentSig);
      setTransparencyFeedback('✓ Tanda tangan berhasil diunggah & dibuat transparan otomatis!');
      setTimeout(() => setTransparencyFeedback(null), 3000);
    } catch (err) {
      console.warn('Failed to process transparent signature, fallback to raw data:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomSignatureUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessingSig(false);
      e.target.value = '';
    }
  };

  const handleMakeSigTransparentManual = async (
    inkColorMode: 'auto' | 'pure_black' | 'kemenag_blue' = 'auto',
    sensitivity: 'high' | 'ultra' = 'ultra'
  ) => {
    if (!customSignatureUrl) return;
    try {
      setIsProcessingSig(true);
      setTransparencyFeedback('Membersihkan background kertas dan memproses tinta...');
      const transparent = await makeStampOrSignatureTransparent(customSignatureUrl, {
        type: 'signature',
        feather: 30,
        boostContrast: true,
        autoCrop: true,
        inkColorMode,
        sensitivity,
      });
      setCustomSignatureUrl(transparent);
      setTransparencyFeedback('✓ Tanda tangan kini 100% transparan & jernih!');
      setTimeout(() => setTransparencyFeedback(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessingSig(false);
    }
  };

  const handleUploadStampFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingStamp(true);
      setTransparencyFeedback('Memproses & membuat stempel transparan...');
      // Automatically remove paper background and enhance stamp ink
      const transparentStamp = await processStampUpload(file, { sensitivity: 'ultra' });
      setCustomStampUrl(transparentStamp);
      setTransparencyFeedback('✓ Stempel berhasil diunggah & dibuat transparan otomatis!');
      setTimeout(() => setTransparencyFeedback(null), 3000);
    } catch (err) {
      console.warn('Failed to process transparent stamp, fallback to raw data:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomStampUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessingStamp(false);
      e.target.value = '';
    }
  };

  const handleMakeStampTransparentManual = async () => {
    if (!customStampUrl) return;
    try {
      setIsProcessingStamp(true);
      setTransparencyFeedback('Membersihkan background stempel...');
      const transparent = await makeStampOrSignatureTransparent(customStampUrl, {
        type: 'stamp',
        feather: 35,
        boostContrast: true,
        enhanceColor: true,
        sensitivity: 'ultra',
      });
      setCustomStampUrl(transparent);
      setTransparencyFeedback('✓ Stempel kini 100% transparan!');
      setTimeout(() => setTransparencyFeedback(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessingStamp(false);
    }
  };

  const handleSaveAll = () => {
    onSaveSignature({
      ...madrasah,
      jabatanPenandatangan: jabatanPenandatangan || 'Kepala Madrasah',
      labelIdPenandatangan: labelIdPenandatangan || 'NIP',
      namaKepalaMadrasah: namaKepala,
      nipKepalaMadrasah: nipKepala,
      kotaPenetapan: kotaPenetapan,
      tanggalPenetapan: tanggalPenetapan,
      ttdKepalaUrl: customSignatureUrl,
      stempelUrl: customStampUrl,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600/30 text-emerald-400 rounded-lg">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide">
                Pengaturan Penandatanganan & Stempel Digital
              </h3>
              <p className="text-xs text-slate-400">
                Tanda tangan interaktif, stempel cap basah & legalitas pejabat penetap kartu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Pejabat Penandatangan Form */}
          <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3">
            <h4 className="font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <UserCheck className="w-3.5 h-3.5" /> Identitas Pejabat Penandatangan Kartu
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Jabatan / Posisi Penandatangan *
                </label>
                <div className="space-y-1">
                  <input
                    type="text"
                    value={jabatanPenandatangan}
                    onChange={(e) => setJabatanPenandatangan(e.target.value)}
                    placeholder="Kepala Madrasah / Plt. Kepala Madrasah"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex flex-wrap gap-1">
                    {['Kepala Madrasah', 'Plt. Kepala Madrasah', 'Kepala Tata Usaha', 'Waka Kesiswaan', 'Ketua Yayasan'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setJabatanPenandatangan(preset)}
                        className={`text-[9px] px-1.5 py-0.5 rounded border transition ${
                          jabatanPenandatangan === preset
                            ? 'bg-emerald-700 border-emerald-500 text-white font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Nama Pejabat (Beserta Gelar) *
                </label>
                <input
                  type="text"
                  value={namaKepala}
                  onChange={(e) => setNamaKepala(e.target.value)}
                  placeholder="Drs. H. AHMAD FAUZI, M.Pd.I"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Nomor Identitas Penandatangan
                </label>
                <div className="flex gap-2">
                  <select
                    value={labelIdPenandatangan}
                    onChange={(e) => setLabelIdPenandatangan(e.target.value)}
                    className="w-1/3 bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-amber-300 font-bold text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="NIP">NIP</option>
                    <option value="NIY">NIY</option>
                    <option value="NUPTK">NUPTK</option>
                    <option value="NRG">NRG</option>
                    <option value="PegID">PegID</option>
                    <option value="NIK">NIK</option>
                  </select>
                  <input
                    type="text"
                    value={nipKepala}
                    onChange={(e) => setNipKepala(e.target.value)}
                    placeholder="19780512 200501 1 003"
                    className="w-2/3 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-amber-300 font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-400" /> Kota / Tempat Penetapan
                </label>
                <input
                  type="text"
                  value={kotaPenetapan}
                  onChange={(e) => setKotaPenetapan(e.target.value)}
                  placeholder="Malang"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-400 font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-emerald-400" /> Tanggal Titimangsa Penetapan
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const today = new Date();
                        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                        setTanggalPenetapan(`${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`);
                      }}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded text-[10px] font-semibold"
                    >
                      Gunakan Hari Ini
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={tanggalPenetapan}
                  onChange={(e) => setTanggalPenetapan(e.target.value)}
                  placeholder="14 Juli 2025"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Sub Navigation for Signature Mode */}
          <div className="bg-slate-950/90 p-1 rounded-xl border border-slate-800 flex gap-1">
            <button
              onClick={() => setActiveSubTab('draw')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                activeSubTab === 'draw'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Gores Tanda Tangan (Canvas)</span>
            </button>

            <button
              onClick={() => setActiveSubTab('presets')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                activeSubTab === 'presets'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Pilihan Template TTD</span>
            </button>

            <button
              onClick={() => setActiveSubTab('upload')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                activeSubTab === 'upload'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah Berkas Gambar</span>
            </button>

            <button
              onClick={() => setActiveSubTab('stamp')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                activeSubTab === 'stamp'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Stamp className="w-3.5 h-3.5 text-violet-400" />
              <span>Stempel Cap Basah</span>
            </button>
          </div>

          {/* TAB 1: DRAW CANVAS */}
          {activeSubTab === 'draw' && (
            <div className="space-y-3">
              {/* Canvas Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-950/60 rounded-lg border border-slate-800">
                {/* Pen Colors */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">Tinta:</span>
                  {[
                    { color: '#0f172a', label: 'Hitam Formal' },
                    { color: '#1e3a8a', label: 'Biru Tua Kemenag' },
                    { color: '#2563eb', label: 'Biru Standar' },
                    { color: '#065f46', label: 'Hijau Emerald' },
                  ].map((item) => (
                    <button
                      key={item.color}
                      onClick={() => setPenColor(item.color)}
                      style={{ backgroundColor: item.color }}
                      className={`w-6 h-6 rounded-full border-2 transition ${
                        penColor === item.color ? 'border-amber-400 scale-110 shadow-sm' : 'border-slate-700 hover:scale-105'
                      }`}
                      title={item.label}
                    />
                  ))}
                </div>

                {/* Stroke Width Slider */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Ketebalan:</span>
                  <input
                    type="range"
                    min="1.5"
                    max="5"
                    step="0.5"
                    value={penWidth}
                    onChange={(e) => setPenWidth(parseFloat(e.target.value))}
                    className="w-20 accent-emerald-500 cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-slate-300 w-6">{penWidth}px</span>
                </div>

                {/* Canvas Action Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleUndo}
                    disabled={strokeHistory.length === 0}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg transition"
                    title="Urungkan Goresan Terakhir"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleClearCanvas}
                    className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded-lg font-medium flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Bersihkan</span>
                  </button>
                </div>
              </div>

              {/* The Interactive Drawing Canvas */}
              <div className="relative bg-white rounded-xl border-2 border-dashed border-emerald-500/60 shadow-inner flex flex-col items-center justify-center p-2">
                <canvas
                  ref={canvasRef}
                  width={480}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full max-w-[480px] h-[150px] cursor-crosshair touch-none bg-transparent"
                />

                {!hasDrawn && strokeHistory.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400">
                    <PenTool className="w-6 h-6 mb-1 opacity-50 text-emerald-600" />
                    <span className="font-semibold text-xs text-slate-600">
                      Sentuh atau gunakan kursor mouse untuk membuat tanda tangan
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Goresan akan otomatis diubah menjadi grafik transparan resolusi tinggi
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PRESET SIGNATURES */}
          {activeSubTab === 'presets' && (
            <div className="space-y-3">
              <p className="text-slate-400 text-[11px]">
                Pilih gaya kaligrafi tanda tangan otomatis yang dirancang khusus untuk Kepala Madrasah:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => handleSelectPreset('formal')}
                  className="p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-emerald-500 transition text-center space-y-2 group"
                >
                  <span className="font-bold text-white block text-xs">Gaya Formal Klasik</span>
                  <div className="h-16 flex items-center justify-center bg-white rounded-lg p-2 border border-slate-700">
                    <PrincipalSignature className="w-24 h-12" />
                  </div>
                  <span className="text-[10px] text-emerald-400 group-hover:underline">Gunakan Format Ini</span>
                </button>

                <button
                  onClick={() => handleSelectPreset('classic')}
                  className="p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-emerald-500 transition text-center space-y-2 group"
                >
                  <span className="font-bold text-white block text-xs">Gaya Kaligrafi Lengkung</span>
                  <div className="h-16 flex items-center justify-center bg-white rounded-lg p-2 border border-slate-700">
                    <svg viewBox="0 0 200 80" className="w-24 h-12 text-slate-900" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20,60 C40,10 70,20 80,60 C90,30 120,20 140,55 C160,80 180,30 190,40" strokeLinecap="round" />
                      <circle cx="50" cy="40" r="15" />
                    </svg>
                  </div>
                  <span className="text-[10px] text-emerald-400 group-hover:underline">Gunakan Format Ini</span>
                </button>

                <button
                  onClick={() => handleSelectPreset('modern')}
                  className="p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-emerald-500 transition text-center space-y-2 group"
                >
                  <span className="font-bold text-white block text-xs">Gaya Monogram Modern</span>
                  <div className="h-16 flex items-center justify-center bg-white rounded-lg p-2 border border-slate-700">
                    <svg viewBox="0 0 200 80" className="w-24 h-12 text-blue-900" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M25,50 Q70,10 110,55 Q150,20 180,45" strokeLinecap="round" />
                      <line x1="30" y1="65" x2="175" y2="60" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="text-[10px] text-emerald-400 group-hover:underline">Gunakan Format Ini</span>
                </button>
              </div>
            </div>
          )}

          {/* Feedback banner */}
          {transparencyFeedback && (
            <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/50 rounded-lg text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
              <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 animate-pulse" />
              <span>{transparencyFeedback}</span>
            </div>
          )}

          {/* TAB 3: UPLOAD SIGNATURE IMAGE */}
          {activeSubTab === 'upload' && (
            <div className="space-y-3">
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-center space-y-3">
                <Upload className="w-8 h-8 text-amber-400 mx-auto" />
                <div>
                  <h5 className="font-bold text-white text-xs flex items-center justify-center gap-1.5">
                    Unggah Berkas Scan Tanda Tangan
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] px-1.5 py-0.5 rounded-full font-normal flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> Auto-Transparan
                    </span>
                  </h5>
                  <p className="text-slate-400 text-[11px] mt-1">
                    Unggah foto tanda tangan dari kertas atau scan. Sistem secara otomatis menghilangkan latar belakang putih/kertas dan menjadikannya transparan berkualitas tinggi.
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadSignatureFile}
                  className="hidden"
                />

                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    disabled={isProcessingSig}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    {isProcessingSig ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{isProcessingSig ? 'Memproses Transparansi...' : 'Upload Foto / Scan TTD'}</span>
                  </button>

                  {customSignatureUrl && (
                    <>
                      <button
                        disabled={isProcessingSig}
                        onClick={() => handleMakeSigTransparentManual('auto', 'ultra')}
                        className="px-3 py-2 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                        title="Hilangkan latar belakang kertas / putih sekali lagi"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>✨ Auto Transparan</span>
                      </button>

                      <button
                        disabled={isProcessingSig}
                        onClick={() => handleMakeSigTransparentManual('pure_black', 'ultra')}
                        className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1 transition disabled:opacity-50"
                        title="Ubah tinta menjadi hitam formal pekat"
                      >
                        <span>✒️ Tinta Hitam Pekat</span>
                      </button>

                      <button
                        disabled={isProcessingSig}
                        onClick={() => handleMakeSigTransparentManual('kemenag_blue', 'ultra')}
                        className="px-2.5 py-2 bg-blue-950/60 hover:bg-blue-900 text-blue-300 border border-blue-700/80 rounded-lg text-xs font-semibold flex items-center gap-1 transition disabled:opacity-50"
                        title="Ubah tinta menjadi biru resmi Kemenag"
                      >
                        <span>🖋️ Tinta Biru Kemenag</span>
                      </button>

                      <button
                        onClick={() => setCustomSignatureUrl('')}
                        className="px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded-lg text-xs"
                      >
                        Hapus TTD
                      </button>
                    </>
                  )}
                </div>

                {/* Preview Box with Transparency Checkerboard */}
                {customSignatureUrl && (
                  <div className="mt-3 p-3 bg-slate-900 rounded-lg border border-slate-800 flex flex-col items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Hasil Tanda Tangan Transparan:
                    </span>
                    <div 
                      className="p-3 rounded border border-slate-700 max-w-xs flex items-center justify-center"
                      style={{
                        backgroundImage: `linear-gradient(45deg, #1e293b 25%, transparent 25%), 
                                          linear-gradient(-45deg, #1e293b 25%, transparent 25%), 
                                          linear-gradient(45deg, transparent 75%, #1e293b 75%), 
                                          linear-gradient(-45deg, transparent 75%, #1e293b 75%)`,
                        backgroundSize: '16px 16px',
                        backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                        backgroundColor: '#0f172a'
                      }}
                    >
                      <img
                        src={customSignatureUrl}
                        alt="Preview Tanda Tangan Transparan"
                        className="max-h-16 object-contain filter drop-shadow-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: STAMP MANAGER */}
          {activeSubTab === 'stamp' && (
            <div className="space-y-3">
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Stamp className="w-4 h-4 text-violet-400" />
                      Stempel Cap Basah Madrasah
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] px-1.5 py-0.5 rounded-full font-normal flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Auto-Transparan
                      </span>
                    </h5>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Stempel otomatis dibuatkan atau Anda dapat mengunggah foto stempel cap basah. Latar belakang putih/kertas akan dihilangkan otomatis!
                    </p>
                  </div>

                  <input
                    ref={stampFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadStampFile}
                    className="hidden"
                  />

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      disabled={isProcessingStamp}
                      onClick={() => stampFileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      {isProcessingStamp ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>{isProcessingStamp ? 'Memproses...' : 'Upload Cap / Foto Stempel'}</span>
                    </button>

                    {customStampUrl && (
                      <button
                        disabled={isProcessingStamp}
                        onClick={handleMakeStampTransparentManual}
                        className="px-2.5 py-1.5 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                        title="Buat transparan ulang"
                      >
                        <Wand2 className="w-3 h-3" />
                        <span>✨ Transparan</span>
                      </button>
                    )}
                  </div>
                </div>

                <div 
                  className="flex items-center justify-center p-4 rounded-xl border border-slate-800"
                  style={{
                    backgroundImage: `linear-gradient(45deg, #1e293b 25%, transparent 25%), 
                                      linear-gradient(-45deg, #1e293b 25%, transparent 25%), 
                                      linear-gradient(45deg, transparent 75%, #1e293b 75%), 
                                      linear-gradient(-45deg, transparent 75%, #1e293b 75%)`,
                    backgroundSize: '16px 16px',
                    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                    backgroundColor: '#0f172a'
                  }}
                >
                  {customStampUrl ? (
                    <img
                      src={customStampUrl}
                      alt="Stempel Custom Transparan"
                      className="w-24 h-24 object-contain opacity-95 -rotate-12 filter drop-shadow-sm"
                    />
                  ) : (
                    <OfficialStamp
                      schoolName={madrasah.namaMadrasah}
                      location={madrasah.kotaKab}
                      className="w-24 h-24"
                    />
                  )}
                </div>

                {customStampUrl && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setCustomStampUrl('')}
                      className="text-xs text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Kembalikan ke Stempel Otomatis Bawaan</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LIVE PREVIEW BOX */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-emerald-400" /> Pratinjau Tanda Tangan & Stempel di Kartu:
            </span>

            <div className="p-4 bg-white rounded-lg border border-slate-300 flex flex-col items-center justify-center text-center text-slate-800 shadow-sm max-w-sm mx-auto">
              <p className="text-[9px] text-slate-600">
                Ditetapkan di: <strong>{kotaPenetapan}</strong>
              </p>
              <p className="text-[9px] text-slate-600">
                Pada tanggal: <strong>{tanggalPenetapan}</strong>
              </p>
              <p className="text-[10px] font-bold text-emerald-950 uppercase mt-0.5">
                {jabatanPenandatangan || 'Kepala Madrasah'},
              </p>

              {/* Signature & Stamp Layer */}
              <div className="h-16 relative flex items-center justify-center my-1 w-48">
                {/* Stamp */}
                <div className="absolute -left-2 top-0 z-10">
                  {customStampUrl ? (
                    <img
                      src={customStampUrl}
                      alt="Stempel"
                      className="w-16 h-16 object-contain opacity-80 -rotate-12"
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
                  {customSignatureUrl ? (
                    <img
                      src={customSignatureUrl}
                      alt="Tanda Tangan"
                      className="w-32 h-14 object-contain"
                    />
                  ) : (
                    <PrincipalSignature className="w-32 h-14" />
                  )}
                </div>
              </div>

              <p className="text-[10px] font-extrabold text-slate-900 underline uppercase tracking-tight">
                {namaKepala}
              </p>
              <p className="text-[8.5px] font-mono text-slate-600">
                {labelIdPenandatangan ? `${labelIdPenandatangan}. ` : 'NIP. '}
                {nipKepala || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
          >
            Batal
          </button>

          <button
            onClick={handleSaveAll}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Simpan & Terapkan ke Kartu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
