const fs = require('fs');
let content = fs.readFileSync('src/pages/SuperAdminDashboard.tsx', 'utf-8');

// The incorrect insertion we did before Main Content Area:
const incorrectInsertion = `        </div>
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
      {/* Main Content Area */}`;

// Also there is another one:
const incorrectInsertion2 = `      </div>
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
      {/* Main Content Area */}`;

if (content.includes(incorrectInsertion)) {
  content = content.replace(incorrectInsertion, '        {/* Main Content Area */}');
  console.log("Reverted first incorrect insertion");
}
if (content.includes(incorrectInsertion2)) {
  content = content.replace(incorrectInsertion2, '      {/* Main Content Area */}');
  console.log("Reverted second incorrect insertion");
}

// Now inject correctly at the original `</header>` location
const properInsertion = `        </div>
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
      {/* Main Body Section`;

content = content.replace(
  '      </header>\n      {/* Main Body Section',
  properInsertion
);

fs.writeFileSync('src/pages/SuperAdminDashboard.tsx', content);
console.log("Injected correctly at line 929");
