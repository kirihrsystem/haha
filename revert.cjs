const fs = require('fs');
const file = 'src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /useEffect\(\(\) => \{\n\s*const isModalOpen = showBonusModal \|\| fullQrUrl \|\| pdfConfigModalType \|\| showAbsentModal \|\| showModal \|\| staffToDelete \|\| showQRModal;\n\s*if \(isModalOpen\) \{\n\s*document\.body\.style\.overflow = "hidden";\n\s*\} else \{\n\s*document\.body\.style\.overflow = "";\n\s*\}\n\s*return \(\) => \{\n\s*document\.body\.style\.overflow = "";\n\s*\};\n\s*\}, \[showBonusModal, fullQrUrl, pdfConfigModalType, showAbsentModal, showModal, staffToDelete, showQRModal\]\);/,
  `useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showModal]);`
);
fs.writeFileSync(file, content);
