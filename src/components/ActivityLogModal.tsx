import React from 'react';
import { ActivityLog } from '../types';
import { X, History, Trash2, Printer, Edit, UserPlus, Server, Shield, CheckCircle } from 'lucide-react';

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ActivityLog[];
  onClearLogs: () => void;
}

export const ActivityLogModal: React.FC<ActivityLogModalProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
}) => {
  if (!isOpen) return null;

  const getLogIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'create':
        return <UserPlus className="w-3.5 h-3.5 text-emerald-400" />;
      case 'edit':
        return <Edit className="w-3.5 h-3.5 text-amber-400" />;
      case 'delete':
        return <Trash2 className="w-3.5 h-3.5 text-rose-400" />;
      case 'print':
        return <Printer className="w-3.5 h-3.5 text-sky-400" />;
      case 'export':
        return <Server className="w-3.5 h-3.5 text-purple-400" />;
      case 'auth':
        return <Shield className="w-3.5 h-3.5 text-teal-400" />;
      default:
        return <CheckCircle className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-4 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide">
                Audit Log Aktivitas & Riwayat Cetak
              </h3>
              <p className="text-xs text-slate-400">
                Catatan riwayat perubahan data siswa, madrasah, dan pencetakan kartu
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

        {/* Logs List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-2 text-xs">
          {logs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <History className="w-8 h-8 mx-auto opacity-40" />
              <p>Belum ada rekaman aktivitas dalam sesi ini.</p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 flex items-start gap-3 hover:border-slate-700 transition"
              >
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex-shrink-0 mt-0.5">
                  {getLogIcon(log.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white truncate">{log.action}</span>
                    <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                      {log.timestamp}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                    {log.details}
                  </p>
                  <span className="inline-block mt-1 text-[10px] text-emerald-400 font-medium">
                    Oleh: {log.operator}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">
            Total {logs.length} catatan aktivitas
          </span>
          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <button
                onClick={onClearLogs}
                className="px-3 py-1.5 bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded-lg text-xs font-medium transition"
              >
                Bersihkan Log
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
