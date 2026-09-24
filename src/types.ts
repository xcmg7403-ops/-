export type AssetCategory = 'PC' | 'Notebook' | 'Office Furniture' | 'Electrical Appliances' | 'Vehicles' | 'Peripherals' | 'Network' | 'Server' | 'Display';

export type AssetStatus = 'In Use' | 'Available' | 'Repair';

export interface Assignee {
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  location: string;
  avatar: string;
}

export interface TechnicalSpec {
  item: string;
  details: string;
  status: string;
}

export interface RepairLog {
  date: string;
  action: string;
  status: string;
  technician: string;
}

export interface Asset {
  id: string; // e.g. IT-NB-2024-001
  name: string;
  serialNumber: string;
  category: AssetCategory;
  department: string;
  status: AssetStatus;
  purchasePrice: number;
  vendor: string;
  purchaseOrder: string;
  purchaseDate: string; // YYYY-MM-DD
  warrantyExpiryDate: string; // YYYY-MM-DD or 'Expired'
  specCPU?: string;
  specRAM?: string;
  specStorage?: string;
  specOS?: string;
  brand?: string;
  model?: string;
  division?: string;
  responsiblePerson?: string;
  ipAddress?: string;
  macWifi?: string;
  macLan?: string;
  remarks?: string;
  detailedSpecs?: TechnicalSpec[];
  assignee?: Assignee;
  repairsHistory?: RepairLog[];
  imageUrl?: string;
}

export interface RepairTicket {
  id: string; // e.g. REP-2023-0812
  assetId: string;
  assetName: string;
  category: string;
  issue: string;
  status: 'Pending' | 'Repairing' | 'Completed';
  priority: 'Low' | 'Medium' | 'Critical';
  dateSubmitted: string;
  technicianName?: string;
  repairType?: string;
}

export interface MaintenanceEvent {
  id: string;
  title: string;
  subtitle: string;
  month: string; // e.g. "ส.ค."
  day: string; // e.g. "24"
  time: string; // e.g. "09:00 - 12:00"
  location: string;
  isActive: boolean;
  fullDate?: string; // YYYY-MM-DD
}

export interface UserPermissions {
  canManageUsers: boolean;
  canManageMasterData: boolean;
  canManageAssets: boolean;
  canManageRepairs: boolean;
  canExportReports: boolean;
  canConfigureSystem: boolean;
}

export interface UserSession {
  username?: string;
  email?: string;
  name: string;
  role: 'admin' | 'user';
  avatar: string;
  department?: string;
  permissions?: UserPermissions;
}

export interface UserRecord {
  id: string;
  username: string;
  password?: string;
  name: string;
  employeeId?: string;
  email?: string;
  role: 'admin' | 'user';
  department: string;
  status: 'Active' | 'Suspended';
  permissions: UserPermissions;
  lastLogin?: string;
}

export interface AccessRequest {
  id: string;
  username: string; // Requested username (e.g. chayada.p, sompoch.r)
  name: string; // Full Name
  employeeId?: string; // Employee ID (e.g. EMP-1049)
  requestedRole: 'admin' | 'user';
  department: string;
  reason?: string; // Purpose of access request
  phone?: string; // Internal phone/extension (not email)
  email?: string; // Optional legacy
  requestedAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface MasterCategory {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string;
  icon?: string;
  description?: string;
  isActive: boolean;
}

export interface MasterDepartment {
  id: string;
  code: string;
  name: string;
  headName?: string;
  isActive: boolean;
}

export interface MasterLocation {
  id: string;
  code: string;
  name: string;
  building: string;
  floor: string;
  isActive: boolean;
}

export interface MasterVendor {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  isActive: boolean;
}

export interface MasterStatus {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string;
  color: string;
  allowAssign: boolean;
  isActive: boolean;
}

export interface MasterDataState {
  categories: MasterCategory[];
  departments: MasterDepartment[];
  locations: MasterLocation[];
  vendors: MasterVendor[];
  statuses: MasterStatus[];
}

export interface BackupRecord {
  id: string;
  timestamp: string;
  schedule: string;
  assets: Asset[];
  repairTickets: RepairTicket[];
  maintenanceEvents: MaintenanceEvent[];
}


