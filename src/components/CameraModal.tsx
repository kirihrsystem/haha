import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Camera, X, RefreshCw, Check, SwitchCamera } from 'lucide-react';
import ScrollLock from './ScrollLock';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../store';

interface CameraModalProps {
  onCapture: (photoDataUrl: string) => void;
  onClose: () => void;
}

export default function CameraModal({ onCapture, onClose }: CameraModalProps) {
  const { settings } = useSettingsStore();
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async (mode: 'user' | 'environment') => {
    stopCamera();
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: mode } 
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
        }
      } catch (fallbackErr) {
        console.error("Error accessing fallback camera:", fallbackErr);
        setError("Cannot access camera. Please check permissions.");
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      let width = video.videoWidth || 640;
      let height = video.videoHeight || 480;
      const MAX_DIMENSION = 500;
      
      if (width > height && width > MAX_DIMENSION) {
        height = Math.round((height * MAX_DIMENSION) / width);
        width = MAX_DIMENSION;
      } else if (height > width && height > MAX_DIMENSION) {
        width = Math.round((width * MAX_DIMENSION) / height);
        height = MAX_DIMENSION;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        if (facingMode === 'user') {
          ctx.translate(width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, width, height);
        ctx.restore();
        const dataUrl = canvas.toDataURL('image/jpeg', 0.70);
        setCapturedPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  const handleConfirm = () => {
    if (capturedPhoto) {
       onCapture(capturedPhoto);
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    startCamera(facingMode);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 overflow-hidden overscroll-none">
      <ScrollLock />
      <div className="bg-white dark:bg-slate-900 sm:border border-slate-200 dark:border-slate-800 sm:rounded-xl shadow-xl max-w-xl w-full h-full sm:h-auto sm:max-h-[90vh] relative flex flex-col overflow-hidden">
        
        {/* EXACT header match with Add Employee */}
        <div className="p-5 sm:p-6 pb-4 sm:pb-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            {t('takePhoto') || 'Take Photo'}
          </h3>
        </div>

        {/* EXACT body wrapper match with Add Employee form */}
        <div 
          className="p-5 sm:p-6 space-y-6 overflow-y-auto overflow-x-hidden overscroll-contain flex-1 custom-scrollbar flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-950/30"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="relative aspect-[3/4] bg-black rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center w-full max-w-[320px] shadow-sm">
            {error ? (
              <div className="text-white text-center p-4">
                <p className="mb-4 text-sm">{error}</p>
                <button onClick={onClose} className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-sm">Close</button>
              </div>
            ) : !capturedPhoto ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />
            ) : (
              <img
                src={capturedPhoto}
                alt="Captured preview"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <canvas ref={canvasRef} className="hidden" />
            
            {!capturedPhoto && !error && (
              <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10 pointer-events-none">
                {settings?.logoUrl ? (
                  <div className="bg-black/40 p-1.5 rounded-lg backdrop-blur-md pointer-events-auto">
                    <img src={settings.logoUrl} alt="Logo" className="h-6 object-contain" />
                  </div>
                ) : (
                  <span className="bg-black/50 text-white text-[10px] px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10 shadow-sm pointer-events-auto font-medium">
                    {facingMode === 'user' ? 'Front' : 'Rear'}
                  </span>
                )}
                <button
                  onClick={toggleCamera}
                  title="Switch Camera"
                  type="button"
                  className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-all active:scale-95 flex items-center gap-1.5 text-xs font-medium border border-white/20 pointer-events-auto shadow-sm"
                >
                  <SwitchCamera className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* EXACT footer match with Add Employee form */}
        <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex justify-end gap-3 sm:gap-4 mt-auto">
          {!capturedPhoto ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
              >
                {t("cancel") || "Cancel"}
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                disabled={!!error}
                className="px-5 py-2.5 font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm text-sm"
              >
                Capture Photo
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Retake
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-5 py-2.5 font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm text-sm flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Use Photo
              </button>
            </>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}
