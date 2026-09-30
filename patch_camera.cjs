const fs = require('fs');

let content = fs.readFileSync('src/components/CameraModal.tsx', 'utf8');

// Imports
content = content.replace(
  "import { Camera, X, RefreshCw, Check, SwitchCamera } from 'lucide-react';",
  "import { createPortal } from 'react-dom';\nimport { Camera, X, RefreshCw, Check, SwitchCamera } from 'lucide-react';\nimport ScrollLock from './ScrollLock';\nimport { useTranslation } from 'react-i18next';"
);

// Translation hook
content = content.replace(
  "const { settings } = useSettingsStore();",
  "const { settings } = useSettingsStore();\n  const { t } = useTranslation();"
);

// Return statement replacement
const oldReturn = `  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 w-full max-w-sm shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-500" />
            Take Photo
          </h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative aspect-[3/4] bg-black rounded-2xl overflow-hidden flex items-center justify-center grow min-h-0">
          {error ? (
            <div className="text-white text-center p-4">
              <p className="mb-4">{error}</p>
              <button onClick={onClose} className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">Close</button>
            </div>
          ) : !capturedPhoto ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={\`absolute inset-0 w-full h-full object-cover \${facingMode === 'user' ? 'scale-x-[-1]' : ''}\`}
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
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
              {settings?.logoUrl ? (
                <div className="bg-black/40 p-1.5 rounded-lg backdrop-blur-md">
                  <img src={settings.logoUrl} alt="Logo" className="h-6 object-contain" />
                </div>
              ) : (
                <span className="bg-black/50 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-md">
                  {facingMode === 'user' ? 'Front Camera' : 'Rear Camera'}
                </span>
              )}
              
              <button
                onClick={toggleCamera}
                title="Switch Camera"
                type="button"
                className="bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-full backdrop-blur-md transition-all active:scale-95 flex items-center gap-1.5 text-xs font-medium border border-white/20"
              >
                <SwitchCamera className="w-4 h-4" />
                <span>{facingMode === 'user' ? 'Front' : 'Rear'}</span>
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-center gap-3 shrink-0">
          {!capturedPhoto ? (
            <button
              onClick={capturePhoto}
              disabled={!!error}
              className="w-16 h-16 rounded-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-500 border-4 border-indigo-200 dark:border-indigo-900 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
            >
              <div className="w-8 h-8 rounded-full bg-white shadow-inner" />
            </button>
          ) : (
            <>
              <button
                onClick={handleRetake}
                className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retake
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3.5 bg-indigo-500 text-white rounded-2xl font-semibold hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
              >
                <Check className="w-4 h-4" />
                Use Photo
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );`;

const newReturn = `  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 overflow-hidden overscroll-none"
      onClick={onClose}
    >
      <ScrollLock />
      <div 
        className="bg-white dark:bg-slate-900 sm:border border-slate-200 dark:border-slate-800 sm:rounded-xl shadow-xl max-w-lg w-full h-full sm:h-auto sm:max-h-[90vh] relative flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 sm:pb-5 border-b border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
                {t('takePhoto') || 'Take Photo'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Identity verification for attendance
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div 
          className="p-5 sm:p-6 overflow-y-auto overflow-x-hidden overscroll-contain flex-1 custom-scrollbar bg-slate-50/50 dark:bg-slate-950/30 flex flex-col items-center justify-center"
          style={{ WebkitOverflowScrolling: "touch" }}
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
                className={\`absolute inset-0 w-full h-full object-cover \${facingMode === 'user' ? 'scale-x-[-1]' : ''}\`}
              />
            ) : (
              <img
                src={capturedPhoto}
                alt="Captured preview"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Camera Overlay Controls */}
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

        {/* Modal Footer Controls */}
        <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex gap-3 sm:gap-4 mt-auto">
          {!capturedPhoto ? (
            <div className="w-full flex justify-center">
              <button
                onClick={capturePhoto}
                disabled={!!error}
                className="w-[72px] h-[72px] rounded-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-500 border-[6px] border-indigo-100 dark:border-indigo-950 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-md"
              >
                <div className="w-8 h-8 rounded-full bg-white shadow-sm" />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={handleRetake}
                className="flex-1 py-3 px-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retake
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-sm shadow-indigo-500/20 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Use Photo
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );`;

content = content.replace(oldReturn, newReturn);
fs.writeFileSync('src/components/CameraModal.tsx', content);
console.log('Patched CameraModal UI');
