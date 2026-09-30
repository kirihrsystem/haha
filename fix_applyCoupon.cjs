const fs = require('fs');

function replaceFile(path, regex, replacement) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(path, content);
}

replaceFile('src/components/SubscriptionManager.tsx',
  /const code = codeToApply\.toUpperCase\(\)\.trim\(\);/g,
  `const currentSub = settings?.subscription;
    if (currentSub?.status === 'active' && currentSub?.expiresAt && new Date(currentSub.expiresAt) > new Date()) {
      setCouponError("You currently have an active subscription. Please wait until it expires to use another coupon.");
      return;
    }

    const code = codeToApply.toUpperCase().trim();`
);

