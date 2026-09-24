import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Toast, { ToastMessage } from './components/Toast';

import DashboardView from './components/DashboardView';
import InventoryView from './components/InventoryView';
import MaintenanceView from './components/MaintenanceView';
import AssetDetailsView from './components/AssetDetailsView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import LoginPage from './components/LoginPage';
import AdminPortalView from './components/AdminPortalView';

import { SEED_ASSETS, SEED_REPAIR_TICKETS, SEED_MAINTENANCE_EVENTS } from './mockData';
import { Asset, RepairTicket, MaintenanceEvent, UserSession, BackupRecord, MasterDataState } from './types';
import { 
  getAssets, 
  saveAsset, 
  deleteAsset, 
  getRepairTickets, 
  saveRepairTicket, 
  deleteRepairTicket, 
  getMaintenanceEvents, 
  saveMaintenanceEvent, 
  deleteMaintenanceEvent,
  getBackups,
  saveBackup,
  deleteBackup,
  clearDatabase,
  getMasterData,
  saveMasterData,
  DEFAULT_MASTER_DATA,
  DEFAULT_ADMIN_PERMISSIONS,
  DEFAULT_USER_PERMISSIONS
} from './lib/firebase';

export default function App() {
  // Helper to filter out duplicate elements by ID
  const deduplicateById = <T extends { id: string }>(arr: T[]): T[] => {
    const seen = new Set<string>();
    return arr.filter(item => {
      if (!item || !item.id) return false;
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  };

  // Master persistent state loaders
  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('assetmanager_assets');
    return saved ? deduplicateById(JSON.parse(saved)) : [];
  });

  const [repairTickets, setRepairTickets] = useState<RepairTicket[]>(() => {
    const saved = localStorage.getItem('assetmanager_tickets');
    return saved ? deduplicateById(JSON.parse(saved)) : [];
  });

  const [maintenanceEvents, setMaintenanceEvents] = useState<MaintenanceEvent[]>(() => {
    const saved = localStorage.getItem('assetmanager_events');
    return saved ? deduplicateById(JSON.parse(saved)) : [];
  });

  // User auth session
  const [user, setUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('assetmanager_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) {
          if (!parsed.permissions) {
            parsed.permissions = parsed.role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_USER_PERMISSIONS;
          }
          if (!parsed.username) {
            parsed.username = parsed.email?.split('@')[0] || (parsed.role === 'admin' ? 'admin' : 'user');
          }
          return parsed;
        }
      } catch (e) {}
    }
    return null;
  });

  // Master Data State
  const [masterData, setMasterData] = useState<MasterDataState>(() => {
    const saved = localStorage.getItem('assetmanager_master_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_MASTER_DATA;
  });

  const [isLoadingFirebase, setIsLoadingFirebase] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(() => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateString = now.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${dateString} เวลา ${timeString}`;
  });

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      const [fbAssets, fbTickets, fbEvents, fbMasterData] = await Promise.all([
        getAssets(),
        getRepairTickets(),
        getMaintenanceEvents(),
        getMasterData()
      ]);
      setAssets(fbAssets);
      setRepairTickets(fbTickets);
      setMaintenanceEvents(fbEvents);
      if (fbMasterData) setMasterData(fbMasterData);
      const now = new Date();
      const timeString = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dateString = now.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
      setLastUpdated(`${dateString} เวลา ${timeString}`);
      triggerToast('success', 'อัปเดตข้อมูลและสถิติล่าสุดจากคลาวด์เรียบร้อยแล้ว');
    } catch (e) {
      console.error("Failed to refresh data from Firebase:", e);
      triggerToast('error', 'ไม่สามารถดึงข้อมูลจากระบบคลาวด์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Load from Firebase on Mount
  useEffect(() => {
    async function loadFirebaseData() {
      try {
        const [fbAssets, fbTickets, fbEvents, fbBackups, fbMasterData] = await Promise.all([
          getAssets(),
          getRepairTickets(),
          getMaintenanceEvents(),
          getBackups(),
          getMasterData()
        ]);
        setAssets(fbAssets);
        setRepairTickets(fbTickets);
        setMaintenanceEvents(fbEvents);
        setBackups(fbBackups);
        if (fbMasterData) setMasterData(fbMasterData);
        const now = new Date();
        const timeString = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateString = now.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
        setLastUpdated(`${dateString} เวลา ${timeString}`);
      } catch (e) {
        console.error("Failed to load data from Firebase:", e);
      } finally {
        setIsLoadingFirebase(false);
      }
    }
    loadFirebaseData();
  }, []);

  // Mobile sidebar open state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Theme state ('light' or 'dark')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('assetmanager_theme') as 'light' | 'dark') || 'light';
  });

  // Currency State
  const [currency, setCurrency] = useState<string>(() => {
    return localStorage.getItem('assetmanager_currency') || 'THB (฿) - Thai Baht';
  });

  // Organization Name State
  const [orgName, setOrgName] = useState<string>(() => {
    return localStorage.getItem('assetmanager_org_name') || 'AssetManager IT Solutions Ltd.';
  });

  // System Email State
  const [systemEmail, setSystemEmail] = useState<string>(() => {
    return localStorage.getItem('assetmanager_system_email') || 'admin@assetmanager.it';
  });

  // Backup Schedule State
  const [backupSchedule, setBackupSchedule] = useState<string>(() => {
    return localStorage.getItem('assetmanager_backup_schedule') || 'Daily';
  });

  // Backups state
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);

  // Auto Backup Effect
  useEffect(() => {
    if (isLoadingFirebase || backupSchedule === 'Off' || assets.length === 0) return;

    const performAutoBackup = async () => {
      const lastBackupStr = localStorage.getItem('assetmanager_last_backup') || '0';
      const lastBackup = parseInt(lastBackupStr, 10);
      const now = Date.now();
      
      let interval = 24 * 3600 * 1000; // Daily default
      if (backupSchedule === 'Weekly') interval = 7 * 24 * 3600 * 1000;
      if (backupSchedule === 'Monthly') interval = 30 * 24 * 3600 * 1000;

      if (now - lastBackup >= interval) {
        setIsBackingUp(true);
        const backupId = `AUTO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
        const newBackup: BackupRecord = {
          id: backupId,
          timestamp: new Date().toISOString(),
          schedule: backupSchedule,
          assets,
          repairTickets,
          maintenanceEvents
        };

        try {
          await saveBackup(newBackup);
          localStorage.setItem('assetmanager_last_backup', String(now));
          setBackups(prev => [newBackup, ...prev]);
          triggerToast('info', `[Auto Backup] สำรองข้อมูลครุภัณฑ์สำเร็จ (${backupId})`);
        } catch (e) {
          console.error("Auto backup failed:", e);
        } finally {
          setIsBackingUp(false);
        }
      }
    };

    performAutoBackup();
  }, [isLoadingFirebase, backupSchedule, assets, repairTickets, maintenanceEvents]);

  // Apply theme class to document element and save to localStorage
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('assetmanager_theme', theme);
  }, [theme]);

  // Apply organization name to document title dynamically
  useEffect(() => {
    document.title = `${orgName} - ระบบบริหารจัดการครุภัณฑ์คอมพิวเตอร์`;
  }, [orgName]);

  // Navigation and Selection States
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Write changes to localStorage on modifications
  useEffect(() => {
    localStorage.setItem('assetmanager_assets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem('assetmanager_tickets', JSON.stringify(repairTickets));
  }, [repairTickets]);

  useEffect(() => {
    localStorage.setItem('assetmanager_events', JSON.stringify(maintenanceEvents));
  }, [maintenanceEvents]);

  // Toast System Handler
  const triggerToast = (type: 'success' | 'error' | 'info', message: string) => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      message,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Auth Handlers
  const handleLogin = (sessionOrEmail: UserSession | string, role?: 'admin' | 'user', name?: string, avatar?: string) => {
    let session: UserSession;
    if (typeof sessionOrEmail === 'string') {
      session = {
        email: sessionOrEmail,
        role: role || 'user',
        name: name || 'User',
        avatar: avatar || (role === 'admin'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'
          : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces'),
        username: sessionOrEmail.split('@')[0],
        permissions: role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_USER_PERMISSIONS
      };
    } else {
      session = sessionOrEmail;
    }
    setUser(session);
    localStorage.setItem('assetmanager_user', JSON.stringify(session));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('assetmanager_user');
    setActiveTab('dashboard');
    triggerToast('info', 'ออกจากระบบสำเร็จเรียบร้อยแล้ว');
  };

  // Add Asset Core Action
  const handleAddAsset = (newAsset: Asset) => {
    setAssets((prev) => [newAsset, ...prev]);
    saveAsset(newAsset);
  };

  // Edit Asset Core Action
  const handleEditAsset = (updatedAsset: Asset) => {
    setAssets((prev) => prev.map((asset) => (asset.id === updatedAsset.id ? updatedAsset : asset)));
    saveAsset(updatedAsset);
    // Sync current active view details state in case we edited it inside Details view
    if (selectedAssetId === updatedAsset.id) {
      // Re-trigger reference
      setSelectedAssetId(null);
      setTimeout(() => setSelectedAssetId(updatedAsset.id), 10);
    }
  };

  // Delete Asset Core Action
  const handleDeleteAsset = (id: string) => {
    setAssets((prev) => prev.filter((asset) => asset.id !== id));
    deleteAsset(id);
    if (selectedAssetId === id) {
      setSelectedAssetId(null);
      setActiveTab('inventory');
    }
  };

  // Import Assets Bulk Core Action
  const handleImportAssets = async (importedAssets: Asset[]) => {
    setAssets((prev) => {
      const importedIds = new Set(importedAssets.map(a => a.id));
      const filteredPrev = prev.filter(a => !importedIds.has(a.id));
      return [...importedAssets, ...filteredPrev];
    });

    try {
      await Promise.all(importedAssets.map(asset => saveAsset(asset)));
    } catch (e) {
      console.error("Failed to save imported assets:", e);
      triggerToast('error', 'บันทึกข้อมูลนำเข้าลงคลาวด์ล้มเหลวบางรายการ');
    }
  };

  // Manual Backup Core Action
  const handleManualBackup = async () => {
    setIsBackingUp(true);
    const backupId = `MANUAL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newBackup: BackupRecord = {
      id: backupId,
      timestamp: new Date().toISOString(),
      schedule: 'Manual',
      assets,
      repairTickets,
      maintenanceEvents
    };

    try {
      await saveBackup(newBackup);
      localStorage.setItem('assetmanager_last_backup', String(Date.now()));
      setBackups(prev => [newBackup, ...prev]);
      triggerToast('success', `สำรองฐานข้อมูลเสร็จสมบูรณ์ รหัสสำรอง: ${backupId}`);
    } catch (e) {
      console.error("Manual backup failed:", e);
      triggerToast('error', 'การสำรองข้อมูลล้มเหลว');
    } finally {
      setIsBackingUp(false);
    }
  };

  // Restore Backup Core Action
  const handleRestoreBackup = async (backup: BackupRecord) => {
    setIsRefreshing(true);
    triggerToast('info', 'กำลังกู้คืนฐานข้อมูล ICT คลาวด์และหน่วยความจำ...');
    try {
      // 1. Wipe database first
      await clearDatabase();
      
      // 2. Re-save all items from backup to Firestore in parallel
      await Promise.all([
        ...backup.assets.map(a => saveAsset(a)),
        ...backup.repairTickets.map(t => saveRepairTicket(t)),
        ...backup.maintenanceEvents.map(e => saveMaintenanceEvent(e))
      ]);

      // 3. Update memory state
      setAssets(backup.assets);
      setRepairTickets(backup.repairTickets);
      setMaintenanceEvents(backup.maintenanceEvents);
      
      triggerToast('success', `กู้คืนฐานข้อมูลครุภัณฑ์จากชุดข้อมูลสำรอง (${backup.id}) เสร็จสมบูรณ์แล้ว ระบบทำการซิงก์เรียบร้อย`);
    } catch (e) {
      console.error("Failed to restore backup:", e);
      triggerToast('error', 'การกู้คืนระบบล้มเหลว กรุณาติดต่อ ICT Administrator');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Delete Backup Core Action
  const handleDeleteBackup = async (backupId: string) => {
    try {
      await deleteBackup(backupId);
      setBackups(prev => prev.filter(b => b.id !== backupId));
      triggerToast('success', 'ลบไฟล์สำรองข้อมูลออกจากระบบคลาวด์แล้ว');
    } catch (e) {
      console.error("Failed to delete backup:", e);
      triggerToast('error', 'ไม่สามารถลบไฟล์สำรองข้อมูลได้');
    }
  };

  // Add Repair Request Core Action
  const handleAddRepairTicket = (newTicket: RepairTicket) => {
    setRepairTickets((prev) => [newTicket, ...prev]);
    saveRepairTicket(newTicket);
    triggerToast('success', `เปิดใบสั่งซ่อม ${newTicket.id} เรียบร้อยแล้ว`);
  };

  // Update Status of repair ticket
  const handleUpdateTicketStatus = (id: string, newStatus: 'Pending' | 'Repairing' | 'Completed') => {
    setRepairTickets((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t));
      const target = updated.find(t => t.id === id);
      if (target) {
        saveRepairTicket(target);
      }
      return updated;
    });
  };

  // Delete Repair Ticket Core Action
  const handleDeleteRepairTicket = (id: string) => {
    setRepairTickets((prev) => prev.filter((t) => t.id !== id));
    deleteRepairTicket(id);
    triggerToast('success', `ยกเลิกใบสั่งซ่อม ${id} สำเร็จแล้ว`);
  };

  // Add Maintenance Event Core Action
  const handleAddMaintenanceEvent = (newEvent: MaintenanceEvent) => {
    setMaintenanceEvents((prev) => [newEvent, ...prev]);
    saveMaintenanceEvent(newEvent);
    triggerToast('success', `เพิ่มแผนงานบำรุงรักษา "${newEvent.title}" เรียบร้อยแล้ว`);
  };

  // Delete Maintenance Event Core Action
  const handleDeleteMaintenanceEvent = (id: string) => {
    setMaintenanceEvents((prev) => prev.filter((event) => event.id !== id));
    deleteMaintenanceEvent(id);
    triggerToast('success', 'ลบแผนงานบำรุงรักษาเรียบร้อยแล้ว');
  };

  // Check for due or overdue maintenance events on mount/events update
  useEffect(() => {
    if (!user) return;
    const todayStr = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
    const dueEvents = maintenanceEvents.filter(e => e.isActive && e.fullDate && e.fullDate <= todayStr);
    
    if (dueEvents.length > 0) {
      const timer = setTimeout(() => {
        triggerToast('info', `แจ้งเตือน: มีกิจกรรมบำรุงรักษาถึงกำหนดส่ง/เลยกำหนดจำนวน ${dueEvents.length} รายการ`);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [maintenanceEvents, user]);

  // Select item & view detail dossier helper
  const handleSelectAsset = (id: string) => {
    setSelectedAssetId(id);
    setActiveTab('details');
  };

  // Trigger Log repair redirects to Maintenance View with modal prefilled
  const handleTriggerLogRepair = (assetId: string) => {
    setActiveTab('maintenance');
    triggerToast('info', 'กรุณากดปุ่ม "แจ้งซ่อมอุปกรณ์" ด้านขวาบน และเลือกอุปกรณ์ที่คุณอ้างอิงเพื่อดำเนินรายการ');
  };

  // Active Maintenance warning items calculation (Pending + Repairing tickets)
  const totalMaintenanceAlerts = repairTickets.filter(
    (t) => t.status === 'Pending' || t.status === 'Repairing'
  ).length;

  // Handle Tab Nav Change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab !== 'details') {
      setSelectedAssetId(null);
    }
  };

  // Universal Search Handler - routes search to inventory view dynamically
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (activeTab !== 'inventory' && activeTab !== 'details') {
      setActiveTab('inventory');
    }
  };

  // Render Login page if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <Toast toasts={toasts} onRemove={removeToast} />
        <LoginPage onLogin={handleLogin} triggerToast={triggerToast} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 font-sans">
      {/* Toast Alert stack overlay */}
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Side Navigation Menu Rail (240px width) */}
      <Sidebar 
        currentTab={activeTab} 
        onTabChange={handleTabChange} 
        user={user}
        onLogout={handleLogout}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        orgName={orgName}
      />

      {/* Main Content Area Viewport */}
      <div className="flex-1 lg:pl-[240px] pt-16 flex flex-col min-h-screen">
        {/* Global sticky/fixed top bar header */}
        <Topbar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          totalMaintenanceAlerts={totalMaintenanceAlerts}
          onAlertClick={() => handleTabChange('maintenance')}
          assets={assets}
          repairTickets={repairTickets}
          onSelectAsset={handleSelectAsset}
          triggerToast={triggerToast}
          onToggleSidebar={() => setIsMobileSidebarOpen(true)}
          user={user}
          orgName={orgName}
        />

        {/* Dynamic routed workspace panel */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto flex-1">
          {activeTab === 'dashboard' && (
            <DashboardView
              assets={assets}
              onTabChange={handleTabChange}
              onSelectAsset={handleSelectAsset}
              lastUpdated={lastUpdated}
              onRefresh={handleRefreshData}
              isRefreshing={isRefreshing}
              onOpenAddModal={() => {
                setActiveTab('inventory');
                triggerToast('info', 'กรุณากดปุ่ม "Add New Asset" เพื่อเริ่มบันทึก');
              }}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              assets={assets}
              onSelectAsset={handleSelectAsset}
              onAddAsset={handleAddAsset}
              onEditAsset={handleEditAsset}
              onDeleteAsset={handleDeleteAsset}
              triggerToast={triggerToast}
              onImportAssets={handleImportAssets}
              currency={currency}
              masterData={masterData}
              currentUser={user}
            />
          )}

          {activeTab === 'maintenance' && (
            <MaintenanceView
              assets={assets}
              repairTickets={repairTickets}
              maintenanceEvents={maintenanceEvents}
              onAddRepairTicket={handleAddRepairTicket}
              onUpdateTicketStatus={handleUpdateTicketStatus}
              onDeleteRepairTicket={handleDeleteRepairTicket}
              onAddMaintenanceEvent={handleAddMaintenanceEvent}
              onDeleteMaintenanceEvent={handleDeleteMaintenanceEvent}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === 'details' && selectedAssetId && (
            (() => {
              const matched = assets.find((a) => a.id === selectedAssetId);
              if (matched) {
                return (
                  <AssetDetailsView
                    asset={matched}
                    onBackToInventory={() => handleTabChange('inventory')}
                    onEditAsset={handleEditAsset}
                    onTriggerLogRepair={handleTriggerLogRepair}
                    triggerToast={triggerToast}
                    currency={currency}
                  />
                );
              } else {
                return (
                  <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                    <p className="text-slate-400 font-semibold mb-2">ไม่พบข้อมูลครุภัณฑ์นี้ หรือครุภัณฑ์นี้ถูกลบแล้ว</p>
                    <button
                      onClick={() => handleTabChange('inventory')}
                      className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl"
                    >
                      กลับสู่บัญชีครุภัณฑ์
                    </button>
                  </div>
                );
              }
            })()
          )}

          {activeTab === 'reports' && <ReportsView assets={assets} repairTickets={repairTickets} currency={currency} />}

          {activeTab === 'admin' && (user.role === 'admin' || user.permissions?.canManageUsers || user.permissions?.canManageMasterData) && (
            <AdminPortalView 
              assets={assets} 
              triggerToast={triggerToast} 
              currentUser={user}
              masterData={masterData}
              onUpdateMasterData={(newMD) => {
                setMasterData(newMD);
                saveMasterData(newMD);
              }}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView 
              triggerToast={triggerToast} 
              totalAssets={assets.length} 
              theme={theme}
              onThemeChange={setTheme}
              currency={currency}
              onCurrencyChange={setCurrency}
              backupSchedule={backupSchedule}
              onBackupScheduleChange={setBackupSchedule}
              backups={backups}
              isBackingUp={isBackingUp}
              onTriggerManualBackup={handleManualBackup}
              onRestoreBackup={handleRestoreBackup}
              onDeleteBackup={handleDeleteBackup}
              orgName={orgName}
              onOrgNameChange={setOrgName}
              systemEmail={systemEmail}
              onSystemEmailChange={setSystemEmail}
            />
          )}
        </main>
      </div>
    </div>
  );
}

