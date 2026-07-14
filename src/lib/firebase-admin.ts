// @ts-ignore
import { initializeApp, getApps, cert } from 'firebase-admin/app';
// @ts-ignore
import serviceAccount from './firebase-key.json';

// @ts-ignore
if (!getApps().length) {
  try {
    const serviceAccountDecoded = {
      ...serviceAccount,
      private_key: Buffer.from(serviceAccount.private_key_base64, 'base64').toString('utf8')
    };
    // @ts-ignore
    initializeApp({
      // @ts-ignore
      credential: cert(serviceAccountDecoded as any),
    });
  } catch (error: any) {
    console.log('Firebase admin initialization error', error.stack);
  }
}

export {};
