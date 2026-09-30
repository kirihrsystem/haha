const fs = require('fs');
let content = fs.readFileSync('src/components/RevenueTracker.tsx', 'utf-8');

content = content.replace(
  `import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';`,
  `import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';`
);

content = content.replace(
`<h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Monthly Trend ({format(currentDate, 'MMMM yyyy')})</h3>`,
`<div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cash Income Trend</h3>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button 
              onClick={() => setChartView('7days')}
              className={\`px-4 py-1.5 text-sm font-medium rounded-lg transition-all \${chartView === '7days' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}\`}
            >
              7 Days
            </button>
            <button 
              onClick={() => setChartView('12months')}
              className={\`px-4 py-1.5 text-sm font-medium rounded-lg transition-all \${chartView === '12months' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}\`}
            >
              12 Months
            </button>
          </div>
        </div>`
);

content = content.replace(
`<AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>`,
`<LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>`
);

content = content.replace(
`<Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#4f46e5" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }}
              />`,
`<Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#4f46e5" 
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#4f46e5' }}
                activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }}
              />`
);

content = content.replace(
`</AreaChart>`,
`</LineChart>`
);

content = content.replace(
`dataKey="day"`,
`dataKey="label"`
);

content = content.replace(
`labelFormatter={(label) => \`\${format(currentDate, 'MMM')} \${label}, \${format(currentDate, 'yyyy')}\`}`,
`labelFormatter={(label) => label}`
);

fs.writeFileSync('src/components/RevenueTracker.tsx', content);
