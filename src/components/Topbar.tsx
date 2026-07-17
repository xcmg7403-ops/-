import React, { useState, useRef, useEffect } from 'react';
import { Search, AlertTriangle, Bell, HelpCircle, Scan, Menu, X, Check, Eye } from 'lucide-react';
import { Asset, UserSession, RepairTicket } from '../types';
import QRScannerModal from './QRScannerModal';

interface TopbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalMaintenanceAlerts: number;
  onAlertClick: () => void;
  assets: Asset[];
  repairTickets: RepairTicket[];
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
  repairTickets,
  onSelectAsset,
  triggerToast,
  onToggleSidebar,
  user,
}: TopbarProps) {
  const [orgName, setOrgName] = useState(() => {
    return localStorage.getItem('assetmanager_org_name') || 'AssetManager IT';
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setOrgName(localStorage.getItem('assetmanager_org_name') || 'AssetManager IT');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [dismissedTicketIds, setDismissedTicketIds] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeNotifications = repairTickets.filter(
    (t) => (t.status === 'Pending' || t.status === 'Repairing') && !dismissedTicketIds.includes(t.id)
  );

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
          {orgName}
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
        <div className="relative flex items-center" ref={dropdownRef}>
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className={`text-slate-400 hover:text-slate-700 hover:bg-slate-50 p-1.5 sm:p-2 rounded-full transition-all relative cursor-pointer ${
              isNotificationOpen ? 'bg-slate-50 text-slate-700' : ''
            }`}
            title="การแจ้งเตือน"
          >
            <Bell className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            {activeNotifications.length > 0 && (
              <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-rose-500 rounded-full animate-pulse"></span>
            )}
          </button>

          {isNotificationOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-slate-200/80 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Dropdown Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
                <div>
                  <h3 className="font-bold text-slate-800 text-xs font-sans">การแจ้งเตือนระบบ</h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    คุณมี {activeNotifications.length} รายการที่ยังไม่ได้ดำเนินการ
                  </p>
                </div>
                {activeNotifications.length > 0 && (
                  <button
                    onClick={() => {
                      setDismissedTicketIds(prev => [...prev, ...activeNotifications.map(t => t.id)]);
                      triggerToast('success', 'ทำเครื่องหมายอ่านแล้วทั้งหมดเรียบร้อยแล้ว');
                    }}
                    className="text-[10px] font-bold text-[#00236f] hover:underline cursor-pointer"
                  >
                    ล้างทั้งหมด
                  </button>
                )}
              </div>

              {/* Dropdown List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {activeNotifications.length > 0 ? (
                  activeNotifications.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-4 hover:bg-slate-50/80 transition-colors flex gap-3 relative group"
                    >
                      <div className="shrink-0 mt-0.5">
                        <span className={`w-2 h-2 rounded-full inline-block ${
                          ticket.priority === 'Critical' ? 'bg-rose-500 animate-pulse' : ticket.priority === 'Medium' ? 'bg-amber-500' : 'bg-slate-400'
                        }`} />
                      </div>
                      
                      <div className="flex-1 min-w-0 pr-12">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-mono font-bold text-slate-400">{ticket.id}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            ticket.status === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {ticket.status === 'Pending' ? 'รอดำเนินการ' : 'กำลังซ่อม'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 truncate">{ticket.assetName}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate font-medium">{ticket.issue}</p>
                        <p className="text-[9px] text-slate-400 mt-1 font-mono">{ticket.dateSubmitted}</p>
                      </div>

                      {/* Action buttons inside item */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            onSelectAsset(ticket.assetId);
                            setIsNotificationOpen(false);
                          }}
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-[#00236f] transition-all cursor-pointer"
                          title="ดูรายละเอียดครุภัณฑ์"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDismissedTicketIds(prev => [...prev, ticket.id]);
                            triggerToast('info', `ซ่อนการแจ้งเตือนสำหรับใบสั่งซ่อม ${ticket.id}`);
                          }}
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-rose-500 transition-all cursor-pointer"
                          title="ซ่อนการแจ้งเตือน"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mx-auto">
                      <Check className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">ไม่มีการแจ้งเตือนใหม่</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">ระบบเชื่อมต่อคลาวด์และครุภัณฑ์ทำงานปกติดี</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Dropdown Footer */}
              <div className="p-3 bg-slate-50/70 border-t border-slate-100 text-center">
                <button
                  onClick={() => {
                    onAlertClick();
                    setIsNotificationOpen(false);
                  }}
                  className="text-xs font-bold text-[#00236f] hover:text-secondary hover:underline cursor-pointer transition-all"
                >
                  ดูรายการซ่อมบำรุงทั้งหมด
                </button>
              </div>
            </div>
          )}
        </div>

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

