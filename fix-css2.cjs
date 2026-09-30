const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

const themeStart = code.indexOf('@theme {');
const themeEnd = code.indexOf('}', themeStart) + 1;

const newTheme = `@theme {
  --color-ice-100: #e0e7ff;
  --color-ice-200: #c7d2fe;
  --color-ice-300: #a5b4fc;
  --color-ice-400: #818cf8;
  --color-ice-500: #6366f1;
  --color-ice-600: #4f46e5;
  --color-neo-primary: #ffe17c;
  --color-neo-bg: #171e19;
  --color-neo-accent: #b7c6c2;
  --font-sans: "Satoshi", "Inter", "Kantumruy Pro", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Cabinet Grotesk", "Outfit", "Kantumruy Pro", ui-sans-serif, system-ui, sans-serif;
}`;

code = code.substring(0, themeStart) + newTheme + code.substring(themeEnd);

fs.writeFileSync('src/index.css', code);
