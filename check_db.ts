import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function run() {
  const compSnap = await db.collection('companies').get();
  console.log(`Found ${compSnap.size} companies`);
  compSnap.forEach(doc => {
    const data = doc.data();
    console.log(`Company ${doc.id}:`, JSON.stringify(data.subscription));
  });
}

run().catch(console.error);
