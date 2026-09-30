const fs = require('fs');
let content = fs.readFileSync('src/pages/SuperAdminDashboard.tsx', 'utf8');

content = content.replace(
  /if \(price === undefined \|\| price === null\) \{\s*price = c\.subscription\.type === 'yearly' \? 0\.2 : \(c\.subscription\.type === 'monthly' \? 0\.1 : 0\);\s*\}/g,
  `if (price === undefined || price === null) {
           if (c.subscription.type === 'starter_monthly') price = 4.99;
           else if (c.subscription.type === 'starter_yearly') price = 47.99;
           else if (c.subscription.type === 'professional_monthly') price = 9.99;
           else if (c.subscription.type === 'professional_yearly') price = 95.99;
           else price = c.subscription.type === 'yearly' ? 0.2 : (c.subscription.type === 'monthly' ? 0.1 : 0);
        }`
);

content = content.replace(
  /if \(subPrice === undefined \|\| subPrice === null\) \{\s*subPrice = comp\.subscription\.type === 'yearly' \? 0\.2 : \(comp\.subscription\.type === 'monthly' \? 0\.1 : 0\);\s*\}/g,
  `if (subPrice === undefined || subPrice === null) {
             if (comp.subscription.type === 'starter_monthly') subPrice = 4.99;
             else if (comp.subscription.type === 'starter_yearly') subPrice = 47.99;
             else if (comp.subscription.type === 'professional_monthly') subPrice = 9.99;
             else if (comp.subscription.type === 'professional_yearly') subPrice = 95.99;
             else subPrice = comp.subscription.type === 'yearly' ? 0.2 : (comp.subscription.type === 'monthly' ? 0.1 : 0);
          }`
);

fs.writeFileSync('src/pages/SuperAdminDashboard.tsx', content);
