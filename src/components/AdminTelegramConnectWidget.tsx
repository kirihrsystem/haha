import React, { useState, useEffect, useRef } from 'react';
import { getTelegramBotInfo, checkBotUpdatesForStaff, sendDirectTelegramMessage } from '../utils/telegramUtils';
import { Send, CheckCircle2, RefreshCw, Bell, ExternalLink, AlertCircle, Sparkles, X, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AdminTelegramConnectWidgetProps {
  currentChatIds: string;
  onChatIdsChange: (chatIds: string) => void;
  className?: string;
}

export const AdminTelegramConnectWidget: React.FC<AdminTelegramConnectWidgetProps> = ({
  currentChatIds,
  onChatIdsChange,
  className = ""
}) => {
  const { t } = useTranslation();
  const [botInfo, setBotInfo] = useState<{ username?: string; name?: string } | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualChatId, setManualChatId] = useState('');
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const idArray = currentChatIds
    .split(/[,\n;]+/)
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  useEffect(() => {
    getTelegramBotInfo().then((info) => {
      setBotInfo(info);
    });
  }, []);

  useEffect(() => {
    if (isPolling) {
      const poll = async () => {
        // Use a generic Admin passcode or just fetch recent updates
        // For admins, we can just use "admin" as a keyword or check for any recent message
        const info = await checkBotUpdatesForStaff('admin', 'admin123'); 
        if (info && info.chatId) {
          if (!idArray.includes(info.chatId)) {
            const newIds = [...idArray, info.chatId].join(', ');
            onChatIdsChange(newIds);
          }
          setIsPolling(false);
        }
      };
      
      poll();
      pollingRef.current = setInterval(poll, 3000);
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
    
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isPolling, idArray, onChatIdsChange]);

  const handleStartBotClick = () => {
    if (botInfo?.username) {
      window.open(`https://t.me/${botInfo.username}?start=admin`, '_blank');
      setIsPolling(true);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualChatId.trim() && !idArray.includes(manualChatId.trim())) {
      const newIds = [...idArray, manualChatId.trim()].join(', ');
      onChatIdsChange(newIds);
      setManualChatId('');
      setShowManualInput(false);
    }
  };

  const handleRemoveId = (idToRemove: string) => {
    const newIds = idArray.filter(id => id !== idToRemove).join(', ');
    onChatIdsChange(newIds);
  };

  const handleTestNotification = async (chatId: string) => {
    setIsTesting(chatId);
    setTestResult(null);
    try {
      const success = await sendDirectTelegramMessage(
        chatId,
        `🔔 <b>Admin Test Alert</b>\n\nThis is a test message from your Kiri HR system for Admin/Privacy alerts.\n\nYour chat ID: <code>${chatId}</code>`
      );
      setTestResult(success ? 'success' : 'error');
    } catch (error) {
      setTestResult('error');
    } finally {
      setIsTesting(null);
      setTimeout(() => setTestResult(null), 5000);
    }
  };

  return (
    <div className={`bg-gradient-to-br from-indigo-50 via-sky-50 to-blue-50 dark:from-indigo-950/30 dark:via-sky-950/20 dark:to-blue-950/30 border border-indigo-200/80 dark:border-indigo-800/50 rounded-2xl p-5 sm:p-6 shadow-sm ${className}`}>
      <div className="flex items-start gap-3.5 mb-4">
        <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
          <Send className="w-6 h-6 -ml-0.5" />
        </div>
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white text-base">Connect Admin Telegrams (Privacy Alerts)</h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            Get instant private notifications for Requests, Approvals, Send for Review, Confirm Payroll, Mark as Paid, and Employee modifications. Multiple IDs supported.
          </p>
        </div>
      </div>

      {idArray.length > 0 && (
        <div className="mb-4 space-y-2">
          <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">Connected Admin Chat IDs:</h5>
          <div className="flex flex-wrap gap-2">
            {idArray.map((id, idx) => (
              <div key={`${id}-${idx}`} className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-200">{id}</span>
                <button
                  type="button"
                  onClick={() => handleTestNotification(id)}
                  disabled={isTesting !== null}
                  className={`ml-1 text-[10px] px-2 py-0.5 rounded-md font-bold transition-all ${isTesting === id ? 'bg-indigo-100 text-indigo-600 animate-pulse' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                >
                  Test
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveId(id)}
                  className="ml-1 text-slate-400 hover:text-red-500 transition-colors p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          {testResult === 'success' && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs px-3 py-2 rounded-xl flex items-center gap-2 font-medium animate-in fade-in">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Test message sent successfully!</span>
            </div>
          )}
          {testResult === 'error' && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs px-3 py-2 rounded-xl flex items-center gap-2 font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Failed to send test alert.</span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3 bg-white/70 dark:bg-slate-900/60 backdrop-blur-sm p-4 rounded-xl border border-white/80 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
            <span className="font-bold text-indigo-600 dark:text-indigo-400">Add Admin:</span> Click button below to open our Telegram bot and click <b>START</b>. <span className="text-amber-600 dark:text-amber-400 font-semibold">(If no START button, type "admin" to connect!)</span>
          </div>
          <button
            type="button"
            onClick={handleStartBotClick}
            disabled={!botInfo?.username}
            className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Chat ID</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </button>
        </div>

        {isPolling && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin shrink-0" />
                <div className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                  ⏳ Waiting for a message from Admin... (Auto-detecting Chat ID)
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
              <span><b>Tip:</b> If the admin already opened this bot, just tell them to type <b>"admin"</b> or send any text to the bot right now and it will connect instantly!</span>
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
              Add ID
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
