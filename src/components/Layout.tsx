import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore, useSettingsStore, useThemeStore } from "../store";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { LogOut, Globe, Moon, Sun, RefreshCw, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import NotificationCenter from "./NotificationCenter";
import { toggleAppLanguage } from "../utils/googleTranslate";
import { cn } from "../lib/utils";

export default function Layout() {
  const { user, logout, companyId } = useAuthStore();
  const { settings, setSettings } = useSettingsStore();
  const { theme, toggleTheme } = useThemeStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSmoothRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  useEffect(() => {
    if (companyId) {
       const unsub = onSnapshot(doc(db, "companies_settings", companyId), (docSnap) => {
         if (docSnap.exists()) {
           setSettings(docSnap.data() as any);
         }
       }, (error) => {
         console.error(error);
       });
       return () => unsub();
    }
  }, [companyId]);
  
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (settings) {
      document.title = settings.companyName || "Kiri HR";
      
      const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
      if (appleTitle) appleTitle.setAttribute('content', settings.companyName || "Kiri HR");

      const logo = settings.logoUrl || 'logo.png';
      
      let appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
      if (!appleIcon) {
        appleIcon = document.createElement('link');
        appleIcon.setAttribute('rel', 'apple-touch-icon');
        document.head.appendChild(appleIcon);
      }
      appleIcon.setAttribute('href', logo);

      let icon = document.querySelector('link[rel="icon"]');
      if (icon) icon.setAttribute('href', logo);

            // Dynamically update the manifest
      const linkManifest = document.querySelector('link[rel="manifest"]');
      let baseManifestUrl = linkManifest?.getAttribute('data-original-href');
      if (!baseManifestUrl) {
        baseManifestUrl = linkManifest?.getAttribute('href');
        if (baseManifestUrl) {
          linkManifest?.setAttribute('data-original-href', baseManifestUrl);
        }
      }

      if (baseManifestUrl) {
        // Always fetch from the base/original manifest url
        fetch(baseManifestUrl)
          .then(res => res.json())
          .then(manifest => {
            manifest.name = settings.companyName || 'Kiri HR Platform';
            manifest.short_name = settings.companyName || 'Kiri HR';
            
            const logo = settings.logoUrl || 'logo.png';
            manifest.icons = [
              { src: logo, sizes: '192x192', type: 'image/png' },
              { src: logo, sizes: '512x512', type: 'image/png' },
              { src: logo, sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
            ];

            const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            linkManifest.setAttribute('href', url);
          })
          .catch(err => console.error('Failed to update manifest', err));
      }
    }
  }, [settings?.companyName, settings?.logoUrl]);

  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    toggleAppLanguage(i18n.language, i18n);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isDashboardPage = location.pathname.startsWith('/admin') || location.pathname.startsWith('/system-admin');

  return (
    <div className="flex-grow flex flex-col bg-transparent text-slate-900 dark:text-slate-100 transition-colors relative min-h-screen">
      {!isDashboardPage && (
        <header className="relative z-30 pt-3 sm:pt-4 px-3 sm:px-6 lg:px-8 print:hidden">
          <div className="max-w-7xl mx-auto glass-panel shadow-sm border border-white/60 dark:border-slate-800/60 rounded-2xl sm:rounded-full py-3 sm:py-0 h-auto sm:h-[72px] flex flex-row items-center justify-between px-3 sm:px-6 transition-all duration-300 gap-2 sm:gap-0 overflow-hidden">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 group cursor-pointer justify-start">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center bg-transparent">
                     <img
                       src={settings?.logoUrl || "/logo.png"}
                       alt="Logo"
                       className="w-full h-full object-contain bg-transparent transition-all duration-300 drop-shadow-sm group-hover:scale-110"
                       onError={(e) => {
                         (e.target as HTMLImageElement).style.display = 'none';
                         (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                       }}
                     />
                     <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 hidden absolute" />
                </div>
                <div className="min-w-0 flex flex-col justify-center text-left">
                  <h1 className="font-display font-bold text-sm sm:text-xl text-slate-900 dark:text-white leading-tight truncate tracking-tight">
                    {settings?.companyName || "Kiri HR"}
                  </h1>
                  <p className="text-[10px] sm:text-sm text-slate-500 dark:text-slate-400 capitalize truncate mt-[1px] font-medium tracking-wide">
                    {user?.role === "super_admin" ? "Platform Admin" : user?.role === "admin" ? t("admin") : `${t("staff")} ${user?.name ? (i18n.language === "km" && user?.nameKh ? user.nameKh : user.name) : ""} ${user?.branch ? `(${user.branch})` : ""}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end flex-nowrap gap-1 sm:gap-2 flex-shrink-0 bg-slate-50/60 dark:bg-slate-900/60 p-1 rounded-full border border-slate-200/50 dark:border-slate-700/50">
              <NotificationCenter />
              
              <button
                onClick={handleSmoothRefresh}
                className="p-1.5 sm:p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 hover:shadow-sm transition-all duration-200 text-slate-600 dark:text-slate-400 focus:outline-none"
                title="Refresh"
              >
                <RefreshCw className={cn("w-3.5 h-3.5 sm:w-5 sm:h-5", isRefreshing && "animate-spin text-indigo-500")} />
              </button>

              <button
                onClick={toggleTheme}
                className="p-1.5 sm:p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 hover:shadow-sm transition-all duration-200 text-slate-600 dark:text-slate-400 focus:outline-none"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5 sm:w-5 sm:h-5" /> : <Moon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />}
              </button>

              <button
                onClick={toggleLanguage}
                className="p-1.5 sm:p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 hover:shadow-sm transition-all duration-200 text-slate-600 dark:text-slate-400 focus:outline-none"
                title="Toggle Language"
              >
                <Globe className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </button>

              {user && (
                <div className="flex items-center gap-1.5 pl-0.5 pr-0.5 sm:pr-2.5 py-0.5 sm:py-1 rounded-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs" title={user.name || "User Profile"}>
                  {user.profilePictureUrl || user.avatar ? (
                    <img
                      src={user.profilePictureUrl || user.avatar}
                      alt={user.name || "Profile"}
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover ring-2 ring-indigo-500/30 shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-indigo-600 via-amber-500 to-rose-500 text-white font-bold flex items-center justify-center text-[10px] sm:text-xs shrink-0 shadow-xs">
                      {(user.name?.[0] || 'U').toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[110px] truncate hidden md:inline">
                    {user.name || (user.role === 'super_admin' ? 'Super Admin' : 'User')}
                  </span>
                </div>
              )}

              <div className="w-[1px] h-4 sm:h-5 bg-slate-300 dark:bg-slate-700 mx-0.5 sm:mx-1"></div>

              <button
                onClick={handleLogout}
                className="flex items-center justify-center p-1.5 sm:px-4 sm:py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white rounded-full transition-all shadow-sm hover:shadow-md text-xs sm:text-sm font-semibold active:scale-95 focus:outline-none"
                title={t("logout")}
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline-block ml-1.5">{t("logout")}</span>
              </button>
            </div>
          </div>
        </header>
      )}

      <main className={cn(
        "flex-1 w-full relative flex flex-col min-h-0",
        isDashboardPage ? "max-w-none p-0 m-0" : "max-w-7xl mx-auto p-4 sm:p-6 lg:p-8"
      )}>
        <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo({ top: 0, behavior: 'instant' })}>
          {(settings?.isLocked || settings?.subscription?.status === 'suspended' || settings?.subscription?.status === 'locked' || settings?.subscription?.status === 'held') && user?.role !== 'super_admin' ? (
            <motion.div
              key="suspended"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex-1 flex flex-col items-center justify-center text-center p-8 max-w-xl mx-auto my-auto glass-card rounded-3xl border border-red-200/60 dark:border-red-900/40 shadow-xl"
            >
              <div className="w-16 h-16 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
                {settings?.subscription?.status === 'held' ? 'Workspace On Hold' : 'Workspace Access Locked'}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                This workspace ({settings?.companyName || 'Workspace'}) has been {settings?.subscription?.status === 'held' ? 'placed on hold' : 'locked'} by the platform super administrator.
              </p>

              {settings?.lockReason && (
                <div className="w-full text-left p-4 rounded-2xl bg-red-50/80 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 mb-6">
                  <div className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mb-1 flex items-center gap-1.5">
                    <span>Lock / Hold Reason:</span>
                  </div>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {settings.lockReason}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3 w-full max-w-xs">
                <button
                  onClick={handleLogout}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-semibold text-xs shadow-md hover:opacity-90 transition-all"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={cn("flex-1 flex flex-col w-full h-full transition-all duration-300", isRefreshing && "opacity-40 blur-[2px] pointer-events-none scale-[0.99]")}
            >
              <Outlet context={{ isRefreshing }} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
