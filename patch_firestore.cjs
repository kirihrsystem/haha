const fs = require('fs');
let code = fs.readFileSync('src/firebase/config.ts', 'utf8');

code = code.replace(
  "setLogLevel('error');",
  "setLogLevel('silent');"
);

fs.writeFileSync('src/firebase/config.ts', code);
