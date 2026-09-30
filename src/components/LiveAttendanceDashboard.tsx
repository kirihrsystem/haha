import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuthStore } from '../store';
import { format } from 'date-fns';
import { 
  Users, 
  Clock, 
  LogIn, 
  LogOut, 
  Coffee, 
  Activity, 
  RefreshCw, 
  Search, 
  MapPin, 
  Camera, 
  CheckCircle2, 
  UserX,
  Send
} from 'lucide-react';
import { Staff, Log } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import ImagePreviewModal from './ImagePreviewModal';
import { useTranslation } from 'react-i18next';
import { formatTimeWithLocale } from '../utils/khmerDateUtils';
import { sendTelegramNotification } from '../utils/telegramUtils';

export default function LiveAttendanceDashboard() {
  const { t, i18n } = useTranslation();
  const isKm = i18n.language?.startsWith('km') || localStorage.getItem('lang') === 'km';
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<Log[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'break' | 'checked_out' | 'not_arrived'>('all');

  const [isSendingTelegram, setIsSendingTelegram] = useState(false);

  const handleSendTelegramSummary = async (lang: 'en' | 'km') => {
    if (!user?.companyId) return;
    setIsSendingTelegram(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const leavesQ = query(
        collection(db, 'leaves'),
        where('companyId', '==', user.companyId),
        where('date', '==', today),
        where('status', '==', 'approved')
      );
      const leaveSnap = await getDocs(leavesQ);
      const approvedLeaves = leaveSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const presentList = [];
      const absentList = [];

      const sortedStaff = [...staffList].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      sortedStaff.forEach(staff => {
        const staffLog = logs.find(l => l.staffId === staff.id);
        const staffLeave = approvedLeaves.find(l => l.staffId === staff.id);

        if (staffLog) {
          const timeInStr = staffLog.timeIn ? format(new Date(staffLog.timeIn), 'hh:mm a') : (lang === 'km' ? 'គ្មាន' : 'N/A');
          let outStr = '';
          if (staffLog.status === 'checked_out' && staffLog.timeOut) {
            outStr = lang === 'km' 
              ? ` | ចេញ: ${format(new Date(staffLog.timeOut), 'hh:mm a')}`
              : ` | Out: ${format(new Date(staffLog.timeOut), 'hh:mm a')}`;
          } else if (staffLog.status === 'break') {
            outStr = lang === 'km' ? ` | ចេញ (សម្រាក)` : ` | Out (Break)`;
          }
          
          let lateStr = '';
          if (staffLog.lateMinutes > 0) {
            const lH = Math.floor(staffLog.lateMinutes / 60);
            const lM = Math.round(staffLog.lateMinutes % 60);
            if (lang === 'km') {
              lateStr = ` | យឺត: ${lH > 0 ? lH + 'ម៉ោង ' : ''}${lM}នាទី`;
            } else {
              lateStr = ` | Late: ${lH > 0 ? lH + 'h ' : ''}${lM}m`;
            }
          }

          let hrsStr = '';
          if (staffLog.status === 'checked_out') {
            const totalH = (staffLog.regularHours || 0) + (staffLog.overtimeHours || 0);
            hrsStr = lang === 'km' ? ` | ម៉ោងសរុប: ${totalH.toFixed(1)}h` : ` | Hrs: ${totalH.toFixed(1)}h`;
          } else {
            hrsStr = lang === 'km' ? ` | កំពុងធ្វើការ` : ` | Active`;
          }

          const inLabel = lang === 'km' ? 'ចូល:' : 'In:';
          presentList.push(`• ${staff.nameKh || staff.name}: ${inLabel} ${timeInStr}${outStr}${lateStr}${hrsStr}`);
        } else {
          if (staffLeave) {
            if (staffLeave.type === 'day_off') {
              absentList.push(`• ${staff.nameKh || staff.name}: ${lang === 'km' ? 'សម្រាក (Day Off)' : 'Day Off'}`);
            } else if (staffLeave.type === 'permission' || staffLeave.type === 'early_leave' || staffLeave.type === 'late_checkin') {
              absentList.push(`• ${staff.nameKh || staff.name}: ${lang === 'km' ? 'សុំច្បាប់' : 'Permission'} (${staffLeave.reason || 'Approved'})`);
            } else {
              absentList.push(`• ${staff.nameKh || staff.name}: ${lang === 'km' ? 'អវត្តមាន' : 'Absent'}`);
            }
          } else {
            absentList.push(`• ${staff.nameKh || staff.name}: ${lang === 'km' ? 'អវត្តមាន' : 'Absent'}`);
          }
        }
      });

      const messageParts = lang === 'km' ? [
        `📊 <b>សេចក្តីសង្ខេបវត្តមានប្រចាំថ្ងៃ (Daily Attendance Summary)</b>`,
        `📅 <b>កាលបរិច្ឆេទ:</b> ${format(new Date(), 'MMM dd, yyyy')}`,
        '',
        `✅ <b>វត្តមាន / កំពុងធ្វើការ (${presentList.length})</b>`,
        presentList.length > 0 ? presentList.join('\n') : 'គ្មាន',
        '',
        `❌ <b>អវត្តមាន & សុំច្បាប់ (${absentList.length})</b>`,
        absentList.length > 0 ? absentList.join('\n') : 'គ្មាន'
      ] : [
        `📊 <b>Daily Attendance Summary</b>`,
        `📅 <b>Date:</b> ${format(new Date(), 'MMM dd, yyyy')}`,
        '',
        `✅ <b>PRESENT / ACTIVE (${presentList.length})</b>`,
        presentList.length > 0 ? presentList.join('\n') : 'None',
        '',
        `❌ <b>ABSENT & LEAVES (${absentList.length})</b>`,
        absentList.length > 0 ? absentList.join('\n') : 'None'
      ];

      await sendTelegramNotification(messageParts.join('\n'), true);
      alert(t('summarySentSuccess') || 'Summary sent to Telegram successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to send summary.');
    } finally {
      setIsSendingTelegram(false);
    }
  };


  useEffect(() => {
    if (!user?.companyId) return;
    
    // Fetch staff
    const staffQ = query(
      collection(db, 'staff'),
      where('companyId', '==', user.companyId)
    );
    getDocs(staffQ).then(snap => {
      setStaffList(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Staff).filter(s => s.role !== 'admin').sort((a, b) => (a.passcode || "").localeCompare(b.passcode || "", undefined, { numeric: true })));
    }).catch(err => {
      console.warn("Could not fetch live staff records:", err);
    });

    const today = format(new Date(), 'yyyy-MM-dd');
    const logsQ = query(
      collection(db, 'logs'),
      where('companyId', '==', user.companyId),
      where('date', '==', today)
    );

    const unsubscribe = onSnapshot(logsQ, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Log));
    }, (error) => {
      console.warn("Live attendance subscription status:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1200);
  };

  const presentCount = logs.filter(l => ['active', 'active2'].includes(l.status)).length;
  const breakCount = logs.filter(l => l.status === 'break').length;
  const checkedOutCount = logs.filter(l => l.status === 'checked_out').length;
  const loggedStaffIds = new Set(logs.map(l => l.staffId));
  const notArrivedStaff = staffList.filter(s => !loggedStaffIds.has(s.id));
  const notArrivedCount = notArrivedStaff.length;
  const totalStaff = staffList.length;
  const attendanceRate = totalStaff > 0 ? Math.round(((totalStaff - notArrivedCount) / totalStaff) * 100) : 0;

  const getStatusLabel = (status: string) => {
    if (!status) return 'Unknown';
    if (status === 'active' || status === 'active2') return t('active') || 'Present';
    if (status === 'break') return t('break') || 'On Break';
    if (status === 'checked_out' || status === 'completed') return t('checkedOut') || 'Checked Out';
    if (status === 'not_arrived') return t('notArrived') || 'Not Arrived';
    const tr = t(status);
    if (tr && tr !== status) return tr;
    return status
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  // Build timeline events
  const recentEvents = useMemo(() => {
    return logs.flatMap(log => {
      const staff = staffList.find(s => s.id === log.staffId);
      const name = staff?.name || 'Staff Member';
      const avatar = staff?.avatar || staff?.profilePictureUrl;
      const events = [];
      if (log.timeIn) events.push({ id: `${log.id}-in`, type: 'in', time: log.timeIn, name, avatar, message: t('checkedIn') });
      if (log.timeIn2) events.push({ id: `${log.id}-in2`, type: 'in', time: log.timeIn2, name, avatar, message: `${t('checkedIn')} (Shift 2)` });
      if (log.timeOut) events.push({ id: `${log.id}-out`, type: 'out', time: log.timeOut, name, avatar, message: t('checkedOut') });
      if (log.timeOut2) events.push({ id: `${log.id}-out2`, type: 'out', time: log.timeOut2, name, avatar, message: `${t('checkedOut')} (Shift 2)` });
      return events;
    }).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 20);
  }, [logs, staffList, t]);

  // Filtered logs or not arrived items
  const filteredData = useMemo(() => {
    let result = logs.map(log => {
      const staff = staffList.find(s => s.id === log.staffId);
      return { log, staff };
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(({ staff }) => 
        staff?.name?.toLowerCase().includes(q) || 
        staff?.nameKh?.toLowerCase().includes(q) || 
        staff?.passcode?.toLowerCase().includes(q) ||
        staff?.position?.toLowerCase().includes(q)
      );
    }

    if (statusFilter === 'active') {
      result = result.filter(({ log }) => log.status === 'active' || log.status === 'active2');
    } else if (statusFilter === 'break') {
      result = result.filter(({ log }) => log.status === 'break');
    } else if (statusFilter === 'checked_out') {
      result = result.filter(({ log }) => log.status === 'checked_out');
    }

    return result;
  }, [logs, staffList, searchQuery, statusFilter]);

  const filteredNotArrived = useMemo(() => {
    if (!searchQuery.trim()) return notArrivedStaff;
    const q = searchQuery.toLowerCase();
    return notArrivedStaff.filter(s => 
      s.name?.toLowerCase().includes(q) || 
      s.nameKh?.toLowerCase().includes(q) || 
      s.passcode?.toLowerCase().includes(q) ||
      s.position?.toLowerCase().includes(q)
    );
  }, [notArrivedStaff, searchQuery]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            {t('liveAttendanceDashboard')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {format(new Date(), 'EEEE, MMMM do, yyyy')} &bull; Real-time Monitoring
          </p>
        </div>

        
        <div className="flex items-center gap-2">
          <div className="flex bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800/50 rounded-lg overflow-hidden shadow-sm">
            <button
              onClick={() => handleSendTelegramSummary('en')}
              disabled={isSendingTelegram}
              className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50 border-r border-indigo-200 dark:border-indigo-800/50"
              title="Send in English"
            >
              <Send className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSendingTelegram ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline">{isSendingTelegram ? 'Sending...' : 'Send (EN)'}</span>
              <span className="sm:hidden">EN</span>
            </button>
            <button
              onClick={() => handleSendTelegramSummary('km')}
              disabled={isSendingTelegram}
              className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50"
              title="Send in Khmer"
            >
              <Send className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSendingTelegram ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline">{isSendingTelegram ? 'Sending...' : 'Send (KM)'}</span>
              <span className="sm:hidden">KM</span>
            </button>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : 'text-slate-400'}`} />
            {t('refreshData') || 'Refresh View'}
          </button>
        </div>

      </div>

      {/* KPI Overview Grid - Clean minimal cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Workforce */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 relative overflow-hidden shadow-sm flex flex-col">
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
            {t('totalStaff')}
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            {totalStaff}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
            {attendanceRate}% {t('present') || 'Turnout rate'}
          </div>
          <Users className="absolute top-5 right-5 w-5 h-5 text-slate-200 dark:text-slate-700" />
        </div>

        {/* Present / Active */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 relative overflow-hidden shadow-sm flex flex-col">
          <div className="text-sm font-medium text-emerald-600 dark:text-emerald-500 mb-1">
            {t('active') || 'Present'}
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            {presentCount}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
            {t('onDuty') || 'Currently active'}
          </div>
          <Activity className="absolute top-5 right-5 w-5 h-5 text-emerald-100 dark:text-emerald-900/50" />
        </div>

        {/* On Break */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 relative overflow-hidden shadow-sm flex flex-col">
          <div className="text-sm font-medium text-amber-600 dark:text-amber-500 mb-1">
            {t('break') || 'On Break'}
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            {breakCount}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
            {t('temporaryBreak') || 'Paused shift'}
          </div>
          <Coffee className="absolute top-5 right-5 w-5 h-5 text-amber-100 dark:text-amber-900/50" />
        </div>

        {/* Checked Out */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 relative overflow-hidden shadow-sm flex flex-col">
          <div className="text-sm font-medium text-blue-600 dark:text-blue-500 mb-1">
            {t('checkedOut') || 'Checked Out'}
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            {checkedOutCount}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
            {t('finishedShift') || 'Shift completed'}
          </div>
          <CheckCircle2 className="absolute top-5 right-5 w-5 h-5 text-blue-100 dark:text-blue-900/50" />
        </div>

        {/* Not Arrived */}
        <div className="col-span-2 lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 relative overflow-hidden shadow-sm flex flex-col">
          <div className="text-sm font-medium text-rose-600 dark:text-rose-500 mb-1">
            {t('notArrived') || 'Not Arrived'}
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            {notArrivedCount}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
            {t('pendingCheckIn') || 'Pending arrival'}
          </div>
          <UserX className="absolute top-5 right-5 w-5 h-5 text-rose-100 dark:text-rose-900/50" />
        </div>
      </div>

      {/* Main Content Layout: Logs Table + Activity Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Attendance Records Table */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
          
          {/* Table Toolbar */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
            {/* Search */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder={t('searchStaff') || "Search employees..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>

            {/* Filter Tabs - Clean Minimal Pills */}
            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 custom-scrollbar">
              {[
                { key: 'all', label: t('all') || 'All', count: logs.length },
                { key: 'active', label: t('active') || 'Present', count: presentCount },
                { key: 'break', label: t('break') || 'Break', count: breakCount },
                { key: 'checked_out', label: t('checkedOut') || 'Out', count: checkedOutCount },
                { key: 'not_arrived', label: t('notArrived') || 'Not In', count: notArrivedCount },
              ].map((tab) => {
                const isActive = statusFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key as any)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${
                      isActive 
                        ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table Container */}
          <div>
            {statusFilter === 'not_arrived' ? (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredNotArrived.length > 0 ? (
                  filteredNotArrived.map((s, idx) => (
                    <div key={s.id || idx} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium text-xs flex items-center justify-center shrink-0 overflow-hidden">
                          {s.avatar || s.profilePictureUrl ? (
                            <img loading="lazy" decoding="async" src={s.avatar || s.profilePictureUrl} alt={s.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{s.name?.charAt(0) || '?'}</span>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">
                            {s.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {s.position || s.role || 'Staff'} {s.passcode && `• ${s.passcode}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                          {s.shiftStart ? `Expected: ${s.shiftStart}` : 'Not Checked In'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-16 text-center">
                    <CheckCircle2 className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {t('allStaffCheckedIn') || 'All employees are present today.'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-5 w-1/3">{t('employee')}</th>
                        <th className="py-3 px-4">{t('status')}</th>
                        <th className="py-3 px-4">{t('timeIn')}</th>
                        <th className="py-3 px-4">{t('timeOut')}</th>
                        <th className="py-3 px-5 text-right">{t('hours')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                      {filteredData.map(({ log, staff }, idx) => {
                        const avatar = staff?.avatar || staff?.profilePictureUrl;
                        const isOnline = log.status === 'active' || log.status === 'active2';
                        const isOnBreak = log.status === 'break';

                        return (
                          <tr key={`${log.id}-${idx}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                            {/* Employee */}
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium text-xs flex items-center justify-center shrink-0 overflow-hidden">
                                  {avatar ? (
                                    <img loading="lazy" decoding="async" src={avatar} alt={staff?.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span>{staff?.name?.charAt(0) || '?'}</span>
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium text-slate-900 dark:text-white text-sm">
                                    {staff?.name || 'Staff Member'}
                                  </div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400">
                                    {staff?.position || staff?.role || 'Staff'} {staff?.passcode && `• ${staff.passcode}`}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${
                                  isOnline ? 'bg-emerald-500' : isOnBreak ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'
                                }`} />
                                <span className={`text-xs font-medium ${
                                  isOnline ? 'text-emerald-700 dark:text-emerald-400' : isOnBreak ? 'text-amber-700 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'
                                }`}>
                                  {getStatusLabel(log.status)}
                                </span>
                              </div>
                            </td>

                            {/* Time In */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">
                                  {formatTimeWithLocale(log.timeIn, isKm)}
                                </span>
                                {(log.checkInPhotoUrl || (log.checkInLat && log.checkInLng)) && (
                                  <div className="flex items-center gap-1 text-slate-400">
                                    {log.checkInPhotoUrl && (
                                      <button onClick={() => setPreviewImage(log.checkInPhotoUrl!)} className="hover:text-indigo-600 transition-colors" title={t('viewCheckInPhoto') || 'Photo'}>
                                        <Camera className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    {log.checkInLat && log.checkInLng && (
                                      <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${log.checkInLat},${log.checkInLng}`, '_blank')} className="hover:text-rose-600 transition-colors" title="Location">
                                        <MapPin className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                              {(log.lateCheckIn || log.late) && (log.lateMinutes || 0) > 0 && (
                                <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-0.5">
                                  {t('late') || 'Late'} {Math.floor((log.lateMinutes || 0) / 60)}h {Math.round((log.lateMinutes || 0) % 60)}m
                                </div>
                              )}
                            </td>

                            {/* Time Out */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">
                                  {log.timeOut ? formatTimeWithLocale(log.timeOut, isKm) : '--:--'}
                                </span>
                                {log.timeOut && (log.checkOutPhotoUrl || (log.checkOutLat && log.checkOutLng)) && (
                                  <div className="flex items-center gap-1 text-slate-400">
                                    {log.checkOutPhotoUrl && (
                                      <button onClick={() => setPreviewImage(log.checkOutPhotoUrl!)} className="hover:text-indigo-600 transition-colors" title={t('viewCheckOutPhoto') || 'Photo'}>
                                        <Camera className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    {log.checkOutLat && log.checkOutLng && (
                                      <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${log.checkOutLat},${log.checkOutLng}`, '_blank')} className="hover:text-rose-600 transition-colors" title="Location">
                                        <MapPin className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                              {log.earlyLeave && (
                                <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                                  {t('earlyLeave') || 'Early departure'}
                                </div>
                              )}
                            </td>

                            {/* Hours Total */}
                            <td className="py-3.5 px-5 text-right">
                              {log.regularHours ? (
                                <span className="font-mono font-semibold text-slate-900 dark:text-white text-sm">
                                  {Math.floor(log.regularHours + (log.overtimeHours || 0))}h {Math.round(((log.regularHours + (log.overtimeHours || 0)) % 1) * 60)}m
                                </span>
                              ) : (
                                <span className="text-slate-400 font-normal">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {filteredData.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-16 text-center">
                            <Clock className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('noLogsToday') || 'No records found matching your criteria.'}</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredData.map(({ log, staff }, idx) => {
                    const avatar = staff?.avatar || staff?.profilePictureUrl;
                    const isOnline = log.status === 'active' || log.status === 'active2';
                    const isOnBreak = log.status === 'break';

                    return (
                      <div key={`mobile-${log.id}-${idx}`} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                              {avatar ? (
                                <img loading="lazy" decoding="async" src={avatar} alt={staff?.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-slate-500 font-medium text-sm">{staff?.name?.charAt(0) || '?'}</span>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white text-sm">
                                {staff?.name || 'Staff Member'}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {staff?.position || staff?.role || 'Staff'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded text-xs font-medium border border-slate-100 dark:border-slate-700/50">
                            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : isOnBreak ? 'bg-amber-500' : 'bg-slate-400'}`} />
                            {getStatusLabel(log.status)}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                          <div>
                            <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 font-medium">{t('timeIn')}</div>
                            <div className="font-medium text-slate-800 dark:text-slate-200">
                              {formatTimeWithLocale(log.timeIn, isKm)}
                            </div>
                            {(log.lateCheckIn || log.late) && (log.lateMinutes || 0) > 0 && (
                              <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-0.5">
                                Late {Math.floor((log.lateMinutes || 0) / 60)}h {Math.round((log.lateMinutes || 0) % 60)}m
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 font-medium">{t('timeOut')}</div>
                            <div className="font-medium text-slate-800 dark:text-slate-200">
                              {log.timeOut ? formatTimeWithLocale(log.timeOut, isKm) : '--:--'}
                            </div>
                            {log.earlyLeave && (
                              <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                                Early depart
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {filteredData.length === 0 && (
                    <div className="p-8 text-center">
                      <p className="text-sm text-slate-500 font-medium">No records found.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Minimal Timeline Feed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col h-[600px] overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/50">
            <Activity className="w-4 h-4 text-indigo-500" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-none">
                {t('recentActivity') || 'Activity Log'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {recentEvents.length} {t('todayEvents') || 'events today'}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            {recentEvents.length > 0 ? (
              <div className="relative border-l border-slate-100 dark:border-slate-800 ml-3 space-y-6">
                {recentEvents.map((event, idx) => {
                  const isIn = event.type === 'in';
                  const isOut = event.type === 'out';
                  
                  return (
                    <div key={`${event.id}-${idx}`} className="relative pl-5">
                      {/* Timeline Node */}
                      <span className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-slate-900 ${
                        isIn ? 'bg-emerald-500' : isOut ? 'bg-rose-500' : 'bg-amber-500'
                      }`} />

                      <div className="flex flex-col">
                        <div className="text-xs text-slate-800 dark:text-slate-200 leading-tight">
                          <span className="font-semibold">{event.name}</span>{' '}
                          <span className="text-slate-500 dark:text-slate-400">{event.message}</span>
                        </div>
                        <span className="text-[11px] font-medium text-slate-400 mt-1">
                          {formatTimeWithLocale(event.time, isKm)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <Clock className="w-8 h-8 text-slate-200 dark:text-slate-700 mb-3" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {t('noRecentActivity') || 'No recent events'}
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}
