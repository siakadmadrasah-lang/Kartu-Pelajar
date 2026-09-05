import React, { useState } from 'react';
import { AdminRole, AdminUser } from '../types';
import { 
  Lock, 
  User, 
  KeyRound, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  X
} from 'lucide-react';
import { KemenagLogo } from './Logos';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AdminUser) => void;
  currentUser?: AdminUser | null;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AdminRole>('superadmin');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Harap isi username/email dan password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Successful auth simulation
      const roleTitles: Record<AdminRole, string> = {
        superadmin: 'Super Admin & Kepala Madrasah',
        operator: 'Operator EMIS & SIAKAD',
        viewer: 'Staff Verifikasi & Guru',
      };

      const newUser: AdminUser = {
        id: `adm-${Date.now()}`,
        name: username.includes('@') ? username.split('@')[0].toUpperCase() : username.toUpperCase(),
        email: username.includes('@') ? username : `${username}@kemenag.sch.id`,
        username: username,
        role: role,
        roleTitle: roleTitles[role],
        institution: 'Madrasah Ibtidaiyah Kemenag',
        lastLogin: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }),
        isAuthenticated: true,
      };

      if (rememberMe) {
        localStorage.setItem('mi_admin_user', JSON.stringify(newUser));
      }

      onLoginSuccess(newUser);
      setIsLoading(false);
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Kemenag Theme */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-950 p-5 text-white flex items-center justify-between border-b border-emerald-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-950/80 rounded-xl border border-amber-400/40">
              <KemenagLogo className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-wide uppercase">
                Login Panel Admin MI
              </h3>
              <p className="text-xs text-amber-300">
                Akses Penuh Edit Data & Konfigurasi Kartu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLogin} className="p-5 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Role Level Card */}
          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-slate-400 block text-[11px]">Tingkat Otoritas:</span>
                <strong className="text-white capitalize font-bold">
                  {role === 'superadmin' ? 'Super Admin (Full Edit)' : role === 'operator' ? 'Operator SIAKAD' : 'Staff / Viewer'}
                </strong>
              </div>
            </div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRole)}
              aria-label="Pilih Tingkat Otoritas Hak Akses"
              className="bg-slate-900 border border-slate-700 text-slate-200 text-[11px] rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-emerald-500 font-medium"
            >
              <option value="superadmin">Super Admin</option>
              <option value="operator">Operator EMIS</option>
              <option value="viewer">Staff / Guru</option>
            </select>
          </div>

          {/* Email / Username */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-bold">
              Email atau Username Admin:
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan email / username admin..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-bold">
              Kata Sandi (Password):
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-9 py-2 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
              <span>Ingat Sesi Login Saya</span>
            </label>

            <span className="text-[11px] text-slate-500">
              Otoritas Terenkripsi
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-950 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 text-xs"
          >
            <Lock className="w-4 h-4" />
            <span>{isLoading ? 'Memverifikasi Kredensial...' : 'Masuk ke Panel Admin'}</span>
          </button>
        </form>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 text-center text-[11px] text-slate-500">
          Sistem Terenkripsi • Terhubung ke Pusat Data Madrasah Ibtidaiyah
        </div>
      </div>
    </div>
  );
};
