const fs = require('fs');

const data = `
  const getChartData = () => {
    if (timeRange === 'daily') {
      return [
        { name: 'Mon', revenue: 120, active: 400 },
        { name: 'Tue', revenue: 180, active: 450 },
        { name: 'Wed', revenue: 250, active: 500 },
        { name: 'Thu', revenue: 150, active: 480 },
        { name: 'Fri', revenue: 300, active: 600 },
        { name: 'Sat', revenue: 350, active: 650 },
        { name: 'Sun', revenue: 200, active: 550 },
      ];
    } else if (timeRange === 'monthly') {
      return [
        { name: 'Jan', revenue: 1200, active: 4000 },
        { name: 'Feb', revenue: 1800, active: 4500 },
        { name: 'Mar', revenue: 2500, active: 5000 },
        { name: 'Apr', revenue: 1500, active: 4800 },
        { name: 'May', revenue: 3000, active: 6000 },
        { name: 'Jun', revenue: 3500, active: 6500 },
      ];
    } else {
      return [
        { name: '2021', revenue: 12000, active: 40000 },
        { name: '2022', revenue: 18000, active: 45000 },
        { name: '2023', revenue: 25000, active: 50000 },
        { name: '2024', revenue: 15000, active: 48000 },
        { name: '2025', revenue: 30000, active: 60000 },
        { name: '2026', revenue: 35000, active: 65000 },
      ];
    }
  };
`;

let content = fs.readFileSync('src/pages/SuperAdminDashboard.tsx', 'utf8');
content = content.replace(
  'const totalRevenue = coupons.reduce((sum, c) => sum + ((c.price || 0) * (c.usedCount || 0)), 0);',
  'const totalRevenue = coupons.reduce((sum, c) => sum + ((c.price || 0) * (c.usedCount || 0)), 0);\n' + data
);
fs.writeFileSync('src/pages/SuperAdminDashboard.tsx', content);
