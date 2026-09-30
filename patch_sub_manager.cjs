const fs = require('fs');
let code = fs.readFileSync('src/components/SubscriptionManager.tsx', 'utf8');

// Starter
code = code.replace(
  'Essential HR tools for small teams and startups.',
  'Perfect for small teams getting started with digital tracking.'
);
code = code.replace(
  '["Up to 10 Employees", "Time & Attendance", "Basic Reports", "Standard Support"]',
  '["Up to 10 employees", "Basic GPS check-in", "1 Workspace location", "Standard reporting"]'
);

// Professional
code = code.replace(
  'Advanced features for growing businesses.',
  'Everything you need to manage growing teams efficiently.'
);
code = code.replace(
  '["Up to 25 Employees", "Automated Payroll", "Advanced Analytics", "Telegram Bot", "Priority Support"]',
  '["Up to 25 employees", "Smart GPS & WiFi check-in", "Automated payroll calculation", "Telegram notifications", "Unlimited locations"]'
);

// Enterprise
code = code.replace(
  'Tailored solutions for large organizations.',
  'Advanced controls and support for large organizations.'
);
code = code.replace(
  '["Unlimited Employees", "Custom Integrations", "Dedicated Account Manager", "Custom SLAs", "On-Premises Options"]',
  '["Dedicated account manager", "Custom API integration", "Advanced role permissions", "White-glove onboarding"]'
);

fs.writeFileSync('src/components/SubscriptionManager.tsx', code);
