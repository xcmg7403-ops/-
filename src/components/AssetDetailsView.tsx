import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { Asset, AssetStatus } from '../types';
import {
  ChevronRight,
  Printer,
  History,
  Edit2,
  Cpu,
  Laptop,
  Server,
  Network,
  Monitor,
  Boxes,
  QrCode,
  Download,
  ShoppingCart,
  User,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';

interface AssetDetailsViewProps {
  asset: Asset;
  onBackToInventory: () => void;
  onEditAsset: (asset: Asset) => void;
  onTriggerLogRepair: (assetId: string) => void;
  triggerToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export default function AssetDetailsView({
  asset,
  onBackToInventory,
  onEditAsset,
  onTriggerLogRepair,
  triggerToast
}: AssetDetailsViewProps) {
  // Modal State for quick inline edit
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (asset.id) {
      QRCode.toDataURL(asset.id, {
        width: 300,
        margin: 1.5,
        color: {
          dark: '#00236f', // Match the deep primary theme color
          light: '#ffffff'
        }
      })
      .then(url => {
        setQrCodeUrl(url);
      })
      .catch(err => {
        console.error('Failed to generate QR Code:', err);
      });
    }
  }, [asset.id]);

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `QR_Code_${asset.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('success', `ดาวน์โหลดรูปภาพ QR Code ของครุภัณฑ์ ${asset.id} สำเร็จ`);
  };

  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = async () => {
    setIsExporting(true);
    triggerToast('info', 'กำลังจัดทำรายงานผลการขึ้นทะเบียนและการตรวจสอบ (Audit PDF)...');

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1700;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // 1. Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1200, 1700);

      // 2. Deep Blue Top Header Banner
      ctx.fillStyle = '#00236f';
      ctx.fillRect(0, 0, 1200, 160);

      // Title Text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('IT ASSET COMPLIANCE AUDIT REPORT', 80, 70);

      // Subtitle
      ctx.fillStyle = '#a5f3fc';
      ctx.font = '15px sans-serif';
      ctx.fillText('รายงานทะเบียนประวัติและการตรวจสอบสภาพครุภัณฑ์ไอทีฉบับสมบูรณ์', 80, 110);

      // Top Right Document Info
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('DOCUMENT TYPE: AUDIT PROFILE', 1120, 60);
      ctx.font = '11px sans-serif';
      ctx.fillText(`PRINTED ON: ${new Date().toLocaleString('th-TH')}`, 1120, 90);
      ctx.fillText(`AUDIT ID: IA-${asset.id}-${new Date().getFullYear()}`, 1120, 115);

      // Reset text alignment
      ctx.textAlign = 'left';

      // Load QR Code Image
      let qrImg: HTMLImageElement | null = null;
      try {
        if (qrCodeUrl) {
          qrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(e);
            img.src = qrCodeUrl;
          });
        }
      } catch (err) {
        console.error('QR load failed inside PDF:', err);
      }

      // Draw QR Tag Panel Box on the right
      const qrBoxX = 840;
      const qrBoxY = 200;
      const qrBoxW = 280;
      const qrBoxH = 360;
      const radius = 16;

      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      
      // Draw rounded rect manually for backward compatibility
      ctx.beginPath();
      ctx.moveTo(qrBoxX + radius, qrBoxY);
      ctx.arcTo(qrBoxX + qrBoxW, qrBoxY, qrBoxX + qrBoxW, qrBoxY + qrBoxH, radius);
      ctx.arcTo(qrBoxX + qrBoxW, qrBoxY + qrBoxH, qrBoxX, qrBoxY + qrBoxH, radius);
      ctx.arcTo(qrBoxX, qrBoxY + qrBoxH, qrBoxX, qrBoxY, radius);
      ctx.arcTo(qrBoxX, qrBoxY, qrBoxX + qrBoxW, qrBoxY, radius);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (qrImg) {
        ctx.drawImage(qrImg, qrBoxX + 40, qrBoxY + 30, 200, 200);
      }

      // Label inside QR Box
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SECURE ASSET TAG', qrBoxX + (qrBoxW / 2), qrBoxY + 265);

      ctx.fillStyle = '#00236f';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(asset.id, qrBoxX + (qrBoxW / 2), qrBoxY + 295);

      ctx.fillStyle = '#64748b';
      ctx.font = '11px sans-serif';
      ctx.fillText('สแกนเพื่อตรวจสอบความถูกต้องในระบบ', qrBoxX + (qrBoxW / 2), qrBoxY + 325);

      // Reset text alignment
      ctx.textAlign = 'left';

      // 3. Section 1 - General Asset Information
      ctx.fillStyle = '#00236f';
      ctx.fillRect(80, 200, 730, 36);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('ข้อมูลทะเบียนประวัติครุภัณฑ์ทั่วไป (GENERAL INFORMATION)', 100, 223);

      let currentY = 275;
      const drawRow = (label: string, value: string, fontBoldValue = false) => {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#64748b';
        ctx.font = '14px sans-serif';
        ctx.fillText(label, 90, currentY);
        
        ctx.fillStyle = '#0f172a';
        ctx.font = fontBoldValue ? 'bold 14px sans-serif' : '14px sans-serif';
        ctx.fillText(value || '-', 360, currentY);

        // Subtle separator line
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(80, currentY + 12);
        ctx.lineTo(810, currentY + 12);
        ctx.stroke();

        currentY += 40;
      };

      const categoryLabel = asset.category === 'PC' 
        ? 'PC (คอมพิวเตอร์ตั้งโต๊ะ)' 
        : asset.category === 'Notebook' 
        ? 'Notebook (โน้ตบุ๊ก)' 
        : asset.category;

      const statusText = asset.status === 'In Use'
        ? 'ใช้งานปกติ (Active)'
        : asset.status === 'Available'
        ? 'พร้อมเบิกใช้งาน (Available)'
        : 'อยู่ระหว่างซ่อมบำรุง (Repair)';

      drawRow('รหัสครุภัณฑ์ (Asset ID)', asset.id, true);
      drawRow('ชื่อครุภัณฑ์ (Asset Name)', asset.name, true);
      drawRow('ยี่ห้อ / แบรนด์ (Brand)', asset.brand || '-');
      drawRow('รุ่นครุภัณฑ์ (Model)', asset.model || '-');
      drawRow('กลุ่มหมวดหมู่ (Category)', categoryLabel);
      drawRow('หมายเลขซีเรียล (Serial No.)', asset.serialNumber || '-');
      drawRow('แผนกผู้ครอบครอง (Department)', asset.department || '-');
      drawRow('ฝ่ายการทำงาน (Division)', asset.division || '-');
      drawRow('ผู้รับผิดชอบหลัก (Responsible)', asset.responsiblePerson || '-');
      drawRow('สถานะปัจจุบัน (Status)', statusText, true);
      drawRow('ราคากลางจัดซื้อ (Purchase Price)', asset.purchasePrice ? `${asset.purchasePrice.toLocaleString()} บาท` : '-');

      // 4. Section 2 - Technical Profile Specifications
      currentY = 740;
      ctx.fillStyle = '#00236f';
      ctx.fillRect(80, currentY, 1040, 36);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('คุณสมบัติและคุณลักษณะเฉพาะทางเทคนิค (TECHNICAL SPECIFICATIONS)', 100, currentY + 23);

      currentY += 65;

      const drawSpecRow = (label1: string, val1: string, label2: string, val2: string) => {
        ctx.textAlign = 'left';
        
        // Col 1
        ctx.fillStyle = '#64748b';
        ctx.font = '14px sans-serif';
        ctx.fillText(label1, 90, currentY);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(val1 || '-', 280, currentY);

        // Col 2
        ctx.fillStyle = '#64748b';
        ctx.font = '14px sans-serif';
        ctx.fillText(label2, 630, currentY);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(val2 || '-', 850, currentY);

        // Divider
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(80, currentY + 12);
        ctx.lineTo(1120, currentY + 12);
        ctx.stroke();

        currentY += 42;
      };

      drawSpecRow('ระบบปฏิบัติการ (OS)', asset.specOS || '-', 'หน่วยประมวลผล (CPU)', asset.specCPU || '-');
      drawSpecRow('หน่วยความจำ (RAM)', asset.specRAM || '-', 'ความจุพื้นที่เก็บข้อมูล (Storage)', asset.specStorage || '-');
      drawSpecRow('ที่อยู่ไอพี (IP Address)', asset.ipAddress || '-', 'ผู้จัดจำหน่าย (Vendor)', asset.vendor || '-');
      drawSpecRow('ที่อยู่แมคไวไฟ (MAC Wi-Fi)', asset.macWifi || '-', 'ที่อยู่แมคแลน (MAC LAN)', asset.macLan || '-');

      // 5. Section 3 - Additional Detailed Audit Specs (if available)
      if (asset.detailedSpecs && asset.detailedSpecs.length > 0) {
        currentY += 15;
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(80, currentY, 1040, 32);
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('รายการตรวจสอบและขึ้นทะเบียนคุณสมบัติเพิ่มเติม (ADDITIONAL SYSTEM AUDITS)', 100, currentY + 20);

        currentY += 55;

        asset.detailedSpecs.forEach((spec) => {
          ctx.fillStyle = '#475569';
          ctx.font = '13px sans-serif';
          ctx.fillText(spec.item, 90, currentY);

          ctx.fillStyle = '#0f172a';
          ctx.font = '13px sans-serif';
          ctx.fillText(spec.details, 420, currentY);

          // Status Badge / Check
          const isOk = spec.status.includes('ปกติ') || spec.status.toLowerCase().includes('pass') || spec.status.toLowerCase().includes('ok');
          ctx.fillStyle = isOk ? '#10b981' : '#f59e0b';
          ctx.font = 'bold 13px sans-serif';
          ctx.fillText(spec.status, 960, currentY);

          // Divider
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(80, currentY + 10);
          ctx.lineTo(1120, currentY + 10);
          ctx.stroke();

          currentY += 36;
        });
      }

      // 6. Section 4 - Auditor Authorization Signature Panel
      currentY = Math.max(currentY + 40, 1340);

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;

      // Draw Sign lines
      ctx.beginPath();
      ctx.moveTo(120, currentY + 60);
      ctx.lineTo(480, currentY + 60);
      ctx.moveTo(720, currentY + 60);
      ctx.lineTo(1080, currentY + 60);
      ctx.stroke();

      ctx.fillStyle = '#334155';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ลงชื่อ.............................................................. ผู้ตรวจสอบ', 300, currentY + 90);
      ctx.fillText('(....................................................................)', 300, currentY + 115);
      ctx.fillStyle = '#64748b';
      ctx.font = '11px sans-serif';
      ctx.fillText('ตำแหน่ง: IT Officer / Auditor', 300, currentY + 135);

      ctx.fillStyle = '#334155';
      ctx.textAlign = 'center';
      ctx.fillText('ลงชื่อ.............................................................. ผู้ตรวจรับรอง', 900, currentY + 90);
      ctx.fillText('(....................................................................)', 900, currentY + 115);
      ctx.fillStyle = '#64748b';
      ctx.font = '11px sans-serif';
      ctx.fillText('ตำแหน่ง: CIO / ผู้ช่วยผู้อำนวยการฝ่ายไอที', 900, currentY + 135);

      // 7. Footer Block
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(80, 1600);
      ctx.lineTo(1120, 1600);
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      ctx.fillText('เอกสารรายงานฉบับนี้จัดทำขึ้นโดยอัตโนมัติผ่านแพลตฟอร์มบริหารจัดการทะเบียนประวัติครุภัณฑ์ของฝ่ายเทคโนโลยีสารสนเทศ', 80, 1635);
      ctx.fillText('Printed & verified via AssetManager IT Intelligent Tagging Platform. Confidential & Proprietary.', 80, 1655);

      ctx.textAlign = 'right';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('หน้า 1 จาก 1', 1120, 1635);

      // Convert Canvas to PDF
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [1200, 1700],
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, 1200, 1700);
      pdf.save(`IT_Asset_Audit_Report_${asset.id}.pdf`);

      triggerToast('success', `ส่งออกไฟล์รายงาน PDF ครุภัณฑ์รหัส ${asset.id} สำเร็จ`);
    } catch (err) {
      console.error('PDF Export failed:', err);
      triggerToast('error', 'ไม่สามารถส่งออก PDF ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsExporting(false);
    }
  };

  // Form Fields State
  const [activeTab, setActiveTab] = useState<'general' | 'purchase' | 'technical'>('general');
  const [formName, setFormName] = useState(asset.name);
  const [formSerial, setFormSerial] = useState(asset.serialNumber);
  const [formCategory, setFormCategory] = useState<string>(asset.category);
  const [formDept, setFormDept] = useState(asset.department);
  const [formStatus, setFormStatus] = useState<AssetStatus>(asset.status);
  const [formPrice, setFormPrice] = useState<number>(asset.purchasePrice);
  const [formCPU, setFormCPU] = useState(asset.specCPU || '');
  const [formRAM, setFormRAM] = useState(asset.specRAM || '');
  const [formStorage, setFormStorage] = useState(asset.specStorage || '');
  const [formOS, setFormOS] = useState(asset.specOS || '');
  const [formBrand, setFormBrand] = useState(asset.brand || '');
  const [formModel, setFormModel] = useState(asset.model || '');
  const [formDivision, setFormDivision] = useState(asset.division || '');
  const [formResponsible, setFormResponsible] = useState(asset.responsiblePerson || '');
  const [formIP, setFormIP] = useState(asset.ipAddress || '');
  const [formWifi, setFormWifi] = useState(asset.macWifi || '');
  const [formLan, setFormLan] = useState(asset.macLan || '');
  const [formRemarks, setFormRemarks] = useState(asset.remarks || '');
  const [formVendor, setFormVendor] = useState(asset.vendor || '');
  const [formPO, setFormPO] = useState(asset.purchaseOrder || '');
  const [formPurchaseDate, setFormPurchaseDate] = useState(asset.purchaseDate || '');
  const [formExpiryDate, setFormExpiryDate] = useState(asset.warrantyExpiryDate || '');
  const [formImageUrl, setFormImageUrl] = useState(asset.imageUrl || '');

  // Sync form states with asset prop changes
  useEffect(() => {
    setFormName(asset.name);
    setFormSerial(asset.serialNumber);
    setFormCategory(asset.category);
    setFormDept(asset.department);
    setFormStatus(asset.status);
    setFormPrice(asset.purchasePrice);
    setFormCPU(asset.specCPU || '');
    setFormRAM(asset.specRAM || '');
    setFormStorage(asset.specStorage || '');
    setFormOS(asset.specOS || '');
    setFormBrand(asset.brand || '');
    setFormModel(asset.model || '');
    setFormDivision(asset.division || '');
    setFormResponsible(asset.responsiblePerson || '');
    setFormIP(asset.ipAddress || '');
    setFormWifi(asset.macWifi || '');
    setFormLan(asset.macLan || '');
    setFormRemarks(asset.remarks || '');
    setFormVendor(asset.vendor || '');
    setFormPO(asset.purchaseOrder || '');
    setFormPurchaseDate(asset.purchaseDate || '');
    setFormExpiryDate(asset.warrantyExpiryDate || '');
    setFormImageUrl(asset.imageUrl || '');
  }, [asset]);

  // Handle save of inline edits
  const handleSaveInline = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedAsset: Asset = {
      ...asset,
      name: formName,
      serialNumber: formSerial,
      category: formCategory as any,
      department: formDept,
      status: formStatus,
      purchasePrice: Number(formPrice),
      specCPU: formCPU || undefined,
      specRAM: formRAM || undefined,
      specStorage: formStorage || undefined,
      specOS: formOS || undefined,
      brand: formBrand || undefined,
      model: formModel || undefined,
      division: formDivision || undefined,
      responsiblePerson: formResponsible || undefined,
      ipAddress: formIP || undefined,
      macWifi: formWifi || undefined,
      macLan: formLan || undefined,
      remarks: formRemarks || undefined,
      vendor: formVendor || undefined,
      purchaseOrder: formPO || undefined,
      purchaseDate: formPurchaseDate || undefined,
      warrantyExpiryDate: formExpiryDate || undefined,
      imageUrl: formImageUrl || undefined
    };

    onEditAsset(updatedAsset);
    setIsEditOpen(false);
    triggerToast('success', `อัปเดตรายละเอียดครุภัณฑ์ ${asset.id} สำเร็จแล้ว`);
  };

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
        return <Boxes className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Breadcrumbs and Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1.5">
            <button onClick={onBackToInventory} className="hover:text-primary transition-colors cursor-pointer">
              Inventory
            </button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-800 font-semibold">{asset.category}</span>
          </nav>
          <h2 className="text-2xl font-bold text-slate-800 font-sans">รายละเอียดครุภัณฑ์</h2>
          <p className="text-xs text-slate-400 font-medium font-mono mt-1 select-all bg-slate-100 px-2 py-0.5 rounded-lg w-fit">
            {asset.name} - Asset ID: {asset.id}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportToPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-rose-600 hover:text-rose-700 text-xs font-bold rounded-xl hover:bg-rose-50/40 transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4 text-rose-500" />
            <span>{isExporting ? 'กำลังส่งออก...' : 'Export Audit PDF'}</span>
          </button>
          <button
            onClick={() => {
              window.print();
              triggerToast('info', 'กำลังจัดส่งคำสั่งพิมพ์สติกเกอร์บาร์โค้ด QR Code...');
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Print Label (QR)</span>
          </button>
          <button
            onClick={() => onTriggerLogRepair(asset.id)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
          >
            <History className="w-4 h-4 text-slate-400" />
            <span>Log Repair</span>
          </button>
          <button
            onClick={() => setIsEditOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
            <span>Edit Asset Info</span>
          </button>
        </div>
      </div>

      {/* Bento Grid layout */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Main Identity Card (Bento Area 1 - col-8) */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col md:flex-row gap-6 items-start relative overflow-hidden shadow-sm">
          {/* Subtle Category Watermark background */}
          <div className="absolute top-0 right-0 p-8 text-slate-50 opacity-15 pointer-events-none transform translate-x-10 -translate-y-10 select-none">
            {getCategoryIcon(asset.category)}
          </div>

          {/* Asset Image Box */}
          <div className="w-full md:w-1/3 aspect-square rounded-2xl border border-slate-100 overflow-hidden bg-slate-50 flex items-center justify-center shrink-0 shadow-inner">
            {asset.imageUrl ? (
              <img
                className="w-full h-full object-cover"
                src={asset.imageUrl}
                alt={asset.name}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-300">
                {getCategoryIcon(asset.category)}
                <span className="text-[10px] font-bold uppercase tracking-wider">No Photo</span>
              </div>
            )}
          </div>

          {/* Details Content */}
          <div className="flex-1 w-full flex flex-col justify-between h-full space-y-6">
            <div>
              {/* Dynamic Status badge */}
              <div className="inline-flex items-center gap-1.5 bg-[#00494212] text-[#004942] px-3.5 py-1 rounded-full mb-3 select-none">
                <span className="w-2 h-2 rounded-full bg-[#004942]"></span>
                <span className="text-[11px] font-bold">
                  {asset.status === 'In Use'
                    ? 'ใช้งานปกติ (Active)'
                    : asset.status === 'Available'
                    ? 'พร้อมเบิกใช้งาน (Available)'
                    : 'อยู่ระหว่างซ่อมบำรุง (Repair)'}
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-800 font-sans tracking-tight mb-2">
                {asset.name}
              </h3>
              <p className="text-xs text-slate-400 font-medium font-mono">Model: {asset.serialNumber ? 'Standard Hardware' : 'N/A'}</p>
              <p className="text-xs text-slate-400 font-semibold font-mono mt-0.5">Serial: {asset.serialNumber}</p>
            </div>

            {/* Quick specifications grid cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">CPU</span>
                <p className="text-sm font-bold text-primary leading-tight truncate">{asset.specCPU || '-'}</p>
                <span className="text-[9px] text-slate-400 font-medium">Processor</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">RAM</span>
                <p className="text-sm font-bold text-primary leading-tight truncate">{asset.specRAM || '-'}</p>
                <span className="text-[9px] text-slate-400 font-medium">Memory</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Storage</span>
                <p className="text-sm font-bold text-primary leading-tight truncate">{asset.specStorage || '-'}</p>
                <span className="text-[9px] text-slate-400 font-medium">SSD / Disk</span>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code and Tag Label Card (Bento Area 2 - col-4) */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col items-center justify-center text-center shadow-sm animate-in fade-in zoom-in-95 duration-300">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Asset Tag QR</p>
          
          <div className="p-3.5 bg-slate-50 border-4 border-slate-100 rounded-2xl mb-4 shadow-inner flex items-center justify-center min-h-[120px] min-w-[120px]">
            {qrCodeUrl ? (
              <img
                className="w-28 h-28 mix-blend-multiply"
                src={qrCodeUrl}
                alt={`QR code tag for ${asset.id}`}
              />
            ) : (
              <div className="w-28 h-28 flex items-center justify-center text-xs text-slate-300">
                Generating...
              </div>
            )}
          </div>

          <p className="font-mono text-xs font-bold text-primary bg-primary/5 border border-primary/10 px-3 py-1 rounded-xl mb-4 select-all">
            {asset.id}
          </p>

          <button
            onClick={downloadQRCode}
            className="text-xs font-bold text-secondary hover:text-primary inline-flex items-center gap-1 cursor-pointer hover:underline transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download QR Code Image</span>
          </button>
        </div>

        {/* Purchase Info Card (Bento Area 3 - col-4) */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <h4 className="font-bold text-slate-800 font-sans text-sm flex items-center gap-2.5">
            <ShoppingCart className="w-4.5 h-4.5 text-primary" />
            <span>ข้อมูลการจัดซื้อ</span>
          </h4>
          <div className="space-y-3 text-xs font-medium">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-400">ราคาจัดซื้อ</span>
              <span className="font-bold text-slate-700">฿ {asset.purchasePrice.toLocaleString()}.00</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-400">ผู้จำหน่าย (Vendor)</span>
              <span className="font-semibold text-secondary truncate max-w-[150px]">{asset.vendor || 'JIB Computer'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-400">เลขใบสั่งซื้อ (PO)</span>
              <span className="font-bold text-slate-600">{asset.purchaseOrder || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-400">วันที่เริ่มต้นประกัน</span>
              <span className="font-semibold text-slate-600">{asset.purchaseDate || '15 มี.ค. 2566'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">สิ้นสุดระยะรับประกัน</span>
              <span className={`font-bold ${asset.warrantyExpiryDate === 'Expired' ? 'text-rose-600' : 'text-slate-700'}`}>
                {asset.warrantyExpiryDate}
              </span>
            </div>
          </div>
        </div>

        {/* Assigned User Details Card (Bento Area 4 - col-4) */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between gap-4">
          <h4 className="font-bold text-slate-800 font-sans text-sm flex items-center gap-2.5">
            <User className="w-4.5 h-4.5 text-primary" />
            <span>ผู้รับผิดชอบปัจจุบัน</span>
          </h4>
          
          {asset.assignee ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <img
                  className="w-11 h-11 rounded-full object-cover shadow-sm border border-slate-200 shrink-0"
                  src={asset.assignee.avatar}
                  alt={asset.assignee.name}
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate leading-none mb-1.5">{asset.assignee.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium truncate">{asset.assignee.role}, {asset.assignee.department}</p>
                </div>
              </div>
              <div className="space-y-2 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{asset.assignee.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{asset.assignee.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{asset.assignee.location}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 flex flex-col items-center justify-center text-center gap-2 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex-grow">
              <User className="w-6 h-6 text-slate-300" />
              <p className="text-xs font-medium">ไม่มีการมอบหมายผู้ใช้ครอง</p>
              <button
                onClick={() => alert('จำลองการทำงาน: เลือกผู้รับผิดชอบและมอบหมายครุภัณฑ์')}
                className="text-[11px] text-secondary font-bold hover:underline cursor-pointer"
              >
                มอบหมายครุภัณฑ์เลย
              </button>
            </div>
          )}
        </div>

        {/* Maintenance Timeline History Card (Bento Area 5 - col-4) */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-slate-800 font-sans text-sm flex items-center gap-2.5">
              <History className="w-4.5 h-4.5 text-primary" />
              <span>ประวัติการซ่อมบำรุง</span>
            </h4>
            <span className="text-[10px] font-bold text-slate-400 select-none uppercase">Logs</span>
          </div>

          <div className="space-y-4 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
            {asset.repairsHistory && asset.repairsHistory.length > 0 ? (
              asset.repairsHistory.map((log, i) => {
                return (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-secondary shrink-0 mt-1"></div>
                      {i < asset.repairsHistory!.length - 1 && (
                        <div className="w-0.5 flex-grow bg-slate-200 my-1"></div>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-slate-400 font-semibold">{log.date}</p>
                      <p className="text-xs font-bold text-slate-700 leading-tight">{log.action}</p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        สถานะ: {log.status} | ช่าง: {log.technician}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-center gap-1.5 text-slate-400">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <p className="text-xs font-medium">ไม่เคยมีประวัติส่งซ่อม</p>
                <p className="text-[9px] text-slate-400">ครุภัณฑ์คอมพิวเตอร์อยู่ในสภาพสมบูรณ์</p>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Technical Specs Table (Bento Area 6 - col-12) */}
        <div className="col-span-12 bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
          <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h4 className="font-bold text-slate-800 font-sans text-sm">
              ข้อมูลทางเทคนิคโดยละเอียด (Detailed Technical Specs)
            </h4>
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">system hardware report</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/20 text-slate-400 border-b border-slate-100">
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Specification Item</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Details</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Status / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                {/* Brand */}
                {asset.brand && (
                  <tr className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-800">ยี่ห้อ (Brand)</td>
                    <td className="px-6 py-3.5">{asset.brand}</td>
                    <td className="px-6 py-3.5 text-[#004942] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>ข้อมูลลงทะเบียน</span>
                    </td>
                  </tr>
                )}
                {/* Model */}
                {asset.model && (
                  <tr className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-800">รุ่น (Model)</td>
                    <td className="px-6 py-3.5">{asset.model}</td>
                    <td className="px-6 py-3.5 text-[#004942] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>ข้อมูลลงทะเบียน</span>
                    </td>
                  </tr>
                )}
                {/* OS */}
                {asset.specOS && (
                  <tr className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-800">ระบบปฏิบัติการ (OS)</td>
                    <td className="px-6 py-3.5">{asset.specOS}</td>
                    <td className="px-6 py-3.5 text-[#004942] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>ข้อมูลลงทะเบียน</span>
                    </td>
                  </tr>
                )}
                {/* Division */}
                {asset.division && (
                  <tr className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-800">ฝ่าย (Division)</td>
                    <td className="px-6 py-3.5">{asset.division}</td>
                    <td className="px-6 py-3.5 text-[#004942] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>ข้อมูลลงทะเบียน</span>
                    </td>
                  </tr>
                )}
                {/* Responsible */}
                {asset.responsiblePerson && (
                  <tr className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-800">ผู้รับผิดชอบ (Responsible Person)</td>
                    <td className="px-6 py-3.5">{asset.responsiblePerson}</td>
                    <td className="px-6 py-3.5 text-[#004942] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>ผู้ถือครองสิทธิ์</span>
                    </td>
                  </tr>
                )}
                {/* IP Address */}
                {asset.ipAddress && (
                  <tr className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-800">IP ADDRESS</td>
                    <td className="px-6 py-3.5 font-mono">{asset.ipAddress}</td>
                    <td className="px-6 py-3.5 text-[#004942] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>การเชื่อมต่อเครือข่าย</span>
                    </td>
                  </tr>
                )}
                {/* MAC Wifi */}
                {asset.macWifi && (
                  <tr className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-800">MAC WIFI</td>
                    <td className="px-6 py-3.5 font-mono">{asset.macWifi}</td>
                    <td className="px-6 py-3.5 text-[#004942] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>การเชื่อมต่อเครือข่าย</span>
                    </td>
                  </tr>
                )}
                {/* MAC Lan */}
                {asset.macLan && (
                  <tr className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-800">MAC LAN</td>
                    <td className="px-6 py-3.5 font-mono">{asset.macLan}</td>
                    <td className="px-6 py-3.5 text-[#004942] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>การเชื่อมต่อเครือข่าย</span>
                    </td>
                  </tr>
                )}
                {/* Remarks */}
                {asset.remarks && (
                  <tr className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-800">หมายเหตุ (Remarks)</td>
                    <td className="px-6 py-3.5">{asset.remarks}</td>
                    <td className="px-6 py-3.5 text-[#004942] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>บันทึกเพิ่มเติม</span>
                    </td>
                  </tr>
                )}

                {asset.detailedSpecs && asset.detailedSpecs.length > 0 ? (
                  asset.detailedSpecs.map((spec, index) => {
                    return (
                      <tr key={index} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-3.5 font-bold text-slate-800">{spec.item}</td>
                        <td className="px-6 py-3.5">{spec.details}</td>
                        <td className="px-6 py-3.5 text-secondary font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{spec.status}</span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <>
                    <tr className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-3.5 font-bold text-slate-800">Display Support</td>
                      <td className="px-6 py-3.5">Standard Display Connector Port Supported</td>
                      <td className="px-6 py-3.5 text-emerald-600 font-semibold">Verified Hardware</td>
                    </tr>
                    <tr className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-3.5 font-bold text-slate-800">Power Rating</td>
                      <td className="px-6 py-3.5">Standard Output Wattage verified</td>
                      <td className="px-6 py-3.5 text-emerald-600 font-semibold">Optimal Power</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* QUICK INLINE EDIT MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[999] flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 bg-primary text-white font-bold flex justify-between items-center shrink-0">
              <div className="space-y-0.5">
                <span className="text-sm font-sans block">แก้ไขรายละเอียดครุภัณฑ์ทั้งหมด</span>
                <span className="text-[10px] text-blue-100 font-mono font-medium block">Asset ID: {asset.id}</span>
              </div>
              <button 
                type="button"
                onClick={() => setIsEditOpen(false)} 
                className="text-white hover:text-white/80 p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            {/* Tab Selector */}
            <div className="flex border-b border-slate-200 bg-slate-50/50 p-2 gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`flex-1 py-2 px-3 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'general'
                    ? 'bg-white text-primary shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                1. ข้อมูลทั่วไป
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('purchase')}
                className={`flex-1 py-2 px-3 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'purchase'
                    ? 'bg-white text-primary shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                2. การจัดซื้อและรับประกัน
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('technical')}
                className={`flex-1 py-2 px-3 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'technical'
                    ? 'bg-white text-primary shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                3. คุณสมบัติเทคนิค & เครือข่าย
              </button>
            </div>
            
            <form onSubmit={handleSaveInline} className="flex-1 overflow-hidden flex flex-col">
              {/* Form Content Area (Scrollable) */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                {activeTab === 'general' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <h4 className="text-xs font-bold text-primary border-b border-slate-100 pb-1">ข้อมูลหลักและผู้ครอบครอง</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">ชื่อครุภัณฑ์ (Asset Name) <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">หมายเลขซีเรียล (Serial Number) <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={formSerial}
                          onChange={(e) => setFormSerial(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">หมวดหมู่ครุภัณฑ์ (Category)</label>
                        <select
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                        >
                          <option value="Notebook">Notebook (โน้ตบุ๊ก)</option>
                          <option value="PC">PC (คอมพิวเตอร์ตั้งโต๊ะ)</option>
                          <option value="Server">Server (เครื่องเซิร์ฟเวอร์)</option>
                          <option value="Network">Network (อุปกรณ์เครือข่าย)</option>
                          <option value="Display">Display (จอภาพ)</option>
                          <option value="Peripherals">Peripherals (อุปกรณ์ต่อพ่วง)</option>
                          <option value="Office Furniture">Office Furniture (เฟอร์นิเจอร์สำนักงาน)</option>
                          <option value="Electrical Appliances">Electrical Appliances (เครื่องใช้ไฟฟ้า)</option>
                          <option value="Vehicles">Vehicles (ยานพาหนะ)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">สถานะการใช้งาน (Status)</label>
                        <select
                          value={formStatus}
                          onChange={(e) => setFormStatus(e.target.value as AssetStatus)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-primary focus:border-primary outline-none font-medium"
                        >
                          <option value="In Use">In Use (กำลังใช้งาน)</option>
                          <option value="Available">Available (ว่าง/พร้อมใช้)</option>
                          <option value="Repair">Repair (ส่งซ่อมแซม)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">ยี่ห้อ / แบรนด์ (Brand)</label>
                        <input
                          type="text"
                          value={formBrand}
                          onChange={(e) => setFormBrand(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                          placeholder="เช่น Apple, Dell, HP"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">รุ่นครุภัณฑ์ (Model)</label>
                        <input
                          type="text"
                          value={formModel}
                          onChange={(e) => setFormModel(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                          placeholder="เช่น MacBook Pro M3, Latitude 5440"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">แผนกผู้ดูแล/ครอบครอง (Department)</label>
                        <input
                          type="text"
                          value={formDept}
                          onChange={(e) => setFormDept(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">ฝ่าย / ส่วนงาน (Division)</label>
                        <input
                          type="text"
                          value={formDivision}
                          onChange={(e) => setFormDivision(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                          placeholder="เช่น IT Infrastructure, HR"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">ผู้รับผิดชอบหลัก (Responsible Person)</label>
                        <input
                          type="text"
                          value={formResponsible}
                          onChange={(e) => setFormResponsible(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">ลิงก์รูปภาพครุภัณฑ์ (Image URL)</label>
                        <input
                          type="text"
                          value={formImageUrl}
                          onChange={(e) => setFormImageUrl(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none font-mono"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'purchase' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <h4 className="text-xs font-bold text-primary border-b border-slate-100 pb-1">ข้อมูลการจัดซื้อและการเงิน</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">ราคากลางจัดซื้อ (Purchase Price - บาท)</label>
                        <input
                          type="number"
                          value={formPrice || ''}
                          onChange={(e) => setFormPrice(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">ผู้จัดจำหน่าย (Vendor)</label>
                        <input
                          type="text"
                          value={formVendor}
                          onChange={(e) => setFormVendor(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">เลขที่ใบสั่งซื้อ (Purchase Order / PO)</label>
                        <input
                          type="text"
                          value={formPO}
                          onChange={(e) => setFormPO(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">วันที่จัดซื้อ (Purchase Date)</label>
                        <input
                          type="date"
                          value={formPurchaseDate}
                          onChange={(e) => setFormPurchaseDate(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">วันสิ้นสุดการรับประกัน (Warranty Expiry)</label>
                        <input
                          type="text"
                          value={formExpiryDate}
                          onChange={(e) => setFormExpiryDate(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                          placeholder="YYYY-MM-DD หรือ Expired"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'technical' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <h4 className="text-xs font-bold text-primary border-b border-slate-100 pb-1">คุณสมบัติเทคนิค & ข้อมูลเครือข่าย</h4>
                    
                    {/* System specs group */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">ระบบปฏิบัติการ (Operating System)</label>
                        <input
                          type="text"
                          value={formOS}
                          onChange={(e) => setFormOS(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                          placeholder="เช่น Windows 11 Pro, macOS Sonoma"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">หน่วยประมวลผล (Processor / CPU)</label>
                        <input
                          type="text"
                          value={formCPU}
                          onChange={(e) => setFormCPU(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                          placeholder="เช่น Intel Core i7 13th Gen, Apple M3 Pro"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">หน่วยความจำ (System Memory / RAM)</label>
                        <input
                          type="text"
                          value={formRAM}
                          onChange={(e) => setFormRAM(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                          placeholder="เช่น 16GB LPDDR5, 32GB DDR4"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">พื้นที่เก็บข้อมูล (Storage Capacity)</label>
                        <input
                          type="text"
                          value={formStorage}
                          onChange={(e) => setFormStorage(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                          placeholder="เช่น 512GB NVMe SSD, 1TB SSD"
                        />
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-primary border-b border-slate-100 pt-3 pb-1">ที่อยู่เครือข่าย & บันทึกเพิ่มเติม</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">ที่อยู่ไอพี (IP Address)</label>
                        <input
                          type="text"
                          value={formIP}
                          onChange={(e) => setFormIP(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                          placeholder="192.168.1.10"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">MAC Address (Wi-Fi)</label>
                        <input
                          type="text"
                          value={formWifi}
                          onChange={(e) => setFormWifi(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                          placeholder="00:1A:2B:3C:4D:5E"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">MAC Address (LAN)</label>
                        <input
                          type="text"
                          value={formLan}
                          onChange={(e) => setFormLan(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                          placeholder="00:1A:2B:3C:4D:5F"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">หมายเหตุ / บันทึกเพิ่มเติม (Remarks)</label>
                      <textarea
                        value={formRemarks}
                        onChange={(e) => setFormRemarks(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none"
                        placeholder="บันทึกรายละเอียดเพิ่มเติม..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer (Sticky) */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
                <span className="text-[10px] text-slate-400 font-semibold">* จำเป็นต้องกรอก</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary hover:bg-primary-container text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                  >
                    บันทึกข้อมูลทั้งหมด
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
