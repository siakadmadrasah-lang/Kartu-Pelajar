import React from 'react';
import { AdminUser, MadrasahInfo } from '../types';
import { KemenagLogo } from './Logos';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  LogOut, 
  LogIn, 
  Server, 
  History, 
  Database, 
  Sparkles,
  UserCheck,
  Download,
  Settings,
  LayoutDashboard,
  CreditCard,
  FileSpreadsheet,
  PenTool,
  QrCode,
  HelpCircle,
  Eye,
  CheckCircle2,
  FileText,
  Printer,
  Layers,
  ShieldAlert,
  RefreshCw
} from 'lucide-react';

interface AdminHeaderBarProps {
  currentUser: AdminUser | null;
  currentView: 'card_editor' | 'admin_dashboard';
  madrasah?: MadrasahInfo;
  onSwitchView: (view: 'card_editor' | 'admin_dashboard') => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenPlesk: () => void;
  onOpenActivityLog: () => void;
  onOpenBackupRestore: () => void;
  onOpenEmisExcelImport: () => void;
  onOpenSignaturePad: () => void;
  onOpenScanner?: () => void;
  onOpenHelp?: () => void;
  onOpenPrintSheet?: () => void;
  onOpenSuratAktif?: () => void;
  totalStudents?: number;
  isEditLocked: boolean;
  onToggleEditLock: () => void;
  syncStatus?: 'synced' | 'saving' | 'syncing' | 'error';
  onManualSync?: () => void;
  onForceRefresh?: () => void;
  isRealtimeConnected?: boolean;
}

export const AdminHeaderBar: React.FC<AdminHeaderBarProps> = ({
  currentUser,
  currentView,
  madrasah,
  onSwitchView,
  onOpenLogin,
  onLogout,
  onOpenPlesk,
  onOpenBackupRestore,
  onOpenEmisExcelImport,
  onOpenSignaturePad,
  isEditLocked,
  onToggleEditLock,
  syncStatus = 'synced',
  onManualSync,
  onForceRefresh,
  isRealtimeConnected = true,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/90 shadow-lg no-print w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2">
        
        {/* LEFT: BRAND EMBLEM & APPLICATION HEADER TITLE */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="h-10 sm:h-11 px-1 py-0.5 rounded-xl bg-gradient-to-br from-emerald-950/90 to-slate-900 border border-emerald-400/60 shadow-md ring-1 ring-emerald-400/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {madrasah?.logoAplikasiUrl || madrasah?.logoMadrasahUrl || madrasah?.logoKemenagUrl ? (
              <img
                src={madrasah.logoAplikasiUrl || madrasah.logoMadrasahUrl || madrasah.logoKemenagUrl}
                alt="Logo Aplikasi"
                className="h-full w-auto max-w-[140px] sm:max-w-[180px] max-h-full object-contain filter drop-shadow select-none"
              />
            ) : (
              <ShieldCheck className="w-6 h-6 text-amber-300 p-0.5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs sm:text-sm font-black tracking-tight text-white truncate uppercase block">
                {madrasah?.judulHeaderAplikasi || 'KARTU PELAJAR DIGITAL'}
              </span>
              <span className="hidden xs:inline-block px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex-shrink-0">
                {madrasah?.badgeHeaderAplikasi || 'Kemenag'}
              </span>
              <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono flex-shrink-0">
                TP. {madrasah?.tahunPelajaran || '2025/2026'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium truncate">
              {madrasah?.namaMadrasah && (madrasah.showMadrasahInHeader !== false) && (
                <span className="text-amber-300/90 font-semibold truncate">
                  {madrasah.namaMadrasah}
                </span>
              )}
              {madrasah?.namaMadrasah && (madrasah.showMadrasahInHeader !== false) && (
                <span className="text-slate-600 hidden sm:inline">•</span>
              )}
              <span className="truncate hidden sm:inline text-slate-400">
                {currentView === 'card_editor' 
                  ? 'Portal Layanan Kartu Pelajar' 
                  : 'Pusat Pengelolaan Madrasah'}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: CLEAN & CONCISE ACTION BUTTONS (NO MOBILE OVERFLOW) */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Realtime WiFi & Mobile Data Synchronization Indicator */}
          {onForceRefresh && (
            <button
              onClick={onForceRefresh}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 border transition active:scale-95 ${
                syncStatus === 'saving'
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/60'
              }`}
              title="Koneksi Aktif (WiFi & Paket Data). Klik untuk reload data server."
            >
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <RefreshCw className={`w-3 h-3 ${syncStatus === 'saving' ? 'animate-spin text-amber-400' : 'text-emerald-400'}`} />
              <span className="hidden sm:inline">
                {syncStatus === 'saving' ? 'Menyimpan...' : 'Tersinkron'}
              </span>
            </button>
          )}

          {currentView === 'card_editor' ? (
            /* PUBLIC VIEW: Only a clean Operator/Admin Access button */
            currentUser?.isAuthenticated ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onSwitchView('admin_dashboard')}
                  className="p-2 sm:px-2.5 sm:py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
                  title="Buka Pusat Kontrol Admin"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs font-black">Admin</span>
                </button>
                <button
                  onClick={onLogout}
                  className="p-2 sm:p-1.5 bg-slate-900 hover:bg-rose-950/50 text-slate-400 hover:text-rose-300 border border-slate-800 rounded-lg text-xs transition"
                  title="Keluar"
                >
                  <LogOut className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="p-2 sm:px-3 sm:py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                title="Masuk sebagai Operator Madrasah"
              >
                <LogIn className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Login Admin</span>
              </button>
            )
          ) : (
            /* ADMIN VIEW: Switch back to Public Portal + Quick logout */
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onSwitchView('card_editor')}
                className="px-2.5 sm:px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md transition active:scale-95"
                title="Kembali ke Portal Publik Siswa"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-200" />
                <span>Portal Siswa</span>
              </button>

              <button
                onClick={onLogout}
                className="p-1.5 bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-800 rounded-lg text-xs transition"
                title="Keluar dari sesi Admin"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};


