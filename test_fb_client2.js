import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  try {
      const snap = await getDocs(collection(db, 'testimonials'));
      console.log('Success, docs:', snap.size);
  } catch (e) {
      console.error(e.message);
  }
  process.exit(0);
}
run();
