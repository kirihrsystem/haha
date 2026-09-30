const fs = require('fs');
const file = 'src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /useEffect\(\(\) => \{\n\s*if \(showModal\) \{\n\s*document\.body\.style\.overflow = 'hidden';\n\s*\} else \{\n\s*document\.body\.style\.overflow = '';\n\s*\}\n\s*return \(\) => \{ document\.body\.style\.overflow = ''; \};\n\s*\}, \[showModal\]\);/,
  ""
);

fs.writeFileSync(file, content);
