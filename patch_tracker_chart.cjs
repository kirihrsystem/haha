const fs = require('fs');
let content = fs.readFileSync('src/components/RevenueTracker.tsx', 'utf-8');

// add chartView state
content = content.replace(
`  const [currentDate, setCurrentDate] = useState(new Date());`,
`  const [currentDate, setCurrentDate] = useState(new Date());
  const [chartView, setChartView] = useState<'7days' | '12months'>('7days');`
);

// update chartData memo
content = content.replace(
`  const chartData = useMemo(() => {
    const daysInMonth = endOfMonth(currentDate).getDate();
    const data = [];
    const monthPrefix = format(currentDate, 'yyyy-MM');
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = \`\${monthPrefix}-\${i.toString().padStart(2, '0')}\`;
      const dayTotal = records.filter(r => r.date === dateStr).reduce((sum, r) => sum + r.amount, 0);
      data.push({
        day: i.toString(),
        fullDate: dateStr,
        revenue: dayTotal
      });
    }
    return data;
  }, [records, currentDate]);`,
`  const chartData = useMemo(() => {
    const data = [];
    const today = new Date();
    
    if (chartView === '7days') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = format(d, 'yyyy-MM-dd');
        const dayTotal = records.filter(r => r.date === dateStr).reduce((sum, r) => sum + r.amount, 0);
        data.push({
          label: format(d, 'MMM dd'),
          fullDate: dateStr,
          revenue: dayTotal
        });
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const start = startOfMonth(d);
        const end = endOfMonth(d);
        const monthTotal = records
          .filter(r => isWithinInterval(parseISO(r.date), { start, end }))
          .reduce((sum, r) => sum + r.amount, 0);
        
        data.push({
          label: format(d, 'MMM yyyy'),
          fullDate: format(d, 'yyyy-MM'),
          revenue: monthTotal
        });
      }
    }
    return data;
  }, [records, chartView]);`
);

fs.writeFileSync('src/components/RevenueTracker.tsx', content);
