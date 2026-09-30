const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

content = content.replace('import { calculateShiftStatus, calculateShiftHours, getCalculatedHourlyRate, calculateOvertimePay, getExpectedShiftDuration } from "../utils/shiftUtils";', 'import { calculateShiftStatus, calculateShiftHours, getCalculatedHourlyRate, calculateOvertimePay, getExpectedShiftDuration, hasShiftEnded } from "../utils/shiftUtils";');

const oldLine = 'const isPastOrToday = new Date(`${dateStr}T23:59:59`) <= new Date() || dateStr === format(new Date(), "yyyy-MM-dd");';
const newLine = 'const isPastOrToday = hasShiftEnded(dateStr, employee.shiftStart, employee.shiftEnd, employee.shiftOverrides, employee.shift2Start, employee.shift2End);';

content = content.replace(oldLine, newLine);

fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
