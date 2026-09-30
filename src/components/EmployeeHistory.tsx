import React, { useState, useEffect, useRef } from "react";
import { formatCurrency, formatHours } from "../lib/utils";
import { useTranslation } from "react-i18next";
import { collection, query, where, getDocs, orderBy, updateDoc, doc, addDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuthStore, useSettingsStore } from "../store";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, Clock, DollarSign, ArrowRight, AlertCircle, CheckCircle2, Download, Info, Briefcase, Zap, TrendingUp, Gift, MinusCircle, AlertTriangle, UserX, Coins, Timer } from "lucide-react";
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import PayrollReceiptPDF from "./PayrollReceiptPDF";
import { getExpectedShiftDuration, calculateOvertimePay, getCalculatedHourlyRate, hasShiftEnded } from "../utils/shiftUtils";
import { getDaysInMonth, format } from "date-fns";
import { sendTelegramNotification, sendDirectTelegramMessage, formatTelegramCurrency } from "../utils/telegramUtils";
import { isPayrollFieldVisible } from "../utils/payrollVisibility";
import ImagePreviewModal from "../components/ImagePreviewModal";

function calculateShiftHours(start?: string, end?: string): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let s = (sh || 0) * 60 + (sm || 0);
  let e = (eh || 0) * 60 + (em || 0);
  if (e < s) e += 24 * 60;
  return (e - s) / 60;
}

export default function EmployeeHistory() {
  const { user } = useAuthStore();
  const { settings } = useSettingsStore();
  const { t, i18n } = useTranslation();
  
  const pdfRef = useRef<HTMLDivElement>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => 
    new Date().toISOString().slice(0, 7)
  );
  
  const [logs, setLogs] = useState<any[]>([]);
  const [bonus, setBonus] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [selectedMonth, user]);

  const fetchHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const startDate = `${selectedMonth}-01`;
      const endDate = `${selectedMonth}-31`;
      
      const logsQ = query(
        collection(db, "logs"), 
        where("staffId", "==", user.id),
        where("date", ">=", startDate),
        where("date", "<=", endDate)
      );
      const logsSn = await getDocs(logsQ);
      setLogs(logsSn.docs.map(d => ({ id: d.id, ...d.data() })));

      const bonusQ = query(
        collection(db, "bonuses"),
        where("staffId", "==", user.id),
        where("month", "==", selectedMonth)
      );
      const bonusSn = await getDocs(bonusQ);
      if (!bonusSn.empty) {
        setBonus({ id: bonusSn.docs[0].id, ...bonusSn.docs[0].data() });
      } else {
        setBonus(null);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const completedLogs = logs.filter(l => l.status === "checked_out");
  
  let totalWorkedHours = 0;
  let totalLateCheckIns = 0;
  let totalEarlyCheckIns = 0;
  let totalEarlyCheckOuts = 0;
  let totalExtraTimes = 0;
  let totalOvertimeHours = 0;

  const daysInMonth = getDaysInMonth(new Date(`${selectedMonth}-01`));
  const dailySalaryStatic = (user?.monthlySalary || 0) / daysInMonth;
  
  let stdExpectedHours = Math.max(0, calculateShiftHours(user?.shiftStart, user?.shiftEnd) + calculateShiftHours(user?.shift2Start, user?.shift2End) - (user?.breakHours || 0));
  if (stdExpectedHours === 0) stdExpectedHours = 8;
  const calculatedHourlyRate = user?.monthlySalary ? (dailySalaryStatic / stdExpectedHours) : (user?.hourlyRate || 0);

  const displayLogs: any[] = [];
  let absentDays = 0;
  
  let totalAbsentPenalty = 0;
  let totalEarnedRegular = 0;
  let totalOTPay = 0;
  let totalLateDeduction = 0;
  let totalExpectedHoursMonth = 0;
  let totalCommission = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
    const log = completedLogs.find(l => l.date === dateStr);
    
    const expectedHours = getExpectedShiftDuration(
       dateStr,
       user?.shiftStart,
       user?.shiftEnd,
       (user as any)?.shiftOverrides,
       user?.shift2Start,
       user?.shift2End,
       user?.breakHours
    );
    totalExpectedHoursMonth += expectedHours;
    const isPastOrToday = hasShiftEnded(dateStr, user?.shiftStart, user?.shiftEnd, (user as any)?.shiftOverrides, user?.shift2Start, user?.shift2End);

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

        const logHourlyRate = getCalculatedHourlyRate(user, dateStr);
        const otPay = calculateOvertimePay(log.overtimeHours || 0, logHourlyRate, settings || undefined);
        totalOTPay += otPay;
        
        if (log.commission) {
            totalCommission += parseFloat(log.commission);
        }

        let earnedReg = (log.dailySalary || 0) - otPay;
        if (expectedHours === 0 && user?.monthlySalary) {
           const dailySalaryStatic = user.monthlySalary / daysInMonth;
           earnedReg = Math.max(earnedReg, dailySalaryStatic);
        }
        totalEarnedRegular += earnedReg;
        totalLateDeduction += (log.lateDeduction || 0);
        displayLogs.push({...log, dailySalary: earnedReg + otPay, totalEarnings: earnedReg + otPay});
      }
    } else {
      if (expectedHours === 0) {
        if (user?.monthlySalary) {
           totalEarnedRegular += dailySalaryStatic;
        }
        displayLogs.push({
           id: `day-off-${dateStr}`,
           date: dateStr,
           isDayOff: true,
           dailySalary: user?.monthlySalary ? dailySalaryStatic : 0,
           totalEarnings: user?.monthlySalary ? dailySalaryStatic : 0,
           note: user?.monthlySalary ? "Weekly Rest Day (Paid)" : "Weekly Rest Day",
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

  const isMonthly = !!user?.monthlySalary;
  const displayBasePay = isMonthly ? (user?.monthlySalary || 0) : (totalExpectedHoursMonth * calculatedHourlyRate);
  const workPay = totalEarnedRegular + totalLateDeduction;

  
  const fixedBonus = user?.bonus || 0;
  const monthlyBonus = bonus?.amount || 0;
  const monthlyDeduction = bonus?.deductionAmount || 0;
  
  const totalDeductions = totalLateDeduction + totalAbsentPenalty + monthlyDeduction;
  const finalSalary = workPay + totalCommission + fixedBonus + monthlyBonus + totalOTPay - totalDeductions;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as any, stiffness: 300, damping: 24 } }
  };

  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;
    const el = pdfRef.current;
    
    // Briefly make the element visible in the viewport so html-to-image can capture it properly
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
        orientation: 'landscape', // the layout is wide
        unit: 'px',
        format: [794, 559]
      });
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, 794, 559);
      pdf.save(`Payroll_${selectedMonth}_${user?.name}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF", error);
    } finally {
      el.style.display = prevDisplay;
    }
  };

  const handleConfirmPayroll = async () => {
    if (!bonus?.id || !user) return;
    
    try {
      await updateDoc(doc(db, "bonuses", bonus.id), {
        payrollStatus: "confirmed"
      });
      
      await addDoc(collection(db, "notifications"), {
        companyId: user.companyId,
        userId: "admin", 
        role: "admin",
        type: "payroll",
        title: "Payroll Confirmed",
        message: `${user.name} has confirmed their payroll for ${selectedMonth}.`,
        read: false,
        createdAt: new Date().toISOString(),
      });

      const empName = user.nameKh || user.name;
      await sendTelegramNotification(
        `✅ <b>ទទួលស្គាល់របាយការណ៍បៀវត្ស (Payroll Confirmed by Employee)</b>\n<b>បុគ្គលិក:</b> ${empName}\n<b>ខែ:</b> ${selectedMonth}\n<b>ប្រាក់ខែសរុប:</b> ${formatTelegramCurrency(finalSalary)}`,
        true
      );
      if (user.telegramChatId) {
        await sendDirectTelegramMessage(
          user.telegramChatId,
          `✅ <b>បានទទួលស្គាល់របាយការណ៍បៀវត្ស (Payroll Confirmed)</b>\n<b>ខែ:</b> ${selectedMonth}\n<b>ប្រាក់ខែសរុប:</b> ${formatTelegramCurrency(finalSalary)}\n\nអ្នកបានទទួលស្គាល់របាយការណ៍បៀវត្សនេះរួចរាល់ហើយ។ (You have confirmed this payroll report).`
        );
      }
      
      fetchHistory();
    } catch (error) {
      console.error("Failed to confirm payroll", error);
      alert("Failed to confirm payroll");
    }
  };

  const payrollStatus = bonus?.payrollStatus || "draft";

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="space-y-8 mt-4 pb-24"
    >
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-3xl gap-4 border-2 border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-xs">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white font-display">
              ប្រវត្តិនិងប្រាក់ខែ
            </h3>
            <p className="text-xs font-semibold text-slate-500">History & Payroll Summary</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Distinct Month Selector with clear border */}
          <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all shadow-xs w-full sm:w-auto">
            <Calendar className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
            <input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent border-0 outline-none text-slate-800 dark:text-slate-100 font-bold text-sm cursor-pointer w-full sm:w-auto"
            />
          </div>

          {payrollStatus === "pending_review" && (
            <button
               onClick={handleConfirmPayroll}
               className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold rounded-2xl border-2 border-amber-400 shadow-md text-sm transition-all"
            >
               <span>Confirm Payroll</span>
            </button>
          )}
          {payrollStatus === "confirmed" && (
            <span className="flex items-center justify-center px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold rounded-2xl border-2 border-emerald-300 dark:border-emerald-800 text-xs shadow-xs">
              Confirmed ✓
            </span>
          )}
          {payrollStatus === "paid" && (
            <span className="flex items-center justify-center px-3.5 py-2 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 font-bold rounded-2xl border-2 border-green-300 dark:border-green-800 text-xs shadow-xs">
              Paid ✓
            </span>
          )}

          {/* New Shape of PDF Download Button */}
          <button
             onClick={handleDownloadPDF}
             className="group relative inline-flex items-center justify-center gap-2 px-4.5 py-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/35 active:scale-95 transition-all duration-200 border border-indigo-400/30 cursor-pointer"
             title="Download Payroll PDF"
          >
             <div className="w-6 h-6 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
               <Download className="w-3.5 h-3.5 text-white" />
             </div>
             <span className="font-bold tracking-tight">Export PDF</span>
          </button>
        </div>
    </motion.div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div id="payroll-receipt" className="space-y-6">
          <motion.div variants={containerVariants} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {/* 1. Final Salary Hero Card */}
            <motion.div 
              variants={itemVariants} 
              className="p-5 rounded-3xl border-2 border-indigo-200 dark:border-indigo-800/80 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 dark:from-indigo-950/40 dark:via-slate-900/90 dark:to-purple-950/30 relative overflow-hidden group hover:shadow-lg transition-all duration-300 col-span-2 sm:col-span-3 lg:col-span-2 flex flex-col justify-between shadow-sm"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-600 dark:text-slate-300">ប្រាក់ខែសរុប</span>
                    <span className="block text-[11px] text-slate-400 font-medium">Final Salary</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 uppercase tracking-wide">
                  Net Pay
                </span>
              </div>
              <div>
                <span className={`block text-2xl md:text-3xl font-extrabold font-display tracking-tight ${finalSalary < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                  {formatCurrency(finalSalary, "USD")}
                </span>
                <span className={`block text-xs font-bold mt-1 ${finalSalary < 0 ? 'text-rose-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                  ≈ {formatCurrency(finalSalary, "KHR", settings?.exchangeRate)}
                </span>
              </div>
            </motion.div>
            
            {/* 2. Basic Salary */}
            {isPayrollFieldVisible(settings?.employeePayrollDetails, 'basicSalary') && (
              <motion.div 
                variants={itemVariants} 
                className="p-4 rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate">ប្រាក់ខែគោល</span>
                    <span className="block text-[10px] text-slate-400 truncate">Basic Salary</span>
                  </div>
                </div>
                <span className="block text-lg font-extrabold text-slate-900 dark:text-white font-display mt-1">
                  {formatCurrency(displayBasePay, "USD")}
                </span>
              </motion.div>
            )}
            
            {/* 3. Work Pay */}
            {isPayrollFieldVisible(settings?.employeePayrollDetails, 'workPay') && (
              <motion.div 
                variants={itemVariants} 
                className="p-4 rounded-2xl border-2 border-indigo-100 dark:border-indigo-950/60 bg-gradient-to-b from-indigo-50/30 to-white dark:from-indigo-950/20 dark:to-slate-900 shadow-xs hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/60 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate">ប្រាក់ធ្វើការ</span>
                    <span className="block text-[10px] text-slate-400 truncate">Work Pay</span>
                  </div>
                </div>
                <div>
                  <span className="block text-lg font-extrabold text-slate-900 dark:text-white font-display">
                    {formatCurrency(workPay, "USD")}
                  </span>
                  <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <Clock className="w-3 h-3 text-indigo-500" />
                    <span>{formatHours(totalWorkedHours)}</span>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* 4. Overtime Pay */}
            {isPayrollFieldVisible(settings?.employeePayrollDetails, 'overtimePay') && (
              <motion.div 
                variants={itemVariants} 
                className="p-4 rounded-2xl border-2 border-amber-200/80 dark:border-amber-900/50 bg-gradient-to-b from-amber-50/40 to-white dark:from-amber-950/20 dark:to-slate-900 shadow-xs hover:shadow-md hover:border-amber-300 dark:hover:border-amber-800 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate">ថែមម៉ោង</span>
                    <span className="block text-[10px] text-slate-400 truncate">Overtime Pay</span>
                  </div>
                </div>
                <div>
                  <span className="block text-lg font-extrabold text-amber-600 dark:text-amber-400 font-display">
                    +{formatCurrency(totalOTPay, "USD")}
                  </span>
                  <span className="block text-[11px] font-semibold text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                    {formatHours(totalOvertimeHours)} OT
                  </span>
                </div>
              </motion.div>
            )}

            {/* 5. Commission */}
            {isPayrollFieldVisible(settings?.employeePayrollDetails, 'commission') && (
              <motion.div 
                variants={itemVariants} 
                className="p-4 rounded-2xl border-2 border-emerald-200/80 dark:border-emerald-900/50 bg-gradient-to-b from-emerald-50/40 to-white dark:from-emerald-950/20 dark:to-slate-900 shadow-xs hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-800 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate">កម្រៃជើងសារ</span>
                    <span className="block text-[10px] text-slate-400 truncate">Commission</span>
                  </div>
                </div>
                <span className="block text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-display mt-1">
                  +{formatCurrency(totalCommission, "USD")}
                </span>
              </motion.div>
            )}
            
            {/* 6. Month Bonus */}
            {isPayrollFieldVisible(settings?.employeePayrollDetails, 'monthlyBonus') && (
              <motion.div 
                variants={itemVariants} 
                className="p-4 rounded-2xl border-2 border-teal-200/80 dark:border-teal-900/50 bg-gradient-to-b from-teal-50/40 to-white dark:from-teal-950/20 dark:to-slate-900 shadow-xs hover:shadow-md hover:border-teal-300 dark:hover:border-teal-800 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-xl bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate">ប្រាក់លើកទឹកចិត្ត</span>
                    <span className="block text-[10px] text-slate-400 truncate">Month Bonus</span>
                  </div>
                </div>
                <div>
                  <span className="block text-lg font-extrabold text-teal-600 dark:text-teal-400 font-display">
                    +{formatCurrency(fixedBonus + monthlyBonus, "USD")}
                  </span>
                  {bonus?.note && (
                    <span className="block text-[10px] font-semibold text-teal-700 dark:text-teal-300 mt-1 bg-teal-100/60 dark:bg-teal-900/40 px-2 py-0.5 rounded-lg truncate" title={bonus.note}>
                      {bonus.note}
                    </span>
                  )}
                </div>
              </motion.div>
            )}
            
            {/* 7. Manual Deduction */}
            {isPayrollFieldVisible(settings?.employeePayrollDetails, 'manualDeduction') && (
              <motion.div 
                variants={itemVariants} 
                className="p-4 rounded-2xl border-2 border-sky-200/80 dark:border-sky-900/50 bg-gradient-to-b from-sky-50/40 to-white dark:from-sky-950/20 dark:to-slate-900 shadow-xs hover:shadow-md hover:border-sky-300 dark:hover:border-sky-800 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-xl bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                    <MinusCircle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate">កាត់ប្រាក់ (ផ្សេងៗ)</span>
                    <span className="block text-[10px] text-slate-400 truncate">Manual Deduction</span>
                  </div>
                </div>
                <div>
                  <span className="block text-lg font-extrabold text-sky-600 dark:text-sky-400 font-display">
                    -{formatCurrency(monthlyDeduction, "USD")}
                  </span>
                  {bonus?.deductionNote && (
                    <span className="block text-[10px] font-semibold text-sky-700 dark:text-sky-300 mt-1 bg-sky-100/60 dark:bg-sky-900/40 px-2 py-0.5 rounded-lg truncate" title={bonus.deductionNote}>
                      {bonus.deductionNote}
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {/* 8. Late Deduction */}
            {isPayrollFieldVisible(settings?.employeePayrollDetails, 'lateDeduction') && (
              <motion.div 
                variants={itemVariants} 
                className="p-4 rounded-2xl border-2 border-orange-200/80 dark:border-orange-900/50 bg-gradient-to-b from-orange-50/40 to-white dark:from-orange-950/20 dark:to-slate-900 shadow-xs hover:shadow-md hover:border-orange-300 dark:hover:border-orange-800 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-xl bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate">កាត់ប្រាក់ (យឺត)</span>
                    <span className="block text-[10px] text-slate-400 truncate">Late Deduction</span>
                  </div>
                </div>
                <span className="block text-lg font-extrabold text-orange-600 dark:text-orange-400 font-display mt-1">
                  -{formatCurrency(totalLateDeduction, "USD")}
                </span>
              </motion.div>
            )}

            {/* 9. Absent Penalties */}
            {isPayrollFieldVisible(settings?.employeePayrollDetails, 'absentPenalties') && (
              <motion.div 
                variants={itemVariants} 
                className="p-4 rounded-2xl border-2 border-rose-200/80 dark:border-rose-900/50 bg-gradient-to-b from-rose-50/40 to-white dark:from-rose-950/20 dark:to-slate-900 shadow-xs hover:shadow-md hover:border-rose-300 dark:hover:border-rose-800 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <UserX className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate">កាត់ប្រាក់ (អវត្តមាន)</span>
                    <span className="block text-[10px] text-slate-400 truncate">Absent Penalties</span>
                  </div>
                </div>
                <span className="block text-lg font-extrabold text-rose-600 dark:text-rose-400 font-display mt-1">
                  -{formatCurrency(totalAbsentPenalty, "USD")}
                </span>
              </motion.div>
            )}

            {/* 10. Total Deductions */}
            {isPayrollFieldVisible(settings?.employeePayrollDetails, 'deductions') && (
              <motion.div 
                variants={itemVariants} 
                className="p-4 rounded-2xl border-2 border-red-200/90 dark:border-red-900/60 bg-gradient-to-b from-red-50/50 to-white dark:from-red-950/30 dark:to-slate-900 shadow-xs hover:shadow-md hover:border-red-300 dark:hover:border-red-800 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-xl bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                    <MinusCircle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate">ការកាត់ប្រាក់សរុប</span>
                    <span className="block text-[10px] text-slate-400 truncate">Total Deductions</span>
                  </div>
                </div>
                <span className="block text-lg font-extrabold text-red-600 dark:text-red-400 font-display mt-1">
                  -{formatCurrency(totalLateDeduction + totalAbsentPenalty + monthlyDeduction, "USD")}
                </span>
              </motion.div>
            )}

            {/* 11. Hourly Rate */}
            {isPayrollFieldVisible(settings?.employeePayrollDetails, 'hourlyRate') && (
              <motion.div 
                variants={itemVariants} 
                className="p-4 rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                    <Timer className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate">អត្រាប្រចាំម៉ោង</span>
                    <span className="block text-[10px] text-slate-400 truncate">Hourly Rate</span>
                  </div>
                </div>
                <span className="block text-lg font-extrabold text-slate-800 dark:text-slate-200 font-display mt-1">
                  {formatCurrency(calculatedHourlyRate, "USD")}
                </span>
              </motion.div>
            )}
    </motion.div>

          {/* Activity Summary Tags */}
          <motion.div variants={itemVariants} className="flex flex-wrap gap-3 py-2">
            <div className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-700 dark:bg-sky-500/10 dark:text-sky-400 rounded-full text-sm font-semibold border border-red-100 dark:border-sky-500/20">
              <AlertCircle className="w-4 h-4" />
              <span>{t("lateStatus")}: {totalLateCheckIns}</span>
            </div>
            <div className="flex items-center gap-1.5 px-4 py-2 bg-orange-50 text-orange-700 dark:bg-sky-500/10 dark:text-sky-400 rounded-full text-sm font-semibold border border-orange-100 dark:border-sky-500/20">
              <LogOutIcon className="w-4 h-4" />
              <span>{t("earlyCheckOutStatus")}: {totalEarlyCheckOuts}</span>
            </div>
            <div className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-full text-sm font-semibold border border-indigo-100 dark:border-indigo-500/20">
              <SparklesIcon className="w-4 h-4" />
              <span>{t("extra")}: {totalExtraTimes}</span>
            </div>
    </motion.div>

          <motion.div variants={itemVariants} className="rounded-3xl border-2 border-slate-200/80 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/80 shadow-sm">
            <div className="p-5 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-slate-900 dark:text-white font-display text-lg">របាយការណ៍ប្រចាំថ្ងៃ <span className="text-slate-400 font-medium text-base ml-2">/ Daily Logs</span></h4>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
              <AnimatePresence>
                {displayLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((log, index) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={`${log.id}-${index}`} 
                    className={`p-5 flex flex-col md:flex-row justify-between gap-6 hover:bg-white/40 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${(log.isDayOff || log.isAbsent || log.isPermission) ? "opacity-60 bg-slate-50/50 dark:bg-slate-900/30" : ""}`}
                    onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                  >
                    <div className="flex-1 w-full">
                      <div className="font-bold text-slate-900 dark:text-white font-display text-lg mb-3 flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          {log.date}
                          {log.isDayOff ? (
                             <span className="text-xs bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md ml-2 uppercase tracking-wide">Day Off</span>
                          ) : log.isAbsent ? (
                             <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-md ml-2 uppercase tracking-wide">Absent</span>
                          ) : log.isPermission ? (
                             <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-md ml-2 uppercase tracking-wide">Permission</span>
                          ) : (
                             <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          )}
                        </div>
                        <span className="text-sm font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{expandedLogId === log.id ? "-" : "+"}</span>
                      </div>
                      
                      {expandedLogId === log.id && (
                        <div className="flex flex-col md:flex-row justify-between gap-6 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
                          <div className="flex-1">
                            {log.note && (
                              <div className="mb-3 text-sm text-slate-500 italic">
                                {log.note}
                              </div>
                            )}
                            {!(log.isDayOff || log.isAbsent || log.isPermission) && (
                              <>
                                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 text-sm text-slate-600 dark:text-slate-300 mb-3 font-mono">
                                   <div className="flex flex-col gap-2">
                                     <span className="bg-white/50 dark:bg-slate-950/40 backdrop-blur-sm px-3 py-1.5 rounded-[1.25rem] border border-white/60 dark:border-slate-700/50 flex items-center justify-between gap-2">
                                       <span className="text-slate-400 text-xs uppercase tracking-wider">{t("in")} 1</span> {log.timeIn ? new Date(log.timeIn).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : '-'}
                                     </span>
                                     {log.checkInPhotoUrl && (
                                       <img loading="lazy" decoding="async" src={log.checkInPhotoUrl} alt="Check In 1" className="w-20 h-20 rounded-lg object-cover border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setPreviewImage(log.checkInPhotoUrl)} />
                                     )}
                                   </div>
                                   <div className="flex flex-col gap-2">
                                     <span className="bg-white/50 dark:bg-slate-950/40 backdrop-blur-sm px-3 py-1.5 rounded-[1.25rem] border border-white/60 dark:border-slate-700/50 flex items-center justify-between gap-2">
                                       <span className="text-slate-400 text-xs uppercase tracking-wider">{t("out")} 1</span> {log.timeOut ? new Date(log.timeOut).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : '-'}
                                     </span>
                                     {log.checkOutPhotoUrl && (
                                       <img loading="lazy" decoding="async" src={log.checkOutPhotoUrl} alt="Check Out 1" className="w-20 h-20 rounded-lg object-cover border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setPreviewImage(log.checkOutPhotoUrl)} />
                                     )}
                                   </div>
                                   {log.timeIn2 && (
                                      <div className="flex flex-col gap-2">
                                        <span className="bg-white/50 dark:bg-slate-950/40 backdrop-blur-sm px-3 py-1.5 rounded-[1.25rem] border border-white/60 dark:border-slate-700/50 flex items-center justify-between gap-2">
                                          <span className="text-slate-400 text-xs uppercase tracking-wider">{t("in")} 2</span> {new Date(log.timeIn2).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                                        </span>
                                        {log.checkIn2PhotoUrl && (
                                          <img loading="lazy" decoding="async" src={log.checkIn2PhotoUrl} alt="Check In 2" className="w-20 h-20 rounded-lg object-cover border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setPreviewImage(log.checkIn2PhotoUrl)} />
                                        )}
                                      </div>
                                   )}
                                   {log.timeOut2 && (
                                      <div className="flex flex-col gap-2">
                                        <span className="bg-white/50 dark:bg-slate-950/40 backdrop-blur-sm px-3 py-1.5 rounded-[1.25rem] border border-white/60 dark:border-slate-700/50 flex items-center justify-between gap-2">
                                          <span className="text-slate-400 text-xs uppercase tracking-wider">{t("out")} 2</span> {new Date(log.timeOut2).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                                        </span>
                                        {log.checkOut2PhotoUrl && (
                                          <img loading="lazy" decoding="async" src={log.checkOut2PhotoUrl} alt="Check Out 2" className="w-20 h-20 rounded-lg object-cover border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setPreviewImage(log.checkOut2PhotoUrl)} />
                                        )}
                                      </div>
                                   )}
                                </div>
                                <div className="flex gap-2">
                                   {(log.late || log.lateCheckIn) && <span className="text-[10px] bg-red-100 text-red-700 px-2.5 py-1 rounded-md uppercase font-bold tracking-wider whitespace-nowrap">{t("lateStatus")} ({Math.floor((log.lateMinutes || 0) / 60)}h{Math.round((log.lateMinutes || 0) % 60)}mn)</span>}
                                   {log.earlyCheckIn && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md uppercase font-bold tracking-wider">{t("earlyCheckIn")}</span>}
                                   {(log.earlyLeave || log.earlyCheckOut) && <span className="text-[10px] bg-orange-100 text-orange-700 px-2.5 py-1 rounded-md uppercase font-bold tracking-wider">{t("earlyCheckOutStatus")}</span>}
                                   {log.extraTime && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-md uppercase font-bold tracking-wider">{t("extra")}</span>}
                                </div>
                              </>
                            )}
                          </div>
                          
                          <div className="w-full md:w-auto mt-4 md:mt-0 flex flex-col items-end">
                            <div className="w-full sm:min-w-[240px] bg-white/40 dark:bg-slate-950/20 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col gap-2.5">
                              {!(log.isDayOff || log.isAbsent || log.isPermission) && (
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Worked Time</span>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">{formatHours((log.regularHours || 0) + (log.overtimeHours || 0))}</span>
                                </div>
                              )}
                              {(() => {
                                const logHourlyRate = getCalculatedHourlyRate(user, log.date);
                                const logOtPay = calculateOvertimePay(log.overtimeHours || 0, logHourlyRate, settings || undefined);
                                const regWorkPay = (log.isDayOff || log.isAbsent || log.isPermission) ? (log.dailySalary || 0) : ((log.dailySalary || 0) + (log.lateDeduction || 0) - logOtPay);
                                return (
                                  <>
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Regular Work Pay</span>
                                      <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(regWorkPay, "USD")}</span>
                                    </div>
                                    {!(log.isDayOff || log.isAbsent || log.isPermission) && (
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Overtime (OT)</span>
                                      <span className={`font-semibold ${log.overtimeHours && log.overtimeHours > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-slate-200"}`}>
                                        {log.overtimeHours && log.overtimeHours > 0 
                                          ? `${formatHours(log.overtimeHours)} (+${formatCurrency(logOtPay, "USD")})`
                                          : "0h 00m ($0.00)"}
                                      </span>
                                    </div>
                                    )}
                                  </>
                                );
                              })()}
                              {!(log.isDayOff || log.isAbsent || log.isPermission) && (
                                <div className="flex justify-between items-center text-sm text-red-500">
                                  <span className="font-medium whitespace-nowrap">Late Deduction</span>
                                  <span className="font-semibold">{log.lateDeduction && log.lateDeduction > 0 ? `-${formatCurrency(log.lateDeduction, "USD")}` : "$0.00"}</span>
                                </div>
                              )}
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Work Pay</span>
                                <span className={`font-semibold ${(log.totalEarnings || 0) < 0 ? 'text-red-500' : 'text-slate-800 dark:text-slate-200'}`}>{formatCurrency(log.totalEarnings || 0, "USD")}</span>
                              </div>
                              <div className="flex justify-between items-center pt-2.5 mt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider whitespace-nowrap">Total Earnings</span>
                                <div className="text-right flex flex-col items-end">
                                  <div className={`text-xl font-bold font-display leading-tight ${(log.totalEarnings || 0) < 0 ? 'text-red-500' : 'text-ice-600'}`}>{formatCurrency(log.totalEarnings || 0, "USD")}</div>
                                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-500 mt-0.5">{formatCurrency(log.totalEarnings || 0, "KHR", settings?.exchangeRate || 4000)}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
    </motion.div>
                ))}
              </AnimatePresence>
              {completedLogs.length === 0 && (
                <div className="p-12 flex flex-col items-center justify-center text-slate-400">
                  <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-center mb-4">
                    <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="font-medium">គ្មានទិន្នន័យ / No records found</p>
                </div>
              )}
            </div>
    </motion.div>
        </div>
      )}

      {/* Hidden container for PDF export */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', zIndex: -100 }}>
         <PayrollReceiptPDF 
           ref={pdfRef}
           user={user}
           selectedMonth={selectedMonth}
           basicSalary={displayBasePay}
           workPay={workPay}
           monthlyBonus={monthlyBonus}
           fixedBonus={fixedBonus}
           monthlyDeduction={monthlyDeduction}
           lateDeductions={totalLateDeduction}
           absentPenalties={totalAbsentPenalty}
           finalSalary={finalSalary}
           overtimeHours={totalOvertimeHours}
           totalOTPay={totalOTPay}
         />
      </div>
      <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
  </motion.div>
); }

// Helpers for missing icons
function LogOutIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>;
}

function SparklesIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>;
}
