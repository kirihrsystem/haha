const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');
if (!html.includes('Kantumruy+Pro')) {
  html = html.replace(
    '<link href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,700,800,900&f[]=satoshi@400,500,700,900&display=swap" rel="stylesheet">',
    '<link href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,700,800,900&f[]=satoshi@400,500,700,900&display=swap" rel="stylesheet">\n    <link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;500;600;700&display=swap" rel="stylesheet">'
  );
  fs.writeFileSync('index.html', html);
}

let css = fs.readFileSync('src/index.css', 'utf8');
css = css.replace(
  /--font-sans: "Satoshi", "Inter", ui-sans-serif, system-ui, sans-serif;/g, 
  '--font-sans: "Satoshi", "Kantumruy Pro", "Inter", ui-sans-serif, system-ui, sans-serif;'
);
css = css.replace(
  /--font-display: "Cabinet Grotesk", "Instrument Serif", ui-serif, serif;/g, 
  '--font-display: "Cabinet Grotesk", "Kantumruy Pro", "Instrument Serif", ui-serif, serif;'
);
fs.writeFileSync('src/index.css', css);
