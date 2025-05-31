import * as admin from "firebase-admin";

// Initialize the Firebase Admin SDK only once
if (admin.apps.length === 0) {
  // Consider loading credentials from environment variables or service account file
  // For local development with emulators, often no explicit credential is needed
  // if Functions are run within the emulator suite initialized with `firebase init emulators`.
  // If deploying, you need proper credentials (e.g., Application Default Credentials).
  try {
      console.log("[Functions Config] Initializing Firebase Admin SDK...");
      admin.initializeApp();
      console.log("[Functions Config] Firebase Admin SDK initialized successfully.");
  } catch (error) {
       console.error("[Functions Config] CRITICAL: Failed to initialize Firebase Admin SDK:", error);
       // Handle the error appropriately - maybe prevent function deployment/execution
  }
} else {
    console.log("[Functions Config] Firebase Admin SDK already initialized.");
}

if (!admin.apps.length) {
  admin.initializeApp();
}

export { admin };
export const db = admin.firestore();
export const auth = admin.auth(); // Renamed to avoid conflict with client `auth`
export const storage = admin.storage();
