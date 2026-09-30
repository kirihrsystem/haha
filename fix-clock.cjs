const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeeDashboard.tsx', 'utf8');

const target = `<Clock className="w-16 h-16 mx-auto mb-6 text-ice-500" />
        <div className="text-4xl md:text-5xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white mb-2">
          {format(currentTime, "hh:mm")}
          <span className="text-xl md:text-2xl text-slate-400 ml-2">
            {format(currentTime, "a")}
          </span>
        </div>
        <p className="text-slate-400 font-medium mb-8 text-lg uppercase tracking-widest">
          {format(currentTime, "EEEE", { locale: dateLocale })}
        </p>`;

const replacement = `<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm mb-8">
          <Clock className="w-8 h-8 text-slate-400 dark:text-slate-500 stroke-[1.5]" />
        </div>
        <div className="text-6xl md:text-7xl font-light tracking-tight text-slate-800 dark:text-slate-100 mb-4 drop-shadow-sm flex items-baseline justify-center">
          {format(currentTime, "hh:mm")}
          <span className="text-2xl md:text-3xl text-slate-400 dark:text-slate-500 font-normal ml-3 tracking-wide">
            {format(currentTime, "a")}
          </span>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 text-lg md:text-xl tracking-wide">
          {format(currentTime, "EEEE, MMMM do, yyyy", { locale: dateLocale })}
        </p>`;

code = code.replace(target, replacement);

fs.writeFileSync('src/pages/EmployeeDashboard.tsx', code);
