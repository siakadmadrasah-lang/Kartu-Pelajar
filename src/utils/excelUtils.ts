import * as XLSX from 'xlsx';
import { Student } from '../types';

export interface ParsedStudentRow {
  student: Student;
  isValid: boolean;
  errors: string[];
}

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_SYNONYMS: Record<string, number> = {
  jan: 0, januari: 0, january: 0,
  feb: 1, februari: 1, february: 1,
  mar: 2, maret: 2, march: 2,
  apr: 3, april: 3,
  mei: 4, may: 4,
  jun: 5, juni: 5, june: 5,
  jul: 6, juli: 6, july: 6,
  agu: 7, ags: 7, agustus: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  okt: 9, oktober: 9, october: 9,
  nov: 10, november: 10,
  des: 11, desember: 11, december: 11,
};

/**
 * Robust date formatting for Indonesian strings, combined TTL strings, and Excel numeric serials
 */
export const formatIndonesianDate = (val: any): string => {
  if (val === null || val === undefined || val === '') return '01 Januari 2015';

  // 1. If Date object
  if (val instanceof Date && !isNaN(val.getTime())) {
    const d = val.getDate().toString().padStart(2, '0');
    const m = MONTH_NAMES_ID[val.getMonth()];
    const y = val.getFullYear();
    return `${d} ${m} ${y}`;
  }

  // 2. If number or numeric string (Excel serial date, e.g. 42138 or 44561)
  const num = Number(val);
  if (!isNaN(num) && num > 1000 && num < 100000 && !String(val).includes('-') && !String(val).includes('/') && !String(val).includes('.')) {
    try {
      const excelEpoch = new Date(Math.round((num - 25569) * 86400 * 1000));
      if (!isNaN(excelEpoch.getTime())) {
        const d = excelEpoch.getUTCDate().toString().padStart(2, '0');
        const m = MONTH_NAMES_ID[excelEpoch.getUTCMonth()];
        const y = excelEpoch.getUTCFullYear();
        return `${d} ${m} ${y}`;
      }
    } catch (e) {}
  }

  let str = String(val).trim();
  // Strip day names like "Senin, ", "Selasa, ", etc.
  str = str.replace(/^(senin|selasa|rabu|kamis|jumat|sabtu|minggu|mon|tue|wed|thu|fri|sat|sun)[,\s]+/i, '');

  // Check if string matches "DD Month YYYY" (e.g., "14 Mei 2014" or "14-Mei-2014")
  const wordMonthMatch = str.match(/(\d{1,2})[\s\-/.]([a-zA-Z]+)[\s\-/.],?[\s]*(\d{2,4})/);
  if (wordMonthMatch) {
    const day = parseInt(wordMonthMatch[1], 10);
    const rawMonth = wordMonthMatch[2].toLowerCase();
    let year = parseInt(wordMonthMatch[3], 10);
    if (year < 100) year += 2000;

    for (const [syn, idx] of Object.entries(MONTH_SYNONYMS)) {
      if (rawMonth.startsWith(syn)) {
        if (!isNaN(day) && day >= 1 && day <= 31 && !isNaN(year)) {
          return `${day.toString().padStart(2, '0')} ${MONTH_NAMES_ID[idx]} ${year}`;
        }
      }
    }
  }

  // Parse numeric formats: YYYY-MM-DD or DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const parts = str.match(/\b(\d{1,4})[-/.](\d{1,2})[-/.](\d{2,4})\b/);
  if (parts) {
    let day = 1, monthIdx = 0, year = 2015;
    if (parts[1].length === 4) {
      // YYYY-MM-DD
      year = parseInt(parts[1], 10);
      monthIdx = parseInt(parts[2], 10) - 1;
      day = parseInt(parts[3], 10);
    } else {
      // DD-MM-YYYY
      day = parseInt(parts[1], 10);
      monthIdx = parseInt(parts[2], 10) - 1;
      year = parseInt(parts[3], 10);
      if (year < 100) year += 2000;
    }

    if (!isNaN(day) && day >= 1 && day <= 31 && !isNaN(monthIdx) && monthIdx >= 0 && monthIdx < 12 && !isNaN(year)) {
      return `${day.toString().padStart(2, '0')} ${MONTH_NAMES_ID[monthIdx]} ${year}`;
    }
  }

  return str || '01 Januari 2015';
};

/**
 * Parses combined TTL string (e.g. "Banyumas, 14 Mei 2015" or "Malang / 14-05-2014")
 */
export const parseTtlCombined = (ttlStr: string, defaultCity = 'Banyumas'): { tempat: string; tanggal: string } => {
  if (!ttlStr || typeof ttlStr !== 'string') {
    return { tempat: defaultCity, tanggal: '01 Januari 2015' };
  }

  const clean = ttlStr.trim();
  // Split by comma or slash or semicolon
  if (clean.includes(',') || clean.includes('/') || clean.includes(';') || clean.includes('-')) {
    // Try split by comma first
    const commaParts = clean.split(/[,;/]/).map(s => s.trim()).filter(Boolean);
    if (commaParts.length >= 2) {
      const tempat = commaParts[0].replace(/^(tempat|ttl|tgl|tgl lahir)[\s:]*/i, '').trim();
      const rawDate = commaParts.slice(1).join(' ').trim();
      return {
        tempat: tempat || defaultCity,
        tanggal: formatIndonesianDate(rawDate)
      };
    }
  }

  return { tempat: defaultCity, tanggal: formatIndonesianDate(clean) };
};

/**
 * Normalizes string keys to facilitate header matching
 */
const normalizeKey = (key: string): string => {
  return String(key || '').toLowerCase().replace(/[^a-z0-9]/g, '');
};

/**
 * Parses Excel (.xlsx, .xls), CSV or TSV buffer/file into Student records with multi-sheet and auto-header scanning
 */
export const parseEmisExcelFile = async (file: File): Promise<{
  students: Student[];
  totalRows: number;
  validCount: number;
  invalidCount: number;
  warnings: string[];
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('Berkas Excel tidak memiliki sheet yang dapat dibaca.');
        }

        // Find the best sheet with student data
        let targetWorksheet: XLSX.WorkSheet | null = null;
        let bestSheetName = workbook.SheetNames[0];

        // Search for sheet with names like "Data Siswa", "EMIS", "Siswa", "Peserta Didik", "Kelas"
        for (const sheetName of workbook.SheetNames) {
          const lower = sheetName.toLowerCase();
          if (lower.includes('siswa') || lower.includes('emis') || lower.includes('peserta') || lower.includes('data') || lower.includes('santri')) {
            bestSheetName = sheetName;
            break;
          }
        }
        targetWorksheet = workbook.Sheets[bestSheetName];

        // Convert sheet to 2D array of rows to accurately detect header row index
        const rawRows = XLSX.utils.sheet_to_json<any[]>(targetWorksheet, { header: 1, defval: '' });

        if (!rawRows || rawRows.length === 0) {
          throw new Error(`Sheet "${bestSheetName}" kosong atau tidak memiliki data.`);
        }

        // Scan the first 20 rows to detect which row is the actual table header
        let headerRowIndex = -1;
        const requiredSynonyms = ['nama', 'nisn', 'nis', 'namasiswa', 'namalengkap', 'namapesertadidik', 'studentname', 'rombel', 'kelas', 'ttl', 'tempatlahir', 'jeniskelamin', 'gender'];

        for (let r = 0; r < Math.min(rawRows.length, 25); r++) {
          const rowValues = rawRows[r];
          if (!Array.isArray(rowValues)) continue;

          let matchScore = 0;
          for (const cell of rowValues) {
            const norm = normalizeKey(String(cell));
            if (requiredSynonyms.some(syn => norm.includes(syn) || syn.includes(norm))) {
              matchScore++;
            }
          }

          if (matchScore >= 2) {
            headerRowIndex = r;
            break;
          }
        }

        let rawJson: Record<string, any>[] = [];

        if (headerRowIndex >= 0) {
          const headers = (rawRows[headerRowIndex] as any[]).map((h, i) => String(h || `col_${i}`).trim());
          const dataRows = rawRows.slice(headerRowIndex + 1);
          rawJson = dataRows.map(row => {
            const obj: Record<string, any> = {};
            headers.forEach((h, colIdx) => {
              obj[h] = row[colIdx] !== undefined ? row[colIdx] : '';
            });
            return obj;
          });
        } else {
          // Fallback to standard sheet_to_json
          rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(targetWorksheet, { defval: '' });
        }

        if (rawJson.length === 0) {
          throw new Error('Tidak ditemukan baris data siswa yang valid di dalam berkas Excel.');
        }

        const parsedStudents: Student[] = [];
        const warnings: string[] = [];
        let validCount = 0;
        let invalidCount = 0;

        rawJson.forEach((row, index) => {
          // Normalize row keys
          const normalizedRow: Record<string, any> = {};
          Object.keys(row).forEach((k) => {
            normalizedRow[normalizeKey(k)] = row[k];
          });

          // Helper to find value by synonyms
          const getVal = (...synonyms: string[]): string => {
            for (const syn of synonyms) {
              const norm = normalizeKey(syn);
              if (normalizedRow[norm] !== undefined && String(normalizedRow[norm]).trim() !== '') {
                return String(normalizedRow[norm]).trim();
              }
              // Partial substring matching
              for (const key of Object.keys(normalizedRow)) {
                if (key.includes(norm) && String(normalizedRow[key]).trim() !== '') {
                  return String(normalizedRow[key]).trim();
                }
              }
            }
            return '';
          };

          const rawNama = getVal(
            'Nama Lengkap Siswa', 'Nama Siswa', 'Nama Lengkap', 'Nama Peserta Didik', 
            'Nama Santri', 'Nama Murid', 'Nama', 'Student Name', 'nama_lengkap', 'namasiswa'
          );
          let nisn = getVal('NISN', 'Nomor Induk Siswa Nasional', 'No NISN', 'No. NISN', 'nisn_siswa', 'nisn');
          let nis = getVal('NIS Lokal', 'NIS', 'Nomor Induk', 'NIPD', 'No Induk', 'No. Induk', 'nis_lokal', 'nislokal', 'nis');
          
          // Combined TTL or separate Tempat & Tanggal Lahir
          const combinedTtl = getVal('Tempat Tanggal Lahir', 'TTL', 'Tempat Tgl Lahir', 'Tempat/Tgl Lahir', 'Tempat, Tanggal Lahir', 'ttl_siswa');
          let tempatLahir = getVal('Tempat Lahir', 'Kota Lahir', 'Tempat', 'tempat_lahir', 'tempatlahir');
          let rawTanggalLahir = getVal('Tanggal Lahir', 'Tgl Lahir', 'Tanggal', 'Tgl', 'tgl_lahir', 'tanggallahir', 'DOB', 'Birth Date');

          if (combinedTtl && (!tempatLahir || !rawTanggalLahir)) {
            const parsedTtl = parseTtlCombined(combinedTtl);
            if (!tempatLahir) tempatLahir = parsedTtl.tempat;
            if (!rawTanggalLahir) rawTanggalLahir = parsedTtl.tanggal;
          }

          if (!tempatLahir) tempatLahir = 'Banyumas';
          const tanggalLahir = formatIndonesianDate(rawTanggalLahir || '01 Januari 2015');

          const genderRaw = getVal('Jenis Kelamin', 'JK', 'Gender', 'L/P', 'L / P', 'Sex', 'jenis_kelamin', 'jeniskelamin');
          const kelas = getVal('Kelas Rombel', 'Kelas / Rombel', 'Kelas/Rombel', 'Rombel', 'Nama Rombel', 'Tingkat', 'Rombongan Belajar', 'Kelas', 'kelas_rombel', 'kelas') || 'I - Abu Bakar';
          const tahunAjaran = getVal('Tahun Ajaran', 'Tahun Pelajaran', 'TP', 'T.P', 'Tahun Pelajaran (TP)', 'th_ajaran', 'tahunajaran') || '2025/2026';
          const agama = getVal('Agama', 'Religion', 'agama') || 'Islam';
          const golDarah = getVal('Golongan Darah', 'Gol Darah', 'Gol. Darah', 'Gol_Darah', 'Blood Type', 'goldarah') || '-';
          const alamat = getVal('Alamat Tinggal', 'Alamat Lengkap', 'Alamat Siswa', 'Alamat', 'Desa/Kelurahan', 'Domisili', 'alamat_siswa', 'alamat') || 'Desa Sanggreman, Kec. Rawalo';
          const namaWali = getVal('Nama Orang Tua Wali', 'Nama Orang Tua', 'Nama Ayah', 'Nama Ibu', 'Nama Wali', 'Orang Tua', 'Wali', 'nama_wali', 'orangtua');
          const fotoUrl = getVal('Foto', 'Foto Url', 'Foto Siswa', 'Photo', 'foto_url', 'fotourl');
          const berlakuSampai = getVal('Masa Berlaku', 'Berlaku Sampai', 'Berlaku Hingga', 'Expiry', 'berlaku_sampai') || 'Selama Menjadi Siswa';

          // Skip completely empty row or header remnants
          if (!rawNama && !nisn && !nis) {
            return;
          }

          const namaUpper = rawNama.toUpperCase();
          if (namaUpper.includes('NAMA LENGKAP') || namaUpper.includes('KEMENTERIAN AGAMA') || namaUpper.includes('MADRASAH')) {
            return;
          }

          // Format NISN (clean non digits)
          nisn = nisn.replace(/[^0-9]/g, '');
          if (!nisn || nisn.length < 5) {
            nisn = `01${Math.floor(10000000 + Math.random() * 90000000)}`;
            warnings.push(`Baris ${index + 1}: NISN tidak lengkap untuk ${rawNama || 'Siswa'}, dibuatkan NISN otomatis (${nisn}).`);
          }

          // Format NIS
          nis = nis.replace(/[^0-9]/g, '');
          if (!nis) {
            nis = `2324${(parsedStudents.length + 1).toString().padStart(4, '0')}`;
          }

          // Format Gender: L vs P
          const gLower = genderRaw.toLowerCase().trim();
          const isFemale = ['p', 'perempuan', 'wanita', 'pr', 'f', 'female', 'akhwat', 'w'].includes(gLower) || gLower.startsWith('perem') || gLower.startsWith('wan');
          const jenisKelamin: 'L' | 'P' = isFemale ? 'P' : 'L';

          // Format Name
          const cleanName = (rawNama || `SISWA BARU ${parsedStudents.length + 1}`).toUpperCase();

          const student: Student = {
            id: `std-emis-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${parsedStudents.length}`,
            nama: cleanName,
            nisn,
            nis,
            tempatLahir,
            tanggalLahir,
            jenisKelamin,
            kelas,
            tahunAjaran,
            agama,
            golonganDarah: (golDarah && golDarah !== '-') ? golDarah : undefined,
            alamat,
            namaWali: namaWali || undefined,
            fotoUrl: fotoUrl || '',
            berlakuSampai,
          };

          parsedStudents.push(student);
          validCount++;
        });

        if (parsedStudents.length === 0) {
          throw new Error('Tidak ada data siswa yang berhasil diekstrak dari berkas Excel. Pastikan terdapat kolom Nama, NISN, atau Kelas.');
        }

        resolve({
          students: parsedStudents,
          totalRows: parsedStudents.length,
          validCount,
          invalidCount,
          warnings,
        });
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Gagal memproses berkas Excel.'));
      }
    };

    reader.onerror = () => reject(new Error('Gagal membaca berkas Excel dari perangkat.'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Generates and downloads a standard EMIS Excel template (.xlsx)
 */
export const downloadEmisExcelTemplate = () => {
  const headers = [
    'NO',
    'NISN',
    'NIS_LOKAL',
    'NAMA_LENGKAP_SISWA',
    'TEMPAT_LAHIR',
    'TANGGAL_LAHIR',
    'JENIS_KELAMIN',
    'KELAS_ROMBEL',
    'TAHUN_AJARAN',
    'AGAMA',
    'GOLONGAN_DARAH',
    'ALAMAT_TINGGAL',
    'NAMA_ORANG_TUA_WALI',
    'MASA_BERLAKU'
  ];

  const sampleRows = [
    [
      1,
      '0123456789',
      '23240001',
      'MUHAMMAD FATIH AR-RASYID',
      'Banyumas',
      '14 Mei 2015',
      'L',
      'I - Abu Bakar Ash-Shiddiq',
      '2025/2026',
      'Islam',
      'O',
      'Jl. Sanggreman No. 02, RT 02 / RW 03, Rawalo',
      'Ahmad Syukron',
      'Selama Menjadi Siswa'
    ],
    [
      2,
      '0123456790',
      '23240002',
      'AISYAH HUMAIRA AZ-ZAHRA',
      'Banyumas',
      '22 Agustus 2015',
      'P',
      'I - Abu Bakar Ash-Shiddiq',
      '2025/2026',
      'Islam',
      'A',
      'Desa Sanggreman RT 01 / RW 02, Rawalo',
      'Fatimah Azzahra',
      'Selama Menjadi Siswa'
    ],
    [
      3,
      '0123456791',
      '23240003',
      'AHMAD AL-GHAZALI PRATAMA',
      'Banyumas',
      '09 Januari 2014',
      'L',
      'II - Umar Bin Khattab',
      '2025/2026',
      'Islam',
      'B',
      'Jl. Raya Rawalo No. 15, Banyumas',
      'Hendra Pratama',
      'Selama Menjadi Siswa'
    ],
    [
      4,
      '0123456792',
      '23240004',
      'ZAHRA KHAIRUNNISA',
      'Banyumas',
      '17 Oktober 2014',
      'P',
      'II - Umar Bin Khattab',
      '2025/2026',
      'Islam',
      'AB',
      'Desa Pesawahan RT 03 / RW 01, Rawalo',
      'Nur Hidayat',
      'Selama Menjadi Siswa'
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 5 },  // NO
    { wch: 14 }, // NISN
    { wch: 12 }, // NIS
    { wch: 30 }, // NAMA
    { wch: 15 }, // TEMPAT
    { wch: 16 }, // TGL
    { wch: 12 }, // JK
    { wch: 25 }, // KELAS
    { wch: 14 }, // TP
    { wch: 10 }, // AGAMA
    { wch: 10 }, // GOL DARAH
    { wch: 35 }, // ALAMAT
    { wch: 20 }, // WALI
    { wch: 22 }, // MASA BERLAKU
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'DATA_SISWA_EMIS');
  XLSX.writeFile(wb, 'TEMPLATE_EMIS_KARTU_PELAJAR_MI.xlsx');
};

/**
 * Exports currently loaded students to formatted EMIS Excel (.xlsx)
 */
export const exportStudentsToEmisExcel = (students: Student[], madrasahName: string) => {
  const headers = [
    'NO',
    'NISN',
    'NIS_LOKAL',
    'NAMA_LENGKAP_SISWA',
    'TEMPAT_LAHIR',
    'TANGGAL_LAHIR',
    'JENIS_KELAMIN',
    'KELAS_ROMBEL',
    'TAHUN_AJARAN',
    'AGAMA',
    'GOLONGAN_DARAH',
    'ALAMAT_TINGGAL',
    'NAMA_ORANG_TUA_WALI',
    'MASA_BERLAKU'
  ];

  const rows = students.map((s, idx) => [
    idx + 1,
    s.nisn,
    s.nis,
    s.nama,
    s.tempatLahir,
    s.tanggalLahir,
    s.jenisKelamin,
    s.kelas,
    s.tahunAjaran,
    s.agama,
    s.golonganDarah || '-',
    s.alamat,
    s.namaWali || '-',
    s.berlakuSampai
  ]);

  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 14 },
    { wch: 32 },
    { wch: 16 },
    { wch: 18 },
    { wch: 15 },
    { wch: 26 },
    { wch: 14 },
    { wch: 12 },
    { wch: 16 },
    { wch: 38 },
    { wch: 22 },
    { wch: 22 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'DATA_SISWA_MI');

  const safeName = madrasahName.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(wb, `DATA_SISWA_${safeName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
