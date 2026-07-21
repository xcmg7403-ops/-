import React, { useState, useMemo, useEffect } from 'react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { Asset, AssetCategory, AssetStatus } from '../types';
import { getCurrencySymbol } from '../lib/currency';
import {
  Search,
  Plus,
  FileSpreadsheet,
  Laptop,
  Server,
  Network,
  Monitor,
  Boxes,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  Cpu,
  Scan,
  Printer,
  QrCode,
  Settings,
  Layout,
  Download,
  CheckSquare,
  Square,
  X
} from 'lucide-react';
import QRScannerModal from './QRScannerModal';

interface InventoryViewProps {
  assets: Asset[];
  onSelectAsset: (id: string) => void;
  onAddAsset: (asset: Asset) => void;
  onEditAsset: (asset: Asset) => void;
  onDeleteAsset: (id: string) => void;
  triggerToast: (type: 'success' | 'error' | 'info', message: string) => void;
  onImportAssets?: (assets: Asset[]) => void;
  currency?: string;
}

export default function InventoryView({
  assets,
  onSelectAsset,
  onAddAsset,
  onEditAsset,
  onDeleteAsset,
  triggerToast,
  onImportAssets,
  currency = 'THB (฿) - Thai Baht'
}: InventoryViewProps) {
  // Filters & State
  const [selectedCategory, setSelectedCategory] = useState<string>('ทั้งหมด');
  const [selectedStatus, setSelectedStatus] = useState<string>('ทุกสถานะ');
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Multi-Selection and QR Code Sticker Generator states
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [qrUrls, setQrUrls] = useState<{ [id: string]: string }>({});
  
  // Sticker configurations (optimized for sticker printers / label sheets)
  const [stickerColumns, setStickerColumns] = useState<number>(2);
  const [stickerWidth, setStickerWidth] = useState<number>(65); // in mm
  const [stickerHeight, setStickerHeight] = useState<number>(35); // in mm
  const [stickerGap, setStickerGap] = useState<number>(3); // in mm
  const [stickerFontSize, setStickerFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [stickerCustomTitle, setStickerCustomTitle] = useState<string>('IT ASSET TAG');
  const [showAssetId, setShowAssetId] = useState<boolean>(true);
  const [showAssetName, setShowAssetName] = useState<boolean>(true);
  const [showSerial, setShowSerial] = useState<boolean>(true);
  const [showCategory, setShowCategory] = useState<boolean>(true);
  const [showDepartment, setShowDepartment] = useState<boolean>(true);
  const [showStatus, setShowStatus] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);

  // Form Fields State
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formSerial, setFormSerial] = useState('');
  const [formCategory, setFormCategory] = useState<AssetCategory>('Notebook');
  const [formDept, setFormDept] = useState('');
  const [formStatus, setFormStatus] = useState<AssetStatus>('Available');
  const [formPrice, setFormPrice] = useState<number>(35000);
  const [formVendor, setFormVendor] = useState('');
  const [formPO, setFormPO] = useState('');
  const [formPurchaseDate, setFormPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formExpiryDate, setFormExpiryDate] = useState(() => {
    const threeYearsLater = new Date();
    threeYearsLater.setFullYear(threeYearsLater.getFullYear() + 3);
    return threeYearsLater.toISOString().split('T')[0];
  });
  const [formCPU, setFormCPU] = useState('');
  const [formRAM, setFormRAM] = useState('');
  const [formStorage, setFormStorage] = useState('');
  const [formOS, setFormOS] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formDivision, setFormDivision] = useState('');
  const [formResponsible, setFormResponsible] = useState('');
  const [formIP, setFormIP] = useState('');
  const [formWifi, setFormWifi] = useState('');
  const [formLan, setFormLan] = useState('');
  const [formRemarks, setFormRemarks] = useState('');

  // Category mapping for dropdown display
  const categoriesMap: { [key: string]: string } = {
    'ทั้งหมด': 'ทั้งหมด',
    'PC': 'PC (คอมพิวเตอร์ตั้งโต๊ะ)',
    'Notebook': 'Notebook (โน้ตบุ๊ก)',
    'Office Furniture': 'เฟอร์นิเจอร์สำนักงาน',
    'Electrical Appliances': 'เครื่องใช้ไฟฟ้า',
    'Vehicles': 'ยานพาหนะ',
    'Peripherals': 'อุปกรณ์ต่อพ่วง',
    'Network': 'อุปกรณ์เครือข่าย',
    'Server': 'เซิร์ฟเวอร์หลัก',
    'Display': 'จอแสดงผล'
  };

  const statusMap: { [key: string]: string } = {
    'ทุกสถานะ': 'ทุกสถานะ',
    'In Use': 'In Use (กำลังใช้งาน)',
    'Available': 'Available (ว่าง/พร้อมใช้)',
    'Repair': 'Repair (รอซ่อม)'
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingAsset(null);
    const currentYear = new Date().getFullYear();
    const currentBE = currentYear + 543;
    // Auto-generate some sensible asset code
    const generatedId = `IT-NB-${currentBE}-${String(Math.floor(Math.random() * 900) + 100)}`;
    setFormId(generatedId);
    setFormName('');
    setFormSerial('');
    setFormCategory('Notebook');
    setFormDept('');
    setFormStatus('Available');
    setFormPrice(29000);
    setFormVendor('JIB Computer Group');
    setFormPO(`PO-${currentYear}/` + Math.floor(Math.random() * 300));
    setFormPurchaseDate(new Date().toISOString().split('T')[0]);
    
    const threeYearsLater = new Date();
    threeYearsLater.setFullYear(threeYearsLater.getFullYear() + 3);
    setFormExpiryDate(threeYearsLater.toISOString().split('T')[0]);
    setFormCPU('');
    setFormRAM('');
    setFormStorage('');
    setFormOS('Windows 11 Pro');
    setFormBrand('');
    setFormModel('');
    setFormDivision('');
    setFormResponsible('');
    setFormIP('192.168.1.');
    setFormWifi('');
    setFormLan('');
    setFormRemarks('');
    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (asset: Asset) => {
    setEditingAsset(asset);
    setFormId(asset.id);
    setFormName(asset.name);
    setFormSerial(asset.serialNumber);
    setFormCategory(asset.category);
    setFormDept(asset.department);
    setFormStatus(asset.status);
    setFormPrice(asset.purchasePrice);
    setFormVendor(asset.vendor || 'iStudio by SPVi');
    setFormPO(asset.purchaseOrder || 'PO-2023/112');
    setFormPurchaseDate(asset.purchaseDate || '2023-03-15');
    setFormExpiryDate(asset.warrantyExpiryDate || '2026-03-15');
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
    setIsFormOpen(true);
  };

  // Submit Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim() || !formSerial.trim()) {
      triggerToast('error', 'กรุณากรอกข้อมูล ชื่อสินทรัพย์ และ Serial Number ให้ครบถ้วน');
      return;
    }

    const compiledAsset: Asset = {
      id: formId,
      name: formName,
      serialNumber: formSerial,
      category: formCategory,
      department: formDept,
      status: formStatus,
      purchasePrice: Number(formPrice),
      vendor: formVendor,
      purchaseOrder: formPO,
      purchaseDate: formPurchaseDate,
      warrantyExpiryDate: formExpiryDate,
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
      imageUrl: editingAsset?.imageUrl || '',
      detailedSpecs: editingAsset?.detailedSpecs || [
        { item: 'Display', details: 'FHD IPS Screen', status: 'Optimal' },
        { item: 'OS Version', details: 'OS preinstalled', status: 'Up to date' }
      ],
      assignee: editingAsset?.assignee,
      repairsHistory: editingAsset?.repairsHistory || []
    };

    if (editingAsset) {
      onEditAsset(compiledAsset);
      triggerToast('success', `แก้ไขข้อมูลครุภัณฑ์ ${formId} สำเร็จ`);
    } else {
      onAddAsset(compiledAsset);
      triggerToast('success', `ลงทะเบียนครุภัณฑ์ ${formId} เข้าสู่ระบบสำเร็จ`);
    }

    setIsFormOpen(false);
  };

  // Filter Logic
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // 1. Category Filter
      if (selectedCategory !== 'ทั้งหมด') {
        const engCategory = Object.keys(categoriesMap).find(
          (key) => categoriesMap[key] === selectedCategory
        );
        if (asset.category !== engCategory) return false;
      }

      // 2. Status Filter
      if (selectedStatus !== 'ทุกสถานะ') {
        const engStatus = Object.keys(statusMap).find(
          (key) => statusMap[key] === selectedStatus
        );
        if (asset.status !== engStatus) return false;
      }

      // 3. Search Filter
      if (localSearchQuery.trim()) {
        const query = localSearchQuery.toLowerCase();
        return (
          asset.id.toLowerCase().includes(query) ||
          asset.name.toLowerCase().includes(query) ||
          asset.serialNumber.toLowerCase().includes(query) ||
          (asset.department && asset.department.toLowerCase().includes(query))
        );
      }

      return true;
    });
  }, [assets, selectedCategory, selectedStatus, localSearchQuery]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage) || 1;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredAssets.length, totalPages, currentPage]);

  const paginatedAssets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAssets.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAssets, currentPage, itemsPerPage]);

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

  // Export to CSV helper
  const handleExportToExcel = () => {
    try {
      // Assemble CSV Headers
      const headers = ['Asset ID', 'Name', 'Serial Number', 'Category', 'Department', 'Status', 'Purchase Price', 'Warranty Expiry'];
      const rows = filteredAssets.map(asset => [
        asset.id,
        `"${asset.name.replace(/"/g, '""')}"`,
        asset.serialNumber,
        asset.category,
        asset.department,
        asset.status,
        asset.purchasePrice,
        asset.warrantyExpiryDate
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
        + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'AssetManager_Inventory_Export.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      triggerToast('success', `ดาวน์โหลดไฟล์ทะเบียนครุภัณฑ์ (${filteredAssets.length} รายการ) สำเร็จ`);
    } catch (e) {
      triggerToast('error', 'เกิดข้อผิดพลาดในการสร้างไฟล์นำออกข้อมูล');
    }
  };

  // Download Import Template (CSV)
  const handleDownloadTemplate = () => {
    const headers = [
      'Asset ID',
      'Name',
      'Serial Number',
      'Category',
      'Department',
      'Status',
      'Purchase Price',
      'Warranty Expiry',
      'Brand',
      'Model',
      'CPU',
      'RAM',
      'Storage',
      'OS',
      'Vendor',
      'Purchase Order',
      'Purchase Date',
      'Division',
      'Responsible Person',
      'IP Address',
      'Remarks'
    ];
    
    const sampleRows = [
      [
        'IT-NB-2569-001',
        'Dell Latitude 5440 Laptop',
        'S/N-DELL-5440-ABC',
        'Notebook',
        'IT Operations',
        'Available',
        '35000',
        '2028-07-16',
        'Dell',
        'Latitude 5440',
        'Intel Core i5',
        '16GB DDR5',
        '512GB SSD NVMe',
        'Windows 11 Pro',
        'Dell Thailand',
        'PO-2026-0001',
        '2026-07-16',
        'Infrastructure Division',
        'Somsak Jaidee',
        '192.168.1.55',
        'Premium quality notebook for general office use'
      ],
      [
        'IT-PC-2569-002',
        'HP Pro Tower 400 G9 PC',
        'S/N-HP-PRO-XYZ',
        'PC',
        'Finance & Accounting',
        'In Use',
        '24500',
        '2029-01-10',
        'HP',
        'Pro Tower 400',
        'Intel Core i7',
        '8GB DDR4',
        '256GB SSD',
        'Windows 11 Home',
        'HP Direct',
        'PO-2026-0002',
        '2026-07-17',
        'Accounting Team',
        'Wipa Thaimit',
        '192.168.1.102',
        'Standard workstation with low power usage'
      ]
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(','), ...sampleRows.map(e => e.join(',')).map(line => line.replace(/\n/g, ' '))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'AssetManager_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('success', 'ดาวน์โหลดเทมเพลตนำเข้าครุภัณฑ์ (CSV Template) สำเร็จแล้ว');
  };

  // Import durable goods registry list from CSV
  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          triggerToast('error', 'ไฟล์เปล่าหรือรูปแบบข้อมูลไม่ถูกต้อง');
          return;
        }

        // Dynamically detect CSV delimiter (comma vs semicolon vs tab)
        let delimiter = ',';
        const firstLine = text.split(/\r?\n/)[0] || '';
        const commaCount = (firstLine.match(/,/g) || []).length;
        const semiCount = (firstLine.match(/;/g) || []).length;
        const tabCount = (firstLine.match(/\t/g) || []).length;
        if (semiCount > commaCount && semiCount > tabCount) {
          delimiter = ';';
        } else if (tabCount > commaCount && tabCount > semiCount) {
          delimiter = '\t';
        }

        const lines: string[][] = [];
        let row: string[] = [];
        let inQuotes = false;
        let currentValue = '';

        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const nextChar = text[i + 1];

          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              currentValue += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === delimiter && !inQuotes) {
            row.push(currentValue.trim());
            currentValue = '';
          } else if ((char === '\r' || char === '\n') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') {
              i++;
            }
            row.push(currentValue.trim());
            if (row.length > 0 && row.some(cell => cell !== '')) {
              lines.push(row);
            }
            row = [];
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        if (currentValue || row.length > 0) {
          row.push(currentValue.trim());
          if (row.some(cell => cell !== '')) {
            lines.push(row);
          }
        }

        if (lines.length < 2) {
          triggerToast('error', 'ไม่พบข้อมูลครุภัณฑ์สำหรับการนำเข้า (ต้องมีแถวหัวตารางและแถวข้อมูล)');
          return;
        }

        // Normalize column headers to allow extremely fuzzy matching
        const normalizeHeader = (str: string) => {
          return str.toLowerCase().trim().replace(/["']/g, '').replace(/[\s_-]+/g, '');
        };

        const headers = lines[0].map(h => normalizeHeader(h));
        const dataRows = lines.slice(1);

        const parsedAssets: Asset[] = [];
        let successCount = 0;
        let errorCount = 0;

        for (const cells of dataRows) {
          if (cells.length < 1) continue;

          const getValueByHeader = (possibleNames: string[]) => {
            const normalizedNames = possibleNames.map(p => normalizeHeader(p));
            const index = headers.findIndex(h => normalizedNames.includes(h));
            return index !== -1 ? cells[index] || '' : '';
          };

          let id = getValueByHeader(['asset id', 'id', 'รหัสครุภัณฑ์', 'รหัส', 'เลขครุภัณฑ์', 'รหัสสินค้า', 'assetid', 'asset_id', 'รหัสสินทรัพย์', 'หมายเลขครุภัณฑ์']).replace(/["']/g, '').trim();
          const name = getValueByHeader(['name', 'ชื่อครุภัณฑ์', 'ชื่อ', 'item name', 'item', 'ชื่อรายการ', 'asset name', 'assetname', 'asset_name', 'ชื่อสินทรัพย์']).replace(/["']/g, '').trim();
          
          if (!name) {
            errorCount++;
            continue;
          }

          if (!id) {
            // Auto-generate a unique asset ID if missing but name exists
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const randSuffix = Math.floor(1000 + Math.random() * 9000);
            id = `IT-GEN-${dateStr}-${randSuffix}`;
          }

          const serialNumber = getValueByHeader(['serial number', 'serial', 's/n', 'ซีเรียล', 'หมายเลขเครื่อง', 'เลขซีเรียล', 'serialnumber', 'serial_number', 'หมายเลขซีเรียล', 'เลขที่ซีเรียล']).replace(/["']/g, '').trim() || 'S/N-UNKNOWN';
          const categoryRaw = getValueByHeader(['category', 'หมวดหมู่', 'ประเภท', 'หมวดหมู่ครุภัณฑ์', 'ชนิด', 'ประเภทครุภัณฑ์']).replace(/["']/g, '').trim();
          const department = getValueByHeader(['department', 'แผนก', 'สังกัด', 'หน่วยงาน', 'ฝ่าย', 'กอง']).replace(/["']/g, '').trim() || 'General Operations';
          const statusRaw = getValueByHeader(['status', 'สถานะ', 'สถานะการใช้งาน']).replace(/["']/g, '').trim();
          const priceRaw = getValueByHeader(['purchase price', 'price', 'ราคา', 'ราคาซื้อ', 'ราคาทุน', 'มูลค่า', 'purchaseprice', 'purchase_price', 'ราคาจัดซื้อ']).replace(/["']/g, '').trim();
          const warrantyExpiryDate = getValueByHeader(['warranty expiry', 'expiry', 'วันหมดประกัน', 'วันสิ้นสุดประกัน', 'หมดประกัน', 'warrantyexpiry', 'warranty_expiry', 'วันที่หมดประกัน']).replace(/["']/g, '').trim() || 'Expired';

          const brand = getValueByHeader(['brand', 'ยี่ห้อ', 'แบรนด์']).replace(/["']/g, '').trim();
          const model = getValueByHeader(['model', 'รุ่น', 'โมเดล']).replace(/["']/g, '').trim();
          const specCPU = getValueByHeader(['cpu', 'หน่วยประมวลผล', 'spec cpu', 'ซีพียู', 'สเปค cpu']).replace(/["']/g, '').trim();
          const specRAM = getValueByHeader(['ram', 'หน่วยความจำ', 'spec ram', 'แรม', 'ขนาดแรม', 'สเปค ram']).replace(/["']/g, '').trim();
          const specStorage = getValueByHeader(['storage', 'ฮาร์ดดิสก์', 'spec storage', 'ความจุ', 'ความจุฮาร์ดดิสก์', 'สเปค storage']).replace(/["']/g, '').trim();
          const specOS = getValueByHeader(['os', 'ระบบปฏิบัติการ', 'spec os', 'ระบบปฏิบัติการ (os)', 'โอเอส', 'สเปค os']).replace(/["']/g, '').trim();
          
          const vendor = getValueByHeader(['vendor', 'ผู้จัดจำหน่าย', 'ร้านค้า', 'ผู้ขาย', 'บริษัทคู่ค้า']).replace(/["']/g, '').trim();
          const purchaseOrder = getValueByHeader(['purchase order', 'po', 'ใบสั่งซื้อ', 'เลขที่ใบสั่งซื้อ', 'purchaseorder', 'purchase_order', 'ใบจัดซื้อ']).replace(/["']/g, '').trim();
          const purchaseDate = getValueByHeader(['purchase date', 'วันที่ซื้อ', 'วันจัดซื้อ', 'purchasedate', 'purchase_date', 'วันที่จัดซื้อ']).replace(/["']/g, '').trim() || new Date().toISOString().split('T')[0];
          const division = getValueByHeader(['division', 'ทีม', 'ฝ่าย', 'กอง', 'ส่วนงาน']).replace(/["']/g, '').trim();
          const responsiblePerson = getValueByHeader(['responsible person', 'ผู้ดูแล', 'ผู้รับผิดชอบ', 'ผู้ใช้งาน', 'responsibleperson', 'responsible_person', 'ชื่อผู้ใช้งาน']).replace(/["']/g, '').trim();
          const ipAddress = getValueByHeader(['ip address', 'ip', 'ไอพี', 'เลขไอพี', 'ipaddress', 'ip_address', 'ที่อยู่ ip']).replace(/["']/g, '').trim();
          const remarks = getValueByHeader(['remarks', 'หมายเหตุ']).replace(/["']/g, '').trim();

          let category: AssetCategory = 'Notebook';
          const catLower = categoryRaw.toLowerCase().trim();
          if (catLower.includes('pc') || catLower.includes('desktop') || catLower.includes('พีซี') || catLower.includes('ตั้งโต๊ะ')) category = 'PC';
          else if (catLower.includes('notebook') || catLower.includes('laptop') || catLower.includes('โน้ตบุ๊ก') || catLower.includes('แล็ปท็อป') || catLower.includes('โน๊ตบุ๊ค')) category = 'Notebook';
          else if (catLower.includes('furniture') || catLower.includes('โต๊ะ') || catLower.includes('เก้าอี้') || catLower.includes('เฟอร์นิเจอร์')) category = 'Office Furniture';
          else if (catLower.includes('appliance') || catLower.includes('electrical') || catLower.includes('เครื่องใช้ไฟฟ้า') || catLower.includes('แอร์') || catLower.includes('พัดลม')) category = 'Electrical Appliances';
          else if (catLower.includes('vehicle') || catLower.includes('รถ') || catLower.includes('ยานพาหนะ')) category = 'Vehicles';
          else if (catLower.includes('peripheral') || catLower.includes('accessory') || catLower.includes('เมาส์') || catLower.includes('คีย์บอร์ด') || catLower.includes('อุปกรณ์ต่อพ่วง')) category = 'Peripherals';
          else if (catLower.includes('network') || catLower.includes('switch') || catLower.includes('router') || catLower.includes('เน็ตเวิร์ก') || catLower.includes('เราเตอร์')) category = 'Network';
          else if (catLower.includes('server') || catLower.includes('เซิร์ฟเวอร์')) category = 'Server';
          else if (catLower.includes('display') || catLower.includes('monitor') || catLower.includes('จอ') || catLower.includes('หน้าจอ')) category = 'Display';

          let status: AssetStatus = 'Available';
          const statLower = statusRaw.toLowerCase().trim();
          if (statLower.includes('in use') || statLower.includes('active') || statLower.includes('ใช้งาน') || statLower.includes('กำลังใช้งาน')) status = 'In Use';
          else if (statLower.includes('repair') || statLower.includes('ซ่อม') || statLower.includes('ชำรุด') || statLower.includes('ส่งซ่อม')) status = 'Repair';
          else if (statLower.includes('available') || statLower.includes('ว่าง') || statLower.includes('พร้อมใช้') || statLower.includes('พร้อมใช้งาน')) status = 'Available';

          const purchasePrice = parseFloat(priceRaw) || 0;

          const newAsset: Asset = {
            id,
            name,
            serialNumber,
            category,
            department,
            status,
            purchasePrice,
            vendor,
            purchaseOrder,
            purchaseDate,
            warrantyExpiryDate,
            specCPU,
            specRAM,
            specStorage,
            specOS,
            brand,
            model,
            division,
            responsiblePerson,
            ipAddress,
            remarks
          };

          parsedAssets.push(newAsset);
          successCount++;
        }

        if (parsedAssets.length === 0) {
          triggerToast('error', 'ไม่พบคอลัมน์ที่จำเป็น หรือไม่มีข้อมูลครุภัณฑ์ที่สามารถนำเข้าได้');
          return;
        }

        if (onImportAssets) {
          onImportAssets(parsedAssets);
        } else {
          parsedAssets.forEach(onAddAsset);
        }

        triggerToast('success', `นำเข้าครุภัณฑ์เสร็จสิ้นจำนวน ${successCount} รายการสำเร็จ! ${errorCount > 0 ? `(เกิดข้อผิดพลาดในการนำเข้า ${errorCount} แถวเนื่องจากขาดรหัสหรือชื่อครุภัณฑ์)` : ''}`);
      } catch (err) {
        console.error('Import CSV error:', err);
        triggerToast('error', 'เกิดข้อผิดพลาดในการประมวลผลไฟล์ นำเข้าไม่สำเร็จ');
      }
    };
    reader.readAsText(file, 'UTF-8');
    event.target.value = '';
  };

  // Open sticker print setup modal and generate QR Codes for selection
  const handleOpenPrintModal = async () => {
    if (selectedAssetIds.length === 0) {
      triggerToast('error', 'กรุณาเลือกครุภัณฑ์อย่างน้อย 1 รายการเพื่อเริ่มพิมพ์ QR Code');
      return;
    }
    
    setIsPrintModalOpen(true);
    triggerToast('info', 'กำลังสร้าง QR Codes...');
    
    const urls: { [id: string]: string } = {};
    for (const id of selectedAssetIds) {
      try {
        const url = await QRCode.toDataURL(id, {
          margin: 1,
          width: 150,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        });
        urls[id] = url;
      } catch (err) {
        console.error('Failed to generate QR Code:', err);
      }
    }
    setQrUrls(urls);
    triggerToast('success', 'เตรียมรหัส QR Codes สำหรับครุภัณฑ์ที่เลือกทั้งหมดเรียบร้อยแล้ว');
  };

  // Print function using browser print API
  const handlePrint = () => {
    window.print();
  };

  // Advanced sticker PDF generator
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    triggerToast('info', 'กำลังสร้างไฟล์เอกสาร PDF สำหรับการพิมพ์สติกเกอร์...');
    
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // A4 dimensions: 210 x 297 mm
      const pageW = 210;
      const pageH = 297;
      
      const marginX = 10; // Left margin in mm
      const marginY = 15; // Top margin in mm
      
      const selectedAssets = assets.filter(asset => selectedAssetIds.includes(asset.id));
      
      let currentCol = 0;
      let currentRow = 0;

      for (let i = 0; i < selectedAssets.length; i++) {
        const asset = selectedAssets[i];
        const qrDataUrl = qrUrls[asset.id];
        
        if (currentCol >= stickerColumns) {
          currentCol = 0;
          currentRow++;
        }
        
        // Calculate Y position
        const currentYPos = marginY + (currentRow * (stickerHeight + stickerGap));
        const bottomY = currentYPos + stickerHeight;
        
        // Page break if label height overflows page limit
        if (bottomY > (pageH - marginY)) {
          doc.addPage();
          currentRow = 0;
          currentCol = 0;
        }

        const x = marginX + (currentCol * (stickerWidth + stickerGap));
        const y = marginY + (currentRow * (stickerHeight + stickerGap));

        // Draw sticker contour border (subtle light gray)
        doc.setDrawColor(220, 225, 230);
        doc.setLineWidth(0.15);
        doc.rect(x, y, stickerWidth, stickerHeight);

        // QR Code sizing (maintain nice proportional sizing on the left)
        const qrSize = Math.min(stickerHeight - 4, stickerWidth * 0.4);
        const qrX = x + 2;
        const qrY = y + (stickerHeight - qrSize) / 2;

        if (qrDataUrl) {
          doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
        }

        // Draw text info right of the QR code
        const textX = qrX + qrSize + 3;
        let textY = y + 5;
        const textWidth = stickerWidth - (qrSize + 7);

        // Header Title
        doc.setTextColor(0, 35, 111); // deep blue
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(stickerFontSize === 'sm' ? 6 : stickerFontSize === 'lg' ? 8 : 7);
        
        const displayTitle = stickerCustomTitle || 'IT ASSET TAG';
        doc.text(displayTitle, textX, textY);
        
        // Blue horizontal divider
        doc.setDrawColor(0, 35, 111);
        doc.setLineWidth(0.1);
        doc.line(textX, textY + 1, textX + textWidth, textY + 1);
        
        textY += 4.5;

        // Reset details font
        doc.setTextColor(40, 50, 60);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(stickerFontSize === 'sm' ? 5.5 : stickerFontSize === 'lg' ? 7.5 : 6.5);

        const lineSpacing = stickerFontSize === 'sm' ? 2.8 : stickerFontSize === 'lg' ? 3.8 : 3.3;

        if (showAssetId) {
          doc.setFont('Helvetica', 'bold');
          doc.text(`ID: ${asset.id}`, textX, textY);
          doc.setFont('Helvetica', 'normal');
          textY += lineSpacing;
        }

        if (showAssetName) {
          let displayName = asset.name;
          if (displayName.length > 22) {
            displayName = displayName.substring(0, 20) + '...';
          }
          doc.text(`Name: ${displayName}`, textX, textY);
          textY += lineSpacing;
        }

        if (showSerial) {
          doc.text(`S/N: ${asset.serialNumber || '-'}`, textX, textY);
          textY += lineSpacing;
        }

        if (showCategory) {
          doc.text(`Cat: ${asset.category}`, textX, textY);
          textY += lineSpacing;
        }

        if (showDepartment) {
          const dept = asset.department || '-';
          doc.text(`Dept: ${dept}`, textX, textY);
          textY += lineSpacing;
        }

        if (showStatus) {
          doc.text(`Status: ${asset.status}`, textX, textY);
          textY += lineSpacing;
        }

        currentCol++;
      }

      doc.save(`IT_Asset_QR_Stickers_${selectedAssets.length}_pcs.pdf`);
      triggerToast('success', `ดาวน์โหลดสติกเกอร์ PDF (${selectedAssets.length} ดวง) เรียบร้อยแล้ว`);
    } catch (err) {
      console.error(err);
      triggerToast('error', 'ไม่สามารถสร้างเอกสาร PDF ได้');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Base counts with dynamic calculation and offsets
  const totalInRegistry = 0 + assets.length;
  const inUseCount = 0 + assets.filter(a => a.status === 'In Use').length;
  const repairCount = 0 + assets.filter(a => a.status === 'Repair').length;
  const availableCount = 0 + assets.filter(a => a.status === 'Available').length;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'PC':
        return <Cpu className="w-4 h-4 text-sky-600" />;
      case 'Notebook':
        return <Laptop className="w-4 h-4 text-primary" />;
      case 'Server':
        return <Server className="w-4 h-4 text-indigo-600" />;
      case 'Network':
        return <Network className="w-4 h-4 text-emerald-600" />;
      case 'Display':
        return <Monitor className="w-4 h-4 text-amber-600" />;
      default:
        return <Boxes className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header Area */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-sans">รายการทะเบียนครุภัณฑ์</h2>
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-1">
            <span>Dashboard</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary font-bold">Inventory</span>
          </nav>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            title="ดาวน์โหลดไฟล์เทมเพลตมาตรฐานสำหรับกรอกข้อมูลนำเข้าครุภัณฑ์"
          >
            <Download className="w-4 h-4 text-primary" />
            <span>Download Template</span>
          </button>
          <label
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            title="อัปโหลดไฟล์ครุภัณฑ์แบบ CSV เพื่อนำเข้าข้อมูลสู่ระบบ"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Import CSV</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
            />
          </label>
          <button
            onClick={handleExportToExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span>Export to Excel (CSV)</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-container text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Add New Asset</span>
          </button>
        </div>
      </div>

      {/* Quick Statistics Bento Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 flex justify-between items-center shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-1">ครุภัณฑ์ทั้งหมด</p>
            <h4 className="text-2xl font-bold text-primary font-sans">{totalInRegistry.toLocaleString()}</h4>
          </div>
          <div className="w-11 h-11 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 flex justify-between items-center shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-1">กำลังใช้งาน</p>
            <h4 className="text-2xl font-bold text-secondary font-sans">{inUseCount.toLocaleString()}</h4>
          </div>
          <div className="w-11 h-11 bg-blue-50 text-secondary rounded-xl flex items-center justify-center">
            <Laptop className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 flex justify-between items-center border-l-4 border-l-rose-500 shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-1">รอซ่อมบำรุง</p>
            <h4 className="text-2xl font-bold text-rose-600 font-sans">{repairCount.toLocaleString()}</h4>
          </div>
          <div className="w-11 h-11 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
            <Trash2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 flex justify-between items-center border-l-4 border-l-emerald-500 shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-1">ว่าง/พร้อมใช้</p>
            <h4 className="text-2xl font-bold text-emerald-600 font-sans">{availableCount.toLocaleString()}</h4>
          </div>
          <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Data Grid Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        {/* Table Controls Panel */}
        <div className="p-5 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-4">
            {/* Category Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">หมวดหมู่:</span>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-white border border-slate-200 rounded-xl pl-3 pr-8 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/15 focus:border-secondary cursor-pointer"
                >
                  <option>ทั้งหมด</option>
                  <option>PC</option>
                  <option>Notebook</option>
                  <option>Server</option>
                  <option>Network</option>
                  <option>Display</option>
                  <option>Peripherals</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Status Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">สถานะ:</span>
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-white border border-slate-200 rounded-xl pl-3 pr-8 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/15 focus:border-secondary cursor-pointer"
                >
                  <option>ทุกสถานะ</option>
                  <option>In Use</option>
                  <option>Available</option>
                  <option>Repair</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Local Search for rapid reactivity */}
            <div className="flex items-center gap-1.5">
              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={localSearchQuery}
                  onChange={(e) => {
                    setLocalSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00236f]/10"
                  placeholder="ค้นหาในตาราง..."
                />
              </div>
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="p-1.5 bg-white hover:bg-[#00236f]/10 text-slate-500 hover:text-[#00236f] rounded-xl border border-slate-200 transition-colors cursor-pointer flex items-center justify-center shrink-0 shadow-sm"
                title="สแกน QR Code ค้นหา"
              >
                <Scan className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-2">
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
                <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              <span>รายการต่อหน้า</span>
            </div>

            <div>
              แสดง <span className="text-slate-800 font-semibold">{filteredAssets.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredAssets.length)}</span> จาก{' '}
              <span className="text-slate-800 font-semibold">{filteredAssets.length}</span> รายการ
            </div>
          </div>
        </div>

        {/* Real Dynamic Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/40 text-slate-400 border-b border-slate-100">
              <tr>
                {/* Select All Checkbox */}
                <th className="pl-6 pr-2 py-3 text-xs text-left w-12">
                  <input
                    type="checkbox"
                    checked={filteredAssets.length > 0 && filteredAssets.every(a => selectedAssetIds.includes(a.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const newSelected = [...selectedAssetIds];
                        filteredAssets.forEach(a => {
                          if (!newSelected.includes(a.id)) newSelected.push(a.id);
                        });
                        setSelectedAssetIds(newSelected);
                      } else {
                        setSelectedAssetIds(selectedAssetIds.filter(id => !filteredAssets.some(a => a.id === id)));
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                </th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Asset ID</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">ชื่อสินทรัพย์</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">Serial Number</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">หมวดหมู่</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">แผนก / ที่ตั้ง</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">สถานะ</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider">วันสิ้นสุดประกัน</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.length > 0 ? (
                paginatedAssets.map((asset) => {
                  const isAssigned = asset.status === 'In Use';
                  const isAvailable = asset.status === 'Available';
                  const isRepair = asset.status === 'Repair';
                  const isSelected = selectedAssetIds.includes(asset.id);

                  return (
                    <tr 
                      key={asset.id} 
                      className={`transition-colors duration-150 ${
                        isSelected ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-slate-50/40'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="pl-6 pr-2 py-4 w-12">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setSelectedAssetIds(selectedAssetIds.filter(id => id !== asset.id));
                            } else {
                              setSelectedAssetIds([...selectedAssetIds, asset.id]);
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                        />
                      </td>

                      {/* ID */}
                      <td className="px-6 py-4 font-mono text-xs font-bold text-primary select-all">
                        {asset.id}
                      </td>

                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-500">
                            {getCategoryIcon(asset.category)}
                          </div>
                          <span className="font-semibold text-slate-800 text-xs truncate max-w-[170px]">
                            {asset.name}
                          </span>
                        </div>
                      </td>

                      {/* Serial */}
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {asset.serialNumber}
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 text-xs font-medium text-slate-600">
                        {asset.category}
                      </td>

                      {/* Dept */}
                      <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                        {asset.department || '-'}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            isAssigned
                              ? 'bg-blue-50 text-secondary border border-blue-100'
                              : isAvailable
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}
                        >
                          {isAssigned ? 'In Use' : isAvailable ? 'Available' : 'Repair'}
                        </span>
                      </td>

                      {/* Warranty Expiry */}
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">
                        {asset.warrantyExpiryDate === 'Expired' ? (
                          <span className="text-rose-600 font-bold">Expired</span>
                        ) : (
                          asset.warrantyExpiryDate
                        )}
                      </td>

                      {/* Manage Actions */}
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-1">
                          {/* View details */}
                          <button
                            onClick={() => onSelectAsset(asset.id)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary transition-colors cursor-pointer"
                            title="ดูรายละเอียดครุภัณฑ์"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit details */}
                          <button
                            onClick={() => handleOpenEditModal(asset)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-secondary transition-colors cursor-pointer"
                            title="แก้ไขข้อมูลครุภัณฑ์"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => {
                              setAssetToDelete(asset);
                            }}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="ลบครุภัณฑ์"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-xs text-slate-400 font-medium">
                    ไม่พบข้อมูลครุภัณฑ์ที่ตรงกับการค้นหาและตัวกรอง
                  </td>
                </tr>
              )}
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

      {/* FOOTER META */}
      <div className="pt-6 border-t border-slate-200 flex flex-wrap justify-between items-center text-xs text-slate-400 font-medium">
        <p>© 2024 AssetManager IT System. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-primary transition-all">Terms of Service</a>
          <a href="#" className="hover:text-primary transition-all">Privacy Policy</a>
        </div>
      </div>

      {/* FORM MODAL (Add & Edit Asset popup dialog) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[999] flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Title Banner */}
            <div className="p-5 border-b border-slate-100 bg-primary text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <Laptop className="w-5.5 h-5.5" />
                <h3 className="font-bold text-lg font-sans">
                  {editingAsset ? 'แก้ไขรายละเอียดครุภัณฑ์' : 'ลงทะเบียนครุภัณฑ์คอมพิวเตอร์ใหม่'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Scroll Area */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-700">
              
              {/* SECTION 1: ข้อมูลทั่วไป */}
              <div className="space-y-3.5">
                <div className="bg-slate-100/80 py-1.5 px-3 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span>📋 ข้อมูลทั่วไป</span>
                </div>
                
                {/* Row 1: รหัสครุภัณฑ์, COMNAME, ยี่ห้อ */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      รหัสครุภัณฑ์ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formId}
                      onChange={(e) => setFormId(e.target.value)}
                      disabled={editingAsset !== null}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 bg-slate-50 disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      placeholder="กำหนดรหัสได้เอง"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      COMNAME <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      placeholder="ชื่อเครื่อง"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      ยี่ห้อ
                    </label>
                    <input
                      type="text"
                      value={formBrand}
                      onChange={(e) => setFormBrand(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      placeholder="เช่น Dell, HP, Lenovo"
                    />
                  </div>
                </div>

                {/* Row 2: รุ่น, SERIAL NUMBER */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      รุ่น
                    </label>
                    <input
                      type="text"
                      value={formModel}
                      onChange={(e) => setFormModel(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      placeholder="เช่น OptiPlex 7010"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      SERIAL NUMBER
                    </label>
                    <input
                      type="text"
                      value={formSerial}
                      onChange={(e) => setFormSerial(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      placeholder="SN..."
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: ข้อมูลฮาร์ดแวร์ */}
              <div className="space-y-3.5">
                <div className="bg-slate-100/80 py-1.5 px-3 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span>💻 ข้อมูลฮาร์ดแวร์</span>
                </div>

                {/* Row 1: ซีพียู (2/3 width) , RAM (1/3 width) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      ซีพียู
                    </label>
                    <input
                      type="text"
                      value={formCPU}
                      onChange={(e) => setFormCPU(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      placeholder="เช่น Intel Core i5-12400"
                    />
                  </div>
      

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      RAM (GB)
                    </label>
                    <input
                      type="text"
                      value={formRAM}
                      onChange={(e) => setFormRAM(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      placeholder="เช่น 16"
                    />
                  </div>
                </div>

                {/* Row 2: STORAGE (1/3 width), OS (2/3 width) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      STORAGE (GB)
                    </label>
                    <input
                      type="text"
                      value={formStorage}
                      onChange={(e) => setFormStorage(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      placeholder="เช่น SSD 512"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      OS
                    </label>
                    <input
                      type="text"
                      value={formOS}
                      onChange={(e) => setFormOS(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      placeholder="Windows 11 Pro"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: หน่วยงาน */}
              <div className="space-y-3.5">
                <div className="bg-slate-100/80 py-1.5 px-3 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span>🏢 หน่วยงาน</span>
                </div>

                {/* Row 1: หน่วยงาน, ฝ่าย, ผู้รับผิดชอบ */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      หน่วยงาน
                    </label>
                    <input
                      type="text"
                      value={formDept}
                      onChange={(e) => setFormDept(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      placeholder="หน่วยงาน"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      ฝ่าย
                    </label>
                    <input
                      type="text"
                      value={formDivision}
                      onChange={(e) => setFormDivision(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      placeholder="ฝ่าย"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      ผู้รับผิดชอบ
                    </label>
                    <input
                      type="text"
                      value={formResponsible}
                      onChange={(e) => setFormResponsible(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      placeholder="ชื่อ-นามสกุล"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: เครือข่าย */}
              <div className="space-y-3.5">
                <div className="bg-slate-100/80 py-1.5 px-3 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span>🌐 เครือข่าย</span>
                </div>

                {/* Row 1: IP ADDRESS, MAC WIFI, MAC LAN */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      IP ADDRESS
                    </label>
                    <input
                      type="text"
                      value={formIP}
                      onChange={(e) => setFormIP(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      placeholder="192.168.1.x"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      MAC WIFI
                    </label>
                    <input
                      type="text"
                      value={formWifi}
                      onChange={(e) => setFormWifi(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      placeholder="XX:XX:XX:XX:XX:XX"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      MAC LAN
                    </label>
                    <input
                      type="text"
                      value={formLan}
                      onChange={(e) => setFormLan(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                      placeholder="XX:XX:XX:XX:XX:XX"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 5: วันที่และสถานะ */}
              <div className="space-y-3.5">
                <div className="bg-slate-100/80 py-1.5 px-3 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span>📅 วันที่และสถานะ</span>
                </div>

                {/* Row 1: วันที่จัดซื้อ, วันรับประกันหมด, สถานะ */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      วันที่จัดซื้อ
                    </label>
                    <input
                      type="date"
                      value={formPurchaseDate}
                      onChange={(e) => setFormPurchaseDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      วันรับประกันหมด
                    </label>
                    <input
                      type="date"
                      value={formExpiryDate}
                      onChange={(e) => setFormExpiryDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      สถานะ
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as AssetStatus)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary/20 bg-white"
                    >
                      <option value="In Use">ใช้งาน</option>
                      <option value="Available">ว่าง/พร้อมใช้</option>
                      <option value="Repair">ส่งซ่อมบำรุง</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: หมายเหตุ */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    หมายเหตุ
                  </label>
                  <textarea
                    value={formRemarks}
                    onChange={(e) => setFormRemarks(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-secondary/20 resize-none"
                    placeholder="บันทึกเพิ่มเติม..."
                  />
                </div>
              </div>

              {/* หมวดหมู่ทรัพย์สิน และ ข้อมูลทางการเงิน (ราคาซื้อ, PO, Vendor) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ข้อมูลการจัดซื้อและหมวดหมู่ทรัพย์สิน (สนับสนุน)</h4>
                  <div className="w-full sm:w-1/2">
                    <label className="block text-[10px] text-slate-400 mb-0.5">หมวดหมู่ทรัพย์สิน</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as AssetCategory)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none bg-white"
                    >
                      <option value="PC">PC (คอมพิวเตอร์ตั้งโต๊ะ)</option>
                      <option value="Notebook">Notebook (โน้ตบุ๊ก)</option>
                      <option value="Server">Server (เซิร์ฟเวอร์หลัก)</option>
                      <option value="Network">Network (อุปกรณ์เครือข่าย)</option>
                      <option value="Display">Display (จอแสดงผล)</option>
                      <option value="Peripherals">Peripherals (อุปกรณ์ต่อพ่วง)</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      {`ราคาซื้อ (Price - ${getCurrencySymbol(currency)})`}
                    </label>
                    <input
                      type="number"
                      value={formPrice}
                      onChange={(e) => setFormPrice(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      ผู้จัดจำหน่าย (Vendor)
                    </label>
                    <input
                      type="text"
                      value={formVendor}
                      onChange={(e) => setFormVendor(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                      placeholder="iStudio by SPVi"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      เลขใบสั่งซื้อ (PO)
                    </label>
                    <input
                      type="text"
                      value={formPO}
                      onChange={(e) => setFormPO(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                      placeholder="PO-2023/112"
                    />
                  </div>
                </div>
              </div>

              {/* Actions row */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  {editingAsset ? 'บันทึกการแก้ไข' : 'ยืนยันลงทะเบียนครุภัณฑ์'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        assets={assets}
        onSelectAsset={onSelectAsset}
        triggerToast={triggerToast}
      />

      {/* MODAL: Delete Asset Confirmation */}
      {assetToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[1000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-100 bg-rose-50/50 flex items-center gap-2.5">
              <Trash2 className="w-5 h-5 text-rose-600 animate-bounce" />
              <h3 className="font-bold text-slate-800 text-sm font-sans">ยืนยันการลบครุภัณฑ์</h3>
            </div>
            
            <div className="p-6 space-y-3">
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                คุณแน่ใจหรือไม่ว่าต้องการลบครุภัณฑ์ต่อไปนี้ออกจากระบบ:
              </p>
              <div className="p-4 bg-rose-50/30 border border-rose-100 rounded-xl">
                <p className="text-xs font-bold text-slate-800 leading-snug">{assetToDelete.name}</p>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-2">
                  <span>ID: {assetToDelete.id}</span>
                  <span>SN: {assetToDelete.serialNumber}</span>
                </div>
              </div>
              <p className="text-[11px] text-rose-500 font-medium">
                * ข้อมูลครุภัณฑ์จะถูกลบถาวรและไม่สามารถเรียกคืนได้
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setAssetToDelete(null)}
                className="px-4 py-2 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteAsset(assetToDelete.id);
                  triggerToast('info', `ลบครุภัณฑ์ ${assetToDelete.id} สำเร็จ`);
                  setAssetToDelete(null);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. FLOATING BULK SELECTION ACTION BAR */}
      {selectedAssetIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-2xl border border-slate-800 z-[999] flex flex-wrap items-center justify-between gap-4 w-[90%] max-w-2xl animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white border border-primary/20">
              <QrCode className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold font-sans">
                เลือกครุภัณฑ์แล้ว <span className="text-cyan-400 font-extrabold text-sm">{selectedAssetIds.length}</span> รายการ
              </p>
              <p className="text-[10px] text-slate-400">
                พร้อมสำหรับการพิมพ์สติกเกอร์รหัส QR Code (Sticker Labels)
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedAssetIds([])}
              className="px-3.5 py-2 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>ล้างทั้งหมด</span>
            </button>
            <button
              onClick={handleOpenPrintModal}
              className="px-4 py-2 bg-gradient-to-r from-secondary to-primary hover:from-secondary-container hover:to-primary-container text-white rounded-xl font-bold text-xs shadow-lg shadow-secondary/25 hover:shadow-secondary/40 hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์ QR Sticker ({selectedAssetIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. QR STICKER GENERATOR CONFIG & PREVIEW MODAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[1001] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-50 w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in duration-200 flex flex-col my-8 max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 bg-white border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base font-sans">เครื่องมือพิมพ์สติกเกอร์ QR Code (Sticker Label Printer)</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    กำหนดขนาดสติกเกอร์ เลือกช่องข้อมูล และดาวน์โหลด PDF หรือสั่งพิมพ์ออกเครื่องพิมพ์บาร์โค้ดได้โดยตรง
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Left Settings, Right Live Preview */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0">
              
              {/* Left Configuration Panel */}
              <div className="lg:col-span-5 p-6 bg-white border-r border-slate-200/80 space-y-6 overflow-y-auto">
                
                {/* Section 1: Template Config */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Settings className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">การตั้งค่ากระดาษและเลย์เอาต์</span>
                  </div>

                  {/* Columns */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-2">
                      จำนวนคอลัมน์สติกเกอร์ (Columns per Row)
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[1, 2, 3, 4].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setStickerColumns(num)}
                          className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                            stickerColumns === num
                              ? 'bg-primary text-white border-primary shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {num} {num === 1 ? 'แถวเดี่ยว' : 'คอลัมน์'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Title Prefix */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                      ข้อความส่วนหัวสติกเกอร์ (Header Title)
                    </label>
                    <input
                      type="text"
                      value={stickerCustomTitle}
                      onChange={(e) => setStickerCustomTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                      placeholder="เช่น ทรัพย์สินของบริษัท / IT ASSET TAG"
                    />
                  </div>

                  {/* Size sliders */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-bold text-slate-500">
                          ความกว้างสติกเกอร์
                        </label>
                        <span className="text-[11px] font-mono font-bold text-primary">{stickerWidth} mm</span>
                      </div>
                      <input
                        type="range"
                        min="40"
                        max="100"
                        value={stickerWidth}
                        onChange={(e) => setStickerWidth(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-bold text-slate-500">
                          ความสูงสติกเกอร์
                        </label>
                        <span className="text-[11px] font-mono font-bold text-primary">{stickerHeight} mm</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="80"
                        value={stickerHeight}
                        onChange={(e) => setStickerHeight(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-bold text-slate-500">
                          ระยะห่างระหว่างชิ้น (Gap)
                        </label>
                        <span className="text-[11px] font-mono font-bold text-primary">{stickerGap} mm</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={stickerGap}
                        onChange={(e) => setStickerGap(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        ขนาดตัวอักษรบนสติกเกอร์
                      </label>
                      <select
                        value={stickerFontSize}
                        onChange={(e: any) => setStickerFontSize(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-primary focus:border-primary outline-none cursor-pointer"
                      >
                        <option value="sm">เล็กพิเศษ (Extra Small)</option>
                        <option value="md"> มาตรฐาน (Medium)</option>
                        <option value="lg">ใหญ่เด่นชัด (Large)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Toggle Visibility */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-primary">
                    <Layout className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">ข้อมูลที่ต้องการแสดงบนสติกเกอร์</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 rounded-xl cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={showAssetId}
                        onChange={(e) => setShowAssetId(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                      />
                      <span className="text-[11px] font-bold text-slate-600">รหัสครุภัณฑ์ ID</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 rounded-xl cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={showAssetName}
                        onChange={(e) => setShowAssetName(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                      />
                      <span className="text-[11px] font-bold text-slate-600">ชื่อครุภัณฑ์ Name</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 rounded-xl cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={showSerial}
                        onChange={(e) => setShowSerial(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                      />
                      <span className="text-[11px] font-bold text-slate-600">หมายเลขซีเรียล S/N</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 rounded-xl cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={showCategory}
                        onChange={(e) => setShowCategory(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                      />
                      <span className="text-[11px] font-bold text-slate-600">หมวดหมู่ Category</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 rounded-xl cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={showDepartment}
                        onChange={(e) => setShowDepartment(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                      />
                      <span className="text-[11px] font-bold text-slate-600">แผนก / หน่วยงาน</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 rounded-xl cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={showStatus}
                        onChange={(e) => setShowStatus(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                      />
                      <span className="text-[11px] font-bold text-slate-600">สถานะครุภัณฑ์</span>
                    </label>
                  </div>
                </div>

                <div className="p-4 bg-amber-50/60 border border-amber-100 rounded-2xl text-[11px] text-amber-700 leading-relaxed font-medium">
                  💡 <strong>คำแนะนำการพิมพ์ฉลากด้วยสติกเกอร์แบบม้วน:</strong> แนะนำให้เลือกช่องคอลัมน์เป็น "แถวเดี่ยว" และในการตั้งค่าไดรเวอร์เครื่องพิมพ์ในเบราว์เซอร์ ให้เลือกขนาดสติกเกอร์ที่ตรงกับขนาดจริงที่ท่านติดตั้งลงในเครื่องพิมพ์ฉลาก (Sticker Roll Printer)
                </div>
              </div>

              {/* Right Preview Panel */}
              <div className="lg:col-span-7 p-6 bg-slate-100 overflow-y-auto flex flex-col items-center justify-start min-h-[400px]">
                <div className="w-full flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Layout className="w-3.5 h-3.5" /> ตัวอย่างพรีวิวก่อนพิมพ์จริง (LIVE STICKER PREVIEW)
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 bg-white/80 border border-slate-200 px-2.5 py-1 rounded-full">
                    A4 Grid Template Representation
                  </span>
                </div>

                {/* Simulated page container */}
                <div className="w-full max-w-[500px] bg-white rounded-2xl border border-slate-200 shadow-xl p-6 overflow-hidden min-h-[600px] transition-all">
                  <div 
                    className="grid"
                    style={{
                      gridTemplateColumns: `repeat(${stickerColumns}, minmax(0, 1fr))`,
                      gap: `${stickerGap * 2.8}px`
                    }}
                  >
                    {assets.filter(a => selectedAssetIds.includes(a.id)).map(asset => {
                      const qrUrl = qrUrls[asset.id];
                      return (
                        <div
                          key={asset.id}
                          className="border border-dashed border-slate-300 rounded-lg p-2.5 flex items-center bg-white shadow-xs transition-all hover:scale-[1.02] hover:border-slate-400"
                          style={{
                            minHeight: `${stickerHeight * 2.2}px`,
                            gap: '8px'
                          }}
                        >
                          {/* QR Mock */}
                          <div className="w-14 h-14 bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 rounded-md overflow-hidden p-0.5">
                            {qrUrl ? (
                              <img src={qrUrl} alt="QR code" className="w-full h-full object-contain" />
                            ) : (
                              <div className="w-full h-full animate-pulse bg-slate-200" />
                            )}
                          </div>

                          {/* Data Column */}
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <p className="font-extrabold text-[#00236f] border-b border-primary/20 pb-0.5 mb-1 truncate text-[10px] font-sans">
                              {stickerCustomTitle || 'IT ASSET TAG'}
                            </p>
                            <div className="text-[9px] text-slate-600 space-y-0.5 font-medium leading-tight">
                              {showAssetId && (
                                <p className="font-bold text-slate-800">ID: {asset.id}</p>
                              )}
                              {showAssetName && (
                                <p className="truncate">Name: {asset.name}</p>
                              )}
                              {showSerial && (
                                <p className="truncate">S/N: {asset.serialNumber || '-'}</p>
                              )}
                              {showCategory && (
                                <p>Cat: {asset.category}</p>
                              )}
                              {showDepartment && (
                                <p className="truncate">Dept: {asset.department || '-'}</p>
                              )}
                              {showStatus && (
                                <p>Status: {asset.status}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-slate-400 font-medium">
                จัดทำสติกเกอร์รหัส QR Code ทั้งหมด <span className="text-slate-800 font-bold">{selectedAssetIds.length} ดวง</span>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={isGeneratingPdf}
                  onClick={handleDownloadPdf}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-55"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>{isGeneratingPdf ? 'กำลังจัดทำ PDF...' : 'ดาวน์โหลดไฟล์พิมพ์ PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>พิมพ์ด่วนโดยตรง (Browser Print)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. PRINT CONTAINER OVERLAY (Optimized dynamically using pure millimeters for absolute precise prints) */}
      {isPrintModalOpen && (
        <div className="hidden sticker-print-container">
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${stickerColumns}, minmax(0, 1fr))`,
              gap: `${stickerGap}mm`,
              width: '100%',
              padding: '10mm 10mm',
              backgroundColor: 'white'
            }}
          >
            {assets.filter(a => selectedAssetIds.includes(a.id)).map(asset => {
              const qrUrl = qrUrls[asset.id];
              return (
                <div 
                  key={asset.id} 
                  className="sticker-card"
                  style={{
                    width: `${stickerWidth}mm`,
                    height: `${stickerHeight}mm`,
                    border: '0.15mm solid #cbd5e1',
                    borderRadius: '1mm',
                    padding: '2mm',
                    backgroundColor: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2.5mm',
                    overflow: 'hidden',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Left QR Code */}
                  <div style={{ flexShrink: 0 }}>
                    {qrUrl ? (
                      <img 
                        src={qrUrl} 
                        alt="QR Code" 
                        style={{
                          width: `${Math.min(stickerHeight - 6, stickerWidth * 0.38)}mm`,
                          height: `${Math.min(stickerHeight - 6, stickerWidth * 0.38)}mm`,
                          display: 'block'
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 bg-slate-100 flex items-center justify-center text-[8px] text-slate-400">Loading...</div>
                    )}
                  </div>

                  {/* Right Metadata Texts */}
                  <div 
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      lineHeight: stickerFontSize === 'sm' ? '1.1' : stickerFontSize === 'lg' ? '1.4' : '1.2'
                    }}
                  >
                    <div 
                      style={{
                        fontWeight: 'bold',
                        color: '#00236f',
                        borderBottom: '0.1mm solid #00236f',
                        paddingBottom: '0.5mm',
                        marginBottom: '1mm',
                        fontSize: stickerFontSize === 'sm' ? '8px' : stickerFontSize === 'lg' ? '11px' : '9.5px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {stickerCustomTitle || 'IT ASSET TAG'}
                    </div>

                    <div 
                      style={{
                        fontSize: stickerFontSize === 'sm' ? '6.5px' : stickerFontSize === 'lg' ? '9.5px' : '8px',
                        color: '#334155',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5mm'
                      }}
                    >
                      {showAssetId && (
                        <span style={{ fontWeight: 'bold' }}>ID: {asset.id}</span>
                      )}
                      {showAssetName && (
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Name: {asset.name}
                        </span>
                      )}
                      {showSerial && (
                        <span>S/N: {asset.serialNumber || '-'}</span>
                      )}
                      {showCategory && (
                        <span>Cat: {asset.category}</span>
                      )}
                      {showDepartment && (
                        <span>Dept: {asset.department || '-'}</span>
                      )}
                      {showStatus && (
                        <span>Status: {asset.status}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* QR Code Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        assets={assets}
        onSelectAsset={onSelectAsset}
        triggerToast={triggerToast}
      />
    </div>
  );
}
