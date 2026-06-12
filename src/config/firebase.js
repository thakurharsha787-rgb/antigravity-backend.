/**
 * @file src/config/firebase.js
 * @description Initialises Firebase Admin SDK from the service-account JSON
 * stored in the FIREBASE_SERVICE_ACCOUNT_JSON env var.
 */

const admin = require('firebase-admin');

/**
 * Parse the service-account credential from the environment and initialise
 * the default Firebase app.  The env var must contain a valid JSON string.
 *
 * @returns {admin.app.App} The initialised Firebase app instance.
 */
function initFirebase() {
  // Avoid re-initialising if already done (e.g. in tests).
  if (admin.apps.length) {
    return admin.app();
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!raw) {
    console.error(
      '❌ FIREBASE_SERVICE_ACCOUNT_JSON is not set. Firebase auth will not work.'
    );
    // Return uninitialised admin so the process can still start (useful in dev).
    return null;
  }

  try {
    const serviceAccount = JSON.parse(raw);
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (err) {
    console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', err.message);
    process.exit(1);
  }
}

const firebaseApp = initFirebase();

module.exports = { admin, firebaseApp };
