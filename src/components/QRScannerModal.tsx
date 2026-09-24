import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, RefreshCw, X, Search, Check, AlertCircle, Scan, Laptop, Cpu, Server, Network, Monitor, Boxes } from 'lucide-react';
import { Asset } from '../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  onSelectAsset: (id: string) => void;
  triggerToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export default function QRScannerModal({
  isOpen,
  onClose,
  assets,
  onSelectAsset,
  triggerToast,
}: QRScannerModalProps) {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [manualInput, setManualInput] = useState('');
  const [manualError, setManualError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraError, setHasCameraError] = useState(false);
  const [cameraErrorMessage, setCameraErrorMessage] = useState('');
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('environment');

  const qrReaderRef = useRef<Html5Qrcode | null>(null);

  // Load cameras
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') return;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setAvailableCameras(devices);
        }
      })
      .catch((err) => {
        console.error('Failed to get cameras list:', err);
        // We do not immediately set hasCameraError to true, because using facingMode: "environment" 
        // can trigger the browser permission prompt and start successfully even if getCameras() returned empty.
      });
  }, [isOpen, activeTab]);

  // Start / Stop Scanner
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera' || !selectedCameraId) {
      cleanupScanner();
      return;
    }

    setHasCameraError(false);
    setCameraErrorMessage('');

    // Delay initialization slightly to ensure container element is fully rendered in DOM
    const initTimer = setTimeout(() => {
      const element = document.getElementById('qr-reader-container');
      if (!element) return;

      try {
        const html5QrCode = new Html5Qrcode('qr-reader-container');
        qrReaderRef.current = html5QrCode;
        setIsScanning(true);

        const cameraParam = (selectedCameraId === 'environment' || selectedCameraId === 'user')
          ? { facingMode: selectedCameraId }
          : selectedCameraId;

        html5QrCode.start(
          cameraParam,
          {
            fps: 15,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              // Ensure positive, valid fallback values for dimensions
              const width = typeof viewfinderWidth === 'number' && viewfinderWidth > 0 ? viewfinderWidth : 250;
              const height = typeof viewfinderHeight === 'number' && viewfinderHeight > 0 ? viewfinderHeight : 250;
              const minDimension = Math.min(width, height);
              // Calculate 70% of the smaller dimension, but clamp to >= 50px (minimum enforced by html5-qrcode)
              const calculatedSize = Math.floor(minDimension * 0.7);
              const safeSize = Math.max(50, calculatedSize);
              return { width: safeSize, height: safeSize };
            },
          },
          (decodedText) => {
            // Success
            handleSuccessfulScan(decodedText);
          },
          (errorMessage) => {
            // Heavy logs from scanning loop are muted
          }
        ).catch((err) => {
          console.error('Start scan error:', err);
          setHasCameraError(true);
          setCameraErrorMessage('ไม่สามารถเปิดใช้งานกล้องได้ กรุณาตรวจสอบว่าอนุญาตสิทธิ์เข้าถึงกล้องถ่ายภาพในการตั้งค่าเบราว์เซอร์แล้ว หรือลองเลือกสลับกล้องอีกครั้ง');
          setIsScanning(false);
        });
      } catch (err) {
        console.error('Html5Qrcode instantiation error:', err);
        setIsScanning(false);
      }
    }, 150);

    return () => {
      clearTimeout(initTimer);
      cleanupScanner();
    };
  }, [isOpen, activeTab, selectedCameraId]);

  const cleanupScanner = () => {
    if (qrReaderRef.current) {
      if (qrReaderRef.current.isScanning) {
        qrReaderRef.current
          .stop()
          .then(() => {
            qrReaderRef.current = null;
            setIsScanning(false);
          })
          .catch((err) => {
            console.error('Error stopping scanner during cleanup:', err);
          });
      } else {
        qrReaderRef.current = null;
        setIsScanning(false);
      }
    }
  };

  const handleSuccessfulScan = (assetId: string) => {
    const trimmedId = assetId.trim();
    const matchedAsset = assets.find(
      (a) => a.id.toLowerCase() === trimmedId.toLowerCase() || a.serialNumber.toLowerCase() === trimmedId.toLowerCase()
    );

    if (matchedAsset) {
      setScannedResult(matchedAsset.id);
      cleanupScanner();
      triggerToast('success', `สแกนพบครุภัณฑ์: ${matchedAsset.id} (${matchedAsset.name})`);
      setTimeout(() => {
        onSelectAsset(matchedAsset.id);
        onClose();
        resetModal();
      }, 1000);
    } else {
      triggerToast('error', `ไม่พบครุภัณฑ์รหัส "${trimmedId}" ในระบบ`);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError('');

    const query = manualInput.trim();
    if (!query) {
      setManualError('กรุณากรอกรหัสครุภัณฑ์หรือสแกนด้วยเครื่องปืนสแกน');
      return;
    }

    const matchedAsset = assets.find(
      (a) => a.id.toLowerCase() === query.toLowerCase() || a.serialNumber.toLowerCase() === query.toLowerCase()
    );

    if (matchedAsset) {
      triggerToast('success', `ค้นพบครุภัณฑ์: ${matchedAsset.id}`);
      onSelectAsset(matchedAsset.id);
      onClose();
      resetModal();
    } else {
      setManualError(`ไม่พบครุภัณฑ์รหัส "${query}" หรือเลขซีเรียลนี้ในระบบบัญชี`);
    }
  };

  const resetModal = () => {
    setManualInput('');
    setManualError('');
    setScannedResult(null);
    setHasCameraError(false);
  };

  // Switch camera source helper
  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextId = e.target.value;
    cleanupScanner();
    setTimeout(() => {
      setSelectedCameraId(nextId);
    }, 100);
  };

  if (!isOpen) return null;

  // Render Category Icon Helper
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
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Banner Title */}
        <div className="p-4 bg-[#00236f] text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-sky-400 animate-pulse" />
            <h3 className="font-bold text-sm font-sans tracking-wide">สแกน QR Code / ค้นหาครุภัณฑ์เร่งด่วน</h3>
          </div>
          <button
            onClick={() => {
              cleanupScanner();
              onClose();
              resetModal();
            }}
            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 shrink-0">
          <button
            onClick={() => {
              setManualError('');
              setActiveTab('camera');
            }}
            className={`flex-1 py-3 text-xs font-bold font-sans transition-all border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'camera'
                ? 'border-[#00236f] text-[#00236f] bg-white'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>สแกนด้วยกล้อง (Camera Scan)</span>
          </button>
          <button
            onClick={() => {
              cleanupScanner();
              setActiveTab('manual');
            }}
            className={`flex-1 py-3 text-xs font-bold font-sans transition-all border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'manual'
                ? 'border-[#00236f] text-[#00236f] bg-white'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>ป้อนรหัสเอง / เครื่องยิงปืนสแกน</span>
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {activeTab === 'camera' ? (
            <div className="space-y-4">
              {/* Select Camera Source */}
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">เลือกกล้อง:</label>
                <select
                  value={selectedCameraId}
                  onChange={handleCameraChange}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-[#00236f] cursor-pointer"
                >
                  <option value="environment">📷 กล้องหลัง (Back Camera / Auto)</option>
                  <option value="user">🤳 กล้องหน้า (Front Camera)</option>
                  {availableCameras.length > 0 && availableCameras.map((device, index) => {
                    // Filter out generic labels if they match our presets, or just show them all
                    if (device.label.toLowerCase().includes('front') || device.label.toLowerCase().includes('user')) return null;
                    return (
                      <option key={`${device.deviceId}-${index}`} value={device.deviceId}>
                        🔌 {device.label || `กล้องเสริมตัวที่ ${index + 1}`}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Scanner Screen Box */}
              <div className="relative w-full aspect-square max-w-[280px] mx-auto bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-200/80 shadow-md flex flex-col items-center justify-center">
                {hasCameraError ? (
                  <div className="p-4 text-center space-y-2 text-slate-400">
                    <AlertCircle className="w-10 h-10 mx-auto text-amber-500" />
                    <p className="text-[11px] font-semibold text-slate-300 leading-relaxed px-4">
                      {cameraErrorMessage}
                    </p>
                    <button
                      onClick={() => setActiveTab('manual')}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white rounded-lg transition-colors cursor-pointer"
                    >
                      สลับไปป้อนรหัสแทน
                    </button>
                  </div>
                ) : (
                  <>
                    <div id="qr-reader-container" className="w-full h-full object-cover"></div>
                    
                    {/* Glowing scanning target overlays */}
                    {isScanning && !scannedResult && (
                      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                        {/* Outer dark shade with clear center cutout layout */}
                        <div className="absolute inset-0 flex flex-col">
                          <div className="h-[22%] bg-black/55"></div>
                          <div className="h-[56%] flex">
                            <div className="w-[12%] bg-black/55"></div>
                            {/* Centered Target Frame */}
                            <div className="w-[76%] h-full bg-transparent border-2 border-dashed border-sky-400/50 rounded-xl relative">
                              {/* 4 Thick Outer Glowing Corners */}
                              <span className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-4 border-l-4 border-sky-400 rounded-tl-md filter drop-shadow-[0_0_4px_rgba(56,189,248,0.5)]"></span>
                              <span className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-4 border-r-4 border-sky-400 rounded-tr-md filter drop-shadow-[0_0_4px_rgba(56,189,248,0.5)]"></span>
                              <span className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-4 border-l-4 border-sky-400 rounded-bl-md filter drop-shadow-[0_0_4px_rgba(56,189,248,0.5)]"></span>
                              <span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-4 border-r-4 border-sky-400 rounded-br-md filter drop-shadow-[0_0_4px_rgba(56,189,248,0.5)]"></span>
                              
                              {/* Animated Red Scan Laser */}
                              <div className="absolute left-1.5 right-1.5 h-[2px] bg-red-500 shadow-[0_0_12px_#ef4444] rounded-full animate-bounce top-1/2 -translate-y-1/2"></div>

                              {/* Center target indicator circle */}
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-sky-300/35 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-sky-300/60"></div>
                              </div>

                              {/* Inner align banner */}
                              <div className="absolute bottom-3 left-0 right-0 text-center">
                                <span className="bg-slate-900/85 text-[8.5px] font-black text-sky-300 px-2 py-0.5 rounded uppercase tracking-widest animate-pulse border border-sky-500/20">
                                  จัดแนวคิวอาร์โค้ดที่นี่
                                </span>
                              </div>
                            </div>
                            <div className="w-[12%] bg-black/55"></div>
                          </div>
                          <div className="h-[22%] bg-black/55"></div>
                        </div>

                        {/* Top corner live camera tag */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#00236f]/95 text-white text-[8.5px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                          <span>Live Camera</span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Successful scanned indicator */}
                {scannedResult && (
                  <div className="absolute inset-0 bg-[#00236f]/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-white text-center animate-in fade-in duration-300">
                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mb-3">
                      <Check className="w-6 h-6 text-white stroke-[3px]" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-1">SCAN SUCCESS</p>
                    <p className="font-mono font-bold text-sm bg-white/10 px-3 py-1 rounded-lg">
                      {scannedResult}
                    </p>
                    <p className="text-[10px] text-slate-300 mt-2">กำลังพาคุณไปยังหน้ารายละเอียด...</p>
                  </div>
                )}
              </div>

              {/* Helper guide */}
              {!hasCameraError && !scannedResult && (
                <div className="text-center bg-sky-50/50 p-3 rounded-xl border border-sky-100/50 space-y-1">
                  <p className="text-[11px] text-[#00236f] font-bold flex items-center justify-center gap-1">
                    🔍 คำแนะนำการสแกน QR Code
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium leading-normal max-w-[240px] mx-auto">
                    โปรดวางกล้องให้ขนานกับครุภัณฑ์ และจัดให้รหัส QR อยู่ตรงกลางกรอบสี่เหลี่ยมสีฟ้าจนกว่าเครื่องจะอ่านค่าอัตโนมัติ
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Text input / scanner gun box */}
              <form onSubmit={handleManualSearch} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                    พิมพ์รหัสครุภัณฑ์ หรือใช้สแกนเนอร์ปืนยิง
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      autoFocus
                      value={manualInput}
                      onChange={(e) => {
                        setManualInput(e.target.value);
                        setManualError('');
                      }}
                      placeholder="เช่น IT-NB-2024-001 หรือ ซีเรียลนัมเบอร์"
                      className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00236f]/20 focus:border-[#00236f] transition-all"
                    />
                    <button
                      type="submit"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#00236f] hover:bg-primary text-white text-[10px] font-bold px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      ค้นหา (Go)
                    </button>
                  </div>
                </div>

                {manualError && (
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 flex items-start gap-2 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{manualError}</span>
                  </div>
                )}
              </form>

              <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">💡 แนะนำสำหรับผู้ใช้งาน:</p>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                  เมื่อคุณเชื่อมต่อเครื่องยิงปืนสแกนบาร์โค้ดผ่าน USB หรือ Bluetooth ท่านสามารถคลิกเลือกช่องด้านบนแล้วกดยิงสแกนได้ทันที ระบบจะสแกนและนำทางให้อัตโนมัติ
                </p>
              </div>
            </div>
          )}

          {/* Quick Mock Scanning links for testing the experience */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">รายการทดสอบสแกนเร่งด่วน (Quick Simulator)</p>
            <div className="grid grid-cols-2 gap-2">
              {assets.slice(0, 4).map((mockAsset) => (
                <button
                  key={mockAsset.id}
                  onClick={() => {
                    setScannedResult(mockAsset.id);
                    cleanupScanner();
                    triggerToast('success', `จำลองการสแกนสำเร็จ: ${mockAsset.id}`);
                    setTimeout(() => {
                      onSelectAsset(mockAsset.id);
                      onClose();
                      resetModal();
                    }, 800);
                  }}
                  className="p-2.5 bg-slate-50 hover:bg-[#00236f]/5 border border-slate-200 rounded-xl text-left transition-all hover:border-secondary cursor-pointer flex flex-col gap-1 text-xs"
                >
                  <div className="flex items-center gap-1">
                    {getCategoryIcon(mockAsset.category)}
                    <span className="font-mono font-bold text-[10px] text-[#00236f]">{mockAsset.id}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold truncate block w-full">{mockAsset.name}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
