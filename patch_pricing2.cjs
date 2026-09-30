const fs = require('fs');
let code = fs.readFileSync('src/pages/Landing.tsx', 'utf8');

code = code.replace(
  'price: "$0",',
  'price: "$4.99",'
);
code = code.replace(
  'price: "$10",',
  'price: "$9.99",'
);

fs.writeFileSync('src/pages/Landing.tsx', code);
