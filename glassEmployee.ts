import fs from 'fs';
import path from 'path';

function processFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove inline overrides on card-3d
  content = content.replace(/border border-gray-100 dark:border-gray-700 bg-white\/60 dark:bg-gray-800\/80 backdrop-blur-2xl/g, '');
  content = content.replace(/border border-gray-100 dark:border-gray-700 bg-white\/60 dark:bg-gray-800\/80 backdrop-blur-xl/g, '');

  content = content.replace(/bg-white\/10 dark:bg-gray-800\/20 backdrop-blur-2xl/g, 'bg-white/30 dark:bg-slate-900/30 backdrop-blur-3xl');

  // Generic backgrounds
  content = content.replace(/bg-gray-50/g, 'bg-white/40');
  content = content.replace(/bg-gray-100/g, 'bg-white/50');
  content = content.replace(/bg-gray-200/g, 'bg-white/60');
  content = content.replace(/bg-gray-300/g, 'bg-white/70');
  
  content = content.replace(/dark:bg-gray-800/g, 'dark:bg-slate-900/40 backdrop-blur-md');
  content = content.replace(/dark:bg-gray-900/g, 'dark:bg-slate-950/40 backdrop-blur-xl');
  content = content.replace(/dark:bg-gray-700/g, 'dark:bg-slate-800/50 backdrop-blur-sm');
  
  content = content.replace(/bg-blue-600/g, 'bg-indigo-500/90 dark:bg-indigo-600/90');
  content = content.replace(/bg-blue-700/g, 'bg-indigo-600/90 dark:bg-indigo-700/90');
  
  // Generic borders
  content = content.replace(/border-gray-100/g, 'border-white/50');
  content = content.replace(/border-gray-200/g, 'border-white/60');
  content = content.replace(/dark:border-gray-700/g, 'dark:border-slate-700/50');
  content = content.replace(/dark:border-gray-600/g, 'dark:border-slate-600/50');
  content = content.replace(/dark:border-gray-800/g, 'dark:border-slate-800/50');

  // Generic text
  content = content.replace(/text-gray-/g, 'text-slate-');
  content = content.replace(/dark:text-gray-/g, 'dark:text-slate-');

  // Generic corners
  content = content.replace(/rounded-xl/g, 'rounded-[1.5rem]');
  content = content.replace(/rounded-2xl/g, 'rounded-[2rem]');
  content = content.replace(/rounded-3xl/g, 'rounded-[2.5rem]');
  content = content.replace(/sm:rounded-3xl/g, 'sm:rounded-[2.5rem]');

  // Check modals and popups
  content = content.replace(/bg-white dark:bg-slate-950\/40 backdrop-blur-xl/g, 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl border border-white/50 dark:border-slate-700/50');

  fs.writeFileSync(filePath, content);
}

processFile('src/pages/EmployeeDashboard.tsx');
processFile('src/components/EmployeeHistory.tsx');
processFile('src/components/AdminStaff/StaffManager.tsx');
processFile('src/components/AdminSettings/SettingsManager.tsx');
processFile('src/pages/LeavesManager.tsx');
// others?
processFile('src/components/LiveBackground.tsx'); // keep it as is maybe?
processFile('src/App.tsx');
processFile('src/components/Layout.tsx');
processFile('src/pages/About.tsx');
processFile('src/pages/Login.tsx');

console.log("Upgraded all pages to iOS 26");
