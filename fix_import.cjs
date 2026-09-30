const fs = require('fs');
let content = fs.readFileSync('src/utils/shiftUtils.ts', 'utf8');

content = content.replace('import { differenceInMinutes, getDaysInMonth } from "date-fns";', 'import { differenceInMinutes, getDaysInMonth, format } from "date-fns";');
content = content.replace('import { format } from "date-fns";\n', '');

fs.writeFileSync('src/utils/shiftUtils.ts', content);
