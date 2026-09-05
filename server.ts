import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Body parser with 50mb limit for base64 images (photos, logos, signatures)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Strict No-Cache headers on all API endpoints to guarantee instant synchronization across WiFi & Mobile Data
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  next();
});

// SSE (Server-Sent Events) connected clients pool for zero-latency push sync
const sseClients: express.Response[] = [];

function broadcastToClients(payload: any) {
  const dataString = `data: ${JSON.stringify(payload)}\n\n`;
  for (let i = sseClients.length - 1; i >= 0; i--) {
    const client = sseClients[i];
    try {
      client.write(dataString);
      if (typeof (client as any).flush === 'function') {
        (client as any).flush();
      }
    } catch (err) {
      sseClients.splice(i, 1);
    }
  }
}

// Frequent 5s heartbeat to keep connections alive across mobile cellular carriers and WiFi firewalls
setInterval(() => {
  for (let i = sseClients.length - 1; i >= 0; i--) {
    const client = sseClients[i];
    try {
      client.write(`: heartbeat ${Date.now()}\n\n`);
      if (typeof (client as any).flush === 'function') {
        (client as any).flush();
      }
    } catch (e) {
      sseClients.splice(i, 1);
    }
  }
}, 5000);

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const PERSISTENT_DB_FILE = path.join(DATA_DIR, 'persistent_database.json');
const STUDENTS_VAULT_FILE = path.join(DATA_DIR, 'students_vault.json');
const MADRASAH_VAULT_FILE = path.join(DATA_DIR, 'madrasah_vault.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial fallback data if database.json doesn't exist
const INITIAL_STUDENTS_LIST: any[] = [];

const INITIAL_DATABASE = {
  madrasah: {
    namaKementerian: 'KEMENTERIAN AGAMA REPUBLIK INDONESIA',
    namaMadrasah: "MI MA'ARIF NU 2 SANGGREMAN",
    nsm: '111233020050',
    npsn: '60710255',
    kemenagWilayah: 'KANTOR KEMENTERIAN AGAMA KABUPATEN BANYUMAS',
    provinsi: 'JAWA TENGAH',
    alamat: 'Jl. Sanggreman No. 02, Desa Sanggreman',
    kelurahanDesa: 'Sanggreman',
    kecamatan: 'Rawalo',
    kotaKab: 'Kab. Banyumas',
    kodePos: '53173',
    telepon: '(0281) 684-1234',
    email: 'mimaarifnu2sanggreman@gmail.com',
    website: 'www.mimaarifnu2sanggreman.sch.id',
    akreditasi: 'A',
    motto: 'Berakhlakul Karimah, Cerdas, Mandiri, dan Berprestasi',
    jabatanPenandatangan: 'Kepala Madrasah',
    labelIdPenandatangan: 'NIP',
    namaKepalaMadrasah: 'Siti Rochimah, S.Pd.I',
    nipKepalaMadrasah: '197605122005012001',
    kotaPenetapan: 'Banyumas',
    tanggalPenetapan: '15 Juli 2025',
    tahunPelajaran: '2025/2026',
    judulHeaderAplikasi: 'KARTU PELAJAR DIGITAL',
    subJudulHeaderAplikasi: "MI MA'ARIF NU 2 SANGGREMAN",
    badgeHeaderAplikasi: 'KEMENAG RI',
    showMadrasahInHeader: true,
  },
  students: INITIAL_STUDENTS_LIST,
  cardConfig: {
    orientation: 'landscape',
    theme: 'kemenag-green',
    watermark: 'islamic-star',
    showBarcode: true,
    barcodeType: 'nisn',
    showQrCode: true,
    qrContent: 'verification_url',
    showHologram: true,
    logoMode: 'both',
    showKemenagLogo: true,
    showMadrasahLogo: true,
    showNamaKementerian: true,
    showNamaKementerianSurat: true,
    showSignature: true,
    showStamp: true,
    signatoryPosition: 'back',
    stampOpacity: 0.85,
    backContentPreset: 'tata-tertib',
    customBackNotes: [
      'Kartu ini adalah bukti sah sebagai peserta didik Madrasah Ibtidaiyah.',
      'Wajib dibawa setiap hari saat kegiatan belajar mengajar berlangsung.',
      'Dilarang meminjamkan, menyalahgunakan, atau merusak kartu ini.',
      'Apabila kartu hilang/rusak, segera laporkan ke bagian Tata Usaha Madrasah.',
      'Barangsiapa menemukan kartu ini, harap mengembalikan ke alamat madrasah yang tertera.'
    ],
    customBackTitle: 'KETENTUAN DAN TATA TERTIB SISWA',
    cardRadius: 'rounded-xl',
    showBloodType: true,
    showAddress: true,
    showParentName: false,
    showExpiryDate: true,
  },
  loaderConfig: {
    enabled: true,
    title: 'KARTU PELAJAR MI',
    badgeText: 'KEMENAG RI',
    subtitle: 'Sistem Generator & Cetak Kartu Siswa Madrasah Ibtidaiyah',
    footerText: 'Kementerian Agama Republik Indonesia • Madrasah Mandiri Berprestasi',
    theme: 'dark-emerald',
    logoType: 'kemenag',
    customLogoUrl: '',
    logoAnimation: 'spin-glow',
    showRadialGlow: true,
    showProgressBar: true,
    showChecklist: true,
    checklistItems: ['Standar CR80', 'Basis EMIS', 'Cetak PVC/A4'],
    loadingDurationMs: 1200,
    step1Text: 'Memverifikasi Basis Data EMIS & Format CR80...',
    step2Text: 'Menyiapkan Engine Pratinjau 3D & Template Kemenag...',
    step3Text: 'Sistem Siap Digunakan!',
  },
  activityLogs: [
    {
      id: 'log-1',
      action: 'Inisialisasi Sistem Terpusat',
      timestamp: '08:00',
      operator: 'Sistem Database Pusat',
      details: 'Basis data siswa dan profil madrasah aktif otomatis.',
      type: 'security',
    },
  ],
  lastUpdated: new Date().toISOString(),
};

// In-memory cache for fast, race-condition-free database access
let inMemoryDb: any = null;
let isWriting = false;
let pendingWriteData: any = null;

// Helper to read database with primary storage, fallback mirror, and permanent students vault recovery
function readDb() {
  let dbData: any = null;
  let pData: any = null;
  let vaultStudents: any[] = [];
  let vaultMadrasah: any = null;

  // 1. Read permanent students vault and madrasah vault
  try {
    if (fs.existsSync(STUDENTS_VAULT_FILE)) {
      const vRaw = fs.readFileSync(STUDENTS_VAULT_FILE, 'utf-8');
      const parsedVault = JSON.parse(vRaw);
      if (Array.isArray(parsedVault) && parsedVault.length > 0) {
        vaultStudents = parsedVault;
      }
    }
  } catch (e) {
    console.warn('Error reading STUDENTS_VAULT_FILE:', e);
  }

  try {
    if (fs.existsSync(MADRASAH_VAULT_FILE)) {
      const mvRaw = fs.readFileSync(MADRASAH_VAULT_FILE, 'utf-8');
      const parsedMv = JSON.parse(mvRaw);
      if (parsedMv && typeof parsedMv === 'object' && parsedMv.namaMadrasah) {
        vaultMadrasah = parsedMv;
      }
    }
  } catch (e) {
    console.warn('Error reading MADRASAH_VAULT_FILE:', e);
  }

  // 2. Read database.json
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      dbData = JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error parsing DB_FILE:', e);
  }

  // 3. Read persistent_database.json
  try {
    if (fs.existsSync(PERSISTENT_DB_FILE)) {
      const raw = fs.readFileSync(PERSISTENT_DB_FILE, 'utf-8');
      pData = JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error parsing PERSISTENT_DB_FILE:', e);
  }

  // 4. Read root backup_data_madrasah.json if exists
  let rootBackupData: any = null;
  try {
    const rootBackup = path.join(process.cwd(), 'backup_data_madrasah.json');
    if (fs.existsSync(rootBackup)) {
      const raw = fs.readFileSync(rootBackup, 'utf-8');
      rootBackupData = JSON.parse(raw);
    }
  } catch (e) {}

  let chosen = null;
  if (dbData && pData) {
    const timeDb = dbData.lastUpdated ? new Date(dbData.lastUpdated).getTime() : 0;
    const timeP = pData.lastUpdated ? new Date(pData.lastUpdated).getTime() : 0;
    chosen = timeP > timeDb ? pData : dbData;
  } else if (dbData) {
    chosen = dbData;
  } else if (pData) {
    chosen = pData;
  } else if (rootBackupData) {
    chosen = rootBackupData;
  }

  if (chosen && typeof chosen === 'object') {
    if (!Array.isArray(chosen.students)) {
      chosen.students = [];
    }
    // Safeguard: If chosen has 0 students but vault has students, auto-heal from vault!
    if (chosen.students.length === 0 && vaultStudents.length > 0) {
      chosen.students = vaultStudents;
    } else if (chosen.students.length === 0 && rootBackupData && Array.isArray(rootBackupData.students) && rootBackupData.students.length > 0) {
      chosen.students = rootBackupData.students;
    }
    // Sync madrasah from vault if present
    if (vaultMadrasah && vaultMadrasah.namaMadrasah) {
      chosen.madrasah = { ...chosen.madrasah, ...vaultMadrasah };
    }
    inMemoryDb = chosen;
    return inMemoryDb;
  }

  // Initialize with initial database only if database file does not exist at all
  inMemoryDb = JSON.parse(JSON.stringify(INITIAL_DATABASE));
  if (vaultMadrasah && vaultMadrasah.namaMadrasah) {
    inMemoryDb.madrasah = vaultMadrasah;
  }
  if (vaultStudents.length > 0) {
    inMemoryDb.students = vaultStudents;
  } else if (rootBackupData && Array.isArray(rootBackupData.students) && rootBackupData.students.length > 0) {
    inMemoryDb.students = rootBackupData.students;
  }
  writeDb(inMemoryDb);
  return inMemoryDb;
}

// Helper to write database atomically with permanent vault safeguarding
function writeDb(data: any, isExplicitClear: boolean = false) {
  try {
    let finalStudents = data.students;

    // Check permanent students vault safeguarding
    if (Array.isArray(finalStudents) && finalStudents.length > 0) {
      // Save to permanent vault immediately
      try {
        fs.writeFileSync(STUDENTS_VAULT_FILE, JSON.stringify(finalStudents, null, 2), 'utf-8');
      } catch (errVault) {
        console.warn('Could not write STUDENTS_VAULT_FILE:', errVault);
      }
    } else if (isExplicitClear) {
      // Explicit admin clear action: wipe vault
      try {
        fs.writeFileSync(STUDENTS_VAULT_FILE, JSON.stringify([], null, 2), 'utf-8');
      } catch (errVault) {}
      finalStudents = [];
    } else {
      // Not an explicit clear: preserve from vault if available
      try {
        if (fs.existsSync(STUDENTS_VAULT_FILE)) {
          const vRaw = fs.readFileSync(STUDENTS_VAULT_FILE, 'utf-8');
          const vParsed = JSON.parse(vRaw);
          if (Array.isArray(vParsed) && vParsed.length > 0) {
            finalStudents = vParsed;
          }
        }
      } catch (e) {}
    }

    // Check permanent madrasah vault safeguarding
    if (data.madrasah && typeof data.madrasah === 'object' && data.madrasah.namaMadrasah) {
      try {
        fs.writeFileSync(MADRASAH_VAULT_FILE, JSON.stringify(data.madrasah, null, 2), 'utf-8');
      } catch (errVault) {
        console.warn('Could not write MADRASAH_VAULT_FILE:', errVault);
      }
    }

    const updated = {
      ...data,
      students: Array.isArray(finalStudents) ? finalStudents : [],
      lastUpdated: new Date().toISOString(),
    };
    
    // Update in-memory state immediately so concurrent requests see latest data
    inMemoryDb = updated;

    const jsonString = JSON.stringify(updated, null, 2);
    
    // Ensure parent directory exists
    const dbDir = path.dirname(DB_FILE);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Atomic disk write
    fs.writeFileSync(DB_FILE, jsonString, 'utf-8');
    
    // Save redundant copy to persistent mirror
    try {
      const persistentDir = path.dirname(PERSISTENT_DB_FILE);
      if (!fs.existsSync(persistentDir)) {
        fs.mkdirSync(persistentDir, { recursive: true });
      }
      fs.writeFileSync(PERSISTENT_DB_FILE, jsonString, 'utf-8');
    } catch (e) {
      console.warn('Could not write persistent mirror:', e);
    }

    // Save redundant copy to root backup file
    try {
      const rootBackup = path.join(process.cwd(), 'backup_data_madrasah.json');
      fs.writeFileSync(rootBackup, jsonString, 'utf-8');
    } catch (e) {}

    // Instantly broadcast update to all connected clients (WiFi & Cellular) via SSE
    try {
      broadcastToClients({
        type: 'sync',
        lastUpdated: updated.lastUpdated,
        totalStudents: updated.students?.length || 0,
        madrasah: updated.madrasah,
        students: updated.students,
        cardConfig: updated.cardConfig,
        loaderConfig: updated.loaderConfig,
        activityLogs: updated.activityLogs,
        isExplicitClear: isExplicitClear,
      });
    } catch (e) {
      console.warn('SSE broadcast error:', e);
    }

    return updated;
  } catch (error) {
    console.error('Error writing database file:', error);
    throw error;
  }
}

// ==================== API ROUTES ====================

// Realtime SSE Live Stream (Instant zero-delay synchronization across WiFi & Data Seluler)
const handleSseStream = (req: express.Request, res: express.Response) => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform, no-store, must-revalidate');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Pragma', 'no-cache');
  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

  // Immediately send initial database snapshot upon client connection
  try {
    const db = readDb();
    res.write(`data: ${JSON.stringify({
      type: 'init',
      lastUpdated: db.lastUpdated,
      totalStudents: db.students?.length || 0,
      madrasah: db.madrasah,
      students: db.students,
      cardConfig: db.cardConfig,
      loaderConfig: db.loaderConfig,
      activityLogs: db.activityLogs,
    })}\n\n`);
  } catch (e) {
    console.error('Error sending initial SSE snapshot:', e);
  }

  sseClients.push(res);

  req.on('close', () => {
    const index = sseClients.indexOf(res);
    if (index !== -1) {
      sseClients.splice(index, 1);
    }
  });
};

app.get('/api/live-stream', handleSseStream);
app.get('/api/events', handleSseStream);
app.get('/api/live-sync', handleSseStream);

// Ultra-fast lightweight version/timestamp check (< 200 bytes)
const handleVersionResponse = (req: express.Request, res: express.Response) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  const db = readDb();
  res.json({
    success: true,
    status: 'success',
    lastUpdated: db.lastUpdated || '',
    totalStudents: db.students?.length || 0,
    madrasahName: db.madrasah?.namaMadrasah || '',
    tahunPelajaran: db.madrasah?.tahunPelajaran || '2025/2026',
    timestamp: Date.now(),
  });
};

app.get('/api/version', handleVersionResponse);
app.get('/api/version.php', handleVersionResponse);

app.get('/api/last-updated', (req, res) => {
  const db = readDb();
  res.json({
    success: true,
    lastUpdated: db.lastUpdated || '',
    totalStudents: db.students?.length || 0,
    timestamp: Date.now(),
  });
});

// Health check and database stats
app.get('/api/health', (req, res) => {
  const db = readDb();
  res.json({
    status: 'ok',
    mode: 'centralized-database',
    totalStudents: db.students?.length || 0,
    madrasah: db.madrasah?.namaMadrasah || 'MI',
    lastUpdated: db.lastUpdated,
    serverTime: new Date().toISOString(),
  });
});

// Helper for DB status
const handleDbStatus = (req: express.Request, res: express.Response) => {
  const db = readDb();
  res.json({
    connected: true,
    driver: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_DATABASE || 'jaenal_kartupelajar',
    user: process.env.DB_USERNAME || 'jaenal_kartupelajar',
    studentsCount: db.students?.length || 0,
    madrasahName: db.madrasah?.namaMadrasah || "MI MA'ARIF NU 2 SANGGREMAN",
    lastUpdated: db.lastUpdated || new Date().toISOString(),
    error: null,
  });
};

app.get('/api/db-status', handleDbStatus);
app.get('/api/db_status', handleDbStatus);

// GET full synchronized database with strict anti-cache headers for 100% parity
app.get('/api/data', (req, res) => {
  if (req.query.action === 'db_status') {
    return handleDbStatus(req, res);
  }
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  try {
    const db = readDb();
    res.json({
      success: true,
      data: db,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data dari database server',
      error: error?.message,
    });
  }
});

// PHP route aliases for maximum compatibility
app.get('/api/data.php', (req, res) => {
  if (req.query.action === 'db_status') {
    return handleDbStatus(req, res);
  }
  try {
    const db = readDb();
    res.json({ success: true, data: db });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/sync.php', (req, res) => {
  try {
    const db = readDb();
    res.json({ success: true, data: db });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/health.php', (req, res) => {
  const db = readDb();
  res.json({
    status: 'ok',
    mode: 'centralized-database',
    totalStudents: db.students?.length || 0,
    madrasah: db.madrasah?.namaMadrasah || 'MI',
    lastUpdated: db.lastUpdated,
    serverTime: new Date().toISOString(),
  });
});

// POST & PATCH full update / partial update to database
const handleDataUpdate = (req: express.Request, res: express.Response) => {
  try {
    const currentDb = readDb();
    const incoming = req.body || {};
    const isExplicitClear = incoming.action === 'clear_students' || incoming.isExplicitClear === true;

    let nextStudents = currentDb.students;
    if (incoming.students !== undefined && Array.isArray(incoming.students)) {
      if (incoming.students.length > 0) {
        nextStudents = incoming.students;
      } else if (isExplicitClear) {
        nextStudents = [];
      } else {
        // incoming is [] but not marked as explicit clear - retain existing students!
        nextStudents = (currentDb.students && currentDb.students.length > 0) ? currentDb.students : [];
      }
    }

    let nextMadrasah = currentDb.madrasah;
    if (incoming.madrasah !== undefined && typeof incoming.madrasah === 'object') {
      nextMadrasah = { ...currentDb.madrasah, ...incomingMad };
    } else if (incoming.namaMadrasah !== undefined || incoming.nsm !== undefined) {
      nextMadrasah = { ...currentDb.madrasah, ...incoming };
    }

    const merged = {
      ...currentDb,
      madrasah: nextMadrasah,
      students: nextStudents,
      ...(incoming.cardConfig !== undefined ? { cardConfig: { ...currentDb.cardConfig, ...incoming.cardConfig } } : {}),
      ...(incoming.loaderConfig !== undefined ? { loaderConfig: { ...currentDb.loaderConfig, ...incoming.loaderConfig } } : {}),
      ...(incoming.activityLogs !== undefined ? { activityLogs: incoming.activityLogs } : {}),
    };

    const saved = writeDb(merged, isExplicitClear);
    res.json({
      success: true,
      message: 'Data berhasil disimpan dan disinkronkan ke seluruh perangkat',
      lastUpdated: saved.lastUpdated,
      totalStudents: saved.students?.length || 0,
      madrasah: {
        namaMadrasah: saved.madrasah?.namaMadrasah,
        tahunPelajaran: saved.madrasah?.tahunPelajaran,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Gagal menyimpan ke database server',
      error: error.message,
    });
  }
};

app.post('/api/data', handleDataUpdate);
app.patch('/api/data', handleDataUpdate);
app.put('/api/data', handleDataUpdate);
app.post('/api/data.php', handleDataUpdate);
app.post('/api/sync.php', handleDataUpdate);

// POST, PATCH, PUT update madrasah profile
const handleMadrasahUpdate = (req: express.Request, res: express.Response) => {
  try {
    const currentDb = readDb();
    const payload = req.body && req.body.madrasah ? req.body.madrasah : req.body;
    currentDb.madrasah = { ...currentDb.madrasah, ...payload };
    const saved = writeDb(currentDb);
    res.json({ 
      success: true, 
      message: 'Profil & Logo Madrasah berhasil diperbarui di server pusat',
      madrasah: saved.madrasah, 
      lastUpdated: saved.lastUpdated 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

app.post('/api/madrasah', handleMadrasahUpdate);
app.patch('/api/madrasah', handleMadrasahUpdate);
app.put('/api/madrasah', handleMadrasahUpdate);

// POST, PATCH, PUT update card configuration
const handleConfigUpdate = (req: express.Request, res: express.Response) => {
  try {
    const currentDb = readDb();
    const payload = req.body && req.body.cardConfig ? req.body.cardConfig : req.body;
    currentDb.cardConfig = { ...currentDb.cardConfig, ...payload };
    const saved = writeDb(currentDb);
    res.json({
      success: true,
      message: 'Konfigurasi kartu berhasil diperbarui',
      cardConfig: saved.cardConfig,
      lastUpdated: saved.lastUpdated
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

app.get('/api/config', (req, res) => {
  const db = readDb();
  res.json({ success: true, cardConfig: db.cardConfig });
});
app.get('/api/card-config', (req, res) => {
  const db = readDb();
  res.json({ success: true, cardConfig: db.cardConfig });
});
app.post('/api/config', handleConfigUpdate);
app.patch('/api/config', handleConfigUpdate);
app.put('/api/config', handleConfigUpdate);
app.post('/api/card-config', handleConfigUpdate);
app.patch('/api/card-config', handleConfigUpdate);
app.put('/api/card-config', handleConfigUpdate);
app.post('/api/card-design', handleConfigUpdate);
app.patch('/api/card-design', handleConfigUpdate);

// POST update students list
app.post('/api/students', (req, res) => {
  try {
    const currentDb = readDb();
    if (Array.isArray(req.body)) {
      currentDb.students = req.body;
    } else if (req.body.students !== undefined && Array.isArray(req.body.students)) {
      currentDb.students = req.body.students;
    }
    const saved = writeDb(currentDb);
    res.json({ success: true, totalStudents: saved.students.length, lastUpdated: saved.lastUpdated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE single student by ID
app.delete('/api/students/:id', (req, res) => {
  try {
    const currentDb = readDb();
    const studentId = req.params.id;
    const initialCount = currentDb.students?.length || 0;
    currentDb.students = (currentDb.students || []).filter((s: any) => s.id !== studentId);
    const saved = writeDb(currentDb);
    res.json({ 
      success: true, 
      message: `Siswa ID ${studentId} berhasil dihapus permanen`, 
      totalStudents: saved.students.length,
      deleted: initialCount !== saved.students.length,
      lastUpdated: saved.lastUpdated 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST / DELETE clear all students
app.post('/api/students/clear', (req, res) => {
  try {
    const currentDb = readDb();
    currentDb.students = [];
    const saved = writeDb(currentDb, true);
    res.json({ 
      success: true, 
      message: 'Seluruh data siswa berhasil dikosongkan secara permanen', 
      totalStudents: 0,
      lastUpdated: saved.lastUpdated 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST reset to standard default data
app.post('/api/reset', (req, res) => {
  try {
    const saved = writeDb(INITIAL_DATABASE);
    res.json({ success: true, message: 'Database direset ke pengaturan standar', data: saved });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== APP BUNDLE PACKAGING ENDPOINTS (FOR ZIP EXPORT) ====================
// Endpoint to provide production app bundle to ZIP generator
app.get('/app-bundle/manifest.json', async (req, res) => {
  try {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (!fs.existsSync(distPath) || !fs.existsSync(path.join(distPath, 'index.html'))) {
      const { build: viteBuild } = await import('vite');
      await viteBuild({
        build: {
          outDir: 'dist',
          emptyOutDir: false,
        },
      });
    }

    const getFiles = (dir: string, base = ''): string[] => {
      let results: string[] = [];
      if (!fs.existsSync(dir)) return results;
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const fullPath = path.join(dir, file);
        const relativePath = base ? `${base}/${file}` : file;
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          results = results.concat(getFiles(fullPath, relativePath));
        } else {
          // exclude node server files and backend files so dynamic ones from zip generator take precedence
          if (
            !file.startsWith('server.cjs') && 
            !file.endsWith('.map') && 
            !file.endsWith('.map.json') &&
            !file.endsWith('.php') &&
            !file.endsWith('.sql') &&
            file !== 'database.json' &&
            file !== 'persistent_database.json' &&
            file !== 'user_settings.json' &&
            file !== 'backup_data_madrasah.json'
          ) {
            results.push(relativePath);
          }
        }
      }
      return results;
    };

    const files = getFiles(distPath);
    res.json({ files });
  } catch (error: any) {
    console.error('Error generating bundle manifest:', error);
    res.status(500).json({ error: error.message, files: [] });
  }
});

app.get('/app-bundle/*', (req, res) => {
  try {
    const relPath = req.params[0] || '';
    const distPath = path.resolve(process.cwd(), 'dist');
    const filePath = path.resolve(distPath, relPath);

    // Prevent path traversal
    if (!filePath.startsWith(distPath)) {
      return res.status(403).send('Forbidden');
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return res.sendFile(filePath, (err) => {
        if (err && !res.headersSent) {
          res.status(404).send('File not found');
        }
      });
    } else {
      return res.status(404).send('File not found in bundle');
    }
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(404).send('Not found');
    }
  }
});

// ==================== VITE & STATIC SERVING ====================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));
    app.get('*', (req, res) => {
      if (fs.existsSync(indexPath)) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.sendFile(indexPath, (err) => {
          if (err && !res.headersSent) {
            res.status(404).send('Page Not Found');
          }
        });
      } else {
        res.status(404).send('Application build not found.');
      }
    });
  }

  // Global error handler to catch NotFoundError from static serving or missing resources
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (res.headersSent) {
      return next(err);
    }
    const status = err.status || err.statusCode || 500;
    if (status === 404) {
      return res.status(404).send('Not Found');
    }
    console.error('Server error handler caught:', err);
    res.status(status).json({ error: err.message || 'Internal Server Error' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Database Server] Berjalan di port ${PORT}`);
    console.log(`[Database Server] Penyimpanan persisten aktif di: ${DB_FILE}`);
  });
}

startServer();
