import React from 'react';
import { Asset, AssetStatus } from '../types';
import {
  Boxes,
  CheckCircle,
  Wrench,
  AlertTriangle,
  Server,
  Laptop,
  Monitor,
  Network,
  Cpu,
  ChevronRight,
  Plus,
  Eye,
  Filter
} from 'lucide-react';

interface DashboardViewProps {
  assets: Asset[];
  onTabChange: (tab: string) => void;
  onSelectAsset: (id: string) => void;
  onOpenAddModal: () => void;
}

export default function DashboardView({
  assets,
  onTabChange,
  onSelectAsset,
  onOpenAddModal
}: DashboardViewProps) {
  // Compute dynamic stats based on state with pre-seeded offsets for high-fidelity scale
  const totalCount = 1277 + assets.length;
  const activeCount = 1151 + assets.filter(a => a.status === 'In Use' || a.status === 'Available').length;
  const repairCount = 39 + assets.filter(a => a.status === 'Repair').length;
  const expiredCount = 84 + assets.filter(a => a.warrantyExpiryDate === 'Expired').length;

  // Render Category Icon Helper
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'PC':
        return <Cpu className="w-5 h-5 text-sky-600" />;
      case 'Notebook':
        return <Laptop className="w-5 h-5 text-primary" />;
      case 'Server':
        return <Server className="w-5 h-5 text-indigo-600" />;
      case 'Network':
        return <Network className="w-5 h-5 text-emerald-600" />;
      case 'Display':
        return <Monitor className="w-5 h-5 text-amber-600" />;
      default:
        return <Boxes className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-bold text-primary select-none font-sans">
          ระบบบริหารจัดการครุภัณฑ์คอมพิวเตอร์
        </h2>
        <p className="text-sm font-sans text-slate-500 mt-1">
          ภาพรวมข้อมูลทรัพย์สินไอทีประจำวันที่ 24 พฤษภาคม 2567
        </p>
      </div>

      {/* Summary Statistics Cards (Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Assets */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 flex items-center gap-5 shadow-sm hover:shadow-md transition-all">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Boxes className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ครุภัณฑ์ทั้งหมด</p>
            <p className="text-3xl font-bold text-primary font-sans mt-0.5">{totalCount.toLocaleString()}</p>
          </div>
        </div>

        {/* Normal Active */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 flex items-center gap-5 shadow-sm hover:shadow-md transition-all">
          <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ใช้งานปกติ</p>
            <p className="text-3xl font-bold text-emerald-600 font-sans mt-0.5">{activeCount.toLocaleString()}</p>
          </div>
        </div>

        {/* Repairing */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 flex items-center gap-5 shadow-sm hover:shadow-md transition-all">
          <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-secondary shrink-0">
            <Wrench className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">อยู่ระหว่างซ่อม</p>
            <p className="text-3xl font-bold text-secondary font-sans mt-0.5">{repairCount.toLocaleString()}</p>
          </div>
        </div>

        {/* Expired/Near Expiry */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 flex items-center gap-5 shadow-sm hover:shadow-md transition-all">
          <div className="w-14 h-14 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ประกันใกล้หมด</p>
            <p className="text-3xl font-bold text-rose-600 font-sans mt-0.5">{expiredCount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Charts & Focus Bento Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Distribution Card (Donut) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm flex flex-col justify-between">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800 font-sans">การกระจายประเภทครุภัณฑ์</h3>
            <span className="text-xs font-medium text-slate-400 font-sans">แบ่งตามสัดส่วน</span>
          </div>
          <div className="p-6 flex flex-col sm:flex-row gap-8 items-center justify-around flex-grow">
            {/* Interactive SVG Donut Chart */}
            <div className="relative w-40 h-40 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" fill="transparent" r="16" stroke="#e2e8f0" strokeWidth="4"></circle>
                {/* Laptops (45%) */}
                <circle cx="18" cy="18" fill="transparent" r="16" stroke="#00236f" strokeWidth="4" strokeDasharray="45, 100" strokeDashoffset="0"></circle>
                {/* Desktops (25%) */}
                <circle cx="18" cy="18" fill="transparent" r="16" stroke="#0058be" strokeWidth="4" strokeDasharray="25, 100" strokeDashoffset="-45"></circle>
                {/* Servers (20%) */}
                <circle cx="18" cy="18" fill="transparent" r="16" stroke="#10b981" strokeWidth="4" strokeDasharray="20, 100" strokeDashoffset="-70"></circle>
                {/* Monitors (10%) */}
                <circle cx="18" cy="18" fill="transparent" r="16" stroke="#f59e0b" strokeWidth="4" strokeDasharray="10, 100" strokeDashoffset="-90"></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center select-none bg-transparent">
                <span className="text-2xl font-bold text-primary font-sans">100%</span>
                <span className="text-[10px] text-slate-400 font-medium">รวมทุกหมวด</span>
              </div>
            </div>

            {/* Distribution Legend */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl">
                <span className="w-3.5 h-3.5 rounded-full bg-[#00236f] shrink-0"></span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">Notebooks (45%)</p>
                  <p className="text-[11px] text-slate-400 font-medium">578 รายการ</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl">
                <span className="w-3.5 h-3.5 rounded-full bg-[#0058be] shrink-0"></span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">PCs (25%)</p>
                  <p className="text-[11px] text-slate-400 font-medium">321 รายการ</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shrink-0"></span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">Servers (20%)</p>
                  <p className="text-[11px] text-slate-400 font-medium">257 รายการ</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shrink-0"></span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">Monitors (10%)</p>
                  <p className="text-[11px] text-slate-400 font-medium">128 รายการ</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Hardware: Server Cluster Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm flex flex-col justify-between">
          <div className="h-40 relative shrink-0">
            <img
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBVOV1WtDsuvlnBwoDFMHccH1ta9HeTpd5I_PsSLuzYR4Q_j0m0tulHjJ6y9DQUWdnSw5I6egO9WAM3Y5ZtJKt4cJkuugJJCb4nS_3tbvV2LjD81e6SDxWADGSUW-Wwokh7rco3Gj1uscGPswnXmzYkkjEDTPcLRf8RSOyGpjerO5rZWEzqCUFn7o9qiU6P7hrjT2F17rvK_m2jfYPCNJhrHAA3ew4ySg_einR9CkHIt1dfqzlZmEWHMf_YAt1ChBu48_mF4aHZlw"
              alt="Main Server Cluster B"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
            <div className="absolute bottom-4 left-4 text-white">
              <span className="px-2 py-0.5 bg-secondary text-white text-[9px] rounded-lg uppercase font-bold tracking-widest">
                Featured Node
              </span>
              <h4 className="text-lg font-bold mt-1 font-sans">Main Server Cluster B</h4>
            </div>
          </div>

          <div className="p-5 flex-grow flex flex-col justify-between gap-4">
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">สถานะการทำงาน:</span>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-bold">
                  Stable
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">อุณหภูมิเฉลี่ย:</span>
                <span className="font-bold text-slate-700">24°C</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Uptime ต่อเนื่อง:</span>
                <span className="font-bold text-slate-700">142 วัน</span>
              </div>
            </div>

            <button
              onClick={() => alert('จำลองการทำงาน: เข้าสู่ระบบจัดการคลัสเตอร์เซิร์ฟเวอร์หลัก (Server Cluster B)')}
              className="w-full py-2 bg-primary hover:bg-primary-container text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              จัดการโหนดนี้
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity Ledger Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800 font-sans">กิจกรรมล่าสุด (Recent Activity)</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">รายการลงทะเบียนและสถานะครุภัณฑ์ใหม่ในระบบ</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onTabChange('inventory')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>กรองข้อมูล</span>
            </button>
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1 px-3 py-2 bg-primary hover:bg-primary-container text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ลงทะเบียนครุภัณฑ์ใหม่</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">รหัสครุภัณฑ์</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">รายการ</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">ประเภท</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">ผู้ถือครอง</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">วันหมดประกัน</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">สถานะ</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assets.slice(0, 4).map((asset) => {
                const isAssigned = asset.status === 'In Use';
                const isAvailable = asset.status === 'Available';
                const isRepair = asset.status === 'Repair';

                return (
                  <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* ID */}
                    <td className="px-6 py-4 font-mono text-xs font-bold text-primary select-all">
                      {asset.id}
                    </td>

                    {/* Name & Icon */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                          {getCategoryIcon(asset.category)}
                        </div>
                        <span className="font-bold text-slate-700 text-sm truncate max-w-[180px]">
                          {asset.name}
                        </span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4 text-xs font-medium text-slate-600">
                      {asset.category}
                    </td>

                    {/* Assignee */}
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">
                      {asset.assignee ? (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          <span>{asset.assignee.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Expiry */}
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                      {asset.warrantyExpiryDate === 'Expired' ? (
                        <span className="text-rose-500 font-bold">Expired</span>
                      ) : (
                        asset.warrantyExpiryDate
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          isAssigned
                            ? 'bg-blue-50 text-secondary border border-blue-100'
                            : isAvailable
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}
                      >
                        {isAssigned ? 'Assigned' : isAvailable ? 'Available' : 'Repair'}
                      </span>
                    </td>

                    {/* Detail icon action */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => onSelectAsset(asset.id)}
                        className="text-slate-400 hover:text-primary hover:bg-slate-100 p-2 rounded-xl transition-all cursor-pointer"
                        title="ดูรายละเอียด"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer View All Link */}
        <div className="p-4 bg-slate-50/70 text-center border-t border-slate-100">
          <button
            onClick={() => onTabChange('inventory')}
            className="text-xs font-bold text-secondary hover:text-primary inline-flex items-center gap-1 cursor-pointer transition-all hover:underline"
          >
            <span>ดูทะเบียนครุภัณฑ์ทั้งหมด</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
