const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

code = code.replace(/--font-display:[\s\S]*?"Outfit", "Kantumruy Pro", ui-sans-serif, system-ui, sans-serif;/g, '--font-display: "Cabinet Grotesk", "Outfit", "Kantumruy Pro", ui-sans-serif, system-ui, sans-serif;');

fs.writeFileSync('src/index.css', code);
