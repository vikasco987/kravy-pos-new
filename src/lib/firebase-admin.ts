// @ts-ignore
import admin from 'firebase-admin';
// @ts-ignore
import serviceAccount from './firebase-key.json';

// @ts-ignore
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      // @ts-ignore
      credential: admin.credential.cert(serviceAccount as any),
    });
  } catch (error: any) {
    console.log('Firebase admin initialization error', error.stack);
  }
}

export default admin;
