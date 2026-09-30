const fs = require('fs');
let content = fs.readFileSync('src/pages/SuperAdminDashboard.tsx', 'utf-8');

content = content.replace(
`<div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                        <span>YoY Annual Growth</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">+34.2% YoY</span>
                      </div>`,
`<div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">Year-over-Year</span>
                        <span className={\`font-bold \${revenueStats.yoyGrowth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} flex items-center\`}>
                          {revenueStats.yoyGrowth >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                          {Math.abs(revenueStats.yoyGrowth)}%
                        </span>
                      </div>`
);

fs.writeFileSync('src/pages/SuperAdminDashboard.tsx', content);
