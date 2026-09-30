import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import { Staff, PayrollDetailVisibility } from '../types';
import { formatCurrency } from '../lib/utils';
import { useSettingsStore } from '../store';
import { isPayrollFieldVisible } from '../utils/payrollVisibility';

interface PayrollReceiptPDFProps {
  user: Staff | null;
  selectedMonth: string;
  basicSalary: number;
  workPay: number;
  monthlyBonus: number;
  fixedBonus: number;
  monthlyDeduction: number;
  lateDeductions?: number;
  absentPenalties?: number;
  finalSalary: number;
  overtimeHours: number;
  totalOTPay?: number;
  ceoName?: string;
  visibility?: PayrollDetailVisibility;
}

const PayrollReceiptPDF = forwardRef<HTMLDivElement, PayrollReceiptPDFProps>(({
  user,
  selectedMonth,
  basicSalary,
  workPay,
  monthlyBonus,
  fixedBonus,
  monthlyDeduction,
  lateDeductions = 0,
  absentPenalties = 0,
  finalSalary,
  overtimeHours,
  totalOTPay = 0,
  ceoName,
  visibility
}, ref) => {
  const settings = useSettingsStore.getState().settings;
  const exchangeRate = settings?.exchangeRate || 4000;
  const activeVisibility = visibility || settings?.employeePayrollDetails;

  const showBasicSalary = isPayrollFieldVisible(activeVisibility, 'basicSalary');
  const showWorkPay = isPayrollFieldVisible(activeVisibility, 'workPay');
  const showOTPay = isPayrollFieldVisible(activeVisibility, 'overtimePay');
  const showBonus = isPayrollFieldVisible(activeVisibility, 'monthlyBonus');
  const showManualDeduction = isPayrollFieldVisible(activeVisibility, 'manualDeduction');
  const showLateDeduction = isPayrollFieldVisible(activeVisibility, 'lateDeduction');
  const showAbsentPenalties = isPayrollFieldVisible(activeVisibility, 'absentPenalties');
  const showDeductions = isPayrollFieldVisible(activeVisibility, 'deductions');
  
  // Format date for the header
  const dateParts = selectedMonth.split('-');
  const year = dateParts[0];
  const monthNum = parseInt(dateParts[1], 10);
  
  const khmerMonths = [
    "មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា",
    "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"
  ];
  const monthName = khmerMonths[monthNum - 1];

  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const currentMonthName = khmerMonths[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  return (
    <div 
      ref={ref} 
      className="bg-white text-black p-4 font-sans w-[794px] h-[559px] flex flex-col relative"
      style={{ fontFamily: "'Kantumruy Pro', 'Inter', sans-serif" }}
    >
      <div className="flex justify-between items-start mb-1">
        <div className="w-48">
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="h-[70px] object-contain" crossOrigin="anonymous" />
          ) : (
            <span className="text-xl font-bold">[logo]</span>
          )}
        </div>
        <div className="text-center flex-1 mt-1">
          <h1 className="text-2xl font-bold">{settings?.companyName || 'company name'}</h1>
        </div>
        <div className="w-48"></div>
      </div>
      
      <div className="text-center mb-1">
        <h2 className="text-xl font-bold">តារាងប្រាក់ខែ សម្រាប់ខែ {monthName.toUpperCase()}</h2>
      </div>

      <div className="mb-1 flex justify-between text-sm whitespace-nowrap">
        <p><span className="font-semibold">ឈ្មោះបុគ្គលិក :</span> {user?.nameKh || user?.name}</p>
        <p><span className="font-semibold">ផ្នែក :</span> {user?.position || user?.role}</p>
        <p><span className="font-semibold">លេខទូរស័ព្ទ:</span> {user?.phone || ''}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-2 text-sm">
        {/* Left Table - Earnings */}
        <div className="flex flex-col">
          <table className="w-full border-collapse border border-black h-full">
            <thead>
              <tr>
                <th colSpan={3} className="border border-black py-1 px-2 text-center font-bold">
                  ប្រាក់ខែគោល / អត្ថប្រយោជន៍បន្ថែម
                </th>
              </tr>
              <tr>
                <th className="border border-black py-1 px-2 text-center w-12">ល.រ</th>
                <th className="border border-black py-1 px-2 text-left">បរិយាយ</th>
                <th className="border border-black py-1 px-2 text-right">ចំនួន</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black py-1 px-2 text-center">1</td>
                <td className="border border-black py-1 px-2">ប្រាក់ខែគោល</td>
                <td className="border border-black py-1 px-2 text-right">{showBasicSalary ? formatCurrency(basicSalary, "USD") : "***"}</td>
              </tr>
              <tr>
                <td className="border border-black py-1 px-2 text-center">2</td>
                <td className="border border-black py-1 px-2">ប្រាក់ធ្វើការ</td>
                <td className="border border-black py-1 px-2 text-right">{showWorkPay ? formatCurrency(workPay, "USD") : "***"}</td>
              </tr>
              <tr>
                <td className="border border-black py-1 px-2 text-center">3</td>
                <td className="border border-black py-1 px-2">ថែមម៉ោង</td>
                <td className="border border-black py-1 px-2 text-right">{showOTPay ? formatCurrency(totalOTPay, "USD") : "***"}</td>
              </tr>
              <tr>
                <td className="border border-black py-1 px-2 text-center">4</td>
                <td className="border border-black py-1 px-2">ប្រាក់បន្ថែម</td>
                <td className="border border-black py-1 px-2 text-right">{showBonus ? formatCurrency(monthlyBonus + fixedBonus, "USD") : "***"}</td>
              </tr>
              <tr>
                <td colSpan={2} className="border border-black py-1 px-2 text-center font-bold">Total</td>
                <td className="border border-black py-1 px-2 text-right font-bold w-1/3">{formatCurrency(workPay + monthlyBonus + fixedBonus + totalOTPay, "USD")}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Right Table - Deductions */}
        <div className="flex flex-col">
          <table className="w-full border-collapse border border-black h-full">
            <thead>
              <tr>
                <th colSpan={3} className="border border-black py-1 px-2 text-center font-bold">
                  កាត់ផ្សេងៗ
                </th>
              </tr>
              <tr>
                <th className="border border-black py-1 px-2 text-center w-12">ល.រ</th>
                <th className="border border-black py-1 px-2 text-left">បរិយាយ</th>
                <th className="border border-black py-1 px-2 text-right">ចំនួន</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black py-1 px-2 text-center">1</td>
                <td className="border border-black py-1 px-2">កាត់ផ្សេងៗ</td>
                <td className="border border-black py-1 px-2 text-right">{showManualDeduction ? formatCurrency(monthlyDeduction, "USD") : "***"}</td>
              </tr>
              <tr>
                <td className="border border-black py-1 px-2 text-center">2</td>
                <td className="border border-black py-1 px-2">មកយឺត</td>
                <td className="border border-black py-1 px-2 text-right">{showLateDeduction ? formatCurrency(lateDeductions, "USD") : "***"}</td>
              </tr>
              <tr>
                <td className="border border-black py-1 px-2 text-center">3</td>
                <td className="border border-black py-1 px-2">កាត់ឈប់</td>
                <td className="border border-black py-1 px-2 text-right">{showAbsentPenalties ? formatCurrency(absentPenalties, "USD") : "***"}</td>
              </tr>
              <tr>
                <td className="border border-black py-1 px-2 text-center text-transparent">4</td>
                <td className="border border-black py-1 px-2"></td>
                <td className="border border-black py-1 px-2 text-right"></td>
              </tr>
              <tr>
                <td colSpan={2} className="border border-black py-1 px-2 text-center font-bold">Total</td>
                <td className="border border-black py-1 px-2 text-right font-bold w-1/3">{showDeductions ? formatCurrency(monthlyDeduction + lateDeductions + absentPenalties, "USD") : "***"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="flex justify-center mt-1 mb-2">
        <table className="border-collapse border border-black w-3/4 text-sm">
          <tbody>
            <tr>
              <td className="border border-black py-1 px-2 text-center font-bold w-1/3">ប្រាក់ខែទទួលបាន</td>
              <td className="border border-black py-1 px-2 text-center font-bold w-1/3">{formatCurrency(finalSalary, "USD")}</td>
              <td className="border border-black py-1 px-2 text-center font-bold w-1/3">{(finalSalary * exchangeRate).toLocaleString()} រៀល</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer Dates & Signatures */}
      <div className="flex justify-between px-12 text-sm mt-auto">
        <div className="text-center flex flex-col items-center w-1/2">
          <p className="mb-2">1$ = {exchangeRate} រៀល</p>
          <p className="font-semibold mb-16">ហត្ថលេខា បុគ្គលិក</p>
          <p className="font-semibold text-black">{user?.nameKh || user?.name || "បុគ្គលិក"}</p>
        </div>
        <div className="text-center flex flex-col items-center w-1/2">
          <p className="mb-2 whitespace-nowrap">ធ្វើនៅថ្ងៃទី {currentDay} ខែ {currentMonthName} ឆ្នាំ {currentYear}</p>
          <p className="font-semibold mb-16">ហត្ថលេខា អ្នកគ្រប់គ្រង</p>
          <p className="font-semibold text-black">{ceoName || "\u00A0"}</p>
        </div>
      </div>
    </div>
  );
});

export default PayrollReceiptPDF;

