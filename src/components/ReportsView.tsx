import React, { useState, useMemo } from 'react';
import { Asset, RepairTicket } from '../types';
import { jsPDF } from 'jspdf';
import {
  BarChart3,
  Wallet,
  Award,
  Activity,
  Heart,
  Wrench,
  Clock,
  AlertTriangle,
  CheckCircle,
  Printer,
  Calendar,
  Download,
  ChevronDown,
  FileText,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  User
} from 'lucide-react';

interface ReportsViewProps {
  assets: Asset[];
  repairTickets: RepairTicket[];
}

export default function ReportsView({ assets, repairTickets }: ReportsViewProps) {
  // Navigation tabs: 'assets' or 'maintenance'
  const [activeReportTab, setActiveReportTab] = useState<'assets' | 'maintenance'>('maintenance');

  // Month-Year Selection State for Maintenance Report
  // Default to 2024-05 since it is the month with seed/mock data, but allow selection of others.
  const [selectedYear, setSelectedYear] = useState<string>('2024');
  const [selectedMonth, setSelectedMonth] = useState<string>('05');

  // Available months/years list calculated dynamically from existing tickets
  const yearOptions = useMemo(() => {
    const years = new Set<string>();
    repairTickets.forEach(t => {
      if (t.dateSubmitted) {
        const y = t.dateSubmitted.substring(0, 4);
        if (/^\d{4}$/.test(y)) years.add(y);
      }
    });
    // Add current year and 2026 if not already present
    years.add('2024');
    years.add('2025');
    years.add('2026');
    return Array.from(years).sort().reverse();
  }, [repairTickets]);

  const monthNamesThai = [
    { value: '01', label: 'มกราคม' },
    { value: '02', label: 'กุมภาพันธ์' },
    { value: '03', label: 'มีนาคม' },
    { value: '04', label: 'เมษายน' },
    { value: '05', label: 'พฤษภาคม' },
    { value: '06', label: 'มิถุนายน' },
    { value: '07', label: 'กรกฎาคม' },
    { value: '08', label: 'สิงหาคม' },
    { value: '09', label: 'กันยายน' },
    { value: '10', label: 'ตุลาคม' },
    { value: '11', label: 'พฤศจิกายน' },
    { value: '12', label: 'ธันวาคม' }
  ];

  // Asset Cost Breakdown Calculations
  const totalInvestment = assets.reduce((sum, asset) => sum + asset.purchasePrice, 0);
  const averagePrice = assets.length > 0 ? Math.round(totalInvestment / assets.length) : 0;
  const activePercent = Math.round(
    (assets.filter((a) => a.status === 'In Use' || a.status === 'Available').length / assets.length) * 100
  );

  const categorySummary = assets.reduce((acc, asset) => {
    acc[asset.category] = (acc[asset.category] || 0) + asset.purchasePrice;
    return acc;
  }, {} as { [key: string]: number });

  // --- Maintenance Monthly calculations ---
  const filteredTickets = useMemo(() => {
    const targetPrefix = `${selectedYear}-${selectedMonth}`;
    return repairTickets.filter(t => t.dateSubmitted && t.dateSubmitted.startsWith(targetPrefix));
  }, [repairTickets, selectedYear, selectedMonth]);

  const monthlyStats = useMemo(() => {
    const total = filteredTickets.length;
    const completed = filteredTickets.filter(t => t.status === 'Completed').length;
    const repairing = filteredTickets.filter(t => t.status === 'Repairing').length;
    const pending = filteredTickets.filter(t => t.status === 'Pending').length;
    
    const critical = filteredTickets.filter(t => t.priority === 'Critical').length;
    const medium = filteredTickets.filter(t => t.priority === 'Medium').length;
    const low = filteredTickets.filter(t => t.priority === 'Low').length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      repairing,
      pending,
      critical,
      medium,
      low,
      completionRate
    };
  }, [filteredTickets]);

  // Overall statistics trend (last few months count for comparison)
  const monthlyTrendData = useMemo(() => {
    const trends: { [key: string]: number } = {};
    repairTickets.forEach(t => {
      if (t.dateSubmitted && t.dateSubmitted.length >= 7) {
        const monthKey = t.dateSubmitted.substring(0, 7); // YYYY-MM
        trends[monthKey] = (trends[monthKey] || 0) + 1;
      }
    });

    // Sort key keys
    return Object.entries(trends)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, count]) => {
        const [y, m] = key.split('-');
        const nameObj = monthNamesThai.find(item => item.value === m);
        const nameThai = nameObj ? nameObj.label.substring(0, 3) : m;
        return {
          key,
          label: `${nameThai} ${y.substring(2)}`,
          count
        };
      });
  }, [repairTickets]);

  // Generate and Download Maintenance Report PDF (Using English to ensure perfect rendering across all browsers/systems)
  const handleDownloadMaintenancePdf = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const monthNamesEnglish = [
      { value: '01', label: 'January' },
      { value: '02', label: 'February' },
      { value: '03', label: 'March' },
      { value: '04', label: 'April' },
      { value: '05', label: 'May' },
      { value: '06', label: 'June' },
      { value: '07', label: 'July' },
      { value: '08', label: 'August' },
      { value: '09', label: 'September' },
      { value: '10', label: 'October' },
      { value: '11', label: 'November' },
      { value: '12', label: 'December' }
    ];

    const activeMonthName = monthNamesEnglish.find(m => m.value === selectedMonth)?.label || selectedMonth;

    // A4 width: 210mm, margins: 15mm
    const marginX = 15;
    let currentY = 15;

    // Header Title
    doc.setTextColor(0, 35, 111); // Deep Navy blue
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('MONTHLY MAINTENANCE MANAGEMENT REPORT', marginX, currentY);
    currentY += 6;

    doc.setFontSize(11);
    doc.setTextColor(100, 110, 120);
    doc.text(`Monthly summary report of maintenance system: ${activeMonthName} ${selectedYear}`, marginX, currentY);
    currentY += 4;

    // Navy horizontal line divider
    doc.setDrawColor(0, 35, 111);
    doc.setLineWidth(0.5);
    doc.line(marginX, currentY, 210 - marginX, currentY);
    currentY += 10;

    // Section 1: Executive KPI Metrics
    doc.setTextColor(40, 50, 60);
    doc.setFontSize(12);
    doc.setFont('Helvetica', 'bold');
    doc.text('1. Key Performance Indicators (KPIs)', marginX, currentY);
    currentY += 7;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setDrawColor(220, 225, 230);
    doc.setLineWidth(0.15);
    
    // Draw simple table for statistics
    const statRows = [
      ['KPI Metrics', 'Count / Value', 'Percentage / Target'],
      ['Total Repair Tickets', `${monthlyStats.total} Tickets`, '100%'],
      ['Completed Work Tickets', `${monthlyStats.completed} Tickets`, `${monthlyStats.completionRate}%`],
      ['Repairing / In Progress Tickets', `${monthlyStats.repairing} Tickets`, `${monthlyStats.total > 0 ? Math.round((monthlyStats.repairing / monthlyStats.total) * 100) : 0}%`],
      ['Pending Review / Approval Tickets', `${monthlyStats.pending} Tickets`, `${monthlyStats.total > 0 ? Math.round((monthlyStats.pending / monthlyStats.total) * 100) : 0}%`],
      ['Critical Priority Cases', `${monthlyStats.critical} Tickets`, `${monthlyStats.total > 0 ? Math.round((monthlyStats.critical / monthlyStats.total) * 100) : 0}%`]
    ];

    let kpiY = currentY;
    statRows.forEach((row, rowIndex) => {
      if (rowIndex === 0) {
        doc.setFont('Helvetica', 'bold');
        doc.setFillColor(240, 244, 250);
        doc.rect(marginX, kpiY, 180, 7, 'F');
      } else {
        doc.setFont('Helvetica', 'normal');
      }
      
      // Draw grid lines
      doc.rect(marginX, kpiY, 180, 7);
      
      doc.text(row[0], marginX + 3, kpiY + 5);
      doc.text(row[1], marginX + 110, kpiY + 5);
      doc.text(row[2], marginX + 150, kpiY + 5);
      
      kpiY += 7;
    });

    currentY = kpiY + 10;

    // Section 2: Detailed Repair Log
    doc.setTextColor(40, 50, 60);
    doc.setFontSize(12);
    doc.setFont('Helvetica', 'bold');
    doc.text('2. Monthly Repair Logs', marginX, currentY);
    currentY += 7;

    if (filteredTickets.length === 0) {
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text('No maintenance or repair tickets recorded in this month.', marginX, currentY);
    } else {
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);

      const tableHeaders = ['Ticket ID', 'Asset Name', 'Reported Issue', 'Priority', 'Status'];
      const colWidths = [24, 42, 58, 26, 30];
      const startX = marginX;

      // Draw header
      doc.setFillColor(245, 247, 250);
      doc.rect(startX, currentY, 180, 8, 'F');
      doc.rect(startX, currentY, 180, 8);
      
      doc.setFont('Helvetica', 'bold');
      let xOffset = startX;
      tableHeaders.forEach((h, idx) => {
        doc.text(h, xOffset + 2, currentY + 5.5);
        xOffset += colWidths[idx];
      });

      currentY += 8;
      doc.setFont('Helvetica', 'normal');

      filteredTickets.forEach((ticket) => {
        if (currentY > 270) {
          doc.addPage();
          currentY = 15;
          
          // Reprint headers on new page
          doc.setFillColor(245, 247, 250);
          doc.rect(startX, currentY, 180, 8, 'F');
          doc.rect(startX, currentY, 180, 8);
          doc.setFont('Helvetica', 'bold');
          let pageXOffset = startX;
          tableHeaders.forEach((h, idx) => {
            doc.text(h, pageXOffset + 2, currentY + 5.5);
            pageXOffset += colWidths[idx];
          });
          currentY += 8;
          doc.setFont('Helvetica', 'normal');
        }

        doc.rect(startX, currentY, 180, 8);
        
        let rowX = startX;
        // Text values
        doc.text(ticket.id, rowX + 2, currentY + 5.5);
        rowX += colWidths[0];
        
        // Clean Thai text from asset name to avoid corrupted fonts
        const cleanAssetName = /[^\x00-\x7F]/.test(ticket.assetName) ? `Asset: ${ticket.assetId}` : ticket.assetName;
        let nameShort = cleanAssetName;
        if (nameShort.length > 20) nameShort = nameShort.substring(0, 18) + '..';
        doc.text(nameShort, rowX + 2, currentY + 5.5);
        rowX += colWidths[1];

        // Clean Thai text from issue to avoid corrupted fonts
        const cleanIssue = /[^\x00-\x7F]/.test(ticket.issue) ? `${ticket.priority} priority request` : ticket.issue;
        let issueShort = cleanIssue;
        if (issueShort.length > 28) issueShort = issueShort.substring(0, 26) + '..';
        doc.text(issueShort, rowX + 2, currentY + 5.5);
        rowX += colWidths[2];

        doc.text(ticket.priority, rowX + 2, currentY + 5.5);
        rowX += colWidths[3];

        doc.text(ticket.status, rowX + 2, currentY + 5.5);

        currentY += 8;
      });
    }

    // Sign off stamp
    currentY += 12;
    if (currentY > 265) {
      doc.addPage();
      currentY = 15;
    }
    doc.setTextColor(110, 120, 130);
    doc.setFontSize(8);
    const datePrinted = new Date().toLocaleString('en-US');
    doc.text(`Generated by: Asset Management System • Report Date: ${datePrinted}`, marginX, currentY);

    // Save File
    doc.save(`Monthly_Maintenance_Report_${selectedYear}_${selectedMonth}.pdf`);
  };

  // Browser Print Trigger helper
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-sans">รายงานและสถิติระบบบริหารจัดการ</h2>
          <p className="text-sm text-slate-500 font-sans mt-1">
            รายงานวิเคราะห์ข้อมูลครุภัณฑ์ และระบบบริหารการจัดการงานซ่อมบำรุงรายเดือน
          </p>
        </div>
        
        {/* Navigation Switch Tabs */}
        <div className="flex bg-slate-200/60 p-1 rounded-2xl border border-slate-200 w-fit shrink-0 self-start sm:self-center">
          <button
            onClick={() => setActiveReportTab('maintenance')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeReportTab === 'maintenance'
                ? 'bg-white text-primary shadow-sm border border-slate-100'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>รายงานซ่อมบำรุงรายเดือน</span>
          </button>
          <button
            onClick={() => setActiveReportTab('assets')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeReportTab === 'assets'
                ? 'bg-white text-primary shadow-sm border border-slate-100'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>สถิติครุภัณฑ์และการเงิน</span>
          </button>
        </div>
      </div>

      {/* ======================= TAB 1: MAINTENANCE SYSTEM REPORT ======================= */}
      {activeReportTab === 'maintenance' && (
        <div className="space-y-6">
          
          {/* Controls Bar */}
          <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                <Calendar className="w-4 h-4 text-primary" />
                <span>ประจำปี-เดือน:</span>
              </div>
              
              {/* Year Selector */}
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer focus:ring-1 focus:ring-primary transition-all"
                >
                  {yearOptions.map(yr => (
                    <option key={yr} value={yr}>ค.ศ. {yr}</option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 absolute right-3.5 top-3.5 pointer-events-none text-slate-400" />
              </div>

              {/* Month Selector */}
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer focus:ring-1 focus:ring-primary transition-all"
                >
                  {monthNamesThai.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 absolute right-3.5 top-3.5 pointer-events-none text-slate-400" />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintReport}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์หน้านี้ (Print View)</span>
              </button>
              <button
                onClick={handleDownloadMaintenancePdf}
                className="px-4 py-2 bg-primary hover:bg-primary-container text-white rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลด Report PDF</span>
              </button>
            </div>
          </div>

          {/* Monthly KPI Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Total Monthly Request Tickets */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                <Wrench className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ใบแจ้งซ่อมทั้งหมดประจำเดือน</p>
                <h4 className="text-2xl font-extrabold text-slate-800 mt-0.5">{monthlyStats.total} รายการ</h4>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">ในรอบช่วงเวลาที่เลือก</p>
              </div>
            </div>

            {/* Pending Requests */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">งานที่ยังรอดำเนินการซ่อม</p>
                <h4 className="text-2xl font-extrabold text-amber-600 mt-0.5">
                  {monthlyStats.pending + monthlyStats.repairing} รายการ
                </h4>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  รอตรวจ: {monthlyStats.pending} • กำลังซ่อม: {monthlyStats.repairing}
                </p>
              </div>
            </div>

            {/* Completed Work count */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ดำเนินการเสร็จสมบูรณ์</p>
                <h4 className="text-2xl font-extrabold text-emerald-600 mt-0.5">{monthlyStats.completed} รายการ</h4>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">ส่งมอบครุภัณฑ์คืนผู้ใช้แล้ว</p>
              </div>
            </div>

            {/* Resolution/Completion Rate % */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">อัตราซ่อมสำเร็จ (SLA)</p>
                <h4 className="text-2xl font-extrabold text-blue-600 mt-0.5">{monthlyStats.completionRate}%</h4>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">เป้าหมายมาตรฐานบริษัท &gt; 80%</p>
              </div>
            </div>
          </div>

          {/* Maintenance Visual Charts Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Monthly Trend Bar Representation */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-bold text-slate-800 font-sans text-sm">สถิติจำนวนงานซ่อมแซมแต่ละเดือน</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">แสดงแนวโน้มปริมาณปัญหาขัดข้องเพื่อวางแผนบำรุงรักษาเชิงป้องกัน</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-1 rounded border border-slate-100">
                    Monthly Maintenance Load
                  </span>
                </div>

                <div className="space-y-4 pt-2">
                  {monthlyTrendData.length > 0 ? (
                    monthlyTrendData.slice(-5).map((trend) => {
                      const maxVal = Math.max(...monthlyTrendData.map(t => t.count), 1);
                      const percent = Math.round((trend.count / maxVal) * 100);
                      const isCurrent = trend.key === `${selectedYear}-${selectedMonth}`;

                      return (
                        <div key={trend.key} className="flex items-center gap-4">
                          <span className={`w-16 text-xs font-bold ${isCurrent ? 'text-primary font-extrabold' : 'text-slate-500'}`}>
                            {trend.label}
                          </span>
                          <div className="flex-1 bg-slate-50 border border-slate-100 h-6 rounded-lg overflow-hidden flex items-center px-1">
                            <div
                              className={`h-4 rounded-md transition-all duration-1000 flex items-center justify-end pr-2 font-mono text-[9px] font-bold text-white ${
                                isCurrent ? 'bg-primary' : 'bg-slate-400'
                              }`}
                              style={{ width: `${Math.max(percent, 8)}%` }}
                            >
                              {trend.count > 0 && `${trend.count}`}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-10 text-xs text-slate-400">
                      ไม่พบข้อมูลแนวโน้มปริมาณใบงานซ่อมแซม
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-6 flex justify-between items-center text-[11px] text-slate-500 font-medium">
                <span>ปริมาณเฉลี่ยใบงาน: {Math.round(repairTickets.length / Math.max(monthlyTrendData.length, 1))} รายการ/เดือน</span>
                <span className="text-emerald-600 font-semibold">ระบบพร้อมทำงาน</span>
              </div>
            </div>

            {/* Right: Urgent & Priority breakdown details */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-bold text-slate-800 font-sans text-sm">การจัดลำดับความเร่งด่วนของใบแจ้งซ่อม</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">สัดส่วนความเร่งด่วน (Urgency Priorities) ของใบงานเดือนนี้</p>
                  </div>
                  <AlertTriangle className="w-4 h-4 text-slate-400" />
                </div>

                <div className="space-y-4">
                  {/* Critical */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-red-600 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                        วิกฤต / ด่วนที่สุด (Critical)
                      </span>
                      <span className="font-mono text-slate-500">
                        {monthlyStats.critical} รายการ ({monthlyStats.total > 0 ? Math.round((monthlyStats.critical / monthlyStats.total) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-red-500 h-full rounded-full"
                        style={{ width: `${monthlyStats.total > 0 ? (monthlyStats.critical / monthlyStats.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Medium */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-amber-500 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        เร่งด่วนปานกลาง (Medium)
                      </span>
                      <span className="font-mono text-slate-500">
                        {monthlyStats.medium} รายการ ({monthlyStats.total > 0 ? Math.round((monthlyStats.medium / monthlyStats.total) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-400 h-full rounded-full"
                        style={{ width: `${monthlyStats.total > 0 ? (monthlyStats.medium / monthlyStats.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Low */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-blue-500 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        ทั่วไป / ทั่วไป (Low)
                      </span>
                      <span className="font-mono text-slate-500">
                        {monthlyStats.low} รายการ ({monthlyStats.total > 0 ? Math.round((monthlyStats.low / monthlyStats.total) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-400 h-full rounded-full"
                        style={{ width: `${monthlyStats.total > 0 ? (monthlyStats.low / monthlyStats.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] text-slate-500 leading-relaxed mt-6">
                ℹ️ <strong>ระเบียบปฏิบัติมาตรฐาน:</strong> กรณีงานวิกฤต (Critical) ต้องได้รับการเข้าตรวจสอบสถานะโดยเจ้าหน้าที่ฝ่ายเทคนิคคอมพิวเตอร์ภายในระยะเวลาไม่เกิน 2 ชั่วโมงหลังได้รับเรื่องแจ้งซ่อมแซม
              </div>
            </div>
          </div>

          {/* List of Repair Tickets for the Selected Month */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">รายการบันทึกใบแจ้งซ่อมประจำเดือนนี้</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  แสดงข้อมูลงานแจ้งซ่อมที่ได้รับการร้องเรียนขึ้นทะเบียนเข้ามาในระบบประวัติภายในเดือนนี้
                </p>
              </div>
              <span className="text-xs font-bold font-mono text-primary bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                พบ {filteredTickets.length} บันทึกรายการ
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/60 text-slate-400 text-xs border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5 font-bold uppercase tracking-wider">รหัสใบงาน</th>
                    <th className="px-6 py-3.5 font-bold uppercase tracking-wider">ชื่อครุภัณฑ์ที่อ้างอิง</th>
                    <th className="px-6 py-3.5 font-bold uppercase tracking-wider">ปัญหา / อาการชำรุด</th>
                    <th className="px-6 py-3.5 font-bold uppercase tracking-wider">ความเร่งด่วน</th>
                    <th className="px-6 py-3.5 font-bold uppercase tracking-wider">วันที่แจ้งเรื่อง</th>
                    <th className="px-6 py-3.5 font-bold uppercase tracking-wider">ช่างผู้ดูแล</th>
                    <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-right">สถานะดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                  {filteredTickets.length > 0 ? (
                    filteredTickets.map((ticket) => {
                      const isCompleted = ticket.status === 'Completed';
                      const isRepairing = ticket.status === 'Repairing';
                      const isPending = ticket.status === 'Pending';

                      return (
                        <tr key={ticket.id} className="hover:bg-slate-50/30 transition-colors duration-150">
                          {/* ID */}
                          <td className="px-6 py-4 font-mono font-bold text-slate-900">{ticket.id}</td>
                          
                          {/* Asset Name */}
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-800">{ticket.assetName}</p>
                            <span className="font-mono text-[9px] text-slate-400">{ticket.assetId}</span>
                          </td>

                          {/* Issue */}
                          <td className="px-6 py-4 max-w-xs truncate" title={ticket.issue}>
                            {ticket.issue}
                          </td>

                          {/* Priority */}
                          <td className="px-6 py-4">
                            {ticket.priority === 'Critical' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100">
                                วิกฤต
                              </span>
                            ) : ticket.priority === 'Medium' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                                ปานกลาง
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                                ทั่วไป
                              </span>
                            )}
                          </td>

                          {/* Date */}
                          <td className="px-6 py-4 font-mono text-[10px]">{ticket.dateSubmitted}</td>

                          {/* Technician */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                                <User className="w-3 h-3 text-slate-400" />
                              </div>
                              <span className="font-medium text-slate-700">{ticket.technicianName || 'รอมอบหมาย'}</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4 text-right">
                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                ซ่อมเสร็จสิ้น
                              </span>
                            ) : isRepairing ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                กำลังดำเนินการ
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                รอดำเนินการ
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                        ไม่พบประวัติรายการแจ้งซ่อมบำรุงประจำรอบเดือน {monthNamesThai.find(m => m.value === selectedMonth)?.label} ค.ศ. {selectedYear}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 2: ORIGINAL GENERAL FINANCIAL REPORTS ======================= */}
      {activeReportTab === 'assets' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Reports Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Value */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">มูลค่าครุภัณฑ์รวม</p>
                <h4 className="text-xl font-bold text-slate-800 mt-0.5">฿{totalInvestment.toLocaleString()}</h4>
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">รวมทุกหมวดหมู่สินค้า</p>
              </div>
            </div>

            {/* Avg Value */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">มูลค่าเฉลี่ยต่อชิ้น</p>
                <h4 className="text-xl font-bold text-slate-800 mt-0.5">฿{averagePrice.toLocaleString()}</h4>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">คำนวณจากหน่วยระบบจริง</p>
              </div>
            </div>

            {/* Efficiency */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">อัตราใช้งานจริง (Utility)</p>
                <h4 className="text-xl font-bold text-slate-800 mt-0.5">{activePercent}%</h4>
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">อยู่ในเกณฑ์ดีเยี่ยม</p>
              </div>
            </div>

            {/* Health status */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">อัตราสัดส่วนพร้อมใช้</p>
                <h4 className="text-xl font-bold text-slate-800 mt-0.5">
                  {Math.round((assets.filter(a => a.status === 'Available').length / assets.length) * 100)}%
                </h4>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">พร้อมจัดส่งให้พนักงานใหม่</p>
              </div>
            </div>
          </div>

          {/* Breakdown graphs and premium indicators */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Category breakdown bar graph representation */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 font-sans text-sm">การจัดสรรงบประมาณแยกตามหมวดหมู่</h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Capital Budget Allocation</span>
              </div>

              <div className="space-y-4">
                {Object.entries(categoriesMapThai).map(([key, label]) => {
                  const value = categorySummary[key] || 0;
                  const percent = totalInvestment > 0 ? Math.round((value / totalInvestment) * 100) : 0;
                  return (
                    <div key={key} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700">{label}</span>
                        <span className="font-mono text-slate-500">฿{value.toLocaleString()} ({percent}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-1000"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Highest-value hardware items table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between gap-4">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 font-sans text-sm">ทรัพย์สินที่มีมูลค่าการจัดซื้อสูงสุด</h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Top Capital Assets</span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-[280px] pr-1 custom-scrollbar">
                {assets
                  .slice()
                  .sort((a, b) => b.purchasePrice - a.purchasePrice)
                  .slice(0, 5)
                  .map((asset, i) => {
                    return (
                      <div key={asset.id} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs select-none">
                            {i + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{asset.name}</p>
                            <p className="text-[10px] font-mono text-slate-400 mt-0.5">{asset.id} • {asset.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-extrabold text-slate-800">฿{asset.purchasePrice.toLocaleString()}</p>
                          <span className="text-[9px] text-slate-400 font-semibold">Acquisition cost</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Translate mapping
const categoriesMapThai: { [key: string]: string } = {
  'PC': 'คอมพิวเตอร์ตั้งโต๊ะ (PC)',
  'Notebook': 'คอมพิวเตอร์พกพา (Notebook)',
  'Server': 'ตู้เซิร์ฟเวอร์หลัก (Mainframe / Clusters)',
  'Network': 'อุปกรณ์เครือข่ายความปลอดภัย (Cisco, Switch)',
  'Display': 'หน้าจอแสดงผลประสิทธิภาพสูง',
  'Peripherals': 'อุปกรณ์เครื่องพิมพ์และต่อพ่วงสำนักงาน'
};
