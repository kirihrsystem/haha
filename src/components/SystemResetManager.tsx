import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Staff, Settings } from '../types';
import { DEFAULT_TESTIMONIALS } from './TestimonialsSection';
import { 
  AlertTriangle, 
  Trash2, 
  RotateCcw, 
  CheckCircle2, 
  Flame, 
  ShieldAlert, 
  Check, 
  X, 
  RefreshCw, 
  Database, 
  Server, 
  Lock, 
  Sparkles,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface Props {
  currentUser: Staff | null;
  onResetComplete?: () => void;
}

interface CollectionStat {
  id: string;
  name: string;
  description: string;
  count: number;
  selected: boolean;
  critical?: boolean;
}

export default function SystemResetManager({ currentUser, onResetComplete }: Props) {
  const [loadingStats, setLoadingStats] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Security confirmation text
  const CONFIRMATION_PHRASE = "RESET-KIRI-HR-SYSTEM";
  const [confirmInput, setConfirmInput] = useState('');
  
  // Options
  const [reseedDefaults, setReseedDefaults] = useState(true);
  const [preserveSuperAdmin, setPreserveSuperAdmin] = useState(true);
  const [resetBakongCounter, setResetBakongCounter] = useState(true);

  // Real-time progress logs
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [resetLogs, setResetLogs] = useState<string[]>([]);

  // Collections state
  const [collectionsList, setCollectionsList] = useState<CollectionStat[]>([
    { id: 'logs', name: 'Attendance & Clock Logs', description: 'All check-in, check-out, and daily hours records', count: 0, selected: true },
    { id: 'bonuses', name: 'Payroll & Overtime', description: 'All payroll calculations, bonuses, deductions, and payment records', count: 0, selected: true },
    { id: 'permissions', name: 'Leave Requests', description: 'All staff leave and permission submissions', count: 0, selected: true },
    { id: 'companies_settings', name: 'Company Workspaces', description: 'All tenant company configs, lock statuses, and subscription data', count: 0, selected: true, critical: true },
    { id: 'staff', name: 'Staff & User Accounts', description: 'All employee, manager, and admin accounts (excluding Super Admin)', count: 0, selected: true, critical: true },
    { id: 'coupons', name: 'Coupons & Promo Codes', description: 'All discount coupons and activation keys', count: 0, selected: true },
    { id: 'revenues', name: 'Transaction History', description: 'All recorded KHQR payments, renewals, and revenue logs', count: 0, selected: true },
    { id: 'notifications', name: 'System Notifications', description: 'All in-app alerts and notifications', count: 0, selected: true },
    { id: 'direct_messages', name: 'Landing Inquiries', description: 'All contact messages sent from the landing page', count: 0, selected: true },
    { id: 'scheduled_reports', name: 'Automated Reports', description: 'Scheduled revenue email configurations', count: 0, selected: true },
    { id: 'report_logs', name: 'Report Dispatch Logs', description: 'History of dispatched automated email reports', count: 0, selected: true },
    { id: 'telegram_knowledge', name: 'Telegram AI Knowledge', description: 'All Telegram bot custom FAQs and trained Q&A items', count: 0, selected: true },
    { id: 'testimonials', name: 'Customer Testimonials', description: 'Landing page testimonials and reviews', count: 0, selected: true },
  ]);

  const fetchCollectionCounts = async () => {
    setLoadingStats(true);
    setErrorMsg(null);
    try {
      const updated = await Promise.all(
        collectionsList.map(async (col) => {
          try {
            const snap = await getDocs(collection(db, col.id));
            return { ...col, count: snap.size };
          } catch (err) {
            console.warn(`Could not count collection ${col.id}:`, err);
            return { ...col, count: 0 };
          }
        })
      );
      setCollectionsList(updated);
    } catch (err: any) {
      setErrorMsg("Failed to count documents across database collections.");
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchCollectionCounts();
  }, []);

  const toggleCollection = (id: string) => {
    setCollectionsList(prev => prev.map(c => c.id === id ? { ...c, selected: !c.selected } : c));
  };

  const selectAll = (selected: boolean) => {
    setCollectionsList(prev => prev.map(c => ({ ...c, selected })));
  };

  const addLog = (msg: string) => {
    setResetLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleExecuteReset = async () => {
    if (confirmInput.trim() !== CONFIRMATION_PHRASE) {
      alert(`Please type "${CONFIRMATION_PHRASE}" exactly to confirm.`);
      return;
    }

    const selectedCols = collectionsList.filter(c => c.selected);
    if (selectedCols.length === 0) {
      alert("Please select at least one collection or item to reset.");
      return;
    }

    setIsResetting(true);
    setProgressPercent(5);
    setResetLogs([]);
    setErrorMsg(null);
    addLog("Initiating Website & Database System Reset...");

    try {
      const totalSteps = selectedCols.length + (reseedDefaults ? 2 : 1) + (resetBakongCounter ? 1 : 0);
      let completedSteps = 0;

      // 1. Process each selected collection
      for (const col of selectedCols) {
        setCurrentStep(`Purging collection: ${col.name} (${col.id})...`);
        addLog(`Fetching documents in "${col.id}"...`);
        
        const snap = await getDocs(collection(db, col.id));
        let deletedCount = 0;

        if (snap.size > 0) {
          // Batch delete in chunks of 400
          const docs = snap.docs;
          const chunkSize = 400;
          
          for (let i = 0; i < docs.length; i += chunkSize) {
            const chunk = docs.slice(i, i + chunkSize);
            const batch = writeBatch(db);

            for (const docSnap of chunk) {
              // If collection is 'staff' and preserveSuperAdmin is on, skip super_admin
              if (col.id === 'staff' && preserveSuperAdmin) {
                const data = docSnap.data();
                if (data.role === 'super_admin' || docSnap.id === currentUser?.id || docSnap.id === 'super_admin') {
                  addLog(`Preserved Super Admin account (${data.name || docSnap.id}).`);
                  continue;
                }
              }

              batch.delete(doc(db, col.id, docSnap.id));
              deletedCount++;
            }

            await batch.commit();
          }
        }

        addLog(`Successfully deleted ${deletedCount} document(s) from "${col.id}".`);
        completedSteps++;
        setProgressPercent(Math.min(90, Math.round((completedSteps / totalSteps) * 100)));
      }

      // 2. Reset Bakong API counter if selected
      if (resetBakongCounter) {
        setCurrentStep("Resetting Bakong KHQR API counter...");
        try {
          await fetch('/api/billing/usage/reset', { method: 'POST' });
          addLog("Bakong KHQR daily request counter reset to 0.");
        } catch (e) {
          addLog("Notice: Bakong counter reset API call finished.");
        }
        completedSteps++;
        setProgressPercent(Math.min(95, Math.round((completedSteps / totalSteps) * 100)));
      }

      // 3. Re-seed default foundation data if enabled
      if (reseedDefaults) {
        setCurrentStep("Re-initializing default system records & starter data...");
        addLog("Creating default master company workspace settings...");

        // Ensure default company settings
        const masterCompanyId = 'master_workspace';
        await setDoc(doc(db, 'companies_settings', masterCompanyId), {
          companyId: masterCompanyId,
          companyName: 'Kiri HR Master Workspace',
          exchangeRate: 4100,
          defaultHourlyRate: 2.5,
          defaultOvertimeRate: 3.75,
          overtimeRateType: 'multiplier',
          overtimeRateValue: 1.5,
          currencyDisplay: 'BOTH',
          subscription: {
            type: 'unlimited',
            status: 'active',
            startedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000).toISOString()
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });

        // Ensure Super Admin user exists
        addLog("Verifying Super Admin credentials...");
        const superAdminId = currentUser?.id || 'super_admin';
        await setDoc(doc(db, 'staff', superAdminId), {
          id: superAdminId,
          companyId: masterCompanyId,
          name: currentUser?.name || 'Super Admin',
          email: currentUser?.email || 'kirihrsystem@gmail.com',
          phone: currentUser?.phone || '093988991',
          passcode: currentUser?.passcode || '0000',
          role: 'super_admin',
          hourlyRate: 0,
          avatar: currentUser?.avatar || '',
          profilePictureUrl: currentUser?.profilePictureUrl || currentUser?.avatar || '',
          createdAt: new Date().toISOString()
        }, { merge: true });

        // Re-seed default curated testimonials if testimonials was cleared
        const testimonialsCol = collectionsList.find(c => c.id === 'testimonials');
        if (testimonialsCol?.selected) {
          addLog("Re-seeding 10 curated English & Khmer testimonials...");
          const batch = writeBatch(db);
          const tCol = collection(db, 'testimonials');
          for (const item of DEFAULT_TESTIMONIALS) {
            const newDoc = doc(tCol);
            batch.set(newDoc, {
              name: item.name,
              nameKh: item.nameKh || '',
              title: item.title,
              titleKh: item.titleKh || '',
              initial: item.initial || item.name.charAt(0).toUpperCase(),
              quote: item.quote,
              quoteKh: item.quoteKh || '',
              color: item.color,
              row: item.row,
              createdAt: new Date().toISOString()
            });
          }
          await batch.commit();
          addLog("10 Curated bilingual testimonials restored to landing page.");
        }
      }

      setProgressPercent(100);
      setCurrentStep("Factory reset successfully completed!");
      addLog("ALL SELECTED DATA CLEARED. System is now in a clean factory state.");
      setResetSuccess(true);
      
      // Clear non-essential localStorage caches
      try {
        localStorage.removeItem('kiri_cached_attendance');
        localStorage.removeItem('kiri_cached_reports');
      } catch (e) {}

      if (onResetComplete) {
        onResetComplete();
      }
    } catch (err: any) {
      console.error("Critical error during system reset:", err);
      setErrorMsg(err?.message || "An unexpected error occurred during database wipe.");
      addLog(`ERROR: ${err?.message || 'Failed to complete reset'}`);
    } finally {
      setIsResetting(false);
      fetchCollectionCounts();
    }
  };

  const totalDocumentsCount = collectionsList.reduce((acc, c) => acc + c.count, 0);
  const selectedDocumentsCount = collectionsList.filter(c => c.selected).reduce((acc, c) => acc + c.count, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner Alert */}
      <div className="bg-gradient-to-r from-red-900/90 via-rose-900/80 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-red-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Flame className="w-64 h-64 text-red-500" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-black uppercase tracking-widest">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>Super Admin Emergency & Maintenance</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <span>Factory Reset Entire Website</span>
            <RotateCcw className="w-6 h-6 text-red-400" />
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            This tool provides a complete, clean reset for the Kiri HR database and website. You can purge test workspaces, clear attendance/payroll records, reset coupons, and restore default configurations.
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {resetSuccess && (
        <div className="p-6 bg-emerald-500/10 border-2 border-emerald-500/40 rounded-3xl text-emerald-800 dark:text-emerald-200 space-y-4 animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Website Factory Reset Complete!</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                All selected database collections and records have been completely purged. The Super Admin account and fresh default workspace settings have been preserved.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Website & Dashboard</span>
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Visit Landing Page</span>
            </button>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-3 text-red-800 dark:text-red-200 text-sm">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Progress Box if in Progress */}
      {isResetting && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-red-200 dark:border-red-900/50 shadow-md space-y-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-red-600 animate-spin" />
              <span className="font-bold text-sm text-slate-900 dark:text-white">{currentStep}</span>
            </div>
            <span className="font-mono text-sm font-black text-red-600 dark:text-red-400">{progressPercent}%</span>
          </div>

          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {resetLogs.length > 0 && (
            <div className="bg-slate-950 text-slate-300 p-4 rounded-xl font-mono text-xs max-h-48 overflow-y-auto space-y-1">
              {resetLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">{log}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Collections Selector & Confirmation Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Collections Checklist (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Select Collections to Wipe</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {selectedDocumentsCount} / {totalDocumentsCount} records selected across {collectionsList.filter(c => c.selected).length} collections
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => selectAll(true)}
                className="px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer"
              >
                Select All
              </button>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button
                type="button"
                onClick={() => selectAll(false)}
                className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Deselect All
              </button>
            </div>
          </div>

          {loadingStats ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="text-xs">Scanning database document counts...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-1">
              {collectionsList.map((col) => (
                <div
                  key={col.id}
                  onClick={() => toggleCollection(col.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                    col.selected
                      ? col.critical
                        ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800/60'
                        : 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/60'
                      : 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200/70 dark:border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                    col.selected
                      ? col.critical ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white'
                      : 'border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                  }`}>
                    {col.selected && <Check className="w-3.5 h-3.5" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {col.name}
                      </span>
                      <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full shrink-0 ${
                        col.count > 0 
                          ? col.critical ? 'bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}>
                        {col.count} docs
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                      {col.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Info */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span>Click any collection box to include or exclude from reset</span>
            <button
              onClick={fetchCollectionCounts}
              className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh Counts</span>
            </button>
          </div>
        </div>

        {/* Right Column: Safeguards, Re-seed & Confirmation (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Safeguard Options */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Restoration & Preservation Rules</span>
            </h3>

            <div className="space-y-3">
              {/* Option 1: Preserve Super Admin */}
              <label className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={preserveSuperAdmin}
                  onChange={e => setPreserveSuperAdmin(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Preserve Super Admin Access
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Prevents deleting the master super_admin account ({currentUser?.name || 'Super Admin'}), preventing lockouts.
                  </span>
                </div>
              </label>

              {/* Option 2: Re-seed Defaults */}
              <label className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={reseedDefaults}
                  onChange={e => setReseedDefaults(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Re-seed Clean Foundation Data
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Auto-creates master workspace settings and restores 10 curated English/Khmer landing page testimonials.
                  </span>
                </div>
              </label>

              {/* Option 3: Reset Bakong API */}
              <label className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={resetBakongCounter}
                  onChange={e => setResetBakongCounter(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    Reset Bakong KHQR Quota Counter
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Resets the NBC Bakong live verification API requests used counter back to 0.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Type Confirmation Box */}
          <div className="bg-red-50 dark:bg-red-950/20 p-6 rounded-3xl border-2 border-red-200 dark:border-red-900/60 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h4 className="font-bold text-sm uppercase tracking-wider">Confirm Irreversible Action</h4>
            </div>

            <p className="text-xs text-red-900/80 dark:text-red-200/80 leading-relaxed">
              To prevent accidental deletion, please type the confirmation phrase below:
              <br />
              <strong className="font-mono bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 select-all inline-block mt-1">
                {CONFIRMATION_PHRASE}
              </strong>
            </p>

            <div>
              <input
                type="text"
                value={confirmInput}
                onChange={e => setConfirmInput(e.target.value)}
                placeholder={`Type ${CONFIRMATION_PHRASE}`}
                disabled={isResetting}
                className="w-full px-4 py-2.5 text-sm font-mono border-2 border-red-300 dark:border-red-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
            </div>

            <button
              onClick={handleExecuteReset}
              disabled={isResetting || confirmInput.trim() !== CONFIRMATION_PHRASE || selectedDocumentsCount === 0 && collectionsList.filter(c => c.selected).length === 0}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm shadow-lg shadow-red-600/30 transition-all cursor-pointer"
            >
              {isResetting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Resetting Website ({progressPercent}%)...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Execute Factory Reset ({selectedDocumentsCount} Records)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
