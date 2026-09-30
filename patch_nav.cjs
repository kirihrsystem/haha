const fs = require('fs');
let code = fs.readFileSync('src/pages/Landing.tsx', 'utf8');

code = code.replace('<a href="#faq" className="hover:text-black/60 transition-colors">{t.navFAQ}</a>', '<a href="#pricing" className="hover:text-black/60 transition-colors">{t.navPricing}</a>\n            <a href="#faq" className="hover:text-black/60 transition-colors">{t.navFAQ}</a>');
code = code.replace('<a href="#faq" className="hover:text-white transition-colors">{t.navFAQ}</a>', '<a href="#pricing" className="hover:text-white transition-colors">{t.navPricing}</a>\n            <a href="#faq" className="hover:text-white transition-colors">{t.navFAQ}</a>');

fs.writeFileSync('src/pages/Landing.tsx', code);
