import React, { useState, useEffect } from 'react';
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
  AlertTriangle,
  Edit
} from 'lucide-react';
import { Asset, UserRecord } from '../types';
import { getUsers, saveUser, deleteUser } from '../lib/firebase';

interface AdminPortalViewProps {
  assets: Asset[];
  triggerToast: (type: 'success' | 'error' | 'info', message: string) => void;
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
  // Persistent users state loader
  const [users, setUsers] = useState<UserRecord[]>(() => {
    const saved = localStorage.getItem('assetmanager_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [
      { id: 'U-01', name: 'คุณสิรินทร์ เทคโน', email: 'admin@assetmanager.com', role: 'admin', department: 'IT Department', status: 'Active' },
      { id: 'U-02', name: 'คุณสมชาย พนักงานไอที', email: 'user@assetmanager.com', role: 'user', department: 'IT Operations', status: 'Active' },
      { id: 'U-03', name: 'คุณวิภา วงศ์ดี', email: 'wipa.w@assetmanager.com', role: 'user', department: 'Accounting', status: 'Active' },
      { id: 'U-04', name: 'คุณนพดล เกียรติภูมิ', email: 'noppadol.k@assetmanager.com', role: 'user', department: 'IT Infrastructure', status: 'Active' },
    ];
  });

  // Load users from Firebase on mount
  useEffect(() => {
    async function loadUsers() {
      try {
        const fbUsers = await getUsers();
        setUsers(fbUsers);
      } catch (e) {
        console.error("Failed to load users from Firebase:", e);
      }
    }
    loadUsers();
  }, []);

  // Save users to localStorage
  useEffect(() => {
    localStorage.setItem('assetmanager_users', JSON.stringify(users));
  }, [users]);

  // Access Requests (via Email) State
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'requests'>('users');
  const [accessRequests, setAccessRequests] = useState<any[]>(() => {
    const saved = localStorage.getItem('assetmanager_access_requests');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [
      { id: 'REQ-101', name: 'คุณชญาดา ประเสริฐ', email: 'chayada.p@company.com', requestedRole: 'user', department: 'Operations', requestedAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toLocaleString('th-TH'), status: 'Pending' },
      { id: 'REQ-102', name: 'คุณกิตติทัต เจริญดี', email: 'kittitat.c@company.com', requestedRole: 'admin', department: 'IT Security', requestedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toLocaleString('th-TH'), status: 'Pending' },
      { id: 'REQ-103', name: 'คุณสมโภช รักเทค', email: 'xcmg7403@gmail.com', requestedRole: 'admin', department: 'Development', requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleString('th-TH'), status: 'Pending' },
    ];
  });

  // Save Access Requests to localStorage
  useEffect(() => {
    localStorage.setItem('assetmanager_access_requests', JSON.stringify(accessRequests));
  }, [accessRequests]);

  const [approvingRequest, setApprovingRequest] = useState<any | null>(null);

  // Persistent system logs
  const [logs, setLogs] = useState<SystemLog[]>(() => {
    const saved = localStorage.getItem('assetmanager_system_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [
      { id: 'LOG-304', timestamp: new Date(Date.now() - 4 * 60 * 1000).toLocaleString('th-TH'), user: 'คุณสิรินทร์ เทคโน', action: 'ส่งออกรายงาน PDF ครุภัณฑ์ IT-NB-2024-001', ip: '192.168.1.14', status: 'SUCCESS' },
      { id: 'LOG-303', timestamp: new Date(Date.now() - 15 * 60 * 1000).toLocaleString('th-TH'), user: 'คุณสิรินทร์ เทคโน', action: 'สแกน QR Code ครุภัณฑ์ผ่านกล้อง', ip: '192.168.1.14', status: 'SUCCESS' },
      { id: 'LOG-302', timestamp: new Date(Date.now() - 42 * 60 * 1000).toLocaleString('th-TH'), user: 'คุณสมชาย พนักงานไอที', action: 'เข้าสู่ระบบสำเร็จ (Sign In)', ip: '103.22.181.5', status: 'SUCCESS' },
      { id: 'LOG-301', timestamp: new Date(Date.now() - 120 * 60 * 1000).toLocaleString('th-TH'), user: 'System-DB', action: 'ล้างข้อมูลแคชสำรองประจำวันสำเร็จ', ip: '127.0.0.1', status: 'SUCCESS' },
      { id: 'LOG-300', timestamp: new Date(Date.now() - 240 * 60 * 1000).toLocaleString('th-TH'), user: 'คุณวิภา วงศ์ดี', action: 'พยายามแก้ไขรหัสผ่านผู้ใช้งานอื่น', ip: '172.20.10.2', status: 'WARNING' },
    ];
  });

  // Save logs to localStorage
  useEffect(() => {
    localStorage.setItem('assetmanager_system_logs', JSON.stringify(logs));
  }, [logs]);

  // Search input states
  const [userSearch, setUserSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');

  // Add User State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');
  const [newUserDept, setNewUserDept] = useState('');

  // Edit / Delete User State
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserRecord | null>(null);

  // Edit / Delete Access Request State
  const [editingRequest, setEditingRequest] = useState<any | null>(null);
  const [requestToDelete, setRequestToDelete] = useState<any | null>(null);

  // Edit / Delete Log State
  const [editingLog, setEditingLog] = useState<SystemLog | null>(null);
  const [logToDelete, setLogToDelete] = useState<SystemLog | null>(null);

  // DB Optimization loading simulation
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserDept) {
      triggerToast('error', 'กรุณากรอกข้อมูลผู้ใช้รายใหม่ให้ครบถ้วน');
      return;
    }

    const nextIdNum = users.length > 0 ? Math.max(...users.map(u => {
      const match = u.id.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    })) + 1 : 1;

    const newUser: UserRecord = {
      id: `U-${String(nextIdNum).padStart(2, '0')}`,
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      department: newUserDept,
      status: 'Active',
    };

    setUsers([newUser, ...users]);
    saveUser(newUser);
    
    // Log this action
    const newLog: SystemLog = {
      id: `LOG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
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

  const handleUpdateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
    saveUser(editingUser);

    // Log this action
    const newLog: SystemLog = {
      id: `LOG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleString('th-TH'),
      user: 'คุณสิรินทร์ เทคโน (Admin)',
      action: `แก้ไขข้อมูลและสิทธิ์ผู้ใช้: ${editingUser.name} (สิทธิ์: ${editingUser.role}, สถานะ: ${editingUser.status})`,
      ip: '192.168.1.14',
      status: 'SUCCESS',
    };
    setLogs([newLog, ...logs]);

    setEditingUser(null);
    triggerToast('success', `อัปเดตข้อมูลและสิทธิ์ของ ${editingUser.name} สำเร็จ`);
  };

  const handleDeleteUser = (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    setUsers(prev => prev.filter(u => u.id !== userId));
    deleteUser(userId);

    // Log this action
    const newLog: SystemLog = {
      id: `LOG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleString('th-TH'),
      user: 'คุณสิรินทร์ เทคโน (Admin)',
      action: `ลบผู้ใช้งานระบบ: ${targetUser.name} (${targetUser.email})`,
      ip: '192.168.1.14',
      status: 'SUCCESS',
    };
    setLogs([newLog, ...logs]);

    setUserToDelete(null);
    triggerToast('success', `ลบผู้ใช้งาน ${targetUser.name} เรียบร้อยแล้ว`);
  };

  const handleToggleUserStatus = (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const nextStatus = targetUser.status === 'Active' ? 'Suspended' : 'Active';
    triggerToast('info', `เปลี่ยนสถานะผู้ใช้งาน ${targetUser.name} เป็น ${nextStatus}`);

    const updatedUser = { ...targetUser, status: nextStatus };
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return updatedUser;
      }
      return u;
    }));
    saveUser(updatedUser);
  };

  const handleOptimizeDB = () => {
    setIsOptimizing(true);
    triggerToast('info', 'กำลังสแกนสารบัญสำรอง ยุบข้อมูลแคช และจัดเก็บโครงสร้าง...');
    setTimeout(() => {
      setIsOptimizing(false);
      triggerToast('success', 'ปรับปรุงประสิทธิภาพฐานข้อมูลเสร็จสิ้น ขนาดลดลง 14.2%');
      
      const newLog: SystemLog = {
        id: `LOG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
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

  const handleApproveRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingRequest) return;

    // 1. Create a UserRecord from this approved request
    const nextIdNum = users.length > 0 ? Math.max(...users.map(u => {
      const match = u.id.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    })) + 1 : 1;

    const newUser: UserRecord = {
      id: `U-${String(nextIdNum).padStart(2, '0')}`,
      name: approvingRequest.name,
      email: approvingRequest.email,
      role: approvingRequest.requestedRole,
      department: approvingRequest.department,
      status: 'Active',
    };

    // 2. Add to active users
    setUsers([newUser, ...users]);
    saveUser(newUser);

    // 3. Update request status to 'Approved'
    setAccessRequests(prev => prev.map(req => req.id === approvingRequest.id ? { ...req, status: 'Approved' } : req));

    // 4. Log this action
    const newLog: SystemLog = {
      id: `LOG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleString('th-TH'),
      user: 'คุณสิรินทร์ เทคโน (Admin)',
      action: `อนุมัติคำขอเข้าใช้งานและกำหนดสิทธิ์ให้: ${approvingRequest.name} (${approvingRequest.email}) เป็น ${approvingRequest.requestedRole === 'admin' ? 'Administrator' : 'IT Operations'}`,
      ip: '192.168.1.14',
      status: 'SUCCESS',
    };
    setLogs([newLog, ...logs]);

    setApprovingRequest(null);
    triggerToast('success', `อนุมัติคำขอและตั้งค่าสิทธิ์ให้ ${approvingRequest.name} เรียบร้อยแล้ว`);
  };

  const handleRejectRequest = (reqId: string) => {
    const targetReq = accessRequests.find(r => r.id === reqId);
    if (!targetReq) return;

    setAccessRequests(prev => prev.map(req => req.id === reqId ? { ...req, status: 'Rejected' } : req));

    // Log this action
    const newLog: SystemLog = {
      id: `LOG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleString('th-TH'),
      user: 'คุณสิรินทร์ เทคโน (Admin)',
      action: `ปฏิเสธคำขอเข้าใช้งานระบบของ: ${targetReq.name} (${targetReq.email})`,
      ip: '192.168.1.14',
      status: 'WARNING',
    };
    setLogs([newLog, ...logs]);

    triggerToast('info', `ปฏิเสธคำขอสิทธิ์ของ ${targetReq.name} เรียบร้อยแล้ว`);
  };

  const handleUpdateAccessRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest) return;
    
    setAccessRequests(prev => prev.map(req => req.id === editingRequest.id ? editingRequest : req));
    
    const newLog: SystemLog = {
      id: `LOG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleString('th-TH'),
      user: 'คุณสิรินทร์ เทคโน (Admin)',
      action: `แก้ไขข้อมูลคำขอเข้าใช้งานระบบ: ${editingRequest.name} (สังกัด: ${editingRequest.department})`,
      ip: '192.168.1.14',
      status: 'SUCCESS',
    };
    setLogs([newLog, ...logs]);
    
    setEditingRequest(null);
    triggerToast('success', 'แก้ไขข้อมูลคำขอเข้าใช้งานเรียบร้อยแล้ว');
  };

  const handleDeleteAccessRequest = (reqId: string) => {
    const target = accessRequests.find(r => r.id === reqId);
    if (!target) return;
    
    setAccessRequests(prev => prev.filter(req => req.id !== reqId));
    
    const newLog: SystemLog = {
      id: `LOG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleString('th-TH'),
      user: 'คุณสิรินทร์ เทคโน (Admin)',
      action: `ลบข้อมูลคำขอเข้าใช้งานระบบ: ${target.name} (${target.email})`,
      ip: '192.168.1.14',
      status: 'SUCCESS',
    };
    setLogs([newLog, ...logs]);
    
    setRequestToDelete(null);
    triggerToast('success', 'ลบข้อมูลคำขอเข้าใช้งานเรียบร้อยแล้ว');
  };

  const handleUpdateLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;
    
    setLogs(prev => prev.map(l => l.id === editingLog.id ? editingLog : l));
    setEditingLog(null);
    triggerToast('success', 'แก้ไขประวัติความปลอดภัยเรียบร้อยแล้ว');
  };

  const handleDeleteLog = (logId: string) => {
    setLogs(prev => prev.filter(l => l.id !== logId));
    setLogToDelete(null);
    triggerToast('success', 'ลบประวัติความปลอดภัยเรียบร้อยแล้ว');
  };

  const handleClearAllLogs = () => {
    setLogs([]);
    triggerToast('success', 'ล้างประวัติความปลอดภัยทั้งหมดเรียบร้อยแล้ว');
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-[#00236f] text-white p-6 sm:p-8 rounded-2xl shadow-md">
        <div className="space-y-1 flex-1 min-w-0">
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
        <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shrink-0 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveSubTab('users')}
                className={`pb-1 text-sm font-bold transition-all relative ${
                  activeSubTab === 'users' 
                    ? 'text-[#00236f]' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <span>บัญชีผู้ใช้ทั้งหมด ({users.length})</span>
                {activeSubTab === 'users' && <span className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-[#00236f] rounded-full"></span>}
              </button>
              
              <button
                onClick={() => setActiveSubTab('requests')}
                className={`pb-1 text-sm font-bold transition-all relative flex items-center gap-1.5 ${
                  activeSubTab === 'requests' 
                    ? 'text-[#00236f]' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <span>คำขอเข้าใช้งานผ่านอีเมล ({accessRequests.filter(r => r.status === 'Pending').length})</span>
                {accessRequests.filter(r => r.status === 'Pending').length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                )}
                {activeSubTab === 'requests' && <span className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-[#00236f] rounded-full"></span>}
              </button>
            </div>
            {activeSubTab === 'users' && (
              <button
                onClick={() => setIsAddUserOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#00236f] hover:bg-primary text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>เพิ่มผู้ใช้</span>
              </button>
            )}
          </div>

          {activeSubTab === 'users' ? (
            <>
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
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleToggleUserStatus(user.id)}
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                                user.status === 'Active'
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                  : 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100'
                              }`}
                              title={user.status === 'Active' ? 'ระงับบัญชี' : 'เปิดใช้งานบัญชี'}
                            >
                              {user.status === 'Active' ? 'Active' : 'Suspended'}
                            </button>
                            
                            <button
                              onClick={() => setEditingUser(user)}
                              title="ตั้งค่าสิทธิ์ / แก้ไขข้อมูล"
                              className="p-1 hover:bg-slate-100 text-[#00236f] hover:text-primary rounded transition-colors cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            
                            <button
                              onClick={() => setUserToDelete(user)}
                              title="ลบผู้ใช้งาน"
                              className="p-1 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              {/* Info banner for requests */}
              <div className="mb-3 shrink-0">
                <p className="text-[11px] text-slate-600 bg-amber-50/60 border border-amber-200/50 rounded-xl p-2.5 leading-normal font-medium">
                  📧 <strong>รายการความต้องการขอสิทธิ์เข้าใช้งานระบบ:</strong> แสดงรายชื่อของพนักงานที่ต้องการขอสิทธิ์ผ่านอีเมลขององค์กร สามารถกดปุ่ม <span className="text-emerald-700 font-bold">"อนุมัติ & มอบสิทธิ์"</span> เพื่อพิจารณากำหนดระดับการเข้าถึงในทันที
                </p>
              </div>

              {/* Requests Table list */}
              <div className="overflow-y-auto flex-1 -mx-5 sm:-mx-6 border-t border-slate-100">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 text-slate-400 uppercase font-bold text-[9px] tracking-wider sticky top-0">
                      <th className="py-2.5 px-5">REQ ID</th>
                      <th className="py-2.5 px-2">ข้อมูลผู้ส่งคำขอ</th>
                      <th className="py-2.5 px-2">สิทธิ์ที่ยื่นขอ</th>
                      <th className="py-2.5 px-2">แผนก</th>
                      <th className="py-2.5 px-5 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {accessRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-5 font-mono text-slate-400 text-[10px]">{req.id}</td>
                        <td className="py-3 px-2">
                          <div>
                            <p className="font-bold text-slate-800 leading-snug">{req.name}</p>
                            <p className="text-[10px] text-[#00236f] font-semibold leading-none">{req.email}</p>
                            <p className="text-[9px] text-slate-400 mt-1">ยื่นคำขอ: {req.requestedAt}</p>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            req.requestedRole === 'admin' 
                              ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}>
                            <Lock className="w-2.5 h-2.5" />
                            {req.requestedRole === 'admin' ? 'Administrator' : 'IT Operations'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-slate-500 font-semibold text-[11px]">{req.department}</td>
                        <td className="py-3 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {req.status === 'Pending' ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleRejectRequest(req.id)}
                                  className="text-[10px] font-bold px-2 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded border border-rose-200 cursor-pointer transition-all"
                                >
                                  ปฏิเสธ
                                </button>
                                <button
                                  onClick={() => setApprovingRequest(req)}
                                  className="text-[10px] font-bold px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded border border-emerald-700 shadow-sm cursor-pointer transition-all"
                                >
                                  อนุมัติ & มอบสิทธิ์
                                </button>
                              </div>
                            ) : (
                              <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold ${
                                req.status === 'Approved' ? 'text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full' : 'text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full'
                              }`}>
                                <CheckCircle className="w-3.5 h-3.5" />
                                {req.status === 'Approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธแล้ว'}
                              </span>
                            )}
                            <div className="flex items-center gap-1 pl-1 border-l border-slate-100">
                              <button
                                onClick={() => setEditingRequest(req)}
                                title="แก้ไขข้อมูลคำขอ"
                                className="p-1 hover:bg-slate-100 text-[#00236f] hover:text-primary rounded transition-colors cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setRequestToDelete(req)}
                                title="ลบคำขอเข้าใช้งาน"
                                className="p-1 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Security Audit Log Section */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm flex flex-col h-[520px]">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-secondary animate-pulse" />
              <h3 className="font-bold text-sm text-slate-800">ประวัติความปลอดภัย (Security Audit)</h3>
            </div>
            <div className="flex items-center gap-1.5">
              {logs.length > 0 && (
                <button
                  onClick={handleClearAllLogs}
                  title="ล้างประวัติทั้งหมด"
                  className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-lg transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="text-[10px] hidden sm:inline">ล้างประวัติ</span>
                </button>
              )}
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
              <div key={log.id} className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1.5 text-xs relative group">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-mono text-slate-400 font-bold">{log.id}</span>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{log.timestamp}</span>
                  </div>
                </div>
                
                <p className="text-slate-800 font-bold leading-relaxed pr-12">{log.action}</p>

                {/* Edit & Delete actions inside log card */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200/80 shadow-xs">
                  <button
                    onClick={() => setEditingLog(log)}
                    title="แก้ไขล็อก"
                    className="p-1 text-[#00236f] hover:bg-slate-50 rounded transition-colors cursor-pointer"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setLogToDelete(log)}
                    title="ลบล็อก"
                    className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex justify-between items-center text-[10px]">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-[#00236f]/10 text-[#00236f] rounded-full flex items-center justify-center text-[8px] font-bold">U</div>
                    <span className="text-slate-500 font-semibold">{log.user}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-1 rounded-xs font-bold text-[8px] ${
                      log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      log.status === 'WARNING' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}>{log.status}</span>
                    <span className="font-mono text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded">IP: {log.ip}</span>
                  </div>
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

      {/* Edit User / ตั้งค่าสิทธิ์ Modal Dialog */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[1000] flex items-center justify-center p-4">
          <form 
            onSubmit={handleUpdateUserSubmit}
            className="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
          >
            <div className="p-4 bg-[#00236f] text-white flex justify-between items-center">
              <h4 className="font-bold text-sm">ตั้งค่าสิทธิ์และแก้ไขข้อมูลผู้ใช้งาน</h4>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* ID Info */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-200 px-1.5 py-0.5 rounded">รหัสบัญชี: {editingUser.id}</span>
                <p className="text-xs font-bold text-slate-800 mt-1.5">ผู้ใช้: {editingUser.name}</p>
              </div>

              {/* Name Edit */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">ชื่อ-นามสกุล พนักงาน</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-primary"
                />
              </div>

              {/* Email Edit */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">อีเมลล็อกอิน</label>
                <input
                  type="email"
                  required
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-primary"
                />
              </div>

              {/* Department Edit */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">แผนกสังกัด</label>
                <input
                  type="text"
                  required
                  value={editingUser.department}
                  onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-primary"
                />
              </div>

              {/* Role Select Edit */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">บทบาทสิทธิ์ (Role Permission)</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as 'admin' | 'user' })}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
                >
                  <option value="user">IT Operations (จำกัดการควบคุมคุณสมบัติหลัก)</option>
                  <option value="admin">Administrator (ควบคุมทุกข้อมูลระบบและประวัติ)</option>
                </select>
              </div>

              {/* Status Select Edit */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">สถานะบัญชี (Account Status)</label>
                <select
                  value={editingUser.status}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as 'Active' | 'Suspended' })}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
                >
                  <option value="Active">Active (เปิดใช้งานปกติ)</option>
                  <option value="Suspended">Suspended (ระงับบัญชีการเข้าสู่ระบบ)</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#00236f] hover:bg-primary text-white font-bold rounded-xl cursor-pointer"
              >
                บันทึกการแก้ไข
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Delete User Confirmation */}
      {userToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[1000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-100 bg-rose-50/50 flex items-center gap-2.5">
              <Trash2 className="w-5 h-5 text-rose-600 animate-bounce" />
              <h3 className="font-bold text-slate-800 text-sm font-sans">ยืนยันการลบผู้ใช้งาน</h3>
            </div>
            
            <div className="p-6 space-y-3">
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้งานรายนี้ออกจากระบบ?
              </p>
              <div className="p-3 bg-rose-50/30 border border-rose-100 rounded-xl">
                <p className="text-xs font-bold text-slate-800 leading-snug">{userToDelete.name}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-1">อีเมล: {userToDelete.email}</p>
                <p className="text-[10px] text-slate-400 font-mono">แผนกสังกัด: {userToDelete.department}</p>
              </div>
              <p className="text-[11px] text-rose-500 font-medium">
                * บัญชีผู้ใช้นี้จะถูกนำออกจากระบบถาวร ไม่สามารถกู้คืนได้
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => handleDeleteUser(userToDelete.id)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                ยืนยันการลบผู้ใช้
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Approve & Assign Permissions */}
      {approvingRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[1000] flex items-center justify-center p-4">
          <form 
            onSubmit={handleApproveRequestSubmit}
            className="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
          >
            <div className="p-4 bg-emerald-600 text-white flex justify-between items-center">
              <h4 className="font-bold text-sm">อนุมัติคำขอสิทธิ์และตั้งค่าบัญชีพนักงาน</h4>
              <button
                type="button"
                onClick={() => setApprovingRequest(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 font-semibold leading-normal">
                โปรดตรวจสอบและแก้ไขข้อมูลความต้องการ แผนกสังกัด และระดับสิทธิ์เข้าถึงของพนักงานก่อนการอนุมัติเข้าระบบหลัก
              </p>

              {/* Name Edit */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">ชื่อ-นามสกุล พนักงาน</label>
                <input
                  type="text"
                  required
                  value={approvingRequest.name}
                  onChange={(e) => setApprovingRequest({ ...approvingRequest, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Email (Readonly) */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">อีเมลล็อกอินองค์กร</label>
                <input
                  type="email"
                  disabled
                  value={approvingRequest.email}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-400 focus:outline-none"
                />
              </div>

              {/* Department Edit */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">แผนกสังกัด</label>
                <input
                  type="text"
                  required
                  value={approvingRequest.department}
                  onChange={(e) => setApprovingRequest({ ...approvingRequest, department: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Role Select Edit */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">บทบาทสิทธิ์ (Role Permission)</label>
                <select
                  value={approvingRequest.requestedRole}
                  onChange={(e) => setApprovingRequest({ ...approvingRequest, requestedRole: e.target.value as 'admin' | 'user' })}
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
                onClick={() => setApprovingRequest(null)}
                className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-md transition-colors"
              >
                อนุมัติและเพิ่มสิทธิ์พนักงาน
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Edit Access Request */}
      {editingRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[1000] flex items-center justify-center p-4">
          <form 
            onSubmit={handleUpdateAccessRequestSubmit}
            className="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
          >
            <div className="p-4 bg-[#00236f] text-white flex justify-between items-center">
              <h4 className="font-bold text-sm">แก้ไขข้อมูลคำขอเข้าใช้งาน</h4>
              <button
                type="button"
                onClick={() => setEditingRequest(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-200 px-1.5 py-0.5 rounded">คำขอ: {editingRequest.id}</span>
                <p className="text-xs font-bold text-slate-800 mt-1.5">ผู้ยื่นคำขอ: {editingRequest.name}</p>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  required
                  value={editingRequest.name}
                  onChange={(e) => setEditingRequest({ ...editingRequest, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#00236f]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">อีเมลล็อกอิน</label>
                <input
                  type="email"
                  required
                  value={editingRequest.email}
                  onChange={(e) => setEditingRequest({ ...editingRequest, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#00236f]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">แผนกสังกัด</label>
                <input
                  type="text"
                  required
                  value={editingRequest.department}
                  onChange={(e) => setEditingRequest({ ...editingRequest, department: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#00236f]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">สิทธิ์ที่ยื่นขอ</label>
                <select
                  value={editingRequest.requestedRole}
                  onChange={(e) => setEditingRequest({ ...editingRequest, requestedRole: e.target.value as 'admin' | 'user' })}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#00236f]"
                >
                  <option value="user">IT Operations (จำกัดการควบคุมคุณสมบัติหลัก)</option>
                  <option value="admin">Administrator (ควบคุมทุกข้อมูลระบบและประวัติ)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">สถานะคำขอ</label>
                <select
                  value={editingRequest.status}
                  onChange={(e) => setEditingRequest({ ...editingRequest, status: e.target.value })}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#00236f]"
                >
                  <option value="Pending">Pending (รออนุมัติ)</option>
                  <option value="Approved">Approved (อนุมัติแล้ว)</option>
                  <option value="Rejected">Rejected (ปฏิเสธแล้ว)</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setEditingRequest(null)}
                className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#00236f] hover:bg-primary text-white font-bold rounded-xl cursor-pointer"
              >
                บันทึกการแก้ไข
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Delete Access Request Confirmation */}
      {requestToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[1000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-100 bg-rose-50/50 flex items-center gap-2.5">
              <Trash2 className="w-5 h-5 text-rose-600 animate-bounce" />
              <h3 className="font-bold text-slate-800 text-sm font-sans">ยืนยันการลบคำขอเข้าใช้งาน</h3>
            </div>
            
            <div className="p-6 space-y-3">
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                คุณแน่ใจหรือไม่ว่าต้องการลบคำขอเข้าใช้งานรายนี้ออกจากระบบ?
              </p>
              <div className="p-3 bg-rose-50/30 border border-rose-100 rounded-xl">
                <p className="text-xs font-bold text-slate-800 leading-snug">{requestToDelete.name}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-1">อีเมล: {requestToDelete.email}</p>
                <p className="text-[10px] text-slate-400 font-mono">สถานะคำขอ: {requestToDelete.status}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRequestToDelete(null)}
                className="px-4 py-2 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => handleDeleteAccessRequest(requestToDelete.id)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                ยืนยันการลบคำขอ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Security Log */}
      {editingLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[1000] flex items-center justify-center p-4">
          <form 
            onSubmit={handleUpdateLogSubmit}
            className="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
          >
            <div className="p-4 bg-[#00236f] text-white flex justify-between items-center">
              <h4 className="font-bold text-sm">แก้ไขข้อมูลประวัติความปลอดภัย (Edit Log)</h4>
              <button
                type="button"
                onClick={() => setEditingLog(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-[10px] font-mono text-slate-400">
                <span className="font-bold">รหัสล็อก: {editingLog.id}</span>
                <span>เวลา: {editingLog.timestamp}</span>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">กิจกรรม/การกระทำ (Action)</label>
                <textarea
                  required
                  rows={3}
                  value={editingLog.action}
                  onChange={(e) => setEditingLog({ ...editingLog, action: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#00236f] resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">ผู้ปฏิบัติงาน (User)</label>
                <input
                  type="text"
                  required
                  value={editingLog.user}
                  onChange={(e) => setEditingLog({ ...editingLog, user: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#00236f]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">เลขที่อยู่ IP Address</label>
                <input
                  type="text"
                  required
                  value={editingLog.ip}
                  onChange={(e) => setEditingLog({ ...editingLog, ip: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#00236f] font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">สถานะของกิจกรรม (Status)</label>
                <select
                  value={editingLog.status}
                  onChange={(e) => setEditingLog({ ...editingLog, status: e.target.value as 'SUCCESS' | 'WARNING' | 'FAILED' })}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#00236f]"
                >
                  <option value="SUCCESS">SUCCESS (สำเร็จ)</option>
                  <option value="WARNING">WARNING (เตือนภัย)</option>
                  <option value="FAILED">FAILED (ล้มเหลว)</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setEditingLog(null)}
                className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#00236f] hover:bg-primary text-white font-bold rounded-xl cursor-pointer"
              >
                บันทึกประวัติ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Delete Security Log Confirmation */}
      {logToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[1000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-100 bg-rose-50/50 flex items-center gap-2.5">
              <Trash2 className="w-5 h-5 text-rose-600 animate-bounce" />
              <h3 className="font-bold text-slate-800 text-sm font-sans">ยืนยันการลบประวัติความปลอดภัย</h3>
            </div>
            
            <div className="p-6 space-y-3">
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                คุณแน่ใจหรือไม่ว่าต้องการลบรายการประวัติตัวนี้ถาวร?
              </p>
              <div className="p-3 bg-rose-50/30 border border-rose-100 rounded-xl">
                <p className="text-xs font-mono font-bold text-slate-800">{logToDelete.id}</p>
                <p className="text-xs text-slate-600 mt-1 font-semibold">{logToDelete.action}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-1">ผู้ปฏิบัติงาน: {logToDelete.user} | IP: {logToDelete.ip}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setLogToDelete(null)}
                className="px-4 py-2 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => handleDeleteLog(logToDelete.id)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
