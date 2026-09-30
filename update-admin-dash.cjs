const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

if (!code.includes('sendPushNotification')) {
  code = code.replace(
    'import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc, setDoc, getDoc } from \'firebase/firestore\';',
    'import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc, setDoc, getDoc } from \'firebase/firestore\';\nimport { sendPushNotification } from \'../utils/push\';'
  );
}

// 1. Payroll review
code = code.replace(
  /await addDoc\(collection\(db, "notifications"\), \{\n\s*companyId: user\?.companyId \|\| "",\n\s*userId: summary\.employee\.id,\n\s*role: "staff",\n\s*type: "payroll",\n\s*title: "Payroll Ready for Review"/g,
  'await sendPushNotification(summary.employee.id, "staff", user?.companyId || "", "Payroll Ready for Review", `Your payroll for ${selectedMonth} is ready for review. Please check and confirm.`);\n        await addDoc(collection(db, "notifications"), {\n          companyId: user?.companyId || "",\n          userId: summary.employee.id,\n          role: "staff",\n          type: "payroll",\n          title: "Payroll Ready for Review"'
);

// 2. Payroll Paid
code = code.replace(
  /await addDoc\(collection\(db, "notifications"\), \{\n\s*companyId: user\?.companyId \|\| "",\n\s*userId: summary\.employee\.id,\n\s*role: "staff",\n\s*type: "payroll",\n\s*title: "Payroll Paid"/g,
  'await sendPushNotification(summary.employee.id, "staff", user?.companyId || "", "Payroll Paid", `Your payroll for ${selectedMonth} has been marked as paid by HR.`);\n         await addDoc(collection(db, "notifications"), {\n          companyId: user?.companyId || "",\n          userId: summary.employee.id,\n          role: "staff",\n          type: "payroll",\n          title: "Payroll Paid"'
);

// 3. Attendance Corrected
code = code.replace(
  /await addDoc\(collection\(db, "notifications"\), \{\n\s*companyId: user\?.companyId \|\| "",\n\s*userId: editingLog\.staffId,\n\s*role: "staff",\n\s*type: "attendance",\n\s*title: "Attendance Record Corrected"/g,
  'await sendPushNotification(editingLog.staffId, "staff", user?.companyId || "", "Attendance Record Corrected", `Your check-in log for date ${editingLog.date} was corrected by the manager.`);\n      await addDoc(collection(db, "notifications"), {\n        companyId: user?.companyId || "",\n        userId: editingLog.staffId,\n        role: "staff",\n        type: "attendance",\n        title: "Attendance Record Corrected"'
);

// 4. Payroll Allowances Updated
code = code.replace(
  /await addDoc\(collection\(db, "notifications"\), \{\n\s*companyId: user\?.companyId \|\| "",\n\s*userId: selectedStaffForBonus\.id,\n\s*role: "staff",\n\s*type: "attendance",\n\s*title: "Payroll Allowances Updated"/g,
  'await sendPushNotification(selectedStaffForBonus.id, "staff", user?.companyId || "", "Payroll Allowances Updated", `Your payroll for ${selectedMonth} was edited. Allowance Bonus: $${bonusAmount || 0}, Deduction: $${deductionAmount || 0}.`);\n      await addDoc(collection(db, "notifications"), {\n        companyId: user?.companyId || "",\n        userId: selectedStaffForBonus.id,\n        role: "staff",\n        type: "attendance",\n        title: "Payroll Allowances Updated"'
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
