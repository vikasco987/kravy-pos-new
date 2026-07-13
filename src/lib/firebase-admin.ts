// Firebase Admin SDK modular initialization
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import serviceAccount from './firebase-key.json';

if (!getApps().length) {
  try {
    initializeApp({
      credential: cert(serviceAccount as any),
    });
  } catch (error: any) {
    console.log('Firebase admin initialization error', error.stack);
  }
}

const admin = {
  messaging: () => getMessaging(),
};

export default admin;
