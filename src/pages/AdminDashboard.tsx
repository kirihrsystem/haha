import React, { useState, useEffect, useRef } from 'react';
import ScrollLock from '../components/ScrollLock';
import { createPortal } from "react-dom";
import { useAuthStore, useSettingsStore, useThemeStore } from "../store";
import {
  collection,
  query,
  getDocs,
  onSnapshot,
  addDoc,
  updateDoc,
  setDoc,
  doc,
  getDoc,
  deleteDoc,
  where,
  orderBy,
} from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { sendPushNotification } from "../utils/push";
import { sendTelegramNotification, sendDirectTelegramMessage, formatTelegramCurrency } from "../utils/telegramUtils";
import { Staff, Settings } from "../types";
import { useTranslation } from "react-i18next";
import LocationPicker from "../components/LocationPicker";
import i18n from "../i18n";
import { toggleAppLanguage } from "../utils/googleTranslate";
import NotificationCenter from "../components/NotificationCenter";
import {
  calculateShiftStatus,
  calculateOvertimePay,
  getExpectedShiftDuration,
  getConfiguredShiftTimes,
  calculateShiftHours,
  getCalculatedHourlyRate,
  hasShiftEnded,
} from "../utils/shiftUtils";
import { compressImage } from "../utils/imageUtils";
import { getDaysInMonth, parseISO, format } from "date-fns";

import {
  Users,
  Settings as SettingsIcon,
  DollarSign,
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Search,
  Copy,
  Printer,
  Activity,
  ListTodo,
  BarChart3,
  MapPin,
  Info,
  UserX,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  CalendarDays,
  Clock,
  LayoutGrid,
  List,
  ChevronRight,
  ChevronLeft,
  Menu,
  Globe,
  Building2,
  ExternalLink,
  Layers,
  Camera,
  User as UserIcon,
  LogOut,
  Sun,
  Moon,
  Zap
} from "lucide-react";
import { cn, formatCurrency, formatHours } from "../lib/utils";
import { AnimatePresence, motion } from "motion/react";
import QRCode from "react-qr-code";

import QRPrintCard from "../components/QRPrintCard";
import { AdminTelegramConnectWidget } from "../components/AdminTelegramConnectWidget";
import LiveAttendanceDashboard from "../components/LiveAttendanceDashboard";
import MasterShiftPlanner from "../components/MasterShiftPlanner";
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import PayrollReceiptPDF from "../components/PayrollReceiptPDF";
import MonthlyPayrollReportPDF from "../components/MonthlyPayrollReportPDF";
import EmployeePerformanceAnalytics from "../components/EmployeePerformanceAnalytics";
import RevenueTracker from "../components/RevenueTracker";
import AdminAccountManager from "../components/AdminAccountManager";
import OfficeLocationSetupModal from "../components/OfficeLocationSetupModal";
import { ShieldCheck, CreditCard, AlertTriangle, Sparkles, ArrowLeft } from "lucide-react";
import SubscriptionManager from '../components/SubscriptionManager';
import { isPayrollFieldVisible } from "../utils/payrollVisibility";
import { PayrollVisibilitySettings } from "../components/PayrollVisibilitySettings";
import ImagePreviewModal from "../components/ImagePreviewModal";
import { useNavigate } from "react-router-dom";

const TabButton = ({
  active,
  onClick,
  icon: Icon,
  label,
  id,
  disabled
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
  id?: string;
  disabled?: boolean;
}) => (
  <button
    id={id}
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "group relative flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full transition-all duration-300 text-[13px] sm:text-sm font-semibold whitespace-nowrap outline-none flex-shrink-0 border border-transparent",
      active
        ? "text-slate-900 dark:text-white bg-white dark:bg-slate-800 shadow-[0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)] border-slate-200/50 dark:border-slate-700/50 scale-[1.02]"
        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50",
      disabled && "opacity-50 cursor-not-allowed pointer-events-none"
    )}
  >
    <Icon className={cn("w-4 h-4 transition-colors", active ? "text-indigo-500 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500")} />
    <span>{label}</span>
  </button>
);

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "shifts" | "staff" | "settings" | "payroll" | "leaves" | "sales" | "analytics" | "admins" | "subscription"
  >("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");

  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const { settings } = useSettingsStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const [hasEnteredWorkspace, setHasEnteredWorkspace] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSmoothRefresh = () => {
    setIsRefreshing(true);
    // Simulate a brief refresh state and let React re-render
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const [isNewWorkspaceOnboarding, setIsNewWorkspaceOnboarding] = useState<boolean>(() => {
    return Boolean(settings && settings.companyId && !settings.subscription);
  });

  useEffect(() => {
    if (settings && settings.companyId) {
      if (!settings.subscription && !hasEnteredWorkspace) {
        setIsNewWorkspaceOnboarding(true);
      } else if (settings.subscription) {
        setIsNewWorkspaceOnboarding(false);
      }
    }
  }, [settings?.subscription, settings?.companyId, hasEnteredWorkspace]);

  const isNewWorkspace = isNewWorkspaceOnboarding && !hasEnteredWorkspace;
  const isExpired = Boolean(
    settings && settings.companyId && (
      !settings.subscription ||
      settings.subscription.status === 'pending' || 
      settings.subscription.status === 'expired' || 
      (settings.subscription.expiresAt && new Date(settings.subscription.expiresAt).getTime() < Date.now())
    )
  );

  useEffect(() => {
    if (isExpired && activeTab !== "subscription") {
      setActiveTab("subscription");
    }
  }, [isExpired, activeTab]);

  useEffect(() => {
    // Scroll to top when tab changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  useEffect(() => {
    if (isExpired && user?.companyId && settings) {
      const now = new Date();
      const lastAlert = (settings as any).lastSubscriptionAlert;
      if (!lastAlert || new Date(lastAlert).getTime() < now.getTime() - 24 * 60 * 60 * 1000) {
        if (settings.telegramAdminChatId) {
          sendDirectTelegramMessage(
            settings.telegramAdminChatId,
            `⚠️ <b>Subscription Expired/Pending</b>\n\nYour Workspace subscription has expired or is pending review. The system is currently locked for employees.\n\nPlease go to the Subscription settings in the app to renew.`
          ).then(() => {
            updateDoc(doc(db, "companies_settings", user.companyId), {
              lastSubscriptionAlert: now.toISOString()
            }).catch(console.error);
          });
        }
      }
    }
  }, [isExpired, user, settings]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  const [confirmDialog, setConfirmDialog] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [dismissedLock, setDismissedLock] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const { setUser } = useAuthStore();

  const getSubscriptionLabel = (sub: any) => {
    if (!sub || sub.status !== 'active') return 'Workspace Ready';
    
    if (sub.usedCode) {
      const code = String(sub.usedCode).toUpperCase();
      if (code.includes('INVITE') || code.startsWith('INV-') || code.includes('STAFF')) {
        return 'Invite Code';
      }
      if (code.includes('FREE') || sub.lastPaymentHash?.includes('FREE_COUPON') || code.includes('COUPON')) {
        return 'Free Coupon';
      }
      return 'Promo Code';
    }

    if (sub.type === 'yearly' || sub.type?.endsWith('_yearly')) return 'Yearly Plan';
    if (sub.type === 'monthly' || sub.type?.endsWith('_monthly')) return 'Monthly Plan';
    if (sub.type === 'unlimited') return 'Free Coupon';

    return 'Monthly Plan';
  };

  const handleAdminPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Image is too large. Please select a photo under 10MB.");
      return;
    }
    try {
      setIsUploadingPhoto(true);
      const compressed = await compressImage(file, 400, 400, 0.8);
      if (user) {
        const updated = { ...user, profilePictureUrl: compressed, avatar: compressed };
        setUser(updated);

        if (user.id) {
          await setDoc(doc(db, "staff", user.id), {
            profilePictureUrl: compressed,
            avatar: compressed
          }, { merge: true });
        }
      }
    } catch (err) {
      console.error("Error uploading admin photo", err);
      alert("Failed to process profile picture.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const requestConfirm = (message: string, onConfirm: () => void) => {
    setConfirmDialog({ message, onConfirm });
  };

  const navSections = [
    {
      category: t("menu") || "Overview & Operations",
      items: [
        {
          id: "dashboard",
          tourId: "tour-dashboard",
          icon: Activity,
          label: t("liveDashboard") || "Live Dashboard",
          badge: "Live",
          badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
        },
        {
          id: "shifts",
          tourId: "tour-shifts",
          icon: ListTodo,
          label: t("shiftPlanner") || "Shift Planner"
        },
        {
          id: "staff",
          tourId: "tour-staff",
          icon: Users,
          label: t("staff") || "Staff Members"
        }
      ]
    },
    {
      category: t("reportsAndFinance") || "Finance & Reports",
      items: [
        {
          id: "payroll",
          tourId: "tour-payroll",
          icon: DollarSign,
          label: t("payroll") || "Payroll"
        },
        {
          id: "analytics",
          tourId: "tour-analytics",
          icon: BarChart3,
          label: t("analytics") || "Analytics"
        },
        {
          id: "revenue",
          tourId: "tour-revenue",
          icon: Activity,
          label: t("Income & Expenses") || "Income And Expenses"
        },
        {
          id: "leaves",
          tourId: "tour-leaves",
          icon: Calendar,
          label: t("requestLeave") || "Leave Requests"
        }
      ]
    },
    {
      category: t("management") || "Administration",
      items: [
        {
          id: "settings",
          tourId: "tour-settings",
          icon: SettingsIcon,
          label: t("settings") || "Settings"
        },
        {
          id: "admins",
          tourId: "tour-admins",
          icon: ShieldCheck,
          label: t("admins") || "Admins & Managers"
        },
        {
          id: "subscription",
          tourId: "tour-subscription",
          icon: CreditCard,
          label: "Subscription",
          badge: settings?.subscription?.status === 'active' ? getSubscriptionLabel(settings?.subscription) : undefined,
          badgeColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
        }
      ]
    }
  ];

  const activeItem = navSections.flatMap(s => s.items).find(i => i.id === activeTab);

  const renderSidebarContent = (isMobile = false) => {
    const filteredSections = navSections.map(section => ({
      ...section,
      items: section.items.filter(item => 
        item.label.toLowerCase().includes(sidebarSearch.toLowerCase())
      )
    })).filter(section => section.items.length > 0);

    return (
      <div className="flex flex-col h-full select-none bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
        {/* Workspace Brand Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 shrink-0 flex items-center justify-center overflow-visible">
              <img src={settings?.logoUrl || "/logo.png"} alt="Logo" className="w-full h-full object-contain rounded-xl" />
            </div>
            {(!isSidebarCollapsed || isMobile) && (
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">
                  {settings?.companyName || "Kiri HR"}
                </h2>
                <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                  Admin Workspace
                </p>
              </div>
            )}
          </div>

          {!isMobile && (
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors hidden lg:flex shrink-0 ml-1"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}

          {isMobile && (
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Sidebar Search Filter Input */}
        {(!isSidebarCollapsed || isMobile) && (
          <div className="px-4 pt-3 pb-1">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                placeholder="Search menu..."
                className="w-full pl-8 pr-7 py-2 bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
              />
              {sidebarSearch && (
                <button 
                  onClick={() => setSidebarSearch('')} 
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Menu Categories */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-none">
          {filteredSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {(!isSidebarCollapsed || isMobile) && (
                <h3 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-1.5">
                  {section.category}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const isDisabled = isExpired && item.id !== "subscription";

                  return (
                    <button
                      key={item.id}
                      id={item.tourId}
                      disabled={isDisabled}
                      onClick={() => {
                        setActiveTab(item.id as any);
                        if (isMobile) setIsMobileSidebarOpen(false);
                      }}
                      title={isSidebarCollapsed && !isMobile ? item.label : undefined}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 relative group",
                        isActive
                          ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/25 font-bold scale-[1.01]"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-indigo-50/60 dark:hover:bg-slate-800/60",
                        isDisabled && "opacity-40 cursor-not-allowed pointer-events-none",
                        isSidebarCollapsed && !isMobile && "justify-center px-0"
                      )}
                    >
                      <div className={cn(
                        "p-1.5 rounded-xl transition-colors shrink-0",
                        isActive
                          ? "bg-white/20 text-white"
                          : "text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>

                      {(!isSidebarCollapsed || isMobile) && (
                        <div className="flex-1 flex items-center justify-between min-w-0 text-left">
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 border ml-2",
                              isActive 
                                ? "bg-white/20 text-white border-white/30"
                                : item.badgeColor || "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
                            )}>
                              {item.badge}
                            </span>
                          )}
                          {isActive && !item.badge && (
                            <ChevronRight className="w-3.5 h-3.5 opacity-80 shrink-0 ml-1" />
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer User / Plan Status Card */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 shrink-0">
          <input
            type="file"
            ref={photoInputRef}
            onChange={handleAdminPhotoUpload}
            accept="image/*"
            className="hidden"
          />

          {(!isSidebarCollapsed || isMobile) ? (
            <div className="p-3 rounded-xl bg-gradient-to-br from-slate-50 to-indigo-50/40 dark:from-slate-800/40 dark:to-indigo-950/20 border border-slate-200/60 dark:border-slate-800/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                    {getSubscriptionLabel(settings?.subscription)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    const slug = settings?.slug || useAuthStore.getState().companySlug || 'workspace';
                    window.open(`/${slug}`, '_blank');
                  }}
                  className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0"
                  title="Open Workspace Portal"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center gap-3">
                <div className="relative group/avatar shrink-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-500 p-0.5 shadow-xs">
                    {user?.profilePictureUrl || user?.avatar ? (
                      <img
                        src={user.profilePictureUrl || user.avatar}
                        alt={user.name || "Admin Profile"}
                        className="w-full h-full object-cover rounded-[10px]"
                      />
                    ) : (
                      <div className="w-full h-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center rounded-[10px]">
                        {(user?.name?.[0] || 'A').toUpperCase()}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-white p-1"
                    title="Change Profile Photo"
                  >
                    {isUploadingPhoto ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {user?.name || 'Administrator'}
                    </span>
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold shrink-0"
                    >
                      Photo
                    </button>
                  </div>
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                    {user?.email || "Admin Workspace"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-1">
              <button
                onClick={() => photoInputRef.current?.click()}
                className="relative group/avatar cursor-pointer"
                title={`${user?.name || 'Admin'} - Click to change photo`}
              >
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs shadow-xs p-0.5">
                  {user?.profilePictureUrl || user?.avatar ? (
                    <img src={user.profilePictureUrl || user.avatar} alt="Admin" className="w-full h-full object-cover rounded-[10px]" />
                  ) : (
                    (user?.name?.[0] || 'A').toUpperCase()
                  )}
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-white">
                  <Camera className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };


  const clearCollection = async (collectionName: string) => {
    try {
      const q = query(collection(db, collectionName));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return true;
      }

      const docs = querySnapshot.docs;
      const batchSize = 100;

      for (let i = 0; i < docs.length; i += batchSize) {
        const chunk = docs.slice(i, i + batchSize);
        await Promise.all(
          chunk.map(async (d) => {
            try {
              await deleteDoc(doc(db, collectionName, d.id));
            } catch (e) {
              console.error(
                `Error deleting doc ${d.id} from ${collectionName}:`,
                e,
              );
            }
          }),
        );
      }

      return true;
    } catch (error) {
      console.error(`Detailed error clearing ${collectionName}:`, error);
      alert(
        `${t("errorSaving")}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  };

  const handleClearCategory = async (category: string) => {
    requestConfirm(t("confirmClear"), async () => {
      let collections: string[] = [];
      if (category === "staff") collections = ["staff"];
      if (category === "payroll") collections = ["logs", "bonuses"];
      if (category === "permissions") collections = ["permissions"];
      if (category === "sales") collections = ["logs"];

      for (const coll of collections) {
        await clearCollection(coll);
      }
      window.location.reload();
    });
  };

  const handleResetAll = async () => {
    requestConfirm(t("confirmResetAll"), async () => {
      const collections = ["staff", "logs", "bonuses", "permissions"];
      for (const coll of collections) {
        await clearCollection(coll);
      }
      window.location.reload();
    });
  };

  const deleteDocument = async (
    coll: string,
    id: string,
    onUpdate?: () => void,
  ) => {
    // For single item deletions we can skip explicit confirm if the children components already have one,
    // but the safest approach is to use the requestConfirm if needed.
    // However since StaffManager already asks for confirm, we will just delete here.
    // Wait, Leaves/Payroll/DailySales might not ask. We will rely on them asking explicitly if needed.
    // Actually, StaffManager has its own confirm modal, but Payroll/Sales rely on this confirm.
    // I will use requestConfirm here.
    requestConfirm(t("deleteConfirm"), async () => {
      try {
        await deleteDoc(doc(db, coll, id));
        if (onUpdate) onUpdate();
      } catch (error) {
        alert(
          `Error deleting: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    });
  };

  if (!settings) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-indigo-500/20 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isNewWorkspace) {
    return (
      <div className="relative min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden z-[50]">
        {/* Top Navigation */}
        <div className="absolute top-4 sm:top-8 left-4 sm:left-8 z-20">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
          
          {/* Glowing orbs */}
          <div className="absolute top-0 right-[15%] w-[40vw] h-[40vw] rounded-full bg-indigo-400/20 dark:bg-indigo-600/20 blur-[100px] transform -translate-y-1/2 mix-blend-multiply dark:mix-blend-screen" />
          <div className="absolute bottom-0 left-[15%] w-[50vw] h-[50vw] rounded-full bg-purple-400/20 dark:bg-purple-600/20 blur-[120px] transform translate-y-1/3 mix-blend-multiply dark:mix-blend-screen" />
        </div>

        <div className="w-full max-w-6xl mx-auto relative z-10 animate-in slide-in-from-bottom-8 fade-in duration-700 ease-out pt-12 pb-24">
          <div className="text-center mb-12 max-w-2xl mx-auto space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              Welcome to your Workspace
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl mx-auto">
              Before you can access the platform and invite your team, please select a subscription plan, enter a coupon code, or use an invite code.
            </p>
          </div>
          
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6 sm:p-10">
            <SubscriptionManager 
              isNewWorkspace={true} 
              onWorkspaceEntered={() => {
                setHasEnteredWorkspace(true);
                setIsNewWorkspaceOnboarding(false);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-sm print:space-y-0 w-full min-h-screen bg-slate-50/60 dark:bg-slate-950/60">
      {isExpired && !dismissedLock && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-rose-600 dark:text-rose-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Subscription Expired</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              Your Workspace subscription has expired or is pending review. Please renew your plan to continue using the platform. Employees can only clock in and out until the subscription is active.
            </p>
            <button
              onClick={() => {
                setDismissedLock(true);
                setActiveTab("subscription");
              }}
              className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98]"
            >
              Renew Subscription Now
            </button>
          </div>
        </div>
      )}

      {/* Mobile Slide-over Sidebar Drawer */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-[120] lg:hidden flex">
            <ScrollLock />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-[75vw] sm:w-80 bg-white dark:bg-slate-900 h-full shadow-2xl border-r border-slate-200 dark:border-slate-800 z-10 flex flex-col"
            >
              {renderSidebarContent(true)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Container: Sidebar + Active Content Area */}
      <div className="flex flex-col lg:flex-row min-h-screen items-stretch w-full">
        {/* Desktop Left Vertical Sidebar (Sticky in place) */}
        <aside className={cn(
          "hidden lg:flex flex-col shrink-0 sticky top-0 h-screen transition-all duration-300 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80 print:hidden z-30 shadow-xs",
          isSidebarCollapsed ? "w-20" : "w-64 xl:w-72"
        )}>
          {renderSidebarContent(false)}
        </aside>

        {/* Main Workspace Pane: Top Unified Header Bar (Mobile, Tablet & Desktop) + Active Views */}
        <main className="flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300">
          {/* Top Universal Workspace Header Bar */}
          <header className="flex items-center justify-between h-16 px-3 sm:px-6 lg:px-8 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-40 w-full shrink-0">
            {/* Left: Mobile Menu Toggle + Breadcrumb / Active View Title */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-2 text-slate-700 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 rounded-xl transition-colors border border-slate-200/60 dark:border-slate-700/60 shrink-0"
                title="Open Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shadow-xs shrink-0">
                {activeItem?.icon ? <activeItem.icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> : <Activity className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
              </div>

              <div className="min-w-0">
                <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
                  <span>Workspace</span>
                  <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[120px] md:max-w-[180px]">{settings?.companyName || "Kiri HR"}</span>
                </div>
                <h1 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">
                  {activeItem?.label || "Admin Portal"}
                </h1>
                <span className="sm:hidden text-[10px] text-slate-400 dark:text-slate-500 truncate block">
                  {settings?.companyName || "Kiri HR"}
                </span>
              </div>
            </div>

            {/* Right Desktop & Mobile Quick Actions & Profile Control */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* Subscription Status Pill */}
              <button
                onClick={() => setActiveTab("subscription")}
                className="hidden sm:flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700/60 transition-all cursor-pointer"
                title="Manage Subscription"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[100px] md:max-w-none">
                  {getSubscriptionLabel(settings?.subscription)}
                </span>
                <span className="hidden md:inline-block text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-extrabold px-1.5 py-0.5 rounded-full border border-indigo-500/20">
                  Active
                </span>
              </button>

              <div className="hidden sm:block w-[1px] h-5 bg-slate-200 dark:bg-slate-800" />

              {/* Utility Tools: Notification, Refresh, Theme, Language */}
              <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100/70 dark:bg-slate-800/60 p-1 rounded-full border border-slate-200/50 dark:border-slate-700/50">
                <NotificationCenter />
                <button
                  onClick={handleSmoothRefresh}
                  className="p-1.5 rounded-full text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 shadow-xs transition-all"
                  title="Refresh Dashboard"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", isRefreshing && "animate-spin text-indigo-500")} />
                </button>
                <button
                  onClick={toggleTheme}
                  className="p-1.5 rounded-full text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 shadow-xs transition-all"
                  title="Toggle Light/Dark Theme"
                >
                  {theme === 'dark' ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>
                <button
                  onClick={() => toggleAppLanguage(i18n.language, i18n)}
                  className="p-1.5 rounded-full text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 shadow-xs transition-all"
                  title="Toggle Language"
                >
                  <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>

              <div className="hidden sm:block w-[1px] h-5 bg-slate-200 dark:bg-slate-800" />

              {/* Admin Profile Picture Upload Control */}
              <div className="flex items-center gap-2 pl-1 pr-1.5 sm:pr-3 py-1 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-full shadow-xs">
                <div className="relative group/headAvatar cursor-pointer">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 shadow-xs">
                    {user?.profilePictureUrl || user?.avatar ? (
                      <img src={user.profilePictureUrl || user.avatar} alt="Admin Profile" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <div className="w-full h-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center rounded-full">
                        {(user?.name?.[0] || 'A').toUpperCase()}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover/headAvatar:opacity-100 transition-opacity rounded-full flex items-center justify-center text-white"
                    title="Upload / Change Admin Photo"
                  >
                    <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[110px]">
                    {user?.name || "Administrator"}
                  </span>
                  <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                    Admin
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
            </div>
          </header>

          {/* Active Workspace View Content */}
          <div className={cn("flex-1 p-4 sm:p-6 lg:p-8 transition-all duration-300", isRefreshing ? "opacity-40 blur-[2px] pointer-events-none scale-[0.99]" : "opacity-100 blur-0 scale-100")}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.99 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="w-full h-full min-h-[600px] print:hidden"
              >
                {activeTab === "dashboard" && <LiveAttendanceDashboard />}
                {activeTab === "subscription" && <SubscriptionManager />}
                {activeTab === "shifts" && <MasterShiftPlanner />}
                {activeTab === "staff" && (
                  <StaffManager
                    onClearCategory={handleClearCategory}
                    onDelete={(id, cb) => deleteDocument("staff", id, cb)}
                  />
                )}
                {activeTab === "settings" && (
                  <SettingsManager
                    onClearCategory={handleClearCategory}
                    onResetAll={handleResetAll}
                  />
                )}
                {activeTab === "admins" && <AdminAccountManager />}
                {activeTab === "analytics" && <EmployeePerformanceAnalytics />}
                {(activeTab as string) === "revenue" && <RevenueTracker />}
                {activeTab === "payroll" && (
                  <PayrollManager
                    onClearCategory={handleClearCategory}
                    onDelete={(coll, id, cb) => deleteDocument(coll, id, cb)}
                    requestConfirm={requestConfirm}
                  />
                )}
                {activeTab === "leaves" && (
                  <LeavesManager
                    onClearCategory={handleClearCategory}
                    onDelete={(id, cb) => deleteDocument("permissions", id, cb)}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {confirmDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <ScrollLock />
          <div className="bg-white dark:bg-slate-900 sm:border border-slate-200 dark:border-slate-800 sm:rounded-xl shadow-2xl max-w-md w-full relative flex flex-col p-6 sm:p-8">
            <h3 className="text-xl font-bold mb-4">
              {t("confirmAction") || "Confirm"}
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              {confirmDialog.message}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
              >
                {t("cancel") || "Cancel"}
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="px-4 py-2 rounded-lg font-semibold bg-red-500 text-white hover:bg-red-600 transition shadow-lg shadow-black/5"
              >
                {t("confirm") || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
      <OfficeLocationSetupModal />
    </div>
  );
}

function PayrollManager(props: any) {
  const { onClearCategory, onDelete, requestConfirm } = props;
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [bonuses, setBonuses] = useState<any[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() =>
    new Date().toISOString().slice(0, 7),
  ); // YYYY-MM
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [expandedProfileEmployee, setExpandedProfileEmployee] = useState<string | null>(null);
  const [expandedDailyLogsEmployee, setExpandedDailyLogsEmployee] = useState<string | null>(null);
  const [editingLog, setEditingLog] = useState<any | null>(null);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedStaffForBonus, setSelectedStaffForBonus] =
    useState<Staff | null>(null);
  const [bonusAmount, setBonusAmount] = useState("");
  const [bonusNote, setBonusNote] = useState("");
  const [deductionAmount, setDeductionAmount] = useState("");
  const [deductionNote, setDeductionNote] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [fullQrUrl, setFullQrUrl] = useState<string | null>(null);

  const pdfRef = React.useRef<HTMLDivElement>(null);
  const [pdfSummaryData, setPdfSummaryData] = useState<any>(null);

  const monthlyPdfRef = React.useRef<HTMLDivElement>(null);
  const [isGeneratingMonthlyPdf, setIsGeneratingMonthlyPdf] = useState(false);
  const [pdfConfigModalType, setPdfConfigModalType] = useState<'monthly' | 'individual' | null>(null);
  const [preparerName, setPreparerName] = useState("");
  const [ceoName, setCeoName] = useState("");

  const { settings } = useSettingsStore();
  const { t } = useTranslation();

  // Set default preparer name when user is loaded
  React.useEffect(() => {
    if (user?.name && !preparerName) {
      setPreparerName(user.name);
    }
  }, [user]);

  const generateMonthlyReportPDF = async () => {
    setPdfConfigModalType(null);
    setIsGeneratingMonthlyPdf(true);
    // Ensure all fonts are fully loaded before rendering
    await document.fonts.ready;
    // Give react time to render the hidden pdf component
    setTimeout(async () => {
      if (!monthlyPdfRef.current) {
        setIsGeneratingMonthlyPdf(false);
        return;
      }
      const el = monthlyPdfRef.current;
      const prevDisplay = el.style.display;
      el.style.display = 'block';

      try {
        const width = 1600;
        const height = el.scrollHeight || el.offsetHeight || 1131;
        const dataUrl = await toPng(el, {
          quality: 1,
          pixelRatio: 3,
          backgroundColor: '#ffffff',
          width: width,
          height: height,
          style: { transform: 'scale(1)', transformOrigin: 'top left' }
        });

        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [width, height]
        });

        pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
        pdf.save(`Monthly_Payroll_Report_${selectedMonth}.pdf`);
      } catch (error) {
        console.error("Failed to generate monthly PDF", error);
      } finally {
        el.style.display = prevDisplay;
        setIsGeneratingMonthlyPdf(false);
      }
    }, 150);
  };

  const handleDownloadPDF = async (summary: any) => {
    setPdfSummaryData(summary);
    setPdfConfigModalType('individual');
  };

  const executeDownloadPDF = async () => {
    setPdfConfigModalType(null);
    // Give react time to render the hidden pdf component
    setTimeout(async () => {
      if (!pdfRef.current || !pdfSummaryData) return;
      const el = pdfRef.current;
      const prevDisplay = el.style.display;
      el.style.display = 'block';
      
      try {
        const dataUrl = await toPng(el, { 
          quality: 1, 
          pixelRatio: 3,
          backgroundColor: '#ffffff',
          width: 794,
          height: 559,
          style: { transform: 'scale(1)', transformOrigin: 'top left' } 
        });
        
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [794, 559]
        });
        
        pdf.addImage(dataUrl, 'PNG', 0, 0, 794, 559);
        pdf.save(`Payroll_${selectedMonth}_${pdfSummaryData.employee.name}.pdf`);
      } catch (error) {
        console.error("Failed to generate PDF", error);
      } finally {
        el.style.display = prevDisplay;
        setPdfSummaryData(null);
      }
    }, 100);
  };

  const handleUpdatePayrollStatus = async (summary: any, newStatus: string) => {
    try {
      const existingBonus = bonuses.find(
        (b) => b.staffId === summary.employee.id
      );

      if (existingBonus) {
        await updateDoc(doc(db, "bonuses", existingBonus.id), {
          payrollStatus: newStatus,
        });
      } else {
        await addDoc(collection(db, "bonuses"), {
          companyId: user?.companyId,
          staffId: summary.employee.id,
          month: selectedMonth,
          amount: 0,
          note: "",
          deductionAmount: 0,
          deductionNote: "",
          payrollStatus: newStatus,
        });
      }

      if (newStatus === "pending_review") {
        await sendPushNotification(summary.employee.id, "staff", user?.companyId || "", "Payroll Ready for Review", `Your payroll for ${selectedMonth} is ready for review. Please check and confirm.`);
        await addDoc(collection(db, "notifications"), {
          companyId: user?.companyId || "",
          userId: summary.employee.id,
          role: "staff",
          type: "payroll",
          title: "Payroll Ready for Review",
          message: `Your payroll for ${selectedMonth} is ready for review. Please check and confirm.`,
          read: false,
          createdAt: new Date().toISOString(),
        });
        const empName = summary.employee.nameKh || summary.employee.name;
        await sendTelegramNotification(
          `💼 <b>បញ្ជូនរបាយការណ៍បៀវត្សសម្រាប់ពិនិត្យ (Payroll Sent for Review)</b>\n<b>បុគ្គលិក:</b> ${empName}\n<b>ខែ:</b> ${selectedMonth}\n<b>ប្រាក់ខែសរុប:</b> ${formatTelegramCurrency(summary.finalSalary)}`,
          true
        );
        if (summary.employee.telegramChatId) {
          await sendDirectTelegramMessage(
            summary.employee.telegramChatId,
            `💼 <b>របាយការណ៍បៀវត្សសម្រាប់ពិនិត្យ (Payroll Ready for Review)</b>\n<b>ខែ:</b> ${selectedMonth}\n<b>ប្រាក់ខែសរុប:</b> ${formatTelegramCurrency(summary.finalSalary)}\n\nសូមចូលទៅកាន់ប្រព័ន្ធដើម្បីពិនិត្យ និងទទួលស្គាល់ (Please log in to your app to review and confirm).`
          );
        }
      }
      
      if (newStatus === "confirmed") {
        const empName = summary.employee.nameKh || summary.employee.name;
        await sendTelegramNotification(
          `✅ <b>ទទួលស្គាល់របាយការណ៍បៀវត្ស (Payroll Confirmed)</b>\n<b>បុគ្គលិក:</b> ${empName}\n<b>ខែ:</b> ${selectedMonth}\n<b>ប្រាក់ខែសរុប:</b> ${formatTelegramCurrency(summary.finalSalary)}`,
          true
        );
        if (summary.employee.telegramChatId) {
          await sendDirectTelegramMessage(
            summary.employee.telegramChatId,
            `✅ <b>ទទួលស្គាល់របាយការណ៍បៀវត្ស (Payroll Confirmed by HR)</b>\n<b>ខែ:</b> ${selectedMonth}\n<b>ប្រាក់ខែសរុប:</b> ${formatTelegramCurrency(summary.finalSalary)}\n\nរបាយការណ៍បៀវត្សរបស់អ្នកត្រូវបានទទួលស្គាល់ដោយរដ្ឋបាល HR។ (Your payroll report has been confirmed by HR).`
          );
        }
      }

      if (newStatus === "paid") {
         await sendPushNotification(summary.employee.id, "staff", user?.companyId || "", "Payroll Paid", `Your payroll for ${selectedMonth} has been marked as paid by HR.`);
         await addDoc(collection(db, "notifications"), {
          companyId: user?.companyId || "",
          userId: summary.employee.id,
          role: "staff",
          type: "payroll",
          title: "Payroll Paid",
          message: `Your payroll for ${selectedMonth} has been marked as paid by HR.`,
          read: false,
          createdAt: new Date().toISOString(),
        });
        const empName = summary.employee.nameKh || summary.employee.name;
        await sendTelegramNotification(
          `💰 <b>ទូទាត់ប្រាក់ខែរួចរាល់ (Payroll Marked as Paid)</b>\n<b>បុគ្គលិក:</b> ${empName}\n<b>ខែ:</b> ${selectedMonth}\n<b>ប្រាក់ទូទាត់សរុប:</b> ${formatTelegramCurrency(summary.finalSalary)}`,
          true
        );
        if (summary.employee.telegramChatId) {
          await sendDirectTelegramMessage(
            summary.employee.telegramChatId,
            `💰 <b>ប្រាក់ខែត្រូវបានទូទាត់រួចរាល់! (Payroll Marked as Paid!)</b>\n<b>ខែ:</b> ${selectedMonth}\n<b>ប្រាក់ទូទាត់សរុប:</b> ${formatTelegramCurrency(summary.finalSalary)}\n\nសូមពិនិត្យគណនីធនាគាររបស់អ្នក។ (Please check your bank account).`
          );
        }
      }
      
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Failed to update status");
    }
  };

  const handleUpdateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;

    // Calculate new amounts
    const tInDate = new Date(editingLog.timeIn);
    const tOutDate = new Date(editingLog.timeOut);
    const durationHours = Math.max(
      0,
      (tOutDate.getTime() - tInDate.getTime()) / (1000 * 60 * 60),
    );

    const staffDoc = staff.find((s) => s.id === editingLog.staffId);
    let dailySalary = 0;
    let lateDeductionAmount = 0;

    let lateCheckIn = false;
    let earlyCheckIn = false;
    let earlyCheckOut = false;
    let extraTime = false;
    let baseHours = getExpectedShiftDuration(
      tInDate.toISOString(),
      staffDoc?.shiftStart,
      staffDoc?.shiftEnd,
      (staffDoc as any)?.shiftOverrides,
      staffDoc?.shift2Start,
      staffDoc?.shift2End,
      staffDoc?.breakHours
    );
    let lateMinutes = 0;
    let extraHours = 0;

    if (staffDoc) {
      const statuses = calculateShiftStatus(
        tInDate,
        tOutDate,
        staffDoc.shiftStart,
        staffDoc.shiftEnd,
        (staffDoc as any).shiftOverrides,
        null,
        null,
        staffDoc.shift2Start,
        staffDoc.shift2End,
        settings?.gracePeriodMinutes || 0,
        staffDoc.breakHours
      );
      lateCheckIn = statuses.lateCheckIn;
      earlyCheckIn = statuses.earlyCheckIn;
      earlyCheckOut = statuses.isEarlyCheckOut;
      extraTime = statuses.isExtraTime;
      baseHours = statuses.shiftDurationHours;
      lateMinutes = statuses.lateMinutes || 0;
      extraHours = (statuses.extraMinutes || 0) / 60;
    } else {
      extraHours = Math.max(0, durationHours - baseHours);
    }

    const overtimeGraceHours = (settings?.overtimeGraceMinutes || 0) / 60;
    const overtimeHours = baseHours === 0 ? durationHours : (extraHours >= overtimeGraceHours ? extraHours : 0);
    const regularHours = baseHours === 0 ? 0 : Math.max(0, Math.min(baseHours, durationHours - extraHours));


    if (staffDoc) {
      const daysInMonth = getDaysInMonth(parseISO(editingLog.date));
      const dailySalaryBase = staffDoc.monthlySalary ? (staffDoc.monthlySalary / daysInMonth) : (baseHours * (staffDoc.hourlyRate || 0));
      const calculatedHourlyRate = getCalculatedHourlyRate(staffDoc, editingLog.date);
      const otPayAmount = calculateOvertimePay(overtimeHours, calculatedHourlyRate, settings || undefined);
      const unpenalizedSalary = baseHours > 0 ? ((regularHours / baseHours) * dailySalaryBase) + otPayAmount : dailySalaryBase + otPayAmount;
      
      lateDeductionAmount = baseHours === 0 ? 0 : (lateMinutes / 60) * (settings?.lateDeductionPerHour ?? (calculatedHourlyRate || 0)) || 0;
      dailySalary = (unpenalizedSalary - lateDeductionAmount) || 0;
    }

    await updateDoc(doc(db, "logs", editingLog.id), {
      timeIn: editingLog.timeIn,
      timeOut: editingLog.timeOut,

      regularHours,
      overtimeHours,
      late: lateCheckIn,
      lateCheckIn,
      earlyCheckIn,
      earlyCheckOut,
      extraTime,
      lateMinutes,
      dailySalary,
      totalEarnings: dailySalary,
      lateDeduction: lateDeductionAmount,
    });

    try {
      await sendPushNotification(editingLog.staffId, "staff", user?.companyId || "", "Attendance Record Corrected", `Your check-in log for date ${editingLog.date} was corrected by the manager.`);
      await addDoc(collection(db, "notifications"), {
        companyId: user?.companyId || "",
        userId: editingLog.staffId,
        role: "staff",
        type: "attendance",
        title: "Attendance Record Corrected",
        message: `Your check-in log for date ${editingLog.date} was corrected by the manager.`,
        read: false,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error(e);
    }

    setEditingLog(null);
    fetchData();
  };

  const fetchData = async () => {};

  const handleSaveBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForBonus) return;

    const existingBonus = bonuses.find(
      (b) => b.staffId === selectedStaffForBonus.id,
    );
    if (existingBonus) {
      await updateDoc(doc(db, "bonuses", existingBonus.id), {
        amount: Number(bonusAmount),
        note: bonusNote,
        deductionAmount: Number(deductionAmount) || 0,
        deductionNote: deductionNote || "",
      });
    } else {
      await addDoc(collection(db, "bonuses"), {
        companyId: user?.companyId || "",
        staffId: selectedStaffForBonus.id,
        month: selectedMonth,
        amount: Number(bonusAmount),
        note: bonusNote,
        deductionAmount: Number(deductionAmount) || 0,
        deductionNote: deductionNote || "",
      });
    }

    // Save notification for employees
    try {
      await sendPushNotification(selectedStaffForBonus.id, "staff", user?.companyId || "", "Payroll Allowances Updated", `Your payroll for ${selectedMonth} was edited. Allowance Bonus: ${bonusAmount || 0}, Deduction: ${deductionAmount || 0}.`);
      await addDoc(collection(db, "notifications"), {
        companyId: user?.companyId || "",
        userId: selectedStaffForBonus.id,
        role: "staff",
        type: "attendance",
        title: "Payroll Allowances Updated",
        message: `Your payroll for ${selectedMonth} was edited. Allowance Bonus: $${bonusAmount || 0}, Deduction: $${deductionAmount || 0}.`,
        read: false,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error(e);
    }

    setShowBonusModal(false);
    fetchData();
  };

  useEffect(() => {
    if (!user?.companyId) return;

    const staffQ = query(collection(db, "staff"), where("companyId", "==", user.companyId));
    const unsubStaff = onSnapshot(staffQ, (snap) => {
      const staffList = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Staff)
        .filter(s => s.role !== "admin")
        .sort((a, b) => (a.passcode || "").localeCompare(b.passcode || "", undefined, { numeric: true }));
      setStaff(staffList);
    });

    const startDate = `${selectedMonth}-01`;
    const endDate = `${selectedMonth}-31`;
    const logsQ = query(
      collection(db, "logs"),
      where("companyId", "==", user.companyId),
      where("date", ">=", startDate),
      where("date", "<=", endDate)
    );
    const unsubLogs = onSnapshot(logsQ, (snap) => {
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const bonusesQ = query(
      collection(db, "bonuses"),
      where("companyId", "==", user.companyId),
      where("month", "==", selectedMonth)
    );
    const unsubBonuses = onSnapshot(bonusesQ, (snap) => {
      setBonuses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubStaff();
      unsubLogs();
      unsubBonuses();
    };
  }, [selectedMonth, user?.companyId]);

  // Aggregate logs by staffId
  const payrollSummary = staff
    .filter((s) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        (s.name && s.name.toLowerCase().includes(term)) ||
        (s.nameKh && s.nameKh.toLowerCase().includes(term)) ||
        false
      );
    })
    .map((employee) => {
      const employeeLogs = logs.filter(
        (l) => l.staffId === employee.id && l.status === "checked_out",
      );

      let totalCommission = 0;
      let totalWorkedHours = 0;
      let totalLateCheckIns = 0;
      let totalEarlyCheckIns = 0;
      let totalEarlyCheckOuts = 0;
      let totalExtraTimes = 0;
      let totalOvertimeHours = 0;

      const daysInMonth = getDaysInMonth(new Date(`${selectedMonth}-01`));
      const dailySalaryStatic = (employee.monthlySalary || 0) / daysInMonth;

      const displayLogs: any[] = [];
      let absentDays = 0;
      let totalAbsentPenalty = 0;
      let totalEarnedRegular = 0;
      let totalOTPay = 0;
      let totalLateDeduction = 0;
      let totalExpectedHoursMonth = 0;

      // Calculate the standard hourly rate
      let stdExpectedHours = Math.max(0, calculateShiftHours(employee.shiftStart, employee.shiftEnd) + calculateShiftHours(employee.shift2Start, employee.shift2End) - (employee.breakHours || 0));
      if (stdExpectedHours === 0) stdExpectedHours = 8;
      const calculatedHourlyRate = employee.monthlySalary ? (dailySalaryStatic / stdExpectedHours) : (employee.hourlyRate || 0);

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
        const log = employeeLogs.find(l => l.date === dateStr);
        const expectedHours = getExpectedShiftDuration(
          dateStr,
          employee.shiftStart,
          employee.shiftEnd,
          employee.shiftOverrides,
          employee.shift2Start,
          employee.shift2End,
          employee.breakHours
        );
        totalExpectedHoursMonth += expectedHours;
        const isPastOrToday = hasShiftEnded(dateStr, employee.shiftStart, employee.shiftEnd, employee.shiftOverrides, employee.shift2Start, employee.shift2End);

        if (log) {
           if (log.isPermission) {
              displayLogs.push(log);
           } else if (log.isDayOff) {
              totalEarnedRegular += (log.dailySalary || 0);
              displayLogs.push(log);
           } else if (log.isAbsentRecord || log.isAbsent) {
              if (isPastOrToday) {
                 absentDays++;
                 const penalty = expectedHours * calculatedHourlyRate;
                 totalAbsentPenalty += penalty;
                 displayLogs.push({ ...log, isAbsent: true, dailySalary: -penalty, totalEarnings: -penalty });
              } else {
                 displayLogs.push(log);
              }
           } else {
              const actualRegular = log.regularHours || 0;
              if (isPastOrToday) {
                 const missedHours = Math.max(0, expectedHours - actualRegular);
                 totalAbsentPenalty += missedHours * calculatedHourlyRate;
              }
              totalWorkedHours += actualRegular + (log.overtimeHours || 0);
              totalOvertimeHours += log.overtimeHours || 0;
              if (log.lateCheckIn || log.late) totalLateCheckIns++;
              if (log.earlyCheckIn) totalEarlyCheckIns++;
              if (log.earlyCheckOut || log.earlyLeave) totalEarlyCheckOuts++;
              if (log.extraTime) totalExtraTimes++;
              
              const logHourlyRate = getCalculatedHourlyRate(employee, dateStr);
              const otPay = calculateOvertimePay(log.overtimeHours || 0, logHourlyRate, settings || undefined);
              totalOTPay += otPay;
              
              let earnedReg = (log.dailySalary || 0) - otPay;
              if (expectedHours === 0 && employee.monthlySalary) {
                 earnedReg = Math.max(earnedReg, dailySalaryStatic);
              }
              totalEarnedRegular += earnedReg;
              totalLateDeduction += (log.lateDeduction || 0);
              displayLogs.push({...log, dailySalary: earnedReg + otPay, totalEarnings: earnedReg + otPay});
           }
        } else {
           if (expectedHours === 0) {
              if (employee.monthlySalary) {
                 totalEarnedRegular += dailySalaryStatic;
              }
              displayLogs.push({
                 id: `day-off-${dateStr}`,
                 date: dateStr,
                 isDayOff: true,
                 dailySalary: employee.monthlySalary ? dailySalaryStatic : 0,
                 totalEarnings: employee.monthlySalary ? dailySalaryStatic : 0,
                 note: employee.monthlySalary ? "Weekly Rest Day (Paid)" : "Weekly Rest Day",
              });
           } else {
              if (isPastOrToday) {
                 absentDays++;
                 const penalty = expectedHours * calculatedHourlyRate;
                 totalAbsentPenalty += penalty;
                 displayLogs.push({
                   id: `absent-${dateStr}`,
                   date: dateStr,
                   isAbsent: true,
                   dailySalary: -penalty,
                   totalEarnings: -penalty,
                 });
              }
           }
        }
      }

      const fixedBonus = employee.bonus || 0;
      const monthlyBonusRecord = bonuses.find((b) => b.staffId === employee.id);
      const monthlyBonus = monthlyBonusRecord ? monthlyBonusRecord.amount || 0 : 0;
      const monthlyDeduction = monthlyBonusRecord ? monthlyBonusRecord.deductionAmount || 0 : 0;

      const isMonthly = !!employee.monthlySalary;
      const displayBasePay = isMonthly ? (employee.monthlySalary || 0) : (totalExpectedHoursMonth * calculatedHourlyRate);
      const workPay = totalEarnedRegular + totalLateDeduction;
      
      const totalDeductions = totalLateDeduction + totalAbsentPenalty + monthlyDeduction;

      const finalSalary = workPay + totalCommission + fixedBonus + monthlyBonus + totalOTPay - totalDeductions;
        
      const payrollStatus = monthlyBonusRecord?.payrollStatus || "draft";

      return {
        employee,
        employeeLogs,
        displayLogs,
        basicSalary: displayBasePay,
        workPay,
        totalCommission,
        totalWorkedHours,
        totalLateCheckIns,
        totalEarlyCheckIns,
        totalEarlyCheckOuts,
        totalExtraTimes,
        totalOvertimeHours,
        totalOTPay,
        fixedBonus,
        monthlyBonus,
        monthlyBonusNote: monthlyBonusRecord?.note || "",
        monthlyDeduction,
        monthlyDeductionNote: monthlyBonusRecord?.deductionNote || "",
        lateDeductions: totalLateDeduction,
        absentPenalties: totalAbsentPenalty,
        totalDeductions,
        finalSalary,
        payrollStatus,
        calculatedHourlyRate,
        absentDays
      };
    });

  const exportToCSV = (summary: any) => {
    const headers = [
      "Date",
      "Time In",
      "Time Out",
      "Regular Hours",
      "Overtime Hours",
      "Daily Salary",
      "Total",
    ];
    const rows = summary.employeeLogs.map((log: any) => [
      log.date,
      new Date(log.timeIn).toLocaleTimeString(),
      new Date(log.timeOut).toLocaleTimeString(),
      log.regularHours,
      log.overtimeHours,
      log.dailySalary,
      log.totalEarnings,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      `Payroll for ${summary.employee.name} - ${selectedMonth}\n` +
      `Monthly Bonus: ${summary.monthlyBonus}\n` +
      `Fixed Bonus: ${summary.fixedBonus}\n` +
      `Monthly Deduction: ${summary.monthlyDeduction}\n` +
      `Final Salary: ${summary.finalSalary}\n\n` +
      headers.join(",") +
      "\n" +
      rows.map((e: any) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `payroll_${summary.employee.name}_${selectedMonth}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm gap-4">
        <h2 className="text-xl font-semibold whitespace-nowrap">
          {t("monthlyPayroll")}
        </h2>
        <div className="flex flex-wrap md:flex-nowrap gap-4 items-center w-full md:w-auto">
          <button
            onClick={() => onClearCategory("payroll")}
            className="text-xs font-medium text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-md border border-rose-100 dark:border-rose-500/20 whitespace-nowrap transition-colors"
          >
            {t("clearData")}
          </button>

          <button
            onClick={() => {
              setPdfConfigModalType('monthly');
            }}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-md border border-indigo-100 dark:border-indigo-500/20 whitespace-nowrap flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Download PDF Report
          </button>

          <div className="relative flex-1 min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder={t("searchPlaceholder") || "Search..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all shadow-sm text-slate-800 dark:text-slate-200"
            />
          </div>

          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="p-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm flex-1 md:flex-none focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all shadow-sm text-slate-800 dark:text-slate-200"
          />
        </div>
      </div>

      <div className="space-y-4">
        {payrollSummary.map((summary, idx) => {
          return (
            <div
              key={`${summary.employee.id}-${idx}`}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm"
            >
              <div 
                className={`flex flex-col md:flex-row justify-between md:items-center p-5 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${expandedEmployee === summary.employee.id ? 'border-b border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30' : ''}`}
                onClick={() => setExpandedEmployee(expandedEmployee === summary.employee.id ? null : summary.employee.id)}
              >
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    {expandedEmployee === summary.employee.id ? <span className="text-slate-400 text-sm">▼</span> : <span className="text-slate-400 text-sm">▶</span>}
                    {i18n.language === "km" && summary.employee.nameKh
                      ? summary.employee.nameKh
                      : summary.employee.name}{" "}
                    {summary.employee.branch
                      ? `(${summary.employee.branch})`
                      : ""}
                  </h3>
                </div>
              </div>
              
              {expandedEmployee === summary.employee.id && (
                <div className="p-5 space-y-4">
                  <div className="flex flex-col md:flex-row justify-between md:items-start border-b border-slate-100 dark:border-slate-800 pb-5">
                    <div>
                      <div className="text-sm text-slate-500">
                        {t("daysWorked")}: {summary.employeeLogs.length} •{" "}
                        {t("totalHours")}: {formatHours(summary.totalWorkedHours)}
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        {t("lateCheckIn")}:{" "}
                        <span className="text-red-500 dark:text-red-400">
                          {summary.totalLateCheckIns}
                        </span>{" "}
                        • {t("earlyCheckOut")}:{" "}
                        <span className="text-sky-500 dark:text-sky-400">
                          {summary.totalEarlyCheckOuts}
                        </span>
                        {summary.totalExtraTimes > 0 && (
                          <>
                            {" "}
                            • {t("extraTime")}:{" "}
                            <span className="text-purple-500 dark:text-purple-400">
                              {summary.totalExtraTimes}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 text-right bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 p-4 rounded-lg shadow-sm">
                      <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-1">
                        {t("finalSalary")}
                      </div>
                      <div className={`text-xl md:text-2xl font-bold ${summary.finalSalary < 0 ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                        {formatCurrency(summary.finalSalary, "USD")}
                      </div>
                      <div className={`text-sm font-medium ${summary.finalSalary < 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                        {formatCurrency(summary.finalSalary, "KHR", settings?.exchangeRate || 4000)}
                      </div>
                    </div>
                  </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mt-4">
                {isPayrollFieldVisible(settings?.adminPayrollDetails, 'basicSalary') && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 p-3 rounded-lg shadow-sm">
                    <span className="block text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                      Basic Salary
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(summary.basicSalary, "USD")}
                    </span>
                  </div>
                )}
                {isPayrollFieldVisible(settings?.adminPayrollDetails, 'workPay') && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 p-3 rounded-lg shadow-sm">
                    <span className="block text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                      Work Pay
                    </span>
                    <span className="font-semibold text-sky-600 dark:text-sky-400">
                      {formatCurrency(summary.workPay, "USD")}
                    </span>
                  </div>
                )}
                {isPayrollFieldVisible(settings?.adminPayrollDetails, 'overtimePay') && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 p-3 rounded-lg shadow-sm">
                    <span className="block text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                      Overtime Pay
                    </span>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      {formatCurrency(summary.totalOTPay, "USD")}
                    </span>
                  </div>
                )}
                {isPayrollFieldVisible(settings?.adminPayrollDetails, 'commission') && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 p-3 rounded-lg shadow-sm">
                    <span className="block text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                      {t("commission")}
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(summary.totalCommission, "USD")}
                    </span>
                  </div>
                )}
                {isPayrollFieldVisible(settings?.adminPayrollDetails, 'monthlyBonus') && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 p-3 rounded-lg shadow-sm">
                    <span className="block text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                      {t("monthlyBonus")}
                    </span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(
                        summary.monthlyBonus + summary.fixedBonus,
                        "USD",
                      )}
                    </span>
                    {summary.monthlyBonusNote && (
                      <div className="text-xs text-indigo-600 dark:text-indigo-400/80 mt-1 bg-indigo-50 dark:bg-indigo-900/20 p-1.5 rounded-md whitespace-normal">
                        {summary.monthlyBonusNote}
                      </div>
                    )}
                  </div>
                )}
                {isPayrollFieldVisible(settings?.adminPayrollDetails, 'manualDeduction') && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 p-3 rounded-lg shadow-sm">
                    <span className="block text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                      Manual Deduction
                    </span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      {formatCurrency(summary.monthlyDeduction, "USD")}
                    </span>
                    {summary.monthlyDeductionNote && (
                      <div className="text-xs text-rose-600 dark:text-rose-400/80 mt-1 bg-rose-50 dark:bg-rose-900/20 p-1.5 rounded-md whitespace-normal">
                        {summary.monthlyDeductionNote}
                      </div>
                    )}
                  </div>
                )}
                {isPayrollFieldVisible(settings?.adminPayrollDetails, 'lateDeduction') && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 p-3 rounded-lg shadow-sm">
                    <span className="block text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap mb-0.5">
                      Late Deductions
                    </span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      {summary.lateDeductions > 0 ? "-" : ""}{formatCurrency(summary.lateDeductions, "USD")}
                    </span>
                  </div>
                )}
                {isPayrollFieldVisible(settings?.adminPayrollDetails, 'absentPenalties') && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 p-3 rounded-lg shadow-sm">
                    <span className="block text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap mb-0.5">
                      Absent Penalties
                    </span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      {summary.absentPenalties > 0 ? "-" : ""}{formatCurrency(summary.absentPenalties, "USD")}
                    </span>
                  </div>
                )}
                {isPayrollFieldVisible(settings?.adminPayrollDetails, 'deductions') && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 p-3 rounded-lg shadow-sm">
                    <span className="block text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap mb-0.5">
                      Total Deductions
                    </span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      - {formatCurrency(summary.lateDeductions + summary.absentPenalties + summary.monthlyDeduction, "USD")}
                    </span>
                  </div>
                )}
                {isPayrollFieldVisible(settings?.adminPayrollDetails, 'hourlyRate') && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 p-3 rounded-lg shadow-sm">
                    <span className="block text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                      {t("hourlyRate")}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      ${summary.calculatedHourlyRate?.toFixed(2)}/h
                    </span>
                  </div>
                )}
              </div>

              {(summary.employee.phone || summary.employee.bankQrUrl || summary.employee.nationalIdCardUrl || summary.employee.telegramChatId) && (
                <div className="mt-4 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700/50 overflow-hidden transition-all">
                  <div 
                    className="p-3.5 flex justify-between items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50"
                    onClick={() => setExpandedProfileEmployee(expandedProfileEmployee === summary.employee.id ? null : summary.employee.id)}
                  >
                    <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      {expandedProfileEmployee === summary.employee.id ? <span className="text-slate-400 text-sm">▼</span> : <span className="text-slate-400 text-sm">▶</span>}
                      Employee Profile
                    </h4>
                  </div>
                  {expandedProfileEmployee === summary.employee.id && (
                    <div className="p-4 pt-0 flex flex-col md:flex-row gap-6 items-start border-t border-slate-200 dark:border-slate-700/50 mt-2 pt-4">
                      <div className="flex gap-4 flex-wrap">
                        {summary.employee.bankQrUrl && (
                          <div className="flex-shrink-0 text-center">
                            <div 
                              className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-xl overflow-hidden border p-1 shadow-sm mx-auto cursor-pointer group relative"
                              onClick={() => setFullQrUrl(summary.employee.bankQrUrl)}
                            >
                              <img src={summary.employee.bankQrUrl} alt="Bank QR" className="w-full h-full object-contain" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] sm:text-xs font-bold rounded-xl m-1">
                                View
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2 block">{t("bankQrCode")}</span>
                          </div>
                        )}
                        {summary.employee.nationalIdCardUrl && (
                          <div className="flex-shrink-0 text-center">
                            <div 
                              className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-xl overflow-hidden border p-1 shadow-sm mx-auto cursor-pointer group relative"
                              onClick={() => setFullQrUrl(summary.employee.nationalIdCardUrl)}
                            >
                              <img src={summary.employee.nationalIdCardUrl} alt="National ID" className="w-full h-full object-contain" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] sm:text-xs font-bold rounded-xl m-1">
                                View
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2 block">{t("nationalIdCard")}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-2 text-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                          <div><span className="font-medium">{t("phone")}:</span> {summary.employee.phone || "N/A"}</div>
                          <div><span className="font-medium">{t("email")}:</span> {summary.employee.email || "N/A"}</div>
                          <div><span className="font-medium">Telegram ID:</span> {summary.employee.telegramChatId ? <span className="text-emerald-600 dark:text-emerald-400 font-bold">{summary.employee.telegramChatId} ✅</span> : "N/A"}</div>
                          <div><span className="font-medium">{t("started")}:</span> {summary.employee.startingDate || "N/A"}</div>
                          <div className="sm:col-span-2"><span className="font-medium">{t("address")}:</span> {summary.employee.address || "N/A"}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex justify-between items-center">
                <button
                  onClick={() =>
                    setExpandedDailyLogsEmployee(
                      expandedDailyLogsEmployee === summary.employee.id
                        ? null
                        : summary.employee.id,
                    )
                  }
                  className="text-sm font-medium text-ice-600 hover:text-ice-700 transition"
                >
                  {expandedDailyLogsEmployee === summary.employee.id
                    ? "Hide Daily Logs"
                    : "View Daily Logs"}
                </button>
                <div className="flex gap-2 flex-wrap justify-end">
                  {summary.payrollStatus === "draft" && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedStaffForBonus(summary.employee);
                          setBonusAmount(summary.monthlyBonus.toString());
                          setBonusNote(summary.monthlyBonusNote);
                          setDeductionAmount(summary.monthlyDeduction.toString());
                          setDeductionNote(summary.monthlyDeductionNote);
                          setShowBonusModal(true);
                        }}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 transition bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-md"
                      >
                        Add Bonus & Deduction
                      </button>
                      {(summary.monthlyBonus > 0 ||
                        summary.monthlyDeduction > 0) && (
                        <button
                          onClick={async () => {
                            const rec = bonuses.find(
                              (b) => b.staffId === summary.employee.id,
                            );
                            if (rec) {
                              onDelete("bonuses", rec.id, fetchData);
                            }
                          }}
                          className="text-sm font-medium text-red-600 hover:text-red-700 transition bg-red-50 dark:bg-red-900/30 px-3 py-1.5 rounded-md"
                          title="Remove Bonus/Deduction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => {
                      requestConfirm(
                        `Delete ALL logs for ${summary.employee.name} in ${selectedMonth}?`,
                        async () => {
                          for (const l of summary.employeeLogs) {
                            await deleteDoc(doc(db, "logs", l.id));
                          }
                          fetchData();
                        },
                      );
                    }}
                    className="text-sm font-medium text-red-600 hover:text-red-700 transition bg-red-50 dark:bg-red-900/30 px-3 py-1.5 rounded-md"
                    title="Delete all records for this staff this month"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => exportToCSV(summary)}
                    className="text-sm font-medium text-green-600 hover:text-green-700 transition bg-green-50 dark:bg-green-900/30 px-3 py-1.5 rounded-md"
                  >
                    {t("exportCSV")}
                  </button>
                  <button
                    onClick={() => handleDownloadPDF(summary)}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-md"
                  >
                    PDF
                  </button>
                  {summary.payrollStatus === "draft" && (
                    <button
                      onClick={() => handleUpdatePayrollStatus(summary, "pending_review")}
                      className="text-sm font-medium text-amber-600 hover:text-amber-700 transition bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-md flex items-center gap-1"
                    >
                      Send for Review
                    </button>
                  )}
                  {summary.payrollStatus === "pending_review" && (
                    <span className="text-sm font-medium text-amber-500 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-md">
                      Waiting for Employee
                    </span>
                  )}
                  {summary.payrollStatus === "confirmed" && (
                    <button
                      onClick={() => handleUpdatePayrollStatus(summary, "paid")}
                      className="text-sm font-medium text-green-600 hover:text-green-700 transition bg-green-50 dark:bg-green-900/30 px-3 py-1.5 rounded-md"
                    >
                      Mark as Paid
                    </button>
                  )}
                  {summary.payrollStatus === "paid" && (
                    <span className="text-sm font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-md flex items-center gap-1">
                      Paid ✓
                    </span>
                  )}
                </div>
              </div>

              {expandedDailyLogsEmployee === summary.employee.id && (
                <div className="mt-4 pt-4 border-t dark:border-slate-700/50 space-y-3">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-200">{t("dailyLogs")}</h4>
                  {summary.displayLogs.length > 0 ? (
                    summary.displayLogs
                      .sort(
                        (a, b) =>
                          new Date(b.date).getTime() -
                          new Date(a.date).getTime(),
                      )
                      .map((log, index) => (
                        <div
                          key={`${log.id}-${index}`}
                          className={`flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-sm gap-3 cursor-pointer ${(log.isDayOff || log.isAbsent || log.isPermission) ? "opacity-60 bg-slate-50/50 dark:bg-slate-900/30" : ""}`}
                          onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-sm flex items-center gap-2">
                              {log.date}
                              {log.isDayOff && (
                                <span className="text-[10px] bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded uppercase tracking-wide">{t("dayOff")}</span>
                              )}
                              {log.isAbsent && (
                                <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded uppercase tracking-wide">{t("absent")}</span>
                              )}
                              {log.isPermission && (
                                <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded uppercase tracking-wide">{t("permission")}</span>
                              )}
                            </div>
                            <span className="text-sm font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">{expandedLogId === log.id ? "-" : "+"}</span>
                          </div>

                          {expandedLogId === log.id && (
                            <div className="flex flex-col lg:flex-row justify-between lg:items-center mt-3 pt-3 border-t dark:border-slate-700/50 gap-3" onClick={(e) => e.stopPropagation()}>
                              {log.note && (
                                <div className="text-sm text-slate-500 italic w-full lg:w-auto">
                                  {log.note}
                                </div>
                              )}
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 flex-1">
                                <div>
                                  {!(log.isDayOff || log.isAbsent || log.isPermission) && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {log.earlyCheckIn && (
                                        <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded">
                                          {t("earlyCheckIn")}
                                        </span>
                                      )}
                                      {(log.lateCheckIn || log.late) && (
                                        <span className="text-[10px] bg-red-100 text-red-700 px-1 rounded whitespace-nowrap">
                                          {t("lateCheckIn")} ({Math.floor((log.lateMinutes || 0) / 60)}h{Math.round((log.lateMinutes || 0) % 60)}mn)
                                        </span>
                                      )}
                                      {(log.earlyCheckOut || log.earlyLeave) && (
                                        <span className="text-[10px] bg-orange-100 text-orange-700 px-1 rounded">
                                          {t("earlyCheckOut")}
                                        </span>
                                      )}
                                      {log.extraTime && (
                                        <span className="text-[10px] bg-purple-100 text-purple-700 px-1 rounded">
                                          {t("extraTime")}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="text-xs text-slate-500">
                                    Time In
                                  </div>
                                  <div className="font-medium text-sm flex items-center gap-2">
                                    <span>{(log.isDayOff || log.isAbsent || log.isPermission) ? "-" : log.timeIn ? new Date(log.timeIn).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }) : "-"}</span>
                                    {log.checkInPhotoUrl && (
                                       <button onClick={() => setPreviewImage(log.checkInPhotoUrl)} className="text-indigo-500 hover:text-indigo-600">
                                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                                       </button>
                                    )}
                                    {log.checkInLat && log.checkInLng && (
                                       <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${log.checkInLat},${log.checkInLng}`, '_blank')} className="text-rose-500 hover:text-rose-600">
                                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                       </button>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-slate-500">
                                    Time Out
                                  </div>
                                  <div className="font-medium text-sm flex items-center gap-2">
                                    <span>{(log.isDayOff || log.isAbsent || log.isPermission) ? "-" : log.timeOut ? new Date(log.timeOut).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }) : "-"}</span>
                                    {log.checkOutPhotoUrl && (
                                       <button onClick={() => setPreviewImage(log.checkOutPhotoUrl)} className="text-indigo-500 hover:text-indigo-600">
                                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                                       </button>
                                    )}
                                    {log.checkOutLat && log.checkOutLng && (
                                       <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${log.checkOutLat},${log.checkOutLng}`, '_blank')} className="text-rose-500 hover:text-rose-600">
                                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                       </button>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-slate-500">
                                    Worked Time
                                  </div>
                                  <div className="font-medium text-sm">
                                    {(log.isDayOff || log.isAbsent || log.isPermission) ? "-" : formatHours((log.regularHours || 0) + (log.overtimeHours || 0))} 
                                    {!(log.isDayOff || log.isAbsent || log.isPermission) && !!log.overtimeHours && log.overtimeHours > 0 && <span className="text-xs text-slate-400 ml-1">(OT: {formatHours(log.overtimeHours)})</span>}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-slate-500">
                                    Overtime Pay
                                  </div>
                                  <div className="font-medium text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                                    {!(log.isDayOff || log.isAbsent || log.isPermission) && !!log.overtimeHours && log.overtimeHours > 0 
                                      ? (() => {
                                          const st = staff.find(s => s.id === log.staffId);
                                          const stRate = getCalculatedHourlyRate(st, log.date);
                                          return `+${formatCurrency(calculateOvertimePay(log.overtimeHours, stRate, settings || undefined), "USD")}`;
                                        })()
                                      : "$0.00"}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-slate-500">
                                    Regular Work Pay
                                  </div>
                                  <div className="font-medium text-sm text-slate-700 dark:text-slate-300">
                                    {(() => {
                                      const st = staff.find(s => s.id === log.staffId);
                                      const stRate = getCalculatedHourlyRate(st, log.date);
                                      const otP = calculateOvertimePay(log.overtimeHours || 0, stRate, settings || undefined);
                                      const regPay = (log.isDayOff || log.isAbsent || log.isPermission) ? (log.dailySalary || 0) : ((log.dailySalary || 0) + (log.lateDeduction || 0) - otP);
                                      return formatCurrency(regPay, "USD");
                                    })()}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-slate-500">
                                    Late Deduction
                                  </div>
                                  <div className="font-medium text-sm text-red-500">
                                    {log.lateDeduction && log.lateDeduction > 0 ? `-${formatCurrency(log.lateDeduction, "USD")}` : "$0.00"}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-slate-500">
                                    Work Pay
                                  </div>
                                  <div className={`font-medium text-sm ${(log.totalEarnings || 0) < 0 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {formatCurrency(log.totalEarnings || 0, "USD")}
                                  </div>
                                </div>

                                <div>
                                  <div className="text-xs font-bold text-ice-600">
                                    Total Earnings
                                  </div>
                                  <div className="flex flex-col">
                                    <span className={`font-medium text-sm font-bold ${(log.totalEarnings || 0) < 0 ? 'text-red-500' : 'text-ice-600'}`}>
                                      {formatCurrency(log.totalEarnings || 0, "USD")}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                      ≈
                                      {formatCurrency(
                                        log.totalEarnings || 0,
                                        "KHR",
                                        settings?.exchangeRate,
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-end lg:justify-center gap-2 mt-2 lg:mt-0 pt-2 lg:pt-0 border-t lg:border-t-0 dark:border-slate-700/50 flex-shrink-0">
                                <button
                                  onClick={() => setEditingLog(log)}
                                  className="text-blue-500 hover:text-blue-700 p-2 bg-blue-50 dark:bg-blue-900/40 rounded-full transition shadow-lg shadow-black/5"
                                  title="Edit Log"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    onDelete("logs", log.id, fetchData)
                                  }
                                  className="text-red-500 hover:text-red-700 p-2 bg-red-50 dark:bg-red-900/40 rounded-full transition shadow-lg shadow-black/5"
                                  title="Delete Log"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                  ) : (
                    <div className="text-sm text-slate-500">
                      No logs available for this period.
                    </div>
                  )}
                </div>
              )}
              </div>
            )}
            </div>
          );
        })}
        {payrollSummary.length === 0 && (
          <p className="text-slate-500 text-center py-8">
            No payroll records found for {selectedMonth}.
          </p>
        )}
      </div>

      {editingLog && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-4 bg-slate-900/50 backdrop-blur-sm transition-all duration-300 overflow-hidden">
        <ScrollLock />
          <div className="bg-white dark:bg-slate-900 sm:border border-slate-200 dark:border-slate-800 sm:rounded-xl shadow-2xl max-w-md w-full h-full sm:h-auto sm:max-h-[90vh] relative flex flex-col overflow-hidden">
            <div className="p-5 sm:p-8 pb-4 sm:pb-5 border-b border-slate-100 dark:border-slate-800 sm:border-white/40 sm:dark:border-slate-700/40 shrink-0">
              <h3 className="text-xl font-display font-bold">{t("editDailyLog")}</h3>
            </div>
            <form
              id="edit-log-form"
              onSubmit={handleUpdateLog}
              className="p-5 md:p-6 space-y-4 overflow-y-auto flex-1 scrollbar-thin"
            >
              <div>
                <label className="block text-sm font-medium mb-1">
                  Time In
                </label>
                <input
                  type="datetime-local"
                  required
                  value={editingLog.timeIn ? format(new Date(editingLog.timeIn), "yyyy-MM-dd'T'HH:mm") : ""}
                  onChange={(e) =>
                    setEditingLog({
                      ...editingLog,
                      timeIn: new Date(e.target.value).toISOString(),
                    })
                  }
                  className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-colors shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Time Out
                </label>
                <input
                  type="datetime-local"
                  required
                  value={editingLog.timeOut ? format(new Date(editingLog.timeOut), "yyyy-MM-dd'T'HH:mm") : ""}
                  onChange={(e) =>
                    setEditingLog({
                      ...editingLog,
                      timeOut: new Date(e.target.value).toISOString(),
                    })
                  }
                  className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-colors shadow-sm"
                />
              </div>
            </form>
            <div className="p-5 md:p-6 border-t border-white/40 dark:border-slate-700/40 dark:border-slate-700/50 bg-gray-50/50 dark:bg-gray-800/80 shrink-0 flex gap-3">
              <button
                type="button"
                onClick={() => setEditingLog(null)}
                className="flex-1 py-2.5 px-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                form="edit-log-form"
                className="flex-1 p-3 font-semibold rounded-lg bg-indigo-500/90 dark:bg-indigo-600/90 backdrop-blur-sm border border-white/20 dark:border-white/10 hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all shadow-sm text-white text-sm"
              >
                {t("save")}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {pdfConfigModalType && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 overflow-hidden overscroll-none">
        <ScrollLock />
          <div className="bg-white dark:bg-slate-900 sm:border border-slate-200 dark:border-slate-800 sm:rounded-xl shadow-xl max-w-md w-full h-full sm:h-auto sm:max-h-[90vh] relative flex flex-col overflow-hidden">
            <div className="p-5 sm:p-6 pb-4 sm:pb-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                {pdfConfigModalType === 'monthly' ? 'Download Monthly Report' : 'Download Payroll Receipt'}
              </h3>
            </div>
            
            <div className="p-5 sm:p-6 space-y-6 overflow-y-auto overflow-x-hidden overscroll-contain flex-1 min-h-0 custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
              {pdfConfigModalType === 'monthly' && (
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300 ml-1">
                    Preparer Name <span className="opacity-60 text-xs font-normal ml-1">(រៀបចំដោយ)</span>
                  </label>
                  <input
                    type="text"
                    value={preparerName}
                    onChange={(e) => setPreparerName(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-800 dark:text-slate-200"
                    placeholder="E.g. HR Manager"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300 ml-1">
                  CEO / Manager Name <span className="opacity-60 text-xs font-normal ml-1">(ប្រធានគ្រប់គ្រង)</span>
                </label>
                <input
                  type="text"
                  value={ceoName}
                  onChange={(e) => setCeoName(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-800 dark:text-slate-200"
                  placeholder="Leave empty for default"
                />
              </div>
            </div>
            
            <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0 flex gap-3 sm:gap-4 mt-auto">
              <button
                type="button"
                onClick={() => setPdfConfigModalType(null)}
                className="flex-1 py-2.5 px-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm text-sm"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={pdfConfigModalType === 'monthly' ? generateMonthlyReportPDF : executeDownloadPDF}
                className="flex-1 py-2.5 px-4 font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm text-sm"
              >
                {isGeneratingMonthlyPdf ? 'Generating...' : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {showBonusModal && selectedStaffForBonus && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-4 bg-slate-900/50 backdrop-blur-sm transition-all duration-300 overflow-hidden">
        <ScrollLock />
          <div className="bg-white dark:bg-slate-900 sm:border border-slate-200 dark:border-slate-800 sm:rounded-xl shadow-2xl max-w-md w-full h-full sm:h-auto sm:max-h-[90vh] relative flex flex-col overflow-hidden">
            <div className="p-5 sm:p-8 pb-4 sm:pb-5 border-b border-slate-100 dark:border-slate-800 sm:border-white/40 sm:dark:border-slate-700/40 shrink-0">
              <h3 className="text-xl font-display font-bold">
                {t("addMonthlyBonus")}
              </h3>
            </div>
            <form
              id="add-bonus-form"
              onSubmit={handleSaveBonus}
              className="p-5 md:p-6 space-y-4 overflow-y-auto flex-1 scrollbar-thin"
            >
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("staffInfo")}
                </label>
                <div className="font-semibold text-lg p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                  {i18n.language === "km" && selectedStaffForBonus.nameKh
                    ? selectedStaffForBonus.nameKh
                    : selectedStaffForBonus.name}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                  {t("bonusMonth")}
                </label>
                <div className="font-semibold p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                  {selectedMonth}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                    {t("bonusAmount")} ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(e.target.value)}
                    className="w-full text-lg p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/50 outline-none transition-colors shadow-sm"
                    placeholder="20.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Deduction Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={deductionAmount}
                    onChange={(e) => setDeductionAmount(e.target.value)}
                    className="w-full text-lg p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/50 outline-none transition-colors shadow-sm"
                    placeholder="10.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                    {t("bonusNote")}
                  </label>
                  <textarea
                    rows={2}
                    value={bonusNote}
                    onChange={(e) => setBonusNote(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-colors shadow-sm"
                    placeholder="e.g. Excellent performance"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Deduction Note
                  </label>
                  <textarea
                    rows={2}
                    value={deductionNote}
                    onChange={(e) => setDeductionNote(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-colors shadow-sm"
                    placeholder="e.g. Broken cup"
                  />
                </div>
              </div>
            </form>
            <div className="p-5 md:p-6 border-t border-white/40 dark:border-slate-700/40 dark:border-slate-700/50 bg-gray-50/50 dark:bg-gray-800/80 shrink-0 flex gap-3">
              <button
                type="button"
                onClick={() => setShowBonusModal(false)}
                className="flex-1 py-2.5 px-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                form="add-bonus-form"
                className="flex-1 p-3 font-semibold rounded-lg bg-indigo-500/90 dark:bg-indigo-600/90 backdrop-blur-sm border border-white/20 dark:border-white/10 hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all shadow-sm text-white text-sm"
              >
                {t("save")}
              </button>
            </div>
          </div>
        </div>
      , document.body)}
      
      {/* Hidden container for PDF export */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', zIndex: -100 }}>
         {isGeneratingMonthlyPdf && (
            <MonthlyPayrollReportPDF
              ref={monthlyPdfRef}
              payrollSummary={payrollSummary}
              selectedMonth={selectedMonth}
              companyName={settings?.companyName}
              logoUrl={settings?.logoUrl}
              exchangeRate={settings?.exchangeRate || 4000}
              preparerName={preparerName}
              ceoName={ceoName}
            />
         )}
         {pdfSummaryData && (
           <PayrollReceiptPDF 
             ref={pdfRef}
             user={pdfSummaryData.employee}
             selectedMonth={selectedMonth}
             basicSalary={pdfSummaryData.basicSalary}
             workPay={pdfSummaryData.workPay}
             monthlyBonus={pdfSummaryData.monthlyBonus}
             fixedBonus={pdfSummaryData.fixedBonus}
             monthlyDeduction={pdfSummaryData.monthlyDeduction}
             lateDeductions={pdfSummaryData.lateDeductions}
             absentPenalties={pdfSummaryData.absentPenalties}
             finalSalary={pdfSummaryData.finalSalary}
             overtimeHours={pdfSummaryData.totalOvertimeHours || 0}
             totalOTPay={pdfSummaryData.totalOTPay}
             ceoName={ceoName}
           />
         )}
      </div>

       {/* Full QR Modal */}
       {fullQrUrl && (
         <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950" onClick={() => setFullQrUrl(null)}>
<ScrollLock />
           <div className="relative max-w-lg w-full bg-white dark:bg-slate-900 rounded-3xl p-4 md:p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
             <button 
               onClick={() => setFullQrUrl(null)}
               className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
             >
               ✕
             </button>
             <h3 className="text-xl font-bold mb-6 text-center text-slate-800 dark:text-white">{t("bankQrCode")}</h3>
             <img src={fullQrUrl} alt="Full Bank QR" className="w-full h-auto max-h-[70vh] object-contain rounded-xl bg-slate-50 dark:bg-slate-800 p-2" />
           </div>
         </div>
       )}

      <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}

function LeavesManager({
  onClearCategory,
  onDelete,
}: {
  onClearCategory: (cat: string) => void;
  onDelete: (id: string, cb: () => void) => void;
}) {
  const { user } = useAuthStore();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [showAbsentModal, setShowAbsentModal] = useState(false);
  const [absentDate, setAbsentDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [absentStaffId, setAbsentStaffId] = useState("");

  const [viewMode, setViewMode] = useState<"monthly" | "daily">("monthly");
  const [selectedMonth, setSelectedMonth] = useState(() =>
    new Date().toISOString().slice(0, 7),
  );
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );

  const { t } = useTranslation();

  useEffect(() => {
    const unsubStaff = onSnapshot(
      query(
        collection(db, "staff"),
        where("companyId", "==", user?.companyId || "")
      ),
      (sn) => {
        setAllStaff(sn.docs.map((d) => ({ id: d.id, ...d.data() }) as Staff).filter(s => s.role !== "admin").sort((a, b) => (a.passcode || "").localeCompare(b.passcode || "", undefined, { numeric: true })));
      }
    );
    const unsubLeaves = onSnapshot(
      query(
        collection(db, "permissions"),
        where("companyId", "==", user?.companyId || ""),
        orderBy("createdAt", "desc")
      ),
      (sn) => {
        setLeaves(sn.docs.map((d) => ({ id: d.id, ...d.data() }) as any));
      }
    );
    return () => {
      unsubStaff();
      unsubLeaves();
    };
  }, []);

  const fetchLeaves = () => {};

  const filteredLeaves = leaves.filter((l) => {
    if (!l.date) return false;
    if (viewMode === "monthly") {
      return l.date.startsWith(selectedMonth);
    } else {

      return l.date === selectedDate;
    }
  });

  const updateStatus = async (id: string, status: string, isPaid = false) => {
    const leaveDoc = leaves.find((l) => l.id === id);
    if (!leaveDoc) return;

    if (status === "approved") {
      const staffDoc = allStaff.find((s) => s.id === leaveDoc.staffId);
      if (staffDoc) {
        const expectedHours = getExpectedShiftDuration(
          leaveDoc.date,
          staffDoc.shiftStart,
          staffDoc.shiftEnd,
          (staffDoc as any).shiftOverrides,
          staffDoc.shift2Start,
          staffDoc.shift2End,
          staffDoc.breakHours
        );

        const leaveDate = new Date(leaveDoc.date);
        const daysInMonth = new Date(leaveDate.getFullYear(), leaveDate.getMonth() + 1, 0).getDate();
        const calculatedDailySalary = (staffDoc.monthlySalary ? (staffDoc.monthlySalary / daysInMonth) : ((expectedHours || 0) * (staffDoc.hourlyRate || 0))) || 0;

        if (leaveDoc.type === "day_off") {
          await addDoc(collection(db, "logs"), {
            companyId: user?.companyId || "",
            staffId: leaveDoc.staffId,
            date: leaveDoc.date,
            timeIn: new Date(`${leaveDoc.date}T00:00:00Z`).toISOString(),
            timeOut: new Date(`${leaveDoc.date}T00:00:00Z`).toISOString(),
            status: "checked_out",
            late: false,
            lateCheckIn: false,
            earlyCheckIn: false,
            earlyLeave: false,
            earlyCheckOut: false,
            extraTime: false,
            regularHours: expectedHours,
            overtimeHours: 0,
            dailySalary: calculatedDailySalary,
            totalEarnings: calculatedDailySalary,
            isLeaveRecord: true,
            isDayOff: true,
            note: leaveDoc.reason || "Approved Day Off",
          });
        } else if (leaveDoc.type === "permission") {
          await addDoc(collection(db, "logs"), {
            companyId: user?.companyId || "",
            staffId: leaveDoc.staffId,
            date: leaveDoc.date,
            timeIn: new Date(`${leaveDoc.date}T00:00:00Z`).toISOString(),
            timeOut: new Date(`${leaveDoc.date}T00:00:00Z`).toISOString(),
            status: "checked_out",
            late: false,
            lateCheckIn: false,
            earlyCheckIn: false,
            earlyLeave: false,
            earlyCheckOut: false,
            extraTime: false,
            regularHours: 0,
            overtimeHours: 0,
            dailySalary: 0,
            totalEarnings: 0,
            isLeaveRecord: true,
            isPermission: true,
            note: leaveDoc.reason || "Approved Permission (Unpaid)",
          });
        } else if (leaveDoc.type === "late_checkin" || leaveDoc.type === "early_leave") {
          const logsQuery = query(collection(db, "logs"), where("staffId", "==", leaveDoc.staffId), where("date", "==", leaveDoc.date));
          const logsSnap = await getDocs(logsQuery);
          
          if (!logsSnap.empty) {
            logsSnap.forEach(async (logDoc) => {
              const logData = logDoc.data();
              const updates: any = {};
              
              if (leaveDoc.type === "late_checkin") {
                updates.late = false;
                updates.lateCheckIn = false;
                
                if (logData.lateDeduction) {
                  updates.lateDeduction = 0;
                  updates.dailySalary = (logData.dailySalary || 0) + logData.lateDeduction;
                  updates.totalEarnings = updates.dailySalary;
                }
              } else if (leaveDoc.type === "early_leave") {
                updates.earlyLeave = false;
                updates.earlyCheckOut = false;
              }
              
              await updateDoc(doc(db, "logs", logDoc.id), updates);
            });
          }
        }
      }
    }

    try {
      await updateDoc(doc(db, "permissions", id), {
        status,
        updatedAt: new Date().toISOString(),
      });
      if (status === "approved" || status === "rejected") {
        const staffDoc = allStaff.find((s) => s.id === leaveDoc?.staffId);
        const staffName = staffDoc ? (staffDoc.nameKh || staffDoc.name) : "បុគ្គលិក";
        const statusKh = status === "approved" ? "អនុម័តយល់ព្រម (Approved) ✅" : "បដិសេធ (Rejected) ❌";
        const leaveTypeText = leaveDoc?.type === 'permission' ? 'សុំច្បាប់ (Permission)' : leaveDoc?.type === 'day_off' ? 'ឈប់សម្រាក (Day Off)' : leaveDoc?.type === 'late_checkin' ? 'សុំចូលធ្វើការយឺត (Late Check-in)' : leaveDoc?.type === 'early_leave' ? 'សុំចេញមុនម៉ោង (Early Leave)' : leaveDoc?.type;
        const msg = `📢 <b>លទ្ធផលសំណើសុំច្បាប់ (Leave Request ${status === "approved" ? "Approved" : "Rejected"})</b>\n<b>បុគ្គលិក:</b> ${staffName}\n<b>ប្រភេទ:</b> ${leaveTypeText}\n<b>កាលបរិច្ឆេទ:</b> ${leaveDoc?.date}\n<b>ស្ថានភាព:</b> ${statusKh}`;
        await sendTelegramNotification(msg, true);
        if (staffDoc?.telegramChatId) {
          await sendDirectTelegramMessage(
            staffDoc.telegramChatId,
            `📢 <b>លទ្ធផលសំណើសុំច្បាប់ (Leave Request ${status === "approved" ? "Approved ✅" : "Rejected ❌"})</b>\n<b>ប្រភេទ:</b> ${leaveTypeText}\n<b>កាលបរិច្ឆេទ:</b> ${leaveDoc?.date}\n<b>ស្ថានភាព:</b> ${statusKh}\n\n${status === "approved" ? "សំណើសុំច្បាប់របស់អ្នកត្រូវបានអនុម័តយល់ព្រម! (Your leave request has been approved!)" : "សូមទាក់ទងរដ្ឋបាលសម្រាប់ព័ត៌មានបន្ថែម។ (Please contact HR for more details)."}`
          );
        }
      }
      fetchLeaves();
    } catch (e) { console.error(e); }

  };

  const handleAddAbsent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!absentStaffId || !absentDate) return;
    
    let penalty = 0;
    const staffDoc = allStaff.find((s) => s.id === absentStaffId);
    if (staffDoc) {
      const expectedHours = getExpectedShiftDuration(
        absentDate,
        staffDoc.shiftStart,
        staffDoc.shiftEnd,
        (staffDoc as any).shiftOverrides,
        staffDoc.shift2Start,
        staffDoc.shift2End,
        staffDoc.breakHours
      );
      const daysInMonth = getDaysInMonth(parseISO(absentDate));
      const dailySalaryStatic = (staffDoc.monthlySalary || 0) / daysInMonth;
      let stdExpectedHours = Math.max(0, calculateShiftHours(staffDoc.shiftStart, staffDoc.shiftEnd) + calculateShiftHours(staffDoc.shift2Start, staffDoc.shift2End) - (staffDoc.breakHours || 0));
      if (stdExpectedHours === 0) stdExpectedHours = 8;
      const calculatedHourlyRate = staffDoc.monthlySalary ? (dailySalaryStatic / stdExpectedHours) : (staffDoc.hourlyRate || 0);
      penalty = (expectedHours || 0) * calculatedHourlyRate;
      if (isNaN(penalty)) penalty = 0;
    }

    try {
      const logData = {
        companyId: user?.companyId || "",
        staffId: absentStaffId,
        date: absentDate,
        timeIn: new Date(`${absentDate}T00:00:00Z`).toISOString(),
        timeOut: new Date(`${absentDate}T00:00:00Z`).toISOString(),
        status: "checked_out",
        late: false,
        lateCheckIn: false,
        earlyCheckIn: false,
        earlyLeave: false,
        earlyCheckOut: false,
        extraTime: false,
        regularHours: 0,
        overtimeHours: 0,
        dailySalary: -penalty,
        totalEarnings: -penalty,
        isAbsentRecord: true,
        note: "Marked Absent by Admin",
      };

      const q = query(
        collection(db, "logs"),
        where("companyId", "==", user?.companyId || ""),
        where("staffId", "==", absentStaffId),
        where("date", "==", absentDate)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docId = querySnapshot.docs[0].id;
        await updateDoc(doc(db, "logs", docId), logData);
        for (let i = 1; i < querySnapshot.docs.length; i++) {
          await deleteDoc(querySnapshot.docs[i].ref);
        }
      } else {
        await addDoc(collection(db, "logs"), logData);
      }
      
      fetchLeaves();
      setShowAbsentModal(false);
      setAbsentStaffId("");
      alert("Absent record added successfully");
    } catch (err) {
      console.error(err);
      alert("Error adding absent record");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t("requestLeave")}</h2>
            <p className="text-sm text-slate-500 font-medium">Manage permissions, day-offs, and absences</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <select 
            value={viewMode} 
            onChange={(e) => setViewMode(e.target.value as any)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 outline-none font-semibold text-sm text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-sm"
          >
            <option value="monthly">{t("monthly")}</option>
            <option value="daily">{t("daily")}</option>
          </select>
          {viewMode === "monthly" ? (
            <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 outline-none font-semibold text-sm text-slate-700 dark:text-slate-200 transition-all shadow-sm"/>
          ) : (
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 outline-none font-semibold text-sm text-slate-700 dark:text-slate-200 transition-all shadow-sm"/>
          )}
          <button onClick={() => setShowAbsentModal(true)} className="w-full sm:w-auto px-5 py-2.5 bg-rose-500 text-white rounded-lg text-sm font-bold hover:bg-rose-600 transition-colors shadow-sm flex items-center justify-center gap-2">
            <UserX className="w-4 h-4" />
            <span>{t("markAbsent")}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {filteredLeaves.map((leave, idx) => (
          <div key={`${leave.id}-${idx}`} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
             <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
                 <div className="w-48 shrink-0">
                   <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{allStaff.find(s => s.id === leave.staffId)?.name || 'Unknown'}</h3>
                   <div className="flex items-center gap-1 text-xs font-medium text-slate-500 mt-1">
                     <Clock className="w-3.5 h-3.5" />
                     {leave.date}
                   </div>
                 </div>
                 
                 <div className="flex items-center gap-2 text-xs w-32 shrink-0">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                      {leave.type === "permission" ? t("permission") : leave.type === "day_off" ? t("dayOff") : leave.type === "late_checkin" ? t("lateCheckinReq") : leave.type === "early_leave" ? t("earlyLeaveReq") : leave.type}
                    </span>
                 </div>
                 
                 {leave.reason && (
                    <div className="flex-1 min-w-0 text-xs text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md border border-slate-100 dark:border-slate-700/50 line-clamp-2">
                      "{leave.reason}"
                    </div>
                 )}
             </div>

             <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto mt-2 sm:mt-0 justify-between sm:justify-end">
                 <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm", 
                   leave.status === 'approved' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" :
                   leave.status === 'rejected' ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400" :
                   "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                 )}>{leave.status}</span>
                 
                 {leave.status === 'pending' && (
                   <div className="flex gap-2">
                     <button onClick={() => updateStatus(leave.id, 'approved')} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded-md text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors shadow-sm flex items-center gap-1"><Check className="w-3 h-3"/> {t("approve")}</button>
                     <button onClick={() => updateStatus(leave.id, 'rejected')} className="px-3 py-1.5 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 rounded-md text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors shadow-sm flex items-center gap-1"><X className="w-3 h-3"/> {t("reject")}</button>
                   </div>
                 )}
                 <button onClick={() => onDelete(leave.id, fetchLeaves)} className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 p-2 rounded-md transition-colors ml-1" title="Delete">
                    <Trash2 className="w-4 h-4" />
                 </button>
             </div>
          </div>
        ))}
        {filteredLeaves.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center text-slate-500 p-12 bg-slate-50 dark:bg-slate-800/30 rounded-xl border-dashed border-2 border-slate-200 dark:border-slate-700/50">
            <CalendarDays className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">No Requests Found</h3>
            <p className="text-sm font-medium text-slate-500">There are no leave or permission requests for this period.</p>
          </div>
        )}
      </div>

      {showAbsentModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-4 bg-slate-900/50 backdrop-blur-sm transition-all duration-300 overflow-hidden">
        <ScrollLock />
          <div className="bg-white dark:bg-slate-900 sm:border border-slate-200 dark:border-slate-800 sm:rounded-xl shadow-2xl max-w-sm w-full h-full sm:h-auto sm:max-h-[90vh] relative flex flex-col overflow-hidden">
            <div className="p-5 sm:p-8 pb-4 sm:pb-5 border-b border-slate-100 dark:border-slate-800 sm:border-white/40 sm:dark:border-slate-700/40 shrink-0 flex items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <UserX className="w-4 h-4" />
              </div>
              <h3 className="text-2xl font-display font-bold text-slate-800 dark:text-slate-100">{t("markAbsent")}</h3>
            </div>
            <form onSubmit={handleAddAbsent} className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t("staffMember")}</label>
                <select required value={absentStaffId} onChange={e => setAbsentStaffId(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 outline-none font-medium transition-all">
                  <option value="">{t("selectStaff")}</option>
                  {allStaff.map((s, idx) => <option key={`${s.id}-${idx}`} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Date</label>
                <input required type="date" value={absentDate} onChange={e => setAbsentDate(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 outline-none font-medium transition-all"/>
              </div>
              
              <div className="pt-4 sm:pt-6 mt-6 sm:mt-8 border-t border-slate-100 dark:border-slate-800 sm:border-white/40 sm:dark:border-slate-700/40 flex gap-3 pb-safe-bottom">
                <button type="button" onClick={() => setShowAbsentModal(false)} className="flex-1 p-3.5 px-4 font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">{t("cancel") || "Cancel"}</button>
                <button type="submit" className="flex-1 p-3.5 px-4 font-semibold text-white bg-rose-500 rounded-lg hover:bg-rose-600 transition-colors shadow-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StaffManager({
  onClearCategory,
  onDelete,
}: {
  onClearCategory: (cat: string) => void;
  onDelete: (id: string, cb: () => void) => void;
}) {
  const { user } = useAuthStore();
  const { settings } = useSettingsStore();
  const { t } = useTranslation();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<string | null>(null);
  const [qrStaffId, setQrStaffId] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [useOverrides, setUseOverrides] = useState(false);
  const [shiftOverrides, setShiftOverrides] = useState<any>({});
  const [viewMode, setViewMode] = useState<"grid" | "compact">("grid");
  const [formData, setFormData] = useState({
    name: "",
    nameKh: "",
    passcode: "",
    monthlySalary: 360,
    position: "",
    branch: "",
    shiftStart: "16:30",
    shift2Start: "",
    shift2End: "",
    shiftEnd: "00:00",
    breakHours: 0,
    bonus: 0,
  });

  useEffect(() => {
    if (!user?.companyId) return;
    const unsub = onSnapshot(
      query(collection(db, "staff"), where("companyId", "==", user.companyId)),
      (sn) => {
        setStaffList(sn.docs.map((d) => ({ id: d.id, ...d.data() }) as Staff).filter(s => s.role !== "admin").sort((a, b) => (a.passcode || "").localeCompare(b.passcode || "", undefined, { numeric: true })));
      }
    );
    return () => unsub();
  }, [user?.companyId]);

  

  const fetchStaff = async () => {};

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingId) {
      const planLimits: Record<string, number> = {
        'starter_monthly': 10,
        'starter_yearly': 10,
        'professional_monthly': 25,
        'professional_yearly': 25,
      };
      const subType = settings?.subscription?.type || '';
      const limit = planLimits[subType] || Infinity;
      
      if (staffList.length >= limit) {
        alert(`You have reached the maximum number of employees (${limit}) for your current plan. Please upgrade your subscription to add more staff.`);
        return;
      }
    }

    const dataToSave = {
      ...formData,
      companyId: user?.companyId || "",
      shiftOverrides: useOverrides ? shiftOverrides : null,
      hourlyRate: formData.monthlySalary / 240,
    };

    const empName = formData.nameKh ? `${formData.nameKh} (${formData.name})` : formData.name;

    const shiftStr = useOverrides ? 
      `Morning: ${shiftOverrides.morning?.start || '-'} to ${shiftOverrides.morning?.end || '-'}, Afternoon: ${shiftOverrides.afternoon?.start || '-'} to ${shiftOverrides.afternoon?.end || '-'}` :
      `${formData.shiftStart || '-'} to ${formData.shiftEnd || '-'}${formData.shift2Start ? `, ${formData.shift2Start} to ${formData.shift2End || '-'}` : ''}`;

    const messageParts = [
      editingId ? `✏️ <b>កែប្រែព័ត៌មានបុគ្គលិក (Employee Edited)</b>` : `👤 <b>បន្ថែមបុគ្គលិកថ្មី (New Employee Added)</b>`,
      `<b>ឈ្មោះ:</b> ${empName}`,
      `<b>តួនាទី:</b> ${formData.position || 'N/A'}`
    ];
    
    if (formData.branch && formData.branch !== 'N/A') {
      messageParts.push(`<b>សាខា:</b> ${formData.branch}`);
    }
    
    messageParts.push(`<b>ម៉ោងធ្វើការ (Shift):</b> ${shiftStr}`);
    messageParts.push(`<b>ប្រាក់ខែ:</b> ${formData.monthlySalary}/ខែ`);

    const finalMessage = messageParts.join('\n');

    if (editingId) {
      await updateDoc(doc(db, "staff", editingId), dataToSave);
      await sendTelegramNotification(finalMessage, true);
    } else {
      await addDoc(collection(db, "staff"), {
        ...dataToSave,
        role: "staff",
        createdAt: new Date().toISOString(),
      });
      await sendTelegramNotification(finalMessage, true);
    }

    setShowModal(false);
    setEditingId(null);
    fetchStaff();
  };

  const deleteStaff = (id: string) => {
    setStaffToDelete(id);
  };

  const confirmDeleteStaff = async () => {
    if (!staffToDelete) return;
    try {
      const deletedStaff = staffList.find(s => s.id === staffToDelete);
      await deleteDoc(doc(db, "staff", staffToDelete));
      
      if (deletedStaff) {
        const empName = deletedStaff.nameKh ? `${deletedStaff.nameKh} (${deletedStaff.name})` : deletedStaff.name;
        const deleteMsgParts = [
          `🗑 <b>លុบบុគ្គលិក (Employee Deleted)</b>`,
          `<b>ឈ្មោះ:</b> ${empName}`,
          `<b>តួនាទី:</b> ${deletedStaff.position || 'N/A'}`
        ];
        if (deletedStaff.branch && deletedStaff.branch !== 'N/A') {
          deleteMsgParts.push(`<b>សាខា:</b> ${deletedStaff.branch}`);
        }
        await sendTelegramNotification(deleteMsgParts.join('\n'), true);
      }
      
      fetchStaff();
      setStaffToDelete(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditStaff = (staff: Staff) => {
    setEditingId(staff.id);
    setUseOverrides(staff.shiftOverrides ? true : false);
    setShiftOverrides(staff.shiftOverrides || {});
    setFormData({
      name: staff.name,
      nameKh: staff.nameKh || "",
      passcode: staff.passcode,
      monthlySalary: staff.monthlySalary || (staff.hourlyRate || 0) * 240,
      position: staff.position || "",
      branch: staff.branch || "",
      shiftStart: staff.shiftStart || "16:30",
      shift2Start: staff.shift2Start || "",
      shift2End: staff.shift2End || "",
      shiftEnd: staff.shiftEnd || "00:00",
      breakHours: staff.breakHours || 0,
      bonus: staff.bonus || 0,
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-4 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm gap-4">
        <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mr-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("compact")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "compact" ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => onClearCategory("staff")}
            className="text-xs font-medium text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-md border border-rose-100 dark:border-rose-500/20 whitespace-nowrap transition-colors"
          >
            {t("clearData")}
          </button>
          <button
            onClick={() => {
              setEditingId(null);
              setUseOverrides(false);
              setShiftOverrides({});
              
              let maxCode = 0;
              for (const s of staffList) {
                const num = parseInt(s.passcode || "0", 10);
                if (!isNaN(num) && num > maxCode) {
                  maxCode = num;
                }
              }
              const nextPasscode = String(maxCode + 1).padStart(4, "0");
              setFormData({
                name: "",
                nameKh: "",
                passcode: nextPasscode,
                monthlySalary: 330,
                position: "",
                branch: "",
                shiftStart: "08:30",
                shift2Start: "",
                shift2End: "",
                shiftEnd: "17:30",
                breakHours: 0,
                bonus: 0,
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 text-sm transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> {t("addEmployee")}
          </button>
        </div>
      </div>

      <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6" : "flex flex-col gap-3 mt-6"}>
        {staffList.map((s, idx) => (
          viewMode === "grid" ? (
            <div
              key={`${s.id}-${idx}`}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    {s.avatar ? (
                      <img src={s.avatar} alt={s.name} className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-medium text-lg border border-slate-200 dark:border-slate-700 shrink-0">
                        {(i18n.language === "km" && s.nameKh ? s.nameKh : s.name).charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-base text-slate-900 dark:text-slate-100 leading-tight">
                        {i18n.language === "km" && s.nameKh ? s.nameKh : s.name}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 font-medium">PIN: {s.passcode}</span>
                        {s.branch && (
                          <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {s.branch}
                          </span>
                        )}
                        {s.telegramChatId && (
                          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-1" title={`Telegram Connected: ${s.telegramChatId}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            TG
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 mb-5 flex justify-between space-x-2 border border-slate-200 dark:border-slate-700/50">
                <div className="flex flex-col justify-center">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-0.5">
                    Salary
                  </div>
                  <div className="flex flex-col">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                      {formatCurrency(s.monthlySalary || (s.hourlyRate || 0) * 240, "USD")}<span className="text-xs text-slate-500 font-normal">/m</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {formatCurrency(s.monthlySalary || (s.hourlyRate || 0) * 240, "KHR", settings?.exchangeRate || 4000)}<span className="text-[10px]">/m</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-wrap">
                <button
                  onClick={() => {
                    const link = `${window.location.origin}/${settings?.slug || user?.companyId}/e/${s.id}`;
                    navigator.clipboard.writeText(link);
                    alert(`Copied link for ${s.name}: ${link}`);
                  }}
                  className="px-2.5 py-1.5 flex items-center justify-center flex-1 text-xs rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium transition-colors"
                  title="Copy personal login link"
                >
                  <Copy className="w-3.5 h-3.5 mr-1" /> Link
                </button>
                <button
                  onClick={() => {
                    setQrStaffId(s.id);
                    setShowQRModal(true);
                  }}
                  className="px-2.5 py-1.5 flex items-center justify-center flex-1 text-xs rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium transition-colors"
                  title="Print personal QR card"
                >
                  <Printer className="w-3.5 h-3.5 mr-1" /> QR
                </button>
                <button
                  onClick={() => handleEditStaff(s)}
                  className="px-2.5 py-1.5 flex items-center justify-center flex-1 text-xs rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 font-medium transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                </button>
                <button
                  onClick={() => deleteStaff(s.id)}
                  className="px-2.5 py-1.5 flex items-center justify-center flex-1 text-xs rounded-md bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 font-medium transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                </button>
              </div>
            </div>
          ) : (
            <div key={`${s.id}-${idx}`} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                {s.avatar ? (
                  <img src={s.avatar} alt={s.name} className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700 shrink-0">
                    {(i18n.language === "km" && s.nameKh ? s.nameKh : s.name).charAt(0)}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm">
                    {i18n.language === "km" && s.nameKh ? s.nameKh : s.name}
                    {s.branch && (
                      <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {s.branch}
                      </span>
                    )}
                    {s.telegramChatId && (
                      <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        TG
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-slate-500 font-medium">PIN: {s.passcode}</span>
                    <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(s.monthlySalary || (s.hourlyRate || 0) * 240, "USD")}/m</span>
                      <span className="text-[10px] text-slate-500">({formatCurrency(s.monthlySalary || (s.hourlyRate || 0) * 240, "KHR", settings?.exchangeRate || 4000)}/m)</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    const link = `${window.location.origin}/${settings?.slug || user?.companyId}/e/${s.id}`;
                    navigator.clipboard.writeText(link);
                    alert(`Copied link for ${s.name}: ${link}`);
                  }}
                  className="px-3 py-1.5 flex items-center justify-center text-xs rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium transition-colors whitespace-nowrap"
                  title="Copy link"
                >
                  <Copy className="w-3.5 h-3.5 sm:mr-1.5" /> <span className="hidden sm:inline">Link</span>
                </button>
                <button
                  onClick={() => {
                    setQrStaffId(s.id);
                    setShowQRModal(true);
                  }}
                  className="px-3 py-1.5 flex items-center justify-center text-xs rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium transition-colors whitespace-nowrap"
                  title="Print QR"
                >
                  <Printer className="w-3.5 h-3.5 sm:mr-1.5" /> <span className="hidden sm:inline">QR</span>
                </button>
                <button
                  onClick={() => handleEditStaff(s)}
                  className="px-3 py-1.5 flex items-center justify-center text-xs rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 font-medium transition-colors whitespace-nowrap"
                >
                  <Edit2 className="w-3.5 h-3.5 sm:mr-1.5" /> <span className="hidden sm:inline">Edit</span>
                </button>
                <button
                  onClick={() => deleteStaff(s.id)}
                  className="px-3 py-1.5 flex items-center justify-center text-xs rounded-md bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 font-medium transition-colors whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5 sm:mr-1.5" /> <span className="hidden sm:inline">Delete</span>
                </button>
              </div>
            </div>
          )
        ))}
      </div>

      {staffToDelete && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 overflow-hidden">
        <ScrollLock />
          <div className="bg-white dark:bg-slate-900 sm:border border-slate-200 dark:border-slate-800 sm:rounded-xl shadow-xl max-w-sm w-full relative flex flex-col p-6 sm:p-8">
            <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">
              {t("deleteConfirm")}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {t("deleteMessage")}
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStaffToDelete(null)}
                className="flex-1 py-2.5 px-4 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={confirmDeleteStaff}
                className="flex-1 py-2.5 px-4 text-sm font-medium rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors"
              >
                {t("delete")}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 overflow-hidden overscroll-none">
        <ScrollLock />
          <div className="bg-white dark:bg-slate-900 sm:border border-slate-200 dark:border-slate-800 sm:rounded-xl shadow-xl max-w-xl w-full h-full sm:h-auto sm:max-h-[90vh] relative flex flex-col overflow-hidden">
            <div className="p-5 sm:p-6 pb-4 sm:pb-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                {editingId ? "Edit Employee" : t("addEmployee")}
              </h3>
            </div>
            <form
              id="add-employee-form"
              onSubmit={handleAddStaff}
              className="p-5 sm:p-6 space-y-6 overflow-y-auto overflow-x-hidden overscroll-contain flex-1 custom-scrollbar"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300 ml-1">
                    {t("nameEnglish")}
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300 ml-1">
                    {t("nameKhmer")}
                  </label>
                  <input
                    type="text"
                    value={formData.nameKh}
                    onChange={(e) =>
                      setFormData({ ...formData, nameKh: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5 ml-1">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {t("passcodePin")}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
                        setFormData({ ...formData, passcode: randomPin });
                      }}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                    >
                      Generate
                    </button>
                  </div>
                  <input
                    required
                    type="text"
                    maxLength={4}
                    minLength={4}
                    value={formData.passcode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        passcode: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-800 dark:text-slate-200"
                    placeholder="e.g. 1234"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300 ml-1">
                    {t("monthlyBasicSalary")}
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={formData.monthlySalary}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        monthlySalary: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300 ml-1">
                    {t("branch")}
                  </label>
                  <input
                    type="text"
                    value={formData.branch}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        branch: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Position / Role
                  </label>
                  <input
                    type="text"
                    list="staff-positions"
                    value={formData.position}
                    placeholder="e.g. Manager, Cashier, Developer..."
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        position: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-800 dark:text-slate-200"
                  />
                  <datalist id="staff-positions">
                    {Array.from(new Set(staffList.map(s => s.position).filter(Boolean))).map(pos => (
                      <option key={pos} value={pos} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                <label className="flex items-center gap-2 text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300 ml-1">
                  <input
                    type="checkbox"
                    checked={useOverrides}
                    onChange={(e) => setUseOverrides(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500 border-slate-300 transition-all"
                  />
                  Custom Daily Shifts
                </label>

                {useOverrides ? (
                  <div className="space-y-3 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm p-4 rounded-xl border border-white/60 dark:border-slate-700/50 shadow-inner">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (day, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col gap-2 pb-3 mb-3 border-b border-white/40 dark:border-slate-700/40 last:border-0 last:pb-0 last:mb-0"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <label className="flex items-center gap-2 font-medium w-full sm:w-20 text-sm">
                              <input
                                type="checkbox"
                                checked={shiftOverrides[idx]?.active ?? true}
                                onChange={(e) =>
                                  setShiftOverrides({
                                    ...shiftOverrides,
                                    [idx]: {
                                      ...(shiftOverrides[idx] || {
                                        start: formData.shiftStart,
                                        end: formData.shiftEnd,
                                        start2: formData.shift2Start || "",
                                        end2: formData.shift2End || ""
                                      }),
                                      active: e.target.checked,
                                    },
                                  })
                                }
                                className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500 border-slate-300"
                              />
                              {day}
                            </label>
                            <div className="flex items-center gap-2 flex-1 w-full">
                              <input
                                type="time"
                                value={
                                  shiftOverrides[idx]?.start ??
                                  formData.shiftStart
                                }
                                disabled={!(shiftOverrides[idx]?.active ?? true)}
                                onChange={(e) =>
                                  setShiftOverrides({
                                    ...shiftOverrides,
                                    [idx]: {
                                      ...(shiftOverrides[idx] || {
                                        end: formData.shiftEnd,
                                        active: true,
                                      }),
                                      start: e.target.value,
                                    },
                                  })
                                }
                                className="flex-1 min-w-0 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all disabled:opacity-50 shadow-sm text-slate-800 dark:text-slate-200"
                              />
                              <span className="text-slate-400 flex-shrink-0 font-medium text-xs">
                                -
                              </span>
                              <input
                                type="time"
                                value={
                                  shiftOverrides[idx]?.end ?? formData.shiftEnd
                                }
                                disabled={!(shiftOverrides[idx]?.active ?? true)}
                                onChange={(e) =>
                                  setShiftOverrides({
                                    ...shiftOverrides,
                                    [idx]: {
                                      ...(shiftOverrides[idx] || {
                                        start: formData.shiftStart,
                                        active: true,
                                      }),
                                      end: e.target.value,
                                    },
                                  })
                                }
                                className="flex-1 min-w-0 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all disabled:opacity-50 shadow-sm text-slate-800 dark:text-slate-200"
                              />
                            </div>
                          </div>
                          {(shiftOverrides[idx]?.active ?? true) && (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 pl-0 sm:pl-[5.75rem]">
                              <div className="flex items-center gap-2 flex-1 w-full">
                                <input
                                  type="time"
                                  value={
                                    shiftOverrides[idx]?.start2 ?? formData.shift2Start ?? ""
                                  }
                                  disabled={!(shiftOverrides[idx]?.active ?? true)}
                                  onChange={(e) =>
                                    setShiftOverrides({
                                      ...shiftOverrides,
                                      [idx]: {
                                        ...(shiftOverrides[idx] || {
                                          start: formData.shiftStart,
                                          end: formData.shiftEnd,
                                          active: true,
                                        }),
                                        start2: e.target.value,
                                      },
                                    })
                                  }
                                  className="flex-1 min-w-0 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all disabled:opacity-50 shadow-sm text-slate-800 dark:text-slate-200"
                                />
                                <span className="text-slate-400 flex-shrink-0 font-medium text-xs">
                                  -
                                </span>
                                <input
                                  type="time"
                                  value={
                                    shiftOverrides[idx]?.end2 ?? formData.shift2End ?? ""
                                  }
                                  disabled={!(shiftOverrides[idx]?.active ?? true)}
                                  onChange={(e) =>
                                    setShiftOverrides({
                                      ...shiftOverrides,
                                      [idx]: {
                                        ...(shiftOverrides[idx] || {
                                          start: formData.shiftStart,
                                          end: formData.shiftEnd,
                                          active: true,
                                        }),
                                        end2: e.target.value,
                                      },
                                    })
                                  }
                                  className="flex-1 min-w-0 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all disabled:opacity-50 shadow-sm text-slate-800 dark:text-slate-200"
                                />
                              </div>
                            </div>
                          )}
                          {(shiftOverrides[idx]?.active ?? true) && (
                            <div className="flex-1 min-w-[120px] mt-2 sm:mt-0">
                               <div className="flex items-center">
                                <span className="text-[11px] font-semibold text-slate-500 mr-2 whitespace-nowrap">Break:</span>
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  value={shiftOverrides[idx]?.breakHours ?? formData.breakHours ?? ""}
                                  disabled={!(shiftOverrides[idx]?.active ?? true)}
                                  onChange={(e) =>
                                    setShiftOverrides({
                                      ...shiftOverrides,
                                      [idx]: {
                                        ...(shiftOverrides[idx] || {
                                          start: formData.shiftStart,
                                          end: formData.shiftEnd,
                                          active: true,
                                        }),
                                        breakHours: Number(e.target.value) || 0,
                                      },
                                    })
                                  }
                                  placeholder="e.g. 1"
                                  className="w-16 px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-center focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all disabled:opacity-50 shadow-sm text-slate-800 dark:text-slate-200"
                                />
                                <span className="text-[11px] text-slate-400 ml-1">h</span>
                               </div>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2 sm:mt-0 justify-end w-full">
                            <span className="text-xs font-bold text-slate-500 mr-2">
                              {((shiftOverrides[idx]?.active ?? true) ? (
                                Math.max(0, calculateShiftHours(shiftOverrides[idx]?.start ?? formData.shiftStart, shiftOverrides[idx]?.end ?? formData.shiftEnd) + 
                                calculateShiftHours(shiftOverrides[idx]?.start2 ?? formData.shift2Start ?? "", shiftOverrides[idx]?.end2 ?? formData.shift2End ?? "") - 
                                (shiftOverrides[idx]?.breakHours ?? formData.breakHours ?? 0))
                              ) : 0).toFixed(1)}h
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const dayOverride = shiftOverrides[idx] || {
                                  start: formData.shiftStart,
                                  end: formData.shiftEnd,
                                  start2: formData.shift2Start || "",
                                  end2: formData.shift2End || "",
                                  active: true,
                                  breakHours: formData.breakHours || 0
                                };
                                const newOverrides = { ...shiftOverrides };
                                [0,1,2,3,4,5,6].forEach(i => {
                                  if (i !== idx) {
                                    newOverrides[i] = { ...dayOverride };
                                  }
                                });
                                setShiftOverrides(newOverrides);
                              }}
                              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                            >
                              Apply to All
                            </button>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300 ml-1">
                          {t("shiftStart")}
                        </label>
                        <input
                          type="time"
                          required
                          value={formData.shiftStart}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              shiftStart: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300 ml-1">
                          {t("shiftEnd")}
                        </label>
                        <input
                          type="time"
                          required
                          value={formData.shiftEnd}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              shiftEnd: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200 shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                      <div>
                        <label className="block text-[13px] font-semibold mb-2 text-slate-700 dark:text-slate-300 ml-1">
                          Second Shift Start{" "}
                          <span className="opacity-60">(Optional)</span>
                        </label>
                        <input
                          type="time"
                          value={formData.shift2Start || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              shift2Start: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-semibold mb-2 text-slate-700 dark:text-slate-300 ml-1">
                          Second Shift End{" "}
                          <span className="opacity-60">(Optional)</span>
                        </label>
                        <input
                          type="time"
                          value={formData.shift2End || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              shift2End: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200 shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                        <label className="block text-[13px] font-semibold mb-2 text-slate-700 dark:text-slate-300 ml-1">
                          Break Hours{" "}
                          <span className="opacity-60">(Optional)</span>
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={formData.breakHours || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              breakHours: Number(e.target.value) || 0,
                            })
                          }
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200 shadow-sm"
                          placeholder="e.g. 1.5"
                        />
                    </div>
                    <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/30 flex items-center justify-between">
                      <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Total Work Hours</span>
                      <span className="font-bold text-indigo-700 dark:text-indigo-300">
                        {Math.max(0, calculateShiftHours(formData.shiftStart, formData.shiftEnd) + calculateShiftHours(formData.shift2Start, formData.shift2End) - (formData.breakHours || 0)).toFixed(1)}h / day
                      </span>
                    </div>
                  </>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300 ml-1">
                  {t("monthlyBonusSetup")}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.bonus}
                  onChange={(e) =>
                    setFormData({ ...formData, bonus: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200 shadow-sm"
                />
              </div>
            </form>
            <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0 flex gap-3 sm:gap-4 mt-auto">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                }}
                className="flex-1 py-2.5 px-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm text-sm"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                form="add-employee-form"
                className="flex-1 py-2.5 px-4 font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm text-sm"
              >
                {t("save")}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* QR Code Modal Overlay for specific staff */}
      <AnimatePresence>
        {showQRModal && qrStaffId && createPortal(
          <div key="staff-qr-modal-wrapper" className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 print:p-0 print:bg-white print:block">
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
              <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-2xl relative flex flex-col items-center print:rounded-none print:shadow-none print:border-none print:p-0 print:h-full print:w-full overflow-y-auto hide-scrollbar">
                <button
                  onClick={() => { setShowQRModal(false); setQrStaffId(null); }}
                  className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium print:hidden"
                >
                  x
                </button>
                <div className="w-full pt-4 print:pt-0 print:h-full">
                  <QRPrintCard
                    companyCode={qrStaffId.slice(0, 8)}
                    loginUrl={`${window.location.origin}/${settings?.slug || user?.companyId}/e/${qrStaffId}`}
                    companyName={staffList.find(s => s.id === qrStaffId)?.name || "Employee"}
                  />
                </div>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>
      <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}

function SettingsManager({
  onClearCategory,
  onResetAll,
}: {
  onClearCategory: (name: string) => void;
  onResetAll: () => void;
}) {
  const { user } = useAuthStore();
  const { settings, setSettings } = useSettingsStore();
  const [rate, setRate] = useState(settings.exchangeRate?.toString() || "4000");
  const [officeLat, setOfficeLat] = useState(
    settings.officeLat?.toString() || "11.567048",
  );
  const [officeLng, setOfficeLng] = useState(
    settings.officeLng?.toString() || "104.893430",
  );
  const [officeRadius, setOfficeRadius] = useState(
    settings.officeRadius?.toString() || "100",
  );
  const [gracePeriod, setGracePeriod] = useState(
    settings.gracePeriodMinutes?.toString() || "15",
  );
  const [overtimeGrace, setOvertimeGrace] = useState(
    settings.overtimeGraceMinutes?.toString() || "0",
  );
  const [overtimeRateType, setOvertimeRateType] = useState<'multiplier' | 'fixed'>(
    settings.overtimeRateType || 'multiplier',
  );
  const [overtimeRateValue, setOvertimeRateValue] = useState(
    settings.overtimeRateValue?.toString() || settings.defaultOvertimeRate?.toString() || "1.5",
  );
  const [lateDeduction, setLateDeduction] = useState(
    settings.lateDeductionPerHour?.toString() || "",
  );
  const [telegramChatId, setTelegramChatId] = useState(
    settings.telegramChatId || "",
  );
  const [telegramAdminChatId, setTelegramAdminChatId] = useState(
    settings.telegramAdminChatId || "",
  );
  const { t } = useTranslation();

  const [companyCode, setCompanyCode] = useState("");
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [slugCopied, setSlugCopied] = useState(false);
  const [slugError, setSlugError] = useState("");
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugSuccessMsg, setSlugSuccessMsg] = useState("");

  const updateSettingsDb = async (newSettings: Partial<Settings>) => {
    if (user?.companyId) {
      await updateDoc(
        doc(db, "companies_settings", user.companyId),
        newSettings,
      );
    }
  };

  const validateAndSaveSlug = async (targetSlug: string) => {
    const cleaned = targetSlug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
    if (!cleaned) return;

    if (cleaned.length < 3) {
      setSlugError("Workspace URL slug must be at least 3 characters.");
      setSlugSuccessMsg("");
      return;
    }

    const RESERVED_SLUGS = ['login', 'signup', 'admin', 'employee', 'e', 'api', 'public', 'system-admin', 'setup-super-admin', 'dashboard', 'settings', 'user'];
    if (RESERVED_SLUGS.includes(cleaned)) {
      setSlugError(`'${cleaned}' is a reserved system keyword. Please pick another workspace URL name.`);
      setSlugSuccessMsg("");
      return;
    }

    setSlugChecking(true);
    setSlugError("");
    setSlugSuccessMsg("");

    try {
      const q = query(collection(db, "companies_settings"), where("slug", "==", cleaned));
      const snaps = await getDocs(q);
      
      const takenByOther = snaps.docs.some(docSnap => docSnap.id !== user?.companyId);

      if (takenByOther) {
        setSlugError(`The workspace URL name '${cleaned}' is already chosen by another user/company. Please choose a different workspace URL name.`);
        setSlugChecking(false);
        return;
      }

      await updateSettingsDb({ slug: cleaned });
      if (useAuthStore.getState().setCompanySlug) {
        useAuthStore.getState().setCompanySlug(cleaned);
      }
      setSlugSuccessMsg(`Workspace URL updated! Unique URL: ${window.location.host}/${cleaned}`);
    } catch (err) {
      console.error("Error saving slug", err);
    } finally {
      setSlugChecking(false);
    }
  };

  useEffect(() => {
    // Fetch company code and slug
    if (user?.companyId) {
      getDoc(doc(db, "companies_settings", user.companyId)).then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setCompanyCode(data.companyCode || "");
          let currentSlug = data.slug;
          if (!currentSlug && data.companyName) {
            currentSlug = data.companyName.toLowerCase().trim().replace(/[^a-z0-9]/g, '') || data.companyCode?.toLowerCase();
            updateDoc(doc(db, "companies_settings", user.companyId), { slug: currentSlug });
          }
          setWorkspaceSlug(currentSlug || "");
        }
      });
    }
  }, [user]);

  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [shiftDate, setShiftDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timeInTime, setTimeInTime] = useState("");
  const [timeOutTime, setTimeOutTime] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getDocs(
      query(
        collection(db, "staff"),
        where("companyId", "==", user?.companyId || ""),
      ),
    ).then((sn) => {
      setStaff(sn.docs.map((d) => ({ id: d.id, ...d.data() }) as Staff).filter(s => s.role !== "admin").sort((a, b) => (a.passcode || "").localeCompare(b.passcode || "", undefined, { numeric: true })));
    });
  }, []);

  useEffect(() => {
    const fetchLog = async () => {
      // If only single date is selected (or no end date), fetch existing to prepopulate
      if (selectedStaff && shiftDate && !endDate) {
        const q = query(
          collection(db, "logs"),
          where("companyId", "==", user?.companyId || ""),
          where("staffId", "==", selectedStaff),
          where("date", "==", shiftDate),
        );
        const sn = await getDocs(q);
        if (!sn.empty) {
          const log = sn.docs[0].data();
          setTimeInTime(
            log.timeIn ? new Date(log.timeIn).toISOString().slice(11, 16) : "",
          );
          setTimeOutTime(
            log.timeOut
              ? new Date(log.timeOut).toISOString().slice(11, 16)
              : "",
          );
          setSaveMessage("Found existing record. Ready to edit.");
        } else {
          setTimeInTime("");
          setTimeOutTime("");
          setSaveMessage(
            "No record found for this date. Will create new shift.",
          );
        }
      } else if (selectedStaff && shiftDate && endDate) {
        setSaveMessage("Will create or update shifts for the date range.");
      } else {
        setSaveMessage("");
      }
    };
    fetchLog();
  }, [selectedStaff, shiftDate, endDate]);

  const handleSaveShift = async () => {
    if (!selectedStaff || !shiftDate || !timeInTime || !timeOutTime) return;

    setIsSaving(true);
    setSaveMessage("Saving...");
    const staffDoc = staff.find((s) => s.id === selectedStaff);
    if (!staffDoc) {
      setIsSaving(false);
      return;
    }

    try {
      const datesToProcess = [];
      let current = new Date(shiftDate);
      const end = endDate ? new Date(endDate) : new Date(shiftDate);

      while (current <= end) {
        datesToProcess.push(current.toISOString().slice(0, 10));
        current.setDate(current.getDate() + 1);
      }

      for (const date of datesToProcess) {
        // Construct timeIn date
        const tInDate = new Date(`${date}T${timeInTime}:00`);
        // If timeOutTime is smaller than timeInTime, assume it's next day
        const tOutDate = new Date(`${date}T${timeOutTime}:00`);
        if (tOutDate < tInDate) {
          tOutDate.setDate(tOutDate.getDate() + 1);
        }

        const tIn = tInDate.getTime();
        const tOut = tOutDate.getTime();
        let durationHours = Math.max(0, (tOut - tIn) / (1000 * 60 * 60));
        if (staffDoc && !staffDoc.shift2Start) {
           const targetDay = tInDate.getDay();
           const { breakHours } = getConfiguredShiftTimes(targetDay, staffDoc.shiftStart, staffDoc.shiftEnd, (staffDoc as any).shiftOverrides, staffDoc.shift2Start, staffDoc.shift2End, staffDoc.breakHours);
           if (breakHours) {
               durationHours = Math.max(0, durationHours - breakHours);
           }
        }

        // Extended logic for statuses
        const statuses = calculateShiftStatus(
          tInDate,
          tOutDate,
          staffDoc.shiftStart,
          staffDoc.shiftEnd,
          (staffDoc as any).shiftOverrides,
          null,
          null,
          staffDoc.shift2Start,
          staffDoc.shift2End,
          settings?.gracePeriodMinutes || 0,
          staffDoc.breakHours
        );
        const lateCheckIn = statuses.lateCheckIn;
        const earlyCheckIn = statuses.earlyCheckIn;
        const earlyCheckOut = statuses.isEarlyCheckOut;
        const extraTime = statuses.isExtraTime;
        const baseHours = statuses.shiftDurationHours;

        const overtimeGraceHours = (settings?.overtimeGraceMinutes || 0) / 60;
        const extraHours = baseHours === 0 ? durationHours : ((statuses.extraMinutes || 0) / 60);
        const overtimeHours = baseHours === 0 ? durationHours : (extraHours >= overtimeGraceHours ? extraHours : 0);
        const regularHours = baseHours === 0 ? 0 : Math.max(0, Math.min(baseHours, durationHours - extraHours));
        
        const lateMinutes = statuses.lateMinutes || 0;
        
        const daysInMonth = getDaysInMonth(parseISO(date));
        const dailySalaryBase = staffDoc.monthlySalary ? (staffDoc.monthlySalary / daysInMonth) : (baseHours * (staffDoc.hourlyRate || 0));
        const calculatedHourlyRate = getCalculatedHourlyRate(staffDoc, date);
        const otPayAmount = calculateOvertimePay(overtimeHours, calculatedHourlyRate, settings || undefined);
        const unpenalizedSalary = baseHours > 0 ? ((regularHours / baseHours) * dailySalaryBase) + otPayAmount : dailySalaryBase + otPayAmount;
        
        const lateDeductionAmount = baseHours === 0 ? 0 : (lateMinutes / 60) * (settings?.lateDeductionPerHour ?? (calculatedHourlyRate || 0)) || 0;
        const dailySalary = unpenalizedSalary - lateDeductionAmount;

        const late = lateCheckIn;

        // Check if log exists
        const q = query(
          collection(db, "logs"),
          where("companyId", "==", user?.companyId || ""),
          where("staffId", "==", selectedStaff),
          where("date", "==", date),
        );
        const sn = await getDocs(q);

        if (!sn.empty) {
          const docId = sn.docs[0].id;
          const existingData = sn.docs[0].data();

          await updateDoc(doc(db, "logs", docId), {
            timeIn: tInDate.toISOString(),
            timeOut: tOutDate.toISOString(),
            regularHours,
            overtimeHours,
            late,
            lateCheckIn,
            earlyCheckIn,
            earlyCheckOut,
            extraTime,
            lateMinutes,
            dailySalary,
            lateDeduction: lateDeductionAmount,

            totalEarnings: dailySalary,
          });
        } else {
          await addDoc(collection(db, "logs"), {
            companyId: user?.companyId || "",
            staffId: selectedStaff,
            date,
            timeIn: tInDate.toISOString(),
            timeOut: tOutDate.toISOString(),
            regularHours,
            overtimeHours,
            dailySalary,
            lateDeduction: lateDeductionAmount,

            totalEarnings: dailySalary,
            status: "checked_out",
            late,
            lateCheckIn,
            earlyCheckIn,
            earlyCheckOut,
            extraTime,
          });
        }
      }
      setSaveMessage("Shift(s) saved successfully!");
    } catch (e) {
      console.error(e);
      setSaveMessage("Error saving shift(s).");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <PayrollVisibilitySettings
        settings={settings}
        onUpdateSettings={async (newPartial) => {
          setSettings({ ...settings, ...newPartial });
          await updateSettingsDb(newPartial);
        }}
      />

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-slate-100">
            {t("generalSettings")}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">{t("generalSettings")}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 mb-6 shadow-sm space-y-6 mt-6">
          <h3 className="font-bold text-lg border-b border-white/40 dark:border-slate-700/40 pb-3 text-slate-800 dark:text-slate-200">{t("companyIdentity")}</h3>
          <div className="space-y-6 max-w-md">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">Workspace Domain URL</label>
              <div className="flex items-center gap-2">
                <div className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-sm text-slate-800 dark:text-slate-200 truncate flex items-center justify-between shadow-sm">
                  <span className="truncate">{window.location.host}/{workspaceSlug || companyCode.toLowerCase()}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const link = `${window.location.protocol}//${window.location.host}/${workspaceSlug || companyCode.toLowerCase()}`;
                      navigator.clipboard.writeText(link);
                      setSlugCopied(true);
                      setTimeout(() => setSlugCopied(false), 2000);
                    }}
                    className="p-1.5 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors text-indigo-600 dark:text-indigo-400 shrink-0 ml-2"
                    title="Copy Link"
                  >
                    {slugCopied ? "✓ Copied!" : "Copy Link"}
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Employees and admins can access this workspace directly at <span className="font-semibold text-slate-700 dark:text-slate-300">{window.location.host}/{workspaceSlug || companyCode.toLowerCase()}</span>
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 ml-1">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Workspace URL Slug</label>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{window.location.host}/{workspaceSlug || 'workspace'}</span>
              </div>
              <div className={`flex items-center gap-1.5 bg-white dark:bg-slate-950 border rounded-xl px-4 py-2.5 shadow-sm transition-all ${
                slugError ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20' : slugSuccessMsg ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20' : 'border-white/60 dark:border-slate-700/50'
              }`}>
                <span className="text-slate-400 font-medium text-sm select-none truncate max-w-[120px] sm:max-w-none">{window.location.host}/</span>
                <input
                  type="text"
                  value={workspaceSlug}
                  onChange={(e) => {
                    const cleaned = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                    setWorkspaceSlug(cleaned);
                    setSlugError("");
                    setSlugSuccessMsg("");
                  }}
                  onBlur={(e) => {
                    validateAndSaveSlug(e.target.value);
                  }}
                  className="w-full bg-transparent focus:outline-none font-bold text-slate-800 dark:text-slate-100 text-sm"
                  placeholder="usercompanyname"
                />
                {slugChecking && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin shrink-0" />}
              </div>
              {slugError && (
                <div className="mt-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{slugError}</span>
                </div>
              )}
              {slugSuccessMsg && !slugError && (
                <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{slugSuccessMsg}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">{t("workspaceCode")}</label>
              <div className="flex items-center gap-2">
                <div className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl font-mono text-lg text-slate-800 dark:text-slate-200 select-all">
                  {companyCode || "Fetching..."}
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {t("provideCodeToEmployees")}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">{t("companyName")}</label>
              <input
                type="text"
                value={settings.companyName || ""}
                onChange={(e) => {
                  setSettings({ ...settings, companyName: e.target.value });
                }}
                onBlur={(e) => {
                  updateSettingsDb({ companyName: e.target.value });
                }}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200 shadow-sm"
                placeholder="e.g. My Company"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                Company Logo
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="shrink-0">
                  <div className="w-28 h-28 flex items-center justify-center overflow-visible">
                    <img
                      src={settings.logoUrl || "/logo.png"}
                      alt="Logo"
                      className="w-full h-full object-contain drop-shadow-md rounded-2xl"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          alert(
                            "Logo image is too large. Please upload an image under 10MB.",
                          );
                          return;
                        }
                        try {
                          const base64Str = await compressImage(file);
                          setSettings({ ...settings, logoUrl: base64Str });
                          updateSettingsDb({ logoUrl: base64Str });
                        } catch (error) {
                          console.error("Failed to compress logo", error);
                          alert("Failed to process logo image.");
                        }
                      }
                    }}
                    className="w-full text-sm block text-slate-500 font-medium file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-800 dark:file:text-blue-400 dark:hover:file:bg-slate-700 cursor-pointer transition-colors"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Maximum file size is 10MB. Use a square shape.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 mb-6 shadow-sm space-y-6">
          <h3 className="font-bold text-lg border-b border-white/40 dark:border-slate-700/40 pb-3 text-slate-800 dark:text-slate-200">
            System Configuration
          </h3>

          <div className="space-y-6 max-w-md">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                {t("exchangeRate")}
              </label>
              <input
                type="number"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                onBlur={() => {
                  setSettings({ ...settings, exchangeRate: Number(rate) });
                  updateSettingsDb({ exchangeRate: Number(rate) });
                }}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200 shadow-sm"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  Office Location (Click map to set)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          const lat = position.coords.latitude;
                          const lng = position.coords.longitude;
                          setOfficeLat(lat.toString());
                          setOfficeLng(lng.toString());
                          setSettings({
                            ...settings,
                            officeLat: lat,
                            officeLng: lng,
                          });
                          updateSettingsDb({
                            officeLat: lat,
                            officeLng: lng,
                          });
                        },
                                                (error) => {
                          console.warn("Geolocation failed, using IP fallback", error.message);
                          fetch('https://get.geojs.io/v1/ip/geo.json')
                            .then(res => {
                              if (!res.ok) throw new Error('geojs limit');
                              return res.json();
                            })
                            .then(data => {
                              if (data.latitude && data.longitude) {
                                setSettings({
                                  ...settings,
                                  officeLat: parseFloat(data.latitude),
                                  officeLng: parseFloat(data.longitude),
                                });
                                updateSettingsDb({
                                  officeLat: parseFloat(data.latitude),
                                  officeLng: parseFloat(data.longitude),
                                });
                              }
                            })
                            .catch(err => {
                               console.warn("IP fallback failed", err.message);
                            });
                        },
                        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                      );
                    } else {
                      alert("Geolocation is not supported by this browser.");
                    }
                  }}
                  className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-full font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center gap-1.5 border border-indigo-100 dark:border-indigo-800"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Fetch Current
                </button>
              </div>
              <LocationPicker 
                lat={parseFloat(officeLat) || 11.5564} 
                lng={parseFloat(officeLng) || 104.9282}
                onChange={(lat, lng) => {
                  setOfficeLat(lat.toString());
                  setOfficeLng(lng.toString());
                  setSettings({
                    ...settings,
                    officeLat: lat,
                    officeLng: lng,
                  });
                  updateSettingsDb({
                    officeLat: lat,
                    officeLng: lng,
                  });
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                  Office Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={officeLat}
                  onChange={(e) => setOfficeLat(e.target.value)}
                  onBlur={() => {
                    setSettings({
                      ...settings,
                      officeLat: parseFloat(officeLat),
                    });
                    updateSettingsDb({ officeLat: parseFloat(officeLat) });
                  }}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200 shadow-sm"
                  placeholder="e.g. 11.567048"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                  Office Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={officeLng}
                  onChange={(e) => setOfficeLng(e.target.value)}
                  onBlur={() => {
                    setSettings({
                      ...settings,
                      officeLng: parseFloat(officeLng),
                    });
                    updateSettingsDb({ officeLng: parseFloat(officeLng) });
                  }}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200 shadow-sm"
                  placeholder="e.g. 104.893430"
                />
              </div>
            </div>

            <div className="flex justify-end mt-1">
              <button
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        setOfficeLat(position.coords.latitude.toString());
                        setOfficeLng(position.coords.longitude.toString());
                        setSettings({
                          ...settings,
                          officeLat: position.coords.latitude,
                          officeLng: position.coords.longitude,
                        });
                        updateSettingsDb({
                          officeLat: position.coords.latitude,
                          officeLng: position.coords.longitude,
                        });
                      },
                                            (error) => {
                        console.warn("Geolocation failed, using IP fallback", error.message);
                        fetch('https://get.geojs.io/v1/ip/geo.json')
                          .then(res => {
                            if (!res.ok) throw new Error('geojs rate limit');
                            return res.json();
                          })
                          .then(data => {
                            if (data.latitude && data.longitude) {
                              setSettings({
                                ...settings,
                                officeLat: parseFloat(data.latitude),
                                officeLng: parseFloat(data.longitude),
                              });
                              updateSettingsDb({
                                officeLat: parseFloat(data.latitude),
                                officeLng: parseFloat(data.longitude),
                              });
                            }
                          })
                          .catch(err => {
                            console.warn("IP fallback failed", err.message);
                          });
                      },
                      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                    );
                  }
                }}
                className="text-[13px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-[1rem] transition-colors inline-block border border-indigo-100 dark:border-indigo-900/50"
              >
                Fetch Current Location
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                  Require Geolocation
                </label>
                <select
                  value={settings.requireGeolocation || 'NONE'}
                  onChange={(e) => {
                    const val = e.target.value as 'NONE' | 'CHECKIN' | 'CHECKOUT' | 'BOTH';
                    setSettings({ ...settings, requireGeolocation: val });
                    updateSettingsDb({ requireGeolocation: val });
                  }}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200 shadow-sm"
                >
                  <option value="NONE">Not Required</option>
                  <option value="CHECKIN">Required for Check-in only</option>
                  <option value="CHECKOUT">Required for Check-out only</option>
                  <option value="BOTH">Required for Both</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                  Require Photo
                </label>
                <select
                  value={settings.requirePhoto || 'NONE'}
                  onChange={(e) => {
                    const val = e.target.value as 'NONE' | 'CHECKIN' | 'CHECKOUT' | 'BOTH';
                    setSettings({ ...settings, requirePhoto: val });
                    updateSettingsDb({ requirePhoto: val });
                  }}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200 shadow-sm"
                >
                  <option value="NONE">Not Required</option>
                  <option value="CHECKIN">Required for Check-in only</option>
                  <option value="CHECKOUT">Required for Check-out only</option>
                  <option value="BOTH">Required for Both</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">{t("radiusMeters")}</label>
                <input
                  type="number"
                  step="1"
                  value={officeRadius}
                  onChange={(e) => setOfficeRadius(e.target.value)}
                  onBlur={() => {
                    setSettings({
                      ...settings,
                      officeRadius: parseInt(officeRadius),
                    });
                    updateSettingsDb({ officeRadius: parseInt(officeRadius) });
                  }}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200 shadow-sm"
                  placeholder="100"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                  Late Grace (min)
                </label>
                <input
                  type="number"
                  step="1"
                  value={gracePeriod}
                  onChange={(e) => setGracePeriod(e.target.value)}
                  onBlur={() => {
                    setSettings({
                      ...settings,
                      gracePeriodMinutes: parseInt(gracePeriod),
                    });
                    updateSettingsDb({
                      gracePeriodMinutes: parseInt(gracePeriod),
                    });
                  }}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200 shadow-sm"
                  placeholder="15"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                  Overtime Grace (min)
                </label>
                <input
                  type="number"
                  step="1"
                  value={overtimeGrace}
                  onChange={(e) => setOvertimeGrace(e.target.value)}
                  onBlur={() => {
                    setSettings({
                      ...settings,
                      overtimeGraceMinutes: parseInt(overtimeGrace) || 0,
                    });
                    updateSettingsDb({
                      overtimeGraceMinutes: parseInt(overtimeGrace) || 0,
                    });
                  }}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200 shadow-sm"
                  placeholder="30"
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                  Overtime Pay Type
                </label>
                <select
                  value={overtimeRateType}
                  onChange={(e) => {
                    const newType = e.target.value as 'multiplier' | 'fixed';
                    setOvertimeRateType(newType);
                    setSettings({ ...settings, overtimeRateType: newType });
                    updateSettingsDb({ overtimeRateType: newType });
                  }}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200 shadow-sm"
                >
                  <option value="multiplier">Multiplier (e.g. 1.5x Hourly Rate)</option>
                  <option value="fixed">Fixed Amount per Hour (e.g. $1.5/hr)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                  {overtimeRateType === 'multiplier' ? 'Multiplier Value (e.g. 1.5)' : 'Fixed Amount ($)'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={overtimeRateValue}
                  onChange={(e) => setOvertimeRateValue(e.target.value)}
                  onBlur={() => {
                    const val = parseFloat(overtimeRateValue) || 0;
                    setSettings({ ...settings, overtimeRateValue: val });
                    updateSettingsDb({ overtimeRateValue: val });
                  }}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200 shadow-sm"
                  placeholder={overtimeRateType === 'multiplier' ? "1.5" : "2.00"}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                Late Deduct per Hour (Optional)
              </label>
              <input
                type="number"
                step="0.01"
                value={lateDeduction}
                onChange={(e) => setLateDeduction(e.target.value)}
                onBlur={() => {
                  setSettings({
                    ...settings,
                    lateDeductionPerHour: lateDeduction ? Number(lateDeduction) : null,
                  });
                  updateSettingsDb({
                    lateDeductionPerHour: lateDeduction ? Number(lateDeduction) : null,
                  });
                }}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200 shadow-sm"
                placeholder="e.g. 3.00"
              />
              <p className="text-xs text-slate-500 ml-1 mt-1">If set, overrides automatic salary-based deduction.</p>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                  Telegram Attendance Chat ID (Check-in & Check-out Only)
                </label>
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  onBlur={() => {
                    setSettings({
                      ...settings,
                      telegramChatId: telegramChatId,
                    });
                    updateSettingsDb({
                      telegramChatId: telegramChatId,
                    });
                  }}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200 shadow-sm"
                  placeholder="e.g. -100123456789"
                />
                <p className="text-xs text-slate-500 ml-1 mt-1">
                  Exclusively for staff attendance alerts (check-in, check-out, break, shift 2). Never receives confidential admin events.
                </p>
              </div>

              <div>
                <AdminTelegramConnectWidget
                  currentChatIds={telegramAdminChatId}
                  onChatIdsChange={(newIds) => {
                    setTelegramAdminChatId(newIds);
                    setSettings({
                      ...settings,
                      telegramAdminChatId: newIds,
                    });
                    updateSettingsDb({
                      telegramAdminChatId: newIds,
                    });
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold border-b border-white/40 dark:border-slate-700/40 pb-3 text-slate-800 dark:text-slate-200">
            {t("manualShiftEntry")}
          </h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 ml-1">
            {t("manualShiftDesc")} (Select date range and time to update
            multiple days)
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300 ml-1">
              {t("employee")}
            </label>
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200 shadow-sm"
            >
              <option value="">{t("selectEmployee")}</option>
              {staff.map((s, idx) => (
                <option key={`${s.id}-${idx}`} value={s.id}>
                  {i18n.language === "km" && s.nameKh ? s.nameKh : s.name}{" "}
                  {s.branch ? `(${s.branch})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300 ml-1">
              {t("fromDate")}
            </label>
            <input
              type="date"
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300 ml-1">
              {t("toDateOptional")}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300 ml-1">
              {t("checkInTime")}
            </label>
            <input
              type="time"
              value={timeInTime}
              onChange={(e) => setTimeInTime(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300 ml-1">
              {t("checkOutTime")}
            </label>
            <input
              type="time"
              value={timeOutTime}
              onChange={(e) => setTimeOutTime(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200 shadow-sm"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <button
            onClick={handleSaveShift}
            disabled={
              !selectedStaff ||
              !shiftDate ||
              !timeInTime ||
              !timeOutTime ||
              isSaving
            }
            className="px-6 py-3 rounded-lg bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-sm text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? t("saving") : t("saveShifts")}
          </button>

          {saveMessage && (
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-md border border-emerald-100 dark:border-emerald-900/50 animate-in fade-in zoom-in duration-300">
              {saveMessage}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}