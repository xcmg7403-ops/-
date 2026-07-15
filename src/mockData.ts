import { Asset, RepairTicket, MaintenanceEvent } from './types';

export const SEED_ASSETS: Asset[] = [
  {
    id: 'IT-NB-2024-001',
    name: 'MacBook Pro M3 14"',
    serialNumber: 'C02FX123M456',
    category: 'Notebook',
    department: 'Development',
    status: 'In Use',
    purchasePrice: 72900,
    vendor: 'iStudio by SPVi',
    purchaseOrder: 'PO-2023/112',
    purchaseDate: '2023-03-15',
    warrantyExpiryDate: '2026-03-15',
    specCPU: 'M3 Pro 11-Core',
    specRAM: '18 GB',
    specStorage: '512 GB SSD NVMe',
    specOS: 'macOS Sonoma',
    brand: 'Apple',
    model: 'MacBook Pro 14" M3 Pro',
    division: 'Creative & Graphic Design',
    responsiblePerson: 'สิริวิมล วิเศษศิลป์',
    ipAddress: '192.168.1.15',
    macWifi: '3C:06:30:1F:B1:A2',
    macLan: '3C:06:30:1F:B1:A3',
    remarks: 'เครื่องเช่าปีที่ 1 สภาพสมบูรณ์ มีรอยขีดข่วนเล็กน้อยด้านหลัง',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDX8WS4IBrdPbmnjdcyYHHIuGfgohPvoE1Jk3_TnurPjkuWjpur0UlBkcvibitHMGPKphjs51CuPpFZGoH6i4NFFb43VSMalLXyoZg2UggHmmWM9oP_rTkpLQ97o9PEc6cK5Qgb-s5-YAlJBtX-LQBdVNhesgLF7Tx1K902GvvkrJ-5GF3NUp1LuKn2tkUe8MlGuz1KhG0UTEFfWxuqVChFOK3F-x0MvY06GqB7bz1b8pYCU5qcPpoR_nqYzS04ZWfqdM7-m3JQlg',
    detailedSpecs: [
      { item: 'Display', details: 'Liquid Retina XDR display, 14.2-inch, 3024-by-1964 resolution', status: 'Optimal Performance' },
      { item: 'GPU', details: '14-core GPU, 150GB/s memory bandwidth', status: 'Verified Hardware' },
      { item: 'OS Version', details: 'macOS Sonoma 14.4.1', status: 'Up to date' },
      { item: 'Ports', details: 'SDXC card slot, HDMI, 3.5mm jack, MagSafe 3, 3x Thunderbolt 4', status: 'All Ports Tested' }
    ],
    assignee: {
      name: 'สิริวิมล วิเศษศิลป์',
      role: 'Graphic Designer',
      department: 'Creative Team',
      email: 'siriwimon.v@company.com',
      phone: 'Ext. 402',
      location: 'ชั้น 4, ฝั่ง West Wing',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdVpfs-Oth-1_tvtXvKCwtS52U4knJoA7So-TvYBBjMJbsKa31RQ5uvcVUM2AS0TxutbnHMh0z8w3MeCdmFgfj7Zd-fNpL4fUUswLovslwLw8onSR5wIcTu73R-3lL0cr8sETNlRo5B-BRYVe76xs7R-gBV8TPBDK_sRNYs-gq79CYMRtGgJehFQZdyGM6Ozo8hIY-J09JsxHWPFtDAdMOIKh6HFZSEiGO474-KCtAQquWjv9XbBIEF0JeFMATfheplcBrhHVFOA'
    },
    repairsHistory: [
      { date: '12 ก.พ. 2567', action: 'เปลี่ยนแบตเตอรี่ใหม่', status: 'สำเร็จ', technician: 'นายสมบูรณ์' },
      { date: '05 พ.ค. 2566', action: 'ตรวจเช็คสภาพรายปี (Routine)', status: 'ปกติ', technician: 'ระบบอัตโนมัติ' },
      { date: '15 มี.ค. 2566', action: 'ลงทะเบียนเข้าสู่ระบบ', status: 'เบิกจ่ายใหม่', technician: 'แอดมิน ระบบ' }
    ]
  },
  {
    id: 'IT-NB-2024-002',
    name: 'Dell Latitude 5440',
    serialNumber: 'SN-88210-XP',
    category: 'Notebook',
    department: 'Human Resources',
    status: 'Available',
    purchasePrice: 38500,
    vendor: 'Dell Thailand',
    purchaseOrder: 'PO-2023/154',
    purchaseDate: '2023-05-10',
    warrantyExpiryDate: '2027-01-10',
    specCPU: 'Intel Core i5-1345U',
    specRAM: '16 GB DDR5',
    specStorage: '512 GB SSD PCIe',
    specOS: 'Windows 11 Pro',
    brand: 'Dell',
    model: 'Latitude 5440',
    division: 'Recruitment & Operations',
    responsiblePerson: 'วาสนา ดีมาก',
    ipAddress: '192.168.1.52',
    macWifi: 'AA:BB:CC:DD:EE:01',
    macLan: 'AA:BB:CC:DD:EE:02',
    remarks: 'เครื่องใช้งานทั่วไป สภาพ 95%',
    imageUrl: '',
    detailedSpecs: [
      { item: 'Display', details: '14.0" FHD (1920x1080) Anti-Glare', status: 'Functional' },
      { item: 'Graphics', details: 'Intel Iris Xe Graphics', status: 'Verified Hardware' },
      { item: 'OS Version', details: 'Windows 11 Pro 64-bit', status: 'Up to date' }
    ],
    assignee: undefined,
    repairsHistory: [
      { date: '10 ม.ค. 2524', action: 'จัดตั้งและอัพเดทไดรเวอร์แรกเริ่ม', status: 'เสร็จสมบูรณ์', technician: 'นายสมบูรณ์' }
    ]
  },
  {
    id: 'IT-PR-2023-012',
    name: 'HP LaserJet Pro M404n',
    serialNumber: 'VNB3K12904',
    category: 'Peripherals',
    department: 'Accounting',
    status: 'Repair',
    purchasePrice: 12500,
    vendor: 'HP Online Store',
    purchaseOrder: 'PO-2022/982',
    purchaseDate: '2022-08-11',
    warrantyExpiryDate: 'Expired',
    specCPU: 'Dual-Core 1.2 GHz',
    specRAM: '256 MB',
    specStorage: 'None',
    imageUrl: '',
    assignee: undefined,
    detailedSpecs: [
      { item: 'Print Speed', details: 'Up to 40 ppm (A4)', status: 'Warning: Ink spots' },
      { item: 'Interface', details: 'Hi-Speed USB 2.0, Gigabit Ethernet', status: 'Working' }
    ],
    repairsHistory: [
      { date: '18 พ.ค. 2567', action: 'ส่งซ่อมแซมเรื่องหมึกพิมพ์เลอะกระดาษ', status: 'กำลังดำเนินการ', technician: 'นายภพ' }
    ]
  },
  {
    id: 'IT-SR-2024-005',
    name: 'PowerEdge R750 Server',
    serialNumber: 'DEL-99X-Z1',
    category: 'Server',
    department: 'IT Ops',
    status: 'In Use',
    purchasePrice: 345000,
    vendor: 'Dell Enterprise',
    purchaseOrder: 'PO-2023/001',
    purchaseDate: '2023-12-12',
    warrantyExpiryDate: '2028-12-12',
    specCPU: '2x Intel Xeon Gold 6330',
    specRAM: '256 GB RDIMM',
    specStorage: '4x 1.92TB SSD SATA',
    assignee: {
      name: 'สมชาย มั่นคง',
      role: 'DevOps Specialist',
      department: 'IT Infrastructure',
      email: 'somchai.m@company.com',
      phone: 'Ext. 101',
      location: 'ห้อง Server Room B, ชั้น 2',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBCZrRdCFsP6S04QRmkkcZznoNWiGnvd3nuXcxYVOI7dF3CicA9B5b3NHZgduJP_1ztdup1s4AwoQi1KX_MwAKfQVpTpwKgppkvZmMvSPElbVYNpuRdF0r0Zlw8O9F1kdilFanFKLSSnRCFsE14LDplUL7xIqjDqpeuoztBlFbhjxg0Hjf7I3dm9f7hdANuAp3DVPdLR7AVJXdEKG_IhlzMhdSlZzL3xFaqzHszlrCkYDBp4U9Xz9ZRUsTP82FOcl5uyIWFfdncLQ'
    },
    repairsHistory: []
  },
  {
    id: 'IT-MO-2023-088',
    name: 'Dell 27" 4K Monitor',
    serialNumber: 'CN-0D5V1X-74',
    category: 'Display',
    department: 'Design',
    status: 'In Use',
    purchasePrice: 18900,
    vendor: 'JIB Computer',
    purchaseOrder: 'PO-2023/452',
    purchaseDate: '2023-08-05',
    warrantyExpiryDate: '2026-08-05',
    specCPU: 'None',
    specRAM: 'None',
    specStorage: 'None',
    assignee: {
      name: 'นภาพร ฟ้ากว้าง',
      role: 'UI Designer',
      department: 'Design Team',
      email: 'napaporn.f@company.com',
      phone: 'Ext. 312',
      location: 'ชั้น 3, ฝั่ง East Wing',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvn__k-2z-fR67SmAQMYT0OcRFJuS48T99uxL5ZATZA5xjOug6Kspks_joc2l4NP4s-bBUZDqtiWP6g4RV-FaJFyz001WQnzLpI0L7_eea6D-2hiJ_tDqIsPxtOq4QxF_K_p0VIV8sNtF2dvzysuvu2iSvHTpqWtDSp58tyi7mMl01XKyMb3gl5iq-sdjxM9GribQzNbAoMN2eoG57sNz1jHDKMlD3uiZECWAfIR7DJ9ZSu2mpPL6HuEf9JzIDRX5vJv87svHegg'
    },
    repairsHistory: []
  },
  {
    id: 'IT-NW-2024-088',
    name: 'Cisco C9200L-24T-4G',
    serialNumber: 'SN-CISCO-9200L',
    category: 'Network',
    department: 'IT Infrastructure',
    status: 'Available',
    purchasePrice: 95000,
    vendor: 'Cisco Partners',
    purchaseOrder: 'PO-2024-118',
    purchaseDate: '2024-01-12',
    warrantyExpiryDate: '2027-01-12',
    specCPU: 'ARM v7 4-Core',
    specRAM: '2 GB',
    specStorage: '4 GB Flash',
    assignee: undefined,
    repairsHistory: []
  },
  {
    id: 'IT-NB-2024-042',
    name: 'Dell Precision 3660',
    serialNumber: 'SN-DELL-PRE3660',
    category: 'PC',
    department: 'Engineering',
    status: 'Repair',
    purchasePrice: 65000,
    vendor: 'JIB Computer',
    purchaseOrder: 'PO-2023-887',
    purchaseDate: '2023-09-18',
    warrantyExpiryDate: '2026-09-18',
    specCPU: 'Intel Core i7-12700K',
    specRAM: '32 GB DDR5',
    specStorage: '1 TB SSD PCIe',
    imageUrl: '',
    assignee: undefined,
    repairsHistory: [
      { date: '18 พ.ค. 2567', action: 'อาการเครื่องดับสุ่มเสี่ยง', status: 'กำลังซ่อมบำรุง', technician: 'นายภพ' }
    ]
  }
];

export const SEED_REPAIR_TICKETS: RepairTicket[] = [
  {
    id: 'REP-2023-0812',
    assetId: 'IT-NB-2024-001',
    assetName: 'MacBook Pro M3 14"',
    category: 'Notebook',
    issue: 'หน้าจอกะพริบเป็นช่วงๆ (Flickering Screen)',
    status: 'Pending',
    priority: 'Medium',
    dateSubmitted: '2024-05-20',
    technicianName: 'นายสมบูรณ์',
    repairType: 'Hardware'
  },
  {
    id: 'REP-2023-0809',
    assetId: 'IT-PR-2023-012',
    assetName: 'HP LaserJet Pro M404n',
    category: 'Peripherals',
    issue: 'หมึกพิมพ์เลอะขอบกระดาษเป็นรอยดำสม่ำเสมอ',
    status: 'Repairing',
    priority: 'Low',
    dateSubmitted: '2024-05-18',
    technicianName: 'นายสมเกียรติ',
    repairType: 'Peripherals'
  },
  {
    id: 'REP-2023-0745',
    assetId: 'IT-NW-2024-088',
    assetName: 'Cisco Router X-200',
    category: 'Network',
    issue: 'การเชื่อมต่อหลุดบ่อย คลื่นสัญญาณตกฮวบช่วงบ่าย',
    status: 'Completed',
    priority: 'Critical',
    dateSubmitted: '2024-05-12',
    technicianName: 'นายวสันต์',
    repairType: 'Network'
  }
];

export const SEED_MAINTENANCE_EVENTS: MaintenanceEvent[] = [
  {
    id: 'EV-001',
    title: 'ตรวจสอบระบบเซิร์ฟเวอร์หลัก',
    subtitle: 'ประจำไตรมาสที่ 3',
    month: 'ส.ค.',
    day: '24',
    time: '09:00 - 12:00',
    location: 'Data Center Main Room',
    isActive: true,
    fullDate: '2026-08-24'
  },
  {
    id: 'EV-002',
    title: 'ล้างเครื่องปรับอากาศห้อง Data Center',
    subtitle: 'บริษัท แอร์คลีน เซอร์วิส',
    month: 'ส.ค.',
    day: '28',
    time: '13:00 - 15:30',
    location: 'Server Room A & B',
    isActive: false,
    fullDate: '2026-08-28'
  },
  {
    id: 'EV-003',
    title: 'อัพเดท Firmware อุปกรณ์ Network',
    subtitle: 'ตึกสำนักงานใหญ่ ชั้น 4-10',
    month: 'ก.ย.',
    day: '02',
    time: '22:00 - 02:00',
    location: 'Switching Closets (All floors)',
    isActive: false,
    fullDate: '2026-09-02'
  }
];
