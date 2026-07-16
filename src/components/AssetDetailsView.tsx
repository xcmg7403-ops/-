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
  FileText,
  Copy,
  Check,
  Layers,
  Sliders,
  ExternalLink,
  X,
  Upload,
  Trash2,
  Camera
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
  
  // Custom QR Settings
  const [qrColor, setQrColor] = useState<string>(() => localStorage.getItem('assetmanager_qr_color') || '#00236f');
  const [qrMargin, setQrMargin] = useState<number>(() => {
    const val = localStorage.getItem('assetmanager_qr_margin');
    return val ? parseFloat(val) : 1.5;
  });
  const [isCopied, setIsCopied] = useState<boolean>(false);
  
  // Sticker Modal Settings
  const [isStickerModalOpen, setIsStickerModalOpen] = useState<boolean>(false);
  const [stickerFormat, setStickerFormat] = useState<'standard' | 'mini' | 'badge'>(() => 
    (localStorage.getItem('assetmanager_sticker_format') as any) || 'standard'
  );
  const [showCorporate, setShowCorporate] = useState<boolean>(() => 
    localStorage.getItem('assetmanager_show_corporate') !== 'false'
  );
  const [showCategory, setShowCategory] = useState<boolean>(() => 
    localStorage.getItem('assetmanager_show_category') !== 'false'
  );
  const [showUser, setShowUser] = useState<boolean>(() => 
    localStorage.getItem('assetmanager_show_user') !== 'false'
  );
  const [showDept, setShowDept] = useState<boolean>(() => 
    localStorage.getItem('assetmanager_show_dept') !== 'false'
  );

  // Sync to LocalStorage on changes
  useEffect(() => {
    localStorage.setItem('assetmanager_qr_color', qrColor);
  }, [qrColor]);

  useEffect(() => {
    localStorage.setItem('assetmanager_qr_margin', qrMargin.toString());
  }, [qrMargin]);

  useEffect(() => {
    localStorage.setItem('assetmanager_sticker_format', stickerFormat);
  }, [stickerFormat]);

  useEffect(() => {
    localStorage.setItem('assetmanager_show_corporate', showCorporate.toString());
  }, [showCorporate]);

  useEffect(() => {
    localStorage.setItem('assetmanager_show_category', showCategory.toString());
  }, [showCategory]);

  useEffect(() => {
    localStorage.setItem('assetmanager_show_user', showUser.toString());
  }, [showUser]);

  useEffect(() => {
    localStorage.setItem('assetmanager_show_dept', showDept.toString());
  }, [showDept]);

  useEffect(() => {
    if (asset.id) {
      QRCode.toDataURL(asset.id, {
        width: 300,
        margin: qrMargin,
        color: {
          dark: qrColor,
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
  }, [asset.id, qrColor, qrMargin]);

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

  const copyQRToClipboard = async () => {
    try {
      if (!qrCodeUrl) return;
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob
        })
      ]);
      setIsCopied(true);
      triggerToast('success', 'คัดลอกรูปภาพ QR Code ไปยัง Clipboard สำเร็จ! คุณสามารถวางลงในเอกสารได้ทันที');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy QR code to clipboard:', err);
      // Fallback: copy ID text
      try {
        await navigator.clipboard.writeText(asset.id);
        setIsCopied(true);
        triggerToast('success', 'คัดลอกรหัสครุภัณฑ์ (Asset ID) ไปยัง Clipboard สำเร็จ');
        setTimeout(() => setIsCopied(false), 2000);
      } catch (clipErr) {
        triggerToast('error', 'ไม่สามารถคัดลอกได้ในสภาพแวดล้อมนี้');
      }
    }
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleDirectPrintLabel = () => {
    triggerToast('info', 'กำลังเปิดการจัดพิมพ์ป้ายสติกเกอร์...');
    setTimeout(() => {
      window.print();
    }, 150);
  };

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
  const [formDisplay, setFormDisplay] = useState(() => {
    if (!asset.detailedSpecs) return '';
    const found = asset.detailedSpecs.find(s => s.item.toLowerCase() === 'display');
    return found ? found.details : '';
  });
  const [formOSVersion, setFormOSVersion] = useState(() => {
    if (!asset.detailedSpecs) return '';
    const found = asset.detailedSpecs.find(s => s.item.toLowerCase() === 'os version');
    return found ? found.details : '';
  });

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

    const foundDisplay = asset.detailedSpecs?.find(s => s.item.toLowerCase() === 'display');
    setFormDisplay(foundDisplay ? foundDisplay.details : '');
    const foundOSVersion = asset.detailedSpecs?.find(s => s.item.toLowerCase() === 'os version');
    setFormOSVersion(foundOSVersion ? foundOSVersion.details : '');
  }, [asset]);

  // Handle save of inline edits
  const handleSaveInline = (e: React.FormEvent) => {
    e.preventDefault();

    // Rebuild detailedSpecs with Display and OS Version
    let currentSpecs = asset.detailedSpecs ? [...asset.detailedSpecs] : [];
    
    // Update or add 'Display'
    const displayIndex = currentSpecs.findIndex(s => s.item.toLowerCase() === 'display');
    if (formDisplay.trim()) {
      if (displayIndex >= 0) {
        currentSpecs[displayIndex] = { ...currentSpecs[displayIndex], details: formDisplay };
      } else {
        currentSpecs.push({ item: 'Display', details: formDisplay, status: 'Optimal Performance' });
      }
    } else if (displayIndex >= 0) {
      currentSpecs.splice(displayIndex, 1);
    }

    // Update or add 'OS Version'
    const osVerIndex = currentSpecs.findIndex(s => s.item.toLowerCase() === 'os version');
    if (formOSVersion.trim()) {
      if (osVerIndex >= 0) {
        currentSpecs[osVerIndex] = { ...currentSpecs[osVerIndex], details: formOSVersion };
      } else {
        currentSpecs.push({ item: 'OS Version', details: formOSVersion, status: 'Up to date' });
      }
    } else if (osVerIndex >= 0) {
      currentSpecs.splice(osVerIndex, 1);
    }

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
      imageUrl: formImageUrl || undefined,
      detailedSpecs: currentSpecs.length > 0 ? currentSpecs : undefined
    };

    onEditAsset(updatedAsset);
    setIsEditOpen(false);
    triggerToast('success', `อัปเดตรายละเอียดครุภัณฑ์ ${asset.id} สำเร็จแล้ว`);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show toast for loading state
    triggerToast('info', 'กำลังประมวลผลรูปภาพ...');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas to resize image
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Max size 500px to ensure it fits in firestore easily
        const MAX_SIZE = 500;
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Draw image to canvas
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85); // 85% quality JPEG
          
          // Trigger save
          const updatedAsset: Asset = {
            ...asset,
            imageUrl: compressedDataUrl
          };
          onEditAsset(updatedAsset);
          triggerToast('success', 'อัปโหลดและบันทึกรูปภาพครุภัณฑ์เรียบร้อยแล้ว');
        } else {
          triggerToast('error', 'ไม่สามารถประมวลผลรูปภาพได้');
        }
      };
      img.onerror = () => {
        triggerToast('error', 'ไฟล์รูปภาพไม่ถูกต้องหรือเสียหาย');
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      triggerToast('error', 'ไม่สามารถอ่านไฟล์ได้');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering file input click
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรูปภาพของครุภัณฑ์นี้?')) {
      const updatedAsset: Asset = {
        ...asset,
        imageUrl: undefined
      };
      onEditAsset(updatedAsset);
      triggerToast('success', 'ลบรูปภาพครุภัณฑ์เรียบร้อยแล้ว');
    }
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
            onClick={handleDirectPrintLabel}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#00236f] hover:bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-sky-200" />
            <span>Print Label</span>
          </button>
          <button
            onClick={() => setIsStickerModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-slate-400" />
            <span>Customize Sticker</span>
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
          <div 
            onClick={() => document.getElementById('asset-image-file-input')?.click()}
            className="w-full md:w-1/3 aspect-square rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center shrink-0 shadow-sm relative group cursor-pointer hover:border-[#00236f] transition-all duration-300"
            title="คลิกเพื่ออัปโหลดหรือถ่ายภาพครุภัณฑ์"
          >
            <input 
              type="file" 
              accept="image/*" 
              id="asset-image-file-input" 
              className="hidden" 
              onChange={handleImageUpload} 
            />
            {asset.imageUrl ? (
              <>
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src={asset.imageUrl}
                  alt={asset.name}
                  referrerPolicy="no-referrer"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 text-white">
                  <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-xs text-xs font-bold hover:bg-white/30 transition-colors">
                    <Camera className="w-3.5 h-3.5" />
                    <span>เปลี่ยนรูปภาพ</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(e);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-rose-200 hover:text-rose-100 hover:bg-rose-500/20 rounded-md transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>ลบรูปภาพ</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center group-hover:text-[#00236f] transition-colors">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 group-hover:bg-[#00236f]/5 transition-all">
                  <Upload className="w-6 h-6 text-slate-400 group-hover:text-[#00236f] transition-colors" />
                </div>
                <span className="text-xs font-bold text-slate-700 block">อัปโหลดรูปภาพ</span>
                <span className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">คลิกเพื่อ ถ่ายภาพจากกล้อง หรือ เลือกไฟล์รูปภาพ</span>
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
              <p className="text-xs text-slate-400 font-medium font-mono">Model: {asset.brand && asset.model ? `${asset.brand} ${asset.model}` : 'Standard Hardware'}</p>
              <p className="text-xs text-slate-400 font-semibold font-mono mt-0.5">Serial: {asset.serialNumber || 'N/A'}</p>
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

            {/* Detailed Technical Specs Panel */}
            <div className="pt-4 border-t border-slate-200 bg-slate-50/60 p-5 rounded-2xl space-y-4">
              <span className="text-xs font-bold text-[#00236f] uppercase tracking-wider block border-b border-slate-100 pb-2">📋 ข้อมูลทางเทคนิคโดยละเอียด (DETAILED SPECS)</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                {asset.specOS && (
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">ระบบปฏิบัติการ (OS):</span>
                    <span className="font-bold text-slate-800 text-sm">{asset.specOS}</span>
                  </div>
                )}
                {asset.ipAddress && (
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">IP Address:</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">{asset.ipAddress}</span>
                  </div>
                )}
                {asset.macWifi && (
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">MAC WiFi:</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">{asset.macWifi}</span>
                  </div>
                )}
                {asset.macLan && (
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">MAC LAN:</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">{asset.macLan}</span>
                  </div>
                )}
                {asset.division && (
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">ฝ่ายงาน (Division):</span>
                    <span className="font-bold text-slate-800 text-sm">{asset.division}</span>
                  </div>
                )}
                {asset.remarks && (
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100 md:col-span-2">
                    <span className="text-slate-500 font-medium">หมายเหตุ (Remarks):</span>
                    <span className="font-bold text-slate-700 text-sm truncate max-w-[400px]" title={asset.remarks}>{asset.remarks}</span>
                  </div>
                )}
                {asset.detailedSpecs && asset.detailedSpecs.map((spec, index) => (
                  <div key={index} className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">{spec.item}:</span>
                    <span className="font-bold text-slate-800 text-sm">{spec.details}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* QR Code and Tag Label Card (Bento Area 2 - col-4) */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col justify-between shadow-sm animate-in fade-in zoom-in-95 duration-300">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asset Tag QR Studio</span>
              <span className="text-[9px] font-bold bg-[#00236f]/5 text-[#00236f] px-2 py-0.5 rounded-md">Real-Time</span>
            </div>

            {/* QR Code Canvas */}
            <div className="relative flex flex-col items-center py-2">
              <div className="p-4 bg-white border-2 border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow flex items-center justify-center min-h-[160px] min-w-[160px] relative group">
                {qrCodeUrl ? (
                  <img
                    className="w-36 h-36 object-contain"
                    src={qrCodeUrl}
                    alt={`QR code tag for ${asset.id}`}
                  />
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center text-xs text-slate-400 font-mono">
                    Generating...
                  </div>
                )}
              </div>

              <div className="mt-3 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Encoded ID</span>
                <p className="font-mono text-xs font-bold text-[#00236f] bg-[#00236f]/5 border border-[#00236f]/10 px-3 py-1 rounded-xl select-all inline-block">
                  {asset.id}
                </p>
              </div>
            </div>

            {/* Color Customizer */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3 h-3" />
                <span>โทนสีป้าย QR (QR Theme Color)</span>
              </label>
              <div className="flex items-center gap-2">
                {[
                  { name: 'Navy Blue', hex: '#00236f' },
                  { name: 'Slate Black', hex: '#0f172a' },
                  { name: 'Emerald', hex: '#10b981' },
                  { name: 'Crimson', hex: '#e11d48' },
                ].map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => {
                      setQrColor(color.hex);
                      triggerToast('info', `ปรับเปลี่ยนสีรหัส QR เป็นโทนสี ${color.name}`);
                    }}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                    className={`w-6 h-6 rounded-full cursor-pointer transition-transform duration-150 relative ${
                      qrColor === color.hex ? 'scale-125 ring-2 ring-offset-2 ring-primary' : 'hover:scale-110'
                    }`}
                  >
                    {qrColor === color.hex && (
                      <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Margin/Density settings */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3 h-3" />
                <span>ขอบขอบป้าย (QR Margins)</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: 'ขอบบาง', margin: 0.5 },
                  { label: 'ปกติ', margin: 1.5 },
                  { label: 'ขอบหนา', margin: 3.5 },
                ].map((item) => (
                  <button
                    key={item.margin}
                    onClick={() => {
                      setQrMargin(item.margin);
                    }}
                    className={`py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                      qrMargin === item.margin
                        ? 'bg-[#00236f]/5 border-[#00236f] text-[#00236f]'
                        : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Practical Utilities Row */}
          <div className="space-y-2 pt-4 border-t border-slate-100 mt-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={copyQRToClipboard}
                className="flex items-center justify-center gap-1.5 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-bold rounded-xl transition-all cursor-pointer"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{isCopied ? 'คัดลอกแล้ว' : 'คัดลอกรูป QR'}</span>
              </button>
              <button
                onClick={downloadQRCode}
                className="flex items-center justify-center gap-1.5 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-bold rounded-xl transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>ดาวน์โหลดรูป</span>
              </button>
            </div>

            <button
              onClick={() => setIsStickerModalOpen(true)}
              className="w-full py-2.5 bg-[#00236f] hover:bg-primary text-white font-bold text-[11px] rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-slate-200"
            >
              <Printer className="w-4 h-4 text-sky-300" />
              <span>พิมพ์สติกเกอร์บาร์โค้ดด่วน</span>
            </button>
            <p className="text-[9px] text-slate-400 text-center leading-normal">
              * รหัส QR โค้ดนี้สามารถใช้งานร่วมกับเครื่องปืนยิงสแกน และแท็บกล้องสแกนเพื่อตรวจสอบความถูกต้องระหว่างลงตรวจสภาพครุภัณฑ์
            </p>
          </div>
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

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">หน้าจอแสดงผล (Display)</label>
                        <input
                          type="text"
                          value={formDisplay}
                          onChange={(e) => setFormDisplay(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                          placeholder="เช่น FHD IPS Screen, Retina XDR Display"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">เวอร์ชันระบบปฏิบัติการ (OS Version)</label>
                        <input
                          type="text"
                          value={formOSVersion}
                          onChange={(e) => setFormOSVersion(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                          placeholder="เช่น Windows 11 23H2, OS preinstalled"
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

      {/* Sticker Print Wizard Modal */}
      {isStickerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 bg-[#00236f] text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-sky-400 animate-pulse" />
                <h3 className="font-bold text-sm font-sans tracking-wide">เครื่องมือพิมพ์สติกเกอร์ครุภัณฑ์อัจฉริยะ (Asset Tag Sticker Studio)</h3>
              </div>
              <button
                onClick={() => setIsStickerModalOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto flex-grow divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
              
              {/* Left Column: Settings & Config (5 cols) */}
              <div className="lg:col-span-5 p-6 space-y-6 text-left">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-3">1. เลือกรูปแบบป้าย (Label Format)</h4>
                  <div className="space-y-2">
                    {[
                      { id: 'standard', title: 'Standard Tag (76 x 50 mm)', desc: 'ขนาดมาตรฐาน คมชัด มีข้อมูลครบถ้วนสำหรับติดเคส/หน้าจอ' },
                      { id: 'mini', title: 'Compact Tag (50 x 25 mm)', desc: 'ขนาดจิ๋วสำหรับอุปกรณ์ขนาดเล็ก เช่น อะแดปเตอร์ หรือเมาส์' },
                      { id: 'badge', title: 'Full Spec Badge (100 x 75 mm)', desc: 'ขนาดใหญ่แสดงสเปกเทคนิคและประวัติสำหรับเซิร์ฟเวอร์/ตู้แร็ค' }
                    ].map((format) => (
                      <button
                        key={format.id}
                        type="button"
                        onClick={() => setStickerFormat(format.id as any)}
                        className={`w-full p-3.5 text-left rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${
                          stickerFormat === format.id
                            ? 'border-[#00236f] bg-[#00236f]/5 ring-1 ring-[#00236f]'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`text-xs font-bold ${stickerFormat === format.id ? 'text-[#00236f]' : 'text-slate-700'}`}>
                          {format.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium leading-normal">{format.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-3">2. ปรับแต่งเนื้อหา (Sticker Details)</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg hover:bg-slate-100/70 transition-colors cursor-pointer text-xs font-medium text-slate-600">
                      <input
                        type="checkbox"
                        checked={showCorporate}
                        onChange={(e) => setShowCorporate(e.target.checked)}
                        className="rounded text-[#00236f] focus:ring-primary w-4 h-4"
                      />
                      <span>แสดงหัวชื่อหน่วยงาน (🏢 IT DEPT LABEL)</span>
                    </label>
                    <label className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg hover:bg-slate-100/70 transition-colors cursor-pointer text-xs font-medium text-slate-600">
                      <input
                        type="checkbox"
                        checked={showCategory}
                        onChange={(e) => setShowCategory(e.target.checked)}
                        className="rounded text-[#00236f] focus:ring-primary w-4 h-4"
                      />
                      <span>แสดงไอคอนหมวดหมู่ครุภัณฑ์ (Category Icon)</span>
                    </label>
                    <label className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg hover:bg-slate-100/70 transition-colors cursor-pointer text-xs font-medium text-slate-600">
                      <input
                        type="checkbox"
                        checked={showUser}
                        onChange={(e) => setShowUser(e.target.checked)}
                        className="rounded text-[#00236f] focus:ring-primary w-4 h-4"
                      />
                      <span>แสดงชื่อผู้ถือครอง/ผู้รับผิดชอบหลัก (Assignee)</span>
                    </label>
                    <label className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg hover:bg-slate-100/70 transition-colors cursor-pointer text-xs font-medium text-slate-600">
                      <input
                        type="checkbox"
                        checked={showDept}
                        onChange={(e) => setShowDept(e.target.checked)}
                        className="rounded text-[#00236f] focus:ring-primary w-4 h-4"
                      />
                      <span>แสดงหน่วยงาน / สถานที่ติดตั้ง (Department)</span>
                    </label>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">💡 วิธีการพิมพ์ที่เหมาะสม</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium font-sans">
                    เมื่อกด <b>"พิมพ์ป้ายแท็ก"</b> ระบบจะตัดส่วนแอปพลิเคชันทั้งหมดออก และส่งสติกเกอร์ตรงไปยังกล่องโต้ตอบการพิมพ์ของเครื่องพิมพ์สติกเกอร์ (Thermal Label Printer) ของคุณโดยตรง
                  </p>
                </div>
              </div>

              {/* Right Column: Dynamic Preview Area (7 cols) */}
              <div className="lg:col-span-7 p-6 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-3 text-left">3. ตัวอย่างก่อนพิมพ์ (Sticker Print Preview)</h4>
                  
                  {/* Outer Frame with sticker cut lines */}
                  <div className="border border-dashed border-slate-300 rounded-2xl bg-white p-8 shadow-inner flex items-center justify-center min-h-[300px]">
                    
                    {/* Isolated Printable Block */}
                    <div
                      id="sticker-print-area"
                      className={`bg-white text-black border border-black p-4 select-none flex ${
                        stickerFormat === 'standard'
                          ? 'w-[360px] h-[240px] flex-row items-center justify-between gap-4'
                          : stickerFormat === 'mini'
                          ? 'w-[280px] h-[140px] flex-row items-center justify-center gap-4'
                          : 'w-[400px] h-[300px] flex-col justify-between'
                      }`}
                    >
                      {/* CSS media print injection */}
                      <style>{`
                        @media print {
                          body * {
                            visibility: hidden;
                          }
                          #sticker-print-area, #sticker-print-area * {
                            visibility: visible;
                          }
                          #sticker-print-area {
                            position: absolute;
                            left: 50% !important;
                            top: 50% !important;
                            transform: translate(-50%, -50%) !important;
                            width: ${stickerFormat === 'standard' ? '360px' : stickerFormat === 'mini' ? '280px' : '400px'} !important;
                            height: ${stickerFormat === 'standard' ? '240px' : stickerFormat === 'mini' ? '140px' : '300px'} !important;
                            margin: 0 !important;
                            padding: 16px !important;
                            border: 2px solid black !important;
                            background: white !important;
                            box-shadow: none !important;
                          }
                        }
                      `}</style>

                      {stickerFormat === 'standard' && (
                        <>
                          <div className="flex-1 flex flex-col justify-between h-full py-1 text-left">
                            <div className="space-y-1">
                              {showCorporate && (
                                <p className="text-[9px] font-black uppercase tracking-wider text-slate-800 border-b border-black pb-0.5 mb-1.5 font-sans">
                                  🏢 IT ASSET SECURITY TAG
                                </p>
                              )}
                              <p className="text-xs font-black text-black leading-tight line-clamp-2 uppercase font-sans">
                                {asset.name}
                              </p>
                              <p className="text-[10px] font-bold text-slate-500 font-sans">
                                Cat: {asset.category} {showCategory && '• '}{showCategory && asset.brand}
                              </p>
                              {showUser && (
                                <p className="text-[10px] font-bold text-slate-700 leading-tight font-sans">
                                  User: {asset.responsiblePerson || 'Central IT'}
                                </p>
                              )}
                              {showDept && (
                                <p className="text-[9px] font-medium text-slate-500 leading-none font-sans">
                                  Loc: {asset.department || '-'}
                                </p>
                              )}
                            </div>
                            <div className="mt-2 pt-1 border-t border-dashed border-slate-300">
                              <span className="text-[8px] font-bold text-slate-400 block font-sans">SERIAL NO.</span>
                              <p className="font-mono text-[10px] font-bold text-black">{asset.serialNumber || 'N/A'}</p>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-center justify-center shrink-0 border-l border-slate-200 pl-4 h-full">
                            {qrCodeUrl ? (
                              <img className="w-28 h-28 mix-blend-multiply shrink-0" src={qrCodeUrl} alt="QR code" />
                            ) : (
                              <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-[10px]">QR Generating</div>
                            )}
                            <p className="font-mono font-black text-[11px] text-black tracking-wide mt-1 select-all">{asset.id}</p>
                          </div>
                        </>
                      )}

                      {stickerFormat === 'mini' && (
                        <>
                          <div className="shrink-0">
                            {qrCodeUrl ? (
                              <img className="w-20 h-20 mix-blend-multiply" src={qrCodeUrl} alt="QR code" />
                            ) : (
                              <div className="w-16 h-16 bg-slate-100" />
                            )}
                          </div>
                          <div className="flex-grow flex flex-col justify-center text-left py-1">
                            <p className="font-mono font-black text-[13px] text-black tracking-wider leading-none mb-1 select-all">
                              {asset.id}
                            </p>
                            <p className="text-[10px] font-bold text-slate-800 line-clamp-1 font-sans">{asset.name}</p>
                            <p className="text-[9px] text-slate-500 font-bold font-sans">SN: {asset.serialNumber || 'N/A'}</p>
                          </div>
                        </>
                      )}

                      {stickerFormat === 'badge' && (
                        <>
                          {/* Badge layout */}
                          <div className="flex justify-between items-start border-b-2 border-black pb-2 w-full">
                            <div className="text-left">
                              {showCorporate && <p className="text-[10px] font-black tracking-widest text-slate-800 font-sans">🏢 GOVERNMENT IT ASSET CONTROL</p>}
                              <h5 className="text-sm font-black text-black leading-tight uppercase font-sans mt-0.5">{asset.name}</h5>
                            </div>
                            <span className="text-xs font-mono font-black bg-black text-white px-2 py-0.5 rounded select-all shrink-0">{asset.id}</span>
                          </div>

                          <div className="grid grid-cols-12 gap-3 py-3 items-center flex-grow w-full">
                            <div className="col-span-8 space-y-1.5 text-left text-[11px] font-bold text-slate-700 font-sans">
                              <p><span className="text-slate-400 font-medium">หมวดหมู่ (Category):</span> {asset.category}</p>
                              <p><span className="text-slate-400 font-medium">รุ่น / แบรนด์ (Model):</span> {asset.brand} - {asset.model}</p>
                              <p><span className="text-slate-400 font-medium">หมายเลขซีเรียล (Serial):</span> {asset.serialNumber}</p>
                              {showUser && <p><span className="text-slate-400 font-medium">ผู้ถือครอง (Assignee):</span> {asset.responsiblePerson || 'Central IT'}</p>}
                              {showDept && <p><span className="text-slate-400 font-medium">หน่วยงาน (Dept):</span> {asset.department}</p>}
                            </div>
                            <div className="col-span-4 flex justify-end">
                              {qrCodeUrl ? (
                                <img className="w-24 h-24 mix-blend-multiply shrink-0" src={qrCodeUrl} alt="QR code" />
                              ) : (
                                <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-[10px]">QR Generating</div>
                              )}
                            </div>
                          </div>

                          <div className="border-t border-black pt-2 flex justify-between items-center text-[9px] font-bold text-slate-400 font-sans w-full">
                            <span>ระบบขึ้นทะเบียนกลาง (IT Inventory Management)</span>
                            <span>พิมพ์เมื่อ: {new Date().toLocaleDateString('th-TH')}</span>
                          </div>
                        </>
                      )}

                    </div>

                  </div>
                </div>

                {/* Print button bar */}
                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 bg-white p-4 rounded-xl mt-4">
                  <button
                    type="button"
                    onClick={() => setIsStickerModalOpen(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    ปิดหน้าต่าง
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      window.print();
                      triggerToast('success', `คำสั่งพิมพ์สำหรับครุภัณฑ์ ${asset.id} ถูกส่งไปยังเครื่องพิมพ์เรียบร้อยแล้ว`);
                    }}
                    className="px-6 py-2.5 bg-[#00236f] hover:bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4 text-sky-300" />
                    <span>สั่งพิมพ์ป้ายสติกเกอร์</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* DIRECT PRINTABLE LABEL (Hidden on screen, styled specifically for @media print) */}
      {!isStickerModalOpen && (
        <div id="direct-printable-label" className="hidden">
          <style>{`
            @media print {
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #fff !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body * {
                visibility: hidden !important;
              }
              #direct-printable-label, #direct-printable-label * {
                visibility: visible !important;
              }
              #direct-printable-label {
                display: block !important;
                position: absolute !important;
                left: 50% !important;
                top: 50% !important;
                transform: translate(-50%, -50%) !important;
                width: 360px !important;
                height: 240px !important;
                border: 2px solid #000 !important;
                border-radius: 8px !important;
                padding: 16px !important;
                background: #fff !important;
                box-shadow: none !important;
                box-sizing: border-box !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
              }
              .direct-print-flex {
                display: flex !important;
                flex-direction: row !important;
                align-items: center !important;
                justify-content: space-between !important;
                height: 100% !important;
                gap: 16px !important;
              }
              .direct-print-info {
                flex: 1 !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                height: 100% !important;
                text-align: left !important;
              }
              .direct-print-header {
                font-size: 9px !important;
                font-weight: 900 !important;
                text-transform: uppercase !important;
                letter-spacing: 0.05em !important;
                border-bottom: 2px solid #000 !important;
                padding-bottom: 4px !important;
                margin-bottom: 8px !important;
              }
              .direct-print-name {
                font-size: 14px !important;
                font-weight: 800 !important;
                line-height: 1.25 !important;
                margin-bottom: 6px !important;
                color: #000 !important;
                display: -webkit-box !important;
                -webkit-line-clamp: 2 !important;
                -webkit-box-orient: vertical !important;
                overflow: hidden !important;
              }
              .direct-print-category {
                font-size: 10px !important;
                font-weight: 700 !important;
                color: #555 !important;
                margin-bottom: 4px !important;
              }
              .direct-print-meta {
                font-size: 9px !important;
                font-weight: 600 !important;
                color: #666 !important;
              }
              .direct-print-footer {
                margin-top: auto !important;
                padding-top: 6px !important;
                border-top: 1px dashed #ccc !important;
              }
              .direct-print-sn-label {
                font-size: 8px !important;
                font-weight: 700 !important;
                color: #888 !important;
                text-transform: uppercase !important;
                display: block !important;
                line-height: 1 !important;
              }
              .direct-print-sn-val {
                font-family: monospace !important;
                font-size: 11px !important;
                font-weight: 700 !important;
                color: #000 !important;
                line-height: 1.2 !important;
              }
              .direct-print-qr-sec {
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
                border-left: 1.5px solid #eee !important;
                padding-left: 16px !important;
                height: 100% !important;
                box-sizing: border-box !important;
              }
              .direct-print-qr-img {
                width: 110px !important;
                height: 110px !important;
                display: block !important;
              }
              .direct-print-id-val {
                font-family: monospace !important;
                font-size: 12px !important;
                font-weight: 900 !important;
                color: #000 !important;
                margin-top: 6px !important;
                letter-spacing: 0.05em !important;
              }
              @page {
                size: 3.5in 2.4in;
                margin: 0;
              }
            }
          `}</style>
          <div className="direct-print-flex">
            <div className="direct-print-info">
              <div>
                <div className="direct-print-header">🏢 IT ASSET SECURITY TAG</div>
                <div className="direct-print-name">{asset.name}</div>
                <div className="direct-print-category">หมวดหมู่: {asset.category}</div>
                {(asset.responsiblePerson || asset.department) && (
                  <div className="direct-print-meta">
                    {asset.responsiblePerson ? `ผู้ดูแล: ${asset.responsiblePerson}` : ''}
                    {asset.responsiblePerson && asset.department ? ' | ' : ''}
                    {asset.department ? `แผนก: ${asset.department}` : ''}
                  </div>
                )}
              </div>
              <div className="direct-print-footer">
                <span className="direct-print-sn-label">SERIAL NO.</span>
                <span className="direct-print-sn-val">{asset.serialNumber || 'N/A'}</span>
              </div>
            </div>
            <div className="direct-print-qr-sec">
              {qrCodeUrl ? (
                <img className="direct-print-qr-img" src={qrCodeUrl} alt="QR Code" />
              ) : (
                <div className="w-[110px] h-[110px] bg-slate-100 flex items-center justify-center text-[10px]">Generating QR...</div>
              )}
              <div className="direct-print-id-val">{asset.id}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
