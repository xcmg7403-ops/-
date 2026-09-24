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
  Edit,
  Key,
  Shield,
  Eye,
  EyeOff,
  Tag,
  Building2,
  MapPin,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Check,
  Laptop,
  Phone,
  FileText,
  Filter,
  X
} from 'lucide-react';
import { 
  Asset, 
  UserRecord, 
  UserSession, 
  UserPermissions,
  MasterDataState, 
  MasterCategory, 
  MasterDepartment, 
  MasterLocation, 
  MasterVendor, 
  MasterStatus 
} from '../types';
import { 
  getUsers, 
  saveUser, 
  deleteUser, 
  DEFAULT_USERS, 
  DEFAULT_ADMIN_PERMISSIONS, 
  DEFAULT_USER_PERMISSIONS,
  DEFAULT_MASTER_DATA,
  saveMasterData,
  resetMasterData
} from '../lib/firebase';

interface AdminPortalViewProps {
  assets: Asset[];
  triggerToast: (type: 'success' | 'error' | 'info', message: string) => void;
  currentUser?: UserSession;
  masterData?: MasterDataState;
  onUpdateMasterData?: (newMasterData: MasterDataState) => void;
}

interface SystemLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  ip: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

export default function AdminPortalView({ 
  assets, 
  triggerToast,
  currentUser,
  masterData: propMasterData,
  onUpdateMasterData
}: AdminPortalViewProps) {
  // Main Tab State: 'users' | 'masterData' | 'logs'
  const [mainTab, setMainTab] = useState<'users' | 'masterData' | 'logs'>('users');

  // Master Data Local & Sync State
  const [localMasterData, setLocalMasterData] = useState<MasterDataState>(() => {
    if (propMasterData) return propMasterData;
    const saved = localStorage.getItem('assetmanager_master_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_MASTER_DATA;
  });

  useEffect(() => {
    if (propMasterData) {
      setLocalMasterData(propMasterData);
    }
  }, [propMasterData]);

  // Master Data Sub Tab: 'categories' | 'departments' | 'locations' | 'vendors' | 'statuses'
  const [masterSubTab, setMasterSubTab] = useState<'categories' | 'departments' | 'locations' | 'vendors' | 'statuses'>('categories');
  const [masterSearch, setMasterSearch] = useState('');

  // Persistent users state loader
  const [users, setUsers] = useState<UserRecord[]>(() => {
    const saved = localStorage.getItem('assetmanager_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_USERS;
  });

  // Load users from Firebase on mount
  useEffect(() => {
    async function loadUsers() {
      try {
        const fbUsers = await getUsers();
        if (fbUsers && fbUsers.length > 0) {
          setUsers(fbUsers);
        }
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

  // Persistent system logs
  const [logs, setLogs] = useState<SystemLog[]>(() => {
    const saved = localStorage.getItem('assetmanager_system_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 'LOG-305', timestamp: new Date(Date.now() - 2 * 60 * 1000).toLocaleString('th-TH'), user: 'admin', action: 'เข้าสู่ระบบสำเร็จผ่านหน้าล็อกอิน (Username/Password)', ip: '127.0.0.1', status: 'SUCCESS' },
      { id: 'LOG-304', timestamp: new Date(Date.now() - 10 * 60 * 1000).toLocaleString('th-TH'), user: 'admin', action: 'ส่งออกรายงาน PDF สรุปสถานะครุภัณฑ์', ip: '192.168.1.14', status: 'SUCCESS' },
      { id: 'LOG-303', timestamp: new Date(Date.now() - 25 * 60 * 1000).toLocaleString('th-TH'), user: 'user', action: 'เข้าสู่ระบบสำเร็จ (Sign In)', ip: '103.22.181.5', status: 'SUCCESS' },
      { id: 'LOG-302', timestamp: new Date(Date.now() - 60 * 60 * 1000).toLocaleString('th-TH'), user: 'admin', action: 'อัปเดตข้อมูลหลัก (Master Data Taxonomy)', ip: '192.168.1.14', status: 'SUCCESS' },
      { id: 'LOG-301', timestamp: new Date(Date.now() - 120 * 60 * 1000).toLocaleString('th-TH'), user: 'System-DB', action: 'ตรวจสอบความสมบูรณ์ของฐานข้อมูล Master Data', ip: '127.0.0.1', status: 'SUCCESS' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('assetmanager_system_logs', JSON.stringify(logs));
  }, [logs]);

  // Search input states
  const [userSearch, setUserSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');

  // Add User State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('password123');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmpId, setNewUserEmpId] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');
  const [newUserDept, setNewUserDept] = useState('IT Department');
  const [newUserPermissions, setNewUserPermissions] = useState<UserPermissions>({ ...DEFAULT_USER_PERMISSIONS });
  const [showAddPassword, setShowAddPassword] = useState(false);

  // Edit / Delete User State
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserRecord | null>(null);
  const [editingPassword, setEditingPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Reset Password Quick Modal
  const [passwordModalUser, setPasswordModalUser] = useState<UserRecord | null>(null);
  const [quickNewPassword, setQuickNewPassword] = useState('password123');

  // Master Data Modals State
  const [isAddMasterOpen, setIsAddMasterOpen] = useState(false);
  const [editingMasterItem, setEditingMasterItem] = useState<any | null>(null);
  const [masterToDelete, setMasterToDelete] = useState<any | null>(null);
  const [showResetMasterConfirm, setShowResetMasterConfirm] = useState(false);

  // Generic Master Form States
  const [mCode, setMCode] = useState('');
  const [mNameTh, setMNameTh] = useState('');
  const [mNameEn, setMNameEn] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mHeadName, setMHeadName] = useState('');
  const [mBuilding, setMBuilding] = useState('');
  const [mFloor, setMFloor] = useState('');
  const [mContactPerson, setMContactPerson] = useState('');
  const [mPhone, setMPhone] = useState('');
  const [mEmail, setMEmail] = useState('');
  const [mColor, setMColor] = useState('#0058be');
  const [mAllowAssign, setMAllowAssign] = useState(true);

  // DB Optimization loading simulation
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Helper to log actions
  const addLog = (action: string, status: 'SUCCESS' | 'WARNING' | 'FAILED' = 'SUCCESS') => {
    const actor = currentUser?.username || 'admin';
    const newLog: SystemLog = {
      id: `LOG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleString('th-TH'),
      user: actor,
      action,
      ip: '192.168.1.14',
      status,
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // Automatically update permissions when role changes in Add User modal
  const handleRoleChangeForNewUser = (role: 'admin' | 'user') => {
    setNewUserRole(role);
    if (role === 'admin') {
      setNewUserPermissions({ ...DEFAULT_ADMIN_PERMISSIONS });
    } else {
      setNewUserPermissions({ ...DEFAULT_USER_PERMISSIONS });
    }
  };

  // Helper to generate random password
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  // ----------------------------------------------------
  // USER MANAGEMENT HANDLERS
  // ----------------------------------------------------
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = newUsername.trim().toLowerCase().replace(/[^a-zA-Z0-9._-]/g, '');
    if (!cleanUsername || !newUserName.trim()) {
      triggerToast('error', 'กรุณากรอก Username และชื่อ-นามสกุลให้ครบถ้วน');
      return;
    }

    // Check unique username
    if (users.some(u => u.username && u.username.toLowerCase() === cleanUsername)) {
      triggerToast('error', `Username "${cleanUsername}" มีผู้ใช้งานแล้ว กรุณาเลือกชื่ออื่น`);
      return;
    }

    const nextIdNum = users.length > 0 ? Math.max(...users.map(u => {
      const match = u.id.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    })) + 1 : 1;

    const newUser: UserRecord = {
      id: `U-${String(nextIdNum).padStart(2, '0')}`,
      username: cleanUsername,
      password: newPassword || 'password123',
      name: newUserName.trim(),
      employeeId: newUserEmpId.trim() || undefined,
      email: newUserEmail.trim() ? newUserEmail.trim().toLowerCase() : undefined,
      role: newUserRole,
      department: newUserDept || 'IT Department',
      status: 'Active',
      permissions: newUserPermissions,
      lastLogin: 'เพิ่งสร้าง'
    };

    setUsers([newUser, ...users]);
    await saveUser(newUser);
    addLog(`สร้างบัญชีผู้ใช้งานใหม่: @${cleanUsername} (${newUserName}, สิทธิ์: ${newUserRole}) [ไม่ผูกกับอีเมล]`);

    setIsAddUserOpen(false);
    setNewUsername('');
    setNewPassword('password123');
    setNewUserName('');
    setNewUserEmpId('');
    setNewUserEmail('');
    triggerToast('success', `เพิ่มบัญชีผู้ใช้งาน @${cleanUsername} เรียบร้อยแล้ว (สามารถล็อกอินได้ทันที)`);
  };

  const handleUpdateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const updatedUser: UserRecord = {
      ...editingUser,
      password: editingPassword ? editingPassword : (editingUser.password || 'password123')
    };

    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    await saveUser(updatedUser);
    addLog(`แก้ไขข้อมูลและสิทธิ์ผู้ใช้งาน: @${updatedUser.username} (${updatedUser.name})`);

    setEditingUser(null);
    setEditingPassword('');
    triggerToast('success', `อัปเดตข้อมูลและสิทธิ์ของ @${updatedUser.username} สำเร็จ`);
  };

  const handleQuickPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser || !quickNewPassword) return;

    const updatedUser: UserRecord = {
      ...passwordModalUser,
      password: quickNewPassword
    };

    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    await saveUser(updatedUser);
    addLog(`รีเซ็ตรหัสผ่านของผู้ใช้งาน: @${updatedUser.username}`);

    setPasswordModalUser(null);
    setQuickNewPassword('password123');
    triggerToast('success', `ตั้งค่ารหัสผ่านใหม่สำหรับ @${updatedUser.username} เรียบร้อยแล้ว`);
  };

  const handleDeleteUser = async (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    setUsers(prev => prev.filter(u => u.id !== userId));
    await deleteUser(userId);
    addLog(`ลบผู้ใช้งานระบบ: @${targetUser.username} (${targetUser.name})`, 'WARNING');

    setUserToDelete(null);
    triggerToast('success', `ลบบัญชีผู้ใช้งาน @${targetUser.username} เรียบร้อยแล้ว`);
  };

  const handleToggleUserStatus = async (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const nextStatus = targetUser.status === 'Active' ? 'Suspended' : 'Active';
    const updatedUser = { ...targetUser, status: nextStatus };

    setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    await saveUser(updatedUser);
    addLog(`เปลี่ยนสถานะบัญชี @${targetUser.username} เป็น ${nextStatus}`);

    triggerToast(nextStatus === 'Active' ? 'success' : 'info', `เปลี่ยนสถานะ @${targetUser.username} เป็น ${nextStatus}`);
  };

  // ----------------------------------------------------
  // MASTER DATA HANDLERS
  // ----------------------------------------------------
  const updateAndSyncMasterData = async (newData: MasterDataState, actionDesc: string) => {
    setLocalMasterData(newData);
    if (onUpdateMasterData) {
      onUpdateMasterData(newData);
    }
    await saveMasterData(newData);
    addLog(`จัดการข้อมูลหลัก: ${actionDesc}`);
  };

  const handleOpenAddMaster = () => {
    setMCode('');
    setMNameTh('');
    setMNameEn('');
    setMDesc('');
    setMHeadName('');
    setMBuilding('');
    setMFloor('');
    setMContactPerson('');
    setMPhone('');
    setMEmail('');
    setMColor('#0058be');
    setMAllowAssign(true);
    setIsAddMasterOpen(true);
  };

  const handleOpenEditMaster = (item: any) => {
    setEditingMasterItem(item);
    setMCode(item.code || '');
    setMNameTh(item.nameTh || item.name || '');
    setMNameEn(item.nameEn || '');
    setMDesc(item.description || '');
    setMHeadName(item.headName || '');
    setMBuilding(item.building || '');
    setMFloor(item.floor || '');
    setMContactPerson(item.contactPerson || '');
    setMPhone(item.phone || '');
    setMEmail(item.email || '');
    setMColor(item.color || '#0058be');
    setMAllowAssign(item.allowAssign !== undefined ? item.allowAssign : true);
  };

  const handleSaveMasterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!editingMasterItem;
    const currentData = { ...localMasterData };

    if (masterSubTab === 'categories') {
      if (!mCode || !mNameTh) {
        triggerToast('error', 'กรุณากรอกรหัสและชื่อหมวดหมู่');
        return;
      }
      if (isEdit) {
        currentData.categories = currentData.categories.map(c => 
          c.id === editingMasterItem.id 
            ? { ...c, code: mCode.toUpperCase(), nameTh: mNameTh, nameEn: mNameEn, description: mDesc }
            : c
        );
        await updateAndSyncMasterData(currentData, `แก้ไขหมวดหมู่ ${mNameTh}`);
        triggerToast('success', `อัปเดตหมวดหมู่ "${mNameTh}" สำเร็จ`);
      } else {
        const newCat: MasterCategory = {
          id: `CAT-${Date.now()}`,
          code: mCode.toUpperCase(),
          nameTh: mNameTh,
          nameEn: mNameEn || mNameTh,
          icon: 'Laptop',
          description: mDesc,
          isActive: true
        };
        currentData.categories = [...currentData.categories, newCat];
        await updateAndSyncMasterData(currentData, `เพิ่มหมวดหมู่ใหม่ ${mNameTh}`);
        triggerToast('success', `เพิ่มหมวดหมู่ "${mNameTh}" เรียบร้อย`);
      }
    } else if (masterSubTab === 'departments') {
      if (!mCode || !mNameTh) {
        triggerToast('error', 'กรุณากรอกรหัสและชื่อแผนก');
        return;
      }
      if (isEdit) {
        currentData.departments = currentData.departments.map(d => 
          d.id === editingMasterItem.id 
            ? { ...d, code: mCode.toUpperCase(), name: mNameTh, headName: mHeadName }
            : d
        );
        await updateAndSyncMasterData(currentData, `แก้ไขแผนก ${mNameTh}`);
        triggerToast('success', `อัปเดตแผนก "${mNameTh}" สำเร็จ`);
      } else {
        const newDept: MasterDepartment = {
          id: `DEPT-${Date.now()}`,
          code: mCode.toUpperCase(),
          name: mNameTh,
          headName: mHeadName,
          isActive: true
        };
        currentData.departments = [...currentData.departments, newDept];
        await updateAndSyncMasterData(currentData, `เพิ่มแผนกใหม่ ${mNameTh}`);
        triggerToast('success', `เพิ่มแผนก "${mNameTh}" เรียบร้อย`);
      }
    } else if (masterSubTab === 'locations') {
      if (!mCode || !mNameTh) {
        triggerToast('error', 'กรุณากรอกรหัสและชื่อสถานที่');
        return;
      }
      if (isEdit) {
        currentData.locations = currentData.locations.map(l => 
          l.id === editingMasterItem.id 
            ? { ...l, code: mCode.toUpperCase(), name: mNameTh, building: mBuilding, floor: mFloor }
            : l
        );
        await updateAndSyncMasterData(currentData, `แก้ไขสถานที่ ${mNameTh}`);
        triggerToast('success', `อัปเดตสถานที่ "${mNameTh}" สำเร็จ`);
      } else {
        const newLoc: MasterLocation = {
          id: `LOC-${Date.now()}`,
          code: mCode.toUpperCase(),
          name: mNameTh,
          building: mBuilding || 'Headquarters',
          floor: mFloor || 'ชั้น 1',
          isActive: true
        };
        currentData.locations = [...currentData.locations, newLoc];
        await updateAndSyncMasterData(currentData, `เพิ่มสถานที่ใหม่ ${mNameTh}`);
        triggerToast('success', `เพิ่มสถานที่ "${mNameTh}" เรียบร้อย`);
      }
    } else if (masterSubTab === 'vendors') {
      if (!mCode || !mNameTh) {
        triggerToast('error', 'กรุณากรอกรหัสและชื่อคู่ค้า/ผู้จัดจำหน่าย');
        return;
      }
      if (isEdit) {
        currentData.vendors = currentData.vendors.map(v => 
          v.id === editingMasterItem.id 
            ? { ...v, code: mCode.toUpperCase(), name: mNameTh, contactPerson: mContactPerson, phone: mPhone, email: mEmail }
            : v
        );
        await updateAndSyncMasterData(currentData, `แก้ไขคู่ค้า ${mNameTh}`);
        triggerToast('success', `อัปเดตคู่ค้า "${mNameTh}" สำเร็จ`);
      } else {
        const newVen: MasterVendor = {
          id: `VEN-${Date.now()}`,
          code: mCode.toUpperCase(),
          name: mNameTh,
          contactPerson: mContactPerson,
          phone: mPhone,
          email: mEmail,
          isActive: true
        };
        currentData.vendors = [...currentData.vendors, newVen];
        await updateAndSyncMasterData(currentData, `เพิ่มคู่ค้าใหม่ ${mNameTh}`);
        triggerToast('success', `เพิ่มคู่ค้า "${mNameTh}" เรียบร้อย`);
      }
    } else if (masterSubTab === 'statuses') {
      if (!mCode || !mNameTh) {
        triggerToast('error', 'กรุณากรอกรหัสและชื่อสถานะ');
        return;
      }
      if (isEdit) {
        currentData.statuses = currentData.statuses.map(s => 
          s.id === editingMasterItem.id 
            ? { ...s, code: mCode, nameTh: mNameTh, nameEn: mNameEn, color: mColor, allowAssign: mAllowAssign }
            : s
        );
        await updateAndSyncMasterData(currentData, `แก้ไขสถานะครุภัณฑ์ ${mNameTh}`);
        triggerToast('success', `อัปเดตสถานะ "${mNameTh}" สำเร็จ`);
      } else {
        const newStat: MasterStatus = {
          id: `STAT-${Date.now()}`,
          code: mCode,
          nameTh: mNameTh,
          nameEn: mNameEn || mNameTh,
          color: mColor,
          allowAssign: mAllowAssign,
          isActive: true
        };
        currentData.statuses = [...currentData.statuses, newStat];
        await updateAndSyncMasterData(currentData, `เพิ่มสถานะครุภัณฑ์ใหม่ ${mNameTh}`);
        triggerToast('success', `เพิ่มสถานะ "${mNameTh}" เรียบร้อย`);
      }
    }

    setIsAddMasterOpen(false);
    setEditingMasterItem(null);
  };

  const handleDeleteMasterItem = async () => {
    if (!masterToDelete) return;
    const currentData = { ...localMasterData };

    if (masterSubTab === 'categories') {
      currentData.categories = currentData.categories.filter(c => c.id !== masterToDelete.id);
    } else if (masterSubTab === 'departments') {
      currentData.departments = currentData.departments.filter(d => d.id !== masterToDelete.id);
    } else if (masterSubTab === 'locations') {
      currentData.locations = currentData.locations.filter(l => l.id !== masterToDelete.id);
    } else if (masterSubTab === 'vendors') {
      currentData.vendors = currentData.vendors.filter(v => v.id !== masterToDelete.id);
    } else if (masterSubTab === 'statuses') {
      currentData.statuses = currentData.statuses.filter(s => s.id !== masterToDelete.id);
    }

    await updateAndSyncMasterData(currentData, `ลบรายการข้อมูลหลัก ${masterToDelete.nameTh || masterToDelete.name || masterToDelete.code}`);
    setMasterToDelete(null);
    triggerToast('success', 'ลบรายการข้อมูลหลักเรียบร้อยแล้ว');
  };

  const handleToggleMasterItemActive = async (itemId: string) => {
    const currentData = { ...localMasterData };
    let itemTitle = '';

    if (masterSubTab === 'categories') {
      currentData.categories = currentData.categories.map(c => {
        if (c.id === itemId) {
          itemTitle = c.nameTh;
          return { ...c, isActive: !c.isActive };
        }
        return c;
      });
    } else if (masterSubTab === 'departments') {
      currentData.departments = currentData.departments.map(d => {
        if (d.id === itemId) {
          itemTitle = d.name;
          return { ...d, isActive: !d.isActive };
        }
        return d;
      });
    } else if (masterSubTab === 'locations') {
      currentData.locations = currentData.locations.map(l => {
        if (l.id === itemId) {
          itemTitle = l.name;
          return { ...l, isActive: !l.isActive };
        }
        return l;
      });
    } else if (masterSubTab === 'vendors') {
      currentData.vendors = currentData.vendors.map(v => {
        if (v.id === itemId) {
          itemTitle = v.name;
          return { ...v, isActive: !v.isActive };
        }
        return v;
      });
    } else if (masterSubTab === 'statuses') {
      currentData.statuses = currentData.statuses.map(s => {
        if (s.id === itemId) {
          itemTitle = s.nameTh;
          return { ...s, isActive: !s.isActive };
        }
        return s;
      });
    }

    await updateAndSyncMasterData(currentData, `สลับสถานะเปิด/ปิดใช้งาน ${itemTitle}`);
    triggerToast('info', `ปรับสถานะการเปิดใช้งานของ "${itemTitle}" เรียบร้อย`);
  };

  const handleResetMasterDataConfirm = async () => {
    const defaultData = await resetMasterData();
    setLocalMasterData(defaultData);
    if (onUpdateMasterData) {
      onUpdateMasterData(defaultData);
    }
    addLog('คืนค่าเริ่มต้นข้อมูลหลักองค์กรทั้งหมด (Reset Master Data to Default)', 'WARNING');
    setShowResetMasterConfirm(false);
    triggerToast('success', 'คืนค่าเริ่มต้นข้อมูลหลักองค์กรทั้งหมดสำเร็จ');
  };

  // ----------------------------------------------------
  // SYSTEM UTILITIES
  // ----------------------------------------------------
  const handleOptimizeDB = () => {
    setIsOptimizing(true);
    triggerToast('info', 'กำลังสแกนสารบัญสำรอง ยุบข้อมูลแคช และจัดระเบียบ Master Data...');
    setTimeout(() => {
      setIsOptimizing(false);
      triggerToast('success', 'ปรับปรุงประสิทธิภาพฐานข้อมูลเสร็จสิ้น ขนาดลดลง 14.2%');
      addLog('สั่งรันคำสั่งบีบอัดและปรับปรุงประสิทธิภาพฐานข้อมูล (Database Shrink & Optimize)');
    }, 1200);
  };

  const handleDownloadBackup = () => {
    const fullBackup = {
      assets,
      masterData: localMasterData,
      users: users.map(u => ({ ...u, password: '***' })),
      exportedAt: new Date().toISOString()
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `AssetManager_MasterBackup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerToast('success', 'ส่งออกไฟล์สำรองทะเบียนฐานข้อมูลและ Master Data สำเร็จ');
  };

  // Filtered lists
  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.employeeId && u.employeeId.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  });

  const filteredLogs = logs.filter(l => {
    const q = logSearch.toLowerCase();
    return (
      l.user.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.status.toLowerCase().includes(q) ||
      l.ip.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#00236f] via-primary to-[#0058be] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold text-[10px] tracking-wider uppercase border border-white/20 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Security & Master Controls
            </span>
            <span className="text-white/60 text-xs font-mono">RBAC v2.4</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">ศูนย์ควบคุมสิทธิ์และข้อมูลหลัก (Administration & Master Data)</h2>
          <p className="text-white/80 text-xs max-w-2xl mt-1">
            จัดการบัญชีผู้ใช้งาน สิทธิ์การเข้าถึงแบบละเอียด (สอดคล้องกับหน้าล็อกอิน) และควบคุมโครงสร้างข้อมูลหลัก Master Data ขององค์กร
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleOptimizeDB}
            disabled={isOptimizing}
            className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all border border-white/10 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
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

      {/* Main Top Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setMainTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mainTab === 'users'
                ? 'bg-[#00236f] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>สิทธิ์และบัญชีผู้ใช้งาน ({users.length})</span>
          </button>

          <button
            onClick={() => setMainTab('masterData')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mainTab === 'masterData'
                ? 'bg-[#00236f] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>ข้อมูลหลัก Master Data</span>
          </button>

          <button
            onClick={() => setMainTab('logs')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mainTab === 'logs'
                ? 'bg-[#00236f] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>ประวัติการทำงาน Audit Logs ({logs.length})</span>
          </button>
        </div>

        {/* User Login Context Badge */}
        <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-500 hidden sm:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>เข้าสู่ระบบเป็น: <strong className="text-slate-800 font-bold">@{currentUser?.username || 'admin'}</strong></span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: USERS AND PERMISSIONS                                              */}
      {/* ========================================================================= */}
      {mainTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
          {/* Header & Add User Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-[#00236f]" />
                <span>บัญชีผู้ใช้งานระบบ (User Accounts)</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600 font-bold ml-1">{users.length} บัญชี</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">จัดการข้อมูลบัญชีผู้ใช้งาน สิทธิ์การเข้าถึง (RBAC) และรีเซ็ตรหัสผ่าน</p>
            </div>

            <button
              onClick={() => {
                setNewUsername('');
                setNewPassword('password123');
                setNewUserName('');
                setNewUserEmpId('');
                setNewUserEmail('');
                setNewUserRole('user');
                setNewUserDept(localMasterData.departments[0]?.name || 'IT Department');
                setNewUserPermissions({ ...DEFAULT_USER_PERMISSIONS });
                setIsAddUserOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#00236f] hover:bg-primary text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ เพิ่มผู้ใช้งานใหม่</span>
            </button>
          </div>
              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="ค้นหาตาม Username (@user), ชื่อ, รหัสพนักงาน, แผนก หรือสิทธิ์..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00236f]/20 focus:border-[#00236f]"
                  />
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4">ผู้ใช้งาน (Username & Name)</th>
                      <th className="py-3 px-4">บทบาท (Role) & แผนก</th>
                      <th className="py-3 px-4">สิทธิ์การเข้าถึง (Granular Permissions)</th>
                      <th className="py-3 px-4 text-center">สถานะ</th>
                      <th className="py-3 px-4 text-center">เข้าใช้ล่าสุด</th>
                      <th className="py-3 px-4 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => {
                      const perms = u.permissions || (u.role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_USER_PERMISSIONS);
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                                {u.username ? u.username.charAt(0).toUpperCase() : u.name.charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-800 text-xs">{u.name}</span>
                                  <span className="font-mono text-[10px] font-bold text-[#00236f] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
                                    @{u.username || 'user'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                  {u.employeeId && (
                                    <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-medium">
                                      {u.employeeId}
                                    </span>
                                  )}
                                  {u.email && <span className="truncate max-w-[140px]">{u.email}</span>}
                                  {!u.employeeId && !u.email && <span className="text-slate-400 text-[10px]">บัญชีภายในระบบ (Username Only)</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-md font-bold text-[10px] mb-1 ${
                              u.role === 'admin' 
                                ? 'bg-[#00236f] text-white' 
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {u.role === 'admin' ? 'Administrator' : 'IT Staff'}
                            </span>
                            <span className="text-[11px] text-slate-500 block font-medium">{u.department}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {perms.canManageUsers && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200" title="จัดการผู้ใช้">
                                  ผู้ใช้
                                </span>
                              )}
                              {perms.canManageMasterData && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200" title="จัดการข้อมูลหลัก">
                                  ข้อมูลหลัก
                                </span>
                              )}
                              {perms.canManageAssets && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200" title="จัดการครุภัณฑ์">
                                  ครุภัณฑ์
                                </span>
                              )}
                              {perms.canManageRepairs && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200" title="งานซ่อมบำรุง">
                                  งานซ่อม
                                </span>
                              )}
                              {perms.canExportReports && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200" title="ส่งออกรายงาน">
                                  รายงาน
                                </span>
                              )}
                              {perms.canConfigureSystem && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200" title="ตั้งค่าระบบ">
                                  ระบบ
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleToggleUserStatus(u.id)}
                              title="คลิกเพื่อสลับสถานะ"
                              className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] cursor-pointer transition-all ${
                                u.status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                              }`}
                            >
                              {u.status === 'Active' ? 'Active' : 'Suspended'}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-center text-slate-400 text-[11px] font-mono">
                            {u.lastLogin || 'ไม่เคยเข้าใช้'}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setPasswordModalUser(u);
                                  setQuickNewPassword('password123');
                                }}
                                title="ตั้งค่า/เปลี่ยนรหัสผ่าน"
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Key className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingUser(u);
                                  setEditingPassword('');
                                }}
                                title="แก้ไขข้อมูลและสิทธิ์"
                                className="p-1.5 text-slate-400 hover:text-[#00236f] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setUserToDelete(u)}
                                title="ลบบัญชีผู้ใช้"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MASTER DATA CONTROLS                                               */}
      {/* ========================================================================= */}
      {mainTab === 'masterData' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-6">
          {/* Master Data Sub Tabs Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setMasterSubTab('categories')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  masterSubTab === 'categories'
                    ? 'bg-[#00236f] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>หมวดหมู่ครุภัณฑ์ ({localMasterData.categories.length})</span>
              </button>

              <button
                onClick={() => setMasterSubTab('departments')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  masterSubTab === 'departments'
                    ? 'bg-[#00236f] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>แผนก / หน่วยงาน ({localMasterData.departments.length})</span>
              </button>

              <button
                onClick={() => setMasterSubTab('locations')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  masterSubTab === 'locations'
                    ? 'bg-[#00236f] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>สถานที่ / ห้องจัดเก็บ ({localMasterData.locations.length})</span>
              </button>

              <button
                onClick={() => setMasterSubTab('vendors')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  masterSubTab === 'vendors'
                    ? 'bg-[#00236f] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>ผู้จัดจำหน่าย / คู่ค้า ({localMasterData.vendors.length})</span>
              </button>

              <button
                onClick={() => setMasterSubTab('statuses')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  masterSubTab === 'statuses'
                    ? 'bg-[#00236f] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>สถานะครุภัณฑ์ ({localMasterData.statuses.length})</span>
              </button>
            </div>

            {/* Actions: Add New Item and Reset Master Data */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowResetMasterConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                title="คืนค่า Master Data สู่ชุดข้อมูลมาตรฐาน"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>คืนค่าเริ่มต้น</span>
              </button>

              <button
                onClick={handleOpenAddMaster}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#00236f] hover:bg-primary text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ เพิ่มรายการใหม่</span>
              </button>
            </div>
          </div>

          {/* Sub Tab: CATEGORIES */}
          {masterSubTab === 'categories' && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">รหัส (Code)</th>
                    <th className="py-3 px-4">ชื่อภาษาไทย</th>
                    <th className="py-3 px-4">ชื่อภาษาอังกฤษ</th>
                    <th className="py-3 px-4">คำอธิบาย</th>
                    <th className="py-3 px-4 text-center">จำนวนในระบบ</th>
                    <th className="py-3 px-4 text-center">สถานะ</th>
                    <th className="py-3 px-4 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {localMasterData.categories.map((cat) => {
                    const count = assets.filter(a => a.category?.toLowerCase() === cat.code.toLowerCase() || a.category === cat.nameTh.split(' ')[0]).length;
                    return (
                      <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#00236f]">{cat.code}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{cat.nameTh}</td>
                        <td className="py-3 px-4 text-slate-500">{cat.nameEn}</td>
                        <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{cat.description || '-'}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 bg-blue-50 text-[#00236f] rounded-full font-bold text-[10px]">
                            {count} รายการ
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleToggleMasterItemActive(cat.id)}
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] cursor-pointer ${
                              cat.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {cat.isActive ? 'Active' : 'Disabled'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditMaster(cat)}
                              className="p-1.5 text-slate-400 hover:text-[#00236f] hover:bg-blue-50 rounded-lg cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setMasterToDelete(cat)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Sub Tab: DEPARTMENTS */}
          {masterSubTab === 'departments' && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">รหัส (Code)</th>
                    <th className="py-3 px-4">ชื่อแผนก / ฝ่าย (Department)</th>
                    <th className="py-3 px-4">หัวหน้าแผนก / ผู้ดูแล</th>
                    <th className="py-3 px-4 text-center">จำนวนผู้ใช้งาน</th>
                    <th className="py-3 px-4 text-center">สถานะ</th>
                    <th className="py-3 px-4 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {localMasterData.departments.map((dept) => {
                    const userCount = users.filter(u => u.department === dept.name).length;
                    return (
                      <tr key={dept.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#00236f]">{dept.code}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{dept.name}</td>
                        <td className="py-3 px-4 text-slate-500">{dept.headName || '-'}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full font-bold text-[10px]">
                            {userCount} คน
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleToggleMasterItemActive(dept.id)}
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] cursor-pointer ${
                              dept.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {dept.isActive ? 'Active' : 'Disabled'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditMaster(dept)}
                              className="p-1.5 text-slate-400 hover:text-[#00236f] hover:bg-blue-50 rounded-lg cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setMasterToDelete(dept)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Sub Tab: LOCATIONS */}
          {masterSubTab === 'locations' && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">รหัสสถานที่</th>
                    <th className="py-3 px-4">ชื่อสถานที่ / ห้องจัดเก็บ</th>
                    <th className="py-3 px-4">อาคาร (Building)</th>
                    <th className="py-3 px-4">ชั้น (Floor)</th>
                    <th className="py-3 px-4 text-center">สถานะ</th>
                    <th className="py-3 px-4 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {localMasterData.locations.map((loc) => (
                    <tr key={loc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#00236f]">{loc.code}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{loc.name}</td>
                      <td className="py-3 px-4 text-slate-500">{loc.building}</td>
                      <td className="py-3 px-4 text-slate-500">{loc.floor}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleMasterItemActive(loc.id)}
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] cursor-pointer ${
                            loc.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {loc.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditMaster(loc)}
                            className="p-1.5 text-slate-400 hover:text-[#00236f] hover:bg-blue-50 rounded-lg cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setMasterToDelete(loc)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
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
          )}

          {/* Sub Tab: VENDORS */}
          {masterSubTab === 'vendors' && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">รหัสคู่ค้า</th>
                    <th className="py-3 px-4">ชื่อบริษัทผู้จัดจำหน่าย / คู่ค้า</th>
                    <th className="py-3 px-4">ผู้ติดต่อ</th>
                    <th className="py-3 px-4">เบอร์โทรศัพท์</th>
                    <th className="py-3 px-4">อีเมลติดต่อ</th>
                    <th className="py-3 px-4 text-center">สถานะ</th>
                    <th className="py-3 px-4 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {localMasterData.vendors.map((ven) => (
                    <tr key={ven.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#00236f]">{ven.code}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{ven.name}</td>
                      <td className="py-3 px-4 text-slate-600">{ven.contactPerson || '-'}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{ven.phone || '-'}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{ven.email || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleMasterItemActive(ven.id)}
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] cursor-pointer ${
                            ven.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {ven.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditMaster(ven)}
                            className="p-1.5 text-slate-400 hover:text-[#00236f] hover:bg-blue-50 rounded-lg cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setMasterToDelete(ven)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
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
          )}

          {/* Sub Tab: STATUSES */}
          {masterSubTab === 'statuses' && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">รหัสสถานะ (Code)</th>
                    <th className="py-3 px-4">ชื่อสถานะ (ไทย)</th>
                    <th className="py-3 px-4">ชื่อสถานะ (EN)</th>
                    <th className="py-3 px-4 text-center">ป้ายสี (Badge Preview)</th>
                    <th className="py-3 px-4 text-center">อนุญาตให้ส่งมอบ</th>
                    <th className="py-3 px-4 text-center">สถานะ</th>
                    <th className="py-3 px-4 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {localMasterData.statuses.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#00236f]">{st.code}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{st.nameTh}</td>
                      <td className="py-3 px-4 text-slate-500">{st.nameEn}</td>
                      <td className="py-3 px-4 text-center">
                        <span 
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-2xs"
                          style={{ backgroundColor: st.color }}
                        >
                          {st.nameTh}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {st.allowAssign ? (
                          <span className="text-emerald-600 font-bold text-[11px] flex items-center justify-center gap-1">
                            <Check className="w-3.5 h-3.5" /> ส่งมอบได้
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium text-[11px]">ไม่เปิดให้ส่งมอบ</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleMasterItemActive(st.id)}
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] cursor-pointer ${
                            st.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {st.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditMaster(st)}
                            className="p-1.5 text-slate-400 hover:text-[#00236f] hover:bg-blue-50 rounded-lg cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setMasterToDelete(st)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
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
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AUDIT & SECURITY LOGS                                              */}
      {/* ========================================================================= */}
      {mainTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">บันทึกประวัติการทำงานของระบบ (Audit & Security Trail)</h3>
              <p className="text-xs text-slate-400 mt-0.5">ตรวจสอบกิจกรรมความปลอดภัย การล็อกอิน และการแก้ไขข้อมูลย้อนหลัง</p>
            </div>
            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="ค้นหาบันทึก..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">เวลา (Timestamp)</th>
                  <th className="py-3 px-4">ผู้ใช้งาน (User Account)</th>
                  <th className="py-3 px-4">กิจกรรม / การดำเนินการ</th>
                  <th className="py-3 px-4 text-center">IP Address</th>
                  <th className="py-3 px-4 text-center">ผลลัพธ์ (Status)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                    <td className="py-3 px-4 font-bold text-[#00236f]">@{log.user}</td>
                    <td className="py-3 px-4 text-slate-700">{log.action}</td>
                    <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-400">{log.ip}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        log.status === 'WARNING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD USER WITH GRANULAR PERMISSIONS                                 */}
      {/* ========================================================================= */}
      {isAddUserOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[1000] flex items-center justify-center p-4">
          <form 
            onSubmit={handleAddUserSubmit}
            className="bg-white w-full max-w-lg rounded-2xl border border-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
          >
            <div className="p-4 bg-[#00236f] text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                <h4 className="font-bold text-sm">เพิ่มบัญชีผู้ใช้งานใหม่ (สร้างสิทธิ์ล็อกอิน)</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUserOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Credentials Section */}
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 space-y-3">
                <span className="text-[10px] font-bold text-[#00236f] uppercase tracking-wider block">
                  ข้อมูลการเข้าสู่ระบบ (Login Credentials)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Username <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">@</span>
                      <input
                        type="text"
                        required
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="เช่น somchai.k"
                        className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#00236f]"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Password <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setNewPassword(generateRandomPassword())}
                        className="text-[10px] text-primary hover:underline font-bold cursor-pointer"
                      >
                        สุ่มรหัสผ่าน
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showAddPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="รหัสผ่าน"
                        className="w-full pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#00236f]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAddPassword(!showAddPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showAddPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    ชื่อ-นามสกุล พนักงาน <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="เช่น คุณสมชาย หมายมั่น"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#00236f]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">รหัสพนักงาน (Employee ID)</label>
                  <input
                    type="text"
                    value={newUserEmpId}
                    onChange={(e) => setNewUserEmpId(e.target.value)}
                    placeholder="เช่น EMP-1049"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-[#00236f]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">สังกัดแผนก (Master Data)</label>
                  <select
                    value={newUserDept}
                    onChange={(e) => setNewUserDept(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
                  >
                    {localMasterData.departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">บทบาทหลัก (Preset Role)</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => handleRoleChangeForNewUser(e.target.value as 'admin' | 'user')}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="user">IT Staff (เจ้าหน้าที่ปฏิบัติการ)</option>
                    <option value="admin">Administrator (ผู้ดูแลระบบสูงสุด)</option>
                  </select>
                </div>
              </div>

              {/* Granular Permissions Matrix */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">สิทธิ์การเข้าถึงแบบละเอียด (Permissions Matrix)</span>
                  <span className="text-[10px] text-slate-400">ปรับแต่งได้อิสระ</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200/70 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={newUserPermissions.canManageUsers}
                      onChange={(e) => setNewUserPermissions({ ...newUserPermissions, canManageUsers: e.target.checked })}
                      className="w-4 h-4 rounded text-[#00236f] focus:ring-[#00236f]"
                    />
                    <span className="font-semibold text-slate-700 text-[11px]">จัดการผู้ใช้และรหัสผ่าน</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200/70 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={newUserPermissions.canManageMasterData}
                      onChange={(e) => setNewUserPermissions({ ...newUserPermissions, canManageMasterData: e.target.checked })}
                      className="w-4 h-4 rounded text-[#00236f] focus:ring-[#00236f]"
                    />
                    <span className="font-semibold text-slate-700 text-[11px]">จัดการ Master Data</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200/70 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={newUserPermissions.canManageAssets}
                      onChange={(e) => setNewUserPermissions({ ...newUserPermissions, canManageAssets: e.target.checked })}
                      className="w-4 h-4 rounded text-[#00236f] focus:ring-[#00236f]"
                    />
                    <span className="font-semibold text-slate-700 text-[11px]">เพิ่ม/แก้ไข/ลบ ครุภัณฑ์</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200/70 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={newUserPermissions.canManageRepairs}
                      onChange={(e) => setNewUserPermissions({ ...newUserPermissions, canManageRepairs: e.target.checked })}
                      className="w-4 h-4 rounded text-[#00236f] focus:ring-[#00236f]"
                    />
                    <span className="font-semibold text-slate-700 text-[11px]">จัดการใบแจ้งซ่อม</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200/70 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={newUserPermissions.canExportReports}
                      onChange={(e) => setNewUserPermissions({ ...newUserPermissions, canExportReports: e.target.checked })}
                      className="w-4 h-4 rounded text-[#00236f] focus:ring-[#00236f]"
                    />
                    <span className="font-semibold text-slate-700 text-[11px]">ส่งออกรายงานสถิติ</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200/70 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={newUserPermissions.canConfigureSystem}
                      onChange={(e) => setNewUserPermissions({ ...newUserPermissions, canConfigureSystem: e.target.checked })}
                      className="w-4 h-4 rounded text-[#00236f] focus:ring-[#00236f]"
                    />
                    <span className="font-semibold text-slate-700 text-[11px]">ตั้งค่าระบบและ Backup</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setIsAddUserOpen(false)}
                className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#00236f] hover:bg-primary text-white font-bold rounded-xl cursor-pointer shadow-xs"
              >
                บันทึกบัญชีผู้ใช้
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT USER & PERMISSIONS                                            */}
      {/* ========================================================================= */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[1000] flex items-center justify-center p-4">
          <form 
            onSubmit={handleUpdateUserSubmit}
            className="bg-white w-full max-w-lg rounded-2xl border border-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
          >
            <div className="p-4 bg-[#00236f] text-white flex justify-between items-center shrink-0">
              <h4 className="font-bold text-sm">ตั้งค่าสิทธิ์และแก้ไขข้อมูลผู้ใช้งาน: @{editingUser.username}</h4>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Account Info Header */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-200 px-1.5 py-0.5 rounded">ID: {editingUser.id}</span>
                  <p className="text-xs font-bold text-slate-800 mt-1">ผู้ใช้: @{editingUser.username}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextSt = editingUser.status === 'Active' ? 'Suspended' : 'Active';
                    setEditingUser({ ...editingUser, status: nextSt });
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    editingUser.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  สถานะ: {editingUser.status}
                </button>
              </div>

              {/* Password Change / Reset */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    เปลี่ยนรหัสผ่าน (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditingPassword(generateRandomPassword())}
                    className="text-[10px] text-primary hover:underline font-bold"
                  >
                    สุ่มรหัสผ่าน
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    value={editingPassword}
                    onChange={(e) => setEditingPassword(e.target.value)}
                    placeholder="ป้อนรหัสผ่านใหม่ (เช่น password123)"
                    className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#00236f]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Name & Employee ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">รหัสพนักงาน (Employee ID)</label>
                  <input
                    type="text"
                    value={editingUser.employeeId || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, employeeId: e.target.value })}
                    placeholder="เช่น EMP-1049"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Department & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">แผนกสังกัด</label>
                  <select
                    value={editingUser.department}
                    onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
                  >
                    {localMasterData.departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">บทบาทหลัก (Role)</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => {
                      const newRole = e.target.value as 'admin' | 'user';
                      const perms = newRole === 'admin' ? { ...DEFAULT_ADMIN_PERMISSIONS } : { ...DEFAULT_USER_PERMISSIONS };
                      setEditingUser({ ...editingUser, role: newRole, permissions: perms });
                    }}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="user">IT Staff (เจ้าหน้าที่)</option>
                    <option value="admin">Administrator (ผู้ดูแลระบบ)</option>
                  </select>
                </div>
              </div>

              {/* Granular Permissions Matrix */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-2.5">
                <span className="text-[11px] font-bold text-slate-700 block">สิทธิ์การเข้าถึงแบบละเอียด</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {Object.entries({
                    canManageUsers: 'จัดการผู้ใช้และรหัสผ่าน',
                    canManageMasterData: 'จัดการ Master Data',
                    canManageAssets: 'เพิ่ม/แก้ไข/ลบ ครุภัณฑ์',
                    canManageRepairs: 'จัดการใบแจ้งซ่อม',
                    canExportReports: 'ส่งออกรายงานสถิติ',
                    canConfigureSystem: 'ตั้งค่าระบบและ Backup'
                  }).map(([key, label]) => {
                    const currentPerms = editingUser.permissions || (editingUser.role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_USER_PERMISSIONS);
                    const isChecked = !!(currentPerms as any)[key];
                    return (
                      <label key={key} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200/70 cursor-pointer hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            setEditingUser({
                              ...editingUser,
                              permissions: {
                                ...currentPerms,
                                [key]: e.target.checked
                              }
                            });
                          }}
                          className="w-4 h-4 rounded text-[#00236f]"
                        />
                        <span className="font-semibold text-slate-700 text-[11px]">{label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#00236f] hover:bg-primary text-white font-bold rounded-xl cursor-pointer shadow-xs"
              >
                บันทึกการแก้ไข
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: QUICK PASSWORD CHANGE / RESET                                      */}
      {/* ========================================================================= */}
      {passwordModalUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[1000] flex items-center justify-center p-4">
          <form 
            onSubmit={handleQuickPasswordSubmit}
            className="bg-white w-full max-w-sm rounded-2xl border border-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
          >
            <div className="p-4 bg-[#00236f] text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                <h4 className="font-bold text-sm">รีเซ็ตรหัสผ่าน @{passwordModalUser.username}</h4>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalUser(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                กำหนดรหัสผ่านใหม่สำหรับผู้ใช้งาน <strong>{passwordModalUser.name}</strong> (@{passwordModalUser.username}) เพื่อใช้ในการเข้าสู่ระบบหน้าล็อกอิน:
              </p>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-700">รหัสผ่านใหม่ (Password)</label>
                  <button
                    type="button"
                    onClick={() => setQuickNewPassword(generateRandomPassword())}
                    className="text-[10px] text-primary hover:underline font-bold"
                  >
                    สุ่มรหัสผ่าน
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={quickNewPassword}
                  onChange={(e) => setQuickNewPassword(e.target.value)}
                  placeholder="เช่น password123"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-[#00236f]"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPasswordModalUser(null)}
                className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#00236f] hover:bg-primary text-white font-bold rounded-xl cursor-pointer"
              >
                บันทึกรหัสผ่านใหม่
              </button>
            </div>
          </form>
        </div>
      )}





      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT MASTER DATA ITEM                                        */}
      {/* ========================================================================= */}
      {(isAddMasterOpen || editingMasterItem) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[1000] flex items-center justify-center p-4">
          <form 
            onSubmit={handleSaveMasterSubmit}
            className="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
          >
            <div className="p-4 bg-[#00236f] text-white flex justify-between items-center">
              <h4 className="font-bold text-sm">
                {editingMasterItem ? 'แก้ไขข้อมูลหลัก' : 'เพิ่มข้อมูลหลักใหม่'}: {
                  masterSubTab === 'categories' ? 'หมวดหมู่ครุภัณฑ์' :
                  masterSubTab === 'departments' ? 'แผนก/หน่วยงาน' :
                  masterSubTab === 'locations' ? 'สถานที่/ห้องจัดเก็บ' :
                  masterSubTab === 'vendors' ? 'ผู้จัดจำหน่าย/คู่ค้า' : 'สถานะครุภัณฑ์'
                }
              </h4>
              <button
                type="button"
                onClick={() => {
                  setIsAddMasterOpen(false);
                  setEditingMasterItem(null);
                }}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  รหัสอ้างอิง (Code) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={mCode}
                  onChange={(e) => setMCode(e.target.value)}
                  placeholder="เช่น NOTEBOOK, IT-DEV, LOC-01"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  ชื่อภาษาไทย (Name TH) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={mNameTh}
                  onChange={(e) => setMNameTh(e.target.value)}
                  placeholder="ชื่อภาษาไทย"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
                />
              </div>

              {(masterSubTab === 'categories' || masterSubTab === 'statuses') && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    ชื่อภาษาอังกฤษ (Name EN)
                  </label>
                  <input
                    type="text"
                    value={mNameEn}
                    onChange={(e) => setMNameEn(e.target.value)}
                    placeholder="English Name"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
                  />
                </div>
              )}

              {masterSubTab === 'categories' && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">คำอธิบาย</label>
                  <textarea
                    value={mDesc}
                    onChange={(e) => setMDesc(e.target.value)}
                    placeholder="รายละเอียดหมวดหมู่..."
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
                  />
                </div>
              )}

              {masterSubTab === 'departments' && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">หัวหน้าแผนก / ผู้รับผิดชอบ</label>
                  <input
                    type="text"
                    value={mHeadName}
                    onChange={(e) => setMHeadName(e.target.value)}
                    placeholder="เช่น คุณสมชาย หมายมั่น"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
                  />
                </div>
              )}

              {masterSubTab === 'locations' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">อาคาร (Building)</label>
                    <input
                      type="text"
                      value={mBuilding}
                      onChange={(e) => setMBuilding(e.target.value)}
                      placeholder="เช่น HQ อาคาร A"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">ชั้น (Floor)</label>
                    <input
                      type="text"
                      value={mFloor}
                      onChange={(e) => setMFloor(e.target.value)}
                      placeholder="เช่น ชั้น 2"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {masterSubTab === 'vendors' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">ผู้ติดต่อ (Contact Person)</label>
                    <input
                      type="text"
                      value={mContactPerson}
                      onChange={(e) => setMContactPerson(e.target.value)}
                      placeholder="เช่น ฝ่ายบริการลูกค้าองค์กร"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">เบอร์โทรศัพท์</label>
                      <input
                        type="text"
                        value={mPhone}
                        onChange={(e) => setMPhone(e.target.value)}
                        placeholder="02-xxx-xxxx"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">อีเมล</label>
                      <input
                        type="email"
                        value={mEmail}
                        onChange={(e) => setMEmail(e.target.value)}
                        placeholder="support@vendor.com"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {masterSubTab === 'statuses' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">สีป้ายสถานะ (Badge Color)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={mColor}
                        onChange={(e) => setMColor(e.target.value)}
                        className="w-10 h-10 p-1 rounded-lg border border-slate-200 cursor-pointer"
                      />
                      <span 
                        className="px-3 py-1 rounded-full text-white text-xs font-bold"
                        style={{ backgroundColor: mColor }}
                      >
                        ตัวอย่างป้าย: {mNameTh || 'สถานะ'}
                      </span>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mAllowAssign}
                      onChange={(e) => setMAllowAssign(e.target.checked)}
                      className="w-4 h-4 rounded text-[#00236f]"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">อนุญาตให้ส่งมอบแก่พนักงาน (Allow Assign)</span>
                      <span className="text-[10px] text-slate-400">เมื่อครุภัณฑ์มีสถานะนี้ พนักงานสามารถถือครองใช้งานได้</span>
                    </div>
                  </label>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsAddMasterOpen(false);
                  setEditingMasterItem(null);
                }}
                className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#00236f] hover:bg-primary text-white font-bold rounded-xl cursor-pointer"
              >
                บันทึกรายการ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM DELETE USER MODAL                                                 */}
      {/* ========================================================================= */}
      {userToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[1000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-slate-100 shadow-2xl p-6 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">ยืนยันการลบบัญชีผู้ใช้งาน</h4>
            <p className="text-xs text-slate-500 mb-6">
              คุณต้องการลบบัญชี <strong>@{userToDelete.username}</strong> ({userToDelete.name}) ออกจากระบบอย่างถาวรหรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้
            </p>
            <div className="flex justify-center gap-3 text-xs">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleDeleteUser(userToDelete.id)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl cursor-pointer"
              >
                ยืนยันลบผู้ใช้
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM DELETE MASTER DATA ITEM MODAL                                     */}
      {/* ========================================================================= */}
      {masterToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[1000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-slate-100 shadow-2xl p-6 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">ยืนยันการลบรายการข้อมูลหลัก</h4>
            <p className="text-xs text-slate-500 mb-6">
              คุณต้องการลบ <strong>{masterToDelete.nameTh || masterToDelete.name || masterToDelete.code}</strong> ออกจากระบบ Master Data หรือไม่?
            </p>
            <div className="flex justify-center gap-3 text-xs">
              <button
                onClick={() => setMasterToDelete(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDeleteMasterItem}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl cursor-pointer"
              >
                ยืนยันลบรายการ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM RESET MASTER DATA MODAL                                           */}
      {/* ========================================================================= */}
      {showResetMasterConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[1000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-slate-100 shadow-2xl p-6 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">คืนค่าเริ่มต้นข้อมูลหลัก (Reset Master Data)</h4>
            <p className="text-xs text-slate-500 mb-6">
              คุณต้องการคืนค่า Master Data ทั้งหมด (หมวดหมู่, แผนก, สถานที่, คู่ค้า, สถานะ) กลับสู่ค่าเริ่มต้นมาตรฐานของระบบหรือไม่?
            </p>
            <div className="flex justify-center gap-3 text-xs">
              <button
                onClick={() => setShowResetMasterConfirm(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleResetMasterDataConfirm}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer"
              >
                ยืนยันคืนค่าเริ่มต้น
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
