import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Upload, X, AlertCircle, RefreshCw, Sparkles, CheckCircle2, Image as ImageIcon, QrCode } from 'lucide-react';

interface CouponQRScannerProps {
  onClose: () => void;
  onScan: (code: string) => void;
}

export default function CouponQRScanner({ onClose, onScan }: CouponQRScannerProps) {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [cameraError, setCameraError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const isTransitioningRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    const startScanner = async () => {
      if (isTransitioningRef.current) return;
      
      try {
        isTransitioningRef.current = true;
        
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode("coupon-qr-reader-inline");
        }
        
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }

        if (!mounted) {
          isTransitioningRef.current = false;
          return;
        }

        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          if (!mounted) {
            isTransitioningRef.current = false;
            return;
          }
          await scannerRef.current.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              if (mounted) {
                setScannedResult(decodedText);
                scannerRef.current?.pause();
                // small delay for UI effect
                setTimeout(() => {
                  if (mounted) onScan(decodedText);
                }, 800);
              }
            },
            () => {
              // ignore errors during scan
            }
          );
          if (mounted) setCameraError("");
        } else {
          if (mounted) setCameraError("No camera devices found on this device.");
        }
      } catch (err: any) {
        console.error("Camera error:", err);
        if (mounted) {
          setCameraError(err.message || "Could not access the camera. Please allow permissions.");
        }
      } finally {
        isTransitioningRef.current = false;
      }
    };

    const stopScanner = async () => {
      if (isTransitioningRef.current) {
        // If it's transitioning, try again in a bit
        setTimeout(() => {
          if (!mounted) stopScanner();
        }, 500);
        return;
      }
      
      if (scannerRef.current?.isScanning) {
        try {
          isTransitioningRef.current = true;
          await scannerRef.current.stop();
        } catch (err) {
          console.error("Error stopping scanner:", err);
        } finally {
          isTransitioningRef.current = false;
        }
      }
    };

    if (activeTab === 'camera') {
      // Small timeout to ensure DOM is ready
      setTimeout(() => {
        if (mounted) startScanner();
      }, 100);
    } else {
      stopScanner();
    }

    return () => {
      mounted = false;
      stopScanner();
    };
  }, [activeTab, onScan]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setIsProcessingFile(true);
    setUploadError("");
    setScannedResult(null);

    try {
      const html5QrCode = new Html5Qrcode("coupon-qr-reader-file-inline");
      const decodedText = await html5QrCode.scanFile(file, true);
      setScannedResult(decodedText);
      setTimeout(() => {
        onScan(decodedText);
      }, 800);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Failed to scan QR code from image.");
    } finally {
      setIsProcessingFile(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-slate-900 sm:border border-slate-200 dark:border-slate-800 sm:rounded-2xl shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      {/* Header */}
      <div className="p-6 sm:p-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Redeem Coupon</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Scan a QR code to activate your plan or invite.</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-700 dark:text-slate-400 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
          title="Close Scanner"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid md:grid-cols-[280px_1fr] gap-0">
        {/* Sidebar Tabs */}
        <div className="p-6 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 flex flex-row md:flex-col gap-2">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 md:flex-none py-4 px-4 text-sm font-semibold rounded-xl transition-all flex md:flex-col lg:flex-row items-center justify-center md:justify-start gap-3 border ${
              activeTab === 'camera'
                ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400 shadow-sm'
                : 'bg-transparent border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Camera className="w-5 h-5" />
            Use Camera
          </button>
          
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 md:flex-none py-4 px-4 text-sm font-semibold rounded-xl transition-all flex md:flex-col lg:flex-row items-center justify-center md:justify-start gap-3 border ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400 shadow-sm'
                : 'bg-transparent border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="w-5 h-5" />
            Upload Image
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 sm:p-10 flex flex-col items-center justify-center min-h-[400px]">
          {activeTab === 'camera' ? (
            <div className="w-full flex flex-col items-center">
              <div className="relative w-full max-w-[320px] aspect-square bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-100 dark:border-slate-800">
                <div id="coupon-qr-reader-inline" className="w-full h-full object-cover"></div>
                
                {scannedResult && (
                  <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
                    <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-4 animate-bounce" />
                    <p className="text-white font-display font-bold text-xl">QR Detected!</p>
                    <p className="text-emerald-300 text-sm mt-2 font-mono bg-emerald-900/50 px-3 py-1 rounded-lg border border-emerald-500/30">{scannedResult}</p>
                  </div>
                )}
              </div>

              {cameraError ? (
                <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl flex items-start gap-3 text-sm text-amber-800 dark:text-amber-300 w-full max-w-md">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="font-bold mb-1">Camera Access Required</p>
                    <p className="opacity-90">{cameraError}</p>
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="mt-3 inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold hover:underline"
                    >
                      Switch to Image Upload →
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-6 text-center max-w-xs">
                  Position the QR code within the frame to scan automatically.
                </p>
              )}
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-md aspect-video border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-50 dark:bg-slate-800/30 group hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {isProcessingFile ? (
                  <div className="flex flex-col items-center py-4">
                    <RefreshCw className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin mb-4" />
                    <p className="text-base font-bold text-slate-900 dark:text-white">Analyzing Image...</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Looking for QR codes</p>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                    <p className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                      Click to Browse Images
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center font-medium">
                      Select a photo or screenshot containing a QR code.
                    </p>
                  </>
                )}
              </div>

              {uploadError && (
                <div className="mt-8 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-start gap-3 text-sm text-rose-700 dark:text-rose-400 w-full max-w-md">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <div>
                     <p className="font-bold mb-1">Scan Failed</p>
                     <p className="opacity-90">{uploadError}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Hidden processing element */}
      <div id="coupon-qr-reader-file-inline" className="hidden"></div>
    </div>
  );
}
