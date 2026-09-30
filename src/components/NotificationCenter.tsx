import React, { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../store";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  updateDoc, 
  doc, 
  addDoc, 
  orderBy, 
  getDocs 
} from "firebase/firestore";
import { db } from "../firebase/config";
import { Bell, CheckCheck, Inbox, Clock, Calendar, CheckCircle2, AlertCircle, X, Check, XCircle, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface NotificationDoc {
  id: string;
  companyId: string;
  userId?: string;
  role?: "admin" | "staff";
  type: "attendance" | "leave_status" | "leave_pending" | "payroll";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface ActiveToast {
  id: string;
  toastId: string;
  title: string;
  message: string;
  type: "attendance" | "leave_status" | "leave_pending" | "payroll";
}

export default function NotificationCenter() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationDoc[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeToasts, setActiveToasts] = useState<ActiveToast[]>([]);
  
  const shownToastsRef = useRef<Set<string>>(new Set());
  const mountTimeRef = useRef<number>(Date.now() - 5000); // 5 sec buffer
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Set up real-time listener
  useEffect(() => {
    if (!user) return;

    // Fetch notifications related to the user's company
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("companyId", "==", user.companyId)
    );
    
    const unsub = onSnapshot(notificationsQuery, (sn) => {
      const allDocs = sn.docs.map(d => ({ id: d.id, ...d.data() } as NotificationDoc));
      
      // Filter based on roles and targeting
      const filtered = allDocs
        .filter(n => {
          if (n.companyId !== user.companyId) return false;
          if (user.role === "admin") {
            // Admins get actions matching 'admin' or general company updates
            return n.role === "admin";
          } else {
            // Employees get updates directed to them specifically or targeted to staff role general
            return n.userId === user.id || (n.role === "staff" && (!n.userId || n.userId === user.id));
          }
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setNotifications(filtered);

      // Trigger standard toast notification for NEW, UNREAD incoming documents
      filtered.forEach(notif => {
        const notifTime = new Date(notif.createdAt).getTime();
        // Toast rule: is unread, hasn't been displayed, and is newer than application session load
        if (!notif.read && !shownToastsRef.current.has(notif.id) && notifTime > mountTimeRef.current) {
          shownToastsRef.current.add(notif.id);
          triggerToast(notif);
        }
      });
    }, (err) => {
      console.error("Notification listener subscription error:", err);
    });

    return () => unsub();
  }, [user]);

  const triggerToast = (notif: NotificationDoc) => {
    const toastId = `${notif.id}-${Date.now()}-${Math.random()}`;
    const newToast: ActiveToast = {
      id: notif.id,
      toastId,
      title: notif.title,
      message: notif.message,
      type: notif.type
    };
    setActiveToasts(prev => [newToast, ...prev]);

    // Self-destruct after 6 seconds
    setTimeout(() => {
      removeToast(toastId);
    }, 6000);
  };

  const removeToast = (toastId: string) => {
    setActiveToasts(prev => prev.filter(t => t.toastId !== toastId));
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => 
        updateDoc(doc(db, "notifications", n.id), { read: true })
      ));
    } catch (e) {
      console.error("Failed to mark read:", e);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (e) {
      console.error("Failed to mark single read:", e);
    }
  };

  if (!user) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative inline-block" id="tour-notifications" ref={dropdownRef}>
      {/* Bell Trigger */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="p-2 sm:p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300 relative focus:outline-none"
        title="Check Notifications"
      >
        <Bell className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="unread-count-badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 font-bold font-sans text-[9px] text-white flex items-center justify-center rounded-full ring-2 ring-white dark:ring-slate-900 shadow-lg shadow-black/5"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Notifications Popover Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            key="notification-dropdown-panel"
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed left-2 right-2 top-[72px] sm:absolute sm:right-0 sm:left-auto sm:top-[120%] mt-2 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-2xl rounded-[1.75rem] overflow-hidden z-[99] flex flex-col font-sans"
            style={{ maxHeight: 'calc(100vh - 84px)' }}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20 shrink-0">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Notification Alert Desk</h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{unreadCount} unread reports</p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-bold transition focus:outline-none"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* List */}
            <div className="overflow-y-auto custom-scrollbar flex-1 min-h-[150px] sm:max-h-[350px]">
              {notifications.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {notifications.map((notif, idx) => (
                    <div
                      key={`${notif.id}-${idx}`}
                      onClick={() => markAsRead(notif.id)}
                      className={`p-4 flex gap-3 hover:bg-slate-50/75 dark:hover:bg-slate-800/30 cursor-pointer transition relative ${
                        !notif.read ? "bg-amber-500/[0.04] dark:bg-blue-500/[0.02]" : ""
                      }`}
                    >
                      {/* Read highlight stripe */}
                      {!notif.read && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 dark:bg-blue-600 rounded-r-sm" />
                      )}

                      {/* Icon Container */}
                      <div className="shrink-0 mt-0.5">
                        {notif.type === "attendance" && (
                          <span className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                            <Clock className="w-4 h-4" />
                          </span>
                        )}
                        {notif.type === "leave_pending" && (
                          <span className="p-2 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center">
                            <Calendar className="w-4 h-4" />
                          </span>
                        )}
                        {notif.type === "payroll" && (
                          <span className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center">
                            <DollarSign className="w-4 h-4" />
                          </span>
                        )}
                        {notif.type === "leave_status" && (
                          <span className={`p-2 rounded-full flex items-center justify-center ${
                            notif.title.includes("Approved") 
                              ? "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400" 
                              : "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400"
                          }`}>
                            {notif.title.includes("Approved") ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          </span>
                        )}
                      </div>

                      {/* Msg Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline gap-2">
                          <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                            {notif.title}
                          </h4>
                          <span className="text-[9px] text-slate-400 whitespace-nowrap">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1 font-medium">
                          {notif.message}
                        </p>
                      </div>

                      {/* Tick dot */}
                      {!notif.read && (
                        <div className="shrink-0 flex items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-blue-500" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Inbox className="w-8 h-8 mb-2 stroke-1 text-slate-300 dark:text-slate-700" />
                  <p className="text-xs font-semibold">No notifications</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">We will let you know here!</p>
                </div>
              )}
            </div>
            
            <div className="p-3 bg-slate-50 dark:bg-slate-950/20 text-center border-t border-slate-100 dark:border-slate-800 shrink-0">
              <span className="text-[9px] text-slate-400 font-mono tracking-wider font-semibold">
                KIRI WORKSPACE COMMUNICATIONS
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real-time Interactive Toast Overlay Stacks */}
      <div className="fixed top-24 right-6 z-[110] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {activeToasts.map((toast) => (
            <motion.div
              key={toast.toastId}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-4 rounded-[1.75rem] shadow-2xl border border-white/10 dark:border-slate-800/80 backdrop-blur-md pointer-events-auto flex gap-3 relative"
            >
              {/* Toast Left Status Ribbon */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${
                toast.type === "attendance" ? "bg-emerald-500" :
                toast.type === "leave_pending" ? "bg-amber-500" :
                toast.type === "payroll" ? "bg-indigo-500" :
                toast.title.includes("Approved") ? "bg-green-500" : "bg-rose-500"
              }`} />

              {/* Icon */}
              <div className="shrink-0 mt-0.5">
                {toast.type === "attendance" && (
                  <span className="p-1.5 bg-emerald-500/15 text-emerald-400 rounded-[1.25rem] flex items-center justify-center">
                    <Clock className="w-4.5 h-4.5" />
                  </span>
                )}
                {toast.type === "leave_pending" && (
                  <span className="p-1.5 bg-amber-500/15 text-amber-400 rounded-[1.25rem] flex items-center justify-center">
                    <Calendar className="w-4.5 h-4.5" />
                  </span>
                )}
                {toast.type === "payroll" && (
                  <span className="p-1.5 bg-indigo-500/15 text-indigo-400 rounded-[1.25rem] flex items-center justify-center">
                    <DollarSign className="w-4.5 h-4.5" />
                  </span>
                )}
                {toast.type === "leave_status" && (
                  <span className={`p-1.5 rounded-[1.25rem] flex items-center justify-center ${
                    toast.title.includes("Approved") 
                      ? "bg-green-500/15 text-green-400" 
                      : "bg-rose-500/15 text-rose-450"
                  }`}>
                    {toast.title.includes("Approved") ? <Check className="w-4.5 h-4.5" /> : <X className="w-4.5 h-4.5" />}
                  </span>
                )}
              </div>

              {/* Message */}
              <div className="flex-grow mr-2 select-none">
                <h4 className="font-bold text-xs tracking-tight text-slate-100">{toast.title}</h4>
                <p className="text-[11px] text-slate-350 mt-1 font-medium leading-normal">{toast.message}</p>
              </div>

              {/* Close pin */}
              <button
                onClick={() => removeToast(toast.toastId)}
                className="shrink-0 -mt-1 -mr-1 p-1 hover:bg-white/10 rounded-[1.25rem] text-slate-400 hover:text-white transition focus:outline-none"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
