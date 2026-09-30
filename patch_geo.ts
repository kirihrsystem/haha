const fs = require('fs');

const content = fs.readFileSync('src/pages/EmployeeDashboard.tsx', 'utf8');

const targetStr = `      async (error) => {`;
const replaceStr = `      }, { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true });`;

// Wait, the syntax is: getCurrentPosition(success, error, options)

let newContent = content.replace(/      async \(error\) => {/g, `      async (error) => {`);
// That's tricky.
