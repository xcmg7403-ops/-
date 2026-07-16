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
import { Asset, RepairTicket, MaintenanceEvent, UserSession } from './types';
import { 
  getAssets, 
  saveAsset, 
  deleteAsset, 
  getRepairTickets, 
  saveRepairTicket, 
  deleteRepairTicket, 
  getMaintenanceEvents, 
  saveMaintenanceEvent, 
  deleteMaintenanceEvent 
} from './lib/firebase';

export default function App() {
  // Master persistent state loaders
  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('assetmanager_assets');
    return saved ? JSON.parse(saved) : [];
  });

  const [repairTickets, setRepairTickets] = useState<RepairTicket[]>(() => {
    const saved = localStorage.getItem('assetmanager_tickets');
    return saved ? JSON.parse(saved) : [];
  });

  const [maintenanceEvents, setMaintenanceEvents] = useState<MaintenanceEvent[]>(() => {
    const saved = localStorage.getItem('assetmanager_events');
    return saved ? JSON.parse(saved) : [];
  });

  // User auth session
  const [user, setUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('assetmanager_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isLoadingFirebase, setIsLoadingFirebase] = useState(true);

  // Load from Firebase on Mount
  useEffect(() => {
    async function loadFirebaseData() {
      try {
        const [fbAssets, fbTickets, fbEvents] = await Promise.all([
          getAssets(),
          getRepairTickets(),
          getMaintenanceEvents()
        ]);
        setAssets(fbAssets);
        setRepairTickets(fbTickets);
        setMaintenanceEvents(fbEvents);
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
  const handleLogin = (email: string, role: 'admin' | 'user', name: string, avatar?: string) => {
    const session: UserSession = {
      email,
      role,
      name,
      avatar: avatar || (role === 'admin'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces')
    };
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
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
        />

        {/* Dynamic routed workspace panel */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto flex-1">
          {activeTab === 'dashboard' && (
            <DashboardView
              assets={assets}
              onTabChange={handleTabChange}
              onSelectAsset={handleSelectAsset}
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

          {activeTab === 'reports' && <ReportsView assets={assets} repairTickets={repairTickets} />}

          {activeTab === 'admin' && user.role === 'admin' && (
            <AdminPortalView assets={assets} triggerToast={triggerToast} />
          )}

          {activeTab === 'settings' && <SettingsView triggerToast={triggerToast} totalAssets={assets.length} />}
        </main>
      </div>
    </div>
  );
}

