import { PayrollDetailVisibility } from '../types';

export interface PayrollFieldDef {
  key: keyof PayrollDetailVisibility;
  labelEn: string;
  labelKh: string;
  descriptionEn: string;
  descriptionKh: string;
}

export const PAYROLL_FIELDS: PayrollFieldDef[] = [
  {
    key: 'basicSalary',
    labelEn: 'Basic Salary',
    labelKh: 'ប្រាក់ខែគោល',
    descriptionEn: 'Monthly basic salary base amount',
    descriptionKh: 'ចំនួនប្រាក់ខែគោលប្រចាំខែ',
  },
  {
    key: 'workPay',
    labelEn: 'Work Pay',
    labelKh: 'ប្រាក់ធ្វើការ',
    descriptionEn: 'Regular shift work earnings',
    descriptionKh: 'ប្រាក់ទទួលបានពីការធ្វើការ',
  },
  {
    key: 'overtimePay',
    labelEn: 'Overtime Pay',
    labelKh: 'ថែមម៉ោង (OT)',
    descriptionEn: 'Overtime hours earnings',
    descriptionKh: 'ប្រាក់បន្ថែមម៉ោង (OT)',
  },
  {
    key: 'commission',
    labelEn: 'Commission',
    labelKh: 'កម្រៃជើងសារ',
    descriptionEn: 'Sales or performance commission',
    descriptionKh: 'ប្រាក់កម្រៃជើងសារ',
  },
  {
    key: 'monthlyBonus',
    labelEn: 'Monthly Bonus',
    labelKh: 'ប្រាក់លើកទឹកចិត្ត',
    descriptionEn: 'Bonuses and monthly incentives',
    descriptionKh: 'ប្រាក់រង្វាន់លើកទឹកចិត្ត',
  },
  {
    key: 'manualDeduction',
    labelEn: 'Manual Deduction',
    labelKh: 'កាត់ប្រាក់ផ្សេងៗ',
    descriptionEn: 'Custom/manual deductions',
    descriptionKh: 'ការកាត់ប្រាក់ផ្សេងៗ',
  },
  {
    key: 'lateDeduction',
    labelEn: 'Late Deductions',
    labelKh: 'កាត់ប្រាក់មកយឺត',
    descriptionEn: 'Late check-in penalties',
    descriptionKh: 'ការកាត់ប្រាក់មកយឺត',
  },
  {
    key: 'deductions',
    labelEn: 'Deductions (Total)',
    labelKh: 'ការកាត់ប្រាក់សរុប',
    descriptionEn: 'Total deductions summary row/card',
    descriptionKh: 'សរុបការកាត់ប្រាក់',
  },
  {
    key: 'absentPenalties',
    labelEn: 'Absent Penalties',
    labelKh: 'កាត់ប្រាក់អវត្តមាន',
    descriptionEn: 'Absent day penalties',
    descriptionKh: 'ការកាត់ប្រាក់អវត្តមាន',
  },
  {
    key: 'hourlyRate',
    labelEn: 'Hourly Rate',
    labelKh: 'អត្រាប្រាក់ម៉ោង',
    descriptionEn: 'Hourly salary rate calculation',
    descriptionKh: 'អត្រាប្រាក់ឈ្នួលក្នុងមួយម៉ោង',
  },
];

export const defaultPayrollVisibility: Required<PayrollDetailVisibility> = {
  basicSalary: true,
  workPay: true,
  overtimePay: true,
  commission: true,
  monthlyBonus: true,
  manualDeduction: true,
  lateDeduction: true,
  deductions: true,
  absentPenalties: true,
  hourlyRate: true,
};

export function isPayrollFieldVisible(
  config: PayrollDetailVisibility | undefined,
  field: keyof PayrollDetailVisibility
): boolean {
  if (!config) return true;
  return config[field] !== false;
}
