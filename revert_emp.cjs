const fs = require('fs');
const file = 'src/pages/EmployeeDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /useEffect\(\(\) => \{\n\s*if \(showProfileSetup \|\| showLeaveModal \|\| showInstallGuide\) \{\n\s*document\.body\.style\.overflow = 'hidden';\n\s*\} else \{\n\s*document\.body\.style\.overflow = '';\n\s*\}\n\s*return \(\) => \{ document\.body\.style\.overflow = ''; \};\n\s*\}, \[showProfileSetup, showLeaveModal, showInstallGuide\]\);/,
  `useEffect(() => {
    if (showProfileSetup || showLeaveModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showProfileSetup, showLeaveModal]);`
);
fs.writeFileSync(file, content);
