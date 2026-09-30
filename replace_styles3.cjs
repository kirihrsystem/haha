const fs = require('fs');
let file = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// Modals wrappers
file = file.replace(/sm:glass-panel sm:border border-white\/60 dark:border-slate-700\/50 sm:rounded-\[2\.5rem\]/g, 'sm:border border-slate-200 dark:border-slate-800 sm:rounded-2xl shadow-xl');

// Inputs inside modals
file = file.replace(/w-full px-4 py-2\.5 border font-medium rounded-2xl glass-panel border-white\/60 dark:border-slate-700\/50 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500\/50 transition-all text-slate-900 dark:text-white \[color-scheme:light\] dark:\[color-scheme:dark\]/g, 'w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-800 dark:text-slate-200');

// other generic glass-panel border border-white/50 dark:border-slate-700/50 p-3 rounded-[1.25rem] border border-white/40 dark:border-slate-700/40 dark:border-slate-700/50
file = file.replace(/glass-panel border border-white\/50 dark:border-slate-700\/50 p-3 rounded-\[1\.25rem\] border border-white\/40 dark:border-slate-700\/40 dark:border-slate-700\/50/g, 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-sm');

// glass-panel border border-white/50 dark:border-slate-700/50 p-4 rounded-[2rem]
file = file.replace(/glass-panel border border-white\/50 dark:border-slate-700\/50 p-4 rounded-\[2rem\]/g, 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm');

// Other buttons like: flex-1 p-3 px-4 font-semibold rounded-[2rem] glass-panel border border-white/60 dark:border-slate-700 hover:bg-white/80 dark:hover:bg-slate-700/50 transition-all shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_4px_15px_rgb(0,0,0,0.05)] text-slate-700 dark:text-slate-200
file = file.replace(/flex-1 p-3 px-4 font-semibold rounded-\[2rem\] glass-panel border border-white\/60 dark:border-slate-700 hover:bg-white\/80 dark:hover:bg-slate-700\/50 transition-all shadow-\[.*?\] hover:shadow-\[.*?\] text-slate-700 dark:text-slate-200/g, 'flex-1 py-2.5 px-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm');

file = file.replace(/flex-1 py-3\.5 px-4 font-semibold rounded-\[2rem\] bg-slate-100 dark:bg-slate-800 sm:glass-panel sm:border border-white\/60 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-slate-700 dark:text-slate-200 text-sm/g, 'flex-1 py-2.5 px-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm text-sm');

file = file.replace(/w-full p-3 border rounded-\[2rem\] glass-panel border hover:border-blue-300 dark:border-slate-700\/50 dark:hover:border-blue-700\/50 transition-colors outline-none/g, 'w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-colors shadow-sm');

file = file.replace(/w-full text-lg p-3 border rounded-\[2rem\] glass-panel border hover:border-blue-300 dark:border-slate-700\/50 dark:hover:border-blue-700\/50 transition-colors outline-none/g, 'w-full text-lg p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/50 outline-none transition-colors shadow-sm');

fs.writeFileSync('src/pages/AdminDashboard.tsx', file);
