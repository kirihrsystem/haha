const fs = require('fs');

function replaceFile(path, regex, replacement) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(path, content);
}

replaceFile('src/components/SubscriptionManager.tsx',
  /const \[isScannerOpen, setIsScannerOpen\] = useState\(false\);/g,
  `const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  // Extension Modal state
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<'monthly' | 'yearly' | null>(null);`
);

replaceFile('src/components/SubscriptionManager.tsx',
  /const handleSelectPlan = async \(plan: 'monthly' \| 'yearly'\) => {\s*const currentSub = settings\?\.subscription;\s*if \(currentSub\?\.status === 'active' && currentSub\?\.expiresAt && new Date\(currentSub\.expiresAt\) > new Date\(\)\) {\s*if \(\!window\.confirm\('You currently have an active subscription\. If you buy a new plan, your current plan will be removed and replaced by the new plan\. Are you sure you want to proceed\?'\)\) {\s*return;\s*}\s*}/g,
  `const handleSelectPlan = async (plan: 'monthly' | 'yearly') => {
    const currentSub = settings?.subscription;
    if (currentSub?.status === 'active' && currentSub?.expiresAt && new Date(currentSub.expiresAt) > new Date()) {
      setPendingPlan(plan);
      setShowExtensionModal(true);
      return;
    }
    await processPlanSelection(plan);
  };

  const processPlanSelection = async (plan: 'monthly' | 'yearly') => {`
);

