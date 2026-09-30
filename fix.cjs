const fs = require('fs');
const file = 'src/components/RevenueTracker.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "      ), document.body)}",
  "      , document.body)}"
);

fs.writeFileSync(file, content);
console.log('Fixed syntax error');
