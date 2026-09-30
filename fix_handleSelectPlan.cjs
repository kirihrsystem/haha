const fs = require('fs');

function replaceFile(path, regex, replacement) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(path, content);
}

replaceFile('src/components/SubscriptionManager.tsx',
  /const handleSelectPlan = async \(plan: 'monthly' \| 'yearly'\) => {/g,
  `const handleSelectPlan = async (plan: 'monthly' | 'yearly') => {
    const currentSub = settings?.subscription;
    if (currentSub?.status === 'active' && currentSub?.expiresAt && new Date(currentSub.expiresAt) > new Date()) {
      if (!window.confirm('You currently have an active subscription. If you buy a new plan, your current plan will be removed and replaced by the new plan. Are you sure you want to proceed?')) {
        return;
      }
    }`
);

