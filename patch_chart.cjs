const fs = require('fs');
let content = fs.readFileSync('src/pages/SuperAdminDashboard.tsx', 'utf-8');

content = content.replace(
`    } else if (timeRange === 'monthly') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonthIndex = now.getMonth();
      const currentYear = now.getFullYear();
      const result = [];
      for (let i = 5; i >= 0; i--) {`,
`    } else if (timeRange === 'monthly') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonthIndex = now.getMonth();
      const currentYear = now.getFullYear();
      const result = [];
      for (let i = 11; i >= 0; i--) {`);

fs.writeFileSync('src/pages/SuperAdminDashboard.tsx', content);
