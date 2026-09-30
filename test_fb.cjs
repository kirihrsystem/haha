const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

async function run() {
  const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
  process.env.FIRESTORE_EMULATOR_HOST = ""; // Ensure we don't connect to an emulator
  const app = initializeApp({
      projectId: firebaseConfig.projectId
  });
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  try {
      const snap = await db.collection('testimonials').get();
      console.log('Success, docs:', snap.size);
  } catch (e) {
      console.error(e.message);
  }
}
run();
