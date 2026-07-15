import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, LogIn, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, role: 'admin' | 'user', name: string) => void;
  triggerToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export default function LoginPage({ onLogin, triggerToast }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError('กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน');
      return;
    }

    setIsLoading(true);

    // Simulate login verification
    setTimeout(() => {
      setIsLoading(false);
      if (trimmedEmail === 'admin@assetmanager.com' && trimmedPassword === 'admin123') {
        onLogin('admin@assetmanager.com', 'admin', 'คุณสิรินทร์ เทคโน (ผู้ดูแลระบบ)');
        triggerToast('success', 'เข้าสู่ระบบสำเร็จในฐานะ ผู้ดูแลระบบ (Admin)');
      } else if (trimmedEmail === 'user@assetmanager.com' && trimmedPassword === 'user123') {
        onLogin('user@assetmanager.com', 'user', 'คุณสมชาย พนักงานไอที');
        triggerToast('success', 'เข้าสู่ระบบสำเร็จในฐานะ เจ้าหน้าที่ไอที (User)');
      } else {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง (กรุณาใช้บัญชีทดสอบที่จัดไว้ให้ด้านล่าง)');
        triggerToast('error', 'ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง');
      }
    }, 700);
  };

  // Quick setup credentials helper
  const handleQuickLogin = (role: 'admin' | 'user') => {
    if (role === 'admin') {
      setEmail('admin@assetmanager.com');
      setPassword('admin123');
    } else {
      setEmail('user@assetmanager.com');
      setPassword('user123');
    }
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-xl border border-slate-100 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[550px] animate-in fade-in zoom-in-95 duration-300">
        
        {/* Left Column: Visual Branding Banner (Hidden on mobile) */}
        <div className="hidden md:flex md:col-span-5 bg-[#00236f] p-8 flex-col justify-between text-white relative overflow-hidden">
          {/* Background Decorative Circles */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-sky-400/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 bg-white/10 backdrop-blur-md rounded-lg">
                <ShieldCheck className="w-6 h-6 text-sky-400" />
              </span>
              <span className="font-bold text-lg tracking-wider">AssetManager IT</span>
            </div>
            <p className="text-xs text-sky-200/80 font-medium tracking-widest uppercase">Infrastructure Portal</p>
          </div>

          <div className="space-y-4 my-8">
            <h2 className="text-2xl font-bold font-sans tracking-tight leading-snug">
              ระบบสแกนและบริหารจัดการครุภัณฑ์คอมพิวเตอร์ระดับองค์กร
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              อำนวยความสะดวกในการขึ้นทะเบียน, ติดตามการใช้งาน, ตรวจสอบสภาพด้วยระบบ QR Code สแกนเนอร์ด่วน และจัดทำรายงานวิเคราะห์ความเสี่ยงครบวงจร
            </p>
          </div>

          <div className="border-t border-white/10 pt-4">
            <p className="text-[10px] text-slate-400">© {new Date().getFullYear()} Enterprise IT Infrastructure. All rights reserved.</p>
          </div>
        </div>

        {/* Right Column: Interactive Login Form */}
        <div className="col-span-12 md:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-between">
          
          {/* Header Mobile Support Branding */}
          <div className="md:hidden flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#00236f] rounded-lg">
                <ShieldCheck className="w-5 h-5 text-sky-400" />
              </span>
              <span className="font-bold text-sm text-[#00236f] tracking-wide">AssetManager IT</span>
            </div>
            <span className="text-[9px] font-bold bg-[#00236f]/5 text-[#00236f] px-2.5 py-1 rounded-full uppercase tracking-wider">
              V2.1 Active
            </span>
          </div>

          {/* Form Content */}
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">ยินดีต้อนรับสู่ระบบ</h3>
              <p className="text-xs text-slate-400 font-medium">กรุณาลงชื่อเข้าใช้ระบบเพื่อจัดการและตรวจสอบข้อมูลครุภัณฑ์</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 flex items-start gap-2.5 text-xs animate-shake">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-rose-500" />
                  <span className="font-medium leading-relaxed">{error}</span>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  อีเมลผู้ใช้งาน (Email Address)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    placeholder="example@assetmanager.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00236f]/20 focus:border-[#00236f] transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    รหัสผ่าน (Password)
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00236f]/20 focus:border-[#00236f] transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#00236f] hover:bg-primary text-white text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-75 disabled:cursor-wait"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>เข้าสู่ระบบ (Sign In)</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Sandbox Access Selectors */}
          <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                บัญชีสาธิตสำหรับทดสอบระบบ (Quick Access Accounts)
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Admin Selector */}
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="p-3 bg-[#00236f]/5 hover:bg-[#00236f]/10 border border-[#00236f]/10 rounded-xl text-left transition-all flex items-center gap-3 cursor-pointer"
              >
                <div className="w-8 h-8 bg-[#00236f]/10 text-[#00236f] rounded-lg flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-[#00236f] leading-none mb-0.5">Admin Account</p>
                  <p className="text-[9px] text-slate-400 truncate">จัดการข้อมูลได้ทั้งหมด</p>
                </div>
              </button>

              {/* User Selector */}
              <button
                type="button"
                onClick={() => handleQuickLogin('user')}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl text-left transition-all flex items-center gap-3 cursor-pointer"
              >
                <div className="w-8 h-8 bg-slate-200/50 text-slate-600 rounded-lg flex items-center justify-center shrink-0">
                  <UserCheck className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-700 leading-none mb-0.5">IT Staff Account</p>
                  <p className="text-[9px] text-slate-400 truncate">ดูข้อมูลและแจ้งซ่อมเท่านั้น</p>
                </div>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
