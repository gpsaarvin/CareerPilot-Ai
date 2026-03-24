let firestoreDb = null;
let firestoreInitError = null;

function parsePrivateKey(raw) {
  if (!raw) return '';
  return raw.includes('\\n') ? raw.replace(/\\n/g, '\n') : raw;
}

function getFirestore() {
  if (firestoreDb) return firestoreDb;
  if (firestoreInitError) throw firestoreInitError;

  try {
    const admin = require('firebase-admin');

    if (!admin.apps.length) {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

      if (!projectId || !clientEmail || !privateKey || projectId.includes('YOUR_')) {
        throw new Error('Firestore credentials are not configured in server/.env');
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }

    firestoreDb = admin.firestore();
    return firestoreDb;
  } catch (error) {
    firestoreInitError = error;
    throw error;
  }
}

module.exports = {
  getFirestore,
};
