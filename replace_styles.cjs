const fs = require('fs');

let file = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// The SettingsManager starts around line 3891 and ends around 4900
// We will target the classes specifically.

file = file.replace(/glass-card p-4 sm:p-6 mb-8 space-y-6/g, 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 mb-6 shadow-sm space-y-6');

file = file.replace(/w-full px-4 py-3 glass-panel border border-white\/60 dark:border-slate-700\/50 rounded-\[1\.5rem\] focus:(outline-none )?focus:ring-2 focus:ring-indigo-500\/50( outline-none)? transition-all shadow-inner font-medium( text-slate-800 dark:text-slate-200)?( appearance-none)?/g, 'w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200 shadow-sm');

file = file.replace(/glass-panel border border-dashed border-indigo-200 dark:border-slate-700\/50 rounded-\[1\.5rem\] font-bold text-lg text-indigo-600 dark:text-indigo-400 bg-indigo-50\/20 dark:bg-indigo-500\/5 select-all/g, 'bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl font-mono text-lg text-slate-800 dark:text-slate-200 select-all');

file = file.replace(/glass-panel border border-indigo-200 dark:border-indigo-900\/50 rounded-\[1\.5rem\] font-bold text-sm text-indigo-600 dark:text-indigo-400 bg-indigo-50\/40 dark:bg-indigo-950\/20 truncate flex items-center justify-between/g, 'bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-sm text-slate-800 dark:text-slate-200 truncate flex items-center justify-between shadow-sm');

file = file.replace(/glass-panel border rounded-\[1\.5rem\] px-4 py-3 shadow-inner/g, 'bg-white dark:bg-slate-950 border rounded-xl px-4 py-2.5 shadow-sm');

file = file.replace(/w-20 h-20 rounded-\[1\.25rem\] border border-white\/60 dark:border-slate-700\/50 p-2 flex items-center justify-center glass-panel shrink-0 shadow-inner overflow-hidden/g, 'w-20 h-20 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-2 flex items-center justify-center shrink-0 shadow-sm overflow-hidden');

fs.writeFileSync('src/pages/AdminDashboard.tsx', file);
