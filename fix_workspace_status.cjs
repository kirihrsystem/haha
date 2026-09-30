const fs = require('fs');

function replaceFile(path, regex, replacement) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(path, content);
}

replaceFile('src/components/SubscriptionManager.tsx',
  /<span className="px-2\.5 py-0\.5 text-\[11px\] font-bold bg-emerald-100 dark:bg-emerald-500\/20 text-emerald-700 dark:text-emerald-300 rounded-full">\s*Active\s*<\/span>/g,
  `<>
                    <span className="px-2.5 py-0.5 text-[11px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-full">
                      Active
                    </span>
                    {sub?.usedCode && (
                      <span className="px-2.5 py-0.5 text-[11px] font-bold bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-full flex items-center gap-1">
                        <Gift className="w-3 h-3" /> Code: {sub.usedCode}
                      </span>
                    )}
                  </>`
);

