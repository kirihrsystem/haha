import React, { forwardRef } from "react";
import { Staff } from "../types";
import { formatCurrency } from "../lib/utils";

interface MonthlyPayrollReportPDFProps {
  payrollSummary: Array<{
    employee: Staff;
    basicSalary: number;
    workPay: number;
    totalCommission: number;
    totalWorkedHours: number;
    totalLateCheckIns: number;
    totalEarlyCheckIns: number;
    totalEarlyCheckOuts: number;
    totalExtraTimes: number;
    totalOvertimeHours: number;
    totalOTPay: number;
    fixedBonus: number;
    monthlyBonus: number;
    monthlyBonusNote: string;
    monthlyDeduction: number;
    monthlyDeductionNote: string;
    lateDeductions: number;
    absentPenalties: number;
    totalDeductions: number;
    finalSalary: number;
    payrollStatus: string;
    calculatedHourlyRate: number;
    absentDays: number;
  }>;
  selectedMonth: string;
  companyName?: string;
  logoUrl?: string;
  exchangeRate?: number;
  preparerName?: string;
  ceoName?: string;
}

const MonthlyPayrollReportPDF = forwardRef<HTMLDivElement, MonthlyPayrollReportPDFProps>(
  (
    {
      payrollSummary,
      selectedMonth,
      companyName = "ហាងការ៉េម BINGCHUN SIEMREAP",
      logoUrl,
      exchangeRate = 4000,
      preparerName,
      ceoName,
    },
    ref
  ) => {
    // Format date for the Khmer header
    const dateParts = selectedMonth.split("-");
    const year = dateParts[0] || "";
    const monthNum = parseInt(dateParts[1] || "1", 10);

    const khmerMonths = [
      "មករា",
      "កុម្ភៈ",
      "មីនា",
      "មេសា",
      "ឧសភា",
      "មិថុនា",
      "កក្កដា",
      "សីហា",
      "កញ្ញា",
      "តុលា",
      "វិច្ឆិកា",
      "ធ្នូ",
    ];
    const monthName = khmerMonths[monthNum - 1] || "";

    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const currentMonthName = khmerMonths[currentDate.getMonth()];
    const currentYear = currentDate.getFullYear();

    // Calculate totals for each column
    const totals = payrollSummary.reduce(
      (acc, s) => {
        const daysInMonth = 30; // standard approximation for rate calc fallback
        const stdHours = 8;
        const empDailySalary = s.employee.monthlySalary
          ? s.employee.monthlySalary / daysInMonth
          : s.calculatedHourlyRate * stdHours;

        acc.basicSalary += s.basicSalary || 0;
        acc.dailyRate += empDailySalary || 0;
        acc.hourlyRate += s.calculatedHourlyRate || 0;
        acc.otPay += s.totalOTPay || 0;
        acc.commission += s.totalCommission || 0;
        acc.bonus += (s.monthlyBonus || 0) + (s.fixedBonus || 0);
        acc.absentPenalties += s.absentPenalties || 0;
        acc.lateDeductions += s.lateDeductions || 0;
        acc.manualDeduction += s.monthlyDeduction || 0;
        acc.workPay += s.workPay || 0;
        acc.finalSalary += s.finalSalary || 0;
        return acc;
      },
      {
        basicSalary: 0,
        dailyRate: 0,
        hourlyRate: 0,
        otPay: 0,
        commission: 0,
        bonus: 0,
        absentPenalties: 0,
        lateDeductions: 0,
        manualDeduction: 0,
        workPay: 0,
        finalSalary: 0,
      }
    );

    return (
      <div
        ref={ref}
        className="bg-white text-black p-10 font-sans w-[1600px] min-h-[1131px] flex flex-col"
        style={{
          fontFamily: "'Kantumruy Pro', 'Inter', sans-serif",
          boxSizing: "border-box",
        }}
      >
        {/* Header section with Logo & Company Name */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-5">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                referrerPolicy="no-referrer"
                className="w-[100px] h-[100px] object-contain"
              />
            ) : (
              <div className="w-20 h-20 bg-[#00c853]/10 text-[#00c853] font-black text-3xl flex items-center justify-center rounded-xl border border-[#00c853]/20">
                L
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-800">
                {companyName}
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-1">Payroll Department</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500 font-medium">Monthly Payroll Report</p>
            <p className="text-sm font-mono font-bold text-slate-700 mt-1">
              {selectedMonth}
            </p>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#00c853] tracking-wide mb-2">
            តារាងបើកប្រាក់បៀវត្សបុគ្គលិក
          </h2>
          <p className="text-lg font-medium text-slate-600">
            ប្រចាំខែ {monthName} ឆ្នាំ {year}
          </p>
        </div>

        {/* Table */}
        <div className="border border-slate-300 rounded-lg shadow-sm">
          <table className="w-full border-collapse border border-slate-300 text-sm leading-relaxed table-fixed">
            <thead>
              <tr className="bg-[#00c853] text-white font-bold">
                <th className="border border-slate-300 p-2 text-center w-10">ល.រ</th>
                <th className="border border-slate-300 p-2 text-center w-24">ឈ្មោះ</th>
                <th className="border border-slate-300 p-2 text-center w-24">អក្សរឡាតាំង</th>
                <th className="border border-slate-300 p-2 text-center w-16">ប្រាក់ខែ<br/>គោល</th>
                <th className="border border-slate-300 p-2 text-center w-24">ម៉ោងធ្វើការ</th>
                <th className="border border-slate-300 p-2 text-center w-14">លុយ<br/>/ថ្ងៃ</th>
                <th className="border border-slate-300 p-2 text-center w-14">លុយ<br/>/ម៉ោង</th>
                <th className="border border-slate-300 p-2 text-center w-20">ថ្ងៃចូល</th>
                <th className="border border-slate-300 p-2 text-center w-16">ប្រាក់<br/>ធ្វើការ</th>
                <th className="border border-slate-300 p-2 text-center w-16">ថែមម៉ោង</th>
                <th className="border border-slate-300 p-2 text-center w-16">កម្រៃ<br/>ជើងសារ</th>
                <th className="border border-slate-300 p-2 text-center w-16">លើក<br/>ទឹកចិត្ត</th>
                <th className="border border-slate-300 p-2 text-center w-16">កាត់ប្រាក់<br/>(អវត្តមាន)</th>
                <th className="border border-slate-300 p-2 text-center w-16">កាត់ប្រាក់<br/>(យឺត)</th>
                <th className="border border-slate-300 p-2 text-center w-16">កាត់ប្រាក់<br/>(ផ្សេងៗ)</th>
                <th className="border border-slate-300 p-2 text-center w-24">ប្រាក់សរុប<br/>$</th>
                <th className="border border-slate-300 p-2 text-center w-24">ប្រាក់សរុប<br/>៛</th>
              </tr>
            </thead>
            <tbody>
              {payrollSummary.map((s, index) => {
                const daysInMonth = 30; // approximate
                const stdHours = 8;
                const dailyRateVal = s.employee.monthlySalary
                  ? s.employee.monthlySalary / daysInMonth
                  : s.calculatedHourlyRate * stdHours;

                const shiftTimeStr = s.employee.shiftStart && s.employee.shiftEnd
                  ? `${s.employee.shiftStart} - ${s.employee.shiftEnd}`
                  : "8:00 - 17:00";

                return (
                  <tr
                    key={`${s.employee.id}-${index}`}
                    className={index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
                  >
                    <td className="border border-slate-300 p-2 text-center text-slate-500 font-['Times_New_Roman'] font-semibold">
                      {index + 1}
                    </td>
                    <td className="border border-slate-300 p-2 font-semibold text-slate-800 break-words">
                      {s.employee.nameKh || s.employee.name}
                    </td>
                    <td className="border border-slate-300 p-2 font-medium text-slate-600 font-['Times_New_Roman'] break-words">
                      {s.employee.name}
                    </td>
                    <td className="border border-slate-300 p-2 text-center font-['Times_New_Roman'] text-slate-700">
                      {formatCurrency(s.basicSalary, "USD")}
                    </td>
                    <td className="border border-slate-300 p-2 text-center text-slate-600 font-['Times_New_Roman']">
                      {shiftTimeStr}
                    </td>
                    <td className="border border-slate-300 p-2 text-center font-['Times_New_Roman'] text-slate-600">
                      {formatCurrency(dailyRateVal, "USD")}
                    </td>
                    <td className="border border-slate-300 p-2 text-center font-['Times_New_Roman'] text-slate-600">
                      {formatCurrency(s.calculatedHourlyRate, "USD")}
                    </td>
                    <td className="border border-slate-300 p-2 text-center text-slate-600 font-['Times_New_Roman'] text-xs">
                      {s.employee.startingDate || "-"}
                    </td>
                    <td className="border border-slate-300 p-2 text-center font-['Times_New_Roman'] text-sky-600 font-semibold">
                      {formatCurrency(s.workPay, "USD")}
                    </td>
                    <td className="border border-slate-300 p-2 text-center font-['Times_New_Roman'] text-slate-600">
                      {s.totalOTPay > 0 ? formatCurrency(s.totalOTPay, "USD") : "-"}
                    </td>
                    <td className="border border-slate-300 p-2 text-center font-['Times_New_Roman'] text-green-600">
                      {s.totalCommission > 0 ? formatCurrency(s.totalCommission, "USD") : "-"}
                    </td>
                    <td className="border border-slate-300 p-2 text-center font-['Times_New_Roman'] text-blue-600">
                      {(s.monthlyBonus + s.fixedBonus) > 0 ? formatCurrency(s.monthlyBonus + s.fixedBonus, "USD") : "-"}
                    </td>
                    <td className="border border-slate-300 p-2 text-center font-['Times_New_Roman'] text-red-600">
                      {s.absentPenalties > 0 ? `-${formatCurrency(s.absentPenalties, "USD")}` : "-"}
                    </td>
                    <td className="border border-slate-300 p-2 text-center font-['Times_New_Roman'] text-orange-600">
                      {s.lateDeductions > 0 ? `-${formatCurrency(s.lateDeductions, "USD")}` : "-"}
                    </td>
                    <td className="border border-slate-300 p-2 text-center font-['Times_New_Roman'] text-amber-600">
                      {s.monthlyDeduction > 0 ? `-${formatCurrency(s.monthlyDeduction, "USD")}` : "-"}
                    </td>
                    <td className="border border-slate-300 p-2 text-center font-['Times_New_Roman'] text-slate-900 font-bold">
                      {formatCurrency(s.finalSalary, "USD")}
                    </td>
                    <td className="border border-slate-300 p-2 text-center font-['Times_New_Roman'] text-emerald-700 font-bold">
                      {formatCurrency(s.finalSalary, "KHR", exchangeRate)}
                    </td>
                  </tr>
                );
              })}

              {/* Totals Row */}
              <tr className="bg-slate-100 font-bold text-slate-900">
                <td colSpan={3} className="border border-slate-300 p-2 text-center text-sm">
                  សរុបរួម (Total)
                </td>
                <td className="border border-slate-300 p-2 text-center font-['Times_New_Roman'] text-slate-950 text-sm">
                  {formatCurrency(totals.basicSalary, "USD")}
                </td>
                <td className="border border-slate-300 p-2 text-center">-</td>
                <td className="border border-slate-300 p-2 text-center font-['Times_New_Roman'] text-slate-700">
                  {formatCurrency(totals.dailyRate, "USD")}
                </td>
                <td className="border border-slate-300 p-2 text-center font-['Times_New_Roman'] text-slate-700">
                  {formatCurrency(totals.hourlyRate / (payrollSummary.length || 1), "USD")}
                </td>
                <td className="border border-slate-300 p-2 text-center">-</td>
                <td className="border border-slate-300 p-2 text-center font-['Times_New_Roman'] text-sky-700">
                  {formatCurrency(totals.workPay, "USD")}
                </td>
                <td className="border border-slate-300 p-2 text-center font-['Times_New_Roman'] text-slate-700">
                  {totals.otPay > 0 ? formatCurrency(totals.otPay, "USD") : "-"}
                </td>
                <td className="border border-slate-300 p-2 text-center font-['Times_New_Roman'] text-green-700">
                  {totals.commission > 0 ? formatCurrency(totals.commission, "USD") : "-"}
                </td>
                <td className="border border-slate-300 p-2 text-center font-['Times_New_Roman'] text-blue-700">
                  {totals.bonus > 0 ? formatCurrency(totals.bonus, "USD") : "-"}
                </td>
                <td className="border border-slate-300 p-2 text-center font-['Times_New_Roman'] text-red-600">
                  {totals.absentPenalties > 0 ? `-${formatCurrency(totals.absentPenalties, "USD")}` : "-"}
                </td>
                <td className="border border-slate-300 p-2 text-center font-['Times_New_Roman'] text-orange-600">
                  {totals.lateDeductions > 0 ? `-${formatCurrency(totals.lateDeductions, "USD")}` : "-"}
                </td>
                <td className="border border-slate-300 p-2 text-center font-['Times_New_Roman'] text-amber-600">
                  {totals.manualDeduction > 0 ? `-${formatCurrency(totals.manualDeduction, "USD")}` : "-"}
                </td>
                <td className="border border-slate-300 p-2 text-center font-['Times_New_Roman'] text-slate-950">
                  {formatCurrency(totals.finalSalary, "USD")}
                </td>
                <td className="border border-slate-300 p-2 text-center font-['Times_New_Roman'] text-emerald-800">
                  {formatCurrency(totals.finalSalary, "KHR", exchangeRate)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer info: Rate, Signature, Dates */}
        <div className="mt-8 flex justify-between items-center text-sm text-slate-600 px-2">
          <div className="whitespace-nowrap" style={{ fontFamily: "'Kantumruy Pro', sans-serif" }}>
            <span className="font-semibold text-slate-800">អត្រាប្តូរប្រាក់ (Exchange Rate):</span> 1 USD = {exchangeRate} KHR
          </div>
          <div className="whitespace-nowrap" style={{ fontFamily: "'Kantumruy Pro', sans-serif" }}>
            <span className="font-semibold text-slate-800">កាលបរិច្ឆេទបង្កើតតារាង (Generated on):</span> {new Date().toLocaleString()}
          </div>
        </div>

        {/* Footer Signature Block */}
        <div className="flex justify-between px-16 text-base mt-16 pb-8">
          <div className="text-center" style={{ fontFamily: "'Kantumruy Pro', sans-serif" }}>
            <p className="font-semibold text-slate-700 mb-20 whitespace-nowrap">រៀបចំដោយ (Prepared By)</p>
            <p className="font-medium text-slate-800 border-t border-slate-400 pt-3 w-56 mx-auto whitespace-nowrap">
              {preparerName || "អ្នករៀបចំ"}
            </p>
          </div>
          <div className="text-center" style={{ fontFamily: "'Kantumruy Pro', sans-serif" }}>
            <p className="font-medium text-slate-600 mb-3 text-sm whitespace-nowrap">
              ធ្វើនៅថ្ងៃទី {currentDay} ខែ {currentMonthName} ឆ្នាំ {currentYear}
            </p>
            <p className="font-semibold text-slate-700 mb-20 whitespace-nowrap">ប្រធានគ្រប់គ្រង (CEO / Manager)</p>
            <p className="font-medium text-slate-800 border-t border-slate-400 pt-3 w-56 mx-auto whitespace-nowrap">
              {ceoName || "ប្រធានគ្រប់គ្រង"}
            </p>
          </div>
        </div>
      </div>
    );
  }
);

MonthlyPayrollReportPDF.displayName = "MonthlyPayrollReportPDF";

export default MonthlyPayrollReportPDF;
