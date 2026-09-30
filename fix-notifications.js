import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// You can use the application default credentials if running in a Google Cloud environment
const app = initializeApp();
const db = getFirestore(app);

async function fix() {
  const snapshot = await db.collection("notifications")
    .where("title", "==", "New Attendance Log")
    .get();

  let count = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    let newTitle = "Employee Checked In";
    let newMessage = data.message;
    // Replace "checked in at" with "checked in at" if it's there
    // If we can parse out the name and time...
    
    await doc.ref.update({
      title: newTitle
    });
    count++;
  }
  
  const checkoutSnap = await db.collection("notifications")
    .where("title", "==", "Employee Checked Out")
    .get();

  for (const doc of checkoutSnap.docs) {
    // just to be safe
  }
  
  console.log("Updated", count, "notifications");
}
fix().catch(console.error);
