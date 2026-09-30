const fs = require('fs');

function replaceFile(path, regex, replacement) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(path, content);
}

replaceFile('src/pages/AdminDashboard.tsx',
  /\{\(log\.lateCheckIn \|\| log\.late\) && \(\s*<span className="text-\[10px\] bg-red-100 text-red-700 px-1 rounded">\s*\{t\("lateCheckIn"\)\}\s*<\/span>\s*\)\}/g,
  `{(log.lateCheckIn || log.late) && (
                                        <span className="text-[10px] bg-red-100 text-red-700 px-1 rounded whitespace-nowrap">
                                          {t("lateCheckIn")} {log.lateMinutes ? \`(\${Math.floor(log.lateMinutes / 60)}h\${Math.round(log.lateMinutes % 60)}m)\` : ""}
                                        </span>
                                      )}`
);

replaceFile('src/components/EmployeeHistory.tsx',
  /\{\(log\.late \|\| log\.lateCheckIn\) && <span className="text-\[10px\] bg-red-100 text-red-700 px-2\.5 py-1 rounded-md uppercase font-bold tracking-wider">\{t\("lateStatus"\)\}<\/span>\}/g,
  `{(log.late || log.lateCheckIn) && <span className="text-[10px] bg-red-100 text-red-700 px-2.5 py-1 rounded-md uppercase font-bold tracking-wider whitespace-nowrap">{t("lateStatus")}{log.lateMinutes ? \` (\${Math.floor(log.lateMinutes / 60)}h\${Math.round(log.lateMinutes % 60)}m)\` : ""}</span>}`
);

