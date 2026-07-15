import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Asset, RepairTicket, MaintenanceEvent, UserRecord } from '../types';
import { SEED_ASSETS, SEED_REPAIR_TICKETS, SEED_MAINTENANCE_EVENTS } from '../mockData';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId if provided
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");

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

/**
 * ASSETS
 */
export async function getAssets(): Promise<Asset[]> {
  try {
    const querySnapshot = await getDocs(collection(db, ASSETS_COL));
    if (querySnapshot.empty) {
      return [];
    }
    const list: Asset[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push(docSnap.data() as Asset);
    });
    return list;
  } catch (error) {
    console.error("Firestore getAssets error:", error);
    return []; // Fallback to empty array
  }
}

export async function saveAsset(asset: Asset): Promise<void> {
  try {
    await setDoc(doc(db, ASSETS_COL, asset.id), cleanUndefined(asset));
  } catch (error) {
    console.error("Firestore saveAsset error:", error);
  }
}

export async function deleteAsset(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, ASSETS_COL, id));
  } catch (error) {
    console.error("Firestore deleteAsset error:", error);
  }
}

/**
 * REPAIR TICKETS
 */
export async function getRepairTickets(): Promise<RepairTicket[]> {
  try {
    const querySnapshot = await getDocs(collection(db, TICKETS_COL));
    if (querySnapshot.empty) {
      return [];
    }
    const list: RepairTicket[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push(docSnap.data() as RepairTicket);
    });
    return list;
  } catch (error) {
    console.error("Firestore getRepairTickets error:", error);
    return [];
  }
}

export async function saveRepairTicket(ticket: RepairTicket): Promise<void> {
  try {
    await setDoc(doc(db, TICKETS_COL, ticket.id), cleanUndefined(ticket));
  } catch (error) {
    console.error("Firestore saveRepairTicket error:", error);
  }
}

export async function deleteRepairTicket(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, TICKETS_COL, id));
  } catch (error) {
    console.error("Firestore deleteRepairTicket error:", error);
  }
}

/**
 * MAINTENANCE EVENTS
 */
export async function getMaintenanceEvents(): Promise<MaintenanceEvent[]> {
  try {
    const querySnapshot = await getDocs(collection(db, EVENTS_COL));
    if (querySnapshot.empty) {
      return [];
    }
    const list: MaintenanceEvent[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push(docSnap.data() as MaintenanceEvent);
    });
    return list;
  } catch (error) {
    console.error("Firestore getMaintenanceEvents error:", error);
    return [];
  }
}

export async function saveMaintenanceEvent(event: MaintenanceEvent): Promise<void> {
  try {
    await setDoc(doc(db, EVENTS_COL, event.id), cleanUndefined(event));
  } catch (error) {
    console.error("Firestore saveMaintenanceEvent error:", error);
  }
}

export async function deleteMaintenanceEvent(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, EVENTS_COL, id));
  } catch (error) {
    console.error("Firestore deleteMaintenanceEvent error:", error);
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
    querySnapshot.forEach((docSnap) => {
      list.push(docSnap.data() as UserRecord);
    });
    return list;
  } catch (error) {
    console.error("Firestore getUsers error:", error);
    return DEFAULT_USERS;
  }
}

export async function saveUser(user: UserRecord): Promise<void> {
  try {
    await setDoc(doc(db, USERS_COL, user.id), cleanUndefined(user));
  } catch (error) {
    console.error("Firestore saveUser error:", error);
  }
}

export async function deleteUser(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, USERS_COL, id));
  } catch (error) {
    console.error("Firestore deleteUser error:", error);
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
  } catch (error) {
    console.error("Firestore clearDatabase error:", error);
  }
}
