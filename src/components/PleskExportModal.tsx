import React, { useState } from 'react';
import { MadrasahInfo, Student, CardConfig, PleskDeployOptions, PageLoaderConfig } from '../types';
import { 
  createPleskDeployZip, 
  DEFAULT_MYSQL_CONFIG, 
  generateMysqlSqlDump, 
  generatePhpConfigFile 
} from '../utils/pleskDeployUtils';
import { 
  Download, 
  X, 
  Server, 
  FileText, 
  CheckCircle2, 
  Copy, 
  Check, 
  ShieldCheck, 
  Globe, 
  ExternalLink,
  Layers,
  FolderArchive,
  Info,
  Database,
  Key,
  Code2,
  Terminal,
  CheckCheck
} from 'lucide-react';

interface PleskExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  madrasah: MadrasahInfo;
  students: Student[];
  config: CardConfig;
  loaderConfig?: PageLoaderConfig;
}

export const PleskExportModal: React.FC<PleskExportModalProps> = ({
  isOpen,
  onClose,
  madrasah,
  students,
  config,
  loaderConfig,
}) => {
  const [options, setOptions] = useState<PleskDeployOptions>({
    domainName: madrasah.website || 'kartu.madrasah.sch.id',
    phpVersion: '8.2',
    enableHttpsRedirect: true,
    enableGzip: true,
    enableSpaRewrite: true,
    includeCurrentData: true,
    dbHost: DEFAULT_MYSQL_CONFIG.dbHost,
    dbName: DEFAULT_MYSQL_CONFIG.dbName,
    dbUser: DEFAULT_MYSQL_CONFIG.dbUser,
    dbPass: DEFAULT_MYSQL_CONFIG.dbPass,
    includeMysqlBridge: true,
  });

  const [activeTab, setActiveTab] = useState<'settings' | 'guide' | 'database' | 'files' | 'htaccess'>('settings');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [copiedHtaccess, setCopiedHtaccess] = useState(false);
  const [copiedNginx, setCopiedNginx] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedDbCreds, setCopiedDbCreds] = useState(false);
  const [showPassword, setShowPassword] = useState(true);

  const handleDownloadZip = async () => {
    try {
      setIsGenerating(true);
      setProgress(10);
      setStatusText('Menyiapkan file aplikasi & aset siap pakai...');

      const zipBlob = await createPleskDeployZip(
        madrasah,
        students,
        config,
        options,
        loaderConfig,
        (p, text) => {
          setProgress(p);
          setStatusText(text);
        }
      );

      const cleanSchoolName = madrasah.namaMadrasah.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
      const filename = `KARTU_PELAJAR_SIAP_DEPLOY_${cleanSchoolName}_${Date.now()}.zip`;

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsGenerating(false);
    } catch (err) {
      console.error('Error generating deploy zip:', err);
      alert('Gagal membuat file ZIP. Silakan coba lagi.');
      setIsGenerating(false);
    }
  };

  const handleDownloadSqlOnly = () => {
    try {
      const sqlDump = generateMysqlSqlDump(madrasah, students, config, options, loaderConfig);
      const blob = new Blob([sqlDump], { type: 'application/sql' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${options.dbName || DEFAULT_MYSQL_CONFIG.dbName}.sql`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting SQL:', err);
    }
  };

  const sampleHtaccess = `<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    # Force HTTPS
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
    # SPA Fallback
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ index.html [QSA,L]
</IfModule>`;

  const sampleNginx = `location / {
    try_files $uri $uri/ /index.html;
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-4 text-white flex items-center justify-between border-b border-emerald-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800/80 border border-amber-400/50 flex items-center justify-center text-amber-300 shadow-md">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-wide">
                  Ekspor Paket ZIP Siap Pasang Hosting
                </h3>
                <span className="bg-emerald-400 text-emerald-950 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                  1-Click Ready
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                Unduh paket ZIP lengkap untuk di-upload langsung ke folder <strong>httpdocs</strong> / <strong>public_html</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 pt-2 gap-1.5 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-3 font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-emerald-400 text-emerald-400 bg-slate-900/80 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📦 Paket Siap Pasang
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-2 px-3 font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'guide'
                ? 'border-emerald-400 text-emerald-400 bg-slate-900/80 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📖 Panduan Upload
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`py-2 px-3 font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'database'
                ? 'border-amber-400 text-amber-400 bg-slate-900/80 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>MySQL (Opsional)</span>
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`py-2 px-3 font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'files'
                ? 'border-emerald-400 text-emerald-400 bg-slate-900/80 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Berkas ZIP
          </button>
          <button
            onClick={() => setActiveTab('htaccess')}
            className={`py-2 px-3 font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'htaccess'
                ? 'border-emerald-400 text-emerald-400 bg-slate-900/80 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            .htaccess
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* TAB: DATABASE MYSQL */}
          {activeTab === 'database' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-gradient-to-r from-amber-950/40 via-slate-900 to-emerald-950/40 rounded-xl border border-amber-500/40 flex items-start gap-3 shadow-sm">
                <Database className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-slate-300 leading-relaxed">
                  <strong className="text-amber-300">Akun Database MySQL Plesk Terkonfigurasi:</strong> Semua file koneksi (<code className="text-emerald-300 bg-slate-950 px-1 py-0.5 rounded">config.php</code>, <code className="text-emerald-300 bg-slate-950 px-1 py-0.5 rounded">koneksi.php</code>, <code className="text-emerald-300 bg-slate-950 px-1 py-0.5 rounded">.env</code>, dan <code className="text-amber-300 bg-slate-950 px-1 py-0.5 rounded">{options.dbName}.sql</code>) disesuaikan otomatis untuk deployment Plesk.
                </div>
              </div>

              {/* MySQL Credentials Form Card */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-amber-300">
                    <Key className="w-3.5 h-3.5" /> Kredensial MySQL Plesk
                  </h4>
                  <button
                    onClick={() => {
                      const text = `DB Host: ${options.dbHost}\nDB Name: ${options.dbName}\nDB User: ${options.dbUser}\nDB Password: ${options.dbPass}`;
                      navigator.clipboard.writeText(text);
                      setCopiedDbCreds(true);
                      setTimeout(() => setCopiedDbCreds(false), 2000);
                    }}
                    className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 bg-slate-900 border border-slate-700 px-2 py-1 rounded"
                  >
                    {copiedDbCreds ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedDbCreds ? 'Kredensial Tersalin!' : 'Salin Semua Kredensial'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Database User (db user):
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={options.dbUser}
                        onChange={(e) => setOptions({ ...options, dbUser: e.target.value })}
                        className="w-full bg-slate-900 border border-emerald-500/60 rounded-lg px-3 py-2 text-emerald-300 font-mono font-bold text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Database Name (db name):
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={options.dbName}
                        onChange={(e) => setOptions({ ...options, dbName: e.target.value })}
                        className="w-full bg-slate-900 border border-amber-500/60 rounded-lg px-3 py-2 text-amber-300 font-mono font-bold text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-slate-400 font-semibold">
                        Database Password (db pas):
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[10px] text-slate-400 hover:text-slate-200"
                      >
                        {showPassword ? 'Sembunyikan' : 'Tampilkan'}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={options.dbPass}
                        onChange={(e) => setOptions({ ...options, dbPass: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      MySQL Host:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={options.dbHost}
                        onChange={(e) => setOptions({ ...options, dbHost: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 font-mono text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1 text-[11px] text-slate-300">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Fitur Unggah & Auto-Install Otomatis:</span>
                  </div>
                  <p className="text-slate-400">
                    Setelah extract zip di Plesk, kunjungi <code className="text-amber-300 font-mono">https://domain/auto_setup.php</code> untuk melakukan koneksi dan pembuatan tabel siswa secara otomatis dalam 1 detik.
                  </p>
                </div>

                {/* Quick SQL Dump Download Button */}
                <div className="pt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadSqlOnly}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-amber-600/60 text-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh File SQL ({options.dbName}.sql)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const sqlDump = generateMysqlSqlDump(madrasah, students, config, options);
                      navigator.clipboard.writeText(sqlDump);
                      setCopiedSql(true);
                      setTimeout(() => setCopiedSql(false), 2000);
                    }}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'SQL Tersalin!' : 'Salin Script SQL'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-950/40 rounded-xl border border-emerald-800/60 flex items-start gap-3">
                <Info className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="text-slate-300 leading-relaxed">
                  <strong className="text-emerald-300">Siap pasang di semua hosting Plesk:</strong> File ZIP yang dihasilkan berisi berkas web lengkap dengan <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">.htaccess</code>, <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">config.php</code>, dan database madrasah Anda.
                </div>
              </div>

              {/* Target Domain Form */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <label className="block text-slate-300 font-bold">
                  Nama Domain / Subdomain Plesk Target:
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={options.domainName}
                    onChange={(e) => setOptions({ ...options, domainName: e.target.value })}
                    placeholder="contoh: kartu.mialikhlas.sch.id"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white font-mono text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Domain ini akan digunakan untuk konfigurasi otomatis URL & SSL dalam berkas .htaccess.
                </p>
              </div>

              {/* Toggles */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider text-slate-300">
                  Konfigurasi Fitur Plesk:
                </h4>

                <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer">
                  <div className="space-y-0.5">
                    <span className="text-white font-medium block">Sertakan Database Siswa & Madrasah ({students.length} Siswa)</span>
                    <span className="text-[11px] text-slate-400">Menyimpan backup_data_madrasah.json & {options.dbName}.sql di dalam ZIP</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={options.includeCurrentData}
                    onChange={(e) => setOptions({ ...options, includeCurrentData: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer">
                  <div className="space-y-0.5">
                    <span className="text-white font-medium block">Aktifkan SPA Rewrite Fallback (.htaccess)</span>
                    <span className="text-[11px] text-slate-400">Mencegah error 404 saat navigasi atau refresh halaman di Plesk</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={options.enableSpaRewrite}
                    onChange={(e) => setOptions({ ...options, enableSpaRewrite: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer">
                  <div className="space-y-0.5">
                    <span className="text-white font-medium block">Kompresi GZIP & Browser Caching</span>
                    <span className="text-[11px] text-slate-400">Mempercepat loading kartu di koneksi internet madrasah</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={options.enableGzip}
                    onChange={(e) => setOptions({ ...options, enableGzip: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer">
                  <div className="space-y-0.5">
                    <span className="text-white font-medium block">Otomatis Redirect ke HTTPS (SSL)</span>
                    <span className="text-[11px] text-slate-400">Memastikan koneksi kartu selalu terenkripsi dan aman</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={options.enableHttpsRedirect}
                    onChange={(e) => setOptions({ ...options, enableHttpsRedirect: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 rounded"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: FILES IN ZIP */}
          {activeTab === 'files' && (
            <div className="space-y-3">
              <p className="text-slate-300">
                Isi struktur berkas yang dikemas di dalam file ZIP:
              </p>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <FolderArchive className="w-4 h-4" />
                  <span>httpdocs/ (Plesk Root Folder)</span>
                </div>
                <div className="pl-6 space-y-1.5 border-l border-slate-800">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <FileText className="w-3.5 h-3.5" />
                    <span>index.html</span>
                    <span className="text-[10px] text-slate-500 font-sans">(Halaman Utama Generator Kartu)</span>
                  </div>
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <Database className="w-3.5 h-3.5" />
                    <span>config.php & koneksi.php</span>
                    <span className="text-[10px] text-slate-400 font-sans">(Koneksi MySQL {options.dbUser} @ {options.dbName})</span>
                  </div>
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <Database className="w-3.5 h-3.5" />
                    <span>{options.dbName}.sql</span>
                    <span className="text-[10px] text-slate-400 font-sans">(Dump Skema & Data Siswa MySQL)</span>
                  </div>
                  <div className="flex items-center gap-2 text-teal-400 font-bold">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>auto_setup.php</span>
                    <span className="text-[10px] text-slate-400 font-sans">(1-Click Installer Database di Plesk)</span>
                  </div>
                  <div className="flex items-center gap-2 text-teal-400">
                    <Code2 className="w-3.5 h-3.5" />
                    <span>api/ (get_siswa.php, save_siswa.php, sync.php)</span>
                    <span className="text-[10px] text-slate-500 font-sans">(REST API Sinkronisasi)</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <FileText className="w-3.5 h-3.5" />
                    <span>.htaccess</span>
                    <span className="text-[10px] text-slate-500 font-sans">(Konfigurasi Apache & GZIP)</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <FileText className="w-3.5 h-3.5" />
                    <span>web.config</span>
                    <span className="text-[10px] text-slate-500 font-sans">(Konfigurasi IIS Windows Server)</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <FileText className="w-3.5 h-3.5" />
                    <span>.env</span>
                    <span className="text-[10px] text-slate-500 font-sans">(Variabel Lingkungan MySQL)</span>
                  </div>
                  <div className="flex items-center gap-2 text-amber-400">
                    <FileText className="w-3.5 h-3.5" />
                    <span>backup_data_madrasah.json</span>
                    <span className="text-[10px] text-slate-500 font-sans">({students.length} Data Siswa & Pengaturan)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sky-400">
                    <FileText className="w-3.5 h-3.5" />
                    <span>PLESK_PANDUAN_DEPLOY.md</span>
                    <span className="text-[10px] text-slate-500 font-sans">(Petunjuk lengkap deployment)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STEP BY STEP GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-3 text-slate-300">
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
                <h4 className="font-bold text-amber-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">1</span>
                  Buat Database di Plesk (Databases &rarr; Add Database)
                </h4>
                <p className="text-slate-300 text-xs pl-6">
                  Buat database dengan Database Name: <code className="text-amber-300 font-bold bg-slate-900 px-1 py-0.5 rounded">{options.dbName}</code>, User: <code className="text-emerald-300 font-bold bg-slate-900 px-1 py-0.5 rounded">{options.dbUser}</code>, Password: <code className="text-white font-bold bg-slate-900 px-1 py-0.5 rounded">{options.dbPass}</code>.
                </p>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
                <h4 className="font-bold text-amber-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">2</span>
                  Buka Folder httpdocs di File Manager
                </h4>
                <p className="text-slate-300 text-xs pl-6">
                  Pilih menu <strong>Websites & Domains</strong> &rarr; klik menu <strong>File Manager</strong> &rarr; buka direktori <strong>httpdocs</strong>.
                </p>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
                <h4 className="font-bold text-amber-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">3</span>
                  Upload & Extract ZIP
                </h4>
                <p className="text-slate-300 text-xs pl-6">
                  Klik tombol <strong>Upload</strong> lalu pilih file ZIP yang baru saja diunduh. Setelah selesai, klik centang pada file lalu pilih <strong>Extract Files</strong> ke folder <code className="text-emerald-300">httpdocs</code>.
                </p>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
                <h4 className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center">4</span>
                  Jalankan Auto Setup Otomatis
                </h4>
                <p className="text-slate-300 text-xs pl-6">
                  Buka di browser: <code className="text-amber-300 font-bold bg-slate-900 px-1 py-0.5 rounded">https://domain-anda/auto_setup.php</code> untuk melakukan pembuatan tabel dan verifikasi database secara otomatis.
                </p>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
                <h4 className="font-bold text-amber-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">5</span>
                  Pasang SSL Let's Encrypt
                </h4>
                <p className="text-slate-300 text-xs pl-6">
                  Di menu <strong>SSL/TLS Certificates</strong>, klik <strong>Install Let's Encrypt</strong> untuk mengaktifkan HTTPS gembok hijau secara gratis.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: HTACCESS & NGINX */}
          {activeTab === 'htaccess' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-white">Konfigurasi .htaccess (Apache):</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(sampleHtaccess);
                      setCopiedHtaccess(true);
                      setTimeout(() => setCopiedHtaccess(false), 2000);
                    }}
                    className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300"
                  >
                    {copiedHtaccess ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedHtaccess ? 'Tersalin' : 'Salin Kode'}</span>
                  </button>
                </div>
                <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
                  {sampleHtaccess}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-white">Arahan Nginx (Additional Nginx Directives):</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(sampleNginx);
                      setCopiedNginx(true);
                      setTimeout(() => setCopiedNginx(false), 2000);
                    }}
                    className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300"
                  >
                    {copiedNginx ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedNginx ? 'Tersalin' : 'Salin Kode'}</span>
                  </button>
                </div>
                <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
                  {sampleNginx}
                </pre>
              </div>
            </div>
          )}

          {/* Generator Progress Bar */}
          {isGenerating && (
            <div className="p-4 bg-slate-950 rounded-xl border border-emerald-600/50 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-emerald-400 font-bold">{statusText}</span>
                <span className="text-amber-400 font-mono font-bold">{progress}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-amber-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Database: <strong className="text-amber-300 font-mono">{options.dbName}</strong> (User: <strong className="text-emerald-300 font-mono">{options.dbUser}</strong>)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
            >
              Batal
            </button>
            <button
              onClick={handleDownloadZip}
              disabled={isGenerating}
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-950 transition active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Membuat ZIP...' : 'Unduh ZIP Plesk Sekarang'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
