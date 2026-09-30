const fs = require('fs');

let code = fs.readFileSync('src/components/SubscriptionManager.tsx', 'utf8');

// Find the index of "      {/* Bakong KHQR Payment Modal */}"
const splitIndex = code.indexOf('      {/* Bakong KHQR Payment Modal */}');

if (splitIndex === -1) {
  console.log('Could not find split point');
  process.exit(1);
}

const beforeModals = code.slice(0, splitIndex);

const newModals = `      {/* Bakong KHQR Payment Modal */}
      {createPortal(
        <AnimatePresence>
          {(selectedPlan || pendingPaidCoupon) && (
            <div key="khqr-payment-modal-wrapper" className="fixed inset-0 z-[100] flex items-center justify-center p-0 bg-slate-50 dark:bg-slate-950 overflow-hidden">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-transparent p-0 max-w-sm w-full h-full flex flex-col justify-center relative"
              >
                <div className="absolute top-4 right-4 z-20">
                  <button 
                    onClick={() => {
                      setSelectedPlan(null);
                      setPendingPaidCoupon(null);
                      setQrString("");
                      setPaymentStatus(null);
                      setErrorMessage("");
                    }}
                    className="p-2.5 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors shadow-sm"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {isGenerating ? (
                  <div className="bg-white rounded-[1.5rem] shadow-2xl p-8 flex flex-col items-center justify-center min-h-[420px]">
                    <RefreshCw className="w-10 h-10 text-[#E3000F] animate-spin mb-4" />
                    <p className="text-sm font-semibold text-slate-700">Generating secure KHQR...</p>
                    <p className="text-xs text-slate-400 mt-1">Please wait a moment</p>
                  </div>
                ) : qrString ? (
                  <div className="flex flex-col items-center w-full px-4 sm:px-0">
                    {paymentStatus === 'success' ? (
                      <motion.div 
                        initial={{ scale: 0.9 }} 
                        animate={{ scale: 1 }} 
                        className="bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-2xl p-8 flex flex-col items-center justify-center min-h-[420px] w-full text-center border border-slate-100 dark:border-slate-800"
                      >
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                          <Check className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Payment Confirmed!</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mb-6">
                          {pendingPaidCoupon 
                            ? \`Code "\${pendingPaidCoupon.code}" redeemed! +\${pendingPaidCoupon.duration} \${pendingPaidCoupon.type} added.\`
                            : 'Your workspace subscription has been updated successfully.'}
                        </p>
                        <button 
                          onClick={() => {
                            setSelectedPlan(null);
                            setPendingPaidCoupon(null);
                            setQrString("");
                            window.location.reload();
                          }}
                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-emerald-500/20 text-sm"
                        >
                          Enter Workspace Platform
                        </button>
                      </motion.div>
                    ) : (
                      <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-2xl w-full relative overflow-hidden border border-slate-100 dark:border-slate-800">
                        {/* KHQR Header */}
                        <div
                          className="relative h-[60px] bg-[#E3000F]"
                          style={{
                            clipPath: "polygon(0 0, 100% 0, 100% 100%, 90% 80%, 0 80%)",
                          }}
                        >
                          <img
                            src="https://upload.wikimedia.org/wikipedia/commons/b/bb/KHQR_Logo.png"
                            alt="KHQR"
                            className="absolute top-2 right-4 h-6 object-contain filter brightness-0 invert"
                          />
                        </div>

                        <div className="p-8 pt-6 flex flex-col items-center w-full">
                          <div className="text-center mb-6 w-full">
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                              {pendingPaidCoupon 
                                ? \`\${pendingPaidCoupon.category === 'invite' ? 'Workspace Invite Pass' : 'Discount Coupon'}: \${pendingPaidCoupon.code}\`
                                : 'KiriHR Software'}
                            </p>
                            <div className="text-[24px] font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                              \${(pendingPaidCoupon ? pendingPaidCoupon.price : (selectedPlan ? PLANS[selectedPlan].price : 0)).toFixed(2)}
                              <span className="text-[13px] font-semibold text-slate-500">USD</span>
                            </div>
                          </div>

                          {/* Detailed Coupon Information Box */}
                          {pendingPaidCoupon && (
                            <div className="my-3 p-3 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/60 text-left text-xs space-y-1.5 w-full">
                              <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <Ticket className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                  Coupon Code Details
                                </span>
                                <span className="font-mono bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded text-[11px] font-bold">
                                  {pendingPaidCoupon.code}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600 dark:text-slate-300">
                                <div>
                                  <span className="text-slate-400 dark:text-slate-500 block">Purpose:</span>
                                  <span className="font-semibold">{pendingPaidCoupon.category === 'invite' ? 'Workspace Invite Pass' : 'Discount Promo Coupon'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 dark:text-slate-500 block">Access Extension:</span>
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400">+\{pendingPaidCoupon.duration} {pendingPaidCoupon.type}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="w-full border-t border-dashed border-slate-200 dark:border-slate-800 mb-6"></div>

                          {/* QR Display */}
                          <div className="flex justify-center mb-6 relative w-full">
                            <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-slate-100">
                              <QRCode value={qrString} size={230} level="H" fgColor="#000000" />
                            </div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-full shadow-sm">
                              <div className="w-10 h-10 bg-[#E3000F] rounded-full flex items-center justify-center overflow-hidden">
                                <img 
                                  src="https://bakong.nbc.gov.kh/images/favicon.png" 
                                  alt="Bakong Logo" 
                                  className="w-full h-full object-cover scale-110"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-center justify-center gap-2 w-full">
                            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-3.5 py-2 rounded-full border border-slate-100 dark:border-slate-700">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#E3000F]" />
                              <span>Awaiting Mobile Banking Payment...</span>
                            </div>

                            {errorMessage && (
                              <div className="w-full mt-2 flex items-start gap-2 bg-rose-50 dark:bg-rose-500/10 p-2.5 rounded-xl text-rose-600 dark:text-rose-400 text-xs">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <p className="font-medium">{errorMessage}</p>
                              </div>
                            )}

                            <div className="flex items-center justify-center gap-1.5 text-slate-400 dark:text-slate-500 mt-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                              <p className="text-[10px] font-bold uppercase tracking-wider">Bakong KHQR Encrypted</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-[1.5rem] shadow-2xl p-8 flex flex-col items-center justify-center min-h-[400px] text-center w-full px-4 mx-4">
                    <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
                    <p className="text-slate-900 font-bold text-base mb-1">Could not generate KHQR</p>
                    <p className="text-slate-500 text-xs">{errorMessage || 'Please try again or select another plan.'}</p>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Plan Extension Modal */}
      {createPortal(
        <AnimatePresence>
          {showExtensionModal && pendingPlan && (
            <div key="extension-modal-wrapper" className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/components/SubscriptionManager.tsx', beforeModals + newModals);
console.log('done');
