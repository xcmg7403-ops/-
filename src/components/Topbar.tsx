import React, { useState } from 'react';
import { Search, AlertTriangle, Bell, HelpCircle, Scan, Menu } from 'lucide-react';
import { Asset, UserSession } from '../types';
import QRScannerModal from './QRScannerModal';

interface TopbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalMaintenanceAlerts: number;
  onAlertClick: () => void;
  assets: Asset[];
  onSelectAsset: (id: string) => void;
  triggerToast: (type: 'success' | 'error' | 'info', message: string) => void;
  onToggleSidebar: () => void;
  user: UserSession;
}

export default function Topbar({
  searchQuery,
  onSearchChange,
  totalMaintenanceAlerts,
  onAlertClick,
  assets,
  onSelectAsset,
  triggerToast,
  onToggleSidebar,
  user,
}: TopbarProps) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  return (
    <header className="fixed top-0 right-0 w-full lg:w-[calc(100%-240px)] h-16 bg-white border-b border-slate-200 z-40 flex justify-between items-center px-4 sm:px-6 lg:px-8 shadow-sm">
      {/* Search Input Area */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-xl transition-colors cursor-pointer mr-1 shrink-0"
          title="เปิดเมนูด้านข้าง"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h2 className="text-sm sm:text-base font-bold text-slate-800 hidden md:block select-none font-sans shrink-0">
          AssetManager IT
        </h2>

        <div className="relative w-full max-w-xs sm:max-w-md flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-9 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-full text-xs font-sans text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00236f]/20 focus:border-secondary transition-all"
              placeholder="ค้นหาครุภัณฑ์, ซีเรียล..."
            />
            {/* Scan button inside search box */}
            <button
              onClick={() => setIsScannerOpen(true)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#00236f] transition-all cursor-pointer p-1 flex items-center justify-center"
              title="สแกน QR Code ครุภัณฑ์"
            >
              <Scan className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Action Icons Area */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Alerts Chip */}
        <button
          onClick={onAlertClick}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-full text-[10px] sm:text-xs font-semibold border border-rose-100 transition-colors cursor-pointer select-none"
        >
          <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-600" />
          <span className="hidden sm:inline">Alerts ({totalMaintenanceAlerts})</span>
          <span className="sm:hidden">({totalMaintenanceAlerts})</span>
        </button>

        <div className="h-6 w-[1px] bg-slate-200 hidden xs:block mx-0.5 sm:mx-1"></div>

        {/* Notification Bell */}
        <button
          onClick={() => alert('ไม่มีการแจ้งเตือนใหม่')}
          className="text-slate-400 hover:text-slate-700 hover:bg-slate-50 p-1.5 sm:p-2 rounded-full transition-all relative cursor-pointer"
          title="การแจ้งเตือน"
        >
          <Bell className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-secondary rounded-full"></span>
        </button>

        {/* Help Outlines */}
        <button
          onClick={() => alert('คู่มือการใช้งาน: กรุณาติดต่อแผนกไอทีที่เบอร์ Ext. 101')}
          className="text-slate-400 hover:text-slate-700 hover:bg-slate-50 p-1.5 sm:p-2 rounded-full transition-all cursor-pointer hidden sm:block"
          title="ช่วยเหลือ"
        >
          <HelpCircle className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
        </button>

        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 overflow-hidden bg-slate-50 shrink-0 select-none shadow-sm ml-0.5 sm:ml-1" title={user.name}>
          <img
            className="w-full h-full object-cover"
            src={user.avatar}
            alt={user.name}
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        assets={assets}
        onSelectAsset={onSelectAsset}
        triggerToast={triggerToast}
      />
    </header>
  );
}

