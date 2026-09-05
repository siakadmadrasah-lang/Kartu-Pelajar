import React, { useState, useRef, useEffect } from 'react';
import { CardConfig, MadrasahInfo, Student } from '../types';
import { CardFront } from './CardFront';
import { CardBack } from './CardBack';
import { downloadCardElementAsPng, generateSingleStudentPdf } from '../utils/exportUtils';
import { 
  Rotate3d, 
  Download, 
  Printer, 
  FileText,
  Eye
} from 'lucide-react';

interface Card3DPreviewProps {
  student: Student;
  madrasah: MadrasahInfo;
  config: CardConfig;
  onOpenScanner?: () => void;
  onOpenPrintSheet?: () => void;
}

export const Card3DPreview: React.FC<Card3DPreviewProps> = ({
  student,
  madrasah,
  config,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [viewMode, setViewMode] = useState<'single-3d' | 'side-by-side'>('single-3d');
  const [isExporting, setIsExporting] = useState(false);
  
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);

  const isLandscape = config.orientation === 'landscape';
  const baseWidth = isLandscape ? 500 : 330;
  const baseHeight = isLandscape ? 315 : 480;

  // Dynamically compute responsive scale to ensure the card fits 100% on Android and all screens
  useEffect(() => {
    const updateScale = () => {
      if (stageContainerRef.current) {
        const availableWidth = stageContainerRef.current.clientWidth - 16; // minus safe padding
        if (availableWidth > 0) {
          const targetScale = Math.min(1, Math.max(0.45, availableWidth / baseWidth));
          setScale(targetScale);
        }
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (stageContainerRef.current) {
      observer.observe(stageContainerRef.current);
    }
    window.addEventListener('resize', updateScale);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [baseWidth, config.orientation]);

  const handleDownloadFront = async () => {
    setIsExporting(true);
    await downloadCardElementAsPng('card-front-export-target', `KARTU_PELAJAR_MI_DEPAN_${(student.nama || 'SISWA').replace(/\s+/g, '_')}.png`);
    setIsExporting(false);
  };

  const handleDownloadBack = async () => {
    setIsExporting(true);
    await downloadCardElementAsPng('card-back-export-target', `KARTU_PELAJAR_MI_BELAKANG_${(student.nama || 'SISWA').replace(/\s+/g, '_')}.png`);
    setIsExporting(false);
  };

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    await generateSingleStudentPdf(
      'card-front-export-target',
      'card-back-export-target',
      student.nama || 'SISWA',
      student.nisn || '0000000000'
    );
    setIsExporting(false);
  };

  const handleDirectPrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center w-full max-w-full overflow-hidden">
      {/* Top Controller Bar */}
      <div className="w-full bg-slate-800/90 backdrop-blur border border-slate-700/80 rounded-xl p-2.5 sm:p-3 mb-3 flex flex-wrap items-center justify-between gap-2 shadow-lg">
        {/* Left Side: View Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition active:scale-95"
            title="Putar / Balik Kartu"
          >
            <Rotate3d className={`w-3.5 h-3.5 transition-transform duration-500 ${isFlipped ? 'rotate-180 text-amber-300' : ''}`} />
            <span className="text-[11px] sm:text-xs">{isFlipped ? 'Sisi Depan' : 'Sisi Belakang'}</span>
          </button>

          <div className="bg-slate-900/60 p-0.5 rounded-lg border border-slate-700 flex items-center">
            <button
              onClick={() => setViewMode('single-3d')}
              className={`px-2 py-1 text-[11px] rounded font-medium transition ${
                viewMode === 'single-3d'
                  ? 'bg-slate-700 text-emerald-400 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Flip 3D
            </button>
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`px-2 py-1 text-[11px] rounded font-medium transition ${
                viewMode === 'side-by-side'
                  ? 'bg-slate-700 text-emerald-400 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2 Sisi
            </button>
          </div>
        </div>

        {/* Right Side: Quick Export/Print Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="relative group">
            <button
              disabled={isExporting}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="text-[11px] sm:text-xs">{isExporting ? '...' : 'Unduh'}</span>
            </button>

            {/* Dropdown Menu for Download */}
            <div className="absolute right-0 top-full mt-1 w-48 bg-slate-850 border border-slate-700 rounded-xl shadow-2xl py-1.5 hidden group-hover:block z-50 animate-in fade-in duration-150">
              <button
                onClick={handleDownloadFront}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-750 flex items-center gap-2"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Gambar Depan (PNG)</span>
              </button>
              <button
                onClick={handleDownloadBack}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-750 flex items-center gap-2"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Gambar Belakang (PNG)</span>
              </button>
              <div className="border-t border-slate-700/80 my-1" />
              <button
                onClick={handleDownloadPdf}
                className="w-full text-left px-3 py-2 text-xs text-emerald-300 font-bold hover:bg-slate-750 flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Format PDF (CR80)</span>
              </button>
            </div>
          </div>

          <button
            onClick={handleDirectPrint}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-slate-700 hover:bg-slate-650 text-slate-100 rounded-lg text-xs font-semibold shadow-sm transition active:scale-95"
            title="Cetak kartu langsung ke printer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-[11px] sm:text-xs">Print</span>
          </button>
        </div>
      </div>

      {/* Card Rendering Container with Auto Scale */}
      <div 
        ref={stageContainerRef}
        className="w-full flex flex-col items-center justify-center p-2.5 sm:p-5 bg-slate-950/70 rounded-2xl border border-slate-800/80 shadow-inner relative overflow-hidden min-h-[260px] sm:min-h-[360px]"
      >
        {/* Perspective Stage */}
        {viewMode === 'single-3d' ? (
          <div className="flex flex-col items-center py-2">
            {/* Scaled viewport container box */}
            <div
              style={{
                width: `${baseWidth * scale}px`,
                height: `${baseHeight * scale}px`,
              }}
              className="relative transition-all duration-300 ease-out"
            >
              <div
                className="relative cursor-pointer select-none perspective-1000 group origin-top-left"
                onClick={() => setIsFlipped(!isFlipped)}
                title="Klik untuk membalik kartu"
                style={{
                  width: `${baseWidth}px`,
                  height: `${baseHeight}px`,
                  transform: `scale(${scale})`,
                  transformOrigin: '0 0',
                }}
              >
                {/* Visual 3D Flip Card Container */}
                <div
                  className={`relative transition-all duration-700 ease-out transform-style-3d ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}
                  style={{
                    width: `${baseWidth}px`,
                    height: `${baseHeight}px`,
                    transformStyle: 'preserve-3d',
                    WebkitTransformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    WebkitTransform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  }}
                >
                  {/* Front Face */}
                  <div
                    className="backface-hidden shadow-2xl rounded-xl transition-shadow duration-300 group-hover:shadow-emerald-900/30"
                    style={{ 
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      width: `${baseWidth}px`,
                      height: `${baseHeight}px` 
                    }}
                  >
                    <CardFront
                      student={student}
                      madrasah={madrasah}
                      config={config}
                      elementId="card-front-interactive"
                    />
                  </div>

                  {/* Back Face */}
                  <div
                    className="absolute inset-0 backface-hidden shadow-2xl rounded-xl"
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      WebkitTransform: 'rotateY(180deg)',
                      width: `${baseWidth}px`,
                      height: `${baseHeight}px`
                    }}
                  >
                    <CardBack
                      student={student}
                      madrasah={madrasah}
                      config={config}
                      elementId="card-back-interactive"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Click to flip badge overlay */}
            <div 
              onClick={() => setIsFlipped(!isFlipped)}
              className="mt-3 cursor-pointer hover:bg-slate-800 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium text-slate-300 bg-slate-900/90 px-3 py-1 rounded-full border border-slate-700/80 shadow-md transition active:scale-95"
            >
              <Rotate3d className="w-3 h-3 text-emerald-400 animate-spin-slow" />
              <span>Klik kartu untuk membalik ({isFlipped ? 'Sisi Belakang' : 'Sisi Depan'})</span>
            </div>
          </div>
        ) : (
          /* SIDE BY SIDE VIEW - WITH RESPONSIVE SCALING */
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 py-2 w-full">
            {/* FRONT SIDE */}
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> Tampak Depan
              </span>
              <div
                style={{
                  width: `${baseWidth * scale}px`,
                  height: `${baseHeight * scale}px`,
                }}
                className="relative"
              >
                <div
                  style={{
                    width: `${baseWidth}px`,
                    height: `${baseHeight}px`,
                    transform: `scale(${scale})`,
                    transformOrigin: '0 0',
                  }}
                  className="shadow-2xl rounded-xl border border-slate-700/50"
                >
                  <CardFront
                    student={student}
                    madrasah={madrasah}
                    config={config}
                    elementId="card-front-interactive"
                  />
                </div>
              </div>
            </div>

            {/* BACK SIDE */}
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> Tampak Belakang
              </span>
              <div
                style={{
                  width: `${baseWidth * scale}px`,
                  height: `${baseHeight * scale}px`,
                }}
                className="relative"
              >
                <div
                  style={{
                    width: `${baseWidth}px`,
                    height: `${baseHeight}px`,
                    transform: `scale(${scale})`,
                    transformOrigin: '0 0',
                  }}
                  className="shadow-2xl rounded-xl border border-slate-700/50"
                >
                  <CardBack
                    student={student}
                    madrasah={madrasah}
                    config={config}
                    elementId="card-back-interactive"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden high-DPI export targets to avoid scale glitches during PNG/PDF generation */}
      <div className="fixed -left-[9999px] -top-[9999px] pointer-events-none opacity-0">
        <CardFront
          student={student}
          madrasah={madrasah}
          config={config}
          elementId="card-front-export-target"
        />
        <CardBack
          student={student}
          madrasah={madrasah}
          config={config}
          elementId="card-back-export-target"
        />
      </div>
    </div>
  );
};

