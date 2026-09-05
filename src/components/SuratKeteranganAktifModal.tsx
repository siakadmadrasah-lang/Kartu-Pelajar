import React, { useState, useRef, useEffect } from 'react';
import { CardConfig, MadrasahInfo, Student, SuratKeteranganAktifConfig } from '../types';
import { KemenagLogo, MadrasahLogo, OfficialStamp, PrincipalSignature } from './Logos';
import { generateQrDataUrl } from '../utils/exportUtils';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { SAMPLE_STUDENT } from '../constants/initialData';
import { 
  FileText, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  X, 
  User, 
  RefreshCw, 
  FileCheck, 
  ShieldCheck, 
  Search,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';

interface SuratKeteranganAktifModalProps {
  isOpen: boolean;
  onClose: () => void;
  madrasah: MadrasahInfo;
  students: Student[];
  currentStudent: Student;
  onSelectStudent: (student: Student) => void;
  cardConfig?: CardConfig;
}

const PRESET_KEPERLUAN = [
  {
    label: 'Olimpiade Madrasah Indonesia (OMI)',
    text: 'Persyaratan kelengkapan administrasi dan pendaftaran delegasi peserta Olimpiade Madrasah Indonesia (OMI).',
  },
  {
    label: 'Beasiswa PIP / Kemenag',
    text: 'Kelengkapan administrasi pengajuan Bantuan Program Indonesia Pintar (PIP) / Beasiswa Kemenag RI.',
  },
  {
    label: 'Tunjangan Anak (PNS/TNI/Polri/BUMN)',
    text: 'Kelengkapan berkas permohonan Tunjangan Gaji Anak (KP4) Pegawai Negeri Sipil / TNI / Polri / BUMN / Swasta.',
  },
  {
    label: 'BPJS Kesehatan / Asuransi',
    text: 'Pendaftaran dan perpanjangan kepesertaan jaminan BPJS Kesehatan / Asuransi Jiwa Anak.',
  },
  {
    label: 'Lomba / Olimpiade Madrasah (KSM/AKSIOMA)',
    text: 'Persyaratan keikutsertaan sebagai delegasi peserta dalam Ajang Kompetisi Sains Madrasah (KSM) / Seni Olahraga Madrasah.',
  },
  {
    label: 'Pendaftaran Lanjutan / Mutasi Siswa',
    text: 'Kelengkapan berkas administrasi pindah sekolah (mutasi) / pendaftaran jenjang pendidikan lanjutan.',
  },
  {
    label: 'Pembuatan Paspor / Visa Anak',
    text: 'Kelengkapan administrasi pengajuan dokumen Paspor / Visa perjalanan ibadah Umrah / Luar Negeri.',
  },
  {
    label: 'Keterangan Umum',
    text: 'Kelengkapan administrasi bahwa yang bersangkutan adalah benar-benar siswa aktif Madrasah Ibtidaiyah.',
  },
];

export const SuratKeteranganAktifModal: React.FC<SuratKeteranganAktifModalProps> = ({
  isOpen,
  onClose,
  madrasah,
  students,
  currentStudent,
  onSelectStudent,
  cardConfig,
}) => {
  const printContainerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [searchStudentTerm, setSearchStudentTerm] = useState('');

  // Fallback to valid student if currentStudent is blank
  const activeStudent: Student = (currentStudent && currentStudent.nama)
    ? currentStudent
    : (students.length > 0 ? students[0] : SAMPLE_STUDENT);

  // Compute logo states based on global cardConfig
  const isMadrasahLogoActiveByConfig = cardConfig ? (
    cardConfig.showMadrasahLogo !== false &&
    cardConfig.logoMode !== 'left_only' &&
    cardConfig.logoMode !== 'kemenag_only' &&
    cardConfig.logoMode !== 'none'
  ) : true;

  const isKemenagLogoActiveByConfig = cardConfig ? (
    cardConfig.showKemenagLogo !== false &&
    cardConfig.logoMode !== 'right_only' &&
    cardConfig.logoMode !== 'madrasah_only' &&
    cardConfig.logoMode !== 'none'
  ) : true;

  // Default Surat Configuration
  const [config, setConfig] = useState<SuratKeteranganAktifConfig>(() => {
    const today = new Date();
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const tgl = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
    const bulanRomawi = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][today.getMonth()];
    
    return {
      nomorSurat: `B-${Math.floor(100 + Math.random() * 900)}/MI.${madrasah.nsm ? madrasah.nsm.slice(0, 4) : '1112'}/PP.00.4/${bulanRomawi}/${today.getFullYear()}`,
      perihal: 'SURAT KETERANGAN AKTIF BELAJAR',
      tahunAjaran: madrasah.tahunPelajaran || activeStudent?.tahunAjaran || '2025/2026',
      semester: 'Ganjil',
      keperluan: 'Kelengkapan administrasi pengajuan Bantuan Program Indonesia Pintar (PIP) / Beasiswa Kemenag RI.',
      keteranganTambahan: 'Adalah benar-benar siswa/i aktif pada Madrasah Ibtidaiyah kami dan berkelakuan baik dalam mengikuti kegiatan belajar mengajar.',
      tanggalSurat: tgl,
      kotaSurat: madrasah.kotaPenetapan || madrasah.kotaKab?.replace('Kab. ', '').replace('Kota ', '') || 'Banyumas',
      tampilkanKop: true,
      tampilkanNamaKementerian: cardConfig?.showNamaKementerianSurat ?? cardConfig?.showNamaKementerian ?? true,
      tampilkanLogoKemenag: isKemenagLogoActiveByConfig,
      tampilkanLogoMadrasah: isMadrasahLogoActiveByConfig,
      tampilkanTtd: true,
      tampilkanStempel: true,
      tampilkanQrVerifikasi: true,
      tampilkanFotoSiswa: false,
      ukuranKertas: 'A4',
    };
  });

  // Automatically synchronize with cardConfig whenever modal is opened or cardConfig changes
  useEffect(() => {
    if (isOpen && cardConfig) {
      const showMadrasah = (
        cardConfig.showMadrasahLogo !== false &&
        cardConfig.logoMode !== 'left_only' &&
        cardConfig.logoMode !== 'kemenag_only' &&
        cardConfig.logoMode !== 'none'
      );
      const showKemenag = (
        cardConfig.showKemenagLogo !== false &&
        cardConfig.logoMode !== 'right_only' &&
        cardConfig.logoMode !== 'madrasah_only' &&
        cardConfig.logoMode !== 'none'
      );
      setConfig((prev) => ({
        ...prev,
        tahunAjaran: madrasah.tahunPelajaran || prev.tahunAjaran,
        tampilkanLogoMadrasah: showMadrasah,
        tampilkanLogoKemenag: showKemenag,
        tampilkanNamaKementerian: cardConfig.showNamaKementerianSurat ?? cardConfig.showNamaKementerian ?? prev.tampilkanNamaKementerian ?? true,
      }));
    }
  }, [isOpen, madrasah.tahunPelajaran, cardConfig?.showMadrasahLogo, cardConfig?.showKemenagLogo, cardConfig?.logoMode, cardConfig?.showNamaKementerian, cardConfig?.showNamaKementerianSurat]);

  // Generate QR Code URL for document authenticity verification
  useEffect(() => {
    if (!activeStudent) return;
    const verifyData = `VERIFIKASI-SURAT-AKTIF|NO:${config.nomorSurat}|NISN:${activeStudent.nisn}|NAMA:${activeStudent.nama}|MADRASAH:${madrasah.namaMadrasah}|NSM:${madrasah.nsm}|TGL:${config.tanggalSurat}`;
    generateQrDataUrl(verifyData).then(setQrCodeUrl);
  }, [activeStudent, config.nomorSurat, config.tanggalSurat, madrasah.namaMadrasah, madrasah.nsm]);

  const handleGenerateNewNumber = () => {
    const today = new Date();
    const bulanRomawi = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][today.getMonth()];
    const cleanNsm = madrasah.nsm ? madrasah.nsm.slice(0, 4) : '1112';
    const newNum = `B-${Math.floor(100 + Math.random() * 900)}/MI.${cleanNsm}/PP.00.4/${bulanRomawi}/${today.getFullYear()}`;
    setConfig((prev) => ({ ...prev, nomorSurat: newNum }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPng = async () => {
    const el = document.getElementById('surat-aktif-document');
    if (!el) return;
    try {
      setIsExportingPng(true);
      const dataUrl = await toPng(el, {
        quality: 1,
        pixelRatio: 3,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `Surat_Aktif_${activeStudent.nisn}_${activeStudent.nama.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error export PNG:', err);
      alert('Gagal mengekspor gambar, silakan gunakan tombol Cetak / PDF.');
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleExportPdf = async () => {
    const el = document.getElementById('surat-aktif-document');
    if (!el) return;
    try {
      setIsExportingPdf(true);
      const dataUrl = await toPng(el, {
        quality: 1,
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: config.ukuranKertas === 'F4' ? [215, 330] : 'a4',
      });

      const pdfWidth = config.ukuranKertas === 'F4' ? 215 : 210;
      const pdfHeight = config.ukuranKertas === 'F4' ? 330 : 297;

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Surat_Keterangan_Aktif_${activeStudent.nama.replace(/\s+/g, '_')}_${activeStudent.nisn}.pdf`);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      alert('Gagal membuat PDF langsung, silakan gunakan tombol Cetak / Print Browser.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleCopyText = () => {
    const textContent = `
${config.tampilkanNamaKementerian ? (madrasah.namaKementerian || 'KEMENTERIAN AGAMA REPUBLIK INDONESIA') + '\n' : ''}${madrasah.kemenagWilayah || 'KEMENTERIAN AGAMA KABUPATEN BANYUMAS'}
${madrasah.namaMadrasah}
Alamat: ${madrasah.alamat}, Kec. ${madrasah.kecamatan}, ${madrasah.kotaKab}
NSM: ${madrasah.nsm} | NPSN: ${madrasah.npsn}
------------------------------------------------------------------------

${config.perihal}
Nomor: ${config.nomorSurat}

Yang bertanda tangan di bawah ini:
Nama               : ${madrasah.namaKepalaMadrasah || 'Siti Rochimah, S.Pd.I'}
${madrasah.labelIdPenandatangan || 'NIP'}                : ${madrasah.nipKepalaMadrasah || '197605122005012001'}
Jabatan            : ${madrasah.jabatanPenandatangan || 'Kepala Madrasah'}
Satuan Pendidikan  : ${madrasah.namaMadrasah}

Dengan ini menerangkan dengan sesungguhnya bahwa:
Nama Lengkap       : ${activeStudent.nama}
NISN               : ${activeStudent.nisn}
NIS                : ${activeStudent.nis}
Tempat, Tgl Lahir  : ${activeStudent.tempatLahir}, ${activeStudent.tanggalLahir}
Jenis Kelamin      : ${activeStudent.jenisKelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}
Kelas / Rombel     : ${activeStudent.kelas}
Tahun Pelajaran    : ${config.tahunAjaran} (Semester ${config.semester})
Alamat             : ${activeStudent.alamat}

${config.keteranganTambahan}
Surat keterangan ini diberikan kepada yang bersangkutan untuk dipergunakan sebagai: ${config.keperluan}

${config.kotaSurat}, ${config.tanggalSurat}
${madrasah.jabatanPenandatangan || 'Kepala Madrasah'},

${madrasah.namaKepalaMadrasah || 'Siti Rochimah, S.Pd.I'}
NIP. ${madrasah.nipKepalaMadrasah || '197605122005012001'}
    `.trim();

    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredStudents = students.filter(
    (s) =>
      s.nama.toLowerCase().includes(searchStudentTerm.toLowerCase()) ||
      s.nisn.includes(searchStudentTerm) ||
      s.kelas.toLowerCase().includes(searchStudentTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="print-modal-overlay fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-start justify-center p-2 sm:p-4 md:p-6 pt-3 sm:pt-4 print:p-0 print:bg-white print:static">
      <div className="print-modal-container bg-slate-900 border border-slate-700/80 rounded-xl sm:rounded-2xl w-full max-w-7xl shadow-2xl overflow-hidden my-1 sm:my-auto flex flex-col max-h-[94dvh] sm:max-h-[96vh] print:max-h-none print:border-none print:shadow-none print:bg-white print:my-0">
        
        {/* MODAL HEADER (No Print) */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 px-3 sm:px-5 py-2.5 sm:py-3 border-b border-emerald-500/30 flex items-center justify-between no-print flex-shrink-0 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Back Button */}
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 rounded-lg text-xs font-bold flex items-center gap-1.5 transition active:scale-95 flex-shrink-0"
              title="Kembali ke Aplikasi"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span>Kembali</span>
            </button>

            <div className="p-1.5 bg-emerald-600/20 border border-emerald-500/40 rounded-lg text-emerald-400 flex-shrink-0 hidden sm:block">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                  Surat Keterangan Aktif Siswa
                </h3>
                <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0">
                  Standar Kemenag RI
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate hidden md:block">
                Dokumen Resmi A4 • Format Tata Naskah Dinas Madrasah • TTD & Stempel
              </p>
            </div>
          </div>

          {/* Action Header Buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={handleCopyText}
              className="px-2 sm:px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition active:scale-95"
              title="Salin isi teks surat ke clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
              <span className="hidden md:inline">{copied ? 'Tersalin!' : 'Salin Teks'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-2 sm:px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition active:scale-95 disabled:opacity-50"
              title="Unduh Surat format PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{isExportingPdf ? 'Membuat PDF...' : 'Unduh PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportPng}
              disabled={isExportingPng}
              className="px-2 sm:px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-600/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition active:scale-95 disabled:opacity-50"
              title="Unduh Gambar Surat format PNG"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{isExportingPng ? 'Memproses...' : 'PNG'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="font-bold">Cetak / Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition ml-1"
              title="Tutup Modal"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY (Split Layout: Controls on left, Live A4 Document on right) */}
        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-800 print:overflow-visible print:divide-none">
          
          {/* LEFT COLUMN: CONTROLS & FORM (No Print) */}
          <div className="w-full lg:w-[420px] p-4 sm:p-5 bg-slate-900/95 space-y-4 overflow-y-auto max-h-none lg:max-h-[calc(96vh-65px)] no-print flex-shrink-0">
            
            {/* 1. Pemilih Siswa Aktif */}
            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-2.5">
              <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> 1. Pilih Siswa Aktif ({students.length} Siswa)
              </label>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama siswa, NISN, atau kelas..."
                  value={searchStudentTerm}
                  onChange={(e) => setSearchStudentTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                {filteredStudents.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onSelectStudent(s)}
                    className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition ${
                      s.id === activeStudent?.id
                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/60 font-semibold'
                        : 'bg-slate-900/70 hover:bg-slate-700/60 text-slate-300 border border-transparent'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="truncate font-bold">{s.nama}</div>
                      <div className="text-[10px] text-slate-400">
                        NISN: {s.nisn} • {s.kelas}
                      </div>
                    </div>
                    {s.id === activeStudent?.id && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Pengaturan Nomor & Metadata Surat */}
            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5" /> 2. Nomor & Format Surat
                </label>
                <button
                  type="button"
                  onClick={handleGenerateNewNumber}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded transition"
                  title="Generate Nomor Otomatis Baru"
                >
                  <RefreshCw className="w-3 h-3" /> Auto No.
                </button>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Nomor Surat Resmi</label>
                <input
                  type="text"
                  value={config.nomorSurat}
                  onChange={(e) => setConfig({ ...config, nomorSurat: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Tahun Ajaran</label>
                  <input
                    type="text"
                    value={config.tahunAjaran}
                    onChange={(e) => setConfig({ ...config, tahunAjaran: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Semester</label>
                  <select
                    value={config.semester}
                    onChange={(e) => setConfig({ ...config, semester: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Ganjil">Ganjil (1)</option>
                    <option value="Genap">Genap (2)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Kota Surat</label>
                  <input
                    type="text"
                    value={config.kotaSurat}
                    onChange={(e) => setConfig({ ...config, kotaSurat: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Tanggal Surat</label>
                  <input
                    type="text"
                    value={config.tanggalSurat}
                    onChange={(e) => setConfig({ ...config, tanggalSurat: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* 3. Keperluan Surat (Preset Cepat & Custom) */}
            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-2.5">
              <label className="text-xs font-bold text-sky-400 uppercase tracking-wider block">
                3. Keperluan Pembuatan Surat
              </label>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Pilih Template Keperluan Cepat:</label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      setConfig({ ...config, keperluan: e.target.value });
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  defaultValue=""
                >
                  <option value="" disabled>-- Pilih Jenis Keperluan --</option>
                  {PRESET_KEPERLUAN.map((item, idx) => (
                    <option key={idx} value={item.text}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Teks Keperluan (Dapat diedit bebas):</label>
                <textarea
                  rows={2}
                  value={config.keperluan}
                  onChange={(e) => setConfig({ ...config, keperluan: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Keterangan Tambahan / Karakter Siswa:</label>
                <textarea
                  rows={2}
                  value={config.keteranganTambahan}
                  onChange={(e) => setConfig({ ...config, keteranganTambahan: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* 4. Opsi Tampilan & Elemen Formal */}
            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                4. Elemen Tambahan Surat
              </label>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 bg-slate-900/70 rounded-lg border border-slate-700/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.tampilkanKop}
                    onChange={(e) => setConfig({ ...config, tampilkanKop: e.target.checked })}
                    className="w-3.5 h-3.5 text-emerald-500 rounded bg-slate-800 border-slate-600"
                  />
                  <span className="text-slate-300">Kop Surat Resmi</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-slate-900/70 rounded-lg border border-slate-700/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.tampilkanNamaKementerian ?? false}
                    onChange={(e) => setConfig({ ...config, tampilkanNamaKementerian: e.target.checked })}
                    className="w-3.5 h-3.5 text-emerald-500 rounded bg-slate-800 border-slate-600"
                  />
                  <span className="text-amber-300 font-medium">Nama Kementerian (Baris 1)</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-slate-900/70 rounded-lg border border-slate-700/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.tampilkanLogoKemenag}
                    onChange={(e) => setConfig({ ...config, tampilkanLogoKemenag: e.target.checked })}
                    className="w-3.5 h-3.5 text-emerald-500 rounded bg-slate-800 border-slate-600"
                  />
                  <span className="text-slate-300">Logo Kemenag (Kiri)</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-slate-900/70 rounded-lg border border-slate-700/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.tampilkanLogoMadrasah}
                    onChange={(e) => setConfig({ ...config, tampilkanLogoMadrasah: e.target.checked })}
                    className="w-3.5 h-3.5 text-emerald-500 rounded bg-slate-800 border-slate-600"
                  />
                  <span className="text-slate-300">Logo MI (Kanan)</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-slate-900/70 rounded-lg border border-slate-700/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.tampilkanTtd}
                    onChange={(e) => setConfig({ ...config, tampilkanTtd: e.target.checked })}
                    className="w-3.5 h-3.5 text-emerald-500 rounded bg-slate-800 border-slate-600"
                  />
                  <span className="text-slate-300">Tanda Tangan</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-slate-900/70 rounded-lg border border-slate-700/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.tampilkanStempel}
                    onChange={(e) => setConfig({ ...config, tampilkanStempel: e.target.checked })}
                    className="w-3.5 h-3.5 text-emerald-500 rounded bg-slate-800 border-slate-600"
                  />
                  <span className="text-slate-300">Stempel Basah</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-slate-900/70 rounded-lg border border-slate-700/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.tampilkanQrVerifikasi}
                    onChange={(e) => setConfig({ ...config, tampilkanQrVerifikasi: e.target.checked })}
                    className="w-3.5 h-3.5 text-emerald-500 rounded bg-slate-800 border-slate-600"
                  />
                  <span className="text-slate-300">QR Validasi Asli</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-slate-900/70 rounded-lg border border-slate-700/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.tampilkanFotoSiswa}
                    onChange={(e) => setConfig({ ...config, tampilkanFotoSiswa: e.target.checked })}
                    className="w-3.5 h-3.5 text-emerald-500 rounded bg-slate-800 border-slate-600"
                  />
                  <span className="text-slate-300">Pas Foto (3x4)</span>
                </label>

                <div className="flex items-center justify-between p-2 bg-slate-900/70 rounded-lg border border-slate-700/60">
                  <span className="text-slate-400">Ukuran:</span>
                  <select
                    value={config.ukuranKertas}
                    onChange={(e) => setConfig({ ...config, ukuranKertas: e.target.value as any })}
                    className="bg-slate-800 text-white rounded px-1.5 py-0.5 text-xs focus:outline-none border border-slate-600"
                  >
                    <option value="A4">A4 (21 x 29.7 cm)</option>
                    <option value="F4">F4 (21.5 x 33 cm)</option>
                  </select>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: LIVE FORMAL A4 DOCUMENT PREVIEW */}
          <div className="print-modal-preview-wrapper flex-1 p-3 sm:p-5 bg-slate-950 flex flex-col items-center justify-start overflow-y-auto max-h-none lg:max-h-[calc(96vh-65px)] print:p-0 print:bg-white print:max-h-none print:overflow-visible">
            
            <div className="w-full max-w-[760px] mb-2 flex items-center justify-between text-xs text-slate-400 no-print">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Pratinjau Dokumen Cetak ({config.ukuranKertas})
              </span>
              <span>Skala 100% • Standar Tata Naskah Dinas Kemenag</span>
            </div>

            {/* THE PRINTABLE OFFICIAL LETTER CONTAINER */}
            <div
              id="surat-aktif-document"
              ref={printContainerRef}
              className="bg-white text-black shadow-2xl p-6 sm:p-10 w-full max-w-[760px] font-serif leading-relaxed select-text border border-slate-200 print:shadow-none print:border-none print:m-0 print:w-[210mm] print:max-w-[210mm] print:bg-white"
              style={{
                fontFamily: '"Times New Roman", Times, serif',
                color: '#000000',
              }}
            >
              {/* KOP SURAT RESMI */}
              {config.tampilkanKop && (
                <div className="border-b-[2.5px] border-black pb-1.5 mb-3.5">
                  <div className="flex items-center justify-between gap-3">
                    {/* Logo Kemenag RI (Kiri) */}
                    {config.tampilkanLogoKemenag ? (
                      <div className="w-20 h-20 sm:w-22 sm:h-22 flex items-center justify-center flex-shrink-0">
                        {cardConfig?.singleLogoSource === 'madrasah' && !config.tampilkanLogoMadrasah ? (
                          madrasah.logoMadrasahUrl ? (
                            <img
                              src={madrasah.logoMadrasahUrl}
                              alt="Logo Madrasah"
                              className="w-20 h-20 sm:w-22 sm:h-22 object-contain"
                              crossOrigin={madrasah.logoMadrasahUrl.startsWith('data:') ? undefined : 'anonymous'}
                            />
                          ) : null
                        ) : madrasah.logoKemenagUrl ? (
                          <img
                            src={madrasah.logoKemenagUrl}
                            alt="Logo Kemenag"
                            className="w-20 h-20 sm:w-22 sm:h-22 object-contain"
                            crossOrigin={madrasah.logoKemenagUrl.startsWith('data:') ? undefined : 'anonymous'}
                          />
                        ) : null}
                      </div>
                    ) : (
                      config.tampilkanLogoMadrasah ? (
                        <div className="w-20 h-20 sm:w-22 sm:h-22 flex-shrink-0 opacity-0 pointer-events-none" aria-hidden="true" />
                      ) : null
                    )}

                    {/* Teks Kop Tengah */}
                    <div className="flex-1 text-center font-serif text-black">
                      {config.tampilkanNamaKementerian && (
                        <h4 className="text-[12px] sm:text-[13px] font-bold uppercase tracking-wider leading-tight">
                          {madrasah.namaKementerian || 'KEMENTERIAN AGAMA REPUBLIK INDONESIA'}
                        </h4>
                      )}
                      <h3 className="text-[13px] sm:text-[14px] font-bold uppercase tracking-wider leading-tight mt-0.5">
                        {madrasah.kemenagWilayah || `KANTOR KEMENTERIAN AGAMA ${madrasah.kotaKab?.toUpperCase() || 'KABUPATEN BANYUMAS'}`}
                      </h3>
                      <h2 className="text-[15.5px] sm:text-[16.5px] font-extrabold uppercase tracking-wide leading-tight mt-0.5 text-black">
                        {madrasah.namaMadrasah}
                      </h2>
                      <div className="text-[10.5px] font-normal leading-tight mt-0.5 text-neutral-800">
                        <span>NSM: {madrasah.nsm}</span>
                        <span className="mx-1.5">•</span>
                        <span>NPSN: {madrasah.npsn}</span>
                        {madrasah.akreditasi && madrasah.akreditasi !== '-' && (
                          <>
                            <span className="mx-1.5">•</span>
                            <span>Akreditasi: {madrasah.akreditasi}</span>
                          </>
                        )}
                      </div>
                      <div className="text-[9.5px] font-normal leading-tight text-neutral-700 mt-0.5">
                        {madrasah.alamat}, Kec. {madrasah.kecamatan}, {madrasah.kotaKab}, {madrasah.provinsi} {madrasah.kodePos}
                      </div>
                      <div className="text-[9px] font-normal text-neutral-700">
                        {madrasah.telepon && `Telp: ${madrasah.telepon}`}
                        {madrasah.email && ` | Email: ${madrasah.email}`}
                        {madrasah.website && ` | Website: ${madrasah.website}`}
                      </div>
                    </div>

                    {/* Logo Madrasah (Kanan) */}
                    {config.tampilkanLogoMadrasah ? (
                      <div className="w-20 h-20 sm:w-22 sm:h-22 flex items-center justify-center flex-shrink-0">
                        {cardConfig?.singleLogoSource === 'kemenag' && !config.tampilkanLogoKemenag ? (
                          madrasah.logoKemenagUrl ? (
                            <img
                              src={madrasah.logoKemenagUrl}
                              alt="Logo Kemenag"
                              className="w-20 h-20 sm:w-22 sm:h-22 object-contain"
                              crossOrigin={madrasah.logoKemenagUrl.startsWith('data:') ? undefined : 'anonymous'}
                            />
                          ) : null
                        ) : madrasah.logoMadrasahUrl ? (
                          <img
                            src={madrasah.logoMadrasahUrl}
                            alt="Logo Madrasah"
                            className="w-20 h-20 sm:w-22 sm:h-22 object-contain"
                            crossOrigin={madrasah.logoMadrasahUrl.startsWith('data:') ? undefined : 'anonymous'}
                          />
                        ) : null}
                      </div>
                    ) : (
                      config.tampilkanLogoKemenag ? (
                        <div className="w-20 h-20 sm:w-22 sm:h-22 flex-shrink-0 opacity-0 pointer-events-none" aria-hidden="true" />
                      ) : null
                    )}
                  </div>

                  {/* Garis Ganda Tipis Bawah Kop */}
                  <div className="border-b border-black mt-0.5"></div>
                </div>
              )}

              {/* JUDUL SURAT & NOMOR */}
              <div className="text-center my-3">
                <h3 className="text-[14px] font-bold tracking-wider uppercase underline underline-offset-4 decoration-1">
                  {config.perihal}
                </h3>
                <p className="text-[11.5px] font-medium mt-0.5">
                  Nomor : {config.nomorSurat}
                </p>
              </div>

              {/* PARAGRAF PEMBUKA */}
              <div className="text-[11.5px] leading-relaxed text-justify mb-2">
                Yang bertanda tangan di bawah ini Kepala Madrasah Ibtidaiyah <strong>{madrasah.namaMadrasah}</strong>, menerangkan bahwa:
              </div>

              {/* DATA PEJABAT */}
              <div className="text-[11px] mb-2.5 pl-3 space-y-0.5">
                <table className="w-full border-collapse">
                  <tbody>
                    <tr>
                      <td className="w-36 py-0.5 align-top">Nama</td>
                      <td className="w-4 py-0.5 align-top text-center">:</td>
                      <td className="py-0.5 align-top font-bold">{madrasah.namaKepalaMadrasah || 'Siti Rochimah, S.Pd.I'}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 align-top">{madrasah.labelIdPenandatangan || 'NIP'}</td>
                      <td className="py-0.5 align-top text-center">:</td>
                      <td className="py-0.5 align-top">{madrasah.nipKepalaMadrasah || '197605122005012001'}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 align-top">Jabatan</td>
                      <td className="py-0.5 align-top text-center">:</td>
                      <td className="py-0.5 align-top">{madrasah.jabatanPenandatangan || 'Kepala Madrasah'}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 align-top">Satuan Pendidikan</td>
                      <td className="py-0.5 align-top text-center">:</td>
                      <td className="py-0.5 align-top">{madrasah.namaMadrasah}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* PENGANTAR DATA SISWA */}
              <div className="text-[11.5px] leading-relaxed text-justify mb-1.5">
                Dengan ini menerangkan dengan sesungguhnya bahwa peserta didik di bawah ini:
              </div>

              {/* DATA SISWA AKTIF */}
              <div className="text-[11px] mb-2.5 pl-3 space-y-0.5 bg-neutral-50/50 p-1.5 rounded print:bg-transparent print:p-0">
                <table className="w-full border-collapse">
                  <tbody>
                    <tr>
                      <td className="w-36 py-0.5 align-top">Nama Lengkap</td>
                      <td className="w-4 py-0.5 align-top text-center">:</td>
                      <td className="py-0.5 align-top font-bold uppercase">{activeStudent.nama}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 align-top">NISN</td>
                      <td className="py-0.5 align-top text-center">:</td>
                      <td className="py-0.5 align-top font-mono">{activeStudent.nisn}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 align-top">NIS / Nomor Induk</td>
                      <td className="py-0.5 align-top text-center">:</td>
                      <td className="py-0.5 align-top font-mono">{activeStudent.nis}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 align-top">Tempat, Tanggal Lahir</td>
                      <td className="py-0.5 align-top text-center">:</td>
                      <td className="py-0.5 align-top">{activeStudent.tempatLahir}, {activeStudent.tanggalLahir}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 align-top">Jenis Kelamin</td>
                      <td className="py-0.5 align-top text-center">:</td>
                      <td className="py-0.5 align-top">{activeStudent.jenisKelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 align-top">Kelas / Rombel</td>
                      <td className="py-0.5 align-top text-center">:</td>
                      <td className="py-0.5 align-top font-semibold">{activeStudent.kelas}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 align-top">Tahun Pelajaran</td>
                      <td className="py-0.5 align-top text-center">:</td>
                      <td className="py-0.5 align-top">{config.tahunAjaran} (Semester {config.semester})</td>
                    </tr>
                    {activeStudent.namaWali && (
                      <tr>
                        <td className="py-0.5 align-top">Nama Orang Tua / Wali</td>
                        <td className="py-0.5 align-top text-center">:</td>
                        <td className="py-0.5 align-top">{activeStudent.namaWali}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="py-0.5 align-top">Alamat Siswa</td>
                      <td className="py-0.5 align-top text-center">:</td>
                      <td className="py-0.5 align-top">{activeStudent.alamat}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* PERNYATAAN STATUS & MAKSUD KEPERLUAN */}
              <div className="text-[11.5px] leading-relaxed text-justify space-y-1 mb-3">
                <p>
                  {config.keteranganTambahan}
                </p>
                <p>
                  Surat keterangan ini diberikan kepada yang bersangkutan untuk dipergunakan sebagai: <strong>{config.keperluan}</strong>
                </p>
                <p>
                  Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya.
                </p>
              </div>

              {/* TITIMANGSA, TTD & STEMPEL */}
              <div className="mt-4 flex justify-between items-end">
                {/* Bagian Kiri: Pas Foto Siswa & QR Verifikasi */}
                <div className="flex items-center gap-3">
                  {config.tampilkanFotoSiswa && (
                    <div className="w-18 h-22 border border-dashed border-neutral-400 flex items-center justify-center p-0.5 bg-neutral-50 overflow-hidden">
                      {activeStudent.fotoUrl ? (
                        <img src={activeStudent.fotoUrl} alt={activeStudent.nama} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[8.5px] text-neutral-400 text-center">Pas Foto<br />3 x 4</span>
                      )}
                    </div>
                  )}

                  {config.tampilkanQrVerifikasi && qrCodeUrl && (
                    <div className="text-center">
                      <div className="p-1 border border-neutral-300 rounded inline-block bg-white shadow-xs">
                        <img src={qrCodeUrl} alt="QR Validasi" className="w-14 h-14" />
                      </div>
                      <span className="block text-[7.5px] font-mono text-neutral-500 mt-0.5">
                        Scan Verifikasi Asli
                      </span>
                    </div>
                  )}
                </div>

                {/* Bagian Kanan: Tanda Tangan & Stempel */}
                <div className="text-center w-60">
                  <p className="text-[11.5px]">
                    {config.kotaSurat}, {config.tanggalSurat}
                  </p>
                  <p className="text-[11.5px] font-semibold">
                    {madrasah.jabatanPenandatangan || 'Kepala Madrasah'},
                  </p>

                  {/* Signature & Stamp Area */}
                  <div className="relative h-20 flex items-center justify-center my-0.5">
                    {/* Stempel Cap Basah */}
                    {config.tampilkanStempel && (
                      <div className="absolute left-3 -top-2 pointer-events-none z-10">
                        {madrasah.stempelUrl ? (
                          <img
                            src={madrasah.stempelUrl}
                            alt="Stempel"
                            className="w-24 h-24 object-contain opacity-85 mix-blend-multiply transform -rotate-12"
                          />
                        ) : (
                          <OfficialStamp
                            schoolName={madrasah.namaMadrasah}
                            location={config.kotaSurat}
                            className="w-24 h-24"
                          />
                        )}
                      </div>
                    )}

                    {/* Tanda Tangan Digital */}
                    {config.tampilkanTtd && (
                      <div className="relative z-0 pl-6">
                        {madrasah.ttdKepalaUrl ? (
                          <img
                            src={madrasah.ttdKepalaUrl}
                            alt="TTD Kepala"
                            className="w-28 h-16 object-contain mix-blend-multiply"
                          />
                        ) : (
                          <PrincipalSignature className="w-28 h-16" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Pejabat Name & NIP */}
                  <div>
                    <p className="text-[12px] font-bold underline underline-offset-2 min-h-[16px]">
                      {madrasah.namaKepalaMadrasah || 'Siti Rochimah, S.Pd.I'}
                    </p>
                    <p className="text-[10.5px] font-medium text-neutral-800">
                      {madrasah.labelIdPenandatangan || 'NIP'}. {madrasah.nipKepalaMadrasah || '197605122005012001'}
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
