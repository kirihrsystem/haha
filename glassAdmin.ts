import fs from 'fs';
import path from 'path';

let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// Replace card-3d with glass panel
content = content.replace(/className="card-3d /g, 'className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/60 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] ');

// Tab container
content = content.replace(/bg-white dark:bg-gray-800 rounded-\[1\.75rem\] shadow-\[inset_0_1px_1px_rgba\(255,255,255,0\.6\),_0_8px_16px_rgba\(0,0,0,0\.05\)\] border border-gray-200\/60 dark:border-gray-700/g, 'bg-white/30 dark:bg-slate-900/30 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-white/60 dark:border-slate-700/50');

// Confirm Dialog / modals
content = content.replace(/bg-white dark:bg-slate-900/g, 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl border border-white/50 dark:border-slate-700/50');
content = content.replace(/bg-white dark:bg-gray-900/g, 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl border border-white/50 dark:border-slate-700/50');

// Inner containers, like bg-gray-50 dark:bg-gray-800
content = content.replace(/bg-gray-50 dark:bg-gray-800/g, 'bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-white/50 dark:border-slate-700/50');

// Search input
content = content.replace(/dark:bg-gray-900 text-sm/g, 'bg-white/50 dark:bg-slate-900/50 backdrop-blur-md text-sm');
content = content.replace(/bg-white dark:bg-gray-900 text-sm/g, 'bg-white/50 dark:bg-slate-900/50 backdrop-blur-md text-sm');

// More inputs
content = content.replace(/dark:bg-gray-900 dark:border-gray-700/g, 'bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border hover:border-blue-300 dark:border-slate-700/50 dark:hover:border-blue-700/50 transition-colors');

// bg-gray-100 or bg-gray-200
content = content.replace(/bg-gray-100/g, 'bg-white/40');
content = content.replace(/bg-gray-200/g, 'bg-white/60');

// Table borders and standard borders
content = content.replace(/border-gray-100/g, 'border-white/40 dark:border-slate-700/40');
content = content.replace(/border-gray-200/g, 'border-white/50 dark:border-slate-700/50');
content = content.replace(/border-gray-300/g, 'border-white/60 dark:border-slate-600/50');
content = content.replace(/border-gray-700/g, 'border-slate-700/50 dark:border-slate-700/50');

// Buttons bg-gray-50 -> bg-white/40
content = content.replace(/bg-gray-50 dark:bg-gray-900/g, 'bg-white/40 dark:bg-slate-900/40 backdrop-blur-md');
content = content.replace(/bg-gray-50 /g, 'bg-white/40 dark:bg-slate-800/40 backdrop-blur-md ');

// Generic text color fixes
content = content.replace(/text-gray-900/g, 'text-slate-900');
content = content.replace(/text-gray-800/g, 'text-slate-800');
content = content.replace(/text-gray-700/g, 'text-slate-700');
content = content.replace(/text-gray-600/g, 'text-slate-600');
content = content.replace(/text-gray-500/g, 'text-slate-500');
content = content.replace(/text-gray-400/g, 'text-slate-400');
content = content.replace(/dark:text-gray-300/g, 'dark:text-slate-300');
content = content.replace(/dark:text-gray-400/g, 'dark:text-slate-400');
content = content.replace(/dark:text-gray-200/g, 'dark:text-slate-200');

// Squircles -> rounded-[2.5rem] for outer, rounded-[1.75rem] or rounded-[2rem] for inner
content = content.replace(/rounded-3xl/g, 'rounded-[2.5rem]');
content = content.replace(/sm:rounded-3xl/g, 'sm:rounded-[2.5rem]');
content = content.replace(/rounded-\[1\.5rem\]/g, 'rounded-[2rem]');

// btn-3d-secondary
content = content.replace(/btn-3d-secondary/g, 'rounded-[2rem] bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-white/60 dark:border-slate-700 hover:bg-white/80 dark:hover:bg-slate-700/50 transition-all shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_4px_15px_rgb(0,0,0,0.05)] text-slate-700 dark:text-slate-200');

// btn-3d-primary
content = content.replace(/btn-3d-primary/g, 'rounded-[2rem] bg-indigo-500/90 dark:bg-indigo-600/90 backdrop-blur-xl border border-white/20 dark:border-white/10 hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all shadow-[0_2px_15px_rgb(99,102,241,0.3)] hover:shadow-[0_4px_20px_rgb(99,102,241,0.4)] text-white');


fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
console.log('Done upgrading AdminDashboard to iOS 26');
