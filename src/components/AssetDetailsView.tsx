import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { Asset, AssetStatus } from '../types';
import { formatCurrency, getCurrencySymbol } from '../lib/currency';
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
  UserX,
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
  currency?: string;
}

export default function AssetDetailsView({
  asset,
  onBackToInventory,
  onEditAsset,
  onTriggerLogRepair,
  triggerToast,
  currency = 'THB (฿) - Thai Baht'
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
    triggerToast('info', 'กำลังจัดทำรายงานผลการขึ้นทะเบียนและการตรวจสอบ (Compliance Audit PDF)...');

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1700;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      const orgName = localStorage.getItem('assetmanager_org_name') || 'AssetManager IT';

      // ================= PAGE 1 =================
      // 1. Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1200, 1700);

      // 2. White Logo Header Block
      ctx.textAlign = 'left';
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(orgName.toUpperCase(), 80, 50);

      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      const cleanWebDomain = orgName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'suteegroup';
      ctx.fillText(`IT Asset Management & Compliance Division | www.${cleanWebDomain}.example.com`, 80, 72);

      // 3. Deep Blue Header Banner
      ctx.fillStyle = '#00236f';
      ctx.fillRect(0, 100, 1200, 140);

      // Title Text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(`${orgName.toUpperCase()} COMPLIANCE AUDIT REPORT`, 80, 160);

      // Subtitle
      ctx.fillStyle = '#a5f3fc';
      ctx.font = '15px sans-serif';
      ctx.fillText('Comprehensive IT Asset Profile & Compliance Verification Record', 80, 200);

      // Top Right Document Info & Confidential Pill Badge
      // Draw rounded Red Confidential Badge
      const confX = 980;
      const confY = 130;
      const confW = 140;
      const confH = 26;
      const confR = 6;
      ctx.fillStyle = '#e11d48'; // Rose 600
      ctx.beginPath();
      ctx.moveTo(confX + confR, confY);
      ctx.arcTo(confX + confW, confY, confX + confW, confY + confH, confR);
      ctx.arcTo(confX + confW, confY + confH, confX, confY + confH, confR);
      ctx.arcTo(confX, confY + confH, confX, confY, confR);
      ctx.arcTo(confX, confY, confX + confW, confY, confR);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CONFIDENTIAL', confX + (confW / 2), confY + 17);

      // Add other top-right document info
      ctx.textAlign = 'right';
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '11px sans-serif';
      ctx.fillText('DOCUMENT TYPE: Audit Profile', 1120, 175);
      ctx.fillText(`PRINTED ON: ${new Date().toLocaleString('th-TH')}`, 1120, 195);
      ctx.fillText(`AUDIT ID: IA-${new Date().getFullYear()}`, 1120, 215);

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

      // Draw General Information Rounded Card Container (Left Column)
      const giX = 80;
      const giY = 280;
      const giW = 730;
      const giH = 590;
      const giR = 12;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(giX + giR, giY);
      ctx.arcTo(giX + giW, giY, giX + giW, giY + giH, giR);
      ctx.arcTo(giX + giW, giY + giH, giX, giY + giH, giR);
      ctx.arcTo(giX, giY + giH, giX, giY, giR);
      ctx.arcTo(giX, giY, giX + giW, giY, giR);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Rounded Navy blue banner for header inside General Info
      ctx.fillStyle = '#00236f';
      ctx.beginPath();
      ctx.moveTo(giX + giR, giY);
      ctx.arcTo(giX + giW, giY, giX + giW, giY + 40, giR);
      ctx.lineTo(giX + giW, giY + 40);
      ctx.lineTo(giX, giY + 40);
      ctx.arcTo(giX, giY, giX + giW, giY, giR);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('GENERAL INFORMATION & ASSET PROFILE', giX + 20, giY + 25);

      // General Info Row Drawer
      let currentRowY = giY + 70;
      const drawRow = (label: string, value: string, fontBoldValue = false) => {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#64748b';
        ctx.font = '13px sans-serif';
        ctx.fillText(label, giX + 20, currentRowY);
        
        if (label === 'Current Status') {
          // Draw high-quality badge
          let badgeBg = '#f0fdf4';
          let badgeBorder = '#bbf7d0';
          let badgeText = '#166534';
          let txt = 'ACTIVE';

          if (value.toLowerCase().includes('available')) {
            badgeBg = '#f0f9ff';
            badgeBorder = '#bae6fd';
            badgeText = '#075985';
            txt = 'AVAILABLE';
          } else if (value.toLowerCase().includes('maintenance') || value.toLowerCase().includes('repair')) {
            badgeBg = '#fff7ed';
            badgeBorder = '#fed7aa';
            badgeText = '#9a3412';
            txt = 'UNDER MAINTENANCE';
          }

          ctx.fillStyle = badgeBg;
          ctx.strokeStyle = badgeBorder;
          ctx.lineWidth = 1;
          
          const bx = giX + 280;
          const by = currentRowY - 15;
          const bw = 150;
          const bh = 22;
          const br = 11;
          
          ctx.beginPath();
          ctx.moveTo(bx + br, by);
          ctx.arcTo(bx + bw, by, bx + bw, by + bh, br);
          ctx.arcTo(bx + bw, by + bh, bx, by + bh, br);
          ctx.arcTo(bx, by + bh, bx, by, br);
          ctx.arcTo(bx, by, bx + bw, by, br);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = badgeText;
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(txt, bx + (bw / 2), by + 15);
          ctx.textAlign = 'left';
        } else {
          ctx.fillStyle = '#0f172a';
          ctx.font = fontBoldValue ? 'bold 13px sans-serif' : '13px sans-serif';
          ctx.fillText(value || '-', giX + 280, currentRowY);
        }

        // Horizontal separator line
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(giX + 15, currentRowY + 12);
        ctx.lineTo(giX + giW - 15, currentRowY + 12);
        ctx.stroke();

        currentRowY += 40;
      };

      const categoryLabel = asset.category === 'PC' 
        ? 'PC (Desktop Computer)' 
        : asset.category === 'Notebook' 
        ? 'Notebook' 
        : asset.category;

      const statusText = asset.status === 'In Use'
        ? 'Active'
        : asset.status === 'Available'
        ? 'Available'
        : 'Under Maintenance / Repair';

      let calculatedEol = '-';
      if (asset.purchaseDate) {
        try {
          const date = new Date(asset.purchaseDate);
          date.setFullYear(date.getFullYear() + 5);
          calculatedEol = date.toISOString().split('T')[0];
        } catch (e) {
          calculatedEol = '-';
        }
      }

      drawRow('Asset ID', asset.id, true);
      drawRow('Asset Name', asset.name, true);
      drawRow('Brand', asset.brand || '-');
      drawRow('Model', asset.model || '-');
      drawRow('Category', categoryLabel);
      drawRow('Serial Number (S/N)', asset.serialNumber || '-');
      drawRow('Department / Unit', asset.department || '-');
      drawRow('Division / Branch', asset.division || '-');
      drawRow('Responsible Person', asset.responsiblePerson || '-');
      drawRow('Current Status', statusText, true);
      drawRow('Purchase Price', asset.purchasePrice ? formatCurrency(asset.purchasePrice, currency) : '-');
      drawRow('Warranty Expiry', asset.warrantyExpiryDate || '-');
      drawRow('Expected EOL Date', calculatedEol);

      // Draw Secure Asset Tag Container (Right Column, Card 1)
      const qrBoxX = 840;
      const qrBoxY = 280;
      const qrBoxW = 280;
      const qrBoxH = 360;
      const radius = 12;

      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      
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

      // Labels inside Secure Asset Tag Card
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SECURE ASSET TAG', qrBoxX + (qrBoxW / 2), qrBoxY + 265);

      ctx.fillStyle = '#00236f';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(asset.id, qrBoxX + (qrBoxW / 2), qrBoxY + 295);

      ctx.fillStyle = '#64748b';
      ctx.font = '11px sans-serif';
      ctx.fillText('Scan to verify asset in the system', qrBoxX + (qrBoxW / 2), qrBoxY + 320);
      ctx.fillText(`Serial No. ${asset.serialNumber || 'N/A'}`, qrBoxX + (qrBoxW / 2), qrBoxY + 338);

      // Reset text alignment
      ctx.textAlign = 'left';

      // Draw Audit Result Card (Right Column, Card 2)
      const arX = 840;
      const arY = 660;
      const arW = 280;
      const arH = 210;
      const arR = 12;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(arX + arR, arY);
      ctx.arcTo(arX + arW, arY, arX + arW, arY + arH, arR);
      ctx.arcTo(arX + arW, arY + arH, arX, arY + arH, arR);
      ctx.arcTo(arX, arY + arH, arX, arY, arR);
      ctx.arcTo(arX, arY, arX + arW, arY, arR);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Rounded Navy banner inside Audit Result Card
      ctx.fillStyle = '#00236f';
      ctx.beginPath();
      ctx.moveTo(arX + arR, arY);
      ctx.arcTo(arX + arW, arY, arX + arW, arY + 40, arR);
      ctx.lineTo(arX + arW, arY + 40);
      ctx.lineTo(arX, arY + 40);
      ctx.arcTo(arX, arY, arX + arW, arY, arR);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('AUDIT RESULT', arX + 20, arY + 25);

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('Overall Compliance Status', arX + 20, arY + 65);

      const isCompliant = asset.status === 'In Use';
      const isPartial = asset.status === 'Available';
      const isNonCompliant = asset.status === 'Repair';

      const drawCheckbox = (cx: number, cy: number, label: string, checked: boolean) => {
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx, cy, 14, 14);

        if (checked) {
          ctx.fillStyle = '#00236f';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText('✓', cx + 2, cy + 11);
        }

        ctx.fillStyle = '#0f172a';
        ctx.font = '13px sans-serif';
        ctx.fillText(label, cx + 22, cy + 12);
      };

      drawCheckbox(arX + 20, arY + 82, 'Compliant', isCompliant);
      drawCheckbox(arX + 20, arY + 107, 'Partial', isPartial);
      drawCheckbox(arX + 20, arY + 132, 'Non-Compliant', isNonCompliant);

      ctx.fillStyle = '#64748b';
      ctx.font = '11px sans-serif';
      ctx.fillText('Next Audit Due: .......................................', arX + 20, arY + 180);

      // Draw Section 2 - Technical Specifications Grid (Page 1 Bottom)
      const tsX = 80;
      const tsY = 900;
      const tsW = 1040;
      const tsH = 320;
      const tsR = 12;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(tsX + tsR, tsY);
      ctx.arcTo(tsX + tsW, tsY, tsX + tsW, tsY + tsH, tsR);
      ctx.arcTo(tsX + tsW, tsY + tsH, tsX, tsY + tsH, tsR);
      ctx.arcTo(tsX, tsY + tsH, tsX, tsY, tsR);
      ctx.arcTo(tsX, tsY, tsX + tsW, tsY, tsR);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Rounded Navy Banner for Technical Specs
      ctx.fillStyle = '#00236f';
      ctx.beginPath();
      ctx.moveTo(tsX + tsR, tsY);
      ctx.arcTo(tsX + tsW, tsY, tsX + tsW, tsY + 40, tsR);
      ctx.lineTo(tsX + tsW, tsY + 40);
      ctx.lineTo(tsX, tsY + 40);
      ctx.arcTo(tsX, tsY, tsX + tsW, tsY, tsR);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('TECHNICAL SPECIFICATIONS & HARDWARE', tsX + 20, tsY + 25);

      // Draw spec boxes with ZERO overlap!
      const drawSpecBox = (bx: number, by: number, label: string, value: string) => {
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        
        const bw = 490;
        const bh = 54;
        const br = 6;

        ctx.beginPath();
        ctx.moveTo(bx + br, by);
        ctx.arcTo(bx + bw, by, bx + bw, by + bh, br);
        ctx.arcTo(bx + bw, by + bh, bx, by + bh, br);
        ctx.arcTo(bx, by + bh, bx, by, br);
        ctx.arcTo(bx, by, bx + bw, by, br);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(label.toUpperCase(), bx + 15, by + 18);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(value || '-', bx + 15, by + 38);
      };

      // Spec row grid positions
      drawSpecBox(95, 960, 'Operating System (OS)', asset.specOS || '-');
      drawSpecBox(615, 960, 'Processor (CPU)', asset.specCPU || '-');

      drawSpecBox(95, 1025, 'Memory (RAM)', asset.specRAM || '-');
      drawSpecBox(615, 1025, 'Storage Capacity', asset.specStorage || '-');

      drawSpecBox(95, 1090, 'IP Address', asset.ipAddress || '-');
      drawSpecBox(615, 1090, 'Vendor / Supplier', asset.vendor || '-');

      drawSpecBox(95, 1155, 'MAC Wi-Fi', asset.macWifi || '-');
      drawSpecBox(615, 1155, 'MAC LAN', asset.macLan || '-');

      // Page 1 Footer Block
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(80, 1600);
      ctx.lineTo(1120, 1600);
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px sans-serif';
      ctx.fillText(`Document No.: IA-${asset.id}-${new Date().getFullYear()}   Version: 1.0   Classification: CONFIDENTIAL`, 80, 1630);
      ctx.fillText(`Generated by ${orgName} Intelligent Tagging Platform. This document is confidential and proprietary.`, 80, 1650);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('Page 1 of 2', 1120, 1630);

      // Create PDF Instance with Page 1 Image
      const imgData1 = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [1200, 1700],
      });
      pdf.addImage(imgData1, 'JPEG', 0, 0, 1200, 1700);


      // ================= PAGE 2 =================
      // Clear Canvas for page 2
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1200, 1700);

      // Logo/Header Area (Page 2)
      ctx.textAlign = 'left';
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(orgName.toUpperCase(), 80, 50);

      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      ctx.fillText(`IT Asset Management & Compliance Division | www.${cleanWebDomain}.example.com`, 80, 72);

      ctx.fillStyle = '#00236f';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('Compliance Verification & Sign-off', 80, 102);

      // Dividing top line
      ctx.strokeStyle = '#00236f';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(80, 115);
      ctx.lineTo(1120, 115);
      ctx.stroke();

      // Draw Security & Compliance Checklist rounded panel container
      const clX = 80;
      const clY = 140;
      const clW = 1040;
      const clH = 430;
      const clR = 12;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(clX + clR, clY);
      ctx.arcTo(clX + clW, clY, clX + clW, clY + clH, clR);
      ctx.arcTo(clX + clW, clY + clH, clX, clY + clH, clR);
      ctx.arcTo(clX, clY + clH, clX, clY, clR);
      ctx.arcTo(clX, clY, clX + clW, clY, clR);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Rounded Navy blue header for Compliance Checklist
      ctx.fillStyle = '#00236f';
      ctx.beginPath();
      ctx.moveTo(clX + clR, clY);
      ctx.arcTo(clX + clW, clY, clX + clW, clY + 40, clR);
      ctx.lineTo(clX + clW, clY + 40);
      ctx.lineTo(clX, clY + 40);
      ctx.arcTo(clX, clY, clX + clW, clY, clR);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('SECURITY & COMPLIANCE CHECKLIST', clX + 20, clY + 25);

      // Table Row Column Headers
      const tableHeaderY = clY + 40; // 180
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(80, tableHeaderY, 1040, 35);
      
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.strokeRect(80, tableHeaderY, 1040, 35);

      ctx.fillStyle = '#475569';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No.', 105, tableHeaderY + 22);
      ctx.textAlign = 'left';
      ctx.fillText('Compliance Item', 150, tableHeaderY + 22);
      ctx.textAlign = 'center';
      ctx.fillText('Status', 780, tableHeaderY + 22);
      ctx.textAlign = 'left';
      ctx.fillText('Remarks', 950, tableHeaderY + 22);

      const checklistItems = [
        'Antivirus / Endpoint Protection Installed',
        'Operating System License Valid',
        'Disk Encryption Enabled (BitLocker / FileVault)',
        'Latest OS Security Patch Applied',
        'Asset Tag Physically Verified',
        'Data Backup Configured',
        'No Unauthorized Software Detected',
        'Physical Condition Free of Damage'
      ];

      // Render Rows
      let rowY = tableHeaderY + 35; // 215
      checklistItems.forEach((item, idx) => {
        // Draw row background (alternate off-white)
        ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        ctx.fillRect(80, rowY, 1040, 39);

        // Draw borders for row
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.strokeRect(80, rowY, 1040, 39);

        // Column lines
        // No. column boundary line at X: 130
        ctx.beginPath();
        ctx.moveTo(130, rowY);
        ctx.lineTo(130, rowY + 39);
        // Status column boundary line at X: 660
        ctx.moveTo(660, rowY);
        ctx.lineTo(660, rowY + 39);
        // Remarks column boundary line at X: 900
        ctx.moveTo(900, rowY);
        ctx.lineTo(900, rowY + 39);
        ctx.stroke();

        // Print texts
        ctx.fillStyle = '#334155';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText((idx + 1).toString(), 105, rowY + 24);

        ctx.textAlign = 'left';
        ctx.fillText(item, 150, rowY + 24);

        // Draw Status check squares inside Status column
        const drawRowCheckbox = (cx: number, cy: number, label: string) => {
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 1;
          ctx.strokeRect(cx, cy, 12, 12);
          ctx.fillStyle = '#475569';
          ctx.font = '11px sans-serif';
          ctx.fillText(label, cx + 18, cy + 10);
        };

        drawRowCheckbox(680, rowY + 13, 'Pass');
        drawRowCheckbox(750, rowY + 13, 'Fail');
        drawRowCheckbox(820, rowY + 13, 'N/A');

        rowY += 39;
      });

      // Draw Auditor's Remarks & Recommendations Container Box
      const remX = 80;
      const remY = 600;
      const remW = 1040;
      const remH = 210;
      const remR = 12;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(remX + remR, remY);
      ctx.arcTo(remX + remW, remY, remX + remW, remY + remH, remR);
      ctx.arcTo(remX + remW, remY + remH, remX, remY + remH, remR);
      ctx.arcTo(remX, remY + remH, remX, remY, remR);
      ctx.arcTo(remX, remY, remX + remW, remY, remR);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Rounded Navy banner inside Remarks Box
      ctx.fillStyle = '#00236f';
      ctx.beginPath();
      ctx.moveTo(remX + remR, remY);
      ctx.arcTo(remX + remW, remY, remX + remW, remY + 40, remR);
      ctx.lineTo(remX + remW, remY + 40);
      ctx.lineTo(remX, remY + 40);
      ctx.arcTo(remX, remY, remX + remW, remY, remR);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText("AUDITOR'S REMARKS & RECOMMENDATIONS", remX + 20, remY + 25);

      // Draw light grey dotted horizontal writing lines inside remarks area
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      
      let lineY = remY + 75;
      for (let j = 0; j < 3; j++) {
        ctx.beginPath();
        ctx.moveTo(100, lineY);
        ctx.lineTo(1100, lineY);
        ctx.stroke();
        lineY += 38;
      }
      ctx.setLineDash([]); // Reset line dash

      // Auditor Signature Sign-off panel
      const signY = 850;

      const drawSignBlock = (colX: number, title: string) => {
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;

        // Signature line
        ctx.beginPath();
        ctx.moveTo(colX, signY + 60);
        ctx.lineTo(colX + 280, signY + 60);
        ctx.stroke();

        ctx.fillStyle = '#334155';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Signature: __________________________', colX, signY + 54);
        ctx.fillText('Name: ....................................................', colX, signY + 88);
        
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`Title: ${title}`, colX, signY + 114);
        
        ctx.fillStyle = '#334155';
        ctx.font = '12px sans-serif';
        ctx.fillText('Date: ....................................................', colX, signY + 140);
      };

      // Three side-by-side columns matching screenshot 2 exactly
      drawSignBlock(80, 'IT Officer / Auditor');
      drawSignBlock(460, 'IT Manager');
      drawSignBlock(840, 'CIO / IT Director');

      // Page 2 Footer Block
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(80, 1600);
      ctx.lineTo(1120, 1600);
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px sans-serif';
      ctx.fillText(`Document No.: IA-${asset.id}-${new Date().getFullYear()}   Version: 1.0   Classification: CONFIDENTIAL`, 80, 1630);
      ctx.fillText(`Generated by ${orgName} Intelligent Tagging Platform. This document is confidential and proprietary.`, 80, 1650);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('Page 2 of 2', 1120, 1630);

      // Add Page 2 to PDF
      pdf.addPage([1200, 1700], 'portrait');
      const imgData2 = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData2, 'JPEG', 0, 0, 1200, 1700);

      // Save PDF Report
      const rawOrgName = localStorage.getItem('assetmanager_org_name') || 'AssetManager IT';
      const cleanOrgName = rawOrgName.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9ก-๙_-]/g, '');
      pdf.save(`${cleanOrgName}_Compliance_Audit_Report_${asset.id}.pdf`);

      triggerToast('success', `ส่งออกไฟล์รายงาน PDF ครุภัณฑ์ตรวจสอบความถูกต้องแบบ 2 หน้า รหัส ${asset.id} สำเร็จ`);
    } catch (err) {
      console.error('PDF Export failed:', err);
      triggerToast('error', 'ไม่สามารถส่งออก PDF ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsExporting(false);
    }
  };

  // Form Fields State
  const [activeTab, setActiveTab] = useState<'general' | 'purchase' | 'technical' | 'assignee'>('general');
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

  const [formAssigneeName, setFormAssigneeName] = useState(asset.assignee?.name || '');
  const [formAssigneeRole, setFormAssigneeRole] = useState(asset.assignee?.role || '');
  const [formAssigneeDept, setFormAssigneeDept] = useState(asset.assignee?.department || '');
  const [formAssigneeEmail, setFormAssigneeEmail] = useState(asset.assignee?.email || '');
  const [formAssigneePhone, setFormAssigneePhone] = useState(asset.assignee?.phone || '');
  const [formAssigneeLocation, setFormAssigneeLocation] = useState(asset.assignee?.location || '');
  const [formAssigneeAvatar, setFormAssigneeAvatar] = useState(asset.assignee?.avatar || '');

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

    setFormAssigneeName(asset.assignee?.name || '');
    setFormAssigneeRole(asset.assignee?.role || '');
    setFormAssigneeDept(asset.assignee?.department || '');
    setFormAssigneeEmail(asset.assignee?.email || '');
    setFormAssigneePhone(asset.assignee?.phone || '');
    setFormAssigneeLocation(asset.assignee?.location || '');
    setFormAssigneeAvatar(asset.assignee?.avatar || '');
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

    const assigneeObj = formAssigneeName.trim() ? {
      name: formAssigneeName.trim(),
      role: formAssigneeRole.trim(),
      department: formAssigneeDept.trim(),
      email: formAssigneeEmail.trim(),
      phone: formAssigneePhone.trim(),
      location: formAssigneeLocation.trim(),
      avatar: formAssigneeAvatar.trim() || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
    } : undefined;

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
      detailedSpecs: currentSpecs.length > 0 ? currentSpecs : undefined,
      assignee: assigneeObj
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
              {/* Dynamic Status and Assignee badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                <div className="inline-flex items-center gap-1.5 bg-[#00494212] text-[#004942] px-3.5 py-1 rounded-full select-none">
                  <span className="w-2 h-2 rounded-full bg-[#004942]"></span>
                  <span className="text-[11px] font-bold">
                    {asset.status === 'In Use'
                      ? 'ใช้งานปกติ (Active)'
                      : asset.status === 'Available'
                      ? 'พร้อมเบิกใช้งาน (Available)'
                      : 'อยู่ระหว่างซ่อมบำรุง (Repair)'}
                  </span>
                </div>

                {asset.assignee ? (
                  <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 border border-blue-200 px-3.5 py-1 rounded-full select-none">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-[11px] font-bold">
                      ผู้รับผิดชอบ: {asset.assignee.name}
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-800 border border-rose-200 px-3.5 py-1 rounded-full select-none font-bold">
                    <UserX className="w-3.5 h-3.5 text-rose-500" />
                    <span className="text-[11px] font-bold">
                      Unassigned
                    </span>
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold text-slate-800 font-sans tracking-tight mb-2">
                {asset.name}
              </h3>
              <p className="text-xs text-slate-400 font-medium font-mono">Model: {asset.brand && asset.model ? `${asset.brand} ${asset.model}` : 'Standard Hardware'}</p>
              <p className="text-xs text-slate-400 font-semibold font-mono mt-0.5">Serial: {asset.serialNumber || 'N/A'}</p>
            </div>

            {/* Quick specifications grid cards */}
            <div className="grid grid-cols-1 gap-1">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">CPU</span>
                <p className="text-sm font-bold text-primary leading-tight truncate">{asset.specCPU || '-'}</p>
                <span className="text-[9px] text-slate-400 font-medium">Processor</span>
              </div>
            </div>



            <div className="grid grid-cols-2 gap-1">
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
              <span className="font-bold text-slate-700">{formatCurrency(asset.purchasePrice, currency)}</span>
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
        <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 font-sans text-sm flex items-center gap-2.5">
              <User className="w-4.5 h-4.5 text-primary" />
              <span>ผู้รับผิดชอบปัจจุบัน</span>
            </h4>
            {asset.assignee ? (
              <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-blue-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                Assigned
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                Unassigned
              </span>
            )}
          </div>
          
          {asset.assignee ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="flex items-center gap-3.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <img
                  className="w-11 h-11 rounded-full object-cover shadow-sm border border-slate-200 shrink-0"
                  src={asset.assignee.avatar}
                  alt={asset.assignee.name}
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <User className="w-3.5 h-3.5 text-primary shrink-0" />
                    <p className="text-xs font-bold text-slate-800 truncate leading-none">{asset.assignee.name}</p>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium truncate">{asset.assignee.role}, {asset.assignee.department}</p>
                </div>
              </div>
              <div className="space-y-2 text-xs text-slate-500 font-medium bg-slate-50/50 p-3 rounded-xl border border-slate-100/60">
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
            <div className="py-6 flex flex-col items-center justify-center text-center gap-2.5 text-slate-400 bg-rose-50/25 rounded-2xl border border-dashed border-rose-200/60 flex-grow">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shadow-xs">
                <UserX className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <span className="inline-flex bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md mb-1 uppercase tracking-wide">
                  Unassigned
                </span>
                <p className="text-xs font-semibold text-slate-600 mt-1">ไม่มีการมอบหมายผู้ใช้ครอง</p>
                <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto mt-0.5 leading-normal">ครุภัณฑ์นี้ว่างอยู่และพร้อมนำไปจัดสรรหรือส่งซ่อมบำรุง</p>
              </div>
              <button
                onClick={() => setIsEditOpen(true)}
                className="mt-1 text-xs text-[#00236f] hover:text-primary font-bold hover:underline cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-sm"
              >
                + มอบหมายผู้รับผิดชอบหลัก
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
              <button
                type="button"
                onClick={() => setActiveTab('assignee')}
                className={`flex-1 py-2 px-3 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'assignee'
                    ? 'bg-white text-primary shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                4. ผู้รับผิดชอบปัจจุบัน
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
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">{`ราคากลางจัดซื้อ (Purchase Price - ${getCurrencySymbol(currency)})`}</label>
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

                {activeTab === 'assignee' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <h4 className="text-xs font-bold text-primary border-b border-slate-100 pb-1">ข้อมูลผู้รับผิดชอบปัจจุบัน / ผู้ครอบครองเครื่อง (Assignee Details)</h4>
                    <p className="text-[10px] text-slate-500 font-medium leading-normal bg-blue-50/50 p-2.5 rounded-lg border border-blue-100/50">
                      ℹ️ กรอกข้อมูลเพื่อมอบหมายหรือเปลี่ยนผู้ถือครองของครุภัณฑ์ชิ้นนี้ หากต้องการนำผู้ใช้ครองออก (ตั้งเป็น Unassigned) ให้เว้นว่างที่ช่อง <strong>"ชื่อ-นามสกุล"</strong>
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">ชื่อ-นามสกุล ผู้ถือครอง</label>
                        <input
                          type="text"
                          value={formAssigneeName}
                          onChange={(e) => setFormAssigneeName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                          placeholder="เช่น สิริวิมล วิเศษศิลป์"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">ตำแหน่งงาน (Role)</label>
                        <input
                          type="text"
                          value={formAssigneeRole}
                          onChange={(e) => setFormAssigneeRole(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                          placeholder="เช่น Graphic Designer"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">แผนก / ทีม (Department)</label>
                        <input
                          type="text"
                          value={formAssigneeDept}
                          onChange={(e) => setFormAssigneeDept(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                          placeholder="เช่น Creative Team"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">อีเมลผู้ถือครอง (Email)</label>
                        <input
                          type="email"
                          value={formAssigneeEmail}
                          onChange={(e) => setFormAssigneeEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none font-mono"
                          placeholder="เช่น siriwimon.v@company.com"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">เบอร์โทรศัพท์ / เบอร์ภายใน (Phone)</label>
                        <input
                          type="text"
                          value={formAssigneePhone}
                          onChange={(e) => setFormAssigneePhone(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                          placeholder="เช่น Ext. 402 หรือ 081-xxxxxxx"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">สถานที่ปฏิบัติงาน / โต๊ะทำงาน (Location)</label>
                        <input
                          type="text"
                          value={formAssigneeLocation}
                          onChange={(e) => setFormAssigneeLocation(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                          placeholder="เช่น ชั้น 4, ฝั่ง West Wing"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">ลิงก์รูปภาพโปรไฟล์ (Avatar URL)</label>
                        <input
                          type="text"
                          value={formAssigneeAvatar}
                          onChange={(e) => setFormAssigneeAvatar(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none font-mono"
                          placeholder="https://example.com/avatar.png (เว้นว่างไว้เพื่อดึงรูปโปรไฟล์ดีฟอลต์)"
                        />
                      </div>
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
                                <p className="text-[9px] font-black uppercase tracking-wider text-slate-800 border-b border-black pb-0.5 mb-1.5 font-sans truncate" title={localStorage.getItem('assetmanager_org_name') || 'IT ASSET SECURITY TAG'}>
                                  🏢 {localStorage.getItem('assetmanager_org_name')?.toUpperCase() || 'IT ASSET SECURITY TAG'}
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
                              {showCorporate && <p className="text-[10px] font-black tracking-widest text-slate-800 font-sans truncate">🏢 {localStorage.getItem('assetmanager_org_name')?.toUpperCase() || 'GOVERNMENT IT ASSET CONTROL'}</p>}
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
                <div className="direct-print-header">🏢 {localStorage.getItem('assetmanager_org_name')?.toUpperCase() || 'IT ASSET SECURITY TAG'}</div>
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
