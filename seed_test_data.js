import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// Try to use application default credentials or we just tell the user I can't write to their db without a service account.
