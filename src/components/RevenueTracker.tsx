import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuthStore, useSettingsStore } from '../store';
import { createPortal } from 'react-dom';
import ScrollLock from './ScrollLock';
import { 
  DollarSign, TrendingUp, TrendingDown, Calendar, ChevronLeft, ChevronRight, 
  Plus, Trash2, Edit2, Wallet, Activity, CalendarDays, X, Check, Search,
  Download, Printer, Filter, ArrowUpRight, ArrowDownRight, Tag, Receipt,
  Building, Zap, Users, Package, Laptop, Megaphone, Wrench, Car, Utensils,
  FileText, CreditCard, ShoppingBag, UserCheck, Briefcase, Repeat, RotateCcw,
  PieChart, RefreshCw, MinusCircle, PlusCircle
} from 'lucide-react';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO, addMonths, subMonths } from 'date-fns';
import { cn, formatCurrency } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';

export interface RevenueRecord {
  id: string;
  companyId: string;
  type: 'income' | 'expense';
  date: string;
  amount: number;
  category: string;
  paymentMethod?: string;
  referenceNo?: string;
  notes?: string;
  createdAt: string;
}

const INCOME_CATEGORIES = [
  'Sales & Services',
  'Client Payment',
  'Consulting & Projects',
  'Subscription & Recurring',
  'Refund & Credit',
  'Other Income'
];

const EXPENSE_CATEGORIES = [
  'Rent & Office Space',
  'Utilities & Bills',
  'Salaries & Wages',
  'Office Supplies',
  'Equipment & Tech',
  'Marketing & Ads',
  'Maintenance & Repairs',
  'Travel & Fuel',
  'Food & Client Entertainment',
  'Taxes & Licenses',
  'Other Expense'
];

const PAYMENT_METHODS = [
  'Cash',
  'Bank Transfer',
  'KHQR / ABA',
  'Credit / Debit Card',
  'Petty Cash',
  'Other'
];

export default function RevenueTracker() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { settings } = useSettingsStore();
  
  const [records, setRecords] = useState<RevenueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [chartView, setChartView] = useState<'7days' | 'month' | '12months'>('7days');

  // Filters & Search
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    category: 'Sales & Services',
    paymentMethod: 'Cash',
    referenceNo: '',
    notes: ''
  });

  const currency = settings?.currency || 'USD';
  const exchangeRate = settings?.exchangeRate || 4000;

  useEffect(() => {
    if (!user?.companyId) return;
    const q = query(
      collection(db, 'revenues'),
      where('companyId', '==', user.companyId)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => {
        const raw = doc.data();
        return {
          id: doc.id,
          companyId: raw.companyId,
          type: raw.type || 'income', // Default legacy data to 'income'
          date: raw.date || format(new Date(), 'yyyy-MM-dd'),
          amount: typeof raw.amount === 'number' ? raw.amount : parseFloat(raw.amount || 0),
          category: raw.category || (raw.type === 'expense' ? 'Other Expense' : 'Sales & Services'),
          paymentMethod: raw.paymentMethod || 'Cash',
          referenceNo: raw.referenceNo || '',
          notes: raw.notes || '',
          createdAt: raw.createdAt || new Date().toISOString()
        } as RevenueRecord;
      });
      setRecords(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLoading(false);
    }, (error) => {
      console.warn("Revenue tracker subscription status:", error);
      setLoading(false);
    });
    return unsub;
  }, [user?.companyId]);

  // Comprehensive Financial Metrics
  const stats = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const selectedMonthStart = startOfMonth(currentDate);
    const selectedMonthEnd = endOfMonth(currentDate);
    const selectedYearStart = startOfYear(currentDate);
    const selectedYearEnd = endOfYear(currentDate);

    let dailyIncome = 0;
    let dailyExpense = 0;

    let monthlyIncome = 0;
    let monthlyExpense = 0;

    let yearlyIncome = 0;
    let yearlyExpense = 0;

    let grandIncome = 0;
    let grandExpense = 0;

    records.forEach(r => {
      const isInc = r.type === 'income';
      const rDate = parseISO(r.date);

      // Grand totals
      if (isInc) grandIncome += r.amount;
      else grandExpense += r.amount;

      // Today
      if (r.date === todayStr) {
        if (isInc) dailyIncome += r.amount;
        else dailyExpense += r.amount;
      }

      // Selected Month
      if (isWithinInterval(rDate, { start: selectedMonthStart, end: selectedMonthEnd })) {
        if (isInc) monthlyIncome += r.amount;
        else monthlyExpense += r.amount;
      }

      // Selected Year
      if (isWithinInterval(rDate, { start: selectedYearStart, end: selectedYearEnd })) {
        if (isInc) yearlyIncome += r.amount;
        else yearlyExpense += r.amount;
      }
    });

    const monthlyNet = monthlyIncome - monthlyExpense;
    const dailyNet = dailyIncome - dailyExpense;
    const grandNet = grandIncome - grandExpense;
    const monthlyMargin = monthlyIncome > 0 ? ((monthlyNet / monthlyIncome) * 100).toFixed(1) : '0';

    return {
      dailyIncome, dailyExpense, dailyNet,
      monthlyIncome, monthlyExpense, monthlyNet, monthlyMargin,
      yearlyIncome, yearlyExpense, yearlyNet: yearlyIncome - yearlyExpense,
      grandIncome, grandExpense, grandNet
    };
  }, [records, currentDate]);

  // Chart Dataset (Income vs Expense)
  const chartData = useMemo(() => {
    const data = [];
    const today = new Date();

    if (chartView === '7days') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = format(d, 'yyyy-MM-dd');
        
        let inc = 0;
        let exp = 0;
        records.filter(r => r.date === dateStr).forEach(r => {
          if (r.type === 'income') inc += r.amount;
          else exp += r.amount;
        });

        data.push({
          label: format(d, 'MMM dd'),
          income: inc,
          expense: exp,
          net: inc - exp
        });
      }
    } else if (chartView === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      let curr = new Date(monthStart);

      while (curr <= monthEnd) {
        const dateStr = format(curr, 'yyyy-MM-dd');
        let inc = 0;
        let exp = 0;
        records.filter(r => r.date === dateStr).forEach(r => {
          if (r.type === 'income') inc += r.amount;
          else exp += r.amount;
        });

        data.push({
          label: format(curr, 'dd MMM'),
          income: inc,
          expense: exp,
          net: inc - exp
        });

        curr.setDate(curr.getDate() + 1);
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const start = startOfMonth(d);
        const end = endOfMonth(d);

        let inc = 0;
        let exp = 0;
        records
          .filter(r => isWithinInterval(parseISO(r.date), { start, end }))
          .forEach(r => {
            if (r.type === 'income') inc += r.amount;
            else exp += r.amount;
          });

        data.push({
          label: format(d, 'MMM yyyy'),
          income: inc,
          expense: exp,
          net: inc - exp
        });
      }
    }
    return data;
  }, [records, chartView, currentDate]);

  // Month Records & Filters
  const filteredRecords = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);

    return records.filter(r => {
      // Date filter (Selected month)
      const rDate = parseISO(r.date);
      if (!isWithinInterval(rDate, { start, end })) return false;

      // Type filter
      if (filterType !== 'all' && r.type !== filterType) return false;

      // Category filter
      if (filterCategory !== 'all' && r.category !== filterCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNotes = (r.notes || '').toLowerCase().includes(q);
        const matchCat = (r.category || '').toLowerCase().includes(q);
        const matchRef = (r.referenceNo || '').toLowerCase().includes(q);
        const matchAmount = r.amount.toString().includes(q);
        const matchDate = r.date.includes(q);
        const matchMethod = (r.paymentMethod || '').toLowerCase().includes(q);
        if (!matchNotes && !matchCat && !matchRef && !matchAmount && !matchDate && !matchMethod) {
          return false;
        }
      }

      return true;
    });
  }, [records, currentDate, filterType, filterCategory, searchQuery]);

  // Modal Handlers
  const handleOpenAdd = (type: 'income' | 'expense') => {
    setEditingId(null);
    setFormData({
      type,
      date: format(new Date(), 'yyyy-MM-dd'),
      amount: '',
      category: type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0],
      paymentMethod: 'Cash',
      referenceNo: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (record: RevenueRecord) => {
    setEditingId(record.id);
    setFormData({
      type: record.type,
      date: record.date,
      amount: record.amount.toString(),
      category: record.category || (record.type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]),
      paymentMethod: record.paymentMethod || 'Cash',
      referenceNo: record.referenceNo || '',
      notes: record.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId) return;

    const parsedAmount = parseFloat(formData.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const payload = {
      companyId: user.companyId,
      type: formData.type,
      date: formData.date,
      amount: parsedAmount,
      category: formData.category,
      paymentMethod: formData.paymentMethod,
      referenceNo: formData.referenceNo,
      notes: formData.notes,
      createdAt: new Date().toISOString()
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'revenues', editingId), payload);
      } else {
        await addDoc(collection(db, 'revenues'), payload);
      }
      setIsModalOpen(false);
      setEditingId(null);
    } catch (err) {
      console.error('Error saving financial transaction:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this financial log entry?')) {
      await deleteDoc(doc(db, 'revenues', id));
    }
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Payment Method', 'Reference No', 'Notes'];
    const rows = filteredRecords.map(r => [
      r.date,
      r.type.toUpperCase(),
      `"${r.category.replace(/"/g, '""')}"`,
      r.amount.toFixed(2),
      `"${(r.paymentMethod || 'Cash').replace(/"/g, '""')}"`,
      `"${(r.referenceNo || '').replace(/"/g, '""')}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Cash_Flow_Log_${format(currentDate, 'yyyy_MM')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Header & Month Controller */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {t('Income AND Expenses') || 'Revenue & Cash Flow'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {t('You can manually input the income.') || 'Track cash income, operating expenses, and net profit margins'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Navigator */}
          <div className="flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-all shadow-sm"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-32 text-center font-semibold text-slate-800 dark:text-slate-200 text-sm">
              {format(currentDate, 'MMMM yyyy')}
            </div>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-all shadow-sm"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-all"
          >
            This Month
          </button>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenAdd('income')}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-medium transition-all text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Income</span>
            </button>
            <button
              onClick={() => handleOpenAdd('expense')}
              className="flex items-center gap-1.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg font-medium transition-all text-sm"
            >
              <MinusCircle className="w-4 h-4" />
              <span>Expense</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        
        {/* Monthly Cash Income Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Income</h3>
            </div>
            <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md">
              {format(currentDate, 'MMM yyyy')}
            </span>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              +{formatCurrency(stats.monthlyIncome, currency as 'USD' | 'KHR', exchangeRate)}
            </p>
            <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
              <span className="mr-1">Today:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{formatCurrency(stats.dailyIncome, currency as 'USD' | 'KHR', exchangeRate)}</span>
            </div>
          </div>
        </div>

        {/* Monthly Cash Expenses Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <TrendingDown className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Expenses</h3>
            </div>
            <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md">
              {format(currentDate, 'MMM yyyy')}
            </span>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              -{formatCurrency(stats.monthlyExpense, currency as 'USD' | 'KHR', exchangeRate)}
            </p>
            <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
              <span className="mr-1">Today:</span>
              <span className="font-semibold text-rose-600 dark:text-rose-400">-{formatCurrency(stats.dailyExpense, currency as 'USD' | 'KHR', exchangeRate)}</span>
            </div>
          </div>
        </div>

        {/* Net Monthly Profit / Loss Card */}
        <div className="bg-slate-900 dark:bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200">Net Flow</h3>
            </div>
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-md border",
              stats.monthlyNet >= 0 ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30"
            )}>
              {stats.monthlyNet >= 0 ? 'Surplus' : 'Deficit'}
            </span>
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight">
              {stats.monthlyNet >= 0 ? '+' : ''}{formatCurrency(stats.monthlyNet, currency as 'USD' | 'KHR', exchangeRate)}
            </p>
            <div className="mt-2 flex items-center text-xs text-slate-400">
              <span className="mr-1">Margin:</span>
              <span className="font-semibold text-white">{stats.monthlyMargin}%</span>
            </div>
          </div>
        </div>

        {/* Cumulative All-Time Balance Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                <Wallet className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total Balance</h3>
            </div>
            <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md">
              All Time
            </span>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(stats.grandNet, currency as 'USD' | 'KHR', exchangeRate)}
            </p>
            <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400">
              <span className="mr-1">Total In:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">+{formatCurrency(stats.grandIncome, currency as 'USD' | 'KHR', exchangeRate)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Visual Chart Comparison */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 lg:p-8 shadow-sm print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cash Flow Analytics</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Comparative breakdown of Income vs Expenses</p>
          </div>
          <div className="flex bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-lg">
            <button 
              onClick={() => setChartView('7days')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${chartView === '7days' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              7 Days
            </button>
            <button 
              onClick={() => setChartView('month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${chartView === 'month' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              This Month
            </button>
            <button 
              onClick={() => setChartView('12months')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${chartView === '12months' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              12 Months
            </button>
          </div>
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 11 }} 
                dy={10} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 11 }} 
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(val: number, name: string) => [
                  formatCurrency(val, currency as 'USD' | 'KHR', exchangeRate),
                  name === 'income' ? 'Income (+)' : name === 'expense' ? 'Expense (-)' : 'Net Profit'
                ]}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area 
                type="monotone" 
                dataKey="income" 
                name="Income"
                stroke="#10b981" 
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorIncome)" 
              />
              <Area 
                type="monotone" 
                dataKey="expense" 
                name="Expense"
                stroke="#f43f5e" 
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorExpense)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Log Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Table Header Controls */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Detailed Financial Log ({format(currentDate, 'MMMM yyyy')})
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {filteredRecords.length} transactions logged
              </p>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                title="Export CSV"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                title="Print Log"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 print:hidden">
            
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search notes, reference, amount..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Type Tabs */}
            <div className="md:col-span-4 flex bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-lg">
              <button
                onClick={() => { setFilterType('all'); setFilterCategory('all'); }}
                className={cn(
                  "flex-1 py-1 text-xs font-semibold rounded-md transition-all",
                  filterType === 'all' ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                All
              </button>
              <button
                onClick={() => { setFilterType('income'); setFilterCategory('all'); }}
                className={cn(
                  "flex-1 py-1 text-xs font-semibold rounded-md transition-all",
                  filterType === 'income' ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                Income
              </button>
              <button
                onClick={() => { setFilterType('expense'); setFilterCategory('all'); }}
                className={cn(
                  "flex-1 py-1 text-xs font-semibold rounded-md transition-all",
                  filterType === 'expense' ? "bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm border border-slate-200 dark:border-slate-700" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                Expense
              </button>
            </div>

            {/* Category Dropdown */}
            <div className="md:col-span-3">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-100"
              >
                <option value="all">All Categories</option>
                {filterType !== 'expense' && (
                  <optgroup label="Income Categories">
                    {INCOME_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </optgroup>
                )}
                {filterType !== 'income' && (
                  <optgroup label="Expense Categories">
                    {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </optgroup>
                )}
              </select>
            </div>

          </div>
        </div>

        {/* Records Display */}
        <div className="w-full">
          {filteredRecords.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              <Receipt className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No matching financial records</p>
              <p className="text-xs text-slate-400 mt-1">Try clearing your search query or changing the filter</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredRecords.map(record => {
                  const isInc = record.type === 'income';
                  return (
                    <div key={record.id} className="p-4 space-y-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1.5">
                          <span className={cn(
                            "inline-flex w-fit items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase",
                            isInc 
                              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" 
                              : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                          )}>
                            {isInc ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {record.type}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {format(parseISO(record.date), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span className={cn(
                            "font-bold text-sm",
                            isInc ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                          )}>
                            {isInc ? '+' : '-'}{formatCurrency(record.amount, currency as 'USD' | 'KHR', exchangeRate)}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEdit(record)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(record.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="block text-slate-400 mb-0.5 font-medium">Category</span>
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                            <Tag className="w-3 h-3 text-slate-400" />
                            {record.category}
                          </span>
                        </div>
                        <div>
                          <span className="block text-slate-400 mb-0.5 font-medium">Payment Method</span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{record.paymentMethod || 'Cash'}</span>
                        </div>
                      </div>

                      <div className="text-xs pt-1">
                        <span className="block text-slate-400 mb-1 font-medium">Description / Reference</span>
                        <div className="text-slate-700 dark:text-slate-300">
                          {record.referenceNo && (
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 mr-2">
                              #{record.referenceNo}
                            </span>
                          )}
                          <span>{record.notes || '-'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Payment Method</th>
                      <th className="px-6 py-4 w-full">Description / Reference</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredRecords.map(record => {
                      const isInc = record.type === 'income';
                      return (
                        <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          
                          {/* Date */}
                          <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                            {format(parseISO(record.date), 'MMM dd, yyyy')}
                          </td>
  
                          {/* Type Badge */}
                          <td className="px-6 py-4">
                            <span className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase",
                              isInc 
                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" 
                                : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                            )}>
                              {isInc ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {record.type}
                            </span>
                          </td>
  
                          {/* Category */}
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs">
                              <Tag className="w-3 h-3 text-slate-400" />
                              {record.category}
                            </span>
                          </td>
  
                          {/* Payment Method */}
                          <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-400">
                            {record.paymentMethod || 'Cash'}
                          </td>
  
                          {/* Reference & Notes */}
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                            {record.referenceNo && (
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 mr-2">
                                #{record.referenceNo}
                              </span>
                            )}
                            <span>{record.notes || '-'}</span>
                          </td>
  
                          {/* Amount */}
                          <td className={cn(
                            "px-6 py-4 text-right font-bold text-sm",
                            isInc ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                          )}>
                            {isInc ? '+' : '-'}{formatCurrency(record.amount, currency as 'USD' | 'KHR', exchangeRate)}
                          </td>
  
                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleEdit(record)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                                title="Edit Record"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(record.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                                title="Delete Record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
  
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Table Summary Footer */}
        {filteredRecords.length > 0 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
            <span className="text-slate-500 font-semibold">
              Showing {filteredRecords.length} records for {format(currentDate, 'MMMM yyyy')}
            </span>
            <div className="flex items-center gap-6 font-bold">
              <span className="text-emerald-600 dark:text-emerald-400">
                Inflow: +{formatCurrency(filteredRecords.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0), currency as 'USD' | 'KHR', exchangeRate)}
              </span>
              <span className="text-rose-600 dark:text-rose-400">
                Outflow: -{formatCurrency(filteredRecords.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0), currency as 'USD' | 'KHR', exchangeRate)}
              </span>
            </div>
          </div>
        )}

      </div>

      {/* Add / Edit Transaction Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 overflow-hidden overscroll-none">
          <ScrollLock />
          <div className="bg-white dark:bg-slate-900 sm:border border-slate-200 dark:border-slate-800 sm:rounded-xl shadow-xl max-w-xl w-full h-full sm:h-auto sm:max-h-[90vh] relative flex flex-col overflow-hidden">
            <div className="p-5 sm:p-6 pb-4 sm:pb-5 border-b border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                {editingId ? 'Edit Financial Record' : 'Add Financial Record'}
              </h3>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form
              onSubmit={handleSave}
              className="p-5 sm:p-6 space-y-6 overflow-y-auto overflow-x-hidden overscroll-contain flex-1 custom-scrollbar"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <div className="space-y-6">
                {/* Type Selection Switcher */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300 ml-1">
                    Transaction Type
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({
                        ...p,
                        type: 'income',
                        category: INCOME_CATEGORIES[0]
                      }))}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-2 rounded-md font-semibold text-sm transition-all",
                        formData.type === 'income' 
                          ? "bg-emerald-600 text-white shadow-sm" 
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      )}
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Income</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({
                        ...p,
                        type: 'expense',
                        category: EXPENSE_CATEGORIES[0]
                      }))}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-2 rounded-md font-semibold text-sm transition-all",
                        formData.type === 'expense' 
                          ? "bg-rose-600 text-white shadow-sm" 
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      )}
                    >
                      <MinusCircle className="w-4 h-4" />
                      <span>Expense</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300 ml-1">
                      Amount ({currency}) *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-400 font-bold text-sm">{currency === 'USD' ? '$' : '៛'}</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={formData.amount}
                        onChange={(e) => setFormData(p => ({ ...p, amount: e.target.value }))}
                        className="w-full pl-8 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-800 dark:text-slate-200"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Transaction Date */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300 ml-1">
                      Transaction Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300 ml-1">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-800 dark:text-slate-200"
                    >
                      {formData.type === 'income' 
                        ? INCOME_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)
                        : EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)
                      }
                    </select>
                  </div>

                  {/* Payment Channel */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300 ml-1">
                      Payment Channel
                    </label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData(p => ({ ...p, paymentMethod: e.target.value }))}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-800 dark:text-slate-200"
                    >
                      {PAYMENT_METHODS.map(pm => <option key={pm} value={pm}>{pm}</option>)}
                    </select>
                  </div>
                </div>

                {/* Reference Number */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300 ml-1">
                    Invoice / Reference No (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.referenceNo}
                    onChange={(e) => setFormData(p => ({ ...p, referenceNo: e.target.value }))}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-800 dark:text-slate-200"
                    placeholder="e.g. INV-2026-001 or Receipt #"
                  />
                </div>

                {/* Description / Notes */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300 ml-1">
                    Description / Notes
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-800 dark:text-slate-200"
                    placeholder="Provide additional details or notes regarding this cash transaction..."
                  />
                </div>
              </div>
              
              {/* Submit Action */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-6 shrink-0 flex items-center justify-end gap-3 pb-2 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={cn(
                    "px-6 py-2.5 rounded-xl font-semibold text-white shadow-sm transition-all flex items-center gap-2",
                    formData.type === 'income' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                  )}
                >
                  <Check className="w-4 h-4" />
                  <span>{editingId ? 'Save Changes' : `Record ${formData.type === 'income' ? 'Income' : 'Expense'}`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}
    </div>
  );
}