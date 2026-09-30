const fs = require('fs');

let content = fs.readFileSync('src/components/LiveAttendanceDashboard.tsx', 'utf8');

// 1. Add Send icon to imports
content = content.replace(
  /UserX\n\} from 'lucide-react';/,
  "UserX,\n  Send\n} from 'lucide-react';"
);

// 2. Add sendTelegramNotification import
if (!content.includes('sendTelegramNotification')) {
  content = content.replace(
    /import \{ formatTimeWithLocale \} from '\.\.\/utils\/khmerDateUtils';/,
    "import { formatTimeWithLocale } from '../utils/khmerDateUtils';\nimport { sendTelegramNotification } from '../utils/telegramUtils';"
  );
}

// 3. Add state and function
const functionToInsert = `
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);

  const handleSendTelegramSummary = async () => {
    if (!user?.companyId) return;
    setIsSendingTelegram(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const leavesQ = query(
        collection(db, 'leaves'),
        where('companyId', '==', user.companyId),
        where('date', '==', today),
        where('status', '==', 'approved')
      );
      const leaveSnap = await getDocs(leavesQ);
      const approvedLeaves = leaveSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const presentList = [];
      const absentList = [];

      const sortedStaff = [...staffList].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      sortedStaff.forEach(staff => {
        const staffLog = logs.find(l => l.staffId === staff.id);
        const staffLeave = approvedLeaves.find(l => l.staffId === staff.id);

        if (staffLog) {
          const timeInStr = staffLog.timeIn ? format(new Date(staffLog.timeIn), 'hh:mm a') : 'N/A';
          let outStr = '';
          if (staffLog.status === 'checked_out' && staffLog.timeOut) {
            outStr = \` | Out: \${format(new Date(staffLog.timeOut), 'hh:mm a')}\`;
          } else if (staffLog.status === 'break') {
            outStr = \` | Out (Break)\`;
          }
          
          let lateStr = '';
          if (staffLog.lateMinutes > 0) {
            const lH = Math.floor(staffLog.lateMinutes / 60);
            const lM = Math.round(staffLog.lateMinutes % 60);
            lateStr = \` | Late: \${lH > 0 ? lH + 'h ' : ''}\${lM}m\`;
          }

          let hrsStr = '';
          if (staffLog.status === 'checked_out') {
            const totalH = (staffLog.regularHours || 0) + (staffLog.overtimeHours || 0);
            hrsStr = \` | Hrs: \${totalH.toFixed(1)}h\`;
          } else {
            hrsStr = \` | Active\`;
          }

          presentList.push(\`• \${staff.nameKh || staff.name}: In: \${timeInStr}\${outStr}\${lateStr}\${hrsStr}\`);
        } else {
          if (staffLeave) {
            if (staffLeave.type === 'day_off') {
              absentList.push(\`• \${staff.nameKh || staff.name}: Day Off\`);
            } else if (staffLeave.type === 'permission' || staffLeave.type === 'early_leave' || staffLeave.type === 'late_checkin') {
              absentList.push(\`• \${staff.nameKh || staff.name}: Permission (\${staffLeave.reason || 'Approved'})\`);
            } else {
              absentList.push(\`• \${staff.nameKh || staff.name}: Absent\`);
            }
          } else {
            absentList.push(\`• \${staff.nameKh || staff.name}: Absent\`);
          }
        }
      });

      const messageParts = [
        \`📊 <b>Daily Attendance Summary</b>\`,
        \`📅 <b>Date:</b> \${format(new Date(), 'MMM dd, yyyy')}\`,
        '',
        \`✅ <b>PRESENT / ACTIVE (\${presentList.length})</b>\`,
        presentList.length > 0 ? presentList.join('\\n') : 'None',
        '',
        \`❌ <b>ABSENT & LEAVES (\${absentList.length})</b>\`,
        absentList.length > 0 ? absentList.join('\\n') : 'None'
      ];

      await sendTelegramNotification(messageParts.join('\\n'), true);
      alert(t('summarySentSuccess') || 'Summary sent to Telegram successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to send summary.');
    } finally {
      setIsSendingTelegram(false);
    }
  };
`;

content = content.replace(
  "const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'break' | 'checked_out' | 'not_arrived'>('all');",
  "const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'break' | 'checked_out' | 'not_arrived'>('all');\n" + functionToInsert
);

// 4. Add the button
const buttonsReplacement = `
        <div className="flex items-center gap-2">
          <button
            onClick={handleSendTelegramSummary}
            disabled={isSendingTelegram}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 rounded-lg text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors shadow-sm disabled:opacity-50"
          >
            <Send className={\`w-4 h-4 \${isSendingTelegram ? 'animate-pulse' : ''}\`} />
            {isSendingTelegram ? 'Sending...' : 'Send Summary'}
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={\`w-4 h-4 \${isRefreshing ? 'animate-spin text-indigo-600' : 'text-slate-400'}\`} />
            {t('refreshData') || 'Refresh View'}
          </button>
        </div>
`;

content = content.replace(
  /<button\s+onClick=\{handleRefresh\}[\s\S]*?<\/button>/,
  buttonsReplacement
);

fs.writeFileSync('src/components/LiveAttendanceDashboard.tsx', content);
console.log('Patched');
