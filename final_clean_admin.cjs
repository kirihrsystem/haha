const fs = require('fs');
let file = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

file = file.replace(/sm:glass-panel sm:border border-white\/60 dark:border-slate-700\/50 sm:rounded-\[2\.5rem\]/g, 'sm:border border-slate-200 dark:border-slate-800 sm:rounded-2xl shadow-xl');
file = file.replace(/sm:glass-panel sm:border border-white\/60 dark:border-slate-700\/50 sm:rounded-\[2rem\]/g, 'sm:border border-slate-200 dark:border-slate-800 sm:rounded-2xl shadow-xl');
file = file.replace(/glass-panel border border-white\/50 dark:border-slate-700\/50 rounded-\[2\.5rem\]/g, 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl');

file = file.replace(/glass-panel border border-white\/50 dark:border-slate-700\/50 p-3 rounded-\[1\.25rem\] border border-white\/40 dark:border-slate-700\/40 dark:border-slate-700\/50/g, 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-sm');
file = file.replace(/glass-panel p-4 rounded-\[1\.25rem\]/g, 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm');
file = file.replace(/glass-panel p-5 rounded-\[1\.25rem\]/g, 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm');

// some remaining input replacements
file = file.replace(/w-full px-4 py-3 border font-medium rounded-\[1\.5rem\] glass-panel border-white\/60 dark:border-slate-700\/50 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500\/50 transition-all text-slate-900 dark:text-white \[color-scheme:light\] dark:\[color-scheme:dark\]/g, 'w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200 shadow-sm');

file = file.replace(/w-full px-4 py-2\.5 border font-medium rounded-2xl glass-panel border-white\/60 dark:border-slate-700\/50 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500\/50 transition-all text-slate-900 dark:text-white \[color-scheme:light\] dark:\[color-scheme:dark\]/g, 'w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200 shadow-sm');

// some more remaining input replacements
file = file.replace(/px-4 py-2 font-semibold rounded-\[2rem\] glass-panel border border-white\/60 dark:border-slate-700 hover:bg-white\/80 dark:hover:bg-slate-700\/50 transition-all shadow-\[.*?\] hover:shadow-\[.*?\] text-slate-700 dark:text-slate-200/g, 'px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm');

file = file.replace(/w-full pl-9 pr-3 py-2 border rounded-\[1\.25rem\] dark:border-slate-700\/50 glass-panel border border-white\/50 dark:border-slate-700\/50 text-sm focus:outline-none focus:ring-2 focus:ring-ice-500/g, 'w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all shadow-sm text-slate-800 dark:text-slate-200');

file = file.replace(/p-2 border rounded-\[1\.25rem\] dark:border-slate-700\/50 glass-panel border border-white\/50 dark:border-slate-700\/50 text-sm flex-1 md:flex-none focus:outline-none focus:ring-2 focus:ring-ice-500/g, 'p-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm flex-1 md:flex-none focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all shadow-sm text-slate-800 dark:text-slate-200');

file = file.replace(/flex flex-col glass-panel border border-white\/50 dark:border-slate-700\/50 p-3 rounded-\[1\.25rem\] border dark:border-slate-700\/50 gap-3/g, 'flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-sm gap-3');

file = file.replace(/font-semibold text-lg p-3 glass-panel rounded-\[1\.25rem\]/g, 'font-semibold text-lg p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl');
file = file.replace(/font-semibold p-3 glass-panel rounded-\[1\.25rem\]/g, 'font-semibold p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl');

fs.writeFileSync('src/pages/AdminDashboard.tsx', file);
