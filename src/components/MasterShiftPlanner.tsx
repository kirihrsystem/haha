import React, { useState, useEffect, useRef } from 'react';
import ScrollLock from './ScrollLock';
import { createPortal } from "react-dom";
import { useTranslation } from 'react-i18next';
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuthStore } from "../store";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  subMonths,
  addMonths,
  isToday,
  isSameMonth
} from "date-fns";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit2,
  X,
  Save,
  Clock
} from "lucide-react";
import { Staff } from "../types";
import { cn } from "../lib/utils";

export default function MasterShiftPlanner() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [staffList, setStaffList] = useState<Staff[]>([]);

  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [highlightToday, setHighlightToday] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Modal State
  const [editingShift, setEditingShift] = useState<{
    staff: Staff;
    dayIndex: number;
    dayName: string;
    formData: {
      active: boolean;
      start: string;
      end: string;
      start2: string;
      end2: string;
      breakHours?: number;
    }
  } | null>(null);

  useEffect(() => {
    if (!user?.companyId) return;
    const fetchStaff = async () => {
      const q = query(
        collection(db, "staff"),
        where("companyId", "==", user.companyId),
      );
      const snap = await getDocs(q);
      const allStaff = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Staff)
        .filter((s) => s.role !== "admin").sort((a, b) => (a.passcode || "").localeCompare(b.passcode || "", undefined, { numeric: true }));
      
      if (user.role === "admin") {
        setStaffList(allStaff);
      } else {
        setStaffList(allStaff.filter((s) => s.id === user.id));
      }
    };
    fetchStaff();
  }, [user]);

  // Jump to today's column smoothly with no isolation (keeps full month grid visible)
  const scrollToToday = (smooth = true) => {
    const today = new Date();
    const isDifferentMonth = !isSameMonth(currentMonth, today);
    if (isDifferentMonth) {
      setCurrentMonth(startOfMonth(today));
    }

    setHighlightToday(true);
    const highlightTimer = setTimeout(() => setHighlightToday(false), 2400);

    const runScroll = () => {
      const container = tableContainerRef.current;
      const todayElement = document.getElementById('planner-today');
      if (container && todayElement) {
        const elementLeft = todayElement.offsetLeft;
        const elementWidth = todayElement.offsetWidth || 80;
        const containerWidth = container.clientWidth;

        // Sticky employee header width
        const stickyHeader = container.querySelector('th.sticky') as HTMLElement | null;
        const stickyWidth = stickyHeader ? stickyHeader.offsetWidth : 200;

        // Position today's column centrally in the visible non-sticky scroll area
        const visibleWidth = Math.max(containerWidth - stickyWidth, 120);
        const targetScroll = Math.max(0, elementLeft - stickyWidth - (visibleWidth / 2) + (elementWidth / 2));

        container.scrollTo({
          left: targetScroll,
          behavior: smooth ? 'smooth' : 'auto',
        });
      } else if (todayElement) {
        todayElement.scrollIntoView({
          behavior: smooth ? 'smooth' : 'auto',
          block: 'nearest',
          inline: 'center',
        });
      }
    };

    if (isDifferentMonth) {
      setTimeout(runScroll, 120);
    } else {
      requestAnimationFrame(runScroll);
      setTimeout(runScroll, 60);
    }

    return () => clearTimeout(highlightTimer);
  };

  // Automatically jump to today on initial mount and when currentMonth is today's month
  useEffect(() => {
    if (isSameMonth(currentMonth, new Date())) {
      const timer1 = setTimeout(() => {
        scrollToToday(false);
      }, 50);
      const timer2 = setTimeout(() => {
        scrollToToday(true);
      }, 250);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [currentMonth, staffList.length]);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const handleEditClick = (staff: Staff, dayIndex: number, dayName: string) => {
    const overrides = staff.shiftOverrides || {};
    const hasOverride = overrides[dayIndex];
    
    const isOff = hasOverride
      ? !hasOverride.active
      : false; // Mon-Sun default work

    const start = hasOverride ? hasOverride.start : (staff.shiftStart || "08:00");
    const end = hasOverride ? hasOverride.end : (staff.shiftEnd || "17:00");
    const start2 = hasOverride ? (hasOverride.start2 || "") : (staff.shift2Start || "");
    const end2 = hasOverride ? (hasOverride.end2 || "") : (staff.shift2End || "");
    const breakHours = hasOverride ? (hasOverride.breakHours || 0) : (staff.breakHours || 0);

    setEditingShift({
      staff,
      dayIndex,
      dayName,
      formData: {
        active: !isOff,
        start,
        end,
        start2,
        end2,
        breakHours
      }
    });
  };

  const saveShiftOverride = async () => {
    if (!editingShift) return;
    const { staff, dayIndex, formData } = editingShift;

    const newOverrides = { ...(staff.shiftOverrides || {}) };
    
    newOverrides[dayIndex] = {
      active: formData.active,
      start: formData.start,
      end: formData.end,
      ...(formData.start2 && formData.end2 ? { start2: formData.start2, end2: formData.end2 } : {}),
      breakHours: formData.breakHours || 0
    };

    try {
      await updateDoc(doc(db, "staff", staff.id), {
        shiftOverrides: newOverrides
      });

      setStaffList(prev => prev.map(s => s.id === staff.id ? { ...s, shiftOverrides: newOverrides } : s));
      setEditingShift(null);
    } catch (err) {
      console.error("Failed to save shift override:", err);
      alert("Failed to save shift override.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-4 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
              {t('masterShiftPlanner')}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {user?.role === "admin" 
                ? t('masterShiftPlannerSub')
                : t('viewDefaultShiftSub')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <button
            type="button"
            onClick={() => scrollToToday(true)}
            id="jump-to-today-btn"
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer",
              isSameMonth(currentMonth, new Date())
                ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            )}
            title={t('jumpToToday')}
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{t('today')}</span>
            <span className="text-[10px] opacity-75 font-normal ml-0.5">
              ({format(new Date(), "MMM d")})
            </span>
          </button>

          <div className="flex items-center bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors text-slate-600 dark:text-slate-400"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-sm font-semibold min-w-[130px] sm:min-w-[140px] text-center text-slate-800 dark:text-slate-200">
              {format(currentMonth, "MMMM yyyy")}
            </div>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors text-slate-600 dark:text-slate-400"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div ref={tableContainerRef} className="overflow-x-auto custom-scrollbar flex-1 pb-2 scroll-smooth">
          <table className="w-full text-sm border-collapse min-w-max">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                <th className="px-2.5 py-3 sm:p-4 text-left w-auto sm:min-w-[200px] sticky left-0 top-0 bg-slate-50 dark:bg-slate-900/80 z-20 font-semibold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider shadow-[1px_0_0_0_theme(colors.slate.200)] dark:shadow-[1px_0_0_0_theme(colors.slate.800)]">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="whitespace-nowrap">{t('employee')}</span>
                    <button
                      type="button"
                      onClick={() => scrollToToday(true)}
                      className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-2 py-0.5 rounded-md border border-indigo-200/60 dark:border-indigo-800/60 transition-all active:scale-95 cursor-pointer"
                      title={t('jumpToToday')}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{t('today')}</span>
                    </button>
                  </div>
                </th>
                {daysInMonth.map((d) => {
                  const today = isToday(d);
                  const isWeekend = [0, 6].includes(d.getDay());
                  return (
                    <th
                      key={d.toISOString()}
                      id={today ? 'planner-today' : undefined}
                      className={cn(
                        "p-2.5 min-w-[80px] border-l border-slate-200 dark:border-slate-800 sticky top-0 z-10 font-normal transition-all duration-300",
                        isWeekend ? 'bg-slate-100/50 dark:bg-slate-800/30' : 'bg-slate-50 dark:bg-slate-900/80',
                        today && 'bg-indigo-50/90 dark:bg-indigo-950/60',
                        today && highlightToday && 'ring-2 ring-indigo-500 ring-inset shadow-md'
                      )}
                    >
                      <div className="flex flex-col items-center justify-center gap-1">
                        {today && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-600 text-white leading-none shadow-xs">
                            {t('today')}
                          </span>
                        )}
                        <span className={cn(
                          "text-[10px] font-semibold uppercase tracking-wider",
                          today ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
                        )}>
                          {format(d, "EEE")}
                        </span>
                        <span className={cn(
                          "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full transition-transform",
                          today ? 'bg-indigo-600 text-white shadow-sm font-bold' : 'text-slate-700 dark:text-slate-200',
                          today && highlightToday && 'scale-110 ring-2 ring-indigo-300 dark:ring-indigo-700'
                        )}>
                          {format(d, "dd")}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {staffList.map((staff, idx) => (
                <tr
                  key={`${staff.id}-${idx}`}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group"
                >
                  <td className="px-2.5 py-2.5 sm:p-3 sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/40 z-10 transition-colors shadow-[1px_0_0_0_theme(colors.slate.200)] dark:shadow-[1px_0_0_0_theme(colors.slate.800)]">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hidden sm:flex items-center justify-center text-slate-600 dark:text-slate-400 font-medium text-xs shrink-0 border border-slate-200 dark:border-slate-700 overflow-hidden">
                        {staff.avatar || staff.profilePictureUrl ? (
                          <img src={staff.avatar || staff.profilePictureUrl} alt={staff.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{staff.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-xs sm:text-sm text-slate-900 dark:text-slate-100 whitespace-nowrap" title={staff.name}>
                          {staff.name}
                        </div>
                        {staff.position && (
                          <div className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {staff.position}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  {daysInMonth.map((d) => {
                    const dayIndex = d.getDay();
                    const overrides = staff.shiftOverrides;
                    const hasOverride = overrides && overrides[dayIndex];
                    const isOff = hasOverride ? !overrides[dayIndex].active : false;
                    const today = isToday(d);

                    let shiftTime = "";
                    let shiftTime2 = "";
                    if (!isOff) {
                      const start = hasOverride ? overrides[dayIndex].start : staff.shiftStart;
                      const end = hasOverride ? overrides[dayIndex].end : staff.shiftEnd;
                      shiftTime = `${start} - ${end}`;

                      const start2 = hasOverride ? overrides[dayIndex].start2 : staff.shift2Start;
                      const end2 = hasOverride ? overrides[dayIndex].end2 : staff.shift2End;
                      if (start2 && end2) {
                        shiftTime2 = `${start2} - ${end2}`;
                      }
                    }

                    return (
                      <td key={d.toISOString()} className={cn(
                        "p-1.5 border-l border-slate-200 dark:border-slate-800 transition-colors duration-300",
                        today && "bg-indigo-50/40 dark:bg-indigo-950/30",
                        today && highlightToday && "bg-indigo-100/70 dark:bg-indigo-900/40",
                        [0, 6].includes(d.getDay()) && !today && "bg-slate-50/50 dark:bg-slate-900/50"
                      )}>
                        <div
                          onClick={() => user?.role === 'admin' && handleEditClick(staff, dayIndex, format(d, "EEEE"))}
                          className={cn(
                            "h-full min-h-[56px] mx-0.5 p-1.5 rounded-lg flex flex-col items-center justify-center gap-1 transition-all duration-200 relative group/cell",
                            user?.role === 'admin' ? 'cursor-pointer' : 'cursor-default',
                            isOff
                              ? "hover:bg-slate-100 dark:hover:bg-slate-800/80"
                              : "hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
                          )}
                        >
                          {isOff ? (
                            <span className={cn(
                              "text-[10px] font-medium transition-opacity group-hover/cell:opacity-0",
                              today ? "text-indigo-400 dark:text-indigo-600" : "text-slate-400 dark:text-slate-500"
                            )}>
                              {t('dayOff') || 'OFF'}
                            </span>
                          ) : (
                            <div className="flex flex-col items-center gap-0.5 w-full transition-opacity group-hover/cell:opacity-0">
                              <span className={cn(
                                "text-[11px] font-medium whitespace-nowrap",
                                today ? "text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-300"
                              )}>
                                {shiftTime}
                              </span>
                              {shiftTime2 && (
                                <span className={cn(
                                  "text-[10px] whitespace-nowrap text-slate-500 dark:text-slate-400"
                                )}>
                                  {shiftTime2}
                                </span>
                              )}
                            </div>
                          )}
                          {user?.role === 'admin' && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity duration-200 bg-white/90 dark:bg-slate-900/90 rounded-lg">
                              <Edit2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {staffList.length === 0 && (
                <tr>
                  <td colSpan={32} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('noStaffFound')}</p>
                      <p className="text-xs mt-1 text-slate-500">{t('addStaffToPlanShifts')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingShift && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center sm:p-4 bg-slate-900/50 backdrop-blur-sm transition-all duration-300 overflow-hidden">
          <ScrollLock />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 sm:rounded-2xl max-w-md w-full h-full sm:h-auto sm:max-h-[90vh] shadow-xl relative flex flex-col p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {t('editDay', { day: editingShift.dayName })}
                </h3>
              </div>
              <button onClick={() => setEditingShift(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-slate-500 mb-6">
              {t('editingScheduleFor', { name: editingShift.staff.name })}
            </p>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors bg-white dark:bg-slate-900">
                <div className="flex flex-col">
                  <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">{t('workingDay')}</span>
                  <span className="text-xs text-slate-500">{t('enableToSetShift')}</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={editingShift.formData.active} 
                  onChange={e => setEditingShift(prev => prev ? {...prev, formData: {...prev.formData, active: e.target.checked}} : null)}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                />
              </label>

              {editingShift.formData.active && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-4">{t('primaryShift')}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('startTime')}</label>
                        <input 
                          type="time" 
                          value={editingShift.formData.start}
                          onChange={e => setEditingShift(prev => prev ? {...prev, formData: {...prev.formData, start: e.target.value}} : null)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('endTime')}</label>
                        <input 
                          type="time" 
                          value={editingShift.formData.end}
                          onChange={e => setEditingShift(prev => prev ? {...prev, formData: {...prev.formData, end: e.target.value}} : null)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-4">{t('secondaryShift')} <span className="font-normal text-slate-500">({t('optional')})</span></h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('startTime')}</label>
                        <input 
                          type="time" 
                          value={editingShift.formData.start2}
                          onChange={e => setEditingShift(prev => prev ? {...prev, formData: {...prev.formData, start2: e.target.value}} : null)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('endTime')}</label>
                        <input 
                          type="time" 
                          value={editingShift.formData.end2}
                          onChange={e => setEditingShift(prev => prev ? {...prev, formData: {...prev.formData, end2: e.target.value}} : null)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('breakHoursLabel')} <span className="text-slate-500 text-xs">({t('optional')})</span></label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={editingShift.formData.breakHours || ""}
                      onChange={e => setEditingShift(prev => prev ? {...prev, formData: {...prev.formData, breakHours: Number(e.target.value) || 0}} : null)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      placeholder="e.g. 1.5"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button 
                onClick={() => setEditingShift(null)}
                className="flex-1 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {t('cancel')}
              </button>
              <button 
                onClick={saveShiftOverride}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> {t('saveSchedule')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}


