const fs = require('fs');
let content = fs.readFileSync('src/components/CameraModal.tsx', 'utf8');

const returnIdx = content.indexOf('  return (');
if (returnIdx === -1) {
  console.log("Could not find '  return ('");
  process.exit(1);
}

const head = content.substring(0, returnIdx);

const newReturn = `  return createPortal(
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
`;

fs.writeFileSync('src/components/CameraModal.tsx', head + newReturn);
console.log('Fixed CameraModal');
