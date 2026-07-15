import React, { useState } from 'react';
import { Settings, Shield, HardDrive, RefreshCw, Lock, ExternalLink } from 'lucide-react';
import { clearDatabase } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';

interface SettingsViewProps {
  triggerToast: (type: 'success' | 'error' | 'info', message: string) => void;
  totalAssets: number;
}

export default function SettingsView({ triggerToast, totalAssets }: SettingsViewProps) {
  const [orgName, setOrganizationName] = useState('AssetManager IT Solutions Ltd.');
  const [systemEmail, setSystemEmail] = useState('admin@assetmanager.it');
  const [currency, setCurrency] = useState('THB (฿)');
  const [backupSchedule, setBackupSchedule] = useState('Daily');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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
                <span className="text-slate-800 font-mono">Cloud Firestore (Firebase)</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span>Project ID:</span>
                <span className="text-slate-800 font-mono">{firebaseConfig.projectId}</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-slate-50 pb-2">
                <div className="flex justify-between">
                  <span>Database ID:</span>
                  <span className="text-slate-800 font-mono text-[10px] truncate max-w-[150px]" title={firebaseConfig.firestoreDatabaseId || "(default)"}>
                    {firebaseConfig.firestoreDatabaseId || "(default)"}
                  </span>
                </div>
                <a
                  href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId || '(default)'}/data`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-[10px] font-bold transition-all"
                >
                  <ExternalLink className="w-3 h-3 text-[#00236f]" />
                  <span>เปิด Google Firebase Console ↗</span>
                </a>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span>จำนวนข้อมูลในระบบ:</span>
                <span className="text-slate-800 font-mono">{totalAssets} รายการ (Synced)</span>
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
              onClick={() => setShowResetConfirm(true)}
              className="w-full py-2 border border-rose-200 text-rose-600 font-bold hover:bg-rose-50 text-xs rounded-xl transition-all cursor-pointer"
            >
              ล้างข้อมูลทั้งหมดในระบบเพื่อใช้งานจริง (Wipe Database)
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

      {/* MODAL: Reset Database Confirmation */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[1000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-100 bg-rose-50/50 flex items-center gap-2.5">
              <RefreshCw className="w-5 h-5 text-rose-600 animate-spin" />
              <h3 className="font-bold text-slate-800 text-sm font-sans">ยืนยันการลบข้อมูลทั้งหมดในระบบ</h3>
            </div>
            
            <div className="p-6 space-y-3">
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                คุณต้องการลบข้อมูลครุภัณฑ์ ใบสั่งซ่อม และกิจกรรมทั้งหมดในระบบแบบถาวรหรือไม่?
              </p>
              <p className="text-[11px] text-rose-500 font-medium leading-relaxed">
                * ข้อมูลทั้งหมดจะถูกลบออกจากคลังและ Firebase อย่างถาวร เพื่อให้ระบบว่างเปล่าพร้อมสำหรับการใช้งานจริงและการลงทะเบียนครุภัณฑ์ใหม่
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    localStorage.removeItem('assetmanager_assets');
                    localStorage.removeItem('assetmanager_tickets');
                    localStorage.removeItem('assetmanager_events');
                    localStorage.removeItem('assetmanager_users');
                    await clearDatabase();
                    triggerToast('success', 'ล้างข้อมูลทั้งหมดในระบบเรียบร้อยแล้ว ระบบกำลังรีเฟรช...');
                  } catch (e) {
                    console.error("Failed to clear Firestore:", e);
                    triggerToast('error', 'ล้างข้อมูลบางส่วนไม่สำเร็จ');
                  }
                  setShowResetConfirm(false);
                  setTimeout(() => window.location.reload(), 1500);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                ยืนยันการลบข้อมูลทั้งหมด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
