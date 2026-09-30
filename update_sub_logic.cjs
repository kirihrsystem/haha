const fs = require('fs');

function replaceFile(path, regex, replacement) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(path, content);
}

replaceFile('src/components/SubscriptionManager.tsx',
  /lastPaymentHash: md5Hash \|\| \(`COUPON_PAID_\$\{pendingPaidCoupon\.code\}`\)/g,
  `lastPaymentHash: md5Hash || (\`COUPON_PAID_\${pendingPaidCoupon.code}\`),
        usedCode: pendingPaidCoupon.code`
);

replaceFile('src/components/SubscriptionManager.tsx',
  /lastPaymentHash: 'FREE_COUPON_' \+ code/g,
  `lastPaymentHash: 'FREE_COUPON_' + code,
            usedCode: code`
);

