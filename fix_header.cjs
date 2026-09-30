const fs = require('fs');
let content = fs.readFileSync('src/pages/SuperAdminDashboard.tsx', 'utf-8');

content = content.replace(
  `<span className="text-slate-400">Total Cash:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">\${totalRevenue.toFixed(2)}</span>`,
  `<span className="text-slate-400">Today's Income:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">\${revenueStats.daily.toFixed(2)}</span>
          </div>
          <div className="w-px h-3 bg-slate-300 dark:bg-slate-700" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Total Cash:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">\${revenueStats.total.toFixed(2)}</span>`
);

fs.writeFileSync('src/pages/SuperAdminDashboard.tsx', content);
