import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  CreditCard, 
  Sparkles, 
  AlertCircle, 
  RefreshCw, 
  X, 
  Tag, 
  Ticket,
  ShieldCheck, 
  QrCode, 
  Upload, 
  ArrowRight,
  Zap,
  Building2,
  CalendarDays,
  Gift,
  User,
  Building,
  Globe
} from 'lucide-react';
import { db } from '../firebase/config';
import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuthStore } from '../store';
import QRCode from "react-qr-code";
import { Settings, Coupon } from '../types';
import CouponQRScanner from './CouponQRScanner';
import { Html5Qrcode } from 'html5-qrcode';
import emailService from '../lib/email';
import paymentService from '../lib/payment';

export default function SubscriptionManager({ 
  isNewWorkspace = false,
  onWorkspaceEntered
}: { 
  isNewWorkspace?: boolean;
  onWorkspaceEntered?: () => void;
} = {}) {
  const { t } = useTranslation();
  const { user, logout, companySlug } = useAuthStore();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [publicCoupons, setPublicCoupons] = useState<Coupon[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  
  // Payment state
  const [qrString, setQrString] = useState("");
  const [md5Hash, setMd5Hash] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed' | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isStripeProcessing, setIsStripeProcessing] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'khqr' | 'stripe'>('khqr');
  
  // Paid Coupon State
  const [pendingPaidCoupon, setPendingPaidCoupon] = useState<{
    code: string;
    price: number;
    duration: number;
    type: 'days' | 'months' | 'years' | 'unlimited' | 'lifetime';
    category?: 'coupon' | 'invite';
    planType?: string;
    employeeLimit?: number;
    usedCount: number;
  } | null>(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  // Extension Modal state
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const PLANS: Record<string, { price: number; name: string; duration: string; employeeLimit: number }> = {
    starter_monthly: { price: 4.99, name: 'Starter Plan (Monthly)', duration: 'month', employeeLimit: 10 },
    starter_yearly: { price: 47.99, name: 'Starter Plan (Yearly)', duration: 'year', employeeLimit: 10 },
    professional_monthly: { price: 9.99, name: 'Pro Plan (Monthly)', duration: 'month', employeeLimit: 25 },
    professional_yearly: { price: 95.99, name: 'Pro Plan (Yearly)', duration: 'year', employeeLimit: 25 },
  };

  const [staffCount, setStaffCount] = useState<number>(0);

  useEffect(() => {
    if (user?.companyId) {
      const fetchSettings = async () => {
        try {
          try {
            const snap = await getDoc(doc(db, "companies_settings", user.companyId));
            if (snap.exists()) {
              const data = { id: snap.id, ...snap.data() } as Settings;
              setSettings(data);
              try {
                localStorage.setItem(`cached_settings_${user.companyId}`, JSON.stringify(data));
              } catch (_) {}
            }
          } catch (docErr) {
            console.warn("Could not fetch remote company settings, checking cache:", docErr);
            const cached = localStorage.getItem(`cached_settings_${user.companyId}`);
            if (cached) {
              try { setSettings(JSON.parse(cached)); } catch (_) {}
            }
          }
          
          try {
            const staffQ = query(collection(db, "staff"), where("companyId", "==", user.companyId));
            const staffSnap = await getDocs(staffQ);
            const nonAdminCount = staffSnap.docs.map(d => d.data()).filter(s => s.role !== 'admin').length;
            setStaffCount(nonAdminCount);
          } catch (staffErr) {
            console.warn("Could not fetch staff count (offline mode):", staffErr);
          }

          // Fetch public ad coupons
          try {
            const couponsQ = query(collection(db, "coupons"), where("isPublic", "==", true));
            const couponsSnap = await getDocs(couponsQ);
            const activeCoupons = couponsSnap.docs
              .map(d => ({ id: d.id, ...d.data() } as Coupon))
              .filter(c => {
                 const exp = new Date(c.expiresAt);
                 return exp >= new Date() && c.usedCount < c.maxUses;
              });
            setPublicCoupons(activeCoupons);
          } catch (couponErr) {
            console.warn("Could not fetch public coupons (offline mode):", couponErr);
          }
        } catch (error) {
          console.warn("Notice while syncing subscription status:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchSettings();
    }
  }, [user]);

  useEffect(() => {
    if (selectedPlan || pendingPaidCoupon) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedPlan, pendingPaidCoupon]);

  useEffect(() => {
    if (paymentStatus === 'success') {
      const timer = setTimeout(() => {
        const slug = settings?.slug || companySlug || user?.companyId || '';
        logout();
        setSelectedPlan(null);
        setPendingPaidCoupon(null);
        setQrString("");
        setPaymentStatus(null);
        
        if (slug) {
          window.location.href = `/${slug}`;
        } else {
          window.location.href = '/login';
        }
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [paymentStatus, settings?.slug, companySlug, user?.companyId, logout]);

  const handleSelectPlan = async (plan: string) => {
    const currentSub = settings?.subscription;
    if (currentSub?.status === 'active' && currentSub?.expiresAt && new Date(currentSub.expiresAt) > new Date()) {
      setPendingPlan(plan);
      setShowExtensionModal(true);
      return;
    }
    await processPlanSelection(plan);
  };

  const processPlanSelection = async (plan: string) => {
    setSelectedPlan(plan);
    setPendingPaidCoupon(null);
    setIsGenerating(true);
    setErrorMessage("");
    setPaymentStatus('pending');

    try {
      const amount = PLANS[plan].price;
      const planName = PLANS[plan].name;
      const orderId = `SUB_${Date.now()}`;

      const paymentResult = await paymentService.processPayment({
        amount,
        currency: 'USD',
        description: `Workspace ${planName} Subscription`,
        orderId,
        userId: user?.id || '',
        companyId: user?.companyId || '',
        paymentMethod: selectedPaymentMethod
      });

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Failed to process payment');
      }

      if (paymentResult.qrString) {
        // KHQR payment
        setQrString(paymentResult.qrString);
        setMd5Hash(paymentResult.md5 || '');
      } else if (paymentResult.clientSecret) {
        // Stripe payment requiring action
        setStripeClientSecret(paymentResult.clientSecret);
        setIsStripeProcessing(true);
        // Note: In a real implementation, you'd use Stripe.js to handle the payment
        // and then call handlePaymentSuccess on success
        // For now, we'll simulate success after a delay
        setTimeout(async () => {
          await handlePaymentSuccess();
          setIsStripeProcessing(false);
          setStripeClientSecret(null);
        }, 3000);
      }

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to process payment");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setPaymentStatus('success');
    const now = new Date();

    if (pendingPaidCoupon && user?.companyId) {
      const expDate = new Date();
      const isUnlimitedType = pendingPaidCoupon.type === 'unlimited' || pendingPaidCoupon.type === 'lifetime' || (pendingPaidCoupon.duration && pendingPaidCoupon.duration >= 99);
      if (isUnlimitedType) {
        expDate.setFullYear(2099, 11, 31);
      } else if (pendingPaidCoupon.type === 'days') {
        expDate.setDate(expDate.getDate() + pendingPaidCoupon.duration);
      } else if (pendingPaidCoupon.type === 'months') {
        expDate.setMonth(expDate.getMonth() + pendingPaidCoupon.duration);
      } else if (pendingPaidCoupon.type === 'years') {
        expDate.setFullYear(expDate.getFullYear() + pendingPaidCoupon.duration);
      }

      const subType = pendingPaidCoupon.planType || (isUnlimitedType ? 'unlimited' : (pendingPaidCoupon.type === 'years' ? 'yearly' : 'monthly'));

      const subData: any = {
        type: subType,
        status: 'active',
        expiresAt: expDate.toISOString(),
        updatedAt: now.toISOString(),
        lastPaymentHash: md5Hash || (`COUPON_PAID_${pendingPaidCoupon.code}`),
        usedCode: pendingPaidCoupon.code
      };

      if (pendingPaidCoupon.employeeLimit && pendingPaidCoupon.employeeLimit > 0) {
        subData.employeeLimit = pendingPaidCoupon.employeeLimit;
      }

      await updateDoc(doc(db, "companies_settings", user.companyId), {
        subscription: subData
      });

      await updateDoc(doc(db, "coupons", pendingPaidCoupon.code), {
        usedCount: (pendingPaidCoupon.usedCount || 0) + 1
      });

      setSettings(prev => prev ? { ...prev, subscription: subData as any } : null);
      setCouponMessage(`Paid code "${pendingPaidCoupon.code}" redeemed successfully!`);

      // Send payment confirmation email
      if (user?.email) {
        await emailService.sendPaymentConfirmation(user.email, {
          amount: pendingPaidCoupon.price,
          currency: 'USD',
          planName: subType,
          transactionId: pendingPaidCoupon.code,
          date: now.toLocaleDateString()
        });
      }
    } else if (selectedPlan && user?.companyId) {
      const expDate = new Date();
      if (selectedPlan.endsWith('_monthly') || selectedPlan === 'monthly') {
        expDate.setMonth(expDate.getMonth() + 1);
      } else if (selectedPlan.endsWith('_yearly') || selectedPlan === 'yearly') {
        expDate.setFullYear(expDate.getFullYear() + 1);
      } else {
        expDate.setFullYear(expDate.getFullYear() + 1);
      }

      const planName = selectedPlan.replace('_', ' ').replace(/([a-z])([A-Z])/g, '$1 $2');

      const subData = {
        type: selectedPlan,
        status: 'active',
        expiresAt: expDate.toISOString(),
        updatedAt: now.toISOString(),
        lastPaymentHash: md5Hash
      };

      await updateDoc(doc(db, "companies_settings", user.companyId), {
        subscription: subData
      });

      setSettings(prev => prev ? { ...prev, subscription: subData as any } : null);

      // Send payment confirmation email
      if (user?.email) {
        const planDetails = PLANS[selectedPlan] || { name: selectedPlan, price: 0 };
        await emailService.sendPaymentConfirmation(user.email, {
          amount: planDetails.price,
          currency: 'USD',
          planName: planName,
          transactionId: `SUB_${Date.now()}`,
          date: now.toLocaleDateString()
        });
      }
    }
  };

  const checkPaymentStatus = async () => {
    if (!md5Hash || isCheckingPayment) return;
    setIsCheckingPayment(true);
    setErrorMessage("");
    
    try {
      const response = await fetch('/api/billing/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ md5: md5Hash })
      });

      const data = await response.json();
      
      if (data.responseCode === 0 && data.data) {
        // Genuine payment confirmed by NBC Bakong network!
        await handlePaymentSuccess();
      } else if (data.responseCode === 1) {
        if (data.errorCode === 1) {
          setErrorMessage("Payment not detected yet. Please complete the transfer in your mobile banking app.");
        } else if (data.responseMessage?.toLowerCase().includes("limit") || data.error?.includes("limit")) {
          setErrorMessage("Bakong NBC network daily request limit reached. Please try again later or contact support.");
        } else {
          setErrorMessage(data.responseMessage || "Transaction not found on NBC Bakong network.");
        }
      } else if (response.status === 429 || data.error) {
        setErrorMessage(data.message || data.responseMessage || data.error || "Awaiting payment on Bakong network...");
      } else {
        setErrorMessage("Payment status pending. Please scan and pay with ABA, Bakong, or Wing.");
      }
    } catch (err: any) {
      console.error("Check payment error:", err);
      setErrorMessage("Could not connect to payment server. Please check your internet connection.");
    } finally {
      setIsCheckingPayment(false);
    }
  };

  // Payment check is only performed on-demand when the user clicks the button
  const handleQRScan = (text: string) => {
    setCouponCode(text);
    applyCouponWithCode(text);
  };

  const applyCouponWithCode = async (codeToApply: string) => {
    setCouponError("");
    setCouponMessage("");
    if (!codeToApply) return;
    
    const currentSub = settings?.subscription;
    if (currentSub?.status === 'active' && currentSub?.expiresAt && new Date(currentSub.expiresAt) > new Date()) {
      setCouponError("You currently have an active subscription. Please wait until it expires to use another coupon.");
      return;
    }

    const code = codeToApply.toUpperCase().trim();
    setIsApplyingCoupon(true);
    const isSpecialUnlimitedCode = code === 'UNLIMITED' || code === 'SPECIAL_UNLIMITED' || code === 'LIFETIME' || code === 'UNLIMITED2026' || code.includes('UNLIMITED') || code.includes('LIFETIME');
        
    try {
      const couponDoc = await getDoc(doc(db, "coupons", code));
      let couponData: any = null;

      if (!couponDoc.exists()) {
        if (isSpecialUnlimitedCode && user?.role === 'super_admin') {
          couponData = {
            code,
            type: 'unlimited',
            duration: 99,
            price: 0,
            maxUses: 999999,
            usedCount: 0,
            category: 'coupon',
            expiresAt: '2099-12-31T23:59:59.000Z'
          };
          await setDoc(doc(db, "coupons", code), couponData).catch(() => {});
        } else {
          setCouponError("Invalid promo or invite code");
          return;
        }
      } else {
        couponData = couponDoc.data();
      }

      const expiresAt = new Date(couponData.expiresAt || '2099-12-31');
      if (typeof couponData.expiresAt === 'string' && !couponData.expiresAt.includes('T')) {
        expiresAt.setHours(23, 59, 59, 999);
      }
      
      if (expiresAt < new Date()) {
        setCouponError(`This code expired on ${new Date(couponData.expiresAt).toLocaleDateString()} and is no longer active for redemption.`);
        return;
      }
      
      if (couponData.usedCount >= couponData.maxUses) {
        setCouponError("This promo code has reached its maximum uses");
        return;
      }

      const price = Number(couponData.price || 0);

      // Check if code has a price (> 0)
      if (price > 0) {
        // Requires Payment!
        setSelectedPlan(null);
        setPendingPaidCoupon({
          code: couponData.code || code,
          price,
          duration: couponData.duration,
          type: couponData.type,
          category: couponData.category,
          planType: couponData.planType,
          employeeLimit: couponData.employeeLimit,
          usedCount: couponData.usedCount || 0
        });

        setIsGenerating(true);
        setErrorMessage("");
        setPaymentStatus('pending');
        setCouponMessage(`Code "${code}" requires $${price.toFixed(2)} payment. Processing payment...`);

        try {
          const paymentResult = await paymentService.processPayment({
            amount: price,
            currency: 'USD',
            description: `Paid Code ${code} Subscription`,
            orderId: `CP_${code.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}`,
            userId: user?.id || '',
            companyId: user?.companyId || '',
            paymentMethod: selectedPaymentMethod
          });

          if (!paymentResult.success) {
            throw new Error(paymentResult.error || 'Failed to process payment');
          }

          if (paymentResult.qrString) {
            // KHQR payment
            setQrString(paymentResult.qrString);
            setMd5Hash(paymentResult.md5 || '');
          } else if (paymentResult.clientSecret) {
            // Stripe payment requiring action
            setStripeClientSecret(paymentResult.clientSecret);
            setIsStripeProcessing(true);
            // Handle Stripe payment confirmation using Stripe.js
            const stripe = window.Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
            const { error } = await stripe.confirmPayment({
              // Elements client secret that was returned from our backend
              clientSecret: paymentResult.clientSecret,
              // Optional: confirm billing details
              // billing_details: {
              //   name: 'Jenny Rosen',
              //   email: 'jenny@example.com',
              //   phone: '1234567890',
              //   address: {
              //     postal_code: '98052',
              //     country: 'US',
              //     line1: '1234 Main St',
              //     city: 'Seattle',
              //     state: 'WA'
              //   }
              // }
            });

            if (error) {
              // Show error to customer
              console.error('Stripe payment error:', error);
              setErrorMessage(error.message);
            } else {
              // Payment confirmed! The payment is complete!
              await handlePaymentSuccess();
            }

            setIsStripeProcessing(false);
            setStripeClientSecret(null);
          }
        } catch (err: any) {
          console.error(err);
          setErrorMessage(err.message || "Failed to process payment for this code");
        } finally {
          setIsGenerating(false);
        }
      } else {
        // FREE Code - Redeem immediately!
        if (user?.companyId) {
          const now = new Date();
          const expDate = new Date();
          const isUnlimitedType = couponData.type === 'unlimited' || couponData.type === 'lifetime' || (couponData.duration && couponData.duration >= 99);
          
          if (isUnlimitedType) {
            expDate.setFullYear(2099, 11, 31);
          } else if (couponData.type === 'days') {
            expDate.setDate(expDate.getDate() + couponData.duration);
          } else if (couponData.type === 'months') {
            expDate.setMonth(expDate.getMonth() + couponData.duration);
          } else if (couponData.type === 'years') {
            expDate.setFullYear(expDate.getFullYear() + couponData.duration);
          }

          const subType = couponData.planType || (isUnlimitedType ? 'unlimited' : (couponData.type === 'years' ? 'yearly' : 'monthly'));

          const subData: any = {
            type: subType,
            status: 'active',
            expiresAt: expDate.toISOString(),
            updatedAt: now.toISOString(),
            lastPaymentHash: 'FREE_COUPON_' + code,
            usedCode: code
          };
          
          if (couponData.employeeLimit && couponData.employeeLimit > 0) {
            subData.employeeLimit = couponData.employeeLimit;
          }

          await updateDoc(doc(db, "companies_settings", user.companyId), {
            subscription: subData
          });
          
          await updateDoc(doc(db, "coupons", code), {
            usedCount: (couponData.usedCount || 0) + 1
          });
          
          setSettings(prev => prev ? { ...prev, subscription: subData as any } : null);
          setPendingPaidCoupon({
            code: couponData.code || code,
            price: 0,
            duration: couponData.duration,
            type: couponData.type,
            category: couponData.category,
            planType: couponData.planType,
            employeeLimit: couponData.employeeLimit,
            usedCount: (couponData.usedCount || 0) + 1
          });
          setPaymentStatus('success');
          setQrString("FREE_CODE_REDEEMED");
        }
      }
    } catch (err) {
      setCouponError("Failed to redeem code. Please try again.");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleDirectFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCouponError('');
    setCouponMessage('');

    try {
      const tempId = "direct-qr-reader-hidden";
      const scanner = new Html5Qrcode(tempId);
      let decodedText = '';

      try {
        const res = await scanner.scanFileV2(file, false);
        if (res && res.decodedText) decodedText = res.decodedText;
      } catch (err) {
        try {
          decodedText = await scanner.scanFile(file, false);
        } catch (e2) {
          throw new Error("No QR code detected in the selected image.");
        }
      }

      if (decodedText) {
        setCouponCode(decodedText);
        applyCouponWithCode(decodedText);
      }
    } catch (err: any) {
      setCouponError(err.message || "Failed to scan QR code from image.");
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent"></div>
          <p className="text-xs font-semibold text-slate-500">Loading subscription status...</p>
        </div>
      </div>
    );
  }

  const sub = settings?.subscription;
  const isActive = sub?.status === 'active';
  const expiresAt = sub?.expiresAt ? new Date(sub.expiresAt) : null;
  const isExpired = expiresAt ? expiresAt < new Date() : false;
  const isUnlimited = sub?.type === 'unlimited' || sub?.type === 'lifetime' || (expiresAt && expiresAt.getFullYear() >= 2090);
  const isCoupon = (sub?.type as string) === 'coupon' || (sub?.type as string) === 'invite' || sub?.lastPaymentHash?.startsWith('COUPON_') || (sub as any)?.isCoupon || Boolean((sub as any)?.couponCode);
  const planTitle = isUnlimited ? 'Unlimited / Lifetime Access' : (isCoupon ? 'Coupon / Invite Code' : (
    sub?.type === 'starter_monthly' ? 'Starter Monthly' :
    sub?.type === 'starter_yearly' ? 'Starter Yearly' :
    sub?.type === 'professional_monthly' ? 'Pro Monthly' :
    sub?.type === 'professional_yearly' ? 'Pro Yearly' :
    sub?.type === 'yearly' ? 'Yearly Subscription' : 'Monthly Subscription'
  ));

  // Determine staff limit
  const getEmployeeLimit = () => {
    if ((sub as any)?.employeeLimit !== undefined && (sub as any)?.employeeLimit > 0) {
      return (sub as any).employeeLimit;
    }
    if (isUnlimited) return Infinity;
    if (sub?.type === 'starter_monthly' || sub?.type === 'starter_yearly') return 10;
    if (sub?.type === 'professional_monthly' || sub?.type === 'professional_yearly') return 25;
    return Infinity;
  };
  const employeeLimit = getEmployeeLimit();
  const usagePercentage = Math.min(100, Math.round((staffCount / (employeeLimit === Infinity ? Math.max(staffCount, 1) : employeeLimit)) * 100));

  if (isScannerOpen) {
    return (
      <div className={`mx-auto pb-24 ${isNewWorkspace ? 'w-full' : 'max-w-5xl'}`}>
        <CouponQRScanner 
          onClose={() => setIsScannerOpen(false)} 
          onScan={(code) => {
            setIsScannerOpen(false);
            handleQRScan(code);
          }} 
        />
      </div>
    );
  }

  return (
    <div className={`mx-auto pb-24 animate-in fade-in duration-300 space-y-8 ${isNewWorkspace ? 'w-full' : 'max-w-5xl'}`}>
      {/* Page Header */}
      {!isNewWorkspace && (
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Subscription & Billing
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Manage your workspace plan, view usage, and redeem codes.
          </p>
        </div>

        {isActive && !isExpired && (
          <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span className="font-medium text-xs uppercase tracking-wider">
              {planTitle}
            </span>
          </div>
        )}
      </div>
      )}

      {/* Top Grid: Plan & Usage */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Current Plan Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Current Plan</p>
              {!isActive || isExpired ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-md">
                  <AlertCircle className="w-3.5 h-3.5" /> Action Needed
                </span>
              ) : null}
            </div>
            <h3 className="text-3xl font-semibold text-slate-900 dark:text-white mb-6">
              {isActive && !isExpired ? planTitle : t('notYetSubscribed')}
            </h3>
            
            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Billing Cycle</p>
                <p className="font-medium text-slate-900 dark:text-slate-200">
                  {isUnlimited ? 'Lifetime' : sub?.type?.includes('yearly') ? 'Annually' : sub?.type?.includes('monthly') ? 'Monthly' : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Valid Until</p>
                <p className="font-medium text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                  {isUnlimited && isActive && !isExpired ? (
                    'Permanent'
                  ) : expiresAt && isActive && !isExpired ? (
                    expiresAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  ) : isExpired ? (
                    <span className="text-rose-500">Expired</span>
                  ) : (
                    'N/A'
                  )}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 mt-8">
             <a href="#plans" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium transition-colors">
               Upgrade Plan
             </a>
             <button onClick={() => window.scrollTo({ top: document.getElementById('redeem-section')?.offsetTop, behavior: 'smooth' })} className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors">
               Redeem Code
             </button>
             <a href="https://t.me/kiri_hr_support_bot" target="_blank" rel="noreferrer" className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors ml-auto">
               Support
             </a>
          </div>
        </div>

        {/* Usage Overview */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Usage Overview</h3>
            <Building2 className="w-5 h-5 text-slate-400" />
          </div>
          
          <div className="space-y-8">
            {/* Employee Quota */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Employee Quota</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {staffCount} <span className="text-slate-400 font-normal">/ {employeeLimit === Infinity ? 'Unlimited' : employeeLimit}</span>
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${usagePercentage > 90 ? 'bg-rose-500' : usagePercentage > 75 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
              {employeeLimit !== Infinity && staffCount >= employeeLimit && (
                <p className="text-xs text-rose-500 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Quota exceeded
                </p>
              )}
            </div>
            
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Payment Method</span>
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-white">KHQR / Code</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Next Renewal</span>
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {isUnlimited ? 'N/A' : expiresAt ? expiresAt.toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Redeem Code Section */}
      <div id="redeem-section" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
            Redeem a Code
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Enter your promotion or invite code, or scan a QR code to activate your plan.
          </p>
          
          <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full">
            <div className="relative flex-1">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="ENTER CODE"
                className="w-full h-12 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-shadow text-sm uppercase tracking-wide shadow-sm"
              />
            </div>
            
            <div className="flex items-stretch gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="flex-none w-12 h-12 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors flex items-center justify-center border border-slate-300 dark:border-slate-700 shadow-sm"
                title="Scan QR"
              >
                <QrCode className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-none w-12 h-12 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors flex items-center justify-center border border-slate-300 dark:border-slate-700 shadow-sm"
                title="Upload QR"
              >
                <Upload className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
              <button
                type="button"
                onClick={() => applyCouponWithCode(couponCode)}
                disabled={!couponCode || isApplyingCoupon}
                className="flex-1 sm:flex-none h-12 px-8 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-sm"
              >
                {isApplyingCoupon ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  'Redeem'
                )}
              </button>
            </div>
          </div>
          <AnimatePresence mode="popLayout">
            {couponError && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 overflow-hidden">
                <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-lg flex items-start gap-2 text-sm text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{couponError}</span>
                </div>
              </motion.div>
            )}
            {couponMessage && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 overflow-hidden">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg flex items-start gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{couponMessage}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {publicCoupons.length > 0 && (
          <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Active Promotions</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicCoupons.map((coupon, i) => {
                const isFree = !coupon.price || coupon.price === 0;
                return (
                <button
                  key={coupon.id || i}
                  onClick={() => { setCouponCode(coupon.code); applyCouponWithCode(coupon.code); }}
                  className="group flex flex-col text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm hover:shadow-md"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {isFree ? 'Free' : 'Discount'}
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {isFree ? 'FREE' : `$${coupon.price.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="font-mono text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                    {coupon.code}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    +{coupon.duration} {coupon.type}
                  </div>
                </button>
              )})}
            </div>
          </div>
        )}

        {user?.role === 'super_admin' && (
          <div className="flex items-center gap-4 mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Super Admin</span>
            <button
              type="button"
              onClick={() => { setCouponCode('UNLIMITED'); applyCouponWithCode('UNLIMITED'); }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Apply Unlimited Pass
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleDirectFileUpload}
          className="hidden"
        />
      </div>

      {/* Pricing Plans Section */}
      <div id="plans" className="pt-12 pb-8">
        <div className="text-center mb-10">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
            Choose your plan
          </h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-sm">
            Simple, transparent pricing for teams of all sizes.
          </p>
        </div>
        
        <div className="flex justify-center mb-10">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg inline-flex items-center">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${billingCycle === 'monthly' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Annually
              <span className={`px-1.5 py-0.5 text-[10px] uppercase font-bold rounded ${billingCycle === 'yearly' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>-20%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Starter Plan */}
          <div className={`flex flex-col border rounded-2xl p-6 md:p-8 bg-white dark:bg-slate-900 transition-shadow ${selectedPlan === "starter_" + billingCycle ? 'border-slate-900 dark:border-indigo-500 shadow-md ring-1 ring-slate-900 dark:ring-indigo-500' : 'border-slate-200 dark:border-slate-800'}`}>
            <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Starter</h4>
            <div className="mb-4 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">
                ${billingCycle === 'monthly' ? '4.99' : '47.99'}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">/ {billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Perfect for small teams getting started with digital tracking.
            </p>
            <button 
              onClick={() => handleSelectPlan("starter_" + billingCycle)}
              className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors mb-8 ${selectedPlan === "starter_" + billingCycle ? 'bg-slate-900 dark:bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white'}`}
            >
              Select Starter
            </button>
            <ul className="space-y-3 mt-auto">
              {["Up to 10 employees", "Basic GPS check-in", "1 Workspace location", "Standard reporting"].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Professional Plan */}
          <div className={`flex flex-col border rounded-2xl p-6 md:p-8 bg-slate-50 dark:bg-slate-800/30 transition-shadow relative ${selectedPlan === "professional_" + billingCycle ? 'border-slate-900 dark:border-indigo-500 shadow-md ring-1 ring-slate-900 dark:ring-indigo-500' : 'border-slate-300 dark:border-slate-700 shadow-sm'}`}>
            <div className="absolute top-0 right-6 -translate-y-1/2 bg-slate-900 dark:bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              Popular
            </div>
            <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Pro</h4>
            <div className="mb-4 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">
                ${billingCycle === 'monthly' ? '9.99' : '95.99'}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">/ {billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Everything you need to manage growing teams efficiently.
            </p>
            <button 
              onClick={() => handleSelectPlan("professional_" + billingCycle)}
              className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors mb-8 ${selectedPlan === "professional_" + billingCycle ? 'bg-slate-900 dark:bg-indigo-600 text-white' : 'bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white'}`}
            >
              Select Pro
            </button>
            <ul className="space-y-3 mt-auto">
              {["Up to 25 employees", "Smart GPS & WiFi check-in", "Automated payroll calculation", "Telegram notifications", "Unlimited locations"].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Enterprise Plan */}
          <div className="flex flex-col border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 bg-white dark:bg-slate-900">
            <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Enterprise</h4>
            <div className="mb-4 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">
                Custom
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Advanced controls and support for large organizations.
            </p>
            <a 
              href="https://t.me/kiri_hr_support_bot" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-lg text-sm font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors mb-8 text-center block"
            >
              Contact Sales
            </a>
            <ul className="space-y-3 mt-auto">
              {["Dedicated account manager", "Custom API integration", "Advanced role permissions", "White-glove onboarding"].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bakong KHQR Payment Modal */}
      {createPortal(
        <AnimatePresence>
          {(selectedPlan || pendingPaidCoupon || paymentStatus === 'success' || qrString) && (
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
                      if (paymentStatus === 'success') {
                        const slug = settings?.slug || companySlug || user?.companyId || '';
                        logout();
                        setSelectedPlan(null);
                        setPendingPaidCoupon(null);
                        setQrString("");
                        setPaymentStatus(null);
                        
                        if (slug) {
                          window.location.href = `/${slug}`;
                        } else {
                          window.location.href = '/login';
                        }
                        return;
                      }
                      
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
                ) : (paymentStatus === 'success' || qrString) ? (
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
                            ? `Code "${pendingPaidCoupon.code}" redeemed! +${pendingPaidCoupon.duration} ${pendingPaidCoupon.type} added.`
                            : 'Your workspace subscription has been updated successfully.'}
                        </p>
                        <button 
                          onClick={() => {
                            const slug = settings?.slug || companySlug || user?.companyId || '';
                            logout();
                            setSelectedPlan(null);
                            setPendingPaidCoupon(null);
                            setQrString("");
                            setPaymentStatus(null);
                            
                            if (slug) {
                              window.location.href = `/${slug}`;
                            } else {
                              window.location.href = '/login';
                            }
                          }}
                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-emerald-500/20 text-sm cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Redirecting to Workspace...
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
                            src="/images/khqr_logo.png"
                            alt="KHQR"
                            className="absolute top-3 right-35 h-6 object-contain filter brightness-0 invert"
                          />
                        </div>

                        <div className="p-8 pt-6 flex flex-col items-center w-full">
                          <div className="text-center mb-6 w-full">
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wider mb-1">
                              {pendingPaidCoupon 
                                ? `${pendingPaidCoupon.category === 'invite' ? 'Workspace Invite Pass' : 'Discount Coupon'}: ${pendingPaidCoupon.code}`
                                : 'KiriHR Software'}
                            </p>
                            <div className="text-[24px] font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                              ${(pendingPaidCoupon ? pendingPaidCoupon.price : (selectedPlan ? PLANS[selectedPlan].price : 0)).toFixed(2)}
                              <span className="text-[13px] font-semibold text-slate-500">USD</span>
                            </div>
                          </div>

                          {/* Payment Method Selection */}
                          <div className="my-4 w-full">
                            <div className="flex items-center justify-between mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                              <span>Payment Method</span>
                              <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                  <input
                                    type="radio"
                                    checked={selectedPaymentMethod === 'khqr'}
                                    onChange={() => setSelectedPaymentMethod('khqr')}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                  />
                                  <span>KHQR (Local)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                  <input
                                    type="radio"
                                    checked={selectedPaymentMethod === 'stripe'}
                                    onChange={() => setSelectedPaymentMethod('stripe')}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                  />
                                  <span>Stripe (International)</span>
                                </label>
                              </div>
                            </div>
                            <div className="h-px bg-gray-200"></div>
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
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400">+{pendingPaidCoupon.duration} {pendingPaidCoupon.type}</span>
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
                                <img loading="lazy" decoding="async" 
                                  src="/images/bakong_favicon.png" 
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

                          <div className="flex flex-col items-center justify-center gap-2.5 w-full">
                            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-3.5 py-2 rounded-full border border-slate-100 dark:border-slate-700">
                              <RefreshCw className={`w-3.5 h-3.5 text-[#E3000F] ${isCheckingPayment ? 'animate-spin' : ''}`} />
                              <span>{isCheckingPayment ? 'Checking NBC Bakong Network...' : 'Awaiting Mobile Banking Payment...'}</span>
                            </div>

                            <button
                              onClick={checkPaymentStatus}
                              disabled={isCheckingPayment}
                              className="w-full mt-1 py-3 px-4 bg-[#E3000F] hover:bg-[#c2000d] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingPayment ? 'animate-spin' : ''}`} />
                              {isCheckingPayment ? "Checking NBC Network..." : "Check Payment Status"}
                            </button>

                            {errorMessage && (
                              <div className="w-full mt-1 flex items-start gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-2.5 rounded-xl text-amber-700 dark:text-amber-400 text-xs text-left">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                                <p className="font-medium">{errorMessage}</p>
                              </div>
                            )}

                            <div className="flex items-center justify-center gap-1.5 text-slate-400 dark:text-slate-500 mt-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                              <p className="text-[10px] font-bold uppercase tracking-wider">Bakong KHQR Encrypted Real Settlement</p>
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
