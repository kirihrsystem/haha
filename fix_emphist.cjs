const fs = require('fs');
let content = fs.readFileSync('src/components/EmployeeHistory.tsx', 'utf8');

content = content.replace('import { getExpectedShiftDuration, calculateOvertimePay, getCalculatedHourlyRate } from "../utils/shiftUtils";', 'import { getExpectedShiftDuration, calculateOvertimePay, getCalculatedHourlyRate, hasShiftEnded } from "../utils/shiftUtils";');

const oldLine = 'const isPastOrToday = new Date(`${dateStr}T23:59:59`) <= new Date() || dateStr === format(new Date(), "yyyy-MM-dd");';
const newLine = 'const isPastOrToday = hasShiftEnded(dateStr, user?.shiftStart, user?.shiftEnd, (user as any)?.shiftOverrides, user?.shift2Start, user?.shift2End);';

content = content.replace(oldLine, newLine);

fs.writeFileSync('src/components/EmployeeHistory.tsx', content);
