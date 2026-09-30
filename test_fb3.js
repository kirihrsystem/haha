import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

initializeApp();

const db = getFirestore();

async function run() {
  const compSnap = await db.collection('companies').get();
  console.log(`Found ${compSnap.size} companies`);
  compSnap.forEach(doc => {
    const data = doc.data();
    console.log(`Company ${doc.id}: type=${data.subscription?.type}, status=${data.subscription?.status}, price=${data.subscription?.price}, lastPaymentHash=${data.subscription?.lastPaymentHash}`);
  });
}

run().catch(console.error);
