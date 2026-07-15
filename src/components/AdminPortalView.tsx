import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Users, 
  Activity, 
  Database, 
  Clock, 
  Lock, 
  Search, 
  Plus, 
  CheckCircle, 
  RefreshCw, 
  Download, 
  Trash2, 
  UserPlus, 
  AlertTriangle 
} from 'lucide-react';
import { Asset } from '../types';

interface AdminPortalViewProps {
  assets: Asset[];
  triggerToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  department: string;
  status: 'Active' | 'Suspended';
}

interface SystemLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  ip: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

export default function AdminPortalView({ assets, triggerToast }: AdminPortalViewProps) {
  // Mock users
  const [users, setUsers] = useState<UserRecord[]>([
    { id: 'U-01', name: 'คุณสิรินทร์ เทคโน', email: 'admin@assetmanager.com', role: 'admin', department: 'IT Department', status: 'Active' },
    { id: 'U-02', name: 'คุณสมชาย พนักงานไอที', email: 'user@assetmanager.com', role: 'user', department: 'IT Operations', status: 'Active' },
    { id: 'U-03', name: 'คุณวิภา วงศ์ดี', email: 'wipa.w@assetmanager.com', role: 'user', department: 'Accounting', status: 'Active' },
    { id: 'U-04', name: 'คุณนพดล เกียรติภูมิ', email: 'noppadol.k@assetmanager.com', role: 'user', department: 'IT Infrastructure', status: 'Active' },
  ]);

  // Mock logs
  const [logs, setLogs] = useState<SystemLog[]>([
    { id: 'LOG-304', timestamp: new Date(Date.now() - 4 * 60 * 1000).toLocaleString('th-TH'), user: 'คุณสิรินทร์ เทคโน', action: 'ส่งออกรายงาน PDF ครุภัณฑ์ IT-NB-2024-001', ip: '192.168.1.14', status: 'SUCCESS' },
    { id: 'LOG-303', timestamp: new Date(Date.now() - 15 * 60 * 1000).toLocaleString('th-TH'), user: 'คุณสิรินทร์ เทคโน', action: 'สแกน QR Code ครุภัณฑ์ผ่านกล้อง', ip: '192.168.1.14', status: 'SUCCESS' },
    { id: 'LOG-302', timestamp: new Date(Date.now() - 42 * 60 * 1000).toLocaleString('th-TH'), user: 'คุณสมชาย พนักงานไอที', action: 'เข้าสู่ระบบสำเร็จ (Sign In)', ip: '103.22.181.5', status: 'SUCCESS' },
    { id: 'LOG-301', timestamp: new Date(Date.now() - 120 * 60 * 1000).toLocaleString('th-TH'), user: 'System-DB', action: 'ล้างข้อมูลแคชสำรองประจำวันสำเร็จ', ip: '127.0.0.1', status: 'SUCCESS' },
    { id: 'LOG-300', timestamp: new Date(Date.now() - 240 * 60 * 1000).toLocaleString('th-TH'), user: 'คุณวิภา วงศ์ดี', action: 'พยายามแก้ไขรหัสผ่านผู้ใช้งานอื่น', ip: '172.20.10.2', status: 'WARNING' },
  ]);

  // Search input states
  const [userSearch, setUserSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');

  // Add User State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');
  const [newUserDept, setNewUserDept] = useState('');

  // DB Optimization loading simulation
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserDept) {
      triggerToast('error', 'กรุณากรอกข้อมูลผู้ใช้รายใหม่ให้ครบถ้วน');
      return;
    }

    const newUser: UserRecord = {
      id: `U-0${users.length + 1}`,
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      department: newUserDept,
      status: 'Active',
    };

    setUsers([newUser, ...users]);
    
    // Log this action
    const newLog: SystemLog = {
      id: `LOG-${Date.now().toString().slice(-3)}`,
      timestamp: new Date().toLocaleString('th-TH'),
      user: 'คุณสิรินทร์ เทคโน (Admin)',
      action: `สร้างบัญชีผู้ใช้งานใหม่: ${newUserName} (${newUserRole})`,
      ip: '192.168.1.14',
      status: 'SUCCESS',
    };
    setLogs([newLog, ...logs]);

    setIsAddUserOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserDept('');
    triggerToast('success', `เพิ่มบัญชีผู้ใช้ใหม่ ${newUserName} สำเร็จ`);
  };

  const handleToggleUserStatus = (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const nextStatus = targetUser.status === 'Active' ? 'Suspended' : 'Active';
    triggerToast('info', `เปลี่ยนสถานะผู้ใช้งาน ${targetUser.name} เป็น ${nextStatus}`);

    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  const handleOptimizeDB = () => {
    setIsOptimizing(true);
    triggerToast('info', 'กำลังสแกนสารบัญสำรอง ยุบข้อมูลแคช และจัดเก็บโครงสร้าง...');
    setTimeout(() => {
      setIsOptimizing(false);
      triggerToast('success', 'ปรับปรุงประสิทธิภาพฐานข้อมูลเสร็จสิ้น ขนาดลดลง 14.2%');
      
      const newLog: SystemLog = {
        id: `LOG-${Date.now().toString().slice(-3)}`,
        timestamp: new Date().toLocaleString('th-TH'),
        user: 'คุณสิรินทร์ เทคโน (Admin)',
        action: 'สั่งรันคำสั่งบีบอัดความจุฐานข้อมูลระบบ (Database Shrink & Optimize)',
        ip: '192.168.1.14',
        status: 'SUCCESS',
      };
      setLogs([newLog, ...logs]);
    }, 1500);
  };

  const handleDownloadBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(assets, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `AssetManager_IT_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerToast('success', 'ส่งออกไฟล์สำรองทะเบียนฐานข้อมูล JSON สำเร็จ');
  };

  // Filter lists
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.department.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredLogs = logs.filter(l => 
    l.user.toLowerCase().includes(logSearch.toLowerCase()) || 
    l.action.toLowerCase().includes(logSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#00236f] text-white p-6 sm:p-8 rounded-2xl shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-white/10 rounded-lg">
              <ShieldAlert className="w-5 h-5 text-sky-400" />
            </span>
            <span className="text-[10px] font-bold text-sky-300 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-md">
              Admin Exclusive Portal
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">ระบบสิทธิ์และการควบคุมข้อมูลหลัก</h2>
          <p className="text-xs text-sky-100/80 max-w-xl font-light">
            สำหรับผู้ดูแลระบบสูงสุดในการจำลองระบบสิทธิ์พนักงาน ตรวจสอบประวัติการเข้าใช้งานความปลอดภัย (Security Audit Logs) และปรับปรุงประสิทธิภาพฐานข้อมูล
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleOptimizeDB}
            disabled={isOptimizing}
            className="flex items-center gap-2 px-3.5 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            <Database className="w-4 h-4" />
            <span>{isOptimizing ? 'กำลังวิเคราะห์...' : 'Optimize DB'}</span>
          </button>
          <button
            onClick={handleDownloadBackup}
            className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all border border-white/10 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Backup Data</span>
          </button>
        </div>
      </div>

      {/* Grid Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* User Management Section */}
        <div className="col-span-12 lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm flex flex-col h-[520px]">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-primary" />
              <h3 className="font-bold text-sm text-slate-800">จัดการสิทธิ์บัญชีผู้ใช้ (Account Controls)</h3>
            </div>
            <button
              onClick={() => setIsAddUserOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#00236f] hover:bg-primary text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>เพิ่มผู้ใช้</span>
            </button>
          </div>

          {/* Search bar inside list */}
          <div className="mb-3 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="ค้นหาตามชื่อ, อีเมล หรือสิทธิ์..."
                className="w-full pl-8 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Table list */}
          <div className="overflow-y-auto flex-1 -mx-5 sm:-mx-6 border-t border-slate-100">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/75 text-slate-400 uppercase font-bold text-[9px] tracking-wider sticky top-0">
                  <th className="py-2.5 px-5">ID</th>
                  <th className="py-2.5 px-2">ข้อมูลผู้ใช้</th>
                  <th className="py-2.5 px-2">สิทธิ์เข้าถึง</th>
                  <th className="py-2.5 px-2">แผนก</th>
                  <th className="py-2.5 px-5 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-5 font-mono text-slate-400 text-[10px]">{user.id}</td>
                    <td className="py-3 px-2">
                      <div>
                        <p className="font-bold text-slate-800 leading-snug">{user.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium leading-none">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        user.role === 'admin' 
                          ? 'bg-[#00236f]/10 text-[#00236f]' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Lock className="w-2.5 h-2.5" />
                        {user.role === 'admin' ? 'Administrator' : 'IT Operations'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-slate-500 font-semibold text-[11px]">{user.department}</td>
                    <td className="py-3 px-5 text-right">
                      <button
                        onClick={() => handleToggleUserStatus(user.id)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                          user.status === 'Active'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            : 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100'
                        }`}
                      >
                        {user.status === 'Active' ? 'Active' : 'Suspended'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Audit Log Section */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm flex flex-col h-[520px]">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-secondary animate-pulse" />
              <h3 className="font-bold text-sm text-slate-800">ประวัติความปลอดภัย (Security Audit)</h3>
            </div>
            <button
              onClick={() => {
                triggerToast('info', 'อัปเดตสถานะบันทึกเรียลไทม์สำเร็จ');
              }}
              title="ดึงประวัติล่าสุด"
              className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search Logs */}
          <div className="mb-3 shrink-0">
            <input
              type="text"
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              placeholder="กรองประวัติตามกิจกรรม..."
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none"
            />
          </div>

          {/* Vertical Timeline Lists */}
          <div className="overflow-y-auto flex-1 space-y-3.5 pr-1 -mr-2">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-mono text-slate-400 font-bold">{log.id}</span>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{log.timestamp}</span>
                  </div>
                </div>
                
                <p className="text-slate-800 font-bold leading-relaxed">{log.action}</p>

                <div className="flex justify-between items-center text-[10px]">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-[#00236f]/10 text-[#00236f] rounded-full flex items-center justify-center text-[8px] font-bold">U</div>
                    <span className="text-slate-500 font-semibold">{log.user}</span>
                  </div>
                  <span className="font-mono text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded">IP: {log.ip}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Add User Modal Dialog */}
      {isAddUserOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[1000] flex items-center justify-center p-4">
          <form 
            onSubmit={handleAddUserSubmit}
            className="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
          >
            <div className="p-4 bg-[#00236f] text-white flex justify-between items-center">
              <h4 className="font-bold text-sm">เพิ่มบัญชีเจ้าหน้าที่ไอทีรายใหม่</h4>
              <button
                type="button"
                onClick={() => setIsAddUserOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">ชื่อ-นามสกุล พนักงาน</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="เช่น คุณวิฑูรย์ รักงานคอม"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-primary"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">อีเมลล็อกอิน</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="เช่น witoon.r@assetmanager.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-primary"
                />
              </div>

              {/* Department */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">แผนกสังกัด</label>
                <input
                  type="text"
                  required
                  value={newUserDept}
                  onChange={(e) => setNewUserDept(e.target.value)}
                  placeholder="เช่น IT Service, Accounting"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-primary"
                />
              </div>

              {/* Role Select */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">บทบาทสิทธิ์ (Role Permission)</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'user')}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
                >
                  <option value="user">IT Operations (จำกัดการควบคุมคุณสมบัติหลัก)</option>
                  <option value="admin">Administrator (ควบคุมทุกข้อมูลระบบและประวัติ)</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsAddUserOpen(false)}
                className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#00236f] hover:bg-primary text-white font-bold rounded-xl cursor-pointer"
              >
                บันทึกบัญชีผู้ใช้
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
