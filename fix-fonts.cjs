const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

css = css.replace(
  /--font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;/g, 
  '--font-sans: "Satoshi", "Inter", ui-sans-serif, system-ui, sans-serif;'
);

css = css.replace(
  /--font-display: "Instrument Serif", ui-serif, serif;/g, 
  '--font-display: "Cabinet Grotesk", "Instrument Serif", ui-serif, serif;'
);

css = css.replace(
  /@apply font-display font-normal text-primary-text;/g, 
  '@apply font-display font-extrabold text-primary-text;'
);

css = css.replace(
  /letter-spacing: -2.46px;/g, 
  'letter-spacing: -0.04em;'
);

css = css.replace(
  /line-height: 0.95;/g, 
  'line-height: 1.05;'
);

fs.writeFileSync('src/index.css', css);
