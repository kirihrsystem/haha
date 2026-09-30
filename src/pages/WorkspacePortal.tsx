import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuthStore, useThemeStore } from "../store";
import { useTranslation } from "react-i18next";
import { Staff } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Building2, Lock, Mail, ArrowLeft, Copy, Check, ShieldCheck, UserCheck, Sparkles, Sun, Moon, Globe, Eye, EyeOff } from "lucide-react";
import { toggleAppLanguage } from "../utils/googleTranslate";

const RESERVED_SLUGS = ['login', 'signup', 'admin', 'employee', 'e', 'api', 'public'];

export default function WorkspacePortal() {
  const { companySlug } = useParams<{ companySlug: string }>();
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { t, i18n } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [companyData, setCompanyData] = useState<{ id: string; name: string; slug: string; logoUrl?: string; code: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"staff" | "admin">("staff");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Staff login state
  const [passcode, setPasscode] = useState("");
  const [showStaffPasscode, setShowStaffPasscode] = useState(false);
  const [matchingStaff, setMatchingStaff] = useState<Staff[]>([]);
  const [showStaffSelect, setShowStaffSelect] = useState(false);

  // Admin login state
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  useEffect(() => {
    if (!companySlug || RESERVED_SLUGS.includes(companySlug.toLowerCase())) {
      setLoading(false);
      return;
    }

    async function loadWorkspace() {
      setLoading(true);
      setError("");
      try {
        const cleanSlug = companySlug.trim();
        const lowerSlug = cleanSlug.toLowerCase();
        const alphaSlug = lowerSlug.replace(/[^a-z0-9]/g, '');

        let compSnapDocs: any[] = [];

        // 1. Check slug match
        let q = query(collection(db, "companies_settings"), where("slug", "==", alphaSlug));
        let snaps = await getDocs(q);
        if (snaps.empty) {
          q = query(collection(db, "companies_settings"), where("slug", "==", lowerSlug));
          snaps = await getDocs(q);
        }

        // 2. Check companyCode match
        if (snaps.empty) {
          q = query(collection(db, "companies_settings"), where("companyCode", "==", cleanSlug.toUpperCase()));
          snaps = await getDocs(q);
        }

        // 3. Check direct doc ID match
        if (snaps.empty) {
          const directDoc = await getDoc(doc(db, "companies_settings", cleanSlug));
          if (directDoc.exists()) {
            compSnapDocs = [directDoc];
          }
        } else {
          compSnapDocs = snaps.docs;
        }

        if (compSnapDocs.length > 0) {
          const compDoc = compSnapDocs[0];
          const data = compDoc.data();
          setCompanyData({
            id: compDoc.id,
            name: data.companyName || "Workspace",
            slug: data.slug || lowerSlug,
            logoUrl: data.logoUrl,
            code: data.companyCode || ""
          });
        } else {
          setCompanyData(null);
        }
      } catch (err: any) {
        console.error(err);
        setError("Error loading workspace details.");
      } finally {
        setLoading(false);
      }
    }

    loadWorkspace();
  }, [companySlug]);

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}/${companyData?.slug || companySlug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyData || !passcode.trim()) {
      setError(t("enterFields") || "Please enter passcode");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const q = query(
        collection(db, "staff"),
        where("companyId", "==", companyData.id),
        where("passcode", "==", passcode.trim())
      );
      const snaps = await getDocs(q);
      const staffList = snaps.docs
        .map(d => ({ id: d.id, ...d.data() } as Staff))
        .filter(s => s.role !== "admin");

      if (staffList.length === 0) {
        setError(t("invalidPasscode") || "Invalid passcode for this workspace");
        return;
      }

      if (staffList.length === 1) {
        setUser(staffList[0], companyData.id, companyData.name);
        navigate("/employee");
      } else {
        setMatchingStaff(staffList);
        setShowStaffSelect(true);
      }
    } catch (err: any) {
      setError(err.message || "Failed to log in");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyData || !adminEmail || !adminPassword) {
      setError(t("enterFields") || "Please enter email and password");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const emailLower = adminEmail.toLowerCase().trim();
      const q = query(
        collection(db, "staff"),
        where("email", "==", emailLower),
        where("companyId", "==", companyData.id),
        where("role", "==", "admin")
      );
      const snaps = await getDocs(q);

      let foundAdmin: Staff | null = null;
      for (const d of snaps.docs) {
        const data = d.data();
        if (data.password === adminPassword) {
          foundAdmin = { ...data, id: d.id } as Staff;
          break;
        }
      }

      if (!foundAdmin) {
        setError(t("invalidEmailPassword") || "Invalid email or password");
        return;
      }

      setUser(foundAdmin, companyData.id, companyData.name);
      navigate("/admin");
    } catch (err: any) {
      setError(err.message || "Admin login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectStaff = (selected: Staff) => {
    if (companyData) {
      setUser(selected, companyData.id, companyData.name);
      navigate("/employee");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
        <div className="flex flex-col items-center gap-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl border border-white/60 dark:border-slate-800">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="text-sm font-medium tracking-wide animate-pulse">Loading Workspace Portal...</p>
        </div>
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-6 text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-950/50">
        <div className="max-w-md w-full glass-card p-8 rounded-[2.5rem] text-center shadow-2xl border border-white/80 dark:border-slate-800">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Building2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-2">Workspace Not Found</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            No workspace is currently configured at <span className="font-semibold text-slate-700 dark:text-slate-200">{window.location.host}/{companySlug}</span>.
          </p>
          <div className="flex flex-col gap-3">
            <Link to="/signup" className="btn-3d-primary py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 font-semibold">
              <Sparkles className="w-4 h-4" /> Create This Workspace
            </Link>
            <Link to="/login" className="btn-3d-secondary py-3 px-6 rounded-2xl flex items-center justify-center gap-2 font-medium">
              <ArrowLeft className="w-4 h-4" /> Main Login Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const workspaceDisplayUrl = `${window.location.host}/${companyData.slug || companySlug}`;

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-900 dark:text-slate-100 relative overflow-hidden bg-transparent">
      {/* Top action controls */}
      <div className="absolute top-4 right-4 flex gap-3 z-50">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-full bg-white/60 hover:bg-white/80 dark:bg-slate-900/60 dark:hover:bg-slate-800 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 transition-all text-slate-800 dark:text-slate-200 shadow-lg shadow-black/5"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button
           onClick={() => toggleAppLanguage(i18n.language, i18n)}
           title={t("language")}
           className="text-xl p-2.5 rounded-full bg-white/60 hover:bg-white/80 dark:bg-slate-900/60 dark:hover:bg-slate-800 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 transition-all shadow-lg shadow-black/5 cursor-pointer"
        >
           🌐
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Workspace Brand Banner */}
        <div className="text-center mb-6 flex flex-col items-center">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-4 relative">
            <div className="w-28 h-28 mx-auto flex items-center justify-center overflow-visible">
              <img src={companyData.logoUrl || "/logo.png"} alt={companyData.name} className="w-full h-full object-contain drop-shadow-sm" />
            </div>
          </motion.div>

          <motion.h1 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
            {companyData.name}
          </motion.h1>

          <motion.button
            initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
            onClick={handleCopyLink}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 hover:bg-indigo-100 transition-colors cursor-pointer"
            title="Copy Workspace Link"
          >
            <span>{workspaceDisplayUrl}</span>
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </motion.button>
        </div>

        {/* Login Container Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="glass-card py-8 px-6 sm:px-8 shadow-2xl rounded-[2.5rem] border border-white/80 dark:border-slate-800/80"
        >
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => { setActiveTab("staff"); setError(""); }}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === "staff"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <UserCheck className="w-4 h-4" /> Staff Access
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("admin"); setError(""); }}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === "admin"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Admin Portal
            </button>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="p-4 mb-6 text-sm text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-950/50 rounded-2xl border border-red-200 dark:border-red-900/50">
              {error}
            </motion.div>
          )}

          {activeTab === "staff" ? (
            <form onSubmit={handleStaffLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Staff Passcode
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showStaffPasscode ? "text" : "password"}
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter your passcode"
                    className="w-full pl-11 pr-12 py-3.5 glass-panel border border-slate-200 dark:border-slate-700/80 rounded-2xl text-lg font-bold tracking-widest text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStaffPasscode(!showStaffPasscode)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showStaffPasscode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-3d-primary py-4 px-6 rounded-2xl font-bold text-sm tracking-wide shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Log In to {companyData.name}</>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Admin Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full pl-11 pr-4 py-3.5 glass-panel border border-slate-200 dark:border-slate-700/80 rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showAdminPassword ? "text" : "password"}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3.5 glass-panel border border-slate-200 dark:border-slate-700/80 rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showAdminPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-3d-primary py-4 px-6 rounded-2xl font-bold text-sm tracking-wide shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Access Admin Dashboard</>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>

      {/* Staff selection modal when multiple employees share passcode */}
      <AnimatePresence>
        {showStaffSelect && (
          <div key="staff-select-portal-wrapper" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card max-w-sm w-full p-6 rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-white/80 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">Select Your Account</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-6">Multiple profiles match this passcode. Please select your profile:</p>
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {matchingStaff.map((s, idx) => (
                  <button
                    key={`${s.id}-${idx}`}
                    onClick={() => handleSelectStaff(s)}
                    className="w-full p-3.5 text-left rounded-2xl bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-900/30 border border-slate-200 dark:border-slate-700 transition-all font-semibold text-slate-800 dark:text-slate-100 flex items-center justify-between"
                  >
                    <span>{s.name}</span>
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Select →</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setShowStaffSelect(false)} className="w-full mt-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
