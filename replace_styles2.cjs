const fs = require('fs');
let file = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// Replace standard input fields
file = file.replace(/w-full px-4 py-3 glass-panel border border-white\/60 dark:border-slate-700\/50 rounded-\[1\.5rem\] focus:(?:ring-2 focus:ring-indigo-500\/50|outline-none) (?:outline-none )?transition-all shadow-inner font-medium(?: text-slate-800 dark:text-slate-200)?(?: appearance-none)?/g, 'w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200 shadow-sm');

// Replace any remaining long padded inputs
file = file.replace(/w-full px-4 py-3 border font-medium rounded-\[1\.5rem\] glass-panel border-white\/60 dark:border-slate-700\/50 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500\/50 transition-all text-slate-900 dark:text-white \[color-scheme:light\] dark:\[color-scheme:dark\]/g, 'w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200 shadow-sm');

// Smaller inputs
file = file.replace(/flex-1 min-w-0 px-3 py-2 border font-medium rounded-\[1\.25rem\] text-sm glass-panel border-white\/60 dark:border-slate-700\/50 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500\/50 transition-all disabled:opacity-50/g, 'flex-1 min-w-0 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all disabled:opacity-50 shadow-sm text-slate-800 dark:text-slate-200');

file = file.replace(/w-16 px-2 py-1\.5 border font-medium rounded-\[1rem\] text-sm glass-panel border-white\/60 dark:border-slate-700\/50 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500\/50 transition-all disabled:opacity-50 text-center/g, 'w-16 px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-center focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all disabled:opacity-50 shadow-sm text-slate-800 dark:text-slate-200');

fs.writeFileSync('src/pages/AdminDashboard.tsx', file);
