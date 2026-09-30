import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where, doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase/config";
import { useAuthStore } from "../store";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Staff } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Globe, Lock, Mail, ArrowLeft, Sparkles, Moon, Sun, Eye, EyeOff } from "lucide-react";
import { useThemeStore } from "../store";
import { toggleAppLanguage } from "../utils/googleTranslate";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  }
}
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

export default function Login() {
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [recoveryMode, setRecoveryMode] = useState<"none" | "admin">("none");
  const [recoveryInputCompanyCode, setRecoveryInputCompanyCode] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryNewPassword, setRecoveryNewPassword] = useState("");
  const [showRecoveryPassword, setShowRecoveryPassword] = useState(false);
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState("");
  const [isRecovering, setIsRecovering] = useState(false);
  
  const { user, setUser } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [loginType, setLoginType] = useState<"admin" | "employee">("admin");
  const [employeeWorkspaceCode, setEmployeeWorkspaceCode] = useState("");
  const [employeePasscode, setEmployeePasscode] = useState("");
  const [showEmployeePasscode, setShowEmployeePasscode] = useState(false);
  const [matchingEmployees, setMatchingEmployees] = useState<Staff[]>([]);
  const [showEmployeeSelect, setShowEmployeeSelect] = useState(false);
  const [tempCompanyInfo, setTempCompanyInfo] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (user?.role === 'super_admin') {
      navigate('/system-admin');
    } else if (user?.role === 'admin') {
      navigate('/admin');
    } else if (user?.role === 'staff') {
      navigate('/employee');
    }
  }, [user, navigate]);

  const toggleLanguage = () => {
    toggleAppLanguage(i18n.language, i18n);
  };

  const handleEmployeeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeWorkspaceCode || !employeePasscode) {
      setError(t("enterFields") || "Please enter all fields");
      return;
    }
    setIsSubmitting(true);
    try {
      setError("");
      setShowEmployeeSelect(false);
      setMatchingEmployees([]);

      // 1. Find company setting by code, slug, or ID
      const searchStr = employeeWorkspaceCode.trim();
      const slugSearch = searchStr.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      let companySnaps = await getDocs(query(collection(db, "companies_settings"), where("slug", "==", slugSearch)));
      if (companySnaps.empty) {
        companySnaps = await getDocs(query(collection(db, "companies_settings"), where("slug", "==", searchStr.toLowerCase())));
      }
      if (companySnaps.empty) {
        companySnaps = await getDocs(query(collection(db, "companies_settings"), where("companyCode", "==", searchStr.toUpperCase())));
      }
      if (companySnaps.empty) {
        const directDoc = await getDoc(doc(db, "companies_settings", searchStr));
        if (directDoc.exists()) {
          companySnaps = { empty: false, docs: [directDoc] } as any;
        }
      }

      if (companySnaps.empty) {
        setError(t("invalidCompanyCode") || "Invalid Workspace Code or URL slug.");
        return;
      }

      const companyDoc = companySnaps.docs[0];
      const companyId = companyDoc.id;
      const companyName = companyDoc.data().companyName || "Workspace";

      // 2. Find employees with matching passcode within this company
      const staffQ = query(
        collection(db, "staff"),
        where("companyId", "==", companyId),
        where("passcode", "==", employeePasscode.trim())
      );
      let staffSnaps;
      try {
        staffSnaps = await getDocs(staffQ);
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, "staff");
        return;
      }
      if (staffSnaps.empty) {
        setError(t("invalidPasscode") || "Invalid passcode");
        return;
      }

      const foundStaff = staffSnaps.docs.map(d => ({ id: d.id, ...d.data() } as Staff))
        .filter(s => s.role !== "admin"); // filter out admins

      if (foundStaff.length === 0) {
        setError(t("invalidPasscode") || "Invalid passcode");
        return;
      }

      if (foundStaff.length === 1) {
        // Only one employee matched, log them in directly
        setUser(foundStaff[0], companyId, companyName);
        navigate("/employee");
      } else {
        // Multiple employees shared this passcode, let them select their name
        setMatchingEmployees(foundStaff);
        setTempCompanyInfo({ id: companyId, name: companyName });
        setShowEmployeeSelect(true);
      }
    } catch (err: any) {
      setError("Failed to login: " + (err.message || ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectEmployee = (selected: Staff) => {
    if (tempCompanyInfo) {
      setUser(selected, tempCompanyInfo.id, tempCompanyInfo.name);
      navigate("/employee");
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) {
      setError(t("enterFields") || "Please enter all fields");
      return;
    }
    setIsSubmitting(true);
    try {
      setError("");
      
      const emailLower = adminEmail.toLowerCase();
      const staffRef = collection(db, "staff");
      const q = query(staffRef, where("email", "==", emailLower), where("role", "in", ["admin", "super_admin"]));
      let querySnapshot;
      try {
        querySnapshot = await getDocs(q);
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, "staff");
        return;
      }
      
      let authenticatedAdmin = null;
      let companyId = null;
      
      for (const d of querySnapshot.docs) {
        const adminData = d.data();
        if (adminData.password === adminPassword) {
          authenticatedAdmin = { ...adminData, id: d.id } as Staff;
          companyId = adminData.companyId;
          break;
        }
      }
      
      if (!authenticatedAdmin) {
        setError(t("invalidEmailPassword") || "Invalid email or password");
        return;
      }
      
      let companyName = "Workspace";
      if (companyId) {
        try {
          const compRef = doc(db, "companies_settings", companyId);
          const compSnap = await getDoc(compRef);
          if (compSnap.exists() && compSnap.data().companyName) {
            companyName = compSnap.data().companyName;
          }
        } catch (e) {
          console.error("Could not fetch company settings for this admin", e);
        }
      }
      
      setUser(authenticatedAdmin, companyId, companyName);
      if (authenticatedAdmin.role === 'super_admin') {
        navigate("/system-admin");
      } else {
        navigate("/admin");
      }
    } catch (err: any) {
      setError("Failed to login: " + (err.message || ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setRecoverySuccessMsg("");
    if (!recoveryEmail || !recoveryInputCompanyCode || !recoveryNewPassword) {
      setError("Please fill all fields");
      return;
    }
    setIsRecovering(true);
    try {
      const recSearch = recoveryInputCompanyCode.trim();
      let compSnaps = await getDocs(query(collection(db, "companies_settings"), where("slug", "==", recSearch.toLowerCase().replace(/[^a-z0-9]/g, ''))));
      if (compSnaps.empty) {
        compSnaps = await getDocs(query(collection(db, "companies_settings"), where("companyCode", "==", recSearch.toUpperCase())));
      }
      if (compSnaps.empty) {
        const directDoc = await getDoc(doc(db, "companies_settings", recSearch));
        if (directDoc.exists()) {
          compSnaps = { empty: false, docs: [directDoc] } as any;
        }
      }
      if (compSnaps.empty) {
        setError("Invalid Workspace Code or Slug");
        return;
      }
      const companyId = compSnaps.docs[0].data().companyId;

      const emailLower = recoveryEmail.toLowerCase();
      const adminQ = query(collection(db, "staff"), where("email", "==", emailLower), where("companyId", "==", companyId), where("role", "==", "admin"));
      let adminSnaps;
      try {
        adminSnaps = await getDocs(adminQ);
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, "staff");
        return;
      }
      if (adminSnaps.empty) {
        setError("No administrator account found under this email inside specified workspace.");
        return;
      }

      const adminDocId = adminSnaps.docs[0].id;
      try {
        await updateDoc(doc(db, "staff", adminDocId), {
          password: recoveryNewPassword
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, "staff");
        return;
      }

      setRecoverySuccessMsg("Admin Password Reset Successful! You can now log in with your new credentials.");
      setTimeout(() => {
        setRecoveryMode("none");
        setRecoveryEmail("");
        setRecoveryInputCompanyCode("");
        setRecoveryNewPassword("");
        setRecoverySuccessMsg("");
      }, 3000);
    } catch (err: any) {
      setError("Failed to reset password: " + err.message);
    } finally {
      setIsRecovering(false);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as any, stiffness: 300, damping: 25 } },
    exit: { opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-8 sm:px-6 lg:px-8 text-slate-900 dark:text-slate-100 transition-colors relative overflow-hidden bg-slate-50/50 dark:bg-slate-950/50">
      <div className="absolute top-4 right-4 flex gap-3 z-50">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 dark:bg-slate-800 dark:hover:bg-slate-700 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 transition-all text-slate-800 dark:text-slate-200 shadow-lg shadow-black/5"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <Link to="/" className="p-2.5 rounded-full bg-white/40 hover:bg-white/60 dark:bg-slate-900/50 dark:hover:bg-slate-800 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 transition-all text-slate-800 dark:text-slate-200 shadow-lg shadow-black/5" title="Back home">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <button
          onClick={toggleLanguage}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 dark:bg-slate-800 dark:hover:bg-slate-700 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 transition-all text-slate-800 dark:text-slate-200 shadow-lg shadow-black/5"
          title="Toggle Language"
        >
          <Globe className="w-4 h-4" />
        </button>
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 flex flex-col justify-center items-center px-4 pt-16 sm:pt-0">
        <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-4 text-center text-2xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
          {tempCompanyInfo?.name || "Sign in"}
        </motion.h2>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white dark:bg-slate-900 py-6 px-4 sm:rounded-2xl sm:px-8 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none w-full">
          <AnimatePresence mode="wait">
            {recoveryMode === "admin" ? (
              <motion.div
                key="recover-admin"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 border border-amber-100 dark:border-amber-500/20 shadow-sm">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 font-display tracking-tight">
                    Admin Recovery
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-5">
                    Enter details to update your access safely.
                  </p>
                </div>
                <form onSubmit={handleAdminRecovery} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Workspace Code (e.g. C-1234)"
                      value={recoveryInputCompanyCode}
                      onChange={(e) => setRecoveryInputCompanyCode(e.target.value)}
                      className="block w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white uppercase font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all sm:text-sm"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      required
                      placeholder="Registered Email Address"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      className="block w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all sm:text-sm"
                    />
                  </div>
                  <div>
                    <div className="relative group">
                      <input
                        type={showRecoveryPassword ? "text" : "password"}
                        required
                        placeholder="Proposed New Password"
                        value={recoveryNewPassword}
                        onChange={(e) => setRecoveryNewPassword(e.target.value)}
                        className="block w-full pl-4 pr-10 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all sm:text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRecoveryPassword(!showRecoveryPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showRecoveryPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {error && (
                    <div className="bg-rose-50 dark:bg-rose-500/10 border-l-4 border-rose-500 p-3 rounded-r-lg mt-4 text-sm text-rose-700 dark:text-rose-400 font-medium">
                      {error}
                    </div>
                  )}
                  {recoverySuccessMsg && (
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 border-l-4 border-emerald-500 p-3 rounded-r-lg mt-4 text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                      {recoverySuccessMsg}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isRecovering}
                    className="w-full flex justify-center py-3 px-4 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors text-sm disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                  >
                    {isRecovering ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Reset Password"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRecoveryMode("none"); setError(""); }}
                    className="w-full text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors text-center pt-3"
                  >
                    Back to login
                  </button>
                </form>
              </motion.div>
            ) : showEmployeeSelect ? (
              <motion.div
                key="select-employee"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 font-display tracking-tight text-center">
                    {t("selectName") || "Select Your Name"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-5">
                    Multiple team members share this passcode. Please select yours:
                  </p>
                </div>

                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {matchingEmployees.map((emp, idx) => (
                    <button
                      key={`${emp.id}-${idx}`}
                      onClick={() => handleSelectEmployee(emp)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left font-medium group"
                    >
                      <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-sm overflow-hidden border border-white dark:border-slate-800 shadow-sm">
                        {emp.avatar ? (
                          <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                        ) : (
                          emp.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {emp.name}
                        </p>
                        {emp.nameKh && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {emp.nameKh}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowEmployeeSelect(false);
                    setEmployeePasscode("");
                  }}
                  className="w-full text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors text-center pt-6"
                >
                  {t("notYou") || "Not you? Go back"}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="login-container"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {/* Segmented control for Admin vs Employee */}
                <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg mb-6 border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => { setLoginType("admin"); setError(""); }}
                    className={`flex-1 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-all ${
                      loginType === "admin"
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {t("admin") || "Admin"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLoginType("employee"); setError(""); }}
                    className={`flex-1 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-all ${
                      loginType === "employee"
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {t("employee") || "Employee"}
                  </button>
                </div>

                {loginType === "admin" ? (
                  <div>
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3 border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                        <Lock className="w-4 h-4" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5 font-display tracking-tight text-center">
                        {t("adminLogin")}
                      </h3>
                    </div>

                    <form onSubmit={handleAdminLogin} className="space-y-4">
                      <div>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Mail className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                          </div>
                          <input
                            type="email"
                            required
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            className="block w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                            placeholder={t("adminEmail") || "Admin Email"}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                          </div>
                          <input
                            type={showAdminPassword ? "text" : "password"}
                            required
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            className="block w-full pl-10 pr-10 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                            placeholder={t("password") || "Password"}
                          />
                          <button
                            type="button"
                            onClick={() => setShowAdminPassword(!showAdminPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <div className="text-right mt-1.5">
                          <button
                            type="button"
                            onClick={() => { setRecoveryMode("admin"); setError(""); }}
                            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                          >
                            Forgot Password?
                          </button>
                        </div>
                      </div>
                      {error && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 bg-rose-50 dark:bg-rose-500/10 border-l-4 border-rose-500 p-3 rounded-r-lg text-sm text-rose-700 dark:text-rose-400 font-medium">
                          {error}
                        </motion.div>
                      )}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex justify-center py-2.5 px-4 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors text-sm disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Processing...</span>
                          </div>
                        ) : (
                          t("signInAsAdmin")
                        )}
                      </button>
                    </form>

                    <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-col items-center">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t("dontHaveWorkspaceYet") || "Don't have a workspace?"}</p>
                      <Link to="/signup" className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
                        {t("createNewWorkspace") || "Create new workspace"}
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                        <Globe className="w-4 h-4 animate-pulse" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5 font-display tracking-tight text-center">
                        {t("employeeCheckIn") || "Employee Portal"}
                      </h3>
                    </div>

                    <form onSubmit={handleEmployeeLogin} className="space-y-4">
                      <div>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Globe className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                          </div>
                          <input
                            type="text"
                            required
                            value={employeeWorkspaceCode}
                            onChange={(e) => setEmployeeWorkspaceCode(e.target.value)}
                            className="block w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm uppercase placeholder:normal-case"
                            placeholder={t("workspaceCode") || "Workspace Code (e.g. C-1234)"}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                          </div>
                          <input
                            type={showEmployeePasscode ? "text" : "password"}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            required
                            value={employeePasscode}
                            onChange={(e) => setEmployeePasscode(e.target.value.replace(/\D/g, ""))}
                            className="block w-full pl-10 pr-10 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium tracking-widest text-center text-lg placeholder:text-sm placeholder:tracking-normal placeholder:text-left"
                            placeholder={t("enterPasscode") || "Enter 4-digit passcode"}
                          />
                          <button
                            type="button"
                            onClick={() => setShowEmployeePasscode(!showEmployeePasscode)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            {showEmployeePasscode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      {error && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 bg-rose-50 dark:bg-rose-500/10 border-l-4 border-rose-500 p-3 rounded-r-lg text-sm text-rose-700 dark:text-rose-400 font-medium">
                          {error}
                        </motion.div>
                      )}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex justify-center py-2.5 px-4 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors text-sm disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Processing...</span>
                          </div>
                        ) : (
                          t("enterWorkspace") || "Access Employee Dashboard"
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

