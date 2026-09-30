import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  setLogLevel 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Suppress verbose connection retry warnings in container/iframe environments
setLogLevel('silent');

export const app = initializeApp(firebaseConfig);

// Initialize Firestore with auto-detect long-polling and local multi-tab cache
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  },
  firebaseConfig.firestoreDatabaseId
);

export const auth = getAuth(app);

