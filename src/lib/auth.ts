import * as z from "zod";
// src/lib/auth.ts
import { getAuth, type Auth } from "firebase/auth"; // Import Auth type explicitly if needed
import {
  getFirestore,
  connectFirestoreEmulator,
  type Firestore,
} from "firebase/firestore"; // Import Firestore type explicitly
import {
  getStorage,
  connectStorageEmulator,
  type FirebaseStorage,
} from "firebase/storage"; // Import Storage type explicitly
import {
  getFunctions,
  connectFunctionsEmulator,
  type Functions,
} from "firebase/functions"; // Import Functions and its type

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword, // Import the actual function
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  onAuthStateChanged, // Import directly
  signInWithPopup,
  GoogleAuthProvider as FirebaseGoogleAuthProvider, // Keep import for type usage if needed elsewhere
  type User,
  getIdToken,
  AuthErrorCodes, // Import AuthErrorCodes for better error handling
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  writeBatch,
  FirestoreError,
} from "firebase/firestore"; // Import FirestoreError
// Import the correct error type and callable functions from the CLIENT SDK
import {
  httpsCallable,
  type FunctionsErrorCode,
  type HttpsCallable,
  type HttpsCallableResult,
  FunctionsError,
} from "firebase/functions"; // Use FunctionsError

import {
  getInitializedAuth,
  getInitializedFirestore,
  getInitializedFunctions,
  getInitializedGoogleProvider,
  getInitializedFirebaseApp,
} from "@/lib/firebase"; // Import helpers

// Import shared schemas for validation
import {
  loginSchema,
  signupSchema,
  passwordStrengthSchema,
  type LoginFormData,
  type SignupFormData,
  PasswordChangeFormData,
} from "@/lib/schemas";
import { mapFirebaseAuthError } from "./auth-errors";

// --- Constants ---
const COMMON_PASSWORDS = [
  "password",
  "123456",
  "qwerty",
  "admin",
  "projectude",
  "12345678",
  "123456789",
];

// --- Helper Function to Call Cloud Function (Client-Side) ---
/**
 * Calls the 'dbCreateOrUpdateFirestoreUser' Cloud Function to create/update user data.
 * Uses the initialized Firebase Functions instance.
 * @param user - The authenticated Firebase user object.
 * @param nameFromSignup - Optional name provided during signup.
 * @returns An object indicating success or failure.
 * @throws Error with mapped message if the Cloud Function call fails.
 */
async function callCreateOrUpdateFirestoreUser(
  user: User,
  nameFromSignup?: string
): Promise<{ success: boolean; message: string }> {
  if (!user) {
    console.error(
      "[AuthLib:callCreateOrUpdateFirestoreUser] Invalid user object provided."
    );
    throw new Error("Usuário inválido fornecido para atualização de perfil.");
  }

  let functionsInstance: Functions;
  try {
    functionsInstance = getInitializedFunctions(); // Use safe getter
  } catch (error: any) {
    console.error(
      "[AuthLib:callCreateOrUpdateFirestoreUser] Failed to get Firebase Functions instance:",
      error
    );
    const mappedMessage = mapFirebaseAuthError(
      error,
      "Functions Service Initialization"
    );
    // Rethrow as a new error to be caught by the caller
    throw new Error(mappedMessage);
  }

  try {
    // Get the httpsCallable function reference
    const createOrUpdateUser = httpsCallable(
      functionsInstance,
      "dbCreateOrUpdateFirestoreUser"
    );

    const functionData: { name?: string } = {};
    if (nameFromSignup) {
      functionData.name = nameFromSignup;
    }

    // Explicitly type the expected response data structure
    const result: HttpsCallableResult<any> = await createOrUpdateUser(
      functionData
    );

    const resultData = result.data as { success?: boolean; message?: string }; // Type assertion

    if (resultData?.success) {
      return {
        success: true,
        message: resultData.message || "User profile updated successfully.",
      };
    } else {
      const failureMsg =
        resultData?.message || "Erro desconhecido retornado pela função.";
      console.error(
        "[AuthLib:callCreateOrUpdateFirestoreUser] Cloud Function reported failure:",
        failureMsg
      );
      // Use a FunctionsError structure for consistency in mapping
      // Check if it's already a FunctionsError structure passed back
      if (
        resultData &&
        typeof resultData === "object" &&
        "code" in resultData
      ) {
        throw new FunctionsError(
          (resultData as any).code || "internal",
          failureMsg
        );
      } else {
        throw new FunctionsError("internal", failureMsg); // Use 'internal' or a more specific code if available
      }
    }
  } catch (error: any) {
    console.error(
      "[AuthLib:callCreateOrUpdateFirestoreUser] Firebase Functions call FAILED:",
      error
    );
    console.error(
      `[AuthLib:callCreateOrUpdateFirestoreUser]  Functions Error Code: ${
        error.code || "N/A"
      }`
    );
    console.error(
      `[AuthLib:callCreateOrUpdateFirestoreUser]  Functions Error Message: ${
        error.message || "No message"
      }`
    );
    // Rethrow the mapped error for the calling function to handle
    const mappedMessage = mapFirebaseAuthError(error, "Cloud Function call");
    throw new Error(`Falha ao atualizar o perfil. ${mappedMessage}`); // Rethrow mapped error
  }
}

// --- Authentication Actions (Client-Side Implementations) ---

/**
 * Handles user login with email and password using Firebase Client SDK.
 * Ensures Firebase Auth is initialized before proceeding.
 * Calls Cloud Function to update profile on success.
 * @param data - Login form data containing email and password.
 * @returns An object indicating success or failure, with user object and idToken on success, and error message on failure.
 */
export async function handleLogin(data: LoginFormData): Promise<{
  success: boolean;
  message: string;
  user?: User;
  idToken?: string;
}> {
  let authInstance: Auth;
  authInstance = getInitializedAuth();

  try {
    // 1. Validate input
    const validation = loginSchema.safeParse(data);
    if (!validation.success) {
      const errorMessage = validation.error.errors
        .map((e) => e.message)
        .join(" ");
      console.error(
        "[AuthLib:handleLoginClient] Input validation failed:",
        errorMessage
      );
      return { success: false, message: errorMessage };
    }
    const validatedData = validation.data;

    // 2. Authenticate
    const userCredential = await signInWithEmailAndPassword(
      authInstance,
      validatedData.email,
      validatedData.password
    );
    const user = userCredential.user;

    // 3. Call Cloud Function to create/update Firestore profile (will throw on failure)
    await callCreateOrUpdateFirestoreUser(user); // No name needed on login

    // 4. Get ID Token - ONLY AFTER successful profile update
    const idToken = await getIdToken(user, /* forceRefresh */ true);

    // 5. Return success with user and token
    return { success: true, message: "Login successful.", user, idToken };
  } catch (error: any) {
    console.error(
      `[AuthLib:handleLoginClient] *** Error during login process ***`,
      error
    );
    // Check if it's a Firestore or Functions error potentially thrown by the helper
    if (error instanceof FirestoreError || error instanceof FunctionsError) {
      // Use FunctionsError here
      // These might be thrown by callCreateOrUpdateUserFunction
      console.error(
        `[AuthLib:handleLoginClient] Caught Firestore/Functions error after login.`
      );
      const mappedMessage = mapFirebaseAuthError(error, "profile update");
      // Prepend the specific context message
      return {
        success: false,
        message: `Login bem-sucedido, mas ${mappedMessage}`,
      };
    }
    // Otherwise, map as a general login error
    const mappedMessage = mapFirebaseAuthError(error, "login");
    return { success: false, message: mappedMessage };
  }
}

/**
 * Handles user signup with email, password, and name using Firebase Client SDK.
 * Ensures Firebase Auth is initialized before proceeding.
 * Validates password strength and checks against common passwords.
 * Calls Cloud Function to create profile on success.
 * @param data - Signup form data.
 * @returns An object indicating success or failure, with user object and idToken on success, and error message on failure.
 */
export async function handleSignup(data: SignupFormData): Promise<{
  success: boolean;
  message: string;
  user?: User;
  idToken?: string;
  redirectPath?: string;
}> {
  let authInstance: Auth;
  authInstance = getInitializedAuth();

  let user: User | null = null;

  try {
    // 1. Validate input
    const validation = signupSchema.safeParse(data);
    if (!validation.success) {
      const errorMessage = validation.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(" ");
      console.error(
        "[AuthLib:handleSignupClient] Input validation failed:",
        errorMessage
      );
      const firstError = validation.error.errors[0];
      if (firstError?.path.includes("confirmPassword"))
        return { success: false, message: firstError.message };
      if (firstError?.path.includes("password"))
        return { success: false, message: `Senha: ${firstError.message}` };
      if (firstError?.path.includes("terms"))
        return { success: false, message: firstError.message };
      return { success: false, message: errorMessage };
    }
    const validatedData = validation.data;

    // 2. Additional Password Checks (Client-side)
    if (COMMON_PASSWORDS.includes(validatedData.password.toLowerCase())) {
      console.error(
        "[AuthLib:handleSignupClient] Password check failed: too common."
      );
      return {
        success: false,
        message:
          "Senha muito comum. Por favor, escolha uma senha mais complexa.",
      };
    }

    // 3. Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      authInstance,
      validatedData.email,
      validatedData.password
    );
    user = userCredential.user;
    await updateProfile(user, {
      displayName: data.name,
    });

    try {
      await sendEmailVerification(user);
      console.info(
        `[AuthLib:handleSignupClient] E-mail de verificação enviado para ${user.email}`
      );
    } catch (verificationError) {
      console.warn(
        `[AuthLib:handleSignupClient] Falha ao enviar e-mail de verificação:`,
        verificationError
      );
    }

    // 4. Call Cloud Function to create Firestore profile (will throw on failure)
    await callCreateOrUpdateFirestoreUser(user, validatedData.name);

    // 5. Get ID Token - ONLY AFTER successful profile creation
    const idToken = await getIdToken(user, /* forceRefresh */ true);

    // 6. Return success with token
    return {
      success: true,
      message: "Signup successful.",
      user,
      idToken,
      redirectPath: "/onboarding",
    };
  } catch (error: any) {
    console.error(
      `[AuthLib:handleSignupClient] *** Error during signup process ***`,
      error
    );

    // Attempt to delete the orphaned Auth user IF the error occurred *after* user creation but before profile creation finished
    const profileUpdateFailed = error.message?.includes(
      "Falha ao atualizar o perfil"
    );
    if (user && profileUpdateFailed && typeof user.delete === "function") {
      // Added check for delete function
      console.warn(
        `[AuthLib:handleSignupClient] Profile creation failed. Attempting to delete orphaned Auth user: ${user.uid}`
      );
      try {
        await user.delete();
      } catch (deleteError: any) {
        console.error(
          `[AuthLib:handleSignupClient] CRITICAL: Failed to delete orphaned Auth user ${user.uid}:`,
          deleteError
        );
      }
    }

    // Map the error (Auth error, Functions error, etc.)
    const mappedMessage = mapFirebaseAuthError(error, "signup");

    // If profile creation failed, prepend context
    if (profileUpdateFailed) {
      return {
        success: false,
        message: `Cadastro bem-sucedido, mas ${mappedMessage}`,
      };
    }
    return { success: false, message: mappedMessage };
  }
}

/**
 * Handles user sign-in using Google provider via a popup (Client-Side).
 * Ensures Firebase Auth and Google Provider are initialized before proceeding.
 * Calls Cloud Function to update profile on success.
 * @returns An object indicating success or failure, with user, idToken, and isNewUser flag on success, and error message on failure.
 */
export async function handleGoogleSignInClient(): Promise<{
  success: boolean;
  message: string;
  user?: User;
  idToken?: string;
  isNewUser?: boolean;
}> {
  let authInstance: Auth;
  let provider: FirebaseGoogleAuthProvider; // Use the aliased type
  authInstance = getInitializedAuth();

  let user: User | null = null;
  let isNewUser = false; // Flag to track if this is a new user sign-up

  try {
    authInstance = getInitializedAuth();
    provider = getInitializedGoogleProvider();
    const result = await signInWithPopup(authInstance, provider);
    user = result.user;

    // Check if the user is new by fetching their profile (best effort)
    // This relies on Firestore access being available immediately after sign-in
    try {
      const profile = await getUserProfile(user.uid); // Use client-side get profile
      isNewUser = !profile; // If profile doesn't exist, assume new user
    } catch (profileError) {
      console.warn(
        `[AuthLib:handleGoogleSignInClient] Could not check user profile after Google sign-in for UID ${user.uid}. Assuming existing user. Error:`,
        profileError
      );
      // Proceed assuming not a new user if profile check fails
      isNewUser = false;
    }

    // Pass display name from Google profile
    await callCreateOrUpdateFirestoreUser(user, user.displayName || undefined);

    // 4. Get ID Token - ONLY AFTER successful profile update
    const idToken = await getIdToken(user, /* forceRefresh */ true);

    // 5. Return success with token and new user flag

    return {
      success: true,
      message: "Google Sign-In successful.",
      user,
      idToken,
      isNewUser,
    };
  } catch (error: any) {
    console.error(
      `[AuthLib:handleGoogleSignInClient] *** Error during Google Sign-In process ***`,
      error
    );

    // Check if it's a Functions error after successful Google sign-in
    const profileUpdateFailed = error.message?.includes(
      "Falha ao atualizar o perfil"
    );
    if (user && profileUpdateFailed) {
      console.warn(
        `[AuthLib:handleGoogleSignInClient] Profile creation/update failed after Google sign-in for UID: ${user.uid}.`
      );
      // Don't delete the Auth user here, as they successfully authenticated with Google
      const mappedMessage = mapFirebaseAuthError(error, "profile update");
      return {
        success: false,
        message: `Google Sign-In bem-sucedido, mas ${mappedMessage}`,
      };
    }

    const mappedMessage = mapFirebaseAuthError(error, "google sign-in");

    return { success: false, message: mappedMessage };
  }
}

/**
 * Handles user logout using the Firebase client SDK.
 * Ensures Firebase Auth is initialized before proceeding.
 * @returns An object indicating success or failure.
 */
export async function handleLogout(): Promise<{
  success: boolean;
  message: string;
}> {
  let authInstance: Auth;
  authInstance = getInitializedAuth();

  try {
    await signOut(authInstance);

    return { success: true, message: "Logout successful." };
  } catch (error: any) {
    console.error(`[AuthLib:handleLogout] Error during logout:`, error);
    const mappedMessage = mapFirebaseAuthError(error, "logout");
    return { success: false, message: mappedMessage };
  }
}

/**
 * Sends a password reset email to the specified address using Firebase client SDK.
 * Ensures Firebase Auth is initialized before proceeding.
 * @param email - The user's email address.
 * @returns An object indicating success or failure.
 */
export async function sendPasswordResetEmailHandler(
  email: string
): Promise<{ success: boolean; message: string }> {
  if (
    !email ||
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    console.error(
      "[AuthLib:sendPasswordResetEmailHandler] Invalid email provided."
    );
    return {
      success: false,
      message: "Por favor, insira um endereço de e-mail válido.",
    };
  }

  let authInstance: Auth;
  authInstance = getInitializedAuth();

  try {
    // Return generic success message for security (don't reveal if email exists)
    return {
      success: true,
      message:
        "Se uma conta com este e-mail existir, um link de redefinição de senha foi enviado.",
    };
  } catch (error: any) {
    console.error(
      `[AuthLib:sendPasswordResetEmailHandler] Firebase error sending reset email:`,
      error
    );
    // Still return generic success for security, but log the mapped error
    const mappedError = mapFirebaseAuthError(error, "password reset email");
    console.warn(
      `[AuthLib:sendPasswordResetEmailHandler] Mapped error (but returning generic success): ${mappedError}`
    );
    return {
      success: true,
      message:
        "Se uma conta com este e-mail existir, um link de redefinição de senha foi enviado.",
    };
  }
}

/**
 * Changes the currently authenticated user's password using Firebase client SDK.
 * Ensures Firebase Auth is initialized before proceeding.
 * Requires recent login for security.
 * @param newPassword - The desired new password.
 * @returns An object indicating success or failure.
 */
export async function handleChangePassword(
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  let authInstance: Auth;
  authInstance = getInitializedAuth();

  const user = authInstance.currentUser;

  if (!user) {
    console.error(
      "[AuthLib:handleChangePassword] Error: No authenticated user found."
    );
    return {
      success: false,
      message:
        "Usuário não autenticado ou sessão expirada. Faça login novamente.",
    };
  }

  // Validate password strength client-side first
  try {
    passwordStrengthSchema.parse(newPassword);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      // Use z from import
      const errorMessage = error.errors.map((e) => e.message).join(" ");
      console.error(
        "[AuthLib:handleChangePassword] New password validation failed:",
        errorMessage
      );
      return { success: false, message: errorMessage };
    }
    console.error(
      "[AuthLib:handleChangePassword] Unexpected validation error:",
      error
    );
    return {
      success: false,
      message: "Erro inesperado na validação da senha.",
    };
  }

  try {
    await updatePassword(user, newPassword);
    return { success: true, message: "Senha atualizada com sucesso." };
  } catch (error: any) {
    console.error(
      `[AuthLib:handleChangePassword] *** Firebase error during password update ***`,
      error
    );
    const mappedMessage = mapFirebaseAuthError(error, "password change");
    return { success: false, message: mappedMessage };
  }
}

// --- Auth State & User Data (Client-Side Focused) ---

/**
 * Gets the currently authenticated user from Firebase Auth (client-side).
 * Returns null if no user is logged in or if Auth is not initialized.
 */
export function getCurrentUser(): User | null {
  if (typeof window === "undefined") {
    console.warn(
      "[AuthLib:getCurrentUser] Attempted to get current user on the server. Returning null."
    );
    return null;
  }

  const authInstance = getInitializedAuth();

  try {
    const user = authInstance.currentUser;

    return user;
  } catch (error: any) {
    console.error(
      "[AuthLib:getCurrentUser] Error getting initialized auth during getCurrentUser:",
      error
    );
    // Don't map here, just return null if auth isn't ready
    return null;
  }
}

/**
 * Fetches user profile data from Firestore based on UID using the CLIENT SDK.
 * @param uid - The user's unique ID.
 * @returns A promise resolving to the user data object or null if not found or on error.
 * @throws Mapped error if Firestore initialization or read fails.
 */
export async function getUserProfile(
  uid: string
): Promise<Record<string, any> | null> {
  if (!uid) {
    console.warn("[AuthLib:getUserProfile] No UID provided.");
    return null;
  }

  let dbInstance: Firestore;
  try {
    dbInstance = getInitializedFirestore();
  } catch (initError: any) {
    console.error(
      "[AuthLib:getUserProfile] Firestore initialization failed:",
      initError
    );
    const mappedMessage = mapFirebaseAuthError(
      initError,
      "Firestore Init for Profile Fetch"
    );
    throw new Error(mappedMessage);
  }

  try {
    const userRef = doc(dbInstance, "users", uid);

    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();

      return userData;
    } else {
      console.warn(`[AuthLib:getUserProfile] No profile found for UID: ${uid}`);
      return null;
    }
  } catch (error: any) {
    console.error(
      `[AuthLib:getUserProfile] Error fetching user profile for UID ${uid}:`,
      error
    );
    // If it's a FirestoreError, map it specifically
    if (error instanceof FirestoreError) {
      const mappedMessage = mapFirebaseAuthError(error, "firestore read");
      throw new Error(mappedMessage);
    }
    // Throw generic error otherwise
    throw new Error("Falha ao buscar perfil do usuário.");
  }
}

/**
 * Subscribes to Firebase Auth state changes (client-side).
 * Ensures Firebase Auth is initialized before attaching the listener.
 * @param callback - Function to be called when the auth state changes.
 * @returns An unsubscribe function. Returns a no-op function if initialization fails.
 */
export function setupOnAuthStateChangedListener(
  callback: (user: User | null) => void
): () => void {
  try {
    // Use the safe getter, which will throw if Auth isn't initialized
    const authInstance = getInitializedAuth();

    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      callback(user);
    });

    return unsubscribe;
  } catch (error: any) {
    console.error(
      "[AuthLib:setupOnAuthStateChangedListener] Error during listener setup:",
      error
    );
    // Do not map error here, the getter already throws mapped error if critical
    return () => {
      console.warn(
        "[AuthLib:setupOnAuthStateChangedListener] Unsubscribe called, but listener setup failed."
      );
    };
  }
}

// --- Utility ---
export function isStrongPassword(password: string): boolean {
  try {
    passwordStrengthSchema.parse(password);
    return !COMMON_PASSWORDS.includes(password.toLowerCase());
  } catch (error) {
    return false;
  }
}

// --- Password Hashing/Encryption ---
// NO NEED TO HASH PASSWORDS MANUALLY. Firebase handles secure storage.
