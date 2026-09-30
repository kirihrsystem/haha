const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf-8');

content = content.replace(
`      {staffToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-4 bg-slate-50 dark:bg-slate-950 transition-all duration-300 overflow-hidden">
        <ScrollLock />
          <div className="bg-white dark:bg-slate-900 sm:glass-panel sm:border border-white/60 dark:border-slate-700/50 sm:rounded-[2.5rem] max-w-sm w-full shadow-[0_0_100px_rgba(0,0,0,0.1)] dark:shadow-[0_0_100px_rgba(0,0,0,0.3)] relative flex flex-col p-6 sm:p-8">
            <h3 className="text-2xl font-display font-semibold mb-2 text-slate-900 dark:text-white">
              {t("deleteConfirm")}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium">
              {t("deleteMessage")}
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStaffToDelete(null)}
                className="flex-1 p-3.5 px-4 font-semibold rounded-[2rem] glass-panel border border-white/60 dark:border-slate-700 hover:bg-white/80 dark:hover:bg-slate-700/50 transition-all shadow-sm text-slate-700 dark:text-slate-200"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={confirmDeleteStaff}
                className="flex-1 p-3.5 px-4 font-semibold btn-3d-danger"
              >
                {t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}`,
`      {staffToDelete && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-4 bg-slate-50 dark:bg-slate-950 transition-all duration-300 overflow-hidden">
        <ScrollLock />
          <div className="bg-white dark:bg-slate-900 sm:glass-panel sm:border border-white/60 dark:border-slate-700/50 sm:rounded-[2.5rem] max-w-sm w-full shadow-[0_0_100px_rgba(0,0,0,0.1)] dark:shadow-[0_0_100px_rgba(0,0,0,0.3)] relative flex flex-col p-6 sm:p-8">
            <h3 className="text-2xl font-display font-semibold mb-2 text-slate-900 dark:text-white">
              {t("deleteConfirm")}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium">
              {t("deleteMessage")}
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStaffToDelete(null)}
                className="flex-1 p-3.5 px-4 font-semibold rounded-[2rem] glass-panel border border-white/60 dark:border-slate-700 hover:bg-white/80 dark:hover:bg-slate-700/50 transition-all shadow-sm text-slate-700 dark:text-slate-200"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={confirmDeleteStaff}
                className="flex-1 p-3.5 px-4 font-semibold btn-3d-danger"
              >
                {t("delete")}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}`
);

content = content.replace(
`      {/* QR Code Modal Overlay for specific staff */}
      <AnimatePresence>
        {showQRModal && qrStaffId && (
          <div key="staff-qr-modal-wrapper" className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 print:p-0 print:bg-white print:block">
        <ScrollLock />
            <div
              className="absolute inset-0 print:hidden cursor-pointer"
              onClick={() => { setShowQRModal(false); setQrStaffId(null); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-[460px] print:max-w-none print:w-full print:h-full max-h-[95vh] flex flex-col"
            >
              <div className="flex-1 min-h-0 glass-panel border border-white/50 dark:border-slate-700/50 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative flex flex-col items-center print:rounded-none print:shadow-none print:border-none print:p-0 print:h-full print:w-full overflow-y-auto hide-scrollbar">
                <button
                  onClick={() => { setShowQRModal(false); setQrStaffId(null); }}
                  className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium print:hidden"
                >
                  x
                </button>
                <div className="w-full pt-4 print:pt-0 print:h-full">
                  <QRPrintCard
                    companyCode={qrStaffId.slice(0, 8)}
                    loginUrl={\`\${window.location.origin}/\${settings?.slug || user?.companyId}/e/\${qrStaffId}\`}
                    companyName={staffList.find(s => s.id === qrStaffId)?.name || "Employee"}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>`,
`      {/* QR Code Modal Overlay for specific staff */}
      <AnimatePresence>
        {showQRModal && qrStaffId && createPortal(
          <div key="staff-qr-modal-wrapper" className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 print:p-0 print:bg-white print:block">
        <ScrollLock />
            <div
              className="absolute inset-0 print:hidden cursor-pointer"
              onClick={() => { setShowQRModal(false); setQrStaffId(null); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-[460px] print:max-w-none print:w-full print:h-full max-h-[95vh] flex flex-col"
            >
              <div className="flex-1 min-h-0 glass-panel border border-white/50 dark:border-slate-700/50 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative flex flex-col items-center print:rounded-none print:shadow-none print:border-none print:p-0 print:h-full print:w-full overflow-y-auto hide-scrollbar">
                <button
                  onClick={() => { setShowQRModal(false); setQrStaffId(null); }}
                  className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium print:hidden"
                >
                  x
                </button>
                <div className="w-full pt-4 print:pt-0 print:h-full">
                  <QRPrintCard
                    companyCode={qrStaffId.slice(0, 8)}
                    loginUrl={\`\${window.location.origin}/\${settings?.slug || user?.companyId}/e/\${qrStaffId}\`}
                    companyName={staffList.find(s => s.id === qrStaffId)?.name || "Employee"}
                  />
                </div>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>`
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
