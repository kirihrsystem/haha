const fs = require('fs');

function replaceFile(path, regex, replacement) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(path, content);
}

replaceFile('src/pages/AdminDashboard.tsx',
  /Math\.round\(log\.lateMinutes % 60\)\}m\)/g,
  "Math.round(log.lateMinutes % 60)}mn)"
);

replaceFile('src/components/EmployeeHistory.tsx',
  /Math\.round\(log\.lateMinutes % 60\)\}m\)/g,
  "Math.round(log.lateMinutes % 60)}mn)"
);

