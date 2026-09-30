const fs = require('fs');
let code = fs.readFileSync('src/components/SubscriptionManager.tsx', 'utf-8');

// Imports
if (!code.includes('import { QrCode }')) {
  code = code.replace(`import { Settings } from '../types';`, 
`import { Settings } from '../types';
import { QrCode } from 'lucide-react';
import CouponQRScannerModal from './CouponQRScannerModal';`);
}

// State
if (!code.includes('isScannerOpen')) {
  code = code.replace(`  const [couponError, setCouponError] = useState("");`, 
`  const [couponError, setCouponError] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);`);
}

// applyCoupon logic
const oldLogicStart = `  const applyCoupon = async () => {`;
const oldLogicEnd = `    } catch (err) {
      setCouponError("Failed to apply coupon");
    }
  };`;

if (code.includes(oldLogicStart)) {
  const applyInsert = `  const handleQRScan = (text: string) => {
    setCouponCode(text);
    setTimeout(() => {
      applyCouponWithCode(text);
    }, 100);
  };

  const applyCouponWithCode = async (codeToApply: string) => {
    setCouponError("");
    setCouponMessage("");
    if (!codeToApply) return;
    const code = codeToApply.toUpperCase().trim();
        
    try {
      const couponDoc = await getDoc(doc(db, "coupons", code));
      if (!couponDoc.exists()) {
        setCouponError("Invalid coupon code");
        return;
      }
      const couponData = couponDoc.data();
      const expiresAt = new Date(couponData.expiresAt);
      
      if (expiresAt < new Date()) {
        setCouponError("This coupon has expired");
        return;
      }
      
      if (couponData.usedCount >= couponData.maxUses) {
        setCouponError("This coupon has reached its maximum uses");
        return;
      }

      if (user?.companyId) {
        const now = new Date();
        if (couponData.type === 'days') {
          now.setDate(now.getDate() + couponData.duration);
        } else if (couponData.type === 'months') {
          now.setMonth(now.getMonth() + couponData.duration);
        } else if (couponData.type === 'years') {
          now.setFullYear(now.getFullYear() + couponData.duration);
        }

        const subData = {
          type: couponData.type === 'years' ? 'yearly' : 'monthly',
          status: 'active',
          expiresAt: now.toISOString(),
          lastPaymentHash: 'COUPON_' + code
        };

        await updateDoc(doc(db, "companies_settings", user.companyId), {
          subscription: subData
        });
        
        await updateDoc(doc(db, "coupons", code), {
          usedCount: (couponData.usedCount || 0) + 1
        });
        
        setCouponMessage("Coupon applied successfully! Reloading...");
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err) {
      setCouponError("Failed to apply coupon");
    }
  };

  const applyCoupon = () => applyCouponWithCode(couponCode);`;

  let idxStart = code.indexOf(oldLogicStart);
  let idxEnd = code.indexOf(oldLogicEnd, idxStart) + oldLogicEnd.length;
  code = code.substring(0, idxStart) + applyInsert + code.substring(idxEnd);
}

// JSX
const jsxOld = `<input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Enter promo code"
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
              />
              <button
                onClick={applyCoupon}
                disabled={!couponCode}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
            {couponError && <p className="text-sm font-medium text-red-500 mt-3">{couponError}</p>}
            {couponMessage && <p className="text-sm font-medium text-emerald-500 mt-3">{couponMessage}</p>}
          </div>
        </div>
      </div>`;

if (code.includes('placeholder="Enter promo code"')) {
  const jsxInsert = `<div className="flex gap-2 relative">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter promo or invite code"
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-[85px] py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                />
                <button
                  onClick={() => setIsScannerOpen(true)}
                  className="absolute right-[80px] top-1.5 bottom-1.5 px-3 flex items-center justify-center text-slate-400 hover:text-indigo-500 transition-colors"
                  title="Scan QR Code"
                >
                  <QrCode className="w-5 h-5" />
                </button>
                <button
                  onClick={applyCoupon}
                  disabled={!couponCode}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
            </div>
            {couponError && <p className="text-sm font-medium text-red-500 mt-3">{couponError}</p>}
            {couponMessage && <p className="text-sm font-medium text-emerald-500 mt-3">{couponMessage}</p>}
          </div>
        </div>
      </div>
      
      <CouponQRScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={handleQRScan} 
      />`;
      
   code = code.replace(jsxOld, jsxInsert);
}

fs.writeFileSync('src/components/SubscriptionManager.tsx', code, 'utf-8');
