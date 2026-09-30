const fs = require('fs');

let content = fs.readFileSync('src/components/LiveAttendanceDashboard.tsx', 'utf8');

// Replace function definition
const oldFuncStart = `const handleSendTelegramSummary = async () => {`;
const newFunc = `const handleSendTelegramSummary = async (lang: 'en' | 'km') => {
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
          const timeInStr = staffLog.timeIn ? format(new Date(staffLog.timeIn), 'hh:mm a') : (lang === 'km' ? 'គ្មាន' : 'N/A');
          let outStr = '';
          if (staffLog.status === 'checked_out' && staffLog.timeOut) {
            outStr = lang === 'km' 
              ? \` | ចេញ: \${format(new Date(staffLog.timeOut), 'hh:mm a')}\`
              : \` | Out: \${format(new Date(staffLog.timeOut), 'hh:mm a')}\`;
          } else if (staffLog.status === 'break') {
            outStr = lang === 'km' ? \` | ចេញ (សម្រាក)\` : \` | Out (Break)\`;
          }
          
          let lateStr = '';
          if (staffLog.lateMinutes > 0) {
            const lH = Math.floor(staffLog.lateMinutes / 60);
            const lM = Math.round(staffLog.lateMinutes % 60);
            if (lang === 'km') {
              lateStr = \` | យឺត: \${lH > 0 ? lH + 'ម៉ោង ' : ''}\${lM}នាទី\`;
            } else {
              lateStr = \` | Late: \${lH > 0 ? lH + 'h ' : ''}\${lM}m\`;
            }
          }

          let hrsStr = '';
          if (staffLog.status === 'checked_out') {
            const totalH = (staffLog.regularHours || 0) + (staffLog.overtimeHours || 0);
            hrsStr = lang === 'km' ? \` | ម៉ោងសរុប: \${totalH.toFixed(1)}h\` : \` | Hrs: \${totalH.toFixed(1)}h\`;
          } else {
            hrsStr = lang === 'km' ? \` | កំពុងធ្វើការ\` : \` | Active\`;
          }

          const inLabel = lang === 'km' ? 'ចូល:' : 'In:';
          presentList.push(\`• \${staff.nameKh || staff.name}: \${inLabel} \${timeInStr}\${outStr}\${lateStr}\${hrsStr}\`);
        } else {
          if (staffLeave) {
            if (staffLeave.type === 'day_off') {
              absentList.push(\`• \${staff.nameKh || staff.name}: \${lang === 'km' ? 'សម្រាក (Day Off)' : 'Day Off'}\`);
            } else if (staffLeave.type === 'permission' || staffLeave.type === 'early_leave' || staffLeave.type === 'late_checkin') {
              absentList.push(\`• \${staff.nameKh || staff.name}: \${lang === 'km' ? 'សុំច្បាប់' : 'Permission'} (\${staffLeave.reason || 'Approved'})\`);
            } else {
              absentList.push(\`• \${staff.nameKh || staff.name}: \${lang === 'km' ? 'អវត្តមាន' : 'Absent'}\`);
            }
          } else {
            absentList.push(\`• \${staff.nameKh || staff.name}: \${lang === 'km' ? 'អវត្តមាន' : 'Absent'}\`);
          }
        }
      });

      const messageParts = lang === 'km' ? [
        \`📊 <b>សេចក្តីសង្ខេបវត្តមានប្រចាំថ្ងៃ (Daily Attendance Summary)</b>\`,
        \`📅 <b>កាលបរិច្ឆេទ:</b> \${format(new Date(), 'MMM dd, yyyy')}\`,
        '',
        \`✅ <b>វត្តមាន / កំពុងធ្វើការ (\${presentList.length})</b>\`,
        presentList.length > 0 ? presentList.join('\\n') : 'គ្មាន',
        '',
        \`❌ <b>អវត្តមាន & សុំច្បាប់ (\${absentList.length})</b>\`,
        absentList.length > 0 ? absentList.join('\\n') : 'គ្មាន'
      ] : [
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
  };`;

// We use regex to replace from `const handleSendTelegramSummary = async () => {` until `setIsSendingTelegram(false);\n    }\n  };`
const regex = /const handleSendTelegramSummary = async \(\) => \{[\s\S]*?setIsSendingTelegram\(false\);\n    \}\n  \};/;
content = content.replace(regex, newFunc);

const oldButtons = `<button
            onClick={handleSendTelegramSummary}
            disabled={isSendingTelegram}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 rounded-lg text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors shadow-sm disabled:opacity-50"
          >
            <Send className={\`w-4 h-4 \${isSendingTelegram ? 'animate-pulse' : ''}\`} />
            {isSendingTelegram ? 'Sending...' : 'Send Summary'}
          </button>`;

const newButtons = `<div className="flex bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800/50 rounded-lg overflow-hidden shadow-sm">
            <button
              onClick={() => handleSendTelegramSummary('en')}
              disabled={isSendingTelegram}
              className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50 border-r border-indigo-200 dark:border-indigo-800/50"
              title="Send in English"
            >
              <Send className={\`w-3.5 h-3.5 sm:w-4 sm:h-4 \${isSendingTelegram ? 'animate-pulse' : ''}\`} />
              <span className="hidden sm:inline">{isSendingTelegram ? 'Sending...' : 'Send (EN)'}</span>
              <span className="sm:hidden">EN</span>
            </button>
            <button
              onClick={() => handleSendTelegramSummary('km')}
              disabled={isSendingTelegram}
              className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50"
              title="Send in Khmer"
            >
              <Send className={\`w-3.5 h-3.5 sm:w-4 sm:h-4 \${isSendingTelegram ? 'animate-pulse' : ''}\`} />
              <span className="hidden sm:inline">{isSendingTelegram ? 'Sending...' : 'Send (KM)'}</span>
              <span className="sm:hidden">KM</span>
            </button>
          </div>`;

content = content.replace(oldButtons, newButtons);

fs.writeFileSync('src/components/LiveAttendanceDashboard.tsx', content);
console.log('Patched UI for EN/KM options');
