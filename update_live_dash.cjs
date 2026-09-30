const fs = require('fs');

function replaceFile(path, regex, replacement) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(path, content);
}

replaceFile('src/components/LiveAttendanceDashboard.tsx',
  /<span className="text-slate-600 dark:text-slate-300">\{log\.timeIn \? format\(new Date\(log\.timeIn\), 'hh:mm a'\) : '-'\\}<\/span>/g,
  `<div className="flex flex-col gap-0.5">
                              <span className="text-slate-600 dark:text-slate-300">{log.timeIn ? format(new Date(log.timeIn), 'hh:mm a') : '-'}</span>
                              {(log.lateCheckIn || log.late) && log.lateMinutes > 0 && (
                                <span className="text-[10px] text-red-500 font-medium leading-none whitespace-nowrap mt-0.5">
                                  Late: {Math.floor(log.lateMinutes / 60)}h{Math.round(log.lateMinutes % 60)}mn
                                </span>
                              )}
                            </div>`
);

replaceFile('src/components/LiveAttendanceDashboard.tsx',
  /<span className="text-sm font-medium text-slate-700 dark:text-slate-300">\{log\.timeIn \? format\(new Date\(log\.timeIn\), 'hh:mm a'\) : '-'\\}<\/span>/g,
  `<div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{log.timeIn ? format(new Date(log.timeIn), 'hh:mm a') : '-'}</span>
                            {(log.lateCheckIn || log.late) && log.lateMinutes > 0 && (
                              <span className="text-[10px] text-red-500 font-medium leading-none whitespace-nowrap mt-0.5">
                                Late: {Math.floor(log.lateMinutes / 60)}h{Math.round(log.lateMinutes % 60)}mn
                              </span>
                            )}
                          </div>`
);

replaceFile('src/components/LiveAttendanceDashboard.tsx',
  /<td className="py-3 px-4 font-mono font-medium">\{log\.regularHours \? \(log\.regularHours \+ \(log\.overtimeHours \|\| 0\)\)\.toFixed\(2\) : '-'\\}<\/td>/g,
  `<td className="py-3 px-4 font-mono font-medium">{log.regularHours ? \`\${Math.floor(log.regularHours + (log.overtimeHours || 0))}h\${Math.round(((log.regularHours + (log.overtimeHours || 0)) % 1) * 60)}mn\` : '-'}</td>`
);

replaceFile('src/components/LiveAttendanceDashboard.tsx',
  /<div className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">\{log\.regularHours \? \(log\.regularHours \+ \(log\.overtimeHours \|\| 0\)\)\.toFixed\(2\) \+ 'h' : '-'\\}<\/div>/g,
  `<div className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">{log.regularHours ? \`\${Math.floor(log.regularHours + (log.overtimeHours || 0))}h\${Math.round(((log.regularHours + (log.overtimeHours || 0)) % 1) * 60)}mn\` : '-'}</div>`
);

