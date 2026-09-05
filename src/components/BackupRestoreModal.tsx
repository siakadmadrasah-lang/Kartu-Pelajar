import React, { useRef, useState } from 'react';
import { MadrasahInfo, Student, CardConfig } from '../types';
import { generateMysqlSqlDump, DEFAULT_MYSQL_CONFIG } from '../utils/pleskDeployUtils';
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  FileJson,
  ShieldCheck
} from 'lucide-react';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  madrasah: MadrasahInfo;
  students: Student[];
  config: CardConfig;
  onRestoreData: (madrasah: MadrasahInfo, students: Student[], config: CardConfig) => void;
  onResetToDefault: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  madrasah,
  students,
  config,
  onRestoreData,
  onResetToDefault,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoreStatus, setRestoreStatus] = useState<{ success?: boolean; message?: string }>({});

  const handleExportJson = () => {
    const backupData = {
      app: 'Generator Kartu Pelajar MI Kemenag RI',
      version: '2.5.0',
      exportedAt: new Date().toISOString(),
      madrasah,
      config,
      studentsCount: students.length,
      students,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `BACKUP_KARTU_PELAJAR_${madrasah.namaMadrasah.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed.madrasah || !parsed.students || !Array.isArray(parsed.students)) {
          setRestoreStatus({
            success: false,
            message: 'Format file JSON tidak valid. Pastikan file backup berasal dari aplikasi ini.',
          });
          return;
        }

        onRestoreData(parsed.madrasah, parsed.students, parsed.config || config);
        setRestoreStatus({
          success: true,
          message: `Berhasil memulihkan ${parsed.students.length} data siswa dan konfigurasi madrasah!`,
        });

        setTimeout(() => {
          onClose();
        }, 1500);
      } catch (err) {
        setRestoreStatus({
          success: false,
          message: 'Gagal membaca berkas JSON: ' + (err instanceof Error ? err.message : 'Format error'),
        });
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600/30 text-emerald-400 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide">
                Cadangkan & Pulihkan Database
              </h3>
              <p className="text-xs text-slate-400">
                Format JSON Mandiri Tanpa Ketergantungan Server
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {restoreStatus.message && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 ${
                restoreStatus.success
                  ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-700 text-rose-300'
              }`}
            >
              {restoreStatus.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              )}
              <span>{restoreStatus.message}</span>
            </div>
          )}

          {/* Current Stats */}
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 grid grid-cols-2 gap-3 text-slate-300">
            <div>
              <span className="text-slate-400 text-[11px] block">Lembaga:</span>
              <strong className="text-white font-bold truncate block">{madrasah.namaMadrasah}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Total Database Siswa:</span>
              <strong className="text-emerald-400 font-bold">{students.length} Siswa</strong>
            </div>
          </div>

          {/* Action 1: Export JSON */}
          <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <FileJson className="w-4 h-4 text-emerald-400" />
                  Ekspor Cadangan (Backup JSON)
                </h4>
                <p className="text-slate-400 text-[11px]">
                  Unduh seluruh data siswa, profil madrasah, dan template kartu dalam 1 berkas JSON aman.
                </p>
              </div>
              <button
                onClick={handleExportJson}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1.5 transition active:scale-95 flex-shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh JSON</span>
              </button>
            </div>
          </div>

          {/* Action 1B: Export MySQL SQL Dump */}
          <div className="p-4 bg-amber-950/20 rounded-xl border border-amber-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-amber-400" />
                  Ekspor Database MySQL (.SQL)
                </h4>
                <p className="text-slate-400 text-[11px]">
                  Unduh berkas script SQL MySQL mandiri (skema tabel, data siswa & madrasah) siap import phpMyAdmin/Plesk.
                </p>
              </div>
              <button
                onClick={() => {
                  try {
                    const dump = generateMysqlSqlDump(madrasah, students, config, {
                      domainName: 'kartupelajar.sch.id',
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
                    const blob = new Blob([dump], { type: 'application/sql' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${DEFAULT_MYSQL_CONFIG.dbName}.sql`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  } catch (err) {
                    console.error('SQL export error:', err);
                  }
                }}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 rounded-lg font-bold flex items-center gap-1.5 transition active:scale-95 flex-shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-slate-950" />
                <span>Unduh .SQL</span>
              </button>
            </div>
          </div>

          {/* Action 2: Import */}
          <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-amber-400" />
                  Pulihkan Cadangan (Restore JSON)
                </h4>
                <p className="text-slate-400 text-[11px]">
                  Unggah berkas JSON cadangan yang pernah dibuat sebelumnya.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportJson}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold flex items-center gap-1.5 transition active:scale-95 flex-shrink-0"
              >
                <Upload className="w-3.5 h-3.5 text-slate-950" />
                <span>Pilih JSON</span>
              </button>
            </div>
          </div>

          {/* Action 3: Reset */}
          <div className="p-4 bg-rose-950/20 rounded-xl border border-rose-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-rose-300 flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-rose-400" />
                  Reset ke Data Awal Standar
                </h4>
                <p className="text-slate-400 text-[11px]">
                  Kembalikan profil madrasah dan data siswa ke contoh bawaan sistem.
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm('Apakah Anda yakin ingin mereset seluruh data ke pengaturan awal?')) {
                    onResetToDefault();
                    onClose();
                  }
                }}
                className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-800 rounded-lg font-medium transition flex-shrink-0"
              >
                Reset Default
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
