const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

content = content.replace(
  "const unpenalizedSalary = baseHours > 0 ? ((regularHours / baseHours) * dailySalaryBase) + otPayAmount : (regularHours * calculatedHourlyRate) + otPayAmount;",
  "const unpenalizedSalary = baseHours > 0 ? ((regularHours / baseHours) * dailySalaryBase) + otPayAmount : dailySalaryBase + otPayAmount;"
);

content = content.replace(
  "const lateDeductionAmount = (lateMinutes / 60) * (settings?.lateDeductionPerHour ?? (calculatedHourlyRate || 0)) || 0;",
  "const lateDeductionAmount = baseHours === 0 ? 0 : (lateMinutes / 60) * (settings?.lateDeductionPerHour ?? (calculatedHourlyRate || 0)) || 0;"
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
