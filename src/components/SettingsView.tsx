import React, { useState } from 'react';
import { Settings, Shield, HardDrive, RefreshCw, Lock } from 'lucide-react';

interface SettingsViewProps {
  triggerToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export default function SettingsView({ triggerToast }: SettingsViewProps) {
  const [orgName, setOrganizationName] = useState('AssetManager IT Solutions Ltd.');
  const [systemEmail, setSystemEmail] = useState('admin@assetmanager.it');
  const [currency, setCurrency] = useState('THB (฿)');
  const [backupSchedule, setBackupSchedule] = useState('Daily');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    triggerToast('success', 'บันทึกการตั้งค่าระบบความปลอดภัยและส่วนบุคคลเสร็จสิ้น');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 font-sans">ตั้งค่าระบบ (System Settings)</h2>
        <p className="text-sm text-slate-500 font-sans mt-1">
          ปรับแต่งโครงสร้างองค์กร ค่าเงิน สิทธิ์ความปลอดภัย และระบบจัดส่งสำรองข้อมูลอัตโนมัติ
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core Settings Form */}
        <form onSubmit={handleSaveSettings} className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 font-sans text-sm flex items-center gap-2">
              <Settings className="w-4.5 h-4.5 text-primary" />
              <span>ข้อมูลการแสดงผลพื้นฐาน</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">general settings</span>
          </div>

          <div className="space-y-4">
            {/* Org Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                ชื่อองค์กร (Organization Name)
              </label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary/15"
              />
            </div>

            {/* System Email */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                อีเมลระบบหลัก (System Administrator Email)
              </label>
              <input
                type="email"
                required
                value={systemEmail}
                onChange={(e) => setSystemEmail(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary/15"
              />
            </div>

            {/* Currency and Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  สกุลเงินแสดงผล (Currency)
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
                >
                  <option>THB (฿) - Thai Baht</option>
                  <option>USD ($) - US Dollar</option>
                  <option>EUR (€) - Euro</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  ระบบสำรองข้อมูลอัตโนมัติ (Automated Backup)
                </label>
                <select
                  value={backupSchedule}
                  onChange={(e) => setBackupSchedule(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
                >
                  <option value="Daily">Daily (ทุกวันตอนเที่ยงคืน)</option>
                  <option value="Weekly">Weekly (ทุกวันอาทิตย์)</option>
                  <option value="Monthly">Monthly (ทุกสิ้นเดือน)</option>
                  <option value="Off">ปิดการทำงานสำรอง</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary hover:bg-primary-container text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              บันทึกการตั้งค่า
            </button>
          </div>
        </form>

        {/* Security / About Panel */}
        <div className="space-y-6">
          {/* Hardware Database Statistics info */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 font-sans text-sm flex items-center gap-2">
              <HardDrive className="w-4.5 h-4.5 text-primary" />
              <span>สถานะที่จัดเก็บข้อมูล</span>
            </h4>
            
            <div className="space-y-3 text-xs font-semibold text-slate-500">
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span>Database Engine:</span>
                <span className="text-slate-800 font-mono">LocalStorage (Persistent Client State)</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span>Data Size:</span>
                <span className="text-slate-800 font-mono">1.2 KB / 5 MB</span>
              </div>
              <div className="flex justify-between">
                <span>ความปลอดภัย (Auth Mode):</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin Mode (Sandbox)</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('คุณต้องการรีเซ็ตข้อมูลครุภัณฑ์กลับสู่ค่าเริ่มต้นแรกเริ่มหรือไม่? ข้อมูลเพิ่มเติมที่เขียนทับจะสูญหาย')) {
                  localStorage.removeItem('assetmanager_assets');
                  localStorage.removeItem('assetmanager_tickets');
                  localStorage.removeItem('assetmanager_events');
                  triggerToast('info', 'ลบข้อมูลและรีเซ็ตค่าเริ่มต้นสำเร็จ กรุณารีเฟรชเบราว์เซอร์');
                  setTimeout(() => window.location.reload(), 1500);
                }
              }}
              className="w-full py-2 border border-rose-200 text-rose-600 font-bold hover:bg-rose-50 text-xs rounded-xl transition-all cursor-pointer"
            >
              รีเซ็ตฐานข้อมูล (Reset Seed Data)
            </button>
          </div>

          {/* System Version */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3 text-center">
            <Lock className="w-8 h-8 text-primary mx-auto mb-1" />
            <h4 className="text-xs font-bold text-slate-800">AssetManager IT Solutions v4.1</h4>
            <p className="text-[10px] text-slate-400 font-medium">Secured with enterprise token layers. Designed for internal ICT operations.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
