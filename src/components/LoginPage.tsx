import React, { useState, useEffect } from 'react';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Boxes,
  AlertCircle,
  CheckCircle2,
  LogIn,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { loginWithCredentials } from '../lib/firebase';
import { UserSession } from '../types';

interface LoginPageProps {
  onLogin: (session: UserSession) => void;
  triggerToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export default function LoginPage({ onLogin, triggerToast }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const orgName = localStorage.getItem('assetmanager_org_name') || 'IT Asset Management System';

  // Load saved username if rememberMe was previously set
  useEffect(() => {
    const savedUser = localStorage.getItem('assetmanager_saved_username');
    if (savedUser) {
      setUsername(savedUser);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUser = username.trim();
    if (!trimmedUser) {
      setError('กรุณากรอก Username');
      return;
    }

    if (!password) {
      setError('กรุณากรอก Password');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate quick secure handshake
      await new Promise((resolve) => setTimeout(resolve, 350));

      const userSession = await loginWithCredentials(trimmedUser, password);

      if (rememberMe) {
        localStorage.setItem('assetmanager_saved_username', trimmedUser);
      } else {
        localStorage.removeItem('assetmanager_saved_username');
      }

      onLogin(userSession);
      triggerToast(
        'success',
        `เข้าสู่ระบบสำเร็จ: ${userSession.name} (${userSession.role === 'admin' ? 'ผู้ดูแลระบบ Admin' : 'เจ้าหน้าที่ Staff'})`
      );
    } catch (err: any) {
      console.error('Login error:', err);
      const msg = err?.message || 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง';
      setError(msg);
      triggerToast('error', msg);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen w-full bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-800">
      {/* Centered Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 sm:p-10 transition-all">
        {/* Header / Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-white shadow-lg shadow-primary/25 mb-4">
            <Boxes className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-1" title={orgName}>
            {orgName}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            กรุณากรอก Username และ Password เพื่อเข้าสู่ระบบ
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-xs text-rose-700 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Standard Login Form: Only Username and Password */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Username <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                id="login-username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                placeholder="ป้อน Username (เช่น admin หรือ user)"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                autoComplete="username"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Password <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => triggerToast('info', 'หากลืมรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบ (IT Administrator)')}
                className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
              >
                ลืมรหัสผ่าน?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="login-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="ป้อน Password"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                autoComplete="current-password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary accent-primary cursor-pointer"
              />
              <span>จดจำการเข้าสู่ระบบ</span>
            </label>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>ระบบปลอดภัย</span>
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="btn-login-submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all duration-150 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>กำลังเข้าสู่ระบบ...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>เข้าสู่ระบบ (Sign In)</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Testing Hint */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 mb-2">เข้าใช้งานทดสอบระบบ:</p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setUsername('admin');
                setPassword('password123');
                setError('');
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-mono font-medium transition-colors cursor-pointer"
            >
              admin (ผู้ดูแลระบบ)
            </button>
            <button
              type="button"
              onClick={() => {
                setUsername('user');
                setPassword('password123');
                setError('');
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-mono font-medium transition-colors cursor-pointer"
            >
              user (เจ้าหน้าที่)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
