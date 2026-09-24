import React, { useState } from 'react';
import { Asset, RepairTicket, MaintenanceEvent } from '../types';
import {
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Plus,
  Filter,
  MoreVertical,
  Laptop,
  Server,
  Network,
  Printer,
  X,
  Play,
  CheckSquare,
  Calendar,
  Search,
  Trash2,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface MaintenanceViewProps {
  assets: Asset[];
  repairTickets: RepairTicket[];
  maintenanceEvents: MaintenanceEvent[];
  onAddRepairTicket: (ticket: RepairTicket) => void;
  onUpdateTicketStatus: (id: string, newStatus: 'Pending' | 'Repairing' | 'Completed') => void;
  onDeleteRepairTicket: (id: string) => void;
  onAddMaintenanceEvent: (event: MaintenanceEvent) => void;
  onDeleteMaintenanceEvent: (id: string) => void;
  triggerToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export default function MaintenanceView({
  assets,
  repairTickets,
  maintenanceEvents,
  onAddRepairTicket,
  onUpdateTicketStatus,
  onDeleteRepairTicket,
  onAddMaintenanceEvent,
  onDeleteMaintenanceEvent,
  triggerToast
}: MaintenanceViewProps) {
  // Modal State
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [ticketActionMenuId, setTicketActionMenuId] = useState<string | null>(null);
  const [ticketToCancel, setTicketToCancel] = useState<{ id: string; assetName: string } | null>(null);

  // Pagination State for Repair Tickets Table
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Maintenance Events Modal & Create states
  const [isEventsModalOpen, setIsEventsModalOpen] = useState(false);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [searchEventQuery, setSearchEventQuery] = useState('');
  const [eventToDelete, setEventToDelete] = useState<{ id: string; title: string } | null>(null);

  // Maintenance Event Form States
  const [eventTitle, setEventTitle] = useState('');
  const [eventSubtitle, setEventSubtitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('09:00 - 12:00');
  const [eventLocation, setEventLocation] = useState('');
  const [eventIsActive, setEventIsActive] = useState(true);

  // Form Fields
  const [formAssetId, setFormAssetId] = useState('');
  const [formAssetName, setFormAssetName] = useState('');
  const [formIssue, setFormIssue] = useState('');
  const [formPriority, setFormPriority] = useState<'Low' | 'Medium' | 'Critical'>('Medium');
  const [formRepairType, setFormRepairType] = useState('Hardware');

  const getThaiShortMonthAndDay = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return { month: 'ม.ค.', day: '01' };
    const thMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return {
      month: thMonths[date.getMonth()],
      day: String(date.getDate()).padStart(2, '0')
    };
  };

  const handleSubmitMaintenanceEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventSubtitle.trim() || !eventDate || !eventLocation.trim()) {
      triggerToast('error', 'กรุณากรอกข้อมูลกิจกรรมบำรุงรักษาให้ครบถ้วน');
      return;
    }

    const { month, day } = getThaiShortMonthAndDay(eventDate);
    const newEvent: MaintenanceEvent = {
      id: `EV-${String(Math.floor(Math.random() * 900) + 100)}`,
      title: eventTitle,
      subtitle: eventSubtitle,
      month,
      day,
      time: eventTime,
      location: eventLocation,
      isActive: eventIsActive,
      fullDate: eventDate
    };

    onAddMaintenanceEvent(newEvent);
    
    // Close modal and reset fields
    setIsAddEventModalOpen(false);
    setEventTitle('');
    setEventSubtitle('');
    setEventDate('');
    setEventTime('09:00 - 12:00');
    setEventLocation('');
    setEventIsActive(true);
  };

  // Handle Asset ID Selection to Auto-populate name
  const handleAssetIdChange = (id: string) => {
    setFormAssetId(id);
    const found = assets.find((a) => a.id === id);
    if (found) {
      setFormAssetName(found.name);
    } else {
      setFormAssetName('');
    }
  };

  // Submit Repair Request
  const handleSubmitRepair = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formAssetId || !formAssetName || !formIssue.trim()) {
      triggerToast('error', 'กรุณากรอกข้อมูลรหัสทรัพย์สินและอาการเสียให้ครบถ้วน');
      return;
    }

    const newTicket: RepairTicket = {
      id: `REP-2024-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      assetId: formAssetId,
      assetName: formAssetName,
      category: assets.find((a) => a.id === formAssetId)?.category || 'Computer',
      issue: formIssue,
      status: 'Pending',
      priority: formPriority,
      dateSubmitted: new Date().toISOString().split('T')[0],
      technicianName: 'ช่างเทคนิคเวรประจำวัน',
      repairType: formRepairType
    };

    onAddRepairTicket(newTicket);
    setIsRepairModalOpen(false);

    // Reset Form
    setFormAssetId('');
    setFormAssetName('');
    setFormIssue('');
    setFormPriority('Medium');
    setFormRepairType('Hardware');
  };

  // Compute stats with base offsets
  const pendingCount = 0 + repairTickets.filter((t) => t.status === 'Pending').length;
  const repairingCount = 0 + repairTickets.filter((t) => t.status === 'Repairing').length;
  const completedCount = 0 + repairTickets.filter((t) => t.status === 'Completed').length;

  // Pagination logic for Repair Tickets
  const totalPages = Math.ceil(repairTickets.length / itemsPerPage) || 1;

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [repairTickets.length, totalPages, currentPage]);

  const paginatedTickets = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return repairTickets.slice(startIndex, startIndex + itemsPerPage);
  }, [repairTickets, currentPage, itemsPerPage]);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const getPriorityBadge = (priority: 'Low' | 'Medium' | 'Critical') => {
    switch (priority) {
      case 'Critical':
        return <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-bold text-[9px] select-none">ด่วน (Critical)</span>;
      case 'Medium':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold text-[9px] select-none">ปกติ (Medium)</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-bold text-[9px] select-none">ต่ำ (Low)</span>;
    }
  };

  const getRepairTypeBadge = (repairType?: string) => {
    switch (repairType) {
      case 'Hardware':
        return <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100/80 rounded-full text-[9.5px] font-bold">ฮาร์ดแวร์ (Hardware)</span>;
      case 'Software':
        return <span className="px-2.5 py-0.5 bg-sky-50 text-sky-700 border border-sky-100/80 rounded-full text-[9.5px] font-bold">ซอฟต์แวร์ (Software)</span>;
      case 'Network':
        return <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100/80 rounded-full text-[9.5px] font-bold">เครือข่าย (Network)</span>;
      case 'Peripherals':
        return <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100/80 rounded-full text-[9.5px] font-bold">อุปกรณ์ต่อพ่วง (Peripherals)</span>;
      case 'Security':
        return <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-100/80 rounded-full text-[9.5px] font-bold">ความปลอดภัย (Security)</span>;
      case 'Maintenance':
        return <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 border border-teal-100/80 rounded-full text-[9.5px] font-bold">บำรุงรักษา (Maintenance)</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-slate-50 text-slate-600 border border-slate-200/80 rounded-full text-[9.5px] font-bold">อื่น ๆ (Other)</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-sans">ระบบบริหารการซ่อมบำรุง</h2>
          <p className="text-sm text-slate-500 font-sans mt-1">
            จัดการรายการแจ้งซ่อม ตรวจสอบสถานะ และตารางการป้องกันบำรุงรักษาประจำปี
          </p>
        </div>
        <button
          onClick={() => setIsRepairModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>แจ้งซ่อมอุปกรณ์ (Request Repair)</span>
        </button>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Side: Status Overviews and Repair Tickets */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          
          {/* Status Indicators Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Pending Card */}
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex flex-col gap-3 shadow-sm hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                <Clock className="w-5.5 h-5.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">รอดำเนินการ</p>
                <h3 className="text-3xl font-extrabold text-slate-800 font-sans mt-0.5">{pendingCount}</h3>
              </div>
              <p className="text-xs text-rose-600 flex items-center gap-1 font-semibold select-none" />
            </div>

            {/* Repairing Card */}
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex flex-col gap-3 shadow-sm hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-secondary">
                <Wrench className="w-5.5 h-5.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">กำลังดำเนินการ</p>
                <h3 className="text-3xl font-extrabold text-slate-800 font-sans mt-0.5">{repairingCount}</h3>
              </div>
              <p className="text-xs text-slate-400 font-medium">ตามแผนงานปกติ</p>
            </div>

            {/* Completed Card */}
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex flex-col gap-3 shadow-sm hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-5.5 h-5.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">เสร็จสมบูรณ์</p>
                <h3 className="text-3xl font-extrabold text-slate-800 font-sans mt-0.5">{completedCount}</h3>
              </div>
              <p className="text-xs text-emerald-600 font-semibold select-none">ในเดือนนี้</p>
            </div>
          </div>

          {/* Repair Tickets Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 font-sans">รายการแจ้งซ่อมปัจจุบัน</h3>
              
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                  <span>แสดง:</span>
                  <div className="relative">
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="appearance-none pl-3 pr-7 py-1 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs rounded-xl focus:outline-none transition-all cursor-pointer shadow-sm"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                  <span>รายการต่อหน้า</span>
                </div>

                <div className="text-xs text-slate-400 font-medium">
                  แสดง <span className="text-slate-800 font-semibold">{repairTickets.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, repairTickets.length)}</span> จาก{' '}
                  <span className="text-slate-800 font-semibold">{repairTickets.length}</span> รายการ
                </div>
                
                <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-500 hover:bg-slate-50 transition-colors bg-white select-none cursor-pointer">
                  <Filter className="w-3.5 h-3.5" />
                  <span>กรองข้อมูล</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/40 text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">เลขอ้างอิง</th>
                    <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">อุปกรณ์ / รหัสทรัพย์สิน</th>
                    <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">อาการเสีย</th>
                    <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">ระดับ</th>
                    <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider">สถานะ</th>
                    <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedTickets.map((ticket) => {
                    const isPending = ticket.status === 'Pending';
                    const isRepairing = ticket.status === 'Repairing';
                    const isCompleted = ticket.status === 'Completed';

                    return (
                      <tr key={ticket.id} className="hover:bg-slate-50/40 transition-colors duration-150">
                        <td className="px-6 py-4 font-mono text-xs font-semibold text-primary">{ticket.id}</td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-xs font-bold text-slate-800">{ticket.assetName}</p>
                            <p className="text-[10px] text-slate-400 font-semibold font-mono mt-0.5">{ticket.assetId}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5 max-w-[200px]">
                            <div className="flex flex-wrap gap-1">
                              {getRepairTypeBadge(ticket.repairType)}
                            </div>
                            <p className="text-xs font-semibold text-slate-600 truncate" title={ticket.issue}>
                              {ticket.issue}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">{getPriorityBadge(ticket.priority)}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              isPending
                                ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                : isRepairing
                                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isPending ? 'bg-rose-500' : isRepairing ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                            ></span>
                            {isPending ? 'รอดำเนินการ' : isRepairing ? 'กำลังซ่อม' : 'เสร็จสมบูรณ์'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right relative">
                          <button
                            onClick={() => setTicketActionMenuId(ticketActionMenuId === ticket.id ? null : ticket.id)}
                            className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Quick action floating menu */}
                          {ticketActionMenuId === ticket.id && (
                            <>
                              {/* Invisible backdrop to dismiss menu on click outside */}
                              <div
                                className="fixed inset-0 z-40 bg-transparent cursor-default"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTicketActionMenuId(null);
                                }}
                              />
                              <div className="absolute right-12 top-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 min-w-[160px] text-left animate-in fade-in duration-100">
                                {isPending && (
                                  <button
                                    onClick={() => {
                                      onUpdateTicketStatus(ticket.id, 'Repairing');
                                      setTicketActionMenuId(null);
                                      triggerToast('info', `ปรับสถานะเป็น "กำลังซ่อม" สำหรับ ${ticket.id}`);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Play className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                    <span>เริ่มดำเนินการซ่อม</span>
                                  </button>
                                )}
                                {(isPending || isRepairing) && (
                                  <button
                                    onClick={() => {
                                      onUpdateTicketStatus(ticket.id, 'Completed');
                                      setTicketActionMenuId(null);
                                      triggerToast('success', `เสร็จสิ้นการซ่อมแซมใบงาน ${ticket.id}`);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-2 cursor-pointer"
                                  >
                                    <CheckSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    <span>ซ่อมเสร็จสมบูรณ์</span>
                                  </button>
                                )}
                                
                                {/* Cancel/Delete Ticket Action */}
                                <button
                                  onClick={() => {
                                    setTicketToCancel({ id: ticket.id, assetName: ticket.assetName });
                                    setTicketActionMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-rose-50 text-xs font-semibold text-rose-600 flex items-center gap-2 cursor-pointer border-t border-slate-100"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                  <span>ยกเลิกใบสั่งซ่อม</span>
                                </button>

                                <button
                                  onClick={() => setTicketActionMenuId(null)}
                                  className="w-full text-left px-4 py-1.5 hover:bg-slate-50 text-xs font-bold text-slate-500 flex items-center gap-2 border-t border-slate-100 mt-1 cursor-pointer"
                                >
                                  <span>ปิดเมนู</span>
                                </button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer Navigation */}
            <div className="p-5 bg-slate-50/70 border-t border-slate-100 flex justify-between items-center">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-[11px] text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>ก่อนหน้า</span>
              </button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map(p => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-7 h-7 rounded-lg font-bold text-[11px] font-sans transition-all cursor-pointer ${
                      currentPage === p
                        ? 'bg-primary text-white'
                        : 'hover:bg-slate-100 text-slate-500'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-[11px] text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>ถัดไป</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Preventive Maintenance */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          
          {/* Preventive Maintenance Calendar Schedule */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden flex-1">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 font-sans">ตารางบำรุงรักษา</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddEventModalOpen(true)}
                  className="flex items-center gap-0.5 text-[#00236f] hover:text-[#00236f]/80 text-[11px] font-bold cursor-pointer"
                  title="เพิ่มกิจกรรมบำรุงรักษา"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มกิจกรรม</span>
                </button>
                <div className="h-3 w-[1px] bg-slate-200"></div>
                <button
                  onClick={() => setIsEventsModalOpen(true)}
                  className="text-secondary text-xs font-bold hover:underline cursor-pointer"
                >
                  ดูทั้งหมด
                </button>
              </div>
            </div>

            {/* List entries */}
            <div className="p-5 space-y-5 flex-1">
              {maintenanceEvents.length === 0 ? (
                <div className="text-center py-8 text-slate-400 font-medium text-xs">
                  ไม่มีกิจกรรมบำรุงรักษา
                </div>
              ) : (
                maintenanceEvents.slice(0, 4).map((event) => {
                  return (
                    <div
                      key={event.id}
                      className={`flex justify-between items-start border-l-3 pl-4 py-1 transition-all group ${
                        event.isActive ? 'border-primary' : 'border-slate-300 opacity-65 hover:opacity-100'
                      }`}
                    >
                      <div className="flex gap-4">
                        {/* Calendar visual widget */}
                        <div className="flex flex-col items-center justify-center min-w-[50px] py-1.5 bg-slate-50 border border-slate-100 rounded-xl select-none shrink-0">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{event.month}</span>
                          <span className="text-lg font-extrabold text-primary font-sans mt-0.5">{event.day}</span>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-800 leading-snug">{event.title}</h4>
                          <p className="text-[11px] text-slate-400 font-medium">{event.subtitle}</p>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-secondary font-sans bg-blue-50/60 w-fit px-1.5 py-0.5 rounded-lg border border-blue-50">
                            <Clock className="w-3 h-3 text-secondary" />
                            <span>{event.time}</span>
                          </div>
                        </div>
                      </div>

                      {/* Delete action button */}
                      <button
                        onClick={() => {
                          setEventToDelete({ id: event.id, title: event.title });
                        }}
                        className="text-slate-300 hover:text-rose-600 p-1 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                        title="ลบกิจกรรม"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Request Repair Popup Form */}
      {isRepairModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[999] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            {/* Modal Title */}
            <div className="p-5 border-b border-slate-100 bg-primary text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <Wrench className="w-5.5 h-5.5" />
                <h3 className="font-bold text-lg font-sans">แบบฟอร์มแจ้งซ่อมอุปกรณ์</h3>
              </div>
              <button
                onClick={() => setIsRepairModalOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form content */}
            <form onSubmit={handleSubmitRepair} className="p-6 space-y-5">
              {/* Asset Select Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    เลือกครุภัณฑ์ในระบบ *
                  </label>
                  <select
                    required
                    value={formAssetId}
                    onChange={(e) => handleAssetIdChange(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary/20 bg-white"
                  >
                    <option value="">-- กรุณาเลือกครุภัณฑ์ --</option>
                    {[...assets]
                      .sort((a, b) => (a.id || '').localeCompare(b.id || '', undefined, { numeric: true, sensitivity: 'base' }))
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.id} - {a.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    ชื่ออุปกรณ์ (Auto-filled)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formAssetName}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-500 bg-slate-50 font-medium cursor-not-allowed focus:outline-none"
                    placeholder="เลือกครุภัณฑ์เพื่อเติมอัตโนมัติ"
                  />
                </div>
              </div>

              {/* Repair Type Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  ประเภทเคส / หมวดหมู่การซ่อมแซม *
                </label>
                <select
                  required
                  value={formRepairType}
                  onChange={(e) => setFormRepairType(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary/20 bg-white font-medium"
                >
                  <option value="Hardware">ปัญหาด้านฮาร์ดแวร์ / ตัวเครื่องชำรุด (Hardware Issue)</option>
                  <option value="Software">ปัญหาซอฟต์แวร์ / ระบบปฏิบัติการ (Software / OS & Apps Issue)</option>
                  <option value="Network">ระบบเครือข่าย / อินเทอร์เน็ต (Network & Wi-Fi)</option>
                  <option value="Peripherals">อุปกรณ์ต่อพ่วง / เครื่องพิมพ์ (Peripherals & Printer)</option>
                  <option value="Security">ความปลอดภัย / สิทธิ์การใช้งาน (Security & Access)</option>
                  <option value="Maintenance">ขอรับการบำรุงรักษา / ทำความสะอาด (Maintenance & Cleaning)</option>
                  <option value="Other">อื่น ๆ (Other)</option>
                </select>
              </div>

              {/* Priority radios */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  ระดับความสำคัญ / ความเร่งด่วน
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="radio"
                      name="priority"
                      checked={formPriority === 'Low'}
                      onChange={() => setFormPriority('Low')}
                      className="text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-600">ต่ำ (Low)</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="radio"
                      name="priority"
                      checked={formPriority === 'Medium'}
                      onChange={() => setFormPriority('Medium')}
                      className="text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-600">ปกติ (Medium)</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 border-rose-100 hover:bg-rose-50/20 transition-colors">
                    <input
                      type="radio"
                      name="priority"
                      checked={formPriority === 'Critical'}
                      onChange={() => setFormPriority('Critical')}
                      className="text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-rose-600">ด่วน (Critical)</span>
                  </label>
                </div>
              </div>

              {/* Issue Description textarea */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  รายละเอียดอาการเสียและอาการขัดข้อง *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formIssue}
                  onChange={(e) => setFormIssue(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3.5 focus:ring-2 focus:ring-secondary/20 outline-none text-xs text-slate-800 resize-none font-medium"
                  placeholder="กรุณาระบุอาการขัดข้องที่พบโดยละเอียด เช่น หน้าจอดับสุ่มเสี่ยง, เชื่อมเน็ตไม่เข้า..."
                ></textarea>
              </div>

              {/* Form buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRepairModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  ส่งคำขอแจ้งซ่อม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: View All Maintenance Events */}
      {isEventsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[999] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[85vh]">
            {/* Modal Title */}
            <div className="p-5 border-b border-slate-100 bg-[#00236f] text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5.5 h-5.5" />
                <h3 className="font-bold text-lg font-sans">ตารางการป้องกันบำรุงรักษา (Preventive Maintenance)</h3>
              </div>
              <button
                onClick={() => setIsEventsModalOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body with Filter */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchEventQuery}
                    onChange={(e) => setSearchEventQuery(e.target.value)}
                    placeholder="ค้นหาแผนงานบำรุงรักษา..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none"
                  />
                </div>
                {/* Add new event from here also */}
                <button
                  onClick={() => {
                    setIsEventsModalOpen(false);
                    setIsAddEventModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-xl shadow-sm transition-all shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มแผนงานใหม่</span>
                </button>
              </div>

              {/* Maintenance Events Table or Cards List */}
              <div className="space-y-3">
                {maintenanceEvents.filter(event => 
                  event.title.toLowerCase().includes(searchEventQuery.toLowerCase()) ||
                  event.subtitle.toLowerCase().includes(searchEventQuery.toLowerCase()) ||
                  event.location.toLowerCase().includes(searchEventQuery.toLowerCase())
                ).length === 0 ? (
                  <div className="text-center py-12 text-slate-400 font-medium text-xs">
                    ไม่พบข้อมูลแผนงานบำรุงรักษาที่ค้นหา
                  </div>
                ) : (
                  maintenanceEvents.filter(event => 
                    event.title.toLowerCase().includes(searchEventQuery.toLowerCase()) ||
                    event.subtitle.toLowerCase().includes(searchEventQuery.toLowerCase()) ||
                    event.location.toLowerCase().includes(searchEventQuery.toLowerCase())
                  ).map((event) => (
                    <div
                      key={event.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all gap-4 ${
                        event.isActive ? 'border-primary/30 bg-blue-50/10' : 'border-slate-100 bg-slate-50/30'
                      }`}
                    >
                      <div className="flex gap-4 items-start">
                        {/* Calendar Icon Widget */}
                        <div className="flex flex-col items-center justify-center min-w-[50px] py-1.5 bg-white border border-slate-200 rounded-xl select-none shrink-0 shadow-xs">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{event.month}</span>
                          <span className="text-lg font-extrabold text-primary font-sans mt-0.5">{event.day}</span>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                            <span>{event.title}</span>
                            {event.isActive && (
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[8px] font-bold rounded">Active</span>
                            )}
                          </h4>
                          <p className="text-[11px] text-slate-400 font-semibold">{event.subtitle}</p>
                          <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{event.location}</span>
                          </p>
                        </div>
                      </div>

                      {/* Time and details */}
                      <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-bold text-secondary font-sans bg-blue-50 px-2 py-1 rounded-lg border border-blue-50/50">
                          {event.time}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] text-slate-400 font-mono">ID: {event.id}</span>
                          <button
                            onClick={() => {
                              setEventToDelete({ id: event.id, title: event.title });
                            }}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md transition-all cursor-pointer"
                            title="ลบแผนงาน"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <button
                onClick={() => setIsEventsModalOpen(false)}
                className="px-5 py-2 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add Maintenance Event */}
      {isAddEventModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[999] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            {/* Modal Title */}
            <div className="p-5 border-b border-slate-100 bg-[#00236f] text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5.5 h-5.5 text-sky-400" />
                <h3 className="font-bold text-lg font-sans">เพิ่มแผนงานบำรุงรักษา (Add Preventive Maintenance)</h3>
              </div>
              <button
                onClick={() => setIsAddEventModalOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form content */}
            <form onSubmit={handleSubmitMaintenanceEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  หัวข้อกิจกรรมบำรุงรักษา *
                </label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="เช่น อัปเดตแพทช์ความปลอดภัยระบบ OS เซิร์ฟเวอร์"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary/20 bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  รายละเอียดเพิ่มเติม / ผู้ดูแลสังกัด *
                </label>
                <input
                  type="text"
                  required
                  value={eventSubtitle}
                  onChange={(e) => setEventSubtitle(e.target.value)}
                  placeholder="เช่น บริษัท ดีเซนทรัล ซัพพอร์ท หรือ ตึก 3 ชั้น 1-5"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary/20 bg-white font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    วันที่จัดกิจกรรม *
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary/20 bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    ช่วงเวลาจัดกิจกรรม *
                  </label>
                  <input
                    type="text"
                    required
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    placeholder="เช่น 09:00 - 12:00"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary/20 bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  สถานที่จัดงานบำรุงรักษา *
                </label>
                <input
                  type="text"
                  required
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="เช่น Server Room B หรือ ห้องประชุมตึกเอ"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary/20 bg-white font-medium"
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="eventIsActive"
                  checked={eventIsActive}
                  onChange={(e) => setEventIsActive(e.target.checked)}
                  className="w-4 h-4 text-primary focus:ring-primary border-slate-300 rounded cursor-pointer"
                />
                <label htmlFor="eventIsActive" className="text-xs font-semibold text-slate-600 cursor-pointer select-none">
                  กำหนดสถานะเป็นแผนงานหลักที่มีผลทันที (Active Plan)
                </label>
              </div>

              {/* Form buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddEventModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#00236f] hover:bg-[#00236f]/90 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  บันทึกกิจกรรม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Delete Event Confirmation */}
      {eventToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[1000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-100 bg-rose-50/50 flex items-center gap-2.5">
              <Trash2 className="w-5 h-5 text-rose-600 animate-bounce" />
              <h3 className="font-bold text-slate-800 text-sm font-sans">ยืนยันการลบแผนงานบำรุงรักษา</h3>
            </div>
            
            <div className="p-6 space-y-3">
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                คุณแน่ใจหรือไม่ว่าต้องการลบกิจกรรมการบำรุงรักษา:
              </p>
              <div className="p-3 bg-rose-50/30 border border-rose-100 rounded-xl">
                <p className="text-xs font-bold text-slate-800 leading-snug">{eventToDelete.title}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-1">ID: {eventToDelete.id}</p>
              </div>
              <p className="text-[11px] text-rose-500 font-medium">
                * ข้อมูลที่ถูกลบจะไม่สามารถกู้คืนกลับมาได้
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEventToDelete(null)}
                className="px-4 py-2 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteMaintenanceEvent(eventToDelete.id);
                  setEventToDelete(null);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Cancel Repair Ticket Confirmation */}
      {ticketToCancel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[1000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-100 bg-rose-50/50 flex items-center gap-2.5">
              <Trash2 className="w-5 h-5 text-rose-600 animate-bounce" />
              <h3 className="font-bold text-slate-800 text-sm font-sans">ยืนยันการยกเลิกใบสั่งซ่อม</h3>
            </div>
            
            <div className="p-6 space-y-3">
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                คุณแน่ใจหรือไม่ว่าต้องการยกเลิกและลบใบสั่งซ่อมนี้:
              </p>
              <div className="p-3 bg-rose-50/30 border border-rose-100 rounded-xl">
                <p className="text-xs font-bold text-slate-800 leading-snug">{ticketToCancel.assetName}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-1">เลขอ้างอิงใบงาน: {ticketToCancel.id}</p>
              </div>
              <p className="text-[11px] text-rose-500 font-medium">
                * ใบสั่งซ่อมจะถูกยกเลิกและนำออกจากระบบบริหารการซ่อมบำรุง
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setTicketToCancel(null)}
                className="px-4 py-2 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteRepairTicket(ticketToCancel.id);
                  setTicketToCancel(null);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                ยืนยันการยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
