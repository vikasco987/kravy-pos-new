// @ts-ignore
import 'dotenv/config';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// @ts-ignore
if (!getApps().length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '')
      : undefined;

    const serviceAccountConfig = {
      type: process.env.FIREBASE_TYPE || 'service_account',
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
      privateKey: privateKey,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      clientId: process.env.FIREBASE_CLIENT_ID,
      authUri: process.env.FIREBASE_AUTH_URI,
      tokenUri: process.env.FIREBASE_TOKEN_URI,
      authProviderX509CertUrl: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
      clientX509CertUrl: process.env.FIREBASE_CLIENT_CERT_URL,
      universeDomain: process.env.FIREBASE_UNIVERSE_DOMAIN,
    };

    if (serviceAccountConfig.projectId && serviceAccountConfig.clientEmail && serviceAccountConfig.privateKey) {
      initializeApp({
        // @ts-ignore
        credential: cert(serviceAccountConfig as any),
      });
    } else {
      console.log('Firebase credentials are not complete in environment variables.');
    }
  } catch (error: any) {
    console.log('Firebase admin initialization error', error.stack);
  }
}

export {};
