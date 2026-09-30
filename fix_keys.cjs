const fs = require('fs');

function replaceFile(path, regex, replacement) {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    content = content.replace(regex, replacement);
    fs.writeFileSync(path, content);
  }
}

replaceFile('src/pages/AdminDashboard.tsx',
  /\{summary\.displayLogs\.map\(\(log\) => \(\s*<tr key=\{log\.id\}/g,
  `{summary.displayLogs.map((log, index) => (
                            <tr key={\`\${log.id}-\${index}\`}`
);

replaceFile('src/components/EmployeeHistory.tsx',
  /\{displayLogs\.sort\(\(a, b\) => new Date\(b\.date\)\.getTime\(\) - new Date\(a\.date\)\.getTime\(\)\)\.map\(\(log, index\) => \(\s*<motion\.div\s*initial=\{\{ opacity: 0, x: -20 \}\}\s*animate=\{\{ opacity: 1, x: 0 \}\}\s*transition=\{\{ delay: index \* 0\.05 \}\}\s*key=\{log\.id\}/g,
  `{displayLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((log, index) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={\`\${log.id}-\${index}\`}`
);

replaceFile('src/components/LiveAttendanceDashboard.tsx',
  /\{logs\.map\(\(log\) => \{\s*const staff = staffList\.find\(s => s\.id === log\.staffId\);\s*return \(\s*<tr key=\{log\.id\}/g,
  `{logs.map((log, idx) => {
                    const staff = staffList.find(s => s.id === log.staffId);
                    return (
                      <tr key={\`\${log.id}-\${idx}\`}`
);

replaceFile('src/components/LiveAttendanceDashboard.tsx',
  /\{logs\.map\(\(log\) => \{\s*const staff = staffList\.find\(s => s\.id === log\.staffId\);\s*return \(\s*<div key=\{`mobile-\$\{log\.id\}`\}/g,
  `{logs.map((log, idx) => {
                const staff = staffList.find(s => s.id === log.staffId);
                return (
                  <div key={\`mobile-\${log.id}-\${idx}\`}`
);

replaceFile('src/components/LiveAttendanceDashboard.tsx',
  /recentEvents\.map\(\(event\) => \(\s*<div key=\{event\.id\}/g,
  `recentEvents.map((event, idx) => (
                   <div key={\`\${event.id}-\${idx}\`}`
);

