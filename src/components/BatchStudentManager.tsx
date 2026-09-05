import React, { useState, useRef } from 'react';
import { Student } from '../types';
import { 
  Users, 
  UserPlus, 
  Search, 
  Trash2, 
  Edit3, 
  Download, 
  Upload, 
  Sparkles,
  Check,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { downloadEmisExcelTemplate } from '../utils/excelUtils';

interface BatchStudentManagerProps {
  students: Student[];
  selectedStudentId: string;
  onSelectStudent: (student: Student) => void;
  onUpdateStudents: (students: Student[]) => void;
  onAddNewStudent: () => void;
  onOpenEmisExcelImport?: () => void;
  onOpenSuratAktif?: (student?: Student) => void;
}


export const BatchStudentManager: React.FC<BatchStudentManagerProps> = ({
  students,
  selectedStudentId,
  onSelectStudent,
  onUpdateStudents,
  onAddNewStudent,
  onOpenEmisExcelImport,
  onOpenSuratAktif,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const csvInputRef = useRef<HTMLInputElement>(null);

  const classes = Array.from(new Set(students.map((s) => s.kelas))).filter(Boolean);

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nisn.includes(searchTerm) ||
      s.nis.includes(searchTerm);
    const matchesClass = classFilter === 'ALL' || s.kelas === classFilter;
    return matchesSearch && matchesClass;
  });

  const handleDeleteStudent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Hapus data siswa ini dari daftar?')) {
      const remaining = students.filter((s) => s.id !== id);
      onUpdateStudents(remaining);
      if (selectedStudentId === id && remaining.length > 0) {
        onSelectStudent(remaining[0]);
      }
    }
  };

  const handleExportCsv = () => {
    const headers = ['nama', 'nisn', 'nis', 'tempatLahir', 'tanggalLahir', 'jenisKelamin', 'kelas', 'tahunAjaran', 'golonganDarah', 'alamat', 'berlakuSampai'];
    const rows = students.map(s => [
      `"${s.nama}"`,
      `"${s.nisn}"`,
      `"${s.nis}"`,
      `"${s.tempatLahir}"`,
      `"${s.tanggalLahir}"`,
      `"${s.jenisKelamin}"`,
      `"${s.kelas}"`,
      `"${s.tahunAjaran}"`,
      `"${s.golonganDarah || '-'}"`,
      `"${s.alamat}"`,
      `"${s.berlakuSampai}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'DAFTAR_SISWA_MADRASAH_IBTIDAIYAH.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length <= 1) {
        alert('File CSV kosong atau tidak memiliki data.');
        return;
      }

      const imported: Student[] = [];
      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
        if (cols.length >= 2 && cols[0]) {
          imported.push({
            id: `std-imp-${Date.now()}-${i}`,
            nama: cols[0].toUpperCase(),
            nisn: cols[1] || `01${Math.floor(10000000 + Math.random() * 90000000)}`,
            nis: cols[2] || `2324${i.toString().padStart(4, '0')}`,
            tempatLahir: cols[3] || 'Bandung',
            tanggalLahir: cols[4] || '10 Januari 2015',
            jenisKelamin: (cols[5] === 'P' ? 'P' : 'L'),
            kelas: cols[6] || 'IV - Umar bin Khattab',
            tahunAjaran: cols[7] || '2025/2026',
            agama: 'Islam',
            golonganDarah: cols[8] || 'O',
            alamat: cols[9] || 'Jl. Madrasah No. 1',
            fotoUrl: (cols[5] === 'P') 
              ? 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&fit=crop'
              : 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=300&fit=crop',
            berlakuSampai: cols[10] || 'Selama Menjadi Siswa',
          });
        }
      }

      if (imported.length > 0) {
        onUpdateStudents([...students, ...imported]);
        alert(`Berhasil mengimpor ${imported.length} data siswa.`);
      }
    };
    reader.readAsText(file);
  };

  const handleAddSampleClass = () => {
    const sampleStudents: Student[] = [
      {
        id: `sample-${Date.now()}-1`,
        nama: 'BILAL AL-HABSYI',
        nisn: '0158912301',
        nis: '232401050',
        tempatLahir: 'Bandung',
        tanggalLahir: '19 Juli 2015',
        jenisKelamin: 'L',
        kelas: 'III - Bilal bin Rabah',
        tahunAjaran: '2025/2026',
        agama: 'Islam',
        golonganDarah: 'B',
        alamat: 'Jl. Cijawura Girang No. 34, Bandung',
        fotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&fit=crop',
        berlakuSampai: 'Selama Menjadi Siswa'
      },
      {
        id: `sample-${Date.now()}-2`,
        nama: 'MARIYAH AL-QIBTIYAH',
        nisn: '0158912302',
        nis: '232401051',
        tempatLahir: 'Cimahi',
        tanggalLahir: '05 September 2015',
        jenisKelamin: 'P',
        kelas: 'III - Bilal bin Rabah',
        tahunAjaran: '2025/2026',
        agama: 'Islam',
        golonganDarah: 'A',
        alamat: 'Jl. Kolonel Masturi No. 90, Cimahi',
        fotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&fit=crop',
        berlakuSampai: 'Selama Menjadi Siswa'
      }
    ];

    onUpdateStudents([...students, ...sampleStudents]);
  };

  return (
    <div className="space-y-4 text-slate-200">
      {/* Header with quick stats & actions */}
      <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
            <Users className="w-4 h-4" /> Kelola Data Siswa MI ({students.length} Siswa)
          </h3>
          <p className="text-xs text-slate-400">
            Pilih siswa untuk mengedit kartu atau cetak kartu massal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenEmisExcelImport && (
            <button
              onClick={onOpenEmisExcelImport}
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 border border-emerald-500/50 shadow-sm transition active:scale-95"
              title="Unggah berkas Excel EMIS Kemenag 4.0 (.xlsx / .xls)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" /> Upload Excel EMIS
            </button>
          )}

          {onOpenSuratAktif && (
            <button
              onClick={() => onOpenSuratAktif()}
              className="px-2.5 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-emerald-700/60 transition active:scale-95"
              title="Buat Surat Keterangan Aktif Siswa Standar Kemenag RI"
            >
              <FileText className="w-3.5 h-3.5 text-amber-300" /> Surat Aktif
            </button>
          )}

          <button
            onClick={downloadEmisExcelTemplate}
            className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 border border-slate-600 transition"
            title="Download Template Format Excel EMIS (.xlsx)"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" /> Template Excel
          </button>

          <input
            type="file"
            ref={csvInputRef}
            onChange={handleImportCsv}
            accept=".csv,.txt"
            className="hidden"
          />
          <button
            onClick={() => csvInputRef.current?.click()}
            className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 border border-slate-600 transition"
            title="Import daftar siswa dari file CSV"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" /> CSV
          </button>

          <button
            onClick={handleExportCsv}
            className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 border border-slate-600 transition"
            title="Download data siswa dalam format CSV"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" /> Export CSV
          </button>

          <button
            onClick={onAddNewStudent}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" /> + Siswa Baru
          </button>

          {students.length > 0 && (
            <button
              onClick={() => {
                if (confirm(`Hapus SELURUH (${students.length}) data siswa?\n\nGunakan ini jika Anda ingin mengosongkan data contoh dan menggantinya dengan data siswa asli.`)) {
                  onUpdateStudents([]);
                }
              }}
              className="px-2.5 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 text-xs font-semibold rounded-lg flex items-center gap-1 border border-rose-800/80 transition"
              title="Kosongkan seluruh data siswa"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Kosongkan ({students.length})
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama siswa, NISN, atau NIS..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {classes.length > 0 && (
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">Semua Kelas ({students.length})</option>
            {classes.map((cls) => (
              <option key={cls} value={cls}>
                Kelas: {cls}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Student List Cards / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
        {filteredStudents.map((s) => {
          const isSelected = s.id === selectedStudentId;
          return (
            <div
              key={s.id}
              onClick={() => onSelectStudent(s)}
              className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500'
                  : 'border-slate-700/80 bg-slate-900/60 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={s.fotoUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&fit=crop'}
                  alt={s.nama}
                  className="w-10 h-12 rounded object-cover border border-slate-700 flex-shrink-0 bg-slate-800"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-white truncate">{s.nama}</h4>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-black flex-shrink-0">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-amber-300 font-mono">
                    NISN: {s.nisn} | NIS: {s.nis}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {s.kelas} • {s.jenisKelamin === 'L' ? 'Putra' : 'Putri'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {onOpenSuratAktif && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectStudent(s);
                      onOpenSuratAktif(s);
                    }}
                    className="p-1.5 bg-slate-800 hover:bg-emerald-900/60 text-emerald-300 rounded-lg transition"
                    title="Buat Surat Keterangan Aktif Siswa Ini"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectStudent(s);
                  }}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg transition"
                  title="Pilih & Edit"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={(e) => handleDeleteStudent(s.id, e)}
                  className="p-1.5 bg-slate-800 hover:bg-rose-900/60 text-rose-400 rounded-lg transition"
                  title="Hapus Siswa"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
