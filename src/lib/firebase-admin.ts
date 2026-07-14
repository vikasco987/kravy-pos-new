// @ts-ignore
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// @ts-ignore
if (!getApps().length) {
  try {
    const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountStr) {
      const serviceAccount = JSON.parse(serviceAccountStr);
      // @ts-ignore
      initializeApp({
        // @ts-ignore
        credential: cert(serviceAccount),
      });
    } else {
      console.log('Firebase admin initialization error: FIREBASE_SERVICE_ACCOUNT is missing in .env');
    }
  } catch (error: any) {
    console.log('Firebase admin initialization error', error.stack);
  }
}

export { };