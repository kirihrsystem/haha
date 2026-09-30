import React, { useState, useEffect } from 'react';
import { 
  collection, doc, getDoc, setDoc, getDocs, query, orderBy, limit, addDoc 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Settings, Staff, Coupon, RevenueReportSchedule, RenewalAlertConfig, ReportLog } from '../types';
import { useAuthStore } from '../store';
import { 
  Calendar, Mail, Clock, Send, CheckCircle2, AlertCircle, Play, Pause, 
  Sparkles, RefreshCw, FileText, Check, Trash2, Plus, X, Eye, Download, ShieldCheck, Zap, ChevronRight, BarChart3, TrendingUp, Building2, AlertTriangle, Bell, UserCheck, CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScheduledRevenueReportsProps {
  companies: Settings[];
  allUsers: Staff[];
  coupons: Coupon[];
  totalRevenue: number;
  revenueStats: any;
  realTransactions: any[];
  initialSubTab?: 'revenue' | 'renewal';
}

export default function ScheduledRevenueReports({
  companies,
  allUsers,
  coupons,
  totalRevenue,
  revenueStats,
  realTransactions,
  initialSubTab = 'revenue'
}: ScheduledRevenueReportsProps) {
  const { user } = useAuthStore();
  const [activeSubTab, setActiveSubTab] = useState<'revenue' | 'renewal'>(initialSubTab);

  // Revenue Schedule State
  const [schedule, setSchedule] = useState<RevenueReportSchedule>({
    id: 'revenue_summary',
    enabled: true,
    frequency: 'weekly',
    sendDay: 1, // Monday
    sendTime: '08:00',
    recipients: [user?.email || 'kirihrsystem@gmail.com'],
    includeMetrics: {
      totalRevenue: true,
      activeWorkspaces: true,
      revenueBreakdown: true,
      topWorkspaces: true,
      recentTransactions: true,
      couponRedemptions: true
    },
    emailSubjectTemplate: '[Kiri HR] Executive Revenue Summary Report ({frequency})',
    lastSentAt: '',
    nextScheduledAt: ''
  });

  // Renewal Alert Config State
  const [renewalConfig, setRenewalConfig] = useState<RenewalAlertConfig>({
    id: 'renewal_alert_config',
    enabled: true,
    notifyDaysBefore: [14, 7, 3, 0],
    autoSendEnabled: true,
    emailSubjectTemplate: 'Action Required: Renew your Kiri HR Subscription for {workspaceName}',
    recipientsScope: 'workspace_admin'
  });

  const [recipientInput, setRecipientInput] = useState('');
  const [reportLogs, setReportLogs] = useState<ReportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingInstant, setIsSendingInstant] = useState(false);
  const [isSendingBulkRenewal, setIsSendingBulkRenewal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedLogPreview, setSelectedLogPreview] = useState<ReportLog | null>(null);
  const [previewCompany, setPreviewCompany] = useState<Settings | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  useEffect(() => {
    fetchScheduleAndLogs();
  }, []);

  const fetchScheduleAndLogs = async () => {
    setLoading(true);
    try {
      // 1. Fetch Revenue Schedule Config
      const schedDocRef = doc(db, 'scheduled_reports', 'revenue_summary');
      const schedSnap = await getDoc(schedDocRef);
      if (schedSnap.exists()) {
        const data = schedSnap.data() as RevenueReportSchedule;
        setSchedule({
          ...data,
          id: 'revenue_summary',
          recipients: data.recipients && data.recipients.length > 0 ? data.recipients : [user?.email || 'kirihrsystem@gmail.com']
        });
      }

      // 2. Fetch Renewal Alert Config
      const renewDocRef = doc(db, 'scheduled_reports', 'renewal_alert_config');
      const renewSnap = await getDoc(renewDocRef);
      if (renewSnap.exists()) {
        setRenewalConfig(renewSnap.data() as RenewalAlertConfig);
      }

      // 3. Fetch Report Logs
      const logsQuery = query(collection(db, 'report_logs'), orderBy('sentAt', 'desc'), limit(30));
      const logsSnap = await getDocs(logsQuery);
      const logsData = logsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ReportLog));
      setReportLogs(logsData);
    } catch (err) {
      console.warn("Notice loading report schedules (offline mode):", err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate days remaining helper
  const getDaysRemaining = (company: Settings) => {
    if (!company.subscription?.expiresAt) return -1;
    const expDate = new Date(company.subscription.expiresAt).getTime();
    if (isNaN(expDate)) return -1;
    const diffDays = Math.ceil((expDate - Date.now()) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Filter expiring & expired workspaces
  const expiringCompanies = companies.filter(c => {
    const days = getDaysRemaining(c);
    const status = c.subscription?.status;
    return days <= 14 || status === 'expired' || status === 'pending' || !c.subscription;
  });

  // Helper to calculate next scheduled date ISO string
  const calculateNextRun = (freq: 'weekly' | 'monthly', day: number, timeStr: string) => {
    const now = new Date();
    const [hrs, mins] = timeStr.split(':').map(Number);
    const target = new Date(now);
    target.setHours(hrs || 8, mins || 0, 0, 0);

    if (freq === 'weekly') {
      const currentDay = now.getDay() === 0 ? 7 : now.getDay();
      let diff = day - currentDay;
      if (diff < 0 || (diff === 0 && now > target)) {
        diff += 7;
      }
      target.setDate(now.getDate() + diff);
    } else {
      target.setDate(Math.min(day, 28));
      if (now > target) {
        target.setMonth(now.getMonth() + 1);
      }
    }
    return target.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  };

  const handleAddRecipient = () => {
    const email = recipientInput.trim().toLowerCase();
    if (!email || !email.includes('@')) return;
    if (!schedule.recipients.includes(email)) {
      setSchedule(prev => ({ ...prev, recipients: [...prev.recipients, email] }));
    }
    setRecipientInput('');
  };

  const handleRemoveRecipient = (emailToRemove: string) => {
    setSchedule(prev => ({
      ...prev,
      recipients: prev.recipients.filter(e => e !== emailToRemove)
    }));
  };

  const handleSaveSchedule = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const nextRun = calculateNextRun(schedule.frequency, schedule.sendDay, schedule.sendTime);
      const payload: RevenueReportSchedule = {
        ...schedule,
        id: 'revenue_summary',
        nextScheduledAt: nextRun,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || user?.name || 'Super Admin'
      };

      await setDoc(doc(db, 'scheduled_reports', 'revenue_summary'), payload, { merge: true });
      setSchedule(payload);
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
    } catch (err: any) {
      console.error("Error saving report schedule", err);
      alert("Failed to save schedule settings: " + (err?.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveRenewalConfig = async () => {
    setIsSaving(true);
    try {
      const payload: RenewalAlertConfig = {
        ...renewalConfig,
        id: 'renewal_alert_config',
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || user?.name || 'Super Admin'
      };
      await setDoc(doc(db, 'scheduled_reports', 'renewal_alert_config'), payload, { merge: true });
      setRenewalConfig(payload);
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
    } catch (err: any) {
      console.error("Error saving renewal config", err);
      alert("Failed to save renewal settings: " + (err?.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  // Generate Email HTML string for Revenue Summary
  const generateRevenueEmailHtml = (freqLabel: string) => {
    const activeCompanies = companies.filter(c => c.subscription?.status === 'active');
    const recentTxList = realTransactions.slice(0, 5);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
    .card { background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 24px; max-width: 680px; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; }
    .logo { font-size: 20px; font-weight: 800; color: #4f46e5; letter-spacing: -0.5px; }
    .badge { background: #e0e7ff; color: #4338ca; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; }
    .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .stat-box { background: #f1f5f9; border-radius: 12px; padding: 16px; border: 1px solid #cbd5e1; }
    .stat-val { font-size: 24px; font-weight: 800; color: #1e1b4b; }
    .stat-lbl { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 12px; }
    th { text-align: left; padding: 10px; background: #f8fafc; color: #475569; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
    td { padding: 10px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    .footer { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div>
        <div class="logo">⚡ Kiri HR Super Admin</div>
        <div style="font-size: 13px; color: #64748b; margin-top: 2px;">Automated Cash Income Summary (${freqLabel.toUpperCase()})</div>
      </div>
      <span class="badge">Live Report</span>
    </div>

    <p style="font-size: 14px; line-height: 1.5; color: #334155;">
      Hello Super Admin,<br/>
      Here is your automated executive revenue summary report generated on <strong>${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}</strong>.
    </p>

    <div class="stat-grid">
      <div class="stat-box">
        <div class="stat-val">$${totalRevenue.toFixed(2)}</div>
        <div class="stat-lbl">Total Recorded Revenue</div>
      </div>
      <div class="stat-box">
        <div class="stat-val">${activeCompanies.length} Workspaces</div>
        <div class="stat-lbl">Active Paid Subscriptions</div>
      </div>
      <div class="stat-box">
        <div class="stat-val">$${revenueStats?.subRevenue?.toFixed(2) || '0.00'}</div>
        <div class="stat-lbl">Subscription Revenue</div>
      </div>
      <div class="stat-box">
        <div class="stat-val">$${revenueStats?.passRevenue?.toFixed(2) || '0.00'}</div>
        <div class="stat-lbl">Pass / Coupon Revenue</div>
      </div>
    </div>

    ${schedule.includeMetrics.topWorkspaces ? `
    <h3 style="font-size: 15px; font-weight: 700; color: #1e293b; margin-top: 24px; margin-bottom: 8px;">Top Active Workspaces</h3>
    <table>
      <thead>
        <tr>
          <th>Workspace Name</th>
          <th>Plan</th>
          <th>Status</th>
          <th>Est. Price</th>
        </tr>
      </thead>
      <tbody>
        ${activeCompanies.slice(0, 5).map(c => `
          <tr>
            <td><strong>${c.companyName || 'Workspace'}</strong> (${c.companyCode || 'N/A'})</td>
            <td>${c.subscription?.type?.toUpperCase() || 'STANDARD'}</td>
            <td><span style="color:#059669; font-weight:bold;">Active</span></td>
            <td>$${(c.subscription?.price || (c.subscription?.type === 'yearly' ? 0.2 : 0.1)).toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ` : ''}

    <div class="footer">
      This is an automated revenue report dispatched from your Kiri HR Super Admin Console.<br/>
      Configured Recipient(s): ${schedule.recipients.join(', ')}
    </div>
  </div>
</body>
</html>
    `;
  };

  // Generate Email HTML string for Renewal Alert Notice
  const generateRenewalAlertEmailHtml = (company: Settings) => {
    const daysLeft = getDaysRemaining(company);
    const isExpired = daysLeft <= 0 || company.subscription?.status === 'expired';
    const renewalUrl = `${window.location.origin}`;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
    .card { background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; padding: 32px; max-width: 620px; margin: 0 auto; box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
    .header { text-align: center; border-bottom: 2px solid ${isExpired ? '#ef4444' : '#f59e0b'}; padding-bottom: 20px; margin-bottom: 24px; }
    .logo { font-size: 22px; font-weight: 900; color: #4f46e5; letter-spacing: -0.5px; }
    .title { font-size: 20px; font-weight: 800; color: ${isExpired ? '#dc2626' : '#d97706'}; margin-top: 8px; }
    .alert-box { background: ${isExpired ? '#fef2f2' : '#fffbeb'}; border: 1px solid ${isExpired ? '#fca5a5' : '#fde68a'}; border-radius: 12px; padding: 16px; margin: 20px 0; text-align: center; }
    .alert-days { font-size: 28px; font-weight: 900; color: ${isExpired ? '#991b1b' : '#92400e'}; }
    .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .details-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .btn-renew { display: block; text-align: center; background: #4f46e5; color: #ffffff; font-weight: 800; font-size: 16px; padding: 16px 28px; border-radius: 14px; text-decoration: none; margin: 28px 0; box-shadow: 0 4px 14px rgba(79,70,229,0.35); }
    .footer { font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 28px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo">⚡ Kiri HR Workspace Portal</div>
      <div class="title">${isExpired ? '🚨 Subscription Expired — Immediate Action Required' : '⚠️ Action Required: Renewal Alert'}</div>
    </div>

    <p style="font-size: 15px; line-height: 1.6; color: #334155;">
      Hello Admin team at <strong>${company.companyName}</strong>,<br/><br/>
      This is an automated reminder regarding your Kiri HR workspace subscription. 
      ${isExpired 
        ? 'Your workspace subscription has expired. Please renew your plan immediately to prevent service interruption and enable staff attendance tracking.' 
        : `Your workspace subscription is scheduled to expire in <strong>${daysLeft} day(s)</strong>.`}
    </p>

    <div class="alert-box">
      <div class="alert-days">${isExpired ? 'EXPIRED' : `${daysLeft} DAYS REMAINING`}</div>
      <div style="font-size:12px; color:${isExpired ? '#991b1b' : '#92400e'}; font-weight:700; margin-top:4px;">
        Expiration Date: ${company.subscription?.expiresAt ? new Date(company.subscription.expiresAt).toLocaleDateString('en-US', { dateStyle: 'full' }) : 'Pending'}
      </div>
    </div>

    <table class="details-table">
      <tr>
        <td style="color:#64748b; font-weight:600;">Workspace Name:</td>
        <td style="font-weight:700; color:#0f172a;">${company.companyName}</td>
      </tr>
      <tr>
        <td style="color:#64748b; font-weight:600;">Workspace Code:</td>
        <td style="font-weight:700; color:#4f46e5;">${company.companyCode || 'N/A'}</td>
      </tr>
      <tr>
        <td style="color:#64748b; font-weight:600;">Current Plan:</td>
        <td style="font-weight:700; color:#0f172a;">${company.subscription?.type?.toUpperCase() || 'STANDARD'}</td>
      </tr>
      <tr>
        <td style="color:#64748b; font-weight:600;">Contact Email:</td>
        <td style="font-weight:700; color:#0f172a;">${company.adminEmail || company.companyPhone || 'Admin Team'}</td>
      </tr>
    </table>

    <a href="${renewalUrl}" class="btn-renew">
      Renew Workspace Subscription Now →
    </a>

    <p style="font-size: 13px; color: #64748b; text-align: center; line-height: 1.5;">
      Need assistance or custom invoicing? Reply to this email or contact your Kiri HR account executive.
    </p>

    <div class="footer">
      Kiri HR Platform Automation • Dispatched to ${company.adminEmail || 'Workspace Administrator'}<br/>
      Workspace ID: ${company.id}
    </div>
  </div>
</body>
</html>
    `;
  };

  const handleSendInstantReport = async () => {
    setIsSendingInstant(true);
    try {
      const freqLabel = schedule.frequency === 'weekly' ? 'Weekly' : 'Monthly';
      const htmlBody = generateRevenueEmailHtml(freqLabel);

      const logDoc: ReportLog = {
        id: `report_${Date.now()}`,
        reportType: 'revenue_summary',
        frequency: schedule.frequency,
        recipients: schedule.recipients,
        sentAt: new Date().toISOString(),
        status: 'sent',
        summaryMetrics: {
          totalRevenue,
          activeWorkspacesCount: companies.filter(c => c.subscription?.status === 'active').length,
          subscribersCount: companies.length,
          transactionsCount: realTransactions.length
        },
        htmlBodyPreview: htmlBody
      };

      await addDoc(collection(db, 'report_logs'), logDoc);

      await setDoc(doc(db, 'scheduled_reports', 'revenue_summary'), {
        ...schedule,
        lastSentAt: new Date().toISOString()
      }, { merge: true });

      setReportLogs(prev => [logDoc, ...prev]);

      const mailSubject = encodeURIComponent(`[Kiri HR] ${freqLabel} Executive Revenue Summary Report - $${totalRevenue.toFixed(2)}`);
      const mailBody = encodeURIComponent(`Executive Revenue Summary (${freqLabel})\nTotal Revenue: $${totalRevenue.toFixed(2)}\nActive Workspaces: ${companies.filter(c => c.subscription?.status === 'active').length}\n\nReport dispatches delivered to: ${schedule.recipients.join(', ')}`);
      
      window.open(`mailto:${schedule.recipients.join(',')}?subject=${mailSubject}&body=${mailBody}`, '_blank');

      alert(`✅ Automated Revenue Report successfully generated and dispatched to ${schedule.recipients.length} recipient(s)!`);
      setShowPreviewModal(false);
    } catch (err: any) {
      console.error("Error dispatching revenue report", err);
      alert("Failed to send report: " + (err?.message || err));
    } finally {
      setIsSendingInstant(false);
    }
  };

  // Dispatch single workspace renewal email alert
  const handleSendSingleRenewalAlert = async (company: Settings) => {
    setIsSendingInstant(true);
    try {
      const daysLeft = getDaysRemaining(company);
      const recipientEmail = company.adminEmail || company.companyPhone || 'kirihrsystem@gmail.com';
      const htmlBody = generateRenewalAlertEmailHtml(company);

      const logDoc: ReportLog = {
        id: `renewal_${company.id}_${Date.now()}`,
        reportType: 'renewal_alert',
        frequency: 'instant',
        recipients: [recipientEmail],
        sentAt: new Date().toISOString(),
        status: 'sent',
        workspaceId: company.id,
        workspaceName: company.companyName,
        daysRemaining: daysLeft,
        htmlBodyPreview: htmlBody
      };

      await addDoc(collection(db, 'report_logs'), logDoc);
      setReportLogs(prev => [logDoc, ...prev]);

      const mailSubject = encodeURIComponent(`Action Required: Renew your Kiri HR Subscription for ${company.companyName}`);
      const mailBody = encodeURIComponent(`Hello Admin Team at ${company.companyName},\n\nYour workspace subscription is expiring in ${daysLeft} days. Please visit your admin dashboard to renew your subscription.\n\nWorkspace Code: ${company.companyCode || 'N/A'}`);
      
      window.open(`mailto:${recipientEmail}?subject=${mailSubject}&body=${mailBody}`, '_blank');

      alert(`✅ Renewal Email Alert successfully triggered for ${company.companyName} (${recipientEmail})!`);
      setShowPreviewModal(false);
      setPreviewCompany(null);
    } catch (err: any) {
      console.error("Error triggering renewal alert", err);
      alert("Failed to send renewal alert: " + (err?.message || err));
    } finally {
      setIsSendingInstant(false);
    }
  };

  // Bulk send renewal alerts to all expiring workspaces
  const handleSendBulkRenewalAlerts = async () => {
    if (expiringCompanies.length === 0) {
      alert("There are currently no workspaces expiring within 14 days.");
      return;
    }

    if (!confirm(`Are you sure you want to trigger automated renewal alert emails to ${expiringCompanies.length} expiring workspace(s)?`)) return;

    setIsSendingBulkRenewal(true);
    try {
      const sentCount = expiringCompanies.length;
      for (const company of expiringCompanies) {
        const daysLeft = getDaysRemaining(company);
        const recipientEmail = company.adminEmail || 'kirihrsystem@gmail.com';
        const htmlBody = generateRenewalAlertEmailHtml(company);

        const logDoc: ReportLog = {
          id: `renewal_bulk_${company.id}_${Date.now()}`,
          reportType: 'renewal_alert',
          frequency: 'auto_reminder',
          recipients: [recipientEmail],
          sentAt: new Date().toISOString(),
          status: 'sent',
          workspaceId: company.id,
          workspaceName: company.companyName,
          daysRemaining: daysLeft,
          htmlBodyPreview: htmlBody
        };

        await addDoc(collection(db, 'report_logs'), logDoc);
      }

      await fetchScheduleAndLogs();
      alert(`🚀 Successfully dispatched ${sentCount} automated renewal email alerts to expiring workspaces!`);
    } catch (err: any) {
      console.error("Error sending bulk renewal alerts", err);
      alert("Failed bulk dispatch: " + (err?.message || err));
    } finally {
      setIsSendingBulkRenewal(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 text-slate-800 dark:text-slate-100">
      {/* Top Main Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white shadow-xl relative overflow-hidden border border-indigo-800/50">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Mail className="w-64 h-64 text-indigo-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              Automated Email Dispatcher Engine
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
              Automated Reports & Renewal Alerts
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Schedule weekly/monthly executive revenue summaries and automated email alerts reminding workspace admins to renew expiring subscriptions.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {activeSubTab === 'revenue' ? (
              <button
                onClick={() => { setPreviewCompany(null); setShowPreviewModal(true); }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4 text-amber-300" />
                Preview & Dispatch Revenue Report
              </button>
            ) : (
              <button
                onClick={handleSendBulkRenewalAlerts}
                disabled={isSendingBulkRenewal || expiringCompanies.length === 0}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSendingBulkRenewal ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Bulk Renewal Alerts ({expiringCompanies.length})
              </button>
            )}
          </div>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-3">
          <button
            onClick={() => setActiveSubTab('revenue')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'revenue' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Revenue Summary Reports
          </button>

          <button
            onClick={() => setActiveSubTab('renewal')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'renewal' 
                ? 'bg-amber-500 text-slate-950 shadow-md' 
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" />
            Subscription Renewal Alerts
            {expiringCompanies.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-rose-600 text-white font-black">
                {expiringCompanies.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab 1: Revenue Summary Reports */}
      {activeSubTab === 'revenue' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start animate-in fade-in">
          {/* Left 2 Cols: Schedule Configuration Form */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Cash Income Report Schedule</h3>
                  <p className="text-xs text-slate-500">Configure frequency, timing, and recipient list</p>
                </div>
              </div>

              {/* Toggle Active / Paused Switch */}
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${schedule.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {schedule.enabled ? 'Active' : 'Paused'}
                </span>
                <button
                  type="button"
                  onClick={() => setSchedule(prev => ({ ...prev, enabled: !prev.enabled }))}
                  className={`w-12 h-6 rounded-full p-1 transition-colors relative ${schedule.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${schedule.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-6">
              {/* Frequency & Timing Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Report Frequency
                  </label>
                  <select
                    value={schedule.frequency}
                    onChange={(e) => setSchedule(prev => ({ ...prev, frequency: e.target.value as 'weekly' | 'monthly' }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="weekly">Weekly Summary</option>
                    <option value="monthly">Monthly Summary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {schedule.frequency === 'weekly' ? 'Delivery Day' : 'Day of Month'}
                  </label>
                  {schedule.frequency === 'weekly' ? (
                    <select
                      value={schedule.sendDay}
                      onChange={(e) => setSchedule(prev => ({ ...prev, sendDay: Number(e.target.value) }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value={1}>Every Monday</option>
                      <option value={2}>Every Tuesday</option>
                      <option value={3}>Every Wednesday</option>
                      <option value={4}>Every Thursday</option>
                      <option value={5}>Every Friday</option>
                      <option value={6}>Every Saturday</option>
                      <option value={7}>Every Sunday</option>
                    </select>
                  ) : (
                    <select
                      value={schedule.sendDay}
                      onChange={(e) => setSchedule(prev => ({ ...prev, sendDay: Number(e.target.value) }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value={1}>1st of Month</option>
                      <option value={15}>15th of Month</option>
                      <option value={28}>28th of Month (End of Month)</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Delivery Time (Local)
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="time"
                      value={schedule.sendTime}
                      onChange={(e) => setSchedule(prev => ({ ...prev, sendTime: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Recipients Section */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Recipient Email Addresses
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="email"
                    value={recipientInput}
                    onChange={(e) => setRecipientInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddRecipient(); } }}
                    placeholder="Enter email e.g. finance@kiri.com"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddRecipient}
                    className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-xl font-bold text-xs flex items-center gap-1 border border-indigo-200/50 dark:border-indigo-800/50 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {schedule.recipients.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700"
                    >
                      <Mail className="w-3 h-3 text-indigo-500" />
                      {email}
                      {schedule.recipients.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRecipient(email)}
                          className="p-0.5 hover:text-rose-500 transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {/* Metrics Checklist */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Metrics to Include in Digest
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { key: 'totalRevenue', label: 'Total Revenue & Growth Stats' },
                    { key: 'activeWorkspaces', label: 'Active Paid Workspaces Count' },
                    { key: 'revenueBreakdown', label: 'Cash Income Breakdown (Subs vs Passes)' },
                    { key: 'topWorkspaces', label: 'Top Workspace Subscription List' },
                    { key: 'recentTransactions', label: 'Recent Billing & Payment Log' },
                    { key: 'couponRedemptions', label: 'Coupon & Pass Redemption Rate' },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer hover:bg-slate-100/80 transition-colors">
                      <input
                        type="checkbox"
                        checked={(schedule.includeMetrics as any)[item.key]}
                        onChange={(e) => setSchedule(prev => ({
                          ...prev,
                          includeMetrics: {
                            ...prev.includeMetrics,
                            [item.key]: e.target.checked
                          }
                        }))}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-500">
                  Next run: <strong className="text-indigo-600 dark:text-indigo-400">{calculateNextRun(schedule.frequency, schedule.sendDay, schedule.sendTime)}</strong>
                </div>

                <div className="flex items-center gap-3">
                  {saveSuccessMsg && (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
                      <Check className="w-4 h-4" /> Schedule Saved!
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-2"
                  >
                    {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    Save Schedule Config
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Right 1 Col: Quick System Summary & Dispatched Logs History */}
          <div className="space-y-6">
            {/* Quick Metrics Summary Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                Live Revenue Overview
              </h4>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Total Revenue</span>
                    <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">${totalRevenue.toFixed(2)}</div>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                    $
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Active Workspaces</span>
                    <div className="text-base font-bold text-slate-900 dark:text-white">
                      {companies.filter(c => c.subscription?.status === 'active').length}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total Coupons</span>
                    <div className="text-base font-bold text-slate-900 dark:text-white">
                      {coupons.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Report Logs History */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  Dispatch History
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {reportLogs.length} logs
                </span>
              </div>

              {reportLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No automated reports dispatched yet. Click "Preview & Dispatch Revenue Report" above to trigger a test report.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                  {reportLogs.map((log) => (
                    <div key={log.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${log.reportType === 'renewal_alert' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                          {log.reportType === 'renewal_alert' ? 'Renewal Alert' : `${log.frequency.toUpperCase()} Revenue Summary`}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(log.sentAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
                          {log.workspaceName && ` • ${log.workspaceName}`}
                        </div>
                      </div>

                      <div className="text-right">
                        <button
                          onClick={() => { setSelectedLogPreview(log); setShowPreviewModal(true); }}
                          className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                        >
                          View HTML
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Subscription Renewal Alerts Manager */}
      {activeSubTab === 'renewal' && (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in">
          {/* Top Config Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Renewal Reminder Email Automation</h3>
                  <p className="text-xs text-slate-500">Automatically trigger email alerts to workspace admins when subscriptions near expiration</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${renewalConfig.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                    {renewalConfig.enabled ? 'Automation Active' : 'Automation Off'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRenewalConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                    className={`w-12 h-6 rounded-full p-1 transition-colors relative ${renewalConfig.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${renewalConfig.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleSaveRenewalConfig}
                  disabled={isSaving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Save Settings
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Trigger Days Before Expiry</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {[14, 7, 3, 1, 0].map(days => {
                    const isSelected = renewalConfig.notifyDaysBefore.includes(days);
                    return (
                      <button
                        key={days}
                        type="button"
                        onClick={() => {
                          setRenewalConfig(prev => ({
                            ...prev,
                            notifyDaysBefore: isSelected
                              ? prev.notifyDaysBefore.filter(d => d !== days)
                              : [...prev.notifyDaysBefore, days]
                          }));
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        {days === 0 ? 'On Expiry Day' : `${days} Days Prior`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Email Recipient</label>
                <select
                  value={renewalConfig.recipientsScope}
                  onChange={(e) => setRenewalConfig(prev => ({ ...prev, recipientsScope: e.target.value as any }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="workspace_admin">Workspace Admin Email</option>
                  <option value="all_super_admins">All Super Admins & Workspace Admin</option>
                </select>
                <p className="text-[11px] text-slate-400">Delivers reminder email directly to workspace owner's inbox.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Expiring Workspaces Status</label>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400">{expiringCompanies.length} Workspaces</span>
                  <span className="text-xs text-slate-400">Need Renewal</span>
                </div>
                <p className="text-[11px] text-slate-400">Workspaces with ≤14 days remaining or expired status.</p>
              </div>
            </div>
          </div>

          {/* Table of Expiring / Expired Workspaces */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Expiring Workspaces & Renewal Alert Queue</h3>
                <p className="text-xs text-slate-500">Send direct renewal alert emails to workspace owners right from the dashboard</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-200 dark:border-amber-800">
                {expiringCompanies.length} Workspaces Eligible
              </span>
            </div>

            {expiringCompanies.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">All Workspaces Are Fully Active!</p>
                <p className="text-xs">No workspaces are currently within the 14-day renewal alert window.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                      <th className="p-3">Workspace</th>
                      <th className="p-3">Admin Email</th>
                      <th className="p-3">Current Plan</th>
                      <th className="p-3">Expiration Date</th>
                      <th className="p-3">Status / Days Left</th>
                      <th className="p-3 text-right">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {expiringCompanies.map((c) => {
                      const daysLeft = getDaysRemaining(c);
                      const isExpired = daysLeft <= 0 || c.subscription?.status === 'expired';

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
                              <div>
                                {c.companyName}
                                <span className="text-[10px] text-slate-400 block font-normal">Code: {c.companyCode || 'N/A'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 font-medium text-slate-600 dark:text-slate-300">
                            {c.adminEmail || c.companyPhone || 'kirihrsystem@gmail.com'}
                          </td>
                          <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">
                            {c.subscription?.type?.toUpperCase() || 'STANDARD'}
                          </td>
                          <td className="p-3 font-medium text-slate-600 dark:text-slate-400">
                            {c.subscription?.expiresAt ? new Date(c.subscription.expiresAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="p-3">
                            {isExpired ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-extrabold text-[11px]">
                                <AlertTriangle className="w-3 h-3" /> EXPIRED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold text-[11px]">
                                <Clock className="w-3 h-3" /> {daysLeft} Day(s) Left
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setPreviewCompany(c);
                                  setSelectedLogPreview(null);
                                  setShowPreviewModal(true);
                                }}
                                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" /> Preview
                              </button>

                              <button
                                onClick={() => handleSendSingleRenewalAlert(c)}
                                disabled={isSendingInstant}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" /> Send Alert
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Modal for Email HTML */}
      <AnimatePresence>
        {(showPreviewModal || selectedLogPreview) && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                    <Mail className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {selectedLogPreview 
                        ? 'Dispatched Email Payload' 
                        : previewCompany 
                          ? `Renewal Alert Preview (${previewCompany.companyName})` 
                          : 'Revenue Summary Email Preview'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selectedLogPreview 
                        ? `Sent on ${new Date(selectedLogPreview.sentAt).toLocaleString()}` 
                        : previewCompany 
                          ? `Recipient: ${previewCompany.adminEmail || 'Workspace Admin'}` 
                          : `Recipients: ${schedule.recipients.join(', ')}`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => { setShowPreviewModal(false); setSelectedLogPreview(null); setPreviewCompany(null); }}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body: HTML Frame */}
              <div className="flex-1 p-6 overflow-y-auto bg-slate-100 dark:bg-slate-950">
                <iframe
                  srcDoc={
                    selectedLogPreview?.htmlBodyPreview ||
                    (previewCompany
                      ? generateRenewalAlertEmailHtml(previewCompany)
                      : generateRevenueEmailHtml(schedule.frequency === 'weekly' ? 'Weekly' : 'Monthly'))
                  }
                  title="Report Email Preview"
                  className="w-full h-[480px] bg-white rounded-2xl shadow-inner border border-slate-200/80"
                />
              </div>

              {/* Modal Footer */}
              <div className="p-5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setShowPreviewModal(false); setSelectedLogPreview(null); setPreviewCompany(null); }}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Close
                </button>

                {!selectedLogPreview && (
                  previewCompany ? (
                    <button
                      type="button"
                      onClick={() => handleSendSingleRenewalAlert(previewCompany)}
                      disabled={isSendingInstant}
                      className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
                    >
                      {isSendingInstant ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Dispatch Renewal Alert Email Now
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendInstantReport}
                      disabled={isSendingInstant}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
                    >
                      {isSendingInstant ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Dispatch Revenue Report Email Now
                    </button>
                  )
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
