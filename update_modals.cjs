const fs = require('fs');

function updateEmployeeDashboard() {
  let content = fs.readFileSync('src/pages/EmployeeDashboard.tsx', 'utf8');

  // Complete Profile modal
  content = content.replace(
    /className="fixed inset-0 bg-slate-900\/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-\[9999\]"/g,
    'className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-4 bg-white dark:bg-slate-950 sm:bg-slate-50/80 sm:backdrop-blur-sm sm:dark:bg-slate-950/80 transition-all duration-300 overflow-hidden"'
  );
  content = content.replace(
    /className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 max-w-lg w-full shadow-2xl relative max-h-\[90vh\] overflow-y-auto scrollbar-none"/g,
    'className="bg-white dark:bg-slate-900 sm:glass-panel sm:border border-white/60 dark:border-slate-700/50 sm:rounded-[2.5rem] max-w-lg w-full h-full sm:h-auto sm:max-h-[90vh] shadow-[0_0_100px_rgba(0,0,0,0.1)] dark:shadow-[0_0_100px_rgba(0,0,0,0.3)] relative flex flex-col overflow-hidden"'
  );

  // Leave Request modal (1270)
  content = content.replace(
    /className="fixed inset-0 bg-black\/50 flex items-end sm:items-center justify-center p-4 z-50"/g,
    'className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-4 bg-white dark:bg-slate-950 sm:bg-slate-50/80 sm:backdrop-blur-sm sm:dark:bg-slate-950/80 transition-all duration-300 overflow-hidden"'
  );
  content = content.replace(
    /className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl relative max-h-\[90vh\] overflow-y-auto scrollbar-none"/g,
    'className="bg-white dark:bg-slate-900 sm:glass-panel sm:border border-white/60 dark:border-slate-700/50 sm:rounded-[2.5rem] max-w-md w-full h-full sm:h-auto sm:max-h-[90vh] shadow-[0_0_100px_rgba(0,0,0,0.1)] dark:shadow-[0_0_100px_rgba(0,0,0,0.3)] relative flex flex-col overflow-hidden"'
  );

  // View Log Modal (1094)
  content = content.replace(
    /className="fixed inset-0 bg-black\/50 flex items-center justify-center p-4 z-50"/g,
    'className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-4 bg-white dark:bg-slate-950 sm:bg-slate-50/80 sm:backdrop-blur-sm sm:dark:bg-slate-950/80 transition-all duration-300 overflow-hidden"'
  );
  content = content.replace(
    /className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full relative shadow-2xl"/g,
    'className="bg-white dark:bg-slate-900 sm:glass-panel sm:border border-white/60 dark:border-slate-700/50 sm:rounded-[2.5rem] max-w-sm w-full h-full sm:h-auto sm:max-h-[90vh] shadow-[0_0_100px_rgba(0,0,0,0.1)] dark:shadow-[0_0_100px_rgba(0,0,0,0.3)] relative flex flex-col overflow-hidden"'
  );

  fs.writeFileSync('src/pages/EmployeeDashboard.tsx', content);
}

function updateAdminDashboard() {
  let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

  // We should find the exact pattern and replace it
  // Actually, some modals in AdminDashboard also use a different style, like the Leave Modal, Payroll Modal, Log Edit Modal

  // Replace common fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950
  content = content.replace(
    /className="fixed inset-0 z-50 flex sm:items-center justify-center sm:p-4 bg-slate-50 dark:bg-slate-950"/g,
    'className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-4 bg-white dark:bg-slate-950 sm:bg-slate-50/80 sm:backdrop-blur-sm sm:dark:bg-slate-950/80 transition-all duration-300 overflow-hidden"'
  );
  // Modal inner
  content = content.replace(
    /className="bg-white dark:bg-slate-900 w-full h-full sm:h-auto max-w-md sm:rounded-3xl flex flex-col shadow-2xl relative overflow-hidden"/g,
    'className="bg-white dark:bg-slate-900 sm:glass-panel sm:border border-white/60 dark:border-slate-700/50 sm:rounded-[2.5rem] max-w-md w-full h-full sm:h-auto sm:max-h-[90vh] shadow-[0_0_100px_rgba(0,0,0,0.1)] dark:shadow-[0_0_100px_rgba(0,0,0,0.3)] relative flex flex-col overflow-hidden"'
  );
  content = content.replace(
    /className="bg-white dark:bg-slate-900 w-full h-full sm:h-auto max-w-2xl sm:rounded-[2.5rem] flex flex-col shadow-2xl overflow-hidden"/g,
    'className="bg-white dark:bg-slate-900 sm:glass-panel sm:border border-white/60 dark:border-slate-700/50 sm:rounded-[2.5rem] max-w-2xl w-full h-full sm:h-auto sm:max-h-[90vh] shadow-[0_0_100px_rgba(0,0,0,0.1)] dark:shadow-[0_0_100px_rgba(0,0,0,0.3)] relative flex flex-col overflow-hidden"'
  );
  content = content.replace(
    /className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl relative overflow-hidden"/g,
    'className="bg-white dark:bg-slate-900 sm:glass-panel sm:border border-white/60 dark:border-slate-700/50 sm:rounded-[2.5rem] max-w-md w-full h-full sm:h-auto sm:max-h-[90vh] shadow-[0_0_100px_rgba(0,0,0,0.1)] dark:shadow-[0_0_100px_rgba(0,0,0,0.3)] relative flex flex-col overflow-hidden"'
  );

  // Leave Modal
  content = content.replace(
    /className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900\/60 backdrop-blur-md"/g,
    'className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-4 bg-white dark:bg-slate-950 sm:bg-slate-50/80 sm:backdrop-blur-sm sm:dark:bg-slate-950/80 transition-all duration-300 overflow-hidden"'
  );
  content = content.replace(
    /className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"/g,
    'className="bg-white dark:bg-slate-900 sm:glass-panel sm:border border-white/60 dark:border-slate-700/50 sm:rounded-[2.5rem] max-w-md w-full h-full sm:h-auto sm:max-h-[90vh] shadow-[0_0_100px_rgba(0,0,0,0.1)] dark:shadow-[0_0_100px_rgba(0,0,0,0.3)] relative flex flex-col overflow-hidden"'
  );

  // Delete modal
  content = content.replace(
    /className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-100\/60 dark:bg-slate-950\/60 backdrop-blur-md transition-all"/g,
    'className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-4 bg-white dark:bg-slate-950 sm:bg-slate-50/80 sm:backdrop-blur-sm sm:dark:bg-slate-950/80 transition-all duration-300 overflow-hidden"'
  );
  content = content.replace(
    /className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 scale-100 opacity-100"/g,
    'className="bg-white dark:bg-slate-900 sm:glass-panel sm:border border-white/60 dark:border-slate-700/50 sm:rounded-[2.5rem] max-w-sm w-full h-full sm:h-auto sm:max-h-[90vh] shadow-[0_0_100px_rgba(0,0,0,0.1)] dark:shadow-[0_0_100px_rgba(0,0,0,0.3)] relative flex flex-col overflow-hidden"'
  );

  fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
}

updateEmployeeDashboard();
updateAdminDashboard();

