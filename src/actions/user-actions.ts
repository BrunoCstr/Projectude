"use server";

import { adminDb } from '@/lib/firebase-admin'; // Import Firestore and Auth
import admin from 'firebase-admin';

// Define the expected structure of the onboarding data
interface OnboardingData {
  phone?: string;
  country: string;
  state: string;
  city: string;
  userType: string;
}

/**
 * Server action to update user data after onboarding.
 * @param data The onboarding data collected from the forms.
 * @returns An object indicating success or failure.
 */
export async function updateUserOnboardingData(
  userId: string,
  data: OnboardingData
): Promise<{ success: boolean; message: string }> {
  // Get the currently logged-in user
  // Note: In server actions, relying on firebaseAuth.currentUser is tricky.
  // A better approach in a real app might involve verifying the session cookie
  // and getting the UID from the verified token.
  // For this example, we'll *simulate* getting the user, but this needs refinement.

  // --- Authentication Check (Crucial for Production) ---
  if (!userId) {
    console.error("Update onboarding error: User not authenticated.");
    // Try verifying session cookie as a fallback (requires Admin SDK or separate endpoint)
    // const verifiedUser = await verifySessionCookie();
    // if (!verifiedUser) {
    return {
      success: false,
      message: "Usuário não autenticado. Faça login novamente.",
    };
    // }
    // userId = verifiedUser.uid; // Get UID from verified token
  } // Use UID from the (potentially simulated) user object

  if (!userId) {
    return {
      success: false,
      message: "Não foi possível identificar o usuário.",
    };
  }

  const userRef = adminDb.collection('users').doc(userId);

  try {
    // Check if the user document exists (optional, but good practice)
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      console.error(`Usuário não encontrado: ${userId}`);
      return { success: false, message: 'Perfil de usuário não encontrado.' };
    }

    // Update the user document with onboarding data and mark as complete
    await userRef.update({
      phone:               data.phone ?? null,
      address: {
        country: data.country,
        state:   data.state,
        city:    data.city,
      },
      userType:           data.userType,
      onboardingComplete: true,
      updatedAt:          admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, message: "Informações salvas com sucesso!" };
  } catch (error) {
    console.error("Error updating user onboarding data:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
    return {
      success: false,
      message: `Falha ao salvar informações: ${errorMessage}`,
    };
  }
}
