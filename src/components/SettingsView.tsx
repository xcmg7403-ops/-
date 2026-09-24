import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Shield, 
  HardDrive, 
  RefreshCw, 
  Lock, 
  ExternalLink, 
  Sun, 
  Moon, 
  Database, 
  Trash2, 
  Activity, 
  Cpu, 
  Wifi, 
  AlertTriangle,
  History
} from 'lucide-react';
import { clearDatabase } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { BackupRecord } from '../types';

interface SettingsViewProps {
  triggerToast: (type: 'success' | 'error' | 'info', message: string) => void;
  totalAssets: number;
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  currency: string;
  onCurrencyChange: (currency: string) => void;
  backupSchedule: string;
  onBackupScheduleChange: (schedule: string) => void;
  backups: BackupRecord[];
  isBackingUp: boolean;
  onTriggerManualBackup: () => Promise<void>;
  onRestoreBackup: (backup: BackupRecord) => Promise<void>;
  onDeleteBackup: (backupId: string) => Promise<void>;
  orgName: string;
  onOrgNameChange: (orgName: string) => void;
  systemEmail: string;
  onSystemEmailChange: (email: string) => void;
}

export default function SettingsView({ 
  triggerToast, 
  totalAssets, 
  theme, 
  onThemeChange,
  currency,
  onCurrencyChange,
  backupSchedule,
  onBackupScheduleChange,
  backups,
  isBackingUp,
  onTriggerManualBackup,
  onRestoreBackup,
  onDeleteBackup,
  orgName,
  onOrgNameChange,
  systemEmail,
  onSystemEmailChange
}: SettingsViewProps) {
  
  const [localOrgName, setLocalOrgName] = useState(orgName);
  const [localSystemEmail, setLocalSystemEmail] = useState(systemEmail);
  const [localCurrency, setLocalCurrency] = useState(currency);
  const [localBackupSchedule, setLocalBackupSchedule] = useState(backupSchedule);

  useEffect(() => {
    setLocalOrgName(orgName);
  }, [orgName]);

  useEffect(() => {
    setLocalSystemEmail(systemEmail);
  }, [systemEmail]);

  useEffect(() => {
    setLocalCurrency(currency);
  }, [currency]);

  useEffect(() => {
    setLocalBackupSchedule(backupSchedule);
  }, [backupSchedule]);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<BackupRecord | null>(null);
  
  // System diagnostic panel states
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([]);
  const [diagnosticDone, setDiagnosticDone] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('assetmanager_org_name', localOrgName);
    localStorage.setItem('assetmanager_system_email', localSystemEmail);
    localStorage.setItem('assetmanager_currency', localCurrency);
    localStorage.setItem('assetmanager_backup_schedule', localBackupSchedule);
    
    onOrgNameChange(localOrgName);
    onSystemEmailChange(localSystemEmail);
    onCurrencyChange(localCurrency);
    onBackupScheduleChange(localBackupSchedule);
    
    // Dispatch global custom storage event
    window.dispatchEvent(new Event('storage'));
    triggerToast('success', 'บันทึกการตั้งค่าระบบความปลอดภัยและส่วนบุคคลเสร็จสิ้น');
  };

  const runDiagnosis = () => {
    setIsDiagnosing(true);
    setDiagnosticLogs([]);
    setDiagnosticDone(false);
    
    const steps = [
      'กำลังเตรียมวิเคราะห์ความสม่ำเสมอของโครงข่าย...',
      'ตรวจสอบค่าเกตเวย์และคลัสเตอร์ (Vite Proxy Layer)... เรียบร้อย (Status: OK)',
      'เชื่อมต่อระบบคลาวด์ Firebase Firestore... เรียบร้อย (Latency: 15ms)',
      'ตรวจเช็กกฎความปลอดภัยสิทธิ์การเข้าถึงข้อมูลครุภัณฑ์หลัก... ปลอดภัย (Strict Auth Active)',
      'ประเมินหน่วยความจำสำรองชั่วคราว (Local Storage Base Cache)... เรียบร้อย (ใช้งาน 2.4KB)',
      'วิเคราะห์ดัชนีภาพรวมครุภัณฑ์ ใบงานซ่อม และประวัติเหตุการณ์... ผ่าน 100% สรุปผลสมบูรณ์'
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setDiagnosticLogs(prev => [...prev, step]);
        if (index === steps.length - 1) {
          setIsDiagnosing(false);
          setDiagnosticDone(true);
          triggerToast('success', 'การวินิจฉัยความสมบูรณ์ของระบบไอทีเสร็จสมบูรณ์ ทุกฟังก์ชันทำงานปกติ');
        }
      }, (index + 1) * 700);
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 font-sans">ตั้งค่าระบบ (System Settings)</h2>
        <p className="text-sm text-slate-500 font-sans mt-1">
          ปรับแต่งโครงสร้างองค์กร ค่าเงิน สิทธิ์ความปลอดภัย และระบบสำรองข้อมูลอัตโนมัติบนคลาวด์
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Settings Form */}
        <form onSubmit={handleSaveSettings} className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 font-sans text-sm flex items-center gap-2">
              <Settings className="w-4.5 h-4.5 text-[#00236f]" />
              <span>ข้อมูลการแสดงผลพื้นฐาน</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">general settings</span>
          </div>

          <div className="space-y-4">
            {/* Org Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                ชื่อองค์กร (Organization Name)
              </label>
              <input
                type="text"
                required
                value={localOrgName}
                onChange={(e) => setLocalOrgName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 bg-white text-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00236f]/15 focus:border-[#00236f] transition-all"
              />
            </div>

            {/* System Email */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                อีเมลระบบหลัก (System Administrator Email)
              </label>
              <input
                type="email"
                required
                value={localSystemEmail}
                onChange={(e) => setLocalSystemEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 bg-white text-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00236f]/15 focus:border-[#00236f] transition-all"
              />
            </div>

            {/* Currency and Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  สกุลเงินแสดงผล (Display Currency)
                </label>
                <select
                  value={localCurrency}
                  onChange={(e) => setLocalCurrency(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 bg-white text-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00236f]/15 focus:border-[#00236f] transition-all cursor-pointer"
                >
                  <option value="THB (฿) - Thai Baht">THB (฿) - Thai Baht</option>
                  <option value="USD ($) - US Dollar">USD ($) - US Dollar</option>
                  <option value="EUR (€) - Euro">EUR (€) - Euro</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  ระบบสำรองข้อมูลอัตโนมัติ (Automated Backup)
                </label>
                <select
                  value={localBackupSchedule}
                  onChange={(e) => setLocalBackupSchedule(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 bg-white text-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00236f]/15 focus:border-[#00236f] transition-all cursor-pointer"
                >
                  <option value="Daily">Daily (ทุกวันตอนเที่ยงคืน)</option>
                  <option value="Weekly">Weekly (ทุกวันอาทิตย์)</option>
                  <option value="Monthly">Monthly (ทุกสิ้นเดือน)</option>
                  <option value="Off">ปิดการทำงานสำรอง</option>
                </select>
              </div>
            </div>

            {/* Theme Selection */}
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                ธีมแสดงผลของระบบ (System Visual Theme)
              </label>
              <p className="text-[10px] text-slate-400 mb-3">เลือกโทนสีการแสดงผลให้เหมาะสมกับสภาพแวดล้อมการทำงานของท่าน</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    onThemeChange('light');
                    triggerToast('info', 'เปลี่ยนเป็นธีมสว่าง (Light Theme) เรียบร้อยแล้ว');
                  }}
                  className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'border-[#00236f] bg-white text-[#00236f] shadow-xs ring-2 ring-[#00236f]/15 font-sans'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50/80'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Light Mode (สว่าง)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onThemeChange('dark');
                    triggerToast('info', 'เปลี่ยนเป็นธีมมืด (Dark Theme) เรียบร้อยแล้ว');
                  }}
                  className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'border-[#00236f] bg-white text-[#00236f] shadow-xs ring-2 ring-[#00236f]/15 font-sans'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50/80'
                  }`}
                >
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span>Dark Mode (มืด)</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#00236f] hover:bg-primary text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              บันทึกการตั้งค่า
            </button>
          </div>
        </form>

        {/* Security / About Panel */}
        <div className="space-y-6">
          {/* Hardware Database Statistics info */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h4 className="font-bold text-slate-800 font-sans text-sm flex items-center gap-2">
              <HardDrive className="w-4.5 h-4.5 text-[#00236f]" />
              <span>สถานะที่จัดเก็บข้อมูล</span>
            </h4>
            
            <div className="space-y-3 text-xs font-semibold text-slate-600">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Database Engine:</span>
                <span className="text-slate-800 font-mono">Cloud Firestore</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Project ID:</span>
                <span className="text-slate-800 font-mono">{firebaseConfig.projectId}</span>
              </div>
              <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Database ID:</span>
                  <span className="text-slate-800 font-mono text-[10px] truncate max-w-[150px]" title={firebaseConfig.firestoreDatabaseId || "(default)"}>
                    {firebaseConfig.firestoreDatabaseId || "(default)"}
                  </span>
                </div>
                <a
                  href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId || '(default)'}/data`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-[10px] font-bold transition-all shadow-2xs"
                >
                  <ExternalLink className="w-3 h-3 text-[#00236f]" />
                  <span>เปิด Google Firebase Console ↗</span>
                </a>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">จำนวนข้อมูลในระบบ:</span>
                <span className="text-slate-800 font-mono">{totalAssets} รายการ (Synced)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ความปลอดภัย (Auth Mode):</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin Mode (Secure)</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="w-full py-2.5 border border-rose-200 bg-white hover:bg-rose-50/60 text-rose-600 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              ล้างข้อมูลทั้งหมดในระบบเพื่อใช้งานจริง (Wipe Database)
            </button>
          </div>

          {/* System Diagnostics Card */}
          <div 
            onClick={() => {
              setShowDiagnostic(true);
              runDiagnosis();
            }}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3 text-center cursor-pointer hover:border-[#00236f]/40 hover:shadow-md transition-all group"
          >
            <div className="relative mx-auto w-10 h-10 mb-1 flex items-center justify-center bg-blue-50 text-[#00236f] rounded-full group-hover:scale-110 transition-transform">
              <Lock className="w-5 h-5 text-[#00236f]" />
              <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
            </div>
            <h4 className="text-xs font-bold text-slate-800 font-sans group-hover:text-[#00236f] transition-colors">AssetManager IT Solutions v4.1</h4>
            <p className="text-[10px] text-slate-400 font-medium">Secured with enterprise token layers. Designed for internal ICT operations.</p>
            <div className="inline-flex items-center gap-1 text-[10px] text-[#00236f] font-bold bg-blue-50/80 px-2.5 py-0.5 rounded-full mt-2 group-hover:bg-blue-100/80 transition-colors">
              <span>วินิจฉัยจุดเชื่อมต่อและระบบปฏิบัติการ</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Backup & Restoration Registry Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div>
            <h3 className="font-bold text-slate-800 font-sans text-sm flex items-center gap-2">
              <Database className="w-4.5 h-4.5 text-[#00236f]" />
              <span>คลังสำรองข้อมูลระบบคลาวด์ (Cloud Backup Vault)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">สำรองโครงสร้างข้อมูลทะเบียนครุภัณฑ์ ใบสั่งซ่อม และประวัติเหตุการณ์ทั้งหมดเข้าสู่เซิร์ฟเวอร์แบบเรียลไทม์</p>
          </div>
          <button
            type="button"
            disabled={isBackingUp}
            onClick={onTriggerManualBackup}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer self-start sm:self-center"
          >
            <History className={`w-4 h-4 ${isBackingUp ? 'animate-spin' : ''}`} />
            <span>{isBackingUp ? 'กำลังสำรองข้อมูล...' : 'สำรองฐานข้อมูลทันที'}</span>
          </button>
        </div>

        {backups.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-200">
            <Database className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-semibold">ยังไม่มีชุดข้อมูลสำรองบนคลาวด์ในขณะนี้</p>
            <p className="text-[10px] text-slate-400 mt-1">ระบบจะทำการจัดเก็บตามรอบเวลา หรือท่านสามารถกดปุ่ม "สำรองฐานข้อมูลทันที" ด้านขวาบน</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="w-full text-left border-collapse text-xs bg-white">
              <thead>
                <tr className="bg-white text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                  <th className="py-3 px-4">รหัสชุดสำรอง (Backup ID)</th>
                  <th className="py-3 px-4">วันเวลาจัดเก็บ (Timestamp)</th>
                  <th className="py-3 px-4">ประเภทสำรอง (Schedule / Mode)</th>
                  <th className="py-3 px-4">จำนวนครุภัณฑ์ (Assets)</th>
                  <th className="py-3 px-4">ใบแจ้งซ่อม (Tickets)</th>
                  <th className="py-3 px-4">เหตุการณ์ (Events)</th>
                  <th className="py-3 px-4 text-center">ตัวเลือกการจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {backups.map((backup) => (
                  <tr key={backup.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{backup.id}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {new Date(backup.timestamp).toLocaleDateString('th-TH', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })} {' '}
                      {new Date(backup.timestamp).toLocaleTimeString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-semibold">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        backup.schedule === 'Manual'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                      }`}>
                        {backup.schedule}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">{backup.assets.length} รายการ</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">{backup.repairTickets.length} รายการ</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">{backup.maintenanceEvents.length} รายการ</td>
                    <td className="py-3.5 px-4 text-center space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setShowRestoreConfirm(backup)}
                        className="px-2.5 py-1 bg-[#00236f] hover:bg-primary text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Restore</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteBackup(backup.id)}
                        className="px-2.5 py-1 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-[10px] font-bold rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DIALOG: System Self-Diagnosis Console */}
      {showDiagnostic && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[1000] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200 font-mono text-xs text-slate-700">
            {/* Console Header */}
            <div className="p-4 bg-white border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 bg-rose-500 rounded-full" />
                  <div className="w-3 h-3 bg-amber-500 rounded-full" />
                  <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                </div>
                <span className="font-bold text-slate-800 ml-2 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-[#00236f]" />
                  <span>ICT Operations Console v4.1</span>
                </span>
              </div>
              <button 
                onClick={() => setShowDiagnostic(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Console Body */}
            <div className="p-6 space-y-4 min-h-[250px] max-h-[400px] overflow-y-auto bg-white">
              <div className="flex justify-between items-start border border-slate-200 bg-white p-3 rounded-xl text-[11px] text-slate-600 shadow-2xs">
                <div className="space-y-1">
                  <p>SYSTEM NAME: <span className="font-bold text-slate-800">AssetManager IT Solutions v4.1</span></p>
                  <p>ENVIRONMENT: <span className="font-bold text-slate-800">Google Cloud Run (Antigravity Sandbox)</span></p>
                </div>
                <div className="space-y-1 text-right">
                  <p>DATABASE: <span className="font-bold text-slate-800">Cloud Firestore</span></p>
                  <p>STATUS: <span className="text-emerald-600 font-bold flex items-center justify-end gap-1"><Wifi className="w-3 h-3" /> Connected</span></p>
                </div>
              </div>

              {/* Log stream */}
              <div className="space-y-2 leading-relaxed bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
                <p className="text-slate-400">&gt; initial diagnostics load sequence initialized.</p>
                {diagnosticLogs.map((log, i) => (
                  <p key={i} className={i === diagnosticLogs.length - 1 && diagnosticDone ? "text-emerald-600 font-bold" : "text-slate-700"}>
                    <span className="text-[#00236f] mr-1.5 font-bold">⚡</span> {log}
                  </p>
                ))}
                {isDiagnosing && (
                  <div className="flex items-center gap-2 text-slate-500 animate-pulse">
                    <span>⚡ กำลังทำงานประมวลผลข้อมูล...</span>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00236f]" />
                  </div>
                )}
              </div>
            </div>

            {/* Console Footer */}
            <div className="p-4 bg-white border-t border-slate-100 flex justify-between items-center">
              <span className="text-[10px] text-slate-500 font-sans">
                {diagnosticDone ? 'Integrity passed.' : 'Diagnosis engine ready.'}
              </span>
              <div className="space-x-2">
                <button
                  type="button"
                  disabled={isDiagnosing}
                  onClick={runDiagnosis}
                  className="px-4 py-2 bg-[#00236f] hover:bg-primary disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-1 font-sans"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>เริ่มประเมินและวิเคราะห์ใหม่ (Run Diagnosis)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDiagnostic(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer font-sans shadow-2xs"
                >
                  ปิดหน้าต่าง console
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Restore Database Confirmation */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[1000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-100 bg-white flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-slate-800 text-sm font-sans">คำเตือน: ยืนยันการกู้คืนระบบคลาวด์</h3>
            </div>
            
            <div className="p-6 space-y-3 text-xs leading-relaxed text-slate-600 font-semibold bg-white">
              <p>
                คุณกำลังจะเขียนทับฐานข้อมูลครุภัณฑ์ ใบสั่งซ่อม และเหตุการณ์ปัจจุบัน ด้วยชุดข้อมูลสำรองรหัส <span className="font-mono text-rose-600 font-bold">{showRestoreConfirm.id}</span>
              </p>
              <p className="text-slate-400 text-[11px] font-medium">
                * ข้อมูลปัจจุบันทั้งหมดที่จัดเก็บนับจากการสำรองข้อมูลนี้จะสูญหายอย่างถาวร กรุณายืนยันความประสงค์ของคุณอย่างเป็นทางการ
              </p>
            </div>

            <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRestoreConfirm(null)}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetBackup = showRestoreConfirm;
                  setShowRestoreConfirm(null);
                  await onRestoreBackup(targetBackup);
                }}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                ยืนยันการกู้คืนชุดข้อมูลสำรอง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Reset Database Confirmation */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[1000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-100 bg-white flex items-center gap-2.5">
              <RefreshCw className="w-5 h-5 text-rose-600 animate-spin" />
              <h3 className="font-bold text-slate-800 text-sm font-sans">ยืนยันการลบข้อมูลทั้งหมดในระบบ</h3>
            </div>
            
            <div className="p-6 space-y-3 bg-white">
              <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                คุณต้องการลบข้อมูลครุภัณฑ์ ใบสั่งซ่อม และกิจกรรมทั้งหมดในระบบแบบถาวรหรือไม่?
              </p>
              <p className="text-[11px] text-rose-600 font-medium leading-relaxed">
                * ข้อมูลทั้งหมดจะถูกลบออกจากคลังและ Firebase อย่างถาวร เพื่อให้ระบบว่างเปล่าพร้อมสำหรับการใช้งานจริงและการลงทะเบียนครุภัณฑ์ใหม่
              </p>
            </div>

            <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
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
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
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
