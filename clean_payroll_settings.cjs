const fs = require('fs');
let file = fs.readFileSync('src/components/PayrollVisibilitySettings.tsx', 'utf8');

file = file.replace(/glass-card p-4 sm:p-6 mb-8 space-y-6/g, 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 mb-8 rounded-2xl shadow-sm space-y-6');

fs.writeFileSync('src/components/PayrollVisibilitySettings.tsx', file);
