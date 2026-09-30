const fs = require('fs');
let code = fs.readFileSync('src/pages/Landing.tsx', 'utf8');

code = code.replace('    navPricing: "Pricing",\n    pricingTag: "Clear Pricing",', '    pricingTag: "Clear Pricing",');
code = code.replace('    navPricing: "តម្លៃ",\n    pricingTag: "តម្លៃច្បាស់លាស់",', '    pricingTag: "តម្លៃច្បាស់លាស់",');

fs.writeFileSync('src/pages/Landing.tsx', code);
