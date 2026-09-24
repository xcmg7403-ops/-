import React from 'react';
import { LayoutDashboard, Boxes, Wrench, BarChart3, Settings, LogOut, ShieldAlert } from 'lucide-react';
import { UserSession } from '../types';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  user: UserSession;
  onLogout: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  orgName?: string;
}

export default function Sidebar({ 
  currentTab, 
  onTabChange, 
  user, 
  onLogout, 
  isMobileOpen, 
  onCloseMobile,
  orgName
}: SidebarProps) {
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Display Admin Portal for admin role OR users with permissions to manage users or master data
  const canAccessAdmin = user.role === 'admin' || user.permissions?.canManageUsers || user.permissions?.canManageMasterData;
  if (canAccessAdmin) {
    menuItems.push({ id: 'admin', label: 'Admin & Master Data', icon: ShieldAlert });
  }

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    onCloseMobile(); // Close mobile drawer when user navigates
  };

  return (
    <>
      {/* Mobile Dark Backdrop overlay */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile} 
          className="lg:hidden fixed inset-0 bg-slate-900/45 backdrop-blur-xs z-40 transition-opacity duration-300"
        />
      )}

      <aside 
        id="sidebar-container" 
        className={`fixed left-0 top-0 h-full w-[240px] bg-white border-r border-slate-200 flex flex-col py-6 px-4 z-50 shadow-md transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="mb-8 px-2 flex justify-between items-center">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-primary tracking-tight truncate max-w-[170px]" title={orgName || 'AssetManager'}>
              {orgName || 'AssetManager'}
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">IT Infrastructure</p>
          </div>
          {/* Close button for mobile */}
          <button 
            onClick={onCloseMobile}
            className="lg:hidden p-1 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id || (item.id === 'inventory' && currentTab === 'details');
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 text-left cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-secondary border-l-4 border-secondary font-semibold shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-secondary' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User profile footer */}
        <div className="mt-auto border-t border-slate-100 pt-6">
          <div className="flex items-center gap-3 p-1 rounded-lg">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shadow-sm shrink-0">
              <img
                className="w-full h-full object-cover"
                src={user.avatar}
                alt={user.name}
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate leading-none mb-1">
                {user.name.split(' ')[0]}
              </p>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-mono font-bold text-[#00236f] truncate">
                  @{user.username || (user.role === 'admin' ? 'admin' : 'user')}
                </span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-500 font-bold uppercase">
                  {user.role === 'admin' ? 'Admin' : 'Staff'}
                </span>
              </div>
            </div>
            <button 
              title="ออกจากระบบ"
              onClick={onLogout}
              className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-all shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

