const fs = require('fs');
let content = fs.readFileSync('src/pages/SuperAdminDashboard.tsx', 'utf-8');

const chunkToRemove = `        </div>
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
        </div>`;

content = content.replace(chunkToRemove + '\n', '');

const headerReplacement = `        </div>
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
      </header>`;

content = content.replace('        </div>\n      </header>', headerReplacement);

fs.writeFileSync('src/pages/SuperAdminDashboard.tsx', content);
console.log("Fixed!");
