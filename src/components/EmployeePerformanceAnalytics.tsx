import React, { useState, useEffect, useMemo } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuthStore } from "../store";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingUp, Clock, AlertTriangle, Award, Calendar as CalendarIcon, Users } from "lucide-react";
import { formatHours } from "../lib/utils";
import { useTranslation } from "react-i18next";

interface Staff {
  id: string;
  name: string;
  companyId: string;
}

interface AttendanceLog {
  id: string;
  staffId: string;
  date: string;
  status: string;
  regularHours?: number;
  overtimeHours?: number;
  lateCheckIn?: boolean;
  late?: boolean;
}

export default function EmployeePerformanceAnalytics() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [staff, setStaff] = useState<Staff[]>([]);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.companyId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const staffSnap = await getDocs(query(collection(db, "staff"), where("companyId", "==", user.companyId)));
        const staffData = staffSnap.docs.map(d => ({ id: d.id, ...d.data() } as Staff)).filter(s => (s as any).role !== "admin");
        setStaff(staffData);

        const logsSnap = await getDocs(query(
          collection(db, "logs"),
          where("companyId", "==", user.companyId)
        ));
        const logsData = logsSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as AttendanceLog))
          .filter(log => log.date >= startDate && log.date <= endDate);
        setLogs(logsData);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, startDate, endDate]);

  const analyticsData = useMemo(() => {
    const staffStats = staff.map(s => {
      const staffLogs = logs.filter(l => l.staffId === s.id);
      let totalHours = 0;
      let totalOvertime = 0;
      let totalLate = 0;
      let totalOnTime = 0;
      let totalEarlyLeave = 0;
      let totalShifts = 0;

      staffLogs.forEach(log => {
        if (log.status === 'checked_out') {
          totalHours += (log.regularHours || 0) + (log.overtimeHours || 0);
          totalOvertime += (log.overtimeHours || 0);
          totalShifts++;
          if (log.lateCheckIn || log.late) {
            totalLate++;
          } else {
            totalOnTime++;
          }
        }
      });

      const accuracy = totalShifts > 0 ? (totalOnTime / totalShifts) * 100 : 0;
      return { id: s.id, name: s.name, totalHours, totalOvertime, totalLate, totalOnTime, totalEarlyLeave, totalShifts, accuracy };
    });

    const topOvertime = [...staffStats].sort((a, b) => b.totalOvertime - a.totalOvertime).slice(0, 5);
    const topLate = [...staffStats].sort((a, b) => b.totalLate - a.totalLate).slice(0, 5);
    const mostAccurate = [...staffStats].filter(s => s.totalShifts > 0).sort((a, b) => b.accuracy - a.accuracy).slice(0, 5);

    const dailyDataMap = new Map();
    logs.filter(l => l.status === 'checked_out').forEach(log => {
      if (!dailyDataMap.has(log.date)) dailyDataMap.set(log.date, { date: log.date, overtime: 0, hours: 0, late: 0 });
      const dayData = dailyDataMap.get(log.date);
      dayData.overtime += (log.overtimeHours || 0);
      dayData.hours += ((log.regularHours || 0) + (log.overtimeHours || 0));
      if (log.lateCheckIn || log.late) dayData.late++;
    });

    const dailyData = Array.from(dailyDataMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    
    // Overview KPIs
    const totalOvertimeAll = staffStats.reduce((sum, s) => sum + s.totalOvertime, 0);
    const avgAccuracy = staffStats.length > 0 ? staffStats.reduce((sum, s) => sum + s.accuracy, 0) / staffStats.length : 0;
    const totalLateAll = staffStats.reduce((sum, s) => sum + s.totalLate, 0);
    const totalStaff = staffStats.length;

    return { staffStats, topOvertime, topLate, mostAccurate, dailyData, totalOvertimeAll, avgAccuracy, totalLateAll, totalStaff };
  }, [staff, logs]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-500 animate-pulse">
        {t('loadingAnalytics')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-xl shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          {t('performanceAnalytics')}
        </h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 relative">
            <CalendarIcon className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full sm:w-auto pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700/50 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
            />
          </div>
          <span className="text-slate-400 font-medium text-sm hidden sm:block">{t('to')}</span>
          <div className="flex items-center gap-2 relative">
            <CalendarIcon className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full sm:w-auto pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700/50 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
            />
          </div>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t('totalStaff')}</div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{analyticsData.totalStaff}</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t('avgAccuracy')}</div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{analyticsData.avgAccuracy.toFixed(1)}%</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t('totalOvertime')}</div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{formatHours(analyticsData.totalOvertimeAll)}</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t('lateCheckIns')}</div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{analyticsData.totalLateAll}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm flex flex-col h-[400px]">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            {t('topAttendanceAccuracy')}
          </h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
            {analyticsData.mostAccurate.length > 0 ? analyticsData.mostAccurate.map((s, idx) => (
              <div key={`${s.id}-${idx}`} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400'}`}>
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">{s.name}</div>
                    <div className="text-xs text-slate-500">{s.totalOnTime} {t('onTimeShifts')}</div>
                  </div>
                </div>
                <div className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg text-sm">
                  {s.accuracy.toFixed(1)}%
                </div>
              </div>
            )) : <div className="text-sm text-slate-500 text-center py-4">{t('noDataAvailable')}</div>}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm flex flex-col h-[400px]">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-500" />
            {t('highestOvertime')}
          </h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
            {analyticsData.topOvertime.length > 0 && analyticsData.topOvertime[0].totalOvertime > 0 ? analyticsData.topOvertime.filter(s => s.totalOvertime > 0).map((s, idx) => (
              <div key={`${s.id}-${idx}`} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 font-bold text-sm">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">{s.name}</div>
                </div>
                <div className="font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-2 py-1 rounded-lg text-sm">
                  {formatHours(s.totalOvertime)}
                </div>
              </div>
            )) : <div className="text-sm text-slate-500 text-center py-4">{t('noOvertimeRecorded')}</div>}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm flex flex-col h-[400px]">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            {t('mostLateCheckIns')}
          </h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
            {analyticsData.topLate.length > 0 && analyticsData.topLate[0].totalLate > 0 ? analyticsData.topLate.filter(s => s.totalLate > 0).map((s, idx) => (
              <div key={`${s.id}-${idx}`} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 font-bold text-sm">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">{s.name}</div>
                </div>
                <div className="font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-lg text-sm flex items-center gap-1">
                  {s.totalLate} <span className="text-xs font-medium">{t('times')}</span>
                </div>
              </div>
            )) : <div className="text-sm text-slate-500 text-center py-4">{t('noLateCheckIns')}</div>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 rounded-xl shadow-sm h-[400px] flex flex-col">
          <h3 className="text-base font-bold mb-6 text-slate-800 dark:text-slate-100">{t('staffHoursComparison')}</h3>
          <div className="flex-1 min-h-0 w-full overflow-x-auto overflow-y-auto custom-scrollbar pb-2 -mx-2 px-2 sm:mx-0 sm:px-0">
            <div className="min-w-[500px]" style={{ height: Math.max(300, analyticsData.staffStats.filter(s => s.totalHours > 0).length * 40) }}>
              {analyticsData.staffStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <BarChart data={analyticsData.staffStats.filter(s => s.totalHours > 0)} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--chart-grid)" />
                    <XAxis type="number" tick={{ fill: 'var(--chart-text)' }} />
                    <YAxis dataKey="id" type="category" width={100} tickFormatter={(id) => analyticsData.staffStats.find(s => s.id === id)?.name || id} tick={{ fontSize: 12, fill: 'var(--chart-text)' }} />
                    <RechartsTooltip labelFormatter={(id) => analyticsData.staffStats.find(s => s.id === id)?.name || id} cursor={{fill: 'rgba(128,128,128,0.1)'}} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'var(--chart-tooltip-bg)', color: 'var(--chart-tooltip-text)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }} />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar dataKey="totalHours" name={t('totalHoursLabel')} fill="#6366f1" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="totalOvertime" name={t('overtimeLabel')} fill="#a855f7" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-full flex items-center justify-center text-slate-500">{t('noDataToDisplay')}</div>}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 rounded-xl shadow-sm h-[400px] flex flex-col">
          <h3 className="text-base font-bold mb-6 text-slate-800 dark:text-slate-100">{t('dailyOvertimeTrend')}</h3>
          <div className="flex-1 min-h-0 w-full overflow-x-auto overflow-y-hidden custom-scrollbar pb-2 -mx-2 px-2 sm:mx-0 sm:px-0">
            <div className="min-w-[500px] h-full">
              {analyticsData.dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <AreaChart data={analyticsData.dailyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorOvertime" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                    <XAxis dataKey="date" tickFormatter={(val) => val.slice(5)} tick={{ fontSize: 12, fill: 'var(--chart-text)' }} />
                    <YAxis tick={{ fill: 'var(--chart-text)', fontSize: 12 }} />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'var(--chart-tooltip-bg)', color: 'var(--chart-tooltip-text)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }} />
                    <Area type="monotone" dataKey="overtime" name={t('overtimeHoursLabel')} stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorOvertime)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <div className="h-full flex items-center justify-center text-slate-500">{t('noDataToDisplay')}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
