import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { doc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { useAuthStore, useThemeStore } from '../store';
import { ArrowLeft, Building, Lock, Mail, User, Sparkles, Image as ImageIcon, Sun, Moon, Globe, Check, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Staff } from '../types';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { compressImage } from "../utils/imageUtils";
import { toggleAppLanguage } from "../utils/googleTranslate";

const calculatePasswordStrength = (password: string): number => {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(4, score);
};

const RESERVED_SLUGS = ['login', 'signup', 'admin', 'employee', 'e', 'api', 'public', 'system-admin', 'setup-super-admin', 'dashboard', 'settings', 'user'];

export default function Signup() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    customSlug: '',
    logoUrl: ''
  });
  const [slugStatus, setSlugStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({ checking: false, available: null, message: '' });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userEditedSlug, setUserEditedSlug] = useState(false);
  
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin');
    } else if (user?.role === 'staff') {
      navigate('/employee');
    }
  }, [user, navigate]);

  // Clean slug helper
  const sanitizeSlug = (val: string) => {
    return val.toLowerCase().trim().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
  };

  // Auto-generate slug when companyName changes if user hasn't typed custom slug
  const handleCompanyNameChange = (val: string) => {
    const newSlug = userEditedSlug ? formData.customSlug : sanitizeSlug(val);
    setFormData(prev => ({ ...prev, companyName: val, customSlug: newSlug }));
    if (newSlug) {
      checkSlugAvailability(newSlug);
    } else {
      setSlugStatus({ checking: false, available: null, message: '' });
    }
  };

  const handleSlugChange = (val: string) => {
    setUserEditedSlug(true);
    const cleaned = sanitizeSlug(val);
    setFormData(prev => ({ ...prev, customSlug: cleaned }));
    if (cleaned) {
      checkSlugAvailability(cleaned);
    } else {
      setSlugStatus({ checking: false, available: null, message: '' });
    }
  };

  const checkSlugAvailability = async (targetSlug: string) => {
    const clean = sanitizeSlug(targetSlug);
    if (!clean) {
      setSlugStatus({ checking: false, available: null, message: '' });
      return;
    }

    if (clean.length < 3) {
      setSlugStatus({
        checking: false,
        available: false,
        message: 'Workspace URL name must be at least 3 characters long.'
      });
      return;
    }

    if (RESERVED_SLUGS.includes(clean)) {
      setSlugStatus({
        checking: false,
        available: false,
        message: `'${clean}' is a system reserved name. Please pick another workspace name.`
      });
      return;
    }

    setSlugStatus({ checking: true, available: null, message: 'Checking availability...' });

    try {
      const slugQ = query(collection(db, "companies_settings"), where("slug", "==", clean));
      const slugSnaps = await getDocs(slugQ);
      if (!slugSnaps.empty) {
        setSlugStatus({
          checking: false,
          available: false,
          message: `The workspace URL name '${clean}' is already chosen by another user. Please change to a unique workspace name.`
        });
      } else {
        setSlugStatus({
          checking: false,
          available: true,
          message: `Workspace URL '${window.location.host}/${clean}' is available!`
        });
      }
    } catch (err) {
      console.error("Error checking slug availability", err);
      setSlugStatus({ checking: false, available: true, message: '' });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.companyName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError(t('enterFields'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    const finalSlug = sanitizeSlug(formData.customSlug || formData.companyName) || ('workspace-' + Math.floor(1000 + Math.random() * 9000));

    if (slugStatus.available === false) {
      setError(slugStatus.message || "The workspace URL name is already taken. Please choose a different workspace name.");
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const adminQ = query(collection(db, "staff"), where("email", "==", formData.email.toLowerCase()), where("role", "==", "admin"));
      const adminSnaps = await getDocs(adminQ);
      if (!adminSnaps.empty) {
        setError(t('An account with this email already exists'));
        setLoading(false);
        return;
      }

      // Re-verify slug uniqueness one last time
      const finalSlugQ = query(collection(db, "companies_settings"), where("slug", "==", finalSlug));
      const finalSlugSnaps = await getDocs(finalSlugQ);
      if (!finalSlugSnaps.empty) {
        setError(`The workspace URL name '${finalSlug}' is already chosen by another user. Please change to a unique workspace name.`);
        setSlugStatus({
          checking: false,
          available: false,
          message: `The workspace URL name '${finalSlug}' is already chosen by another user. Please change it.`
        });
        setLoading(false);
        return;
      }
      
      const uid = 'admin_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
      const companyCodeStr = "C-" + Math.floor(1000 + Math.random() * 9000);

      // Create company settings document
      const compRef = doc(db, "companies_settings", uid);
      await setDoc(compRef, {
        companyId: uid,
        companyCode: companyCodeStr,
        slug: finalSlug,
        companyName: formData.companyName,
        logoUrl: formData.logoUrl,
        exchangeRate: 4000,
        defaultHourlyRate: 2,
        defaultOvertimeRate: 3,
        currencyDisplay: "BOTH"
      });
      
      const adminRef = doc(db, "staff", uid);
      await setDoc(adminRef, {
        id: uid,
        companyId: uid,
        name: formData.name,
        email: formData.email.toLowerCase(),
        password: formData.password,
        role: "admin",
        passcode: "",
        hourlyRate: 0,
        createdAt: new Date().toISOString()
      });
      
      // Set the admin user in local state
      const adminUser: Staff = {
        id: uid,
        companyId: uid,
        name: formData.name,
        email: formData.email.toLowerCase(),
        role: "admin",
        passcode: "",
        hourlyRate: 0,
        createdAt: new Date().toISOString(),
      };
      
      setUser(adminUser, uid, formData.companyName);
      navigate(`/${finalSlug}/admin`);
    } catch (err: any) {
      console.error(err);
      let errorMessage = t('failedCreateWorkspace');
      if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-8 sm:px-6 lg:px-8 text-slate-900 dark:text-slate-100 transition-colors relative overflow-hidden bg-slate-50/50 dark:bg-slate-950/50">
      

      <div className="absolute top-4 right-4 flex gap-3 z-50">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-full bg-white/60 hover:bg-white/80 dark:bg-slate-900/60 dark:hover:bg-slate-800 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 transition-all text-slate-800 dark:text-slate-200 shadow-lg shadow-black/5"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <Link to="/" className="p-2.5 rounded-full bg-white/60 hover:bg-white/80 dark:bg-slate-900/60 dark:hover:bg-slate-800 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 transition-all text-slate-800 dark:text-slate-200 shadow-lg shadow-black/5 flex items-center justify-center" title="Back home">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <button
           onClick={() => {
             toggleAppLanguage(i18n.language, i18n);
           }}
           title={t("language")}
           className="text-xl p-2.5 rounded-full bg-white/60 hover:bg-white/80 dark:bg-slate-900/60 dark:hover:bg-slate-800 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 transition-all shadow-lg shadow-black/5 cursor-pointer"
        >
           🌐
        </button>
      </div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 flex flex-col justify-center items-center px-4 pt-16 sm:pt-0">
        <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-4 text-center text-2xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
          {t("createWorkspace")}
        </motion.h2>
        <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
          {t("alreadyHaveAccount")} <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">{t("loginText")}</Link>
        </motion.p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-900 py-6 px-4 sm:rounded-2xl sm:px-8 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none w-full">
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-slate-200 mb-1">
                {t("yourName")}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="block w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                  placeholder="e.g. Udomkevin Vat"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-slate-200 mb-1">
                {t("companyNameLabel")}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Building className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => handleCompanyNameChange(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                  placeholder="e.g. My Company"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold text-slate-900 dark:text-slate-200">
                  Workspace URL Name
                </label>
                <span className="text-xs text-slate-500 hidden sm:inline-block">{window.location.host}/<strong>{formData.customSlug || 'yourname'}</strong></span>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Globe className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.customSlug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className={`block w-full pl-10 pr-10 py-2 border rounded-xl bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 transition-all text-sm ${
                    slugStatus.available === false 
                      ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500' 
                      : slugStatus.available === true 
                      ? 'border-emerald-300 focus:ring-emerald-500 focus:border-emerald-500' 
                      : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                  placeholder="e.g. mycompany"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  {slugStatus.checking && <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />}
                  {!slugStatus.checking && slugStatus.available === true && <Check className="w-4 h-4 text-emerald-500" />}
                  {!slugStatus.checking && slugStatus.available === false && <AlertCircle className="w-4 h-4 text-rose-500" />}
                </div>
              </div>

              {slugStatus.message && (
                <div className={`mt-2 text-xs font-medium flex items-start gap-1.5 ${
                  slugStatus.available === false 
                    ? 'text-rose-600 dark:text-rose-400' 
                    : slugStatus.available === true
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-500'
                }`}>
                  {slugStatus.available === false && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                  {slugStatus.available === true && <Check className="w-4 h-4 shrink-0 mt-0.5" />}
                  <span>{slugStatus.message}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-slate-200 mb-1">
                {t("emailAddressLabel")}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="block w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                  placeholder="admin@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-slate-200 mb-1">
                {t("password")}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="block w-full pl-10 pr-10 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {formData.password.length > 0 && (
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Password Strength</span>
                    <span className={`text-[10px] font-bold ${
                      (() => {
                        const score = calculatePasswordStrength(formData.password);
                        if (score < 2) return 'text-rose-500';
                        if (score < 4) return 'text-amber-500';
                        return 'text-emerald-500';
                      })()
                    }`}>
                      {(() => {
                        const score = calculatePasswordStrength(formData.password);
                        if (score === 0) return 'Very Weak';
                        if (score === 1) return 'Weak';
                        if (score === 2) return 'Fair';
                        if (score === 3) return 'Good';
                        return 'Strong';
                      })()}
                    </span>
                  </div>
                  <div className="flex gap-1 h-1.5 w-full">
                    {[1, 2, 3, 4].map((level) => {
                      const score = calculatePasswordStrength(formData.password);
                      const isFilled = score >= level || (score === 0 && level === 1);
                      let colorClass = 'bg-slate-200 dark:bg-slate-800';
                      
                      if (isFilled) {
                        if (score < 2) colorClass = 'bg-rose-500';
                        else if (score < 4) colorClass = 'bg-amber-500';
                        else colorClass = 'bg-emerald-500';
                      }
                      
                      return (
                        <div 
                          key={level} 
                          className={`flex-1 rounded-full transition-colors duration-300 ${colorClass}`} 
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-slate-200 mb-1">
                Confirm Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="block w-full pl-10 pr-10 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-slate-200 mb-2">
                {t("companyLogoOptional")}
              </label>
              <div className="flex justify-center">
                <label className="relative flex flex-col items-center justify-center w-32 h-32 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-2xl cursor-pointer bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors overflow-hidden group">
                  {formData.logoUrl ? (
                    <>
                      <img src={formData.logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ImageIcon className="w-6 h-6 text-white mb-1" />
                        <span className="text-white text-xs font-semibold">Change</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-2">
                      <div className="w-8 h-8 mb-2 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ImageIcon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Upload Logo</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-0.5">1:1 Auto-crop</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          setError(t("logoTooLarge") || "Image is too large. Max size is 10MB.");
                          return;
                        }
                        setError('');
                        try {
                          // Pass true for autoCropSquare
                          const compressedUrl = await compressImage(file, 800, 800, 0.7, true);
                          setFormData({...formData, logoUrl: compressedUrl});
                        } catch (error) {
                          setError("Failed to compress image");
                        }
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  key="signup-error-banner"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-rose-50 dark:bg-rose-500/10 border-l-4 border-rose-500 p-3 rounded-r-lg mt-4"
                >
                  <p className="text-sm text-rose-700 dark:text-rose-400 font-medium">
                    {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 mt-6 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors text-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t("creating")}</span>
                </div>
              ) : (
                t("createWorkspace")
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
