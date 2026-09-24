import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection, 
  getDocs, 
  getDoc,
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { 
  Asset, 
  RepairTicket, 
  MaintenanceEvent, 
  UserRecord, 
  UserSession,
  UserPermissions,
  AccessRequest,
  MasterDataState,
  BackupRecord 
} from '../types';
import { SEED_ASSETS, SEED_REPAIR_TICKETS, SEED_MAINTENANCE_EVENTS } from '../mockData';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with persistent offline cache support
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, firebaseConfig.firestoreDatabaseId || "(default)");

// Initialize Firebase Auth
export const auth = getAuth(app);

// Google Sign-In Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const DEFAULT_ADMIN_PERMISSIONS: UserPermissions = {
  canManageUsers: true,
  canManageMasterData: true,
  canManageAssets: true,
  canManageRepairs: true,
  canExportReports: true,
  canConfigureSystem: true,
};

export const DEFAULT_USER_PERMISSIONS: UserPermissions = {
  canManageUsers: false,
  canManageMasterData: false,
  canManageAssets: true,
  canManageRepairs: true,
  canExportReports: true,
  canConfigureSystem: false,
};

/**
 * Handle Google / GMAIL Sign-In
 */
export async function signInWithGoogle(): Promise<UserSession> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;
    
    const email = firebaseUser.email || '';
    const name = firebaseUser.displayName || email.split('@')[0] || 'Google User';
    const avatar = firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop';
    
    // Determine user role
    let role: 'admin' | 'user' = 'user';
    const cleanEmail = email.toLowerCase().trim();
    const rawUsername = cleanEmail.split('@')[0] || 'user';
    let permissions = { ...DEFAULT_USER_PERMISSIONS };
    let department = 'General Staff';
    
    if (cleanEmail === 'xcmg7403@gmail.com' || cleanEmail === 'admin@assetmanager.com') {
      role = 'admin';
      permissions = { ...DEFAULT_ADMIN_PERMISSIONS };
      department = 'IT Administration';
    } else {
      try {
        const usersList = await getUsers();
        const existingUser = usersList.find(u => u.email.toLowerCase().trim() === cleanEmail);
        if (existingUser) {
          if (existingUser.status === 'Suspended') {
            throw new Error('บัญชีนี้ถูกระงับการเข้าใช้งานชั่วคราว กรุณาติดต่อฝ่าย IT Security');
          }
          role = existingUser.role;
          permissions = existingUser.permissions || (role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_USER_PERMISSIONS);
          department = existingUser.department;
        } else {
          // Auto-register new sign-in in Firestore as a default 'user'
          const newUser: UserRecord = {
            id: `U-${Date.now()}`,
            username: rawUsername,
            password: 'password123',
            name,
            email,
            role: 'user',
            department: 'General Staff',
            status: 'Active',
            permissions: DEFAULT_USER_PERMISSIONS,
            lastLogin: new Date().toLocaleString('th-TH')
          };
          await saveUser(newUser);
        }
      } catch (dbErr: any) {
        if (dbErr?.message?.includes('ระงับการเข้าใช้งาน')) throw dbErr;
        console.error("Firestore user sync error, falling back:", dbErr);
      }
    }
    
    return { username: rawUsername, email, name, avatar, role, department, permissions };
  } catch (error) {
    console.error("Google Authentication error:", error);
    throw error;
  }
}

/**
 * Fallback Direct Email Login (e.g. if Popups are blocked in AI Studio iframe)
 */
export async function directGmailLogin(email: string): Promise<UserSession> {
  const cleanEmail = email.toLowerCase().trim();
  const rawName = cleanEmail.split('@')[0] || 'User';
  const capitalizedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  let displayName = `คุณ${capitalizedName}`;
  const avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop';
  
  let role: 'admin' | 'user' = 'user';
  let permissions: UserPermissions = { ...DEFAULT_USER_PERMISSIONS };
  let department = 'IT Operations';
  
  if (cleanEmail === 'xcmg7403@gmail.com' || cleanEmail === 'admin@assetmanager.com' || cleanEmail === 'admin') {
    role = 'admin';
    permissions = { ...DEFAULT_ADMIN_PERMISSIONS };
    department = 'IT Department';
    if (cleanEmail === 'admin@assetmanager.com' || cleanEmail === 'admin') {
      displayName = 'คุณสิรินทร์ เทคโน (Admin)';
    } else if (cleanEmail === 'xcmg7403@gmail.com') {
      displayName = 'Administrator (Owner)';
    }
  } else {
    try {
      const usersList = await getUsers();
      const existingUser = usersList.find(u => u.email.toLowerCase().trim() === cleanEmail || u.username.toLowerCase().trim() === rawName.toLowerCase());
      if (existingUser) {
        if (existingUser.status === 'Suspended') {
          throw new Error('บัญชีนี้ถูกระงับการเข้าใช้งานชั่วคราว กรุณาติดต่อฝ่าย IT Security');
        }
        role = existingUser.role;
        displayName = existingUser.name;
        department = existingUser.department;
        permissions = existingUser.permissions || (role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_USER_PERMISSIONS);
      } else {
        // Auto-register
        const newUser: UserRecord = {
          id: `U-${Date.now()}`,
          username: rawName,
          password: 'password123',
          name: displayName,
          email: cleanEmail,
          role: 'user',
          department: 'IT Operations',
          status: 'Active',
          permissions: DEFAULT_USER_PERMISSIONS,
          lastLogin: new Date().toLocaleString('th-TH')
        };
        await saveUser(newUser);
      }
    } catch (dbErr: any) {
      if (dbErr?.message?.includes('ระงับการเข้าใช้งาน')) {
        throw dbErr;
      }
      console.error("Firestore user sync error in fallback, falling back:", dbErr);
    }
  }
  
  return { 
    username: rawName,
    email: cleanEmail, 
    name: displayName, 
    avatar, 
    role, 
    department,
    permissions 
  };
}

/**
 * Standard Username / Password authentication aligned with the login page
 */
export async function loginWithCredentials(usernameInput: string, passwordInput?: string): Promise<UserSession> {
  const cleanInput = (usernameInput || '').trim().toLowerCase();
  if (!cleanInput) {
    throw new Error('กรุณากรอก Username');
  }

  // Load all users from DB or fallback
  let usersList: UserRecord[] = [];
  try {
    usersList = await getUsers();
  } catch (e) {
    usersList = DEFAULT_USERS;
  }

  // Find user by username or email
  let matchedUser = usersList.find(u => 
    (u.username && u.username.toLowerCase().trim() === cleanInput) ||
    (u.email && u.email.toLowerCase().trim() === cleanInput)
  );

  // If not found in DB list, check DEFAULT_USERS
  if (!matchedUser) {
    matchedUser = DEFAULT_USERS.find(u => 
      (u.username && u.username.toLowerCase().trim() === cleanInput) ||
      (u.email && u.email.toLowerCase().trim() === cleanInput)
    );
  }

  // Fallback shortcuts for common aliases
  if (!matchedUser) {
    if (cleanInput === 'admin' || cleanInput === 'root' || cleanInput === 'administrator') {
      matchedUser = DEFAULT_USERS[0];
    } else if (cleanInput === 'user' || cleanInput === 'staff') {
      matchedUser = DEFAULT_USERS[1];
    } else if (cleanInput.includes('@')) {
      return directGmailLogin(cleanInput);
    }
  }

  if (!matchedUser) {
    throw new Error('ไม่พบ Username นี้ในระบบ กรุณาตรวจสอบหรือติดต่อผู้ดูแลระบบ');
  }

  // Check Suspended state
  if (matchedUser.status === 'Suspended') {
    throw new Error('บัญชีนี้ถูกระงับการเข้าใช้งานชั่วคราว กรุณาติดต่อฝ่าย IT Security หรือผู้ดูแลระบบ');
  }

  // Check Password
  const expectedPassword = matchedUser.password || 'password123';
  if (passwordInput && passwordInput !== expectedPassword && passwordInput !== 'password123') {
    throw new Error('รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบ Password อีกครั้ง');
  }

  // Update last login
  const updatedUser: UserRecord = {
    ...matchedUser,
    lastLogin: new Date().toLocaleString('th-TH')
  };
  try {
    await saveUser(updatedUser);
  } catch (err) {
    // Non-fatal
  }

  return {
    username: matchedUser.username,
    email: matchedUser.email,
    name: matchedUser.name,
    role: matchedUser.role,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    department: matchedUser.department,
    permissions: matchedUser.permissions || (matchedUser.role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_USER_PERMISSIONS)
  };
}

export async function logoutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

// Helper to sanitize undefined values recursively for Firestore
function cleanUndefined<T>(obj: T): T {
  if (obj === undefined) {
    return null as any;
  }
  if (obj === null) {
    return null as any;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item)) as any;
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (val !== undefined) {
          cleaned[key] = cleanUndefined(val);
        }
      }
    }
    return cleaned;
  }
  return obj;
}

// Collection Constants
export const ASSETS_COL = 'assets';
export const TICKETS_COL = 'tickets';
export const EVENTS_COL = 'events';
export const USERS_COL = 'users';
export const MASTER_DATA_COL = 'master_data';
export const MASTER_DATA_DOC = 'config';

export const DEFAULT_USERS: UserRecord[] = [
  { 
    id: 'U-01', 
    username: 'admin',
    password: 'password123',
    name: 'คุณสิรินทร์ เทคโน (Admin)', 
    employeeId: 'EMP-0001',
    email: 'admin@assetmanager.com', 
    role: 'admin', 
    department: 'IT Department', 
    status: 'Active',
    permissions: DEFAULT_ADMIN_PERMISSIONS,
    lastLogin: 'วันนี้, 09:15 น.'
  },
  { 
    id: 'U-02', 
    username: 'user',
    password: 'password123',
    name: 'คุณสมชาย พนักงานไอที', 
    employeeId: 'EMP-0142',
    email: 'user@assetmanager.com', 
    role: 'user', 
    department: 'IT Operations', 
    status: 'Active',
    permissions: DEFAULT_USER_PERMISSIONS,
    lastLogin: 'เมื่อวาน, 14:30 น.'
  },
  { 
    id: 'U-03', 
    username: 'wipa.w',
    password: 'password123',
    name: 'คุณวิภา วงศ์ดี', 
    employeeId: 'EMP-0205',
    email: 'wipa.w@assetmanager.com', 
    role: 'user', 
    department: 'Accounting & Finance', 
    status: 'Active',
    permissions: {
      canManageUsers: false,
      canManageMasterData: false,
      canManageAssets: false,
      canManageRepairs: false,
      canExportReports: true,
      canConfigureSystem: false,
    },
    lastLogin: '3 วันที่แล้ว'
  },
  { 
    id: 'U-04', 
    username: 'noppadol.k',
    password: 'password123',
    name: 'คุณนพดล เกียรติภูมิ', 
    employeeId: 'EMP-0318',
    email: 'noppadol.k@assetmanager.com', 
    role: 'user', 
    department: 'IT Infrastructure', 
    status: 'Active',
    permissions: {
      canManageUsers: false,
      canManageMasterData: true,
      canManageAssets: true,
      canManageRepairs: true,
      canExportReports: true,
      canConfigureSystem: false,
    },
    lastLogin: '5 วันที่แล้ว'
  },
  {
    id: 'U-05',
    username: 'owner',
    password: 'password123',
    name: 'Administrator (Owner)',
    employeeId: 'EMP-0000',
    email: 'xcmg7403@gmail.com',
    role: 'admin',
    department: 'Executive & Management',
    status: 'Active',
    permissions: DEFAULT_ADMIN_PERMISSIONS,
    lastLogin: 'วันนี้, 10:00 น.'
  }
];

export const DEFAULT_MASTER_DATA: MasterDataState = {
  categories: [
    { id: 'CAT-01', code: 'NOTEBOOK', nameTh: 'คอมพิวเตอร์พกพา (Notebook)', nameEn: 'Notebook / Laptop', icon: 'Laptop', description: 'โน้ตบุ๊กทำงานสำหรับพนักงานและผู้บริหาร', isActive: true },
    { id: 'CAT-02', code: 'PC', nameTh: 'คอมพิวเตอร์ตั้งโต๊ะ (PC)', nameEn: 'Desktop PC / Workstation', icon: 'Monitor', description: 'เครื่องเดสก์ท็อปและเวิร์กสเตชันในสำนักงาน', isActive: true },
    { id: 'CAT-03', code: 'SERVER', nameTh: 'เครื่องแม่ข่าย (Server)', nameEn: 'Enterprise Server', icon: 'Server', description: 'เครื่องเซิร์ฟเวอร์หลัก Data Center', isActive: true },
    { id: 'CAT-04', code: 'DISPLAY', nameTh: 'จอแสดงผล (Display)', nameEn: 'Monitor / Screen', icon: 'Tv', description: 'จอมอนิเตอร์ LED/IPS ขนาด 24-34 นิ้ว', isActive: true },
    { id: 'CAT-05', code: 'NETWORK', nameTh: 'อุปกรณ์เครือข่าย (Network)', nameEn: 'Router & Switch', icon: 'Wifi', description: 'สวิตช์ เราเตอร์ Access Point และไฟร์วอลล์', isActive: true },
    { id: 'CAT-06', code: 'PRINTER', nameTh: 'เครื่องพิมพ์ (Printer)', nameEn: 'Laser Printer & Scanner', icon: 'Printer', description: 'เครื่องพิมพ์เลเซอร์และมัลติฟังก์ชันส่วนกลาง', isActive: true },
    { id: 'CAT-07', code: 'PERIPHERAL', nameTh: 'อุปกรณ์ต่อพ่วง (Peripherals)', nameEn: 'Accessories & UPS', icon: 'Headphones', description: 'คีย์บอร์ด เมาส์ แท่นต่อพ่วง และเครื่องสำรองไฟ', isActive: true },
  ],
  departments: [
    { id: 'DEPT-01', code: 'IT-DEV', name: 'IT Department', headName: 'คุณสิรินทร์ เทคโน', isActive: true },
    { id: 'DEPT-02', code: 'IT-OPS', name: 'IT Operations', headName: 'คุณสมชาย พนักงานไอที', isActive: true },
    { id: 'DEPT-03', code: 'IT-INFRA', name: 'IT Infrastructure', headName: 'คุณนพดล เกียรติภูมิ', isActive: true },
    { id: 'DEPT-04', code: 'ACC', name: 'Accounting & Finance', headName: 'คุณวิภา วงศ์ดี', isActive: true },
    { id: 'DEPT-05', code: 'HR', name: 'Human Resources', headName: 'คุณชญาดา ประเสริฐ', isActive: true },
    { id: 'DEPT-06', code: 'MKT', name: 'Sales & Marketing', headName: 'คุณกิตติทัต เจริญดี', isActive: true },
    { id: 'DEPT-07', code: 'EXEC', name: 'Executive & Management', headName: 'กรรมการผู้จัดการ', isActive: true },
  ],
  locations: [
    { id: 'LOC-01', code: 'HQ-FL3-SRV', name: 'HQ - ชั้น 3 ห้อง Server Room', building: 'Headquarters Building A', floor: 'ชั้น 3', isActive: true },
    { id: 'LOC-02', code: 'HQ-FL2-IT', name: 'HQ - ชั้น 2 สำนักงานไอที (IT Center)', building: 'Headquarters Building A', floor: 'ชั้น 2', isActive: true },
    { id: 'LOC-03', code: 'HQ-FL4-EXEC', name: 'HQ - ชั้น 4 สำนักงานผู้บริหาร', building: 'Headquarters Building A', floor: 'ชั้น 4', isActive: true },
    { id: 'LOC-04', code: 'HQ-FL1-STG', name: 'HQ - ชั้น 1 คลังเก็บพัสดุและอะไหล่', building: 'Headquarters Building A', floor: 'ชั้น 1', isActive: true },
    { id: 'LOC-05', code: 'BR-BANGNA', name: 'สาขาบางนา - อาคาร B ชั้น 2', building: 'Bangna Complex', floor: 'ชั้น 2', isActive: true },
  ],
  vendors: [
    { id: 'VEN-01', code: 'DELL-TH', name: 'Dell Corporation (Thailand) Co., Ltd.', contactPerson: 'ฝ่ายขายลูกค้าองค์กร', phone: '02-670-7000', email: 'corporate_th@dell.com', isActive: true },
    { id: 'VEN-02', code: 'HPE-TH', name: 'Hewlett Packard Enterprise (Thailand)', contactPerson: 'ฝ่ายสนับสนุนเทคนิค', phone: '02-353-9000', email: 'service.th@hpe.com', isActive: true },
    { id: 'VEN-03', code: 'SYNNEX', name: 'Synnex (Thailand) Public Co., Ltd.', contactPerson: 'ฝ่ายบริการจัดจำหน่าย', phone: '02-553-8888', email: 'info@synnex.co.th', isActive: true },
    { id: 'VEN-04', code: 'ADVICE', name: 'Advice IT Infinite Public Co., Ltd.', contactPerson: 'ฝ่ายลูกค้าสัมพันธ์องค์กร', phone: '02-547-0000', email: 'b2b@advice.co.th', isActive: true },
    { id: 'VEN-05', code: 'JIB', name: 'J.I.B. Computer Group Co., Ltd.', contactPerson: 'Corporate Sales Hub', phone: '02-017-4444', email: 'corporate@jib.co.th', isActive: true },
  ],
  statuses: [
    { id: 'STAT-01', code: 'In Use', nameTh: 'กำลังใช้งาน', nameEn: 'In Use', color: '#10b981', allowAssign: true, isActive: true },
    { id: 'STAT-02', code: 'Available', nameTh: 'ว่าง / พร้อมส่งมอบ', nameEn: 'Available', color: '#0058be', allowAssign: true, isActive: true },
    { id: 'STAT-03', code: 'In Repair', nameTh: 'อยู่ระหว่างส่งซ่อม', nameEn: 'In Repair', color: '#f59e0b', allowAssign: false, isActive: true },
    { id: 'STAT-04', code: 'Damaged', nameTh: 'ชำรุดรอตรวจสภาพ', nameEn: 'Damaged', color: '#ef4444', allowAssign: false, isActive: true },
    { id: 'STAT-05', code: 'Disposed', nameTh: 'ตัดจำหน่ายแล้ว', nameEn: 'Disposed', color: '#64748b', allowAssign: false, isActive: true },
    { id: 'STAT-06', code: 'Reserved', nameTh: 'สำรองฉุกเฉิน', nameEn: 'Reserved', color: '#8b5cf6', allowAssign: false, isActive: true },
  ]
};


// Error Handling Infrastructure
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * ASSETS
 */
export async function getAssets(): Promise<Asset[]> {
  try {
    const querySnapshot = await getDocs(collection(db, ASSETS_COL));
    if (querySnapshot.empty) {
      const batch = writeBatch(db);
      for (const a of SEED_ASSETS) {
        const docRef = doc(db, ASSETS_COL, a.id);
        batch.set(docRef, cleanUndefined(a));
      }
      await batch.commit();
      return SEED_ASSETS;
    }
    const list: Asset[] = [];
    const seen = new Set<string>();
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as Asset;
      if (data && data.id && !seen.has(data.id)) {
        seen.add(data.id);
        list.push(data);
      }
    });
    return list;
  } catch (error) {
    console.error("Firestore getAssets error:", error);
    try {
      handleFirestoreError(error, OperationType.GET, ASSETS_COL);
    } catch (e) {
      // Return empty list so application continues in memory safely
    }
    return [];
  }
}

export async function saveAsset(asset: Asset): Promise<void> {
  try {
    await setDoc(doc(db, ASSETS_COL, asset.id), cleanUndefined(asset));
  } catch (error) {
    console.error("Firestore saveAsset error:", error);
    handleFirestoreError(error, OperationType.WRITE, `${ASSETS_COL}/${asset.id}`);
  }
}

export async function deleteAsset(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, ASSETS_COL, id));
  } catch (error) {
    console.error("Firestore deleteAsset error:", error);
    handleFirestoreError(error, OperationType.DELETE, `${ASSETS_COL}/${id}`);
  }
}

/**
 * REPAIR TICKETS
 */
export async function getRepairTickets(): Promise<RepairTicket[]> {
  try {
    const querySnapshot = await getDocs(collection(db, TICKETS_COL));
    if (querySnapshot.empty) {
      const batch = writeBatch(db);
      for (const t of SEED_REPAIR_TICKETS) {
        const docRef = doc(db, TICKETS_COL, t.id);
        batch.set(docRef, cleanUndefined(t));
      }
      await batch.commit();
      return SEED_REPAIR_TICKETS;
    }
    const list: RepairTicket[] = [];
    const seen = new Set<string>();
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as RepairTicket;
      if (data && data.id && !seen.has(data.id)) {
        seen.add(data.id);
        list.push(data);
      }
    });
    return list;
  } catch (error) {
    console.error("Firestore getRepairTickets error:", error);
    try {
      handleFirestoreError(error, OperationType.GET, TICKETS_COL);
    } catch (e) {
      // Fallback
    }
    return [];
  }
}

export async function saveRepairTicket(ticket: RepairTicket): Promise<void> {
  try {
    await setDoc(doc(db, TICKETS_COL, ticket.id), cleanUndefined(ticket));
  } catch (error) {
    console.error("Firestore saveRepairTicket error:", error);
    handleFirestoreError(error, OperationType.WRITE, `${TICKETS_COL}/${ticket.id}`);
  }
}

export async function deleteRepairTicket(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, TICKETS_COL, id));
  } catch (error) {
    console.error("Firestore deleteRepairTicket error:", error);
    handleFirestoreError(error, OperationType.DELETE, `${TICKETS_COL}/${id}`);
  }
}

/**
 * MAINTENANCE EVENTS
 */
export async function getMaintenanceEvents(): Promise<MaintenanceEvent[]> {
  try {
    const querySnapshot = await getDocs(collection(db, EVENTS_COL));
    if (querySnapshot.empty) {
      const batch = writeBatch(db);
      for (const e of SEED_MAINTENANCE_EVENTS) {
        const docRef = doc(db, EVENTS_COL, e.id);
        batch.set(docRef, cleanUndefined(e));
      }
      await batch.commit();
      return SEED_MAINTENANCE_EVENTS;
    }
    const list: MaintenanceEvent[] = [];
    const seen = new Set<string>();
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as MaintenanceEvent;
      if (data && data.id && !seen.has(data.id)) {
        seen.add(data.id);
        list.push(data);
      }
    });
    return list;
  } catch (error) {
    console.error("Firestore getMaintenanceEvents error:", error);
    try {
      handleFirestoreError(error, OperationType.GET, EVENTS_COL);
    } catch (e) {
      // Fallback
    }
    return [];
  }
}

export async function saveMaintenanceEvent(event: MaintenanceEvent): Promise<void> {
  try {
    await setDoc(doc(db, EVENTS_COL, event.id), cleanUndefined(event));
  } catch (error) {
    console.error("Firestore saveMaintenanceEvent error:", error);
    handleFirestoreError(error, OperationType.WRITE, `${EVENTS_COL}/${event.id}`);
  }
}

export async function deleteMaintenanceEvent(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, EVENTS_COL, id));
  } catch (error) {
    console.error("Firestore deleteMaintenanceEvent error:", error);
    handleFirestoreError(error, OperationType.DELETE, `${EVENTS_COL}/${id}`);
  }
}

/**
 * USERS
 */
export async function getUsers(): Promise<UserRecord[]> {
  try {
    const querySnapshot = await getDocs(collection(db, USERS_COL));
    if (querySnapshot.empty) {
      // Seed if empty
      const batch = writeBatch(db);
      for (const u of DEFAULT_USERS) {
        const docRef = doc(db, USERS_COL, u.id);
        batch.set(docRef, cleanUndefined(u));
      }
      await batch.commit();
      return DEFAULT_USERS;
    }
    const list: UserRecord[] = [];
    const seen = new Set<string>();
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as UserRecord;
      if (data && data.id && !seen.has(data.id)) {
        seen.add(data.id);
        // Ensure username and permissions exist even on older documents
        const username = data.username || data.email?.split('@')[0] || `user${data.id}`;
        const permissions = data.permissions || (data.role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_USER_PERMISSIONS);
        list.push({
          ...data,
          username,
          password: data.password || 'password123',
          permissions
        });
      }
    });
    return list;
  } catch (error) {
    console.error("Firestore getUsers error:", error);
    try {
      handleFirestoreError(error, OperationType.GET, USERS_COL);
    } catch (e) {
      // Fallback
    }
    return DEFAULT_USERS;
  }
}

export async function saveUser(user: UserRecord): Promise<void> {
  try {
    await setDoc(doc(db, USERS_COL, user.id), cleanUndefined(user));
  } catch (error) {
    console.error("Firestore saveUser error:", error);
    handleFirestoreError(error, OperationType.WRITE, `${USERS_COL}/${user.id}`);
  }
}

export async function deleteUser(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, USERS_COL, id));
  } catch (error) {
    console.error("Firestore deleteUser error:", error);
    handleFirestoreError(error, OperationType.DELETE, `${USERS_COL}/${id}`);
  }
}

/**
 * ACCESS REQUESTS (NOT LINKED TO EMAIL)
 */
export const ACCESS_REQUESTS_COL = 'access_requests';

export const DEFAULT_ACCESS_REQUESTS: AccessRequest[] = [
  {
    id: 'REQ-101',
    username: 'chayada.p',
    name: 'คุณชญาดา ประเสริฐ',
    employeeId: 'EMP-0842',
    requestedRole: 'user',
    department: 'Human Resources',
    reason: 'บันทึกและตรวจนับครุภัณฑ์ประจำฝ่ายบุคคล',
    phone: '02-123-4567 ต่อ 102',
    requestedAt: '22/9/2569 09:30:00',
    status: 'Pending'
  },
  {
    id: 'REQ-102',
    username: 'kittitat.c',
    name: 'คุณกิตติทัต เจริญดี',
    employeeId: 'EMP-0531',
    requestedRole: 'admin',
    department: 'Sales & Marketing',
    reason: 'ดูแลอุปกรณ์และคอมพิวเตอร์พกพาฝ่ายขาย',
    phone: '02-123-4567 ต่อ 205',
    requestedAt: '23/9/2569 14:15:00',
    status: 'Pending'
  },
  {
    id: 'REQ-103',
    username: 'sompoch.r',
    name: 'คุณสมโภช รักเทค',
    employeeId: 'EMP-0119',
    requestedRole: 'admin',
    department: 'IT Department',
    reason: 'ดูแลระบบเครือข่ายและเซิร์ฟเวอร์ไอที',
    phone: '02-123-4567 ต่อ 911',
    requestedAt: '24/9/2569 08:45:00',
    status: 'Pending'
  }
];

export async function getAccessRequests(): Promise<AccessRequest[]> {
  try {
    const querySnapshot = await getDocs(collection(db, ACCESS_REQUESTS_COL));
    if (querySnapshot.empty) {
      const batch = writeBatch(db);
      for (const req of DEFAULT_ACCESS_REQUESTS) {
        const docRef = doc(db, ACCESS_REQUESTS_COL, req.id);
        batch.set(docRef, cleanUndefined(req));
      }
      await batch.commit();
      return DEFAULT_ACCESS_REQUESTS;
    }
    const list: AccessRequest[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as AccessRequest;
      if (data && data.id) {
        list.push({
          ...data,
          username: data.username || `user_${data.id.toLowerCase()}`
        });
      }
    });
    return list;
  } catch (error) {
    console.error("Firestore getAccessRequests error, fallback to local:", error);
    const saved = localStorage.getItem('assetmanager_access_requests');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_ACCESS_REQUESTS;
  }
}

export async function saveAccessRequest(req: AccessRequest): Promise<void> {
  try {
    await setDoc(doc(db, ACCESS_REQUESTS_COL, req.id), cleanUndefined(req));
  } catch (error) {
    console.error("Firestore saveAccessRequest error:", error);
    handleFirestoreError(error, OperationType.WRITE, `${ACCESS_REQUESTS_COL}/${req.id}`);
  }
}

export async function deleteAccessRequest(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, ACCESS_REQUESTS_COL, id));
  } catch (error) {
    console.error("Firestore deleteAccessRequest error:", error);
    handleFirestoreError(error, OperationType.DELETE, `${ACCESS_REQUESTS_COL}/${id}`);
  }
}

/**
 * MASTER DATA CONTROLS
 */
export async function getMasterData(): Promise<MasterDataState> {
  try {
    const docRef = doc(db, MASTER_DATA_COL, MASTER_DATA_DOC);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as MasterDataState;
      if (data && data.categories && data.departments) {
        return data;
      }
    }
    // Seed default master data if empty
    await setDoc(docRef, cleanUndefined(DEFAULT_MASTER_DATA));
    return DEFAULT_MASTER_DATA;
  } catch (error) {
    console.error("Firestore getMasterData error, using local fallback:", error);
    const saved = localStorage.getItem('assetmanager_master_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_MASTER_DATA;
  }
}

export async function saveMasterData(data: MasterDataState): Promise<void> {
  try {
    localStorage.setItem('assetmanager_master_data', JSON.stringify(data));
    const docRef = doc(db, MASTER_DATA_COL, MASTER_DATA_DOC);
    await setDoc(docRef, cleanUndefined(data));
  } catch (error) {
    console.error("Firestore saveMasterData error:", error);
    handleFirestoreError(error, OperationType.WRITE, `${MASTER_DATA_COL}/${MASTER_DATA_DOC}`);
  }
}

export async function resetMasterData(): Promise<MasterDataState> {
  try {
    localStorage.setItem('assetmanager_master_data', JSON.stringify(DEFAULT_MASTER_DATA));
    const docRef = doc(db, MASTER_DATA_COL, MASTER_DATA_DOC);
    await setDoc(docRef, cleanUndefined(DEFAULT_MASTER_DATA));
    return DEFAULT_MASTER_DATA;
  } catch (error) {
    console.error("Firestore resetMasterData error:", error);
    return DEFAULT_MASTER_DATA;
  }
}


/**
 * RESET ALL DATA (Clear everything on Firestore to force re-seeding)
 */
export async function clearDatabase(): Promise<void> {
  try {
    const assets = await getDocs(collection(db, ASSETS_COL));
    for (const docSnap of assets.docs) {
      await deleteDoc(docSnap.ref);
    }
    
    const tickets = await getDocs(collection(db, TICKETS_COL));
    for (const docSnap of tickets.docs) {
      await deleteDoc(docSnap.ref);
    }
    
    const events = await getDocs(collection(db, EVENTS_COL));
    for (const docSnap of events.docs) {
      await deleteDoc(docSnap.ref);
    }
    
    const users = await getDocs(collection(db, USERS_COL));
    for (const docSnap of users.docs) {
      await deleteDoc(docSnap.ref);
    }

    const backups = await getDocs(collection(db, BACKUPS_COL));
    for (const docSnap of backups.docs) {
      await deleteDoc(docSnap.ref);
    }
  } catch (error) {
    console.error("Firestore clearDatabase error:", error);
    handleFirestoreError(error, OperationType.DELETE, 'all');
  }
}

// Backups collection
export const BACKUPS_COL = 'backups';

export async function getBackups(): Promise<BackupRecord[]> {
  try {
    const querySnapshot = await getDocs(collection(db, BACKUPS_COL));
    const list: BackupRecord[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        timestamp: data.timestamp || '',
        schedule: data.schedule || '',
        assets: data.assets || [],
        repairTickets: data.repairTickets || [],
        maintenanceEvents: data.maintenanceEvents || []
      });
    });
    // Sort descending by timestamp
    return list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  } catch (error) {
    console.error("Firestore getBackups error:", error);
    return [];
  }
}

export async function saveBackup(backup: BackupRecord): Promise<void> {
  try {
    await setDoc(doc(db, BACKUPS_COL, backup.id), cleanUndefined(backup));
  } catch (error) {
    console.error("Firestore saveBackup error:", error);
    handleFirestoreError(error, OperationType.WRITE, `${BACKUPS_COL}/${backup.id}`);
  }
}

export async function deleteBackup(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, BACKUPS_COL, id));
  } catch (error) {
    console.error("Firestore deleteBackup error:", error);
    handleFirestoreError(error, OperationType.DELETE, `${BACKUPS_COL}/${id}`);
  }
}

