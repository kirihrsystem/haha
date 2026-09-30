import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, User, Check, X, Eye, EyeOff, RotateCcw, Info, SlidersHorizontal } from 'lucide-react';
import { Settings, PayrollDetailVisibility } from '../types';
import { PAYROLL_FIELDS, defaultPayrollVisibility, isPayrollFieldVisible } from '../utils/payrollVisibility';

interface PayrollVisibilitySettingsProps {
  settings: Settings;
  onUpdateSettings: (newSettings: Partial<Settings>) => Promise<void> | void;
}

export const PayrollVisibilitySettings: React.FC<PayrollVisibilitySettingsProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const { i18n } = useTranslation();
  const isKhmer = i18n.language === 'km';

  const [activeTab, setActiveTab] = useState<'admin' | 'employee'>('admin');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const adminConfig: PayrollDetailVisibility = settings?.adminPayrollDetails || { ...defaultPayrollVisibility };
  const employeeConfig: PayrollDetailVisibility = settings?.employeePayrollDetails || { ...defaultPayrollVisibility };

  const currentConfig = activeTab === 'admin' ? adminConfig : employeeConfig;

  const handleToggle = async (key: keyof PayrollDetailVisibility) => {
    const updatedConfig: PayrollDetailVisibility = {
      ...currentConfig,
      [key]: !isPayrollFieldVisible(currentConfig, key),
    };

    setSaving(true);
    setSaveSuccess(false);

    try {
      if (activeTab === 'admin') {
        await onUpdateSettings({ adminPayrollDetails: updatedConfig });
      } else {
        await onUpdateSettings({ employeePayrollDetails: updatedConfig });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Error saving payroll visibility settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSetAll = async (value: boolean) => {
    const bulkConfig: PayrollDetailVisibility = { ...defaultPayrollVisibility };
    PAYROLL_FIELDS.forEach((f) => {
      bulkConfig[f.key] = value;
    });

    setSaving(true);
    try {
      if (activeTab === 'admin') {
        await onUpdateSettings({ adminPayrollDetails: bulkConfig });
      } else {
        await onUpdateSettings({ employeePayrollDetails: bulkConfig });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Error bulk setting payroll details:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    setSaving(true);
    try {
      if (activeTab === 'admin') {
        await onUpdateSettings({ adminPayrollDetails: { ...defaultPayrollVisibility } });
      } else {
        await onUpdateSettings({ employeePayrollDetails: { ...defaultPayrollVisibility } });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Error resetting payroll details:', err);
    } finally {
      setSaving(false);
    }
  };

  const enabledCount = PAYROLL_FIELDS.filter((f) => isPayrollFieldVisible(currentConfig, f.key)).length;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 mb-8 rounded-xl shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/40 dark:border-slate-700/40 pb-4">
        <div>
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            {isKhmer ? 'កំណត់ការបង្ហាញព័ត៌មានលម្អិតប្រាក់ខែ' : 'Payroll Detail Visibility Settings'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isKhmer
              ? 'ជ្រើសរើសព័ត៌មានលម្អិតប្រាក់ខែដែលត្រូវបង្ហាញ ឬលាក់សម្រាប់អ្នកគ្រប់គ្រង និងបុគ្គលិក'
              : 'Turn specific payroll breakdown components on or off independently for Admin and Employee views.'}
          </p>
        </div>

        {saveSuccess && (
          <span className="text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold px-3 py-1 rounded-full animate-fade-in flex items-center gap-1 border border-emerald-200 dark:border-emerald-700/50">
            <Check className="w-3.5 h-3.5" />
            {isKhmer ? 'រក្សាទុកជោគជ័យ' : 'Saved'}
          </span>
        )}
      </div>

      {/* Target View Switcher Tabs */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
        <div className="flex gap-1 flex-1">
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'admin'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md border border-indigo-100 dark:border-indigo-900/50'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>{isKhmer ? 'មើលសម្រាប់អ្នកគ្រប់គ្រង (Admin View)' : 'Admin View'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('employee')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'employee'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md border border-indigo-100 dark:border-indigo-900/50'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{isKhmer ? 'មើលសម្រាប់បុគ្គលិក (Employee View)' : 'Employee View'}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/60 dark:bg-slate-900/60 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 justify-center">
          <Eye className="w-3.5 h-3.5 text-indigo-500" />
          <span>
            {enabledCount} / {PAYROLL_FIELDS.length} {isKhmer ? 'បានបើក' : 'Active'}
          </span>
        </div>
      </div>

      <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 rounded-xl p-3.5 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="font-semibold mb-0.5">
            {activeTab === 'admin'
              ? isKhmer
                ? 'ការកំណត់នេះអនុវត្តលើផ្ទាំង Admin (គ្រប់គ្រងប្រាក់ខែ របាយការណ៍ និងវិក្កយបត្រ Admin)'
                : 'Configures which payroll breakdown items are displayed in Admin Dashboard reports and modals.'
              : isKhmer
                ? 'ការកំណត់នេះអនុវត្តលើផ្ទាំង Employee (ប្រវត្តិរូប ប្រាក់ខែបុគ្គលិក និងវិក្កយបត្របុគ្គលិក)'
                : 'Configures which payroll breakdown items staff/employees see on their dashboard and pay slips.'}
          </p>
        </div>
      </div>

      {/* Quick Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          {isKhmer ? 'ព័ត៌មានលម្អិតទាំង ១០' : '10 Detailed Payroll Items'}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSetAll(true)}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition-colors border border-emerald-200 dark:border-emerald-800/50"
          >
            {isKhmer ? 'បើកទាំងអស់' : 'Enable All'}
          </button>
          <button
            type="button"
            onClick={() => handleSetAll(false)}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 hover:bg-red-100 transition-colors border border-red-200 dark:border-red-800/50"
          >
            {isKhmer ? 'បិទទាំងអស់' : 'Disable All'}
          </button>
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors flex items-center gap-1 border border-slate-200 dark:border-slate-700"
            title="Reset to default (All Enabled)"
          >
            <RotateCcw className="w-3 h-3" />
            {isKhmer ? 'កំណត់ឡើងវិញ' : 'Reset'}
          </button>
        </div>
      </div>

      {/* Toggles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PAYROLL_FIELDS.map((field, idx) => {
          const isVisible = isPayrollFieldVisible(currentConfig, field.key);
          return (
            <div
              key={`${field.key}-${idx}`}
              onClick={() => handleToggle(field.key)}
              className={`p-3.5 rounded-lg border transition-all cursor-pointer select-none flex items-center justify-between gap-3 ${
                isVisible
                  ? 'bg-white/90 dark:bg-slate-900/90 border-indigo-200 dark:border-indigo-800/60 shadow-sm hover:border-indigo-400'
                  : 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800/80 opacity-70 hover:opacity-100'
              }`}
            >
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isVisible ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">
                    {field.labelEn}
                  </span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                    ({field.labelKh})
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 ml-4 truncate">
                  {isKhmer ? field.descriptionKh : field.descriptionEn}
                </p>
              </div>

              {/* Custom Toggle Switch */}
              <div
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isVisible ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center text-[10px] ${
                    isVisible ? 'translate-x-5 text-indigo-600' : 'translate-x-0 text-slate-400'
                  }`}
                >
                  {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
