const fs = require('fs');
let content = fs.readFileSync('src/pages/SuperAdminDashboard.tsx', 'utf-8');

// Replace the <header> opening tag and add the inner container
content = content.replace(
  '<header className="h-16 w-full shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between shadow-xs select-none z-40">',
  '<header className="w-full shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 shadow-xs select-none z-40 flex flex-col">\n        <div className="h-16 px-4 sm:px-6 flex items-center justify-between w-full">'
);

// We need to find the end of the Right Tools section, where the </header> closes.
// Actually, </header> is just `      </header>`. Let's just find that and replace it.
content = content.replace(
  '        {/* Main Content Area */}',
  `        </div>
        {/* Mobile Metrics Scroller */}
        <div className="lg:hidden w-full overflow-x-auto no-scrollbar border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-4 px-4 py-2 text-[11px] font-medium text-slate-600 dark:text-slate-300 w-max">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-slate-400">Today's Income:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">\${revenueStats.daily.toFixed(2)}</span>
            </div>
            <div className="w-px h-3 bg-slate-300 dark:bg-slate-700 shrink-0" />
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-slate-400">Total Cash:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">\${revenueStats.total.toFixed(2)}</span>
            </div>
            <div className="w-px h-3 bg-slate-300 dark:bg-slate-700 shrink-0" />
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-slate-400">Workspaces:</span>
              <span className="font-bold text-slate-900 dark:text-white">{companies.filter(c => !superAdminCompanyIds.has(c.companyId || c.id)).length}</span>
            </div>
            <div className="w-px h-3 bg-slate-300 dark:bg-slate-700 shrink-0" />
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-slate-400">Total Users:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{allUsers.filter(u => u.role !== 'super_admin').length}</span>
            </div>
          </div>
        </div>
      </header>
      {/* Main Content Area */}`
);

// wait, the `</header>` is before `      {/* Main Content Area */}`. We should replace `      </header>\n      {/* Main Content Area */}`
content = content.replace(
  '      </header>\n      {/* Main Content Area */}',
  '      </div>\n        {/* Mobile Metrics Scroller */}\n        <div className="lg:hidden w-full overflow-x-auto no-scrollbar border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50">\n          <div className="flex items-center gap-4 px-4 py-2 text-[11px] font-medium text-slate-600 dark:text-slate-300 w-max">\n            <div className="flex items-center gap-1.5 shrink-0">\n              <span className="text-slate-400">Today\'s Income:</span>\n              <span className="font-bold text-emerald-600 dark:text-emerald-400">${revenueStats.daily.toFixed(2)}</span>\n            </div>\n            <div className="w-px h-3 bg-slate-300 dark:bg-slate-700 shrink-0" />\n            <div className="flex items-center gap-1.5 shrink-0">\n              <span className="text-slate-400">Total Cash:</span>\n              <span className="font-bold text-emerald-600 dark:text-emerald-400">${revenueStats.total.toFixed(2)}</span>\n            </div>\n            <div className="w-px h-3 bg-slate-300 dark:bg-slate-700 shrink-0" />\n            <div className="flex items-center gap-1.5 shrink-0">\n              <span className="text-slate-400">Workspaces:</span>\n              <span className="font-bold text-slate-900 dark:text-white">{companies.filter(c => !superAdminCompanyIds.has(c.companyId || c.id)).length}</span>\n            </div>\n            <div className="w-px h-3 bg-slate-300 dark:bg-slate-700 shrink-0" />\n            <div className="flex items-center gap-1.5 shrink-0">\n              <span className="text-slate-400">Total Users:</span>\n              <span className="font-bold text-indigo-600 dark:text-indigo-400">{allUsers.filter(u => u.role !== \'super_admin\').length}</span>\n            </div>\n          </div>\n        </div>\n      </header>\n      {/* Main Content Area */}'
);

fs.writeFileSync('src/pages/SuperAdminDashboard.tsx', content);
console.log("Updated header for mobile");
