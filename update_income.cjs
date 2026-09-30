const fs = require('fs');

let content = fs.readFileSync('src/pages/SuperAdminDashboard.tsx', 'utf8');

// 1. Add parseSubDate helper
const helperCode = `
  const parseSubDate = (sub: any): Date => {
    const tryParse = (val: any): Date | null => {
      if (!val) return null;
      if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
      if (typeof val.toDate === 'function') {
        try { const d = val.toDate(); if (!isNaN(d.getTime())) return d; } catch (e) {}
      }
      if (typeof val.toMillis === 'function') {
        try { const d = new Date(val.toMillis()); if (!isNaN(d.getTime())) return d; } catch (e) {}
      }
      if (typeof val.seconds === 'number') {
        const d = new Date(val.seconds * 1000);
        if (!isNaN(d.getTime())) return d;
      }
      if (typeof val === 'number') {
        const d = new Date(val);
        if (!isNaN(d.getTime())) return d;
      }
      if (typeof val === 'string') {
        const d = new Date(val);
        if (!isNaN(d.getTime())) return d;
      }
      return null;
    };

    const dUpdated = tryParse(sub?.updatedAt);
    if (dUpdated) return dUpdated;

    const dCreated = tryParse(sub?.createdAt);
    if (dCreated) return dCreated;

    const dExp = tryParse(sub?.expiresAt);
    if (dExp) {
      if (sub?.type === 'unlimited' || sub?.type === 'lifetime' || dExp.getFullYear() > 2050) {
        return new Date();
      } else if (sub?.type === 'yearly' || sub?.type?.endsWith('_yearly')) {
        return new Date(dExp.getFullYear() - 1, dExp.getMonth(), dExp.getDate());
      } else {
        return new Date(dExp.getFullYear(), dExp.getMonth() - 1, dExp.getDate());
      }
    }

    return new Date();
  };

  const superAdminCompanyIds`;

content = content.replace('const superAdminCompanyIds', helperCode);

// 2. Update revenueStats calculations
const targetStatsBlock = `          let pDate = new Date(); 
          if (c.subscription.updatedAt) {
            pDate = new Date(c.subscription.updatedAt);
          } else if (c.subscription.createdAt) {
            pDate = new Date(c.subscription.createdAt);
          } else if (c.subscription.expiresAt) {
            const exp = new Date(c.subscription.expiresAt);
            if (c.subscription.type === 'unlimited' || c.subscription.type === 'lifetime' || exp.getFullYear() > 2050) {
              pDate = new Date();
            } else if (c.subscription.type === 'yearly' || c.subscription.type?.endsWith('_yearly')) {
              pDate = new Date(exp.getFullYear() - 1, exp.getMonth(), exp.getDate());
            } else {
              pDate = new Date(exp.getFullYear(), exp.getMonth() - 1, exp.getDate());
            }
          }

          if (!isNaN(pDate.getTime())) {
            const pDateStr = pDate.getFullYear() + '-' + String(pDate.getMonth() + 1).padStart(2, '0') + '-' + String(pDate.getDate()).padStart(2, '0');
            if (pDate.getFullYear() === currentYear) {
              yearly += price;
              if (pDate.getMonth() === currentMonth) {
                monthly += price;
              }
            } else if (pDate.getFullYear() === prevYearStr) {
              prevYearly += price;
            }
            
            if (pDateStr === todayStr) {
              daily += price;
            }
            
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            if (pDateStr === yesterday.getFullYear() + '-' + String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + String(yesterday.getDate()).padStart(2, '0')) {
              prevDaily += price;
            }

            if (pDate.getFullYear() === prevMonthYear && pDate.getMonth() === prevMonthStr) {
              prevMonthly += price;
            }
          } else {
            yearly += price;
            monthly += price;
            daily += price;
          }`;

const replacementStatsBlock = `          const pDate = parseSubDate(c.subscription);
          const pDateStr = pDate.getFullYear() + '-' + String(pDate.getMonth() + 1).padStart(2, '0') + '-' + String(pDate.getDate()).padStart(2, '0');

          if (pDate.getFullYear() === currentYear) {
            yearly += price;
            if (pDate.getMonth() === currentMonth) {
              monthly += price;
            } else if (c.subscription.status === 'active') {
              if (c.subscription.type === 'yearly' || c.subscription.type?.endsWith('_yearly')) {
                monthly += Number((price / 12).toFixed(2));
              } else {
                monthly += price;
              }
            }
          } else if (c.subscription.status === 'active') {
            if (c.subscription.type === 'yearly' || c.subscription.type?.endsWith('_yearly')) {
              monthly += Number((price / 12).toFixed(2));
            } else {
              monthly += price;
            }
            yearly += price;
          }

          if (pDateStr === todayStr) {
            daily += price;
          }

          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);
          const yesterdayStr = yesterday.getFullYear() + '-' + String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + String(yesterday.getDate()).padStart(2, '0');
          if (pDateStr === yesterdayStr) {
            prevDaily += price;
          }

          if (pDate.getFullYear() === prevMonthYear && pDate.getMonth() === prevMonthStr) {
            prevMonthly += price;
          }`;

content = content.replace(targetStatsBlock, replacementStatsBlock);

// 3. Update realTransactions block
const targetTxBlock = `          let pDate = new Date();
          if ((comp.subscription as any).updatedAt) {
            pDate = new Date((comp.subscription as any).updatedAt);
          } else if ((comp.subscription as any).createdAt) {
            pDate = new Date((comp.subscription as any).createdAt);
          } else if (comp.subscription.expiresAt) {
            const exp = new Date(comp.subscription.expiresAt);
            if (comp.subscription.type === 'unlimited' || comp.subscription.type === 'lifetime' || exp.getFullYear() > 2050) {
              // We can't derive payment date from 2099. Fallback to now (assuming it was just made if missing)
              pDate = new Date();
            } else if (comp.subscription.type === 'yearly') {
              pDate = new Date(exp.getFullYear() - 1, exp.getMonth(), exp.getDate());
            } else {
              pDate = new Date(exp.getFullYear(), exp.getMonth() - 1, exp.getDate());
            }
          }`;

content = content.replace(targetTxBlock, `          const pDate = parseSubDate(comp.subscription);`);

// 4. Update chart daily loop block
const targetChartDailyBlock = `            let pDate = new Date();
            if ((c.subscription as any).updatedAt) {
              pDate = new Date((c.subscription as any).updatedAt);
            } else if ((c.subscription as any).createdAt) {
              pDate = new Date((c.subscription as any).createdAt);
            } else if (c.subscription.expiresAt) {
              const exp = new Date(c.subscription.expiresAt);
              if (c.subscription.type === 'unlimited' || c.subscription.type === 'lifetime' || exp.getFullYear() > 2050) {
                pDate = new Date();
              } else if (c.subscription.type === 'yearly' || c.subscription.type?.endsWith('_yearly')) {
                pDate = new Date(exp.getFullYear() - 1, exp.getMonth(), exp.getDate());
              } else {
                pDate = new Date(exp.getFullYear(), exp.getMonth() - 1, exp.getDate());
              }
            }`;

content = content.replace(targetChartDailyBlock, `            const pDate = parseSubDate(c.subscription);`);

// 5. Update chart monthly loop block
content = content.replace(targetChartDailyBlock, `            const pDate = parseSubDate(c.subscription);`);

fs.writeFileSync('src/pages/SuperAdminDashboard.tsx', content);
console.log('Successfully updated SuperAdminDashboard.tsx');
