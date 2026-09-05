import React, { useRef, useState, useMemo } from 'react';
import { Student, StudentImportMode } from '../types';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Users, 
  ArrowRight, 
  HelpCircle,
  FileCheck,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  Trash2
} from 'lucide-react';
import { parseEmisExcelFile, downloadEmisExcelTemplate } from '../utils/excelUtils';

interface EmisExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (newStudents: Student[], mode: StudentImportMode) => Promise<void> | void;
  currentStudentCount: number;
  existingStudents?: Student[];
}

export const EmisExcelImportModal: React.FC<EmisExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  currentStudentCount,
  existingStudents = [],
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<StudentImportMode>('merge');
  const [parsedResult, setParsedResult] = useState<{
    students: Student[];
    totalRows: number;
    validCount: number;
    warnings: string[];
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const stats = useMemo(() => {
    if (!parsedResult || !parsedResult.students) {
      return { updateCount: 0, newCount: 0, preservedCount: existingStudents.length, finalTotal: existingStudents.length };
    }

    const imported = parsedResult.students;
    let updates = 0;
    let additions = 0;

    const existingNisns = new Set(existingStudents.map(s => s.nisn).filter(Boolean));
    const existingNis = new Set(existingStudents.map(s => s.nis).filter(Boolean));
    const existingNames = new Set(existingStudents.map(s => s.nama.trim().toUpperCase()).filter(Boolean));

    imported.forEach(s => {
      const matchNisn = s.nisn && existingNisns.has(s.nisn);
      const matchNis = s.nis && existingNis.has(s.nis);
      const matchName = s.nama && existingNames.has(s.nama.trim().toUpperCase());
      if (matchNisn || matchNis || matchName) {
        updates++;
      } else {
        additions++;
      }
    });

    if (importMode === 'merge') {
      const finalTotal = existingStudents.length + additions;
      return { updateCount: updates, newCount: additions, preservedCount: existingStudents.length - updates, finalTotal };
    } else if (importMode === 'append') {
      return { updateCount: 0, newCount: imported.length, preservedCount: existingStudents.length, finalTotal: existingStudents.length + imported.length };
    } else {
      return { updateCount: 0, newCount: imported.length, preservedCount: 0, finalTotal: imported.length };
    }
  }, [parsedResult, existingStudents, importMode]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsProcessing(true);
    setErrorMessage(null);
    setSaveSuccessMessage(null);

    try {
      const result = await parseEmisExcelFile(file);
      setParsedResult(result);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal memproses berkas Excel.');
      setParsedResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsProcessing(true);
    setErrorMessage(null);
    setSaveSuccessMessage(null);

    try {
      const result = await parseEmisExcelFile(file);
      setParsedResult(result);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal memproses berkas Excel.');
      setParsedResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!parsedResult || parsedResult.students.length === 0 || isSaving) return;
    
    if (importMode === 'replace' && existingStudents.length > 0) {
      const ok = confirm(`PERINGATAN: Anda memilih opsi 'Ganti Total Seluruh Data Siswa'.\n\nSebanyak ${existingStudents.length} data siswa yang tersimpan sebelumnya akan dihapus dan digantikan dengan ${parsedResult.validCount} siswa dari file Excel ini.\n\nApakah Anda benar-benar yakin ingin melanjutkan?`);
      if (!ok) return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await onImportSuccess(parsedResult.students, importMode);
      setSaveSuccessMessage(
        importMode === 'merge'
          ? `✓ Berhasil menggabungkan data! Total siswa kini menjadi ${stats.finalTotal} siswa.`
          : importMode === 'append'
          ? `✓ Berhasil menambahkan ${parsedResult.validCount} siswa baru ke dalam database!`
          : `✓ Berhasil mengganti seluruh database dengan ${parsedResult.validCount} siswa baru!`
      );
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 900);
    } catch (err) {
      console.error('Import confirmation error:', err);
      setErrorMessage('Gagal menyimpan data ke database server. Silakan coba kembali.');
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-4 text-white flex items-center justify-between border-b border-emerald-800/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600/30 text-emerald-400 rounded-xl border border-emerald-500/40 shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wide">
                  Impor Data Siswa dari Excel EMIS Kemenag 4.0
                </h3>
                <span className="bg-emerald-400 text-emerald-950 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                  Anti Data Hilang
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Mendukung .xlsx, .xls, .csv • Penggabungan Cerdas & Perlindungan Data Siswa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs text-slate-300">
          {/* Quick Info & Download Template Box */}
          <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-inner">
            <div className="flex items-start gap-2.5 max-w-lg">
              <HelpCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block text-xs">Butuh Format File Excel EMIS / SIAKAD?</span>
                <p className="text-slate-400 text-[11px] leading-relaxed mt-0.5">
                  Unduh template Excel resmi Kemenag. Data siswa yang sudah Anda upload sebelumnya tidak akan hilang saat Anda mengunggah berkas kelas berikutnya.
                </p>
              </div>
            </div>

            <button
              onClick={downloadEmisExcelTemplate}
              className="px-3.5 py-2 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-1.5 transition active:scale-95 border border-emerald-500/40 text-xs shadow-md"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>Unduh Template Excel (.xlsx)</span>
            </button>
          </div>

          {/* Upload Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
              selectedFile
                ? 'border-emerald-500 bg-emerald-950/30'
                : 'border-slate-700 hover:border-emerald-500/60 bg-slate-950/40 hover:bg-slate-950/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />

            <FileSpreadsheet className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h4 className="font-bold text-white text-sm">
              {selectedFile ? selectedFile.name : 'Klik atau Seret Berkas Excel Siswa ke Sini'}
            </h4>
            <p className="text-slate-400 text-[11px] mt-1">
              Format .xlsx, .xls, atau .csv hasil unduhan EMIS 4.0 Kemenag RI / SIAKAD Madrasah
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {saveSuccessMessage && (
            <div className="p-3.5 bg-emerald-950/90 border border-emerald-500 rounded-xl text-emerald-200 flex items-center gap-2.5 animate-in fade-in shadow-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="font-bold text-xs">{saveSuccessMessage}</span>
            </div>
          )}

          {/* Parsed Result Preview */}
          {parsedResult && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Baris di Excel</span>
                  <strong className="text-white text-base">{parsedResult.totalRows} Siswa</strong>
                </div>
                <div className="p-3 bg-emerald-950/50 rounded-xl border border-emerald-700/60 text-center">
                  <span className="text-[10px] text-emerald-300 block uppercase font-bold">Data Valid</span>
                  <strong className="text-emerald-400 text-base">{parsedResult.validCount} Siswa</strong>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-amber-300 block uppercase font-bold">Siswa Tersimpan</span>
                  <strong className="text-amber-400 text-base">{currentStudentCount} Siswa</strong>
                </div>
                <div className="p-3 bg-teal-950/50 rounded-xl border border-teal-700/60 text-center">
                  <span className="text-[10px] text-teal-300 block uppercase font-bold">Total Pasca Impor</span>
                  <strong className="text-teal-300 text-base">{stats.finalTotal} Siswa</strong>
                </div>
              </div>

              {/* Mode Selection with Clear Guarantees */}
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Pilih Metode Penggabungan Data:
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    Direkomendasikan: Smart Merge
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {/* Option 1: Smart Merge (Default & Safe) */}
                  <label
                    className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                      importMode === 'merge'
                        ? 'bg-emerald-950/70 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="mt-1 accent-emerald-500 w-4 h-4"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-white">
                          1. Gabungkan & Perbarui Data Cerdas (Smart Merge)
                        </span>
                        <span className="bg-emerald-500 text-slate-950 text-[9px] font-black uppercase px-1.5 py-0.2 rounded">
                          Aman / Tidak Menimpa Siswa Lain
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        Data siswa yang cocok (NISN / Nama) akan diperbarui otomatis, siswa baru dari Excel akan ditambahkan, dan <strong>seluruh data siswa kelas lain yang sudah ada sebelumnya TIDAK AKAN HILANG</strong>.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-emerald-300 font-semibold">
                        <span>• {stats.newCount} Siswa baru ditambahkan</span>
                        <span>• {stats.updateCount} Siswa diperbarui</span>
                        <span>• {stats.preservedCount} Siswa lama tetap utuh</span>
                      </div>
                    </div>
                  </label>

                  {/* Option 2: Append */}
                  <label
                    className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                      importMode === 'append'
                        ? 'bg-teal-950/70 border-teal-500 shadow-md ring-1 ring-teal-500/50'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="mt-1 accent-teal-500 w-4 h-4"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">
                          2. Tambahkan Semua Sebagai Siswa Baru (Append)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        Menambahkan seluruh {parsedResult.validCount} siswa dari file Excel ini ke dalam daftar tanpa mengubah siswa lama.
                      </p>
                    </div>
                  </label>

                  {/* Option 3: Replace All */}
                  <label
                    className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                      importMode === 'replace'
                        ? 'bg-rose-950/70 border-rose-500 shadow-md ring-1 ring-rose-500/50'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-1 accent-rose-500 w-4 h-4"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-rose-300">
                          3. Ganti Total Seluruh Data Siswa (Replace All)
                        </span>
                        <span className="bg-rose-900/80 text-rose-200 text-[9px] font-bold px-1.5 py-0.2 rounded border border-rose-700">
                          Menghapus Data Lama
                        </span>
                      </div>
                      <p className="text-[11px] text-rose-300/80 mt-1 leading-relaxed">
                        Perhatian: Opsi ini akan <strong>menghapus {currentStudentCount} data siswa lama</strong> dan menggantinya hanya dengan {parsedResult.validCount} siswa dari file ini.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Preview Table (Sample 5 rows) */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-white text-xs block">
                  Pratinjau Data Terbaca ({Math.min(5, parsedResult.students.length)} dari {parsedResult.students.length} Siswa):
                </span>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] text-slate-300">
                    <thead className="bg-slate-800 text-slate-400 uppercase text-[9px] border-b border-slate-700">
                      <tr>
                        <th className="py-1.5 px-2">NISN</th>
                        <th className="py-1.5 px-2">Nama Siswa</th>
                        <th className="py-1.5 px-2">JK</th>
                        <th className="py-1.5 px-2">Kelas / Rombel</th>
                        <th className="py-1.5 px-2">Tempat, Tgl Lahir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {parsedResult.students.slice(0, 5).map((s, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/60">
                          <td className="py-1.5 px-2 font-mono text-amber-400 font-bold">{s.nisn}</td>
                          <td className="py-1.5 px-2 font-bold text-white">{s.nama}</td>
                          <td className="py-1.5 px-2">{s.jenisKelamin}</td>
                          <td className="py-1.5 px-2 text-emerald-400">{s.kelas}</td>
                          <td className="py-1.5 px-2 truncate max-w-[150px]">{s.tempatLahir}, {s.tanggalLahir}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-xl text-xs font-semibold transition"
          >
            Batal
          </button>

          <button
            onClick={handleConfirmImport}
            disabled={!parsedResult || parsedResult.students.length === 0 || isProcessing || isSaving}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition active:scale-95 cursor-pointer border border-emerald-400/40"
          >
            <FileCheck className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
            <span>
              {isSaving 
                ? 'Menyimpan ke Database...' 
                : (parsedResult ? `Simpan & Sinkronkan (${stats.finalTotal} Siswa)` : 'Impor Data Sekarang')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
