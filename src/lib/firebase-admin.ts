// @ts-ignore
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// @ts-ignore
if (!getApps().length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '')
      : undefined;

    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
    } else {
      console.log('Firebase credentials are not complete in environment variables.');
    }
  } catch (error: any) {
    console.log('Firebase admin initialization error', error.stack);
  }
}

export {};
