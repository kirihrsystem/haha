const fs = require('fs');
let code = fs.readFileSync('src/components/SubscriptionManager.tsx', 'utf8');

code = code.replace(
  '>Professional</h4>',
  '>Pro</h4>'
);
code = code.replace(
  'Select Professional',
  'Select Pro'
);
code = code.replace(
  "name: 'Professional Plan (Monthly)'",
  "name: 'Pro Plan (Monthly)'"
);
code = code.replace(
  "name: 'Professional Plan (Yearly)'",
  "name: 'Pro Plan (Yearly)'"
);
code = code.replace(
  "'Professional Monthly'",
  "'Pro Monthly'"
);
code = code.replace(
  "'Professional Yearly'",
  "'Pro Yearly'"
);

fs.writeFileSync('src/components/SubscriptionManager.tsx', code);
