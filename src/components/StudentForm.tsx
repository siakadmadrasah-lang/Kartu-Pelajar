import React, { useRef, useState } from 'react';
import { Student } from '../types';
import { 
  User, 
  Upload, 
  Sparkles, 
  Calendar, 
  MapPin, 
  CreditCard,
  GraduationCap,
  Image as ImageIcon,
  FileText,
  Loader2
} from 'lucide-react';
import { compressStudentPhoto } from '../utils/imageUtils';

interface StudentFormProps {
  student: Student;
  onChange: (updated: Student) => void;
  onOpenSuratAktif?: () => void;
  activeTahunPelajaran?: string;
}

const SAMPLE_PHOTO_PRESETS = [
  {
    name: 'Siswa Putra 1 (Koko & Peci)',
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&fit=crop&q=80',
    gender: 'L',
  },
  {
    name: 'Siswa Putri 1 (Jilbab Putih)',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&fit=crop&q=80',
    gender: 'P',
  },
  {
    name: 'Siswa Putra 2 (Seragam MI)',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&fit=crop&q=80',
    gender: 'L',
  },
  {
    name: 'Siswa Putri 2 (Jilbab Ceria)',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&fit=crop&q=80',
    gender: 'P',
  },
];

export const StudentForm: React.FC<StudentFormProps> = ({ 
  student, 
  onChange, 
  onOpenSuratAktif,
  activeTahunPelajaran
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  const handleFieldChange = (field: keyof Student, value: any) => {
    onChange({
      ...student,
      [field]: value,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsProcessingPhoto(true);
        const compressed = await compressStudentPhoto(file, 480);
        handleFieldChange('fotoUrl', compressed);
      } catch (err) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            handleFieldChange('fotoUrl', event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      } finally {
        setIsProcessingPhoto(false);
        e.target.value = '';
      }
    }
  };

  return (
    <div className="space-y-4 text-slate-200">
      {/* Photo Uploader Section */}
      <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 shadow-sm">
        <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5" /> Pas Foto Siswa (Format 2x3 / 3x4)
        </label>

        <div className="flex flex-wrap items-center gap-4">
          {/* Current Photo Preview */}
          <div className="relative group w-20 h-24 rounded-lg overflow-hidden border-2 border-emerald-500/80 bg-slate-900 shadow-md flex-shrink-0">
            <img
              src={student.fotoUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=300&fit=crop'}
              alt={student.nama}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-slate-900/70 text-white text-[10px] font-semibold opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Ganti</span>
            </button>
          </div>

          <div className="flex-1 min-w-[200px] space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                disabled={isProcessingPhoto}
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                {isProcessingPhoto ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Memproses Foto...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" /> Upload Foto dari HP / Komputer
                  </>
                )}
              </button>
            </div>

            {/* Presets */}
            <div>
              <span className="text-[11px] text-slate-400 font-medium block mb-1">
                Atau pilih contoh foto siswa:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_PHOTO_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      handleFieldChange('fotoUrl', preset.url);
                      handleFieldChange('jenisKelamin', preset.gender);
                    }}
                    className="px-2 py-1 bg-slate-700/80 hover:bg-slate-700 text-slate-300 text-[10px] rounded border border-slate-600 transition flex items-center gap-1"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Biodata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 shadow-sm">
        {/* Full Name */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-emerald-400" /> Nama Lengkap Siswa *
          </label>
          <input
            type="text"
            value={student.nama}
            onChange={(e) => handleFieldChange('nama', e.target.value.toUpperCase())}
            placeholder="Contoh: AHMAD ZAKI AL-FARIZI"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* NISN (10 digits) */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5 text-amber-400" /> NISN (10 Digit Nasional) *
          </label>
          <input
            type="text"
            maxLength={10}
            value={student.nisn}
            onChange={(e) => handleFieldChange('nisn', e.target.value)}
            placeholder="0148923451"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-amber-300 font-mono font-bold focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* NIS (Local Madrasah ID) */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            NIS / Nomor Induk Madrasah (NISM)
          </label>
          <input
            type="text"
            value={student.nis}
            onChange={(e) => handleFieldChange('nis', e.target.value)}
            placeholder="232401045"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Tempat Lahir */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Tempat Lahir
          </label>
          <input
            type="text"
            value={student.tempatLahir}
            onChange={(e) => handleFieldChange('tempatLahir', e.target.value)}
            placeholder="Bandung"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Tanggal Lahir */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Tanggal Lahir
          </label>
          <input
            type="text"
            value={student.tanggalLahir}
            onChange={(e) => handleFieldChange('tanggalLahir', e.target.value)}
            placeholder="14 Mei 2014"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Jenis Kelamin */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Jenis Kelamin
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleFieldChange('jenisKelamin', 'L')}
              className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                student.jenisKelamin === 'L'
                  ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              Laki-laki (Ikhwan)
            </button>
            <button
              type="button"
              onClick={() => handleFieldChange('jenisKelamin', 'P')}
              className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                student.jenisKelamin === 'P'
                  ? 'bg-rose-600/30 border-rose-500 text-rose-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              Perempuan (Akhwat)
            </button>
          </div>
        </div>

        {/* Kelas / Rombel */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-400" /> Kelas / Rombel
          </label>
          <input
            type="text"
            value={student.kelas}
            onChange={(e) => handleFieldChange('kelas', e.target.value)}
            placeholder="IV - Umar bin Khattab"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Tahun Ajaran */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-300">
              Tahun Ajaran
            </label>
            {activeTahunPelajaran && student.tahunAjaran !== activeTahunPelajaran && (
              <button
                type="button"
                onClick={() => handleFieldChange('tahunAjaran', activeTahunPelajaran)}
                className="text-[10px] text-amber-300 hover:text-amber-200 underline font-medium"
              >
                Gunakan TP Aktif ({activeTahunPelajaran})
              </button>
            )}
          </div>
          <input
            type="text"
            value={student.tahunAjaran}
            onChange={(e) => handleFieldChange('tahunAjaran', e.target.value)}
            placeholder={activeTahunPelajaran || "2025/2026"}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
          />
          <div className="flex items-center gap-1 mt-1">
            {['2024/2025', '2025/2026', '2026/2027', '2027/2028'].map((tp) => (
              <button
                key={tp}
                type="button"
                onClick={() => handleFieldChange('tahunAjaran', tp)}
                className={`text-[9px] px-1.5 py-0.5 rounded border ${
                  student.tahunAjaran === tp
                    ? 'bg-emerald-600/40 border-emerald-500 text-emerald-200 font-bold'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300'
                }`}
              >
                {tp}
              </button>
            ))}
          </div>
        </div>

        {/* Golongan Darah */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Golongan Darah (Opsional)
          </label>
          <select
            value={student.golonganDarah || '-'}
            onChange={(e) => handleFieldChange('golonganDarah', e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="-">- Tidak Diketahui -</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="AB">AB</option>
            <option value="O">O</option>
          </select>
        </div>

        {/* Alamat Siswa */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Alamat Domisili Siswa
          </label>
          <input
            type="text"
            value={student.alamat}
            onChange={(e) => handleFieldChange('alamat', e.target.value)}
            placeholder="Jl. Terusan Buah Batu No. 12, Bandung"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Masa Berlaku */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Masa Berlaku Kartu
          </label>
          <input
            type="text"
            value={student.berlakuSampai}
            onChange={(e) => handleFieldChange('berlakuSampai', e.target.value)}
            placeholder="Selama Menjadi Siswa"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-emerald-300 font-semibold focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Surat Keterangan Aktif Quick Action */}
      {onOpenSuratAktif && (
        <div className="bg-gradient-to-r from-emerald-950/60 via-slate-800 to-emerald-950/60 p-4 rounded-xl border border-emerald-500/30 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600/20 rounded-lg text-emerald-400 border border-emerald-500/40">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                Surat Keterangan Aktif Siswa
                <span className="text-[9px] bg-amber-400 text-emerald-950 px-1.5 py-0.5 rounded font-extrabold">RESMI</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Terbitkan surat dinas aktif belajar untuk <strong>{student.nama}</strong> (PIP, Tunjangan, BPJS, Mutasi).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenSuratAktif}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition active:scale-95 flex-shrink-0"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Buat Surat</span>
          </button>
        </div>
      )}
    </div>
  );
};

