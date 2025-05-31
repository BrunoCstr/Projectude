"use server";
// src/actions/auth-actions.ts

import { FirebaseError } from "firebase/app"; // Import FirebaseError
import { createSessionCookie, clearSessionCookie } from "@/lib/session";
// Import handlers from lib/auth which contain Firebase client-SDK logic
import {
  handleLogin as handleLoginLib, // Corrected import name
  handleSignup as handleSignupLib, // Use client version for signup action - Corrected alias
  handleLogout as handleLogoutLib, // Use client version for logout action - Corrected alias
  handleGoogleSignInClient as handleGoogleSignInLib, // Use client version for Google Sign-In
  handleChangePassword as handleChangePasswordLib, // Corrected import alias
  sendPasswordResetEmailHandler as sendPasswordResetEmailLib,
  getUserProfile as getUserProfileLib, // Import function to check profile
} from "@/lib/auth";
import { mapFirebaseAuthError } from "@/lib/auth-errors"; // Import the error mapping function
import type {
  LoginFormData,
  SignupFormData,
  PasswordChangeFormData,
} from "@/lib/schemas"; // Added PasswordChangeFormData
import type { User } from "firebase/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation"; // Import redirect

// Define SESSION_COOKIE_NAME and SESSION_EXPIRES_IN_MS appropriately
const SESSION_DURATION_DAYS = 5;
const SESSION_EXPIRES_IN_MS = 60 * 60 * 24 * SESSION_DURATION_DAYS * 1000;

/**
 * Server action to create a session cookie using a Firebase ID token.
 * Accepts the Firebase ID token string directly from client-side auth results.
 * @param idToken - The Firebase ID token string obtained from the client.
 * @returns An object indicating success or failure.
 * @throws Error if session creation fails server-side.
 */
export async function handleSessionLogin(
  idToken: string
): Promise<{ success: boolean; message: string }> {
  if (!idToken) {
    console.error(
      "[AuthAction:handleSessionLogin] Validation failed: ID token missing."
    );
    // Return failure, don't throw here, let the client handle UI.
    return {
      success: false,
      message: "ID token é obrigatório para criar a sessão.",
    };
  }

  try {
    // createSessionCookie (server-side) handles the actual secure cookie creation
    await createSessionCookie(idToken);
    revalidatePath("/", "layout"); // Revalidate relevant paths
    return { success: true, message: "Sessão criada com sucesso." };
  } catch (error: any) {
    console.error(
      "[AuthAction:handleSessionLogin] Error during server-side session cookie creation:",
      error
    );
    // Map error if possible, otherwise use generic message
    const mappedMessage = mapFirebaseAuthError(
      error,
      "session creation action"
    );
    return {
      success: false,
      message: `Falha ao criar sessão no servidor: ${mappedMessage}`,
    };
  }
}

/**
 * Server action to handle user signup.
 * **IMPORTANT:** This action now only orchestrates the server-side session creation
 * AFTER the client-side `handleSignup` function succeeds and provides an ID token.
 * It does NOT perform the signup itself.
 * @param data - Signup form data (used primarily for potential logging, not direct auth).
 * @param idToken - The ID token obtained after successful client-side signup.
 * @returns An object indicating success or failure of session creation.
 * @throws Redirect error if session creation succeeds.
 */
export async function handleSessionSignup(
  data: SignupFormData,
  idToken: string
): Promise<{
  success: boolean;
  message: string;
  redirectPath?: string;
}> {
  if (!idToken) {
    console.error(
      "[AuthAction:handleSessionSignup] ID token missing after signup. Cannot create session."
    );
    return {
      success: false,
      message: "Cadastro bem-sucedido, mas token de sessão não fornecido.",
    };
  }

  try {
    await createSessionCookie(idToken);

    // Revalida a rota raiz (ou qualquer outra que precise ser atualizada)
    revalidatePath("/");

    // Em vez de redirect(),retorne o redirectPath para o cliente cuidar da navegação
    return {
      success: true,
      message: "Sessão criada com sucesso.",
      redirectPath: "/onboarding",
    };
  } catch (error: any) {
    console.error(
      "[AuthAction:handleSessionSignup] Error during session creation after signup:",
      error
    );
    const mappedMessage = mapFirebaseAuthError(
      error,
      "session creation after signup"
    );
    return {
      success: false,
      message: `Cadastro bem-sucedido, mas falha ao criar sessão: ${mappedMessage}`,
    };
  }
}

/**
 * Server action to handle session creation after Google Sign-In.
 * Similar to signup, this only handles the server-side session part.
 * @param idToken - The ID token obtained after successful client-side Google Sign-In.
 * @param isNewUser - Flag indicating if the user was newly created via Google Sign-In.
 * @returns An object indicating success or failure of session creation.
 * @throws Redirect error if session creation succeeds.
 */
export async function handleGoogleSessionLogin(
  idToken: string,
  isNewUser: boolean
): Promise<{ success: boolean; message: string }> {
  if (!idToken) {
    console.error(
      "[AuthAction:handleGoogleSessionLogin] ID token missing after Google Sign-In."
    );
    return {
      success: false,
      message:
        "Google Sign-In bem-sucedido, mas token de sessão não fornecido.",
    };
  }

  try {
    await createSessionCookie(idToken); // Create session with the token
    revalidatePath("/", "layout");

    // Redirect based on whether it was a new user or existing user
    const redirectTarget = isNewUser ? "/onboarding" : "/dashboard";

    redirect(redirectTarget); // Redirect to appropriate page - THIS WILL THROW
  } catch (error: any) {
    console.error(
      "[AuthAction:handleGoogleSessionLogin] Error during session creation after Google Sign-In:",
      error
    );
    const mappedMessage = mapFirebaseAuthError(
      error,
      "session creation after google sign-in"
    );
    return {
      success: false,
      message: `Google Sign-In bem-sucedido, mas falha ao criar sessão: ${mappedMessage}`,
    };
  }
}

/**
 * Server action to handle user logout. Clears the server-side session cookie.
 * Client-side logout should be handled separately.
 */
export async function logoutAction(): Promise<void> {
  try {
    await clearSessionCookie(); // Only clear the server-side cookie

    // Client-side sign out (e.g., clearing local state, redirecting)
    // should be triggered separately in the client component after this action returns.
  } catch (error: any) {
    // Log error but don't prevent redirect if clearing fails
    console.error(
      "[AuthAction:logoutAction] Error clearing session cookie during logout:",
      error
    );
  } finally {
    // Always revalidate and redirect after attempting to clear the cookie
    revalidatePath("/", "layout");
  }
}

/**
 * Server action for handling password change requests.
 * **DEPRECATED/REMOVED:** Password changes requiring current password or relying
 * on `auth.currentUser` should be handled purely client-side using `handleChangePassword`
 * from `lib/auth.ts` because Firebase requires recent authentication which cannot
 * be reliably guaranteed or passed through a Server Action securely.
 * This action is removed to avoid confusion and promote the correct client-side approach.
 */
// export async function changePasswordAction(...) { ... } // REMOVED

/**
 * Server action for handling password reset email requests.
 * This action calls the underlying client-side library function, which is okay
 * as `sendPasswordResetEmail` doesn't require the user to be authenticated.
 */
export async function sendPasswordResetEmailAction(
  email: string
): Promise<{ success: boolean; message: string }> {
  if (!email) {
    return { success: false, message: "Email é obrigatório." };
  }
  try {
    // Call the client-side library function
    // sendPasswordResetEmailLib handles the Firebase call
    const result = await sendPasswordResetEmailLib(email);
    // Return the result (which should include the generic success message for security)
    return result;
  } catch (error: any) {
    // This catch block might be redundant if sendPasswordResetEmailLib already catches
    // and returns a generic success message, but added for robustness.
    // Return the generic success message even on unexpected errors for security
    return {
      success: true,
      message:
        "Se uma conta com este e-mail existir, um link de redefinição de senha será enviado.",
    };
  }
}

// Note: Removed `changePasswordAction` as it's better handled client-side due to Firebase's
// requirement for recent authentication (`auth/requires-recent-login`).
// The `handleChangePassword` function in `lib/auth.ts` should be called directly from a client component.
