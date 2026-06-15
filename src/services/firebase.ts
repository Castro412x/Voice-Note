import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  Auth,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  enableMultiTabIndexedDbPersistence,
  Firestore,
} from 'firebase/firestore';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let persistenceEnabled = false;

function getFirebaseApp(): FirebaseApp {
  if (!getApps().length) {
    if (!firebaseConfig.apiKey) {
      throw new Error(
        'Firebase configuration is missing. Set NEXT_PUBLIC_FIREBASE_* environment variables.',
      );
    }
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.error('Failed to set auth persistence:', err);
    });
  }
  return auth;
}

export async function getFirebaseDb(): Promise<Firestore> {
  if (!db) {
    db = getFirestore(getFirebaseApp());
    if (!persistenceEnabled) {
      try {
        await enableMultiTabIndexedDbPersistence(db);
        persistenceEnabled = true;
      } catch (err: unknown) {
        if (err instanceof Error) {
          if ((err as { code?: string }).code === 'failed-precondition') {
            console.warn('Firestore persistence: multiple tabs open, persistence enabled in one tab only.');
          } else if ((err as { code?: string }).code === 'unimplemented') {
            console.warn('Firestore persistence not supported in this browser.');
          } else {
            console.error('Firestore persistence error:', err.message);
          }
        }
        persistenceEnabled = true;
      }
    }
  }
  return db;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    storage = getStorage(getFirebaseApp());
  }
  return storage;
}

export function connectEmulators(): void {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    const authInstance = getFirebaseAuth();
    connectAuthEmulator(authInstance, 'http://localhost:9099', { disableWarnings: true });
    const dbInstance = getFirestore(getFirebaseApp());
    connectFirestoreEmulator(dbInstance, 'localhost', 8080);
    const storageInstance = getFirebaseStorage();
    connectStorageEmulator(storageInstance, 'localhost', 9199);
  }
}
