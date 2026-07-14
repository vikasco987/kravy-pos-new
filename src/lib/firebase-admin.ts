// @ts-ignore
import { initializeApp, getApps, cert } from 'firebase-admin/app';
// @ts-ignore
import serviceAccount from './firebase-key.json';

// @ts-ignore
if (!getApps().length) {
  try {
    // Read from environment variable first, otherwise fallback to the dummy json file
    const serviceAccountConfig = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : serviceAccount;

    // @ts-ignore
    initializeApp({
      // @ts-ignore
      credential: cert(serviceAccountConfig as any),
    });
  } catch (error: any) {
    console.log('Firebase admin initialization error', error.stack);
  }
}

export {};
