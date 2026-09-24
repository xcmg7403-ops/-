import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection, 
  getDocs, 
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
import { Asset, RepairTicket, MaintenanceEvent, UserRecord, BackupRecord } from '../types';
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

/**
 * Handle Google / GMAIL Sign-In
 */
export async function signInWithGoogle(): Promise<{ email: string; name: string; avatar: string; role: 'admin' | 'user' }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;
    
    const email = firebaseUser.email || '';
    const name = firebaseUser.displayName || email.split('@')[0] || 'Google User';
    const avatar = firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop';
    
    // Determine user role
    let role: 'admin' | 'user' = 'user';
    const cleanEmail = email.toLowerCase().trim();
    
    if (cleanEmail === 'xcmg7403@gmail.com' || cleanEmail === 'admin@assetmanager.com') {
      role = 'admin';
    } else {
      try {
        const usersList = await getUsers();
        const existingUser = usersList.find(u => u.email.toLowerCase().trim() === cleanEmail);
        if (existingUser) {
          role = existingUser.role;
        } else {
          // Auto-register new sign-in in Firestore as a default 'user'
          const newUser: UserRecord = {
            id: `U-${Date.now()}`,
            name,
            email,
            role: 'user',
            department: 'General Staff',
            status: 'Active'
          };
          await saveUser(newUser);
        }
      } catch (dbErr) {
        console.error("Firestore user sync error, falling back:", dbErr);
      }
    }
    
    return { email, name, avatar, role };
  } catch (error) {
    console.error("Google Authentication error:", error);
    throw error;
  }
}

/**
 * Fallback Direct Email Login (e.g. if Popups are blocked in AI Studio iframe)
 */
export async function directGmailLogin(email: string): Promise<{ email: string; name: string; avatar: string; role: 'admin' | 'user' }> {
  const cleanEmail = email.toLowerCase().trim();
  const name = cleanEmail.split('@')[0] || 'Gmail User';
  const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
  const avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop';
  
  let role: 'admin' | 'user' = 'user';
  
  if (cleanEmail === 'xcmg7403@gmail.com' || cleanEmail === 'admin@assetmanager.com') {
    role = 'admin';
  } else {
    try {
      const usersList = await getUsers();
      const existingUser = usersList.find(u => u.email.toLowerCase().trim() === cleanEmail);
      if (existingUser) {
        role = existingUser.role;
      } else {
        // Auto-register
        const newUser: UserRecord = {
          id: `U-${Date.now()}`,
          name: `คุณ${capitalizedName}`,
          email: cleanEmail,
          role: 'user',
          department: 'General Staff',
          status: 'Active'
        };
        await saveUser(newUser);
      }
    } catch (dbErr) {
      console.error("Firestore user sync error in fallback, falling back:", dbErr);
    }
  }
  
  return { email: cleanEmail, name: `คุณ${capitalizedName}`, avatar, role };
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

export const DEFAULT_USERS: UserRecord[] = [
  { id: 'U-01', name: 'คุณสิรินทร์ เทคโน', email: 'admin@assetmanager.com', role: 'admin', department: 'IT Department', status: 'Active' },
  { id: 'U-02', name: 'คุณสมชาย พนักงานไอที', email: 'user@assetmanager.com', role: 'user', department: 'IT Operations', status: 'Active' },
  { id: 'U-03', name: 'คุณวิภา วงศ์ดี', email: 'wipa.w@assetmanager.com', role: 'user', department: 'Accounting', status: 'Active' },
  { id: 'U-04', name: 'คุณนพดล เกียรติภูมิ', email: 'noppadol.k@assetmanager.com', role: 'user', department: 'IT Infrastructure', status: 'Active' },
];

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
        list.push(data);
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

