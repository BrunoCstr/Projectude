// src/lib/firebase-admin.ts
import admin from 'firebase-admin';

// Só inicializa uma vez
if (!admin.apps.length) {
  const serviceAccount = require('../../projectude-new-firebase-adminsdk-fbsvc-980c4e048a.json');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export { admin };
export const adminDb = admin.firestore();
