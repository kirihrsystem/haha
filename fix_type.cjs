const fs = require('fs');
let content = fs.readFileSync('src/pages/SuperAdminDashboard.tsx', 'utf8');

content = content.replace(
  /\} else if \(c\.subscription\.type === 'yearly'\) \{/g,
  `} else if (c.subscription.type === 'yearly' || c.subscription.type?.endsWith('_yearly')) {`
);

fs.writeFileSync('src/pages/SuperAdminDashboard.tsx', content);
