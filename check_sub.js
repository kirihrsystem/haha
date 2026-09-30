import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
const appletConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf-8'));
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');

initializeApp({
  credential: cert(serviceAccount),
  projectId: appletConfig.projectId
});
const db = getFirestore();
db.settings({ databaseId: appletConfig.firestoreDatabaseId || '(default)' });

async function run() {
  const q = await db.collection('companies_settings').limit(5).get();
  q.forEach(doc => {
    console.log(doc.id, doc.data().subscription);
  });
}
run().catch(console.error);
