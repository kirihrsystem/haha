const fs = require('fs');

function replaceFile(path, regex, replacement) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(path, content);
}

replaceFile('src/pages/AdminDashboard.tsx',
  /lateCheckIn,\s*earlyCheckIn,\s*earlyCheckOut,\s*extraTime,\s*dailySalary,\s*totalEarnings/g,
  "lateCheckIn,\n      earlyCheckIn,\n      earlyCheckOut,\n      extraTime,\n      lateMinutes,\n      dailySalary,\n      totalEarnings"
);
replaceFile('src/pages/AdminDashboard.tsx',
  /extraTime,\s*dailySalary,\s*lateDeduction/g,
  "extraTime,\n            lateMinutes,\n            dailySalary,\n            lateDeduction"
);

replaceFile('src/pages/EmployeeDashboard.tsx',
  /updates\.regularHours = regularHours;/g,
  "updates.regularHours = regularHours;\n        updates.lateMinutes = lateMinutes;"
);

