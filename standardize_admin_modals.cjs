const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const regex1 = /className="glass-panel border border-white\/50 dark:border-slate-700\/50 sm:rounded-\[2.5rem\] max-w-md w-full h-full sm:h-auto sm:max-h-\[90vh\] shadow-2xl relative flex flex-col overflow-hidden text-sm border border-slate-100 dark:border-slate-800"/g;
content = content.replace(regex1, 'className="bg-white dark:bg-slate-900 sm:glass-panel sm:border border-white/60 dark:border-slate-700/50 sm:rounded-[2.5rem] max-w-md w-full h-full sm:h-auto sm:max-h-[90vh] shadow-[0_0_100px_rgba(0,0,0,0.1)] dark:shadow-[0_0_100px_rgba(0,0,0,0.3)] relative flex flex-col overflow-hidden"');

const regex2 = /className="p-5 md:p-6 pb-4 border-b border-white\/40 dark:border-slate-700\/40 dark:border-slate-800 shrink-0"/g;
content = content.replace(regex2, 'className="p-5 sm:p-8 pb-4 sm:pb-5 border-b border-slate-100 dark:border-slate-800 sm:border-white/40 sm:dark:border-slate-700/40 shrink-0"');

// also replace the modal for "glass-panel border border-white/50 dark:border-slate-700/50 rounded-[2.5rem] p-6 md:p-8 max-w-md w-full shadow-2xl relative border border-slate-100 dark:border-slate-800" (Confirm dialog)
const regex3 = /className="glass-panel border border-white\/50 dark:border-slate-700\/50 rounded-\[2.5rem\] p-6 md:p-8 max-w-md w-full shadow-2xl relative border border-slate-100 dark:border-slate-800"/g;
content = content.replace(regex3, 'className="bg-white dark:bg-slate-900 sm:glass-panel sm:border border-white/60 dark:border-slate-700/50 sm:rounded-[2.5rem] max-w-md w-full shadow-[0_0_100px_rgba(0,0,0,0.1)] dark:shadow-[0_0_100px_rgba(0,0,0,0.3)] relative flex flex-col p-6 sm:p-8"');

// delete confirm dialog
const regex4 = /className="glass-panel border border-white\/60 dark:border-slate-700\/50 rounded-\[2.5rem\] p-6 md:p-8 max-w-sm w-full shadow-2xl relative"/g;
content = content.replace(regex4, 'className="bg-white dark:bg-slate-900 sm:glass-panel sm:border border-white/60 dark:border-slate-700/50 sm:rounded-[2.5rem] max-w-sm w-full shadow-[0_0_100px_rgba(0,0,0,0.1)] dark:shadow-[0_0_100px_rgba(0,0,0,0.3)] relative flex flex-col p-6 sm:p-8"');


fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
