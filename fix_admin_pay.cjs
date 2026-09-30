const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

// Line 745
content = content.replace(
  "const regularHours = baseHours === 0 ? 0 : Math.max(0, Math.min(baseHours, durationHours - overtimeHours));",
  "const regularHours = baseHours === 0 ? 0 : Math.max(0, Math.min(baseHours, durationHours - extraHours));"
);

// Line 753
content = content.replace(
  "const unpenalizedSalary = baseHours > 0 ? ((regularHours / baseHours) * dailySalaryBase) + otPayAmount : (regularHours * calculatedHourlyRate) + otPayAmount;",
  "const unpenalizedSalary = baseHours > 0 ? ((regularHours / baseHours) * dailySalaryBase) + otPayAmount : dailySalaryBase + otPayAmount;"
);

// Line 755
content = content.replace(
  "lateDeductionAmount = (lateMinutes / 60) * (settings?.lateDeductionPerHour ?? (calculatedHourlyRate || 0)) || 0;",
  "lateDeductionAmount = baseHours === 0 ? 0 : (lateMinutes / 60) * (settings?.lateDeductionPerHour ?? (calculatedHourlyRate || 0)) || 0;"
);

// Line 3496 (now around 3497)
content = content.replace(
  "const regularHours = baseHours === 0 ? 0 : Math.max(0, Math.min(baseHours, durationHours - overtimeHours));",
  "const regularHours = baseHours === 0 ? 0 : Math.max(0, Math.min(baseHours, durationHours - extraHours));"
);

// We need to check line 3500+ for unpenalizedSalary and lateDeductionAmount
fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
