const fs = require('fs');
let content = fs.readFileSync('src/pages/EmployeeDashboard.tsx', 'utf8');

content = content.replace(
  "const regularHours = baseHours === 0 ? 0 : Math.max(0, Math.min(baseHours, totalHours - overtimeHours));",
  "const regularHours = baseHours === 0 ? 0 : Math.max(0, Math.min(baseHours, totalHours - extraHours));"
);

content = content.replace(
  "const lateDeductionAmount = hasApprovedLateCheckin ? 0 : ((lateMinutes / 60) * (settings?.lateDeductionPerHour ?? (calculatedHourlyRate || 0)) || 0);",
  "const lateDeductionAmount = (hasApprovedLateCheckin || baseHours === 0) ? 0 : ((lateMinutes / 60) * (settings?.lateDeductionPerHour ?? (calculatedHourlyRate || 0)) || 0);"
);

fs.writeFileSync('src/pages/EmployeeDashboard.tsx', content);
