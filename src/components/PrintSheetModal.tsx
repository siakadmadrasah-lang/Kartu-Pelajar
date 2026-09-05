import React, { useState, useMemo, useRef } from 'react';
import { CardConfig, MadrasahInfo, Student } from '../types';
import { CardFront } from './CardFront';
import { CardBack } from './CardBack';
import { 
  Printer, 
  X, 
  LayoutGrid, 
  CheckSquare, 
  Square, 
  Info, 
  Search, 
  UserCheck, 
  GraduationCap, 
  Download, 
  Sliders, 
  Scissors, 
  FileText,
  FileCheck,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { ensureFontsAndImagesReady } from '../utils/exportUtils';

interface PrintSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  madrasah: MadrasahInfo;
  config: CardConfig;
  initialSelectedStudentIds?: string[];
}

type PrintMode = 'both_paired' | 'front_only' | 'back_only' | 'duplex_pvc';

export const PrintSheetModal: React.FC<PrintSheetModalProps> = ({
  isOpen,
  onClose,
  students,
  madrasah,
  config,
  initialSelectedStudentIds,
}) => {
  // Student selection state
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (initialSelectedStudentIds && initialSelectedStudentIds.length > 0) {
      return initialSelectedStudentIds;
    }
    return students.map((s) => s.id);
  });

  // Sync selected IDs when modal is opened
  React.useEffect(() => {
    if (isOpen) {
      if (initialSelectedStudentIds && initialSelectedStudentIds.length > 0) {
        setSelectedIds(initialSelectedStudentIds);
      } else if (selectedIds.length === 0 && students.length > 0) {
        setSelectedIds(students.map((s) => s.id));
      }
    }
  }, [isOpen, initialSelectedStudentIds]);

  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [printMode, setPrintMode] = useState<PrintMode>('both_paired');
  const [cardsCapacity, setCardsCapacity] = useState<'8' | '4'>('8'); // Default 8 cards = 4 siswa (2 Kolom x 4 Baris: Penuh 1 Halaman A4)
  const [showCropMarks, setShowCropMarks] = useState(true);
  const [showBorderLines, setShowBorderLines] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Distinct classes for filter
  const distinctClasses = useMemo(() => {
    const classList: string[] = Array.from(new Set(students.map((s) => s.kelas?.trim() || 'Tanpa Kelas')));
    return classList.sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [students]);

  // Filtered students for student list
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nisn.includes(searchTerm) ||
        s.nis.includes(searchTerm);
      const matchClass = classFilter === 'ALL' || (s.kelas?.trim() || 'Tanpa Kelas') === classFilter;
      return matchSearch && matchClass;
    });
  }, [students, searchTerm, classFilter]);

  // Selected students in order
  const selectedStudents = useMemo(() => {
    return students.filter((s) => selectedIds.includes(s.id));
  }, [students, selectedIds]);

  // Toggle single student selection
  const toggleSelectStudent = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select all students
  const handleSelectAll = () => {
    if (selectedIds.length === students.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(students.map((s) => s.id));
    }
  };

  // Select filtered students only
  const handleSelectFiltered = () => {
    const filteredIds = filteredStudents.map((s) => s.id);
    const allFilteredSelected = filteredIds.every((id) => selectedIds.includes(id));
    if (allFilteredSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  // Select by specific class
  const handleSelectClass = (clsName: string) => {
    const classIds = students.filter((s) => (s.kelas?.trim() || 'Tanpa Kelas') === clsName).map((s) => s.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...classIds])));
  };

  // Deselect all
  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  // -------------------------------------------------------------
  // BUILD A4 PRINT SHEET PAGES (4 Siswa / 8 Kartu OR 2 Siswa / 4 Kartu)
  // -------------------------------------------------------------
  interface CardSlot {
    student: Student;
    side: 'front' | 'back';
    key: string;
  }

  interface SheetPage {
    pageNumber: number;
    title: string;
    cards: (CardSlot | null)[];
  }

  const generatedPages: SheetPage[] = useMemo(() => {
    if (selectedStudents.length === 0) return [];

    const pages: SheetPage[] = [];

    if (cardsCapacity === '8') {
      // -------------------------------------------------------------
      // 8 CARDS PER A4 SHEET (4 STUDENTS FRONT & BACK = 2 COLS × 4 ROWS)
      // -------------------------------------------------------------
      if (printMode === 'both_paired') {
        // 4 Students per sheet = 8 cards (Row 1: S1 F/B, Row 2: S2 F/B, Row 3: S3 F/B, Row 4: S4 F/B)
        for (let i = 0; i < selectedStudents.length; i += 4) {
          const s1 = selectedStudents[i];
          const s2 = selectedStudents[i + 1] || null;
          const s3 = selectedStudents[i + 2] || null;
          const s4 = selectedStudents[i + 3] || null;

          const cards: (CardSlot | null)[] = [
            { student: s1, side: 'front', key: `${s1.id}-front` },
            { student: s1, side: 'back', key: `${s1.id}-back` },
            s2 ? { student: s2, side: 'front', key: `${s2.id}-front` } : null,
            s2 ? { student: s2, side: 'back', key: `${s2.id}-back` } : null,
            s3 ? { student: s3, side: 'front', key: `${s3.id}-front` } : null,
            s3 ? { student: s3, side: 'back', key: `${s3.id}-back` } : null,
            s4 ? { student: s4, side: 'front', key: `${s4.id}-front` } : null,
            s4 ? { student: s4, side: 'back', key: `${s4.id}-back` } : null,
          ];

          const studentNames = [s1, s2, s3, s4].filter(Boolean).map((s) => s?.nama).join(', ');
          pages.push({
            pageNumber: pages.length + 1,
            title: `Lembar A4 #${pages.length + 1} (${studentNames})`,
            cards,
          });
        }
      } else if (printMode === 'front_only') {
        // 8 Students per sheet = 8 Front cards (2 cols x 4 rows)
        for (let i = 0; i < selectedStudents.length; i += 8) {
          const chunk = selectedStudents.slice(i, i + 8);
          const cards: (CardSlot | null)[] = Array(8).fill(null).map((_, idx) =>
            chunk[idx] ? { student: chunk[idx], side: 'front', key: `${chunk[idx].id}-front-${idx}` } : null
          );

          pages.push({
            pageNumber: pages.length + 1,
            title: `Lembar A4 #${pages.length + 1} - 8 Kartu Depan (${chunk.length} Siswa)`,
            cards,
          });
        }
      } else if (printMode === 'back_only') {
        // 8 Students per sheet = 8 Back cards (2 cols x 4 rows)
        for (let i = 0; i < selectedStudents.length; i += 8) {
          const chunk = selectedStudents.slice(i, i + 8);
          const cards: (CardSlot | null)[] = Array(8).fill(null).map((_, idx) =>
            chunk[idx] ? { student: chunk[idx], side: 'back', key: `${chunk[idx].id}-back-${idx}` } : null
          );

          pages.push({
            pageNumber: pages.length + 1,
            title: `Lembar A4 #${pages.length + 1} - 8 Kartu Belakang (${chunk.length} Siswa)`,
            cards,
          });
        }
      } else if (printMode === 'duplex_pvc') {
        // Duplex 8 cards: Page 1 Front (8 cards), Page 2 Back (8 cards mirrored per row)
        for (let i = 0; i < selectedStudents.length; i += 8) {
          const chunk = selectedStudents.slice(i, i + 8);

          // Page A: Front [0, 1 / 2, 3 / 4, 5 / 6, 7]
          const frontCards: (CardSlot | null)[] = Array(8).fill(null).map((_, idx) =>
            chunk[idx] ? { student: chunk[idx], side: 'front', key: `${chunk[idx].id}-f-${idx}` } : null
          );

          // Page B: Back Mirrored per row [1, 0 / 3, 2 / 5, 4 / 7, 6]
          const backIndices = [1, 0, 3, 2, 5, 4, 7, 6];
          const backCards: (CardSlot | null)[] = backIndices.map((origIdx) =>
            chunk[origIdx] ? { student: chunk[origIdx], side: 'back', key: `${chunk[origIdx].id}-b-${origIdx}` } : null
          );

          pages.push({
            pageNumber: pages.length + 1,
            title: `Halaman Ganjil (Depan) - Batch ${Math.floor(i / 8) + 1}`,
            cards: frontCards,
          });

          pages.push({
            pageNumber: pages.length + 1,
            title: `Halaman Genap (Belakang Duplex Mirrored) - Batch ${Math.floor(i / 8) + 1}`,
            cards: backCards,
          });
        }
      }
    } else {
      // -------------------------------------------------------------
      // 4 CARDS PER A4 SHEET (2 STUDENTS FRONT & BACK = 2 COLS × 2 ROWS)
      // -------------------------------------------------------------
      if (printMode === 'both_paired') {
        for (let i = 0; i < selectedStudents.length; i += 2) {
          const s1 = selectedStudents[i];
          const s2 = selectedStudents[i + 1] || null;

          const cards: (CardSlot | null)[] = [
            { student: s1, side: 'front', key: `${s1.id}-front` },
            { student: s1, side: 'back', key: `${s1.id}-back` },
            s2 ? { student: s2, side: 'front', key: `${s2.id}-front` } : null,
            s2 ? { student: s2, side: 'back', key: `${s2.id}-back` } : null,
          ];

          pages.push({
            pageNumber: pages.length + 1,
            title: `Lembar A4 #${pages.length + 1} (${s1.nama}${s2 ? ` & ${s2.nama}` : ''})`,
            cards,
          });
        }
      } else if (printMode === 'front_only') {
        for (let i = 0; i < selectedStudents.length; i += 4) {
          const chunk = selectedStudents.slice(i, i + 4);
          const cards: (CardSlot | null)[] = [
            chunk[0] ? { student: chunk[0], side: 'front', key: `${chunk[0].id}-front` } : null,
            chunk[1] ? { student: chunk[1], side: 'front', key: `${chunk[1].id}-front` } : null,
            chunk[2] ? { student: chunk[2], side: 'front', key: `${chunk[2].id}-front` } : null,
            chunk[3] ? { student: chunk[3], side: 'front', key: `${chunk[3].id}-front` } : null,
          ];

          pages.push({
            pageNumber: pages.length + 1,
            title: `Lembar A4 #${pages.length + 1} - Sisi Depan (${chunk.length} Siswa)`,
            cards,
          });
        }
      } else if (printMode === 'back_only') {
        for (let i = 0; i < selectedStudents.length; i += 4) {
          const chunk = selectedStudents.slice(i, i + 4);
          const cards: (CardSlot | null)[] = [
            chunk[0] ? { student: chunk[0], side: 'back', key: `${chunk[0].id}-back` } : null,
            chunk[1] ? { student: chunk[1], side: 'back', key: `${chunk[1].id}-back` } : null,
            chunk[2] ? { student: chunk[2], side: 'back', key: `${chunk[2].id}-back` } : null,
            chunk[3] ? { student: chunk[3], side: 'back', key: `${chunk[3].id}-back` } : null,
          ];

          pages.push({
            pageNumber: pages.length + 1,
            title: `Lembar A4 #${pages.length + 1} - Sisi Belakang (${chunk.length} Siswa)`,
            cards,
          });
        }
      } else if (printMode === 'duplex_pvc') {
        for (let i = 0; i < selectedStudents.length; i += 4) {
          const chunk = selectedStudents.slice(i, i + 4);

          const frontCards: (CardSlot | null)[] = [
            chunk[0] ? { student: chunk[0], side: 'front', key: `${chunk[0].id}-f` } : null,
            chunk[1] ? { student: chunk[1], side: 'front', key: `${chunk[1].id}-f` } : null,
            chunk[2] ? { student: chunk[2], side: 'front', key: `${chunk[2].id}-f` } : null,
            chunk[3] ? { student: chunk[3], side: 'front', key: `${chunk[3].id}-f` } : null,
          ];

          const backCards: (CardSlot | null)[] = [
            chunk[1] ? { student: chunk[1], side: 'back', key: `${chunk[1].id}-b` } : null,
            chunk[0] ? { student: chunk[0], side: 'back', key: `${chunk[0].id}-b` } : null,
            chunk[3] ? { student: chunk[3], side: 'back', key: `${chunk[3].id}-b` } : null,
            chunk[2] ? { student: chunk[2], side: 'back', key: `${chunk[2].id}-b` } : null,
          ];

          pages.push({
            pageNumber: pages.length + 1,
            title: `Halaman Ganjil (Depan) - Batch ${Math.floor(i / 4) + 1}`,
            cards: frontCards,
          });

          pages.push({
            pageNumber: pages.length + 1,
            title: `Halaman Genap (Belakang Duplex Mirrored) - Batch ${Math.floor(i / 4) + 1}`,
            cards: backCards,
          });
        }
      }
    }

    return pages;
  }, [selectedStudents, printMode, cardsCapacity]);

  // Handle Standard Browser Print
  const handlePrint = () => {
    window.print();
  };

  // Handle Download Multi-Page A4 PDF
  const handleDownloadPdf = async () => {
    if (generatedPages.length === 0) return;
    try {
      setIsExportingPdf(true);
      setExportProgress(10);

      // Create jsPDF A4 Document in Portrait (210mm x 297mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageElements = document.querySelectorAll('.a4-print-page');

      // Guarantee all fonts, layouts and images are settled across Chrome, Safari, Firefox, Edge
      await ensureFontsAndImagesReady();

      for (let index = 0; index < pageElements.length; index++) {
        const pageEl = pageElements[index] as HTMLElement;
        if (!pageEl) continue;

        setExportProgress(Math.round(((index + 1) / pageElements.length) * 85));

        // High quality rendering with cross-browser fallback
        let pageImg: string;
        const renderOpts = {
          quality: 0.98,
          pixelRatio: 2.5,
          backgroundColor: '#ffffff',
          cacheBust: true,
        };

        try {
          pageImg = await toPng(pageEl, renderOpts);
        } catch (renderErr) {
          await new Promise((r) => setTimeout(r, 100));
          pageImg = await toPng(pageEl, renderOpts);
        }

        if (index > 0) {
          pdf.addPage('a4', 'portrait');
        }

        // Fit image into A4 page (210mm x 297mm) with small margins
        pdf.addImage(pageImg, 'PNG', 0, 0, 210, 297);
      }

      setExportProgress(100);
      const filename = `KARTU_PELAJAR_A4_2KOLOM_${madrasah.namaMadrasah.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('Error exporting PDF sheet:', err);
      alert('Gagal mengekspor PDF, silakan gunakan tombol Cetak Langsung / Print Browser.');
    } finally {
      setIsExportingPdf(false);
      setExportProgress(0);
    }
  };

  const isPortrait = config.orientation === 'portrait';
  // Precise scale math for A4 (210mm x 297mm):
  // Card base unscaled: Portrait = 330px x 480px, Landscape = 500px x 315px
  const cardScale = cardsCapacity === '8' 
    ? (isPortrait ? 0.48 : 0.58)
    : (isPortrait ? 0.65 : 0.68);
  const cardWidth = isPortrait 
    ? (cardsCapacity === '8' ? 158.4 : 214.5) 
    : (cardsCapacity === '8' ? 290 : 340);
  const cardHeight = isPortrait 
    ? (cardsCapacity === '8' ? 230.4 : 312) 
    : (cardsCapacity === '8' ? 182.7 : 214.2);

  if (!isOpen) return null;

  return (
    <div className="print-modal-overlay fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-start justify-center p-2 sm:p-4 pt-3 sm:pt-4 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
      <div className="print-modal-container bg-slate-900 border border-slate-700/80 rounded-xl sm:rounded-2xl w-full max-w-7xl my-1 sm:my-auto max-h-[94dvh] sm:max-h-[96vh] flex flex-col shadow-2xl overflow-hidden print:max-h-none print:border-none print:shadow-none print:bg-white print:overflow-visible print:w-full print:max-w-none print:my-0">
        
        {/* MODAL HEADER (No Print) - Streamlined & Compact */}
        <div className="px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-700/80 flex items-center justify-between no-print gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Back Button */}
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition active:scale-95 flex-shrink-0"
              title="Kembali ke Dashboard"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span>Kembali</span>
            </button>

            <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 flex-shrink-0 hidden sm:block">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="text-xs sm:text-sm font-black text-white truncate max-w-[140px] xs:max-w-[200px] sm:max-w-none">
                  Cetak Lembar A4
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hidden xs:inline-block">
                  {cardsCapacity === '8' ? '4 Siswa/Lembar' : '2 Siswa/Lembar'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-auto">
            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={selectedStudents.length === 0 || isExportingPdf}
              className="p-1.5 sm:px-3 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 hover:border-amber-400/60 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition active:scale-95 disabled:opacity-50"
              title="Unduh Lembar Siap Cetak format PDF Multi-Halaman"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{isExportingPdf ? `PDF (${exportProgress}%)...` : 'Unduh PDF'}</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              disabled={selectedStudents.length === 0}
              className="px-2.5 sm:px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-lg flex items-center gap-1.5 shadow-md transition active:scale-95 disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="truncate max-w-[120px] xs:max-w-none">Cetak ({selectedStudents.length} Siswa)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MODAL CONTROLS BAR (No Print) - Compact 1-liner */}
        <div className="px-3 sm:px-5 py-2 bg-slate-850/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs no-print">
          {/* Capacity Switcher & Print Mode Switcher */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Muatan Halaman A4 */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold flex items-center gap-1 text-[11px]">
                <Layers className="w-3 h-3 text-emerald-400" /> Muatan Lembar:
              </span>
              <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-700 flex gap-0.5">
                <button
                  type="button"
                  onClick={() => setCardsCapacity('8')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
                    cardsCapacity === '8'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="1 Lembar A4 memuat 4 Siswa (8 Kartu Depan & Belakang: Penuh & Hemat Kertas)"
                >
                  <span>4 Siswa (8 Kartu / Lembar)</span>
                  <span className="px-1 py-0.2 bg-emerald-500/40 text-emerald-100 text-[8.5px] rounded">Penuh</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCardsCapacity('4')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition ${
                    cardsCapacity === '4'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="1 Lembar A4 memuat 2 Siswa (4 Kartu)"
                >
                  2 Siswa (4 Kartu)
                </button>
              </div>
            </div>

            {/* Print Mode Switcher */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold flex items-center gap-1 text-[11px]">
                <Sliders className="w-3 h-3 text-emerald-400" /> Mode:
              </span>
              <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-700 flex flex-wrap gap-0.5">
                <button
                  onClick={() => setPrintMode('both_paired')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition ${
                    printMode === 'both_paired'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Depan & Belakang berdampingan dalam 2 kolom"
                >
                  Depan & Belakang
                </button>
                <button
                  onClick={() => setPrintMode('front_only')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition ${
                    printMode === 'front_only'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Hanya sisi depan kartu"
                >
                  Depan Saja
                </button>
                <button
                  onClick={() => setPrintMode('back_only')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition ${
                    printMode === 'back_only'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Hanya sisi belakang kartu"
                >
                  Belakang Saja
                </button>
                <button
                  onClick={() => setPrintMode('duplex_pvc')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition ${
                    printMode === 'duplex_pvc'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Cetak Bolak-Balik: Halaman 1 Depan, Halaman 2 Belakang Mirrored"
                >
                  Duplex PVC
                </button>
              </div>
            </div>
          </div>

          {/* Crop marks & Border options */}
          <div className="flex items-center gap-3 text-[11px]">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 font-medium select-none">
              <input
                type="checkbox"
                checked={showCropMarks}
                onChange={(e) => setShowCropMarks(e.target.checked)}
                className="w-3.5 h-3.5 text-emerald-600 rounded bg-slate-800 border-slate-700 focus:ring-emerald-500"
              />
              <span className="flex items-center gap-1">
                <Scissors className="w-3 h-3 text-amber-400" /> Crop Marks
              </span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 font-medium select-none">
              <input
                type="checkbox"
                checked={showBorderLines}
                onChange={(e) => setShowBorderLines(e.target.checked)}
                className="w-3.5 h-3.5 text-emerald-600 rounded bg-slate-800 border-slate-700 focus:ring-emerald-500"
              />
              <span>Garis Tepi</span>
            </label>

            <div className="hidden sm:block font-mono text-[10.5px] text-amber-300 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              {selectedStudents.length} Siswa • {generatedPages.length} Lembar
            </div>
          </div>
        </div>

        {/* MAIN BODY: SPLIT VIEW (Student Selection on Left, Live 2-Column Sheet Preview on Right) */}
        <div className="print-modal-body flex-1 overflow-y-auto flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-800 print:overflow-visible print:divide-none">
          
          {/* LEFT COLUMN: STUDENT SELECTOR BY NAME & CLASS (No Print) */}
          <div className="w-full lg:w-[340px] xl:w-[380px] p-4 bg-slate-900/95 space-y-3.5 overflow-y-auto max-h-[300px] lg:max-h-[calc(96vh-165px)] no-print flex-shrink-0">
            
            {/* Header & Quick Action Buttons */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-black text-white uppercase tracking-wider">
                  Pilih Nama Siswa ({selectedStudents.length}/{students.length})
                </h4>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  onClick={handleSelectAll}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold transition"
                >
                  {selectedIds.length === students.length ? 'Batal Semua' : 'Pilih Semua'}
                </button>
              </div>
            </div>

            {/* Live Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama siswa, NISN, atau kelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Class Filter Tabs / Badges */}
            {distinctClasses.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-amber-400" /> Filter Kelas:
                  </span>
                  {classFilter !== 'ALL' && (
                    <button
                      onClick={() => handleSelectClass(classFilter)}
                      className="text-emerald-400 font-semibold hover:underline"
                    >
                      Pilih Semua di Kelas Ini
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  <button
                    onClick={() => setClassFilter('ALL')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition ${
                      classFilter === 'ALL'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Semua ({students.length})
                  </button>
                  {distinctClasses.map((cls) => {
                    const countInClass = students.filter((s) => (s.kelas?.trim() || 'Tanpa Kelas') === cls).length;
                    return (
                      <button
                        key={cls}
                        onClick={() => setClassFilter(cls)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition ${
                          classFilter === cls
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {cls} ({countInClass})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selected Student Chips / Quick List */}
            {selectedStudents.length > 0 && (
              <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
                  <span>Nama Siswa Terpilih ({selectedStudents.length}):</span>
                  <button
                    onClick={handleClearSelection}
                    className="text-rose-400 hover:text-rose-300 font-normal lowercase"
                  >
                    kosongkan
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {selectedStudents.map((s) => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                    >
                      <span className="truncate max-w-[120px]">{s.nama}</span>
                      <button
                        onClick={() => toggleSelectStudent(s.id)}
                        className="hover:text-rose-400 font-bold"
                        title="Hapus dari cetak"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Checklist of Students */}
            <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  Tidak ditemukan siswa dengan kata kunci "{searchTerm}".
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const isSelected = selectedIds.includes(student.id);
                  return (
                    <div
                      key={student.id}
                      onClick={() => toggleSelectStudent(student.id)}
                      className={`p-2 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition select-none ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-white'
                          : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Checkbox Icon */}
                        <div className="flex-shrink-0">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                        </div>

                        {/* Thumbnail */}
                        <img
                          src={student.fotoUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100&fit=crop'}
                          alt={student.nama}
                          className="w-7 h-9 object-cover rounded-md border border-slate-700 bg-slate-900 flex-shrink-0"
                        />

                        {/* Name & Details */}
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-white truncate leading-tight">
                            {student.nama}
                          </h5>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                            <span className="font-mono text-amber-300">{student.nisn || student.nis}</span>
                            <span>•</span>
                            <span className="text-emerald-400 truncate">{student.kelas}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Pill */}
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {isSelected ? 'CETAK' : 'PILIH'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: LIVE 2-COLUMN A4 SHEET PREVIEW */}
          <div className="print-modal-preview-wrapper flex-1 p-4 sm:p-6 bg-slate-950 flex flex-col items-center justify-start overflow-y-auto max-h-none lg:max-h-[calc(96vh-165px)] print:p-0 print:bg-white print:max-h-none print:overflow-visible">
            
            {/* Empty State */}
            {selectedStudents.length === 0 ? (
              <div className="my-auto text-center py-12 px-6 bg-slate-900/60 rounded-2xl border border-slate-800 max-w-md space-y-3">
                <UserCheck className="w-12 h-12 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-white">Belum Ada Siswa yang Dipilih</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Silakan centang nama siswa pada panel daftar di sebelah kiri untuk melihat pratinjau lembar cetak 2 kolom (4 kartu/lembar).
                </p>
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md"
                >
                  Pilih Semua Siswa ({students.length})
                </button>
              </div>
            ) : (
              /* TARGET PRINTABLE A4 SHEETS */
              <div id="printable-a4-sheet" className="w-full max-w-[840px] space-y-8 print:space-y-0 print:max-w-none">
                {generatedPages.map((page, pageIdx) => (
                  <div
                    key={`page-${page.pageNumber}-${pageIdx}`}
                    className="a4-print-page bg-white text-black rounded-xl p-6 sm:p-8 shadow-2xl border border-slate-300 print:rounded-none print:shadow-none print:border-none print:p-0 print:m-0"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    {/* Header Sheet (Hidden in Print) */}
                    <div className="flex items-center justify-between pb-2.5 mb-4 border-b border-slate-200 text-xs no-print">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[11px] font-black">
                          Lembar #{page.pageNumber}
                        </span>
                        <span className="font-bold text-slate-700 truncate max-w-[320px]">{page.title}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Ukuran: <strong>A4 Portrait</strong> • Tata Letak: <strong>{cardsCapacity === '8' ? '2 Kolom × 4 Baris (4 Siswa • 8 Kartu Penuh)' : '2 Kolom × 2 Baris (2 Siswa • 4 Kartu)'}</strong>
                      </span>
                    </div>

                    {/* 2-COLUMN GRID (2 COLUMNS × 4 ROWS OR 2 COLUMNS × 2 ROWS) */}
                    <div
                      className={`a4-card-grid grid grid-cols-2 ${
                        cardsCapacity === '8'
                          ? 'gap-x-3 gap-y-2 sm:gap-x-4 sm:gap-y-2'
                          : 'gap-x-6 gap-y-6 sm:gap-x-8 sm:gap-y-8'
                      } justify-items-center items-center`}
                    >
                      {page.cards.map((slot, slotIdx) => {
                        if (!slot) {
                          // Empty slot placeholder to maintain grid alignment
                          return (
                            <div
                              key={`empty-${pageIdx}-${slotIdx}`}
                              className="a4-card-slot border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-300 text-xs print:invisible"
                              style={{
                                width: `${cardWidth}px`,
                                height: `${cardHeight}px`,
                              }}
                            >
                              (Slot Kosong)
                            </div>
                          );
                        }

                        const { student, side } = slot;

                        return (
                          <div
                            key={slot.key}
                            className="a4-card-slot flex flex-col items-center justify-center relative group"
                          >
                            {/* Card Item Wrapper with Scaled Dimensions */}
                            <div
                              className={`relative transition-all ${
                                showCropMarks
                                  ? 'p-1 border border-dashed border-slate-400 print:border-slate-400'
                                  : ''
                              } ${showBorderLines ? 'ring-1 ring-slate-400' : ''}`}
                            >
                              {/* Corner Crop Marks for Precision Cutting */}
                              {showCropMarks && (
                                <>
                                  <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-slate-600 print:border-black pointer-events-none" />
                                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-slate-600 print:border-black pointer-events-none" />
                                  <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-slate-600 print:border-black pointer-events-none" />
                                  <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-slate-600 print:border-black pointer-events-none" />
                                </>
                              )}

                              {/* Scaled CR80 Card Component */}
                              <div
                                style={{
                                  width: `${cardWidth}px`,
                                  height: `${cardHeight}px`,
                                  overflow: 'hidden',
                                  position: 'relative',
                                }}
                              >
                                {side === 'front' ? (
                                  <CardFront
                                    student={student}
                                    madrasah={madrasah}
                                    config={config}
                                    elementId={`sheet-${student.id}-front-${pageIdx}-${slotIdx}`}
                                    scale={cardScale}
                                  />
                                ) : (
                                  <CardBack
                                    student={student}
                                    madrasah={madrasah}
                                    config={config}
                                    elementId={`sheet-${student.id}-back-${pageIdx}-${slotIdx}`}
                                    scale={cardScale}
                                  />
                                )}
                              </div>
                            </div>

                            {/* Card Label Subtitle (No Print) */}
                            <div
                              className="mt-0.5 flex items-center justify-between px-1 text-[9px] text-slate-500 no-print"
                              style={{ width: `${cardWidth}px` }}
                            >
                              <span className="font-bold truncate max-w-[200px]">
                                {student.nama} ({side === 'front' ? 'Depan' : 'Belakang'})
                              </span>
                              <span className="font-mono text-[8.5px] text-slate-400">{student.nisn}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Sheet Footer Info (Only printed subtly at bottom) */}
                    <div className="mt-4 pt-2 border-t border-slate-200 flex items-center justify-between text-[7.5px] text-slate-500 print:text-[7.5px] print:mt-2 print:pt-1">
                      <span>{madrasah.namaMadrasah} • NSM: {madrasah.nsm}</span>
                      <span>Format Standar CR80 PVC ({cardsCapacity === '8' ? '2 Kolom × 4 Baris • 4 Siswa/Lembar' : '2 Kolom × 2 Baris'}) • Lembar {page.pageNumber} dari {generatedPages.length}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
