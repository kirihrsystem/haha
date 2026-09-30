const fs = require('fs');
let code = fs.readFileSync('src/components/SubscriptionManager.tsx', 'utf8');

code = code.replace(
  '{/* Bakong KHQR Payment Modal */}\n      <AnimatePresence>',
  '{/* Bakong KHQR Payment Modal */}\n      {createPortal(\n      <AnimatePresence>'
);

code = code.replace(
  '        )}\n      {/* Plan Extension Modal */}\n      <AnimatePresence>',
  '        )}\n      </AnimatePresence>,\n      document.body\n      )}\n      {/* Plan Extension Modal */}\n      {createPortal(\n      <AnimatePresence>'
);

code = code.replace(
  '        )}\n      </AnimatePresence>\n    </div>',
  '        )}\n      </AnimatePresence>,\n      document.body\n      )}\n    </div>'
);

fs.writeFileSync('src/components/SubscriptionManager.tsx', code);
