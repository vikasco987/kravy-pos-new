// @ts-ignore
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// @ts-ignore
if (!getApps().length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    // Handle Vercel newlines securely
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '').replace(/'/g, '')
      : undefined;

    if (projectId && clientEmail && privateKey) {
      // @ts-ignore
      initializeApp({
        // @ts-ignore
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } else {
      console.log('Firebase admin initialization error: Missing Variables in .env');
    }
  } catch (error: any) {
    console.log('Firebase admin initialization error', error.stack);
  }
}

export { };