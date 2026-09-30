const fs = require('fs');
let content = fs.readFileSync('src/pages/SuperAdminDashboard.tsx', 'utf-8');

// I need to add an extra `</div>` right before `{/* Mobile Metrics Scroller */}`
// because the `Mobile Metrics Scroller` is preceded by `</div>` which closes `Right Tools`.

content = content.replace(
  '        </div>\n        {/* Mobile Metrics Scroller */}',
  '        </div>\n        </div>\n        {/* Mobile Metrics Scroller */}'
);

fs.writeFileSync('src/pages/SuperAdminDashboard.tsx', content);
console.log("Added missing closing div!");
