import React, { useState } from 'react';
import { MadrasahInfo, Student } from '../types';
import { 
  QrCode, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  School, 
  UserCheck, 
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { KemenagLogo } from './Logos';

interface CardScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  madrasah: MadrasahInfo;
}

export const CardScannerModal: React.FC<CardScannerModalProps> = ({
  isOpen,
  onClose,
  student,
  madrasah,
}) => {
  const [copied, setCopied] = useState(false);

  const verificationUrl = `https://emis.kemenag.go.id/siswa/verify?nisn=${student?.nisn || ''}&npsn=${madrasah?.npsn || ''}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-4 text-white flex items-center justify-between border-b border-emerald-600">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700/50 flex items-center justify-center text-amber-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wide">
                Verifikasi Kartu Pelajar MI
              </h3>
              <p className="text-[10px] text-amber-200">
                Pusat Data EMIS Kementerian Agama RI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-emerald-700/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Status Banner */}
        <div className="p-4 bg-emerald-950/60 border-b border-emerald-900/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-emerald-400 uppercase">Status Data:</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black tracking-wider uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Terverifikasi Sah
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Tercatat aktif di Pangkalan Data Siswa Madrasah Ibtidaiyah.
            </p>
          </div>
        </div>

        {/* Verified Student Details */}
        <div className="p-5 space-y-4">
          {/* Student Profile Card */}
          <div className="flex items-center gap-3.5 p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            <img
              src={student.fotoUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&fit=crop'}
              alt={student.nama}
              className="w-14 h-18 rounded-lg object-cover border border-emerald-500/60 shadow-sm"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-extrabold text-white uppercase truncate">
                {student.nama}
              </h4>
              <p className="text-xs text-amber-300 font-mono font-bold">
                NISN: {student.nisn}
              </p>
              <p className="text-[11px] text-slate-300 font-mono">
                NIS: {student.nis}
              </p>
              <p className="text-[11px] text-emerald-400 font-medium mt-0.5">
                Kelas: {student.kelas} (TP. {madrasah.tahunPelajaran || student.tahunAjaran || '2025/2026'})
              </p>
            </div>
          </div>

          {/* School Details */}
          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 space-y-1.5 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
              <School className="w-3.5 h-3.5" />
              <span>{madrasah.namaMadrasah}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-700/60">
              <div>
                <span className="text-slate-400">NSM:</span>{' '}
                <strong className="text-slate-200 font-mono">{madrasah.nsm}</strong>
              </div>
              <div>
                <span className="text-slate-400">NPSN:</span>{' '}
                <strong className="text-slate-200 font-mono">{madrasah.npsn}</strong>
              </div>
              <div>
                <span className="text-slate-400">Akreditasi:</span>{' '}
                <strong className="text-amber-300">{madrasah.akreditasi}</strong>
              </div>
              <div>
                <span className="text-slate-400">Kepala:</span>{' '}
                <strong className="text-slate-200 truncate">{madrasah.namaKepalaMadrasah.split(',')[0]}</strong>
              </div>
            </div>
          </div>

          {/* Verification Link URL */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-medium">
              Hasil Scan Barcode / URL Otentikasi:
            </label>
            <div className="flex items-center gap-1.5 bg-slate-950 p-2 rounded-lg border border-slate-800 text-[11px] font-mono text-emerald-400">
              <span className="truncate flex-1">{verificationUrl}</span>
              <button
                onClick={handleCopyLink}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 flex-shrink-0"
                title="Salin Link"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Button */}
        <div className="p-4 bg-slate-800/80 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition"
          >
            Tutup Dialog
          </button>
        </div>
      </div>
    </div>
  );
};
