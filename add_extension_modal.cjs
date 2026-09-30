const fs = require('fs');

function replaceFile(path, regex, replacement) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(path, content);
}

const modalHtml = `
      {/* Plan Extension Modal */}
      <AnimatePresence>
        {showExtensionModal && pendingPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => {
                setShowExtensionModal(false);
                setPendingPlan(null);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl p-6 md:p-8 overflow-hidden z-10 border border-slate-200 dark:border-slate-800"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Active Subscription Found</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                  You currently have an active subscription. If you purchase the new <strong>{PLANS[pendingPlan].name}</strong>, your current plan will be immediately replaced and any remaining time will be lost.
                </p>
                <div className="flex w-full gap-3">
                  <button
                    onClick={() => {
                      setShowExtensionModal(false);
                      setPendingPlan(null);
                    }}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowExtensionModal(false);
                      if (pendingPlan) {
                        processPlanSelection(pendingPlan);
                      }
                    }}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-lg shadow-amber-500/20"
                  >
                    Replace Plan
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      </AnimatePresence>
    </div>
  );
}`;

replaceFile('src/components/SubscriptionManager.tsx',
  /<\/AnimatePresence>\s*<\/div>\s*\);\s*}/g,
  modalHtml
);

