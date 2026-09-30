const fs = require('fs');
let code = fs.readFileSync('src/pages/EmployeeDashboard.tsx', 'utf8');

if (!code.includes('sendPushNotification')) {
  code = code.replace(
    'import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc } from \'firebase/firestore\';',
    'import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc } from \'firebase/firestore\';\nimport { sendPushNotification } from \'../utils/push\';'
  );
}

// 1. Check in
code = code.replace(
  /await addDoc\(collection\(db, "notifications"\), \{\n\s*companyId: user.companyId,\n\s*role: "admin",\n\s*type: "attendance",\n\s*title: "New Attendance Log"/g,
  'await sendPushNotification(null, "admin", user.companyId, "New Attendance Log", `${user.nameKh || user.name} checked in at ${format(checkInDate, \'hh:mm a\')}`);\n      await addDoc(collection(db, "notifications"), {\n        companyId: user.companyId,\n        role: "admin",\n        type: "attendance",\n        title: "New Attendance Log"'
);

// 2. Check out / Break
code = code.replace(
  /await addDoc\(collection\(db, "notifications"\), \{\n\s*companyId: user.companyId,\n\s*role: "admin",\n\s*type: "attendance",\n\s*title: isFinalCheckout \? "Employee Checked Out" : "Employee On Break"/g,
  'await sendPushNotification(null, "admin", user.companyId, isFinalCheckout ? "Employee Checked Out" : "Employee On Break", `${user.nameKh || user.name} is ${isFinalCheckout ? \'checked out\' : \'on break\'}. Time: ${format(now, \'hh:mm a\')}`);\n      await addDoc(collection(db, "notifications"), {\n        companyId: user.companyId,\n        role: "admin",\n        type: "attendance",\n        title: isFinalCheckout ? "Employee Checked Out" : "Employee On Break"'
);

// 3. Resume Shift
code = code.replace(
  /await addDoc\(collection\(db, "notifications"\), \{\n\s*companyId: user.companyId,\n\s*role: "admin",\n\s*type: "attendance",\n\s*title: "Employee Resumed Shift"/g,
  'await sendPushNotification(null, "admin", user.companyId, "Employee Resumed Shift", `${user.nameKh || user.name} returned from break for shift 2 at ${format(now, \'hh:mm a\')}`);\n      await addDoc(collection(db, "notifications"), {\n        companyId: user.companyId,\n        role: "admin",\n        type: "attendance",\n        title: "Employee Resumed Shift"'
);

// 4. Leave Request
code = code.replace(
  /await addDoc\(collection\(db, "notifications"\), \{\n\s*companyId: user.companyId,\n\s*role: "admin",\n\s*type: "leave_pending",\n\s*title: "Pending Leave Request"/g,
  'await sendPushNotification(null, "admin", user.companyId, "Pending Leave Request", `${user.nameKh || user.name} requested leave for ${leaveDate}. Reason: ${leaveReason}`);\n        await addDoc(collection(db, "notifications"), {\n          companyId: user.companyId,\n          role: "admin",\n          type: "leave_pending",\n          title: "Pending Leave Request"'
);

fs.writeFileSync('src/pages/EmployeeDashboard.tsx', code);
