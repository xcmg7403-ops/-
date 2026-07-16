import React, { useState } from 'react';
import { Mail, LogIn, ShieldCheck, AlertCircle } from 'lucide-react';
import { signInWithGoogle, directGmailLogin } from '../lib/firebase';

interface LoginPageProps {
  onLogin: (email: string, role: 'admin' | 'user', name: string, avatar: string) => void;
  triggerToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export default function LoginPage({ onLogin, triggerToast }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle Real Google Sign-In via Popup
  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      const userSession = await signInWithGoogle();
      onLogin(userSession.email, userSession.role, userSession.name, userSession.avatar);
      triggerToast('success', `ยินดีต้อนรับคุณ ${userSession.name} เข้าสู่ระบบเรียบร้อยแล้ว (${userSession.role === 'admin' ? 'ผู้ดูแลระบบ' : 'เจ้าหน้าที่'})`);
    } catch (err: any) {
      console.error("Google Sign-In failed:", err);
      // Popup closed or authorization domain error
      if (err?.code === 'auth/popup-closed-by-user') {
        setError('การเชื่อมต่อถูกยกเลิกเนื่องจากหน้าต่างป๊อปอัปถูกปิด');
        triggerToast('info', 'ยกเลิกการเข้าสู่ระบบ');
      } else if (err?.code === 'auth/unauthorized-domain') {
        setError('โดเมนนี้ยังไม่ได้รับการอนุมัติใน Firebase Console กรุณาใช้ช่องทางกรอกอีเมล Gmail โดยตรงด้านล่างเพื่อเข้าใช้งาน');
        triggerToast('error', 'ข้อผิดพลาดโดเมนผู้ให้บริการ');
      } else {
        setError('ไม่สามารถลงชื่อเข้าใช้งานด้วย Google ได้ชั่วคราว กรุณาใช้ช่องทางกรอกอีเมล Gmail โดยตรงด้านล่างแทน');
        triggerToast('error', 'การเชื่อมต่อผิดพลาด');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Direct Gmail Address login (Perfect for sandboxed iframe fallback or quick access)
  const handleDirectGmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('กรุณากรอกอีเมล Gmail ของคุณ');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('รูปแบบอีเมลไม่ถูกต้อง');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate brief network delay for realism and smooth feedback
      await new Promise((resolve) => setTimeout(resolve, 800));
      const userSession = await directGmailLogin(trimmedEmail);
      onLogin(userSession.email, userSession.role, userSession.name, userSession.avatar);
      triggerToast('success', `เข้าสู่ระบบด้วย Gmail เรียบร้อยแล้ว ในฐานะ ${userSession.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'เจ้าหน้าที่ (User)'}`);
    } catch (err) {
      console.error("Direct login failed:", err);
      setError('เกิดข้อผิดพลาดในการตรวจสอบบัญชี');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans">
      <div id="login-container" className="bg-white w-full max-w-4xl rounded-3xl shadow-xl border border-slate-100 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[500px] animate-in fade-in zoom-in-95 duration-300">
        
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
        <div className="col-span-12 md:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-center">
          
          {/* Header Mobile Support Branding */}
          <div className="md:hidden flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#00236f] rounded-lg">
                <ShieldCheck className="w-5 h-5 text-sky-400" />
              </span>
              <span className="font-bold text-sm text-[#00236f] tracking-wide">AssetManager IT</span>
            </div>
            <span className="text-[9px] font-bold bg-[#00236f]/5 text-[#00236f] px-2.5 py-1 rounded-full uppercase tracking-wider">
              Google Auth Active
            </span>
          </div>

          {/* Form Content */}
          <div className="space-y-6">
            <div className="space-y-1 text-center md:text-left">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">ยินดีต้อนรับสู่ระบบ</h3>
              <p className="text-xs text-slate-400 font-medium">เข้าใช้งานระบบจัดการข้อมูลครุภัณฑ์ผ่าน GMAIL หรือ Google Account</p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 flex items-start gap-2.5 text-xs animate-shake">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-rose-500" />
                <span className="font-medium leading-relaxed">{error}</span>
              </div>
            )}

            {/* PRIMARY OPTION: Real Google Sign-In Button */}
            <div className="space-y-3">
              <button
                type="button"
                id="btn-google-signin"
                disabled={isLoading}
                onClick={handleGoogleSignIn}
                className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 hover:border-slate-300 rounded-xl flex items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-70 disabled:cursor-wait"
              >
                {/* Official Google Icon */}
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                <span>ลงชื่อเข้าใช้ด้วย Google / GMAIL</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-white px-2">หรือใช้ทางเลือกลงทะเบียนด่วน</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            {/* FALLBACK OPTION: Direct Gmail Sign-In Input */}
            <form onSubmit={handleDirectGmailSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  กรอกอีเมล Gmail ของคุณโดยตรง
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
                    placeholder="example@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00236f]/20 focus:border-[#00236f] transition-all"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  * หากระบบหน้าต่างป๊อปอัปของ Google โดนบล็อกในเบราว์เซอร์ของคุณ ท่านสามารถพิมพ์ Gmail และกดเข้าใช้งานผ่านปุ่มด้านล่างนี้ได้ทันที
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="btn-direct-login"
                disabled={isLoading}
                className="w-full bg-[#00236f] hover:bg-primary text-white text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-75 disabled:cursor-wait"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>เข้าสู่ระบบด้วย Gmail ทันที</span>
                  </>
                )}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
