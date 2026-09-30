import React, { useState, useEffect, useRef } from 'react';
import { getTelegramBotInfo, checkBotUpdatesForStaff, sendDirectTelegramMessage } from '../utils/telegramUtils';
import { Send, CheckCircle2, RefreshCw, Bell, ExternalLink, AlertCircle, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TelegramConnectWidgetProps {
  staffId: string;
  passcode?: string;
  currentChatId?: string;
  onChatIdDetected: (chatId: string) => void;
  className?: string;
}

export const TelegramConnectWidget: React.FC<TelegramConnectWidgetProps> = ({
  staffId,
  passcode,
  currentChatId,
  onChatIdDetected,
  className = ""
}) => {
  const { t } = useTranslation();
  const [botInfo, setBotInfo] = useState<{ username?: string; name?: string } | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [detectedInfo, setDetectedInfo] = useState<{ chatId: string; firstName?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualChatId, setManualChatId] = useState(currentChatId || '');
  const [isEditing, setIsEditing] = useState(!currentChatId);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    getTelegramBotInfo().then((info) => {
      setBotInfo(info);
    });
  }, []);

  useEffect(() => {
    if (currentChatId && !detectedInfo) {
      setIsEditing(false);
      setManualChatId(currentChatId);
    } else if (!currentChatId) {
      setIsEditing(true);
      setIsPolling(false);
    }
  }, [currentChatId]);

  useEffect(() => {
    let isMounted = true;
    if (isPolling) {
      const doCheck = async () => {
        const res = await checkBotUpdatesForStaff(staffId, passcode);
        if (res && isMounted) {
          setIsPolling(false);
          setDetectedInfo({ chatId: res.chatId, firstName: res.firstName });
          onChatIdDetected(res.chatId);
          setIsEditing(false);

          // Send welcome telegram message
          await sendDirectTelegramMessage(
            res.chatId,
            `🎉 <b>អបអរសាទរ! (Congratulations ${res.firstName || ''}!)</b>\n\nគណនី Telegram របស់អ្នកត្រូវបានភ្ជាប់ជាមួយប្រព័ន្ធរដ្ឋបាល HR រួចរាល់ហើយ! (Your Telegram account is now successfully linked for direct HR notifications!)\n\nអ្នកនឹងទទួលបានការជូនដំណឹងអំពី:\n• សំណើសុំច្បាប់ (Leave Requests & Approvals)\n• របាយការណ៍បៀវត្ស (Payroll Reviews & Confirmations)\n• ការបើកប្រាក់ខែ (Salary Payment Alerts)`
          );
        }
      };

      // Check immediately when polling starts without waiting for timer
      doCheck();

      pollingRef.current = setInterval(doCheck, 3000);
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }

    return () => {
      isMounted = false;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isPolling, staffId, passcode, onChatIdDetected]);

  const handleStartBotClick = () => {
    if (botInfo?.username) {
      window.open(`https://t.me/${botInfo.username}?start=${staffId}`, '_blank', 'noopener,noreferrer');
    } else {
      alert("Bot username is currently unavailable. Please ensure VITE_TELEGRAM_BOT_TOKEN is set in settings.");
      return;
    }
    setIsPolling(true);
  };

  const handleTestNotification = async () => {
    const targetId = currentChatId || detectedInfo?.chatId || manualChatId;
    if (!targetId) return;

    setIsTesting(true);
    setTestResult(null);
    const success = await sendDirectTelegramMessage(
      targetId,
      `🔔 <b>សារសាកល្បង! (Test Notification)</b>\n\nការភ្ជាប់ Telegram របស់អ្នកដំណើរការបានល្អឥតខ្ចោះ! (Your Telegram notification connection is working perfectly!)`
    );
    setIsTesting(false);
    setTestResult(success ? 'success' : 'error');
    setTimeout(() => setTestResult(null), 4000);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualChatId.trim()) {
      onChatIdDetected(manualChatId.trim());
      setIsEditing(false);
      setShowManualInput(false);
    }
  };

  if (!isEditing && (currentChatId || detectedInfo?.chatId)) {
    const displayId = currentChatId || detectedInfo?.chatId;
    return (
      <div className={`bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-5 shadow-sm transition-all ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-base">Telegram Connected</h4>
                <span className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Active ✅</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                Chat ID: {displayId} {detectedInfo?.firstName ? `(${detectedInfo.firstName})` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestNotification}
              disabled={isTesting}
              className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <Bell className={`w-3.5 h-3.5 ${isTesting ? 'animate-bounce text-indigo-500' : ''}`} />
              <span>{isTesting ? 'Sending...' : 'Test Alert'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(true);
                setIsPolling(true);
              }}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl transition-all"
            >
              Change
            </button>
          </div>
        </div>

        {testResult === 'success' && (
          <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs px-3 py-2 rounded-xl flex items-center gap-2 font-medium animate-in fade-in">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Test message sent successfully to your Telegram! Check your app.</span>
          </div>
        )}
        {testResult === 'error' && (
          <div className="mt-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs px-3 py-2 rounded-xl flex items-center gap-2 font-medium animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Failed to send test alert. Please verify your Chat ID or reconnect the bot.</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-indigo-50 via-sky-50 to-blue-50 dark:from-indigo-950/30 dark:via-sky-950/20 dark:to-blue-950/30 border border-indigo-200/80 dark:border-indigo-800/50 rounded-2xl p-5 sm:p-6 shadow-sm ${className}`}>
      <div className="flex items-start gap-3.5 mb-4">
        <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
          <Send className="w-6 h-6 -ml-0.5" />
        </div>
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white text-base">Connect Telegram for Direct Alerts</h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            Get instant personal notifications when your Leave Requests are approved/rejected, Payroll reports are ready for review, or salary is paid.
          </p>
        </div>
      </div>

      <div className="space-y-3 bg-white/70 dark:bg-slate-900/60 backdrop-blur-sm p-4 rounded-xl border border-white/80 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
            <span className="font-bold text-indigo-600 dark:text-indigo-400">Step 1:</span> Click button below to open our Telegram bot and click <b>START</b>. <span className="text-amber-600 dark:text-amber-400 font-semibold">(If no START button appears, simply type and send "hi" or your PIN to the bot!)</span>
          </div>
          <button
            type="button"
            onClick={handleStartBotClick}
            disabled={!botInfo?.username}
            className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-95 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>Open & Start Bot</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </button>
        </div>

        {isPolling && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin shrink-0" />
                <div className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                  ⏳ Waiting for a message from Telegram... (Auto-detecting your Chat ID)
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPolling(false)}
                className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline shrink-0"
              >
                Cancel
              </button>
            </div>
            <div className="text-[11px] text-amber-700/90 dark:text-amber-400/90 bg-amber-100/50 dark:bg-amber-900/20 p-2 rounded-lg border border-amber-200/50 dark:border-amber-800/30 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
              <span><b>Tip:</b> If you already opened this bot previously, the <b>START</b> button won't show up. Just type <b>"hi"</b> or send any text to the bot right now and it will connect instantly!</span>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400 dark:text-slate-500">Having trouble auto-detecting?</span>
          <button
            type="button"
            onClick={() => setShowManualInput(!showManualInput)}
            className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {showManualInput ? 'Hide manual input' : 'Paste Chat ID manually'}
          </button>
        </div>

        {showManualInput && (
          <form onSubmit={handleManualSubmit} className="pt-2 flex gap-2">
            <input
              type="text"
              value={manualChatId}
              onChange={(e) => setManualChatId(e.target.value)}
              placeholder="e.g. 123456789"
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white font-mono"
            />
            <button
              type="submit"
              disabled={!manualChatId.trim()}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all"
            >
              Save ID
            </button>
          </form>
        )}
      </div>

      {currentChatId && (
        <div className="mt-3 text-right">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            Cancel & Keep Current ID
          </button>
        </div>
      )}
    </div>
  );
};
