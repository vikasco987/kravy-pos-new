// @ts-ignore
import * as admin from 'firebase-admin';

// @ts-ignore
if (!admin.apps.length) {
  try {
    const base64Key = process.env.FIREBASE_BASE64_KEY;
    if (base64Key) {
      // Base64 ko wapas JSON me decode karke initialize karenge
      const decodedKey = Buffer.from(base64Key, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(decodedKey);

      // @ts-ignore
      admin.initializeApp({
        // @ts-ignore
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase initialized successfully via Base64!');
    } else {
      console.log('Firebase admin error: FIREBASE_BASE64_KEY is missing');
    }
  } catch (error: any) {
    console.log('Firebase admin initialization error', error.stack);
  }
}

export default admin;