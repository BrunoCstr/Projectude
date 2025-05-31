// src/lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  Auth,
} from "firebase/auth";
import {
  getFirestore,
  Firestore,
  collection, doc, getDoc
} from "firebase/firestore";
import {
  getStorage,
  FirebaseStorage,
} from "firebase/storage";
import {
  getFunctions,
  Functions,
} from "firebase/functions"; // Import Functions

// Use environment variables for Firebase config keys
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// --- State Variables ---
export let firebaseApp: FirebaseApp | null = null;
export let auth: Auth | null = null;
export let db: Firestore | null = null;
export let storage: FirebaseStorage | null = null;
export let functions: Functions | null = null; // Add Functions state
export let googleProvider: GoogleAuthProvider | null = null;
let isFirebaseInitialized = false;
let initializationError: Error | null = null;


// --- Error Messages ---
const ERR_CLIENT_SDK_ON_SERVER =
  "Firebase client SDK cannot be initialized server-side.";
const ERR_CONFIG_MISSING =
  "Missing essential Firebase config values (apiKey, authDomain, projectId). Check environment variables.";
const ERR_INIT_FAILED = (serviceName: string, error: any) =>
  `Failed to get Firebase ${serviceName} instance: ${error.message || error}`;
const ERR_SERVICES_NOT_READY = (serviceName: string) =>
  `Erro fatal: Firebase ${serviceName} service is not initialized.`;

// --- Core Initialization Function (Client-Side Focus) ---
function initializeFirebaseClientServices() {

  // Strict check for client-side environment
  if (typeof window === "undefined") {
    console.error(
      `[FirebaseLib] ${ERR_CLIENT_SDK_ON_SERVER} Aborting client-side initialization.`
    );
    initializationError = new Error(ERR_CLIENT_SDK_ON_SERVER);
    isFirebaseInitialized = false;
    return false;
  }

  if (isFirebaseInitialized) {
    return true; // Already initialized successfully
  }
  if (initializationError) {
    console.error(
      "[FirebaseLib] Firebase previously failed to initialize on client.",
      initializationError
    );
    return false; // Previously failed
  }

  try {
    // Check for required config values
    if (
      !firebaseConfig.apiKey ||
      !firebaseConfig.authDomain ||
      !firebaseConfig.projectId
    ) {
      console.error(
        "[FirebaseLib] CRITICAL: Missing Firebase config values:",
        firebaseConfig
      );
      throw new Error(ERR_CONFIG_MISSING);
    }

    // Initialize App
    if (getApps().length === 0) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = getApp();
    }

    // Initialize Services - Wrap in try/catch for individual service failures
    try {
      auth = getAuth(firebaseApp);
    } catch (e: any) {
      throw new Error(ERR_INIT_FAILED("Auth", e));
    }
    try {
      db = getFirestore(firebaseApp);
    } catch (e: any) {
      throw new Error(ERR_INIT_FAILED("Firestore", e));
    }
    try {
      storage = getStorage(firebaseApp);
    } catch (e: any) {
      throw new Error(ERR_INIT_FAILED("Storage", e));
    }
    try {
      functions = getFunctions(firebaseApp);
    } catch (e: any) {
      throw new Error(ERR_INIT_FAILED("Functions", e));
    }
    try {
      googleProvider = new GoogleAuthProvider();
    } catch (e: any) {
      throw new Error(ERR_INIT_FAILED("Google Provider", e));
    }

    isFirebaseInitialized = true;
    initializationError = null; // Clear any previous error on success
  } catch (error: any) {
    console.error(
      "[FirebaseLib] CRITICAL: Error during Firebase client services initialization:",
      error.message || error
    );
    initializationError = error; // Store the error
    isFirebaseInitialized = false;
    // Reset instances on error
    firebaseApp = null;
    auth = null;
    db = null;
    storage = null;
    functions = null;
    googleProvider = null;
    return false;
  }
}

// --- Safe Getters (Client-Side Focus) ---
// These ensure initialization is attempted before returning the instance.

const getInitializedFirebaseApp = (): FirebaseApp => {
  if (typeof window === "undefined") {
    throw new Error(ERR_CLIENT_SDK_ON_SERVER + " Cannot get App instance.");
  }
  if (!isFirebaseInitialized && !initializationError) {
    console.warn(
      "[FirebaseLib:getInitializedFirebaseApp] Client services not initialized. Attempting initialization..."
    );
    initializeFirebaseClientServices();
  }
  if (!firebaseApp || initializationError) {
    console.error(
      "[FirebaseLib:getInitializedFirebaseApp] FATAL: Firebase App is not initialized.",
      initializationError
    );
    throw initializationError || new Error(ERR_SERVICES_NOT_READY("App"));
  }
  return firebaseApp;
};

const getInitializedAuth = (): Auth => {
  if (typeof window === "undefined") {
    throw new Error(ERR_CLIENT_SDK_ON_SERVER + " Cannot get Auth instance.");
  }
  if (!isFirebaseInitialized && !initializationError) {
    console.warn(
      "[FirebaseLib:getInitializedAuth] Auth service potentially not ready. Attempting initialization..."
    );
    initializeFirebaseClientServices();
  }
  if (!auth || initializationError) {
    console.error(
      "[FirebaseLib:getInitializedAuth] FATAL: Firebase Auth service is not initialized.",
      initializationError
    );
    throw initializationError || new Error(ERR_SERVICES_NOT_READY("Auth"));
  }
  // Basic sanity check
  if (typeof auth.signOut !== "function") {
    console.error(
      "[FirebaseLib:getInitializedAuth] FATAL: Auth object is invalid or incomplete."
    );
    throw new Error(
      "Erro fatal: Serviço de autenticação está em estado inválido."
    );
  }
  return auth;
};

const getInitializedFirestore = (): Firestore => {
  if (typeof window === "undefined") {
    throw new Error(
      ERR_CLIENT_SDK_ON_SERVER + " Cannot get Firestore instance."
    );
  }
  if (!isFirebaseInitialized && !initializationError) {
    console.warn(
      "[FirebaseLib:getInitializedFirestore] Firestore service potentially not ready. Attempting initialization..."
    );
    initializeFirebaseClientServices();
  }
  if (!db || initializationError) {
    console.error(
      "[FirebaseLib:getInitializedFirestore] FATAL: Firebase Firestore service is not initialized.",
      initializationError
    );
    throw initializationError || new Error(ERR_SERVICES_NOT_READY("Firestore"));
  }
  
  return db;
};

const getInitializedStorage = (): FirebaseStorage => {
  if (typeof window === "undefined") {
    throw new Error(ERR_CLIENT_SDK_ON_SERVER + " Cannot get Storage instance.");
  }
  if (!isFirebaseInitialized && !initializationError) {
    console.warn(
      "[FirebaseLib:getInitializedStorage] Storage service potentially not ready. Attempting initialization..."
    );
    initializeFirebaseClientServices();
  }
  if (!storage || initializationError) {
    console.error(
      "[FirebaseLib:getInitializedStorage] FATAL: Firebase Storage service is not initialized.",
      initializationError
    );
    throw initializationError || new Error(ERR_SERVICES_NOT_READY("Storage"));
  }
  
  return storage;
};

const getInitializedFunctions = (): Functions => {
  if (typeof window === "undefined") {
    throw new Error(
      ERR_CLIENT_SDK_ON_SERVER + " Cannot get Functions instance."
    );
  }
  if (!isFirebaseInitialized && !initializationError) {
    console.warn(
      "[FirebaseLib:getInitializedFunctions] Functions service potentially not ready. Attempting initialization..."
    );
    initializeFirebaseClientServices();
  }
  if (!functions || initializationError) {
    console.error(
      "[FirebaseLib:getInitializedFunctions] FATAL: Firebase Functions service is not initialized.",
      initializationError
    );
    throw initializationError || new Error(ERR_SERVICES_NOT_READY("Functions"));
  }
  // Basic sanity check
  if (typeof functions !== "object") {
    console.error(
      "[FirebaseLib:getInitializedFunctions] FATAL: Functions object is undefined or invalid."
    );
    throw new Error("Erro fatal: Serviço Functions está em estado inválido.");
  }
  return functions;
};

const getInitializedGoogleProvider = (): GoogleAuthProvider => {
  if (typeof window === "undefined") {
    throw new Error(
      ERR_CLIENT_SDK_ON_SERVER + " Cannot get Google Provider instance."
    );
  }
  if (!isFirebaseInitialized && !initializationError) {
    console.warn(
      "[FirebaseLib:getInitializedGoogleProvider] Google Provider potentially not ready. Attempting initialization..."
    );
    initializeFirebaseClientServices();
  }
  if (!googleProvider || initializationError) {
    console.error(
      "[FirebaseLib:getInitializedGoogleProvider] FATAL: Google Provider is not initialized.",
      initializationError
    );
    throw (
      initializationError ||
      new Error(ERR_SERVICES_NOT_READY("Google Provider"))
    );
  }
  // Basic sanity check
  if (googleProvider.providerId !== "google.com") {
    console.error(
      "[FirebaseLib:getInitializedGoogleProvider] FATAL: Google Provider object is invalid."
    );
    throw new Error("Erro fatal: Provedor Google está em estado inválido.");
  }
  return googleProvider;
};

// --- Initialization Trigger ---
// Attempt client-side initialization immediately when this module is loaded in a browser context.
// The safe getters will handle re-attempts if needed.
if (typeof window !== "undefined") {
  initializeFirebaseClientServices();
}

export {
  // Export the initialization status flag and error for potential debugging in UI
  isFirebaseInitialized,
  initializationError,
  // Export the safe getter functions
  getInitializedFirebaseApp,
  getInitializedAuth,
  getInitializedFirestore,
  getInitializedStorage,
  getInitializedFunctions,
  getInitializedGoogleProvider,
};
