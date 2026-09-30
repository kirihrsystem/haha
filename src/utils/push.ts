import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

export async function sendPushNotification(
  userId: string | null, 
  role: 'admin' | 'staff', 
  companyId: string, 
  title: string, 
  message: string,
  url: string = '/'
) {
  try {
    const payload = {
      title,
      body: message,
      url
    };

    let subscriptions: any[] = [];

    if (role === 'admin') {
      const q = query(
        collection(db, "companies_settings"), 
        where("companyId", "==", companyId)
      );
      const snap = await getDocs(q);
      snap.forEach(docSnap => {
        const data = docSnap.data();
        // Since admin auth ID is same as companyId right now in some places, or admins might have a subcollection.
        // Wait, Admin users are stored in companies_settings with their companyId as doc ID usually? Yes.
        if (data.pushSubscription) {
          subscriptions.push(data.pushSubscription);
        }
      });
    } else if (userId) {
      const userSnap = await getDoc(doc(db, "staff", userId));
      if (userSnap.exists() && userSnap.data().pushSubscription) {
        subscriptions.push(userSnap.data().pushSubscription);
      }
    }

    for (const sub of subscriptions) {
      fetch('/api/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub, payload })
      }).catch(console.error);
    }
  } catch (error) {
    console.error("Failed to send push notification:", error);
  }
}
