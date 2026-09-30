const fs = require('fs');
let content = fs.readFileSync('src/pages/SuperAdminDashboard.tsx', 'utf-8');

// Update Total Users display
content = content.replace(
  '<span className="font-bold text-indigo-600 dark:text-indigo-400">{allUsers.length}</span>',
  '<span className="font-bold text-indigo-600 dark:text-indigo-400">{allUsers.filter(u => u.role !== \'super_admin\').length}</span>'
);
content = content.replace(
  'All Users ({filteredUsers.length})',
  'All Users ({filteredUsers.filter(u => u.role !== \'super_admin\').length})'
);
content = content.replace(
  'Total Staff & Admins: {allUsers.length}',
  'Total Staff & Admins: {allUsers.filter(u => u.role !== \'super_admin\').length}'
);


fs.writeFileSync('src/pages/SuperAdminDashboard.tsx', content);
console.log("Replaced user counts");
