import { https } from "firebase-functions/v2";
import { CallableRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { db, auth } from "./config"; // Certifique-se de que 'auth' é admin.auth()

export const dbCreateOrUpdateFirestoreUser = https.onCall(
  async (request: CallableRequest<any>) => {
    const { data, auth: context } = request;

    console.log("[Function] Triggered with data:", data);

    // Verificação de autenticação
    if (!context) {
      console.error("[Function] Unauthenticated call.");
      throw new https.HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }

    const uid = context.uid;

    // Obter dados do usuário do Firebase Auth
    let authUser;
    try {
      authUser = await auth.getUser(uid);
    } catch (error: any) {
      console.error("Erro ao buscar usuário:", error);
      throw new https.HttpsError(
        "internal",
        `Erro ao buscar usuário: ${error.message}`,
        { code: error.code }
      );
    }

    const userEmail = authUser.email;
    const nameFromSignup = data?.name;
    const userRef = db.collection("users").doc(uid);

    try {
      const docSnap = await userRef.get();
      const isNewUser = !docSnap.exists;
      const existingData = docSnap.data();

      const name =
        nameFromSignup?.trim() ||
        authUser.displayName?.trim() ||
        existingData?.name ||
        userEmail?.split("@")[0] ||
        `User_${uid.substring(0, 5)}`;

      const displayName =
        authUser.displayName?.trim() ||
        nameFromSignup?.trim() ||
        existingData?.displayName ||
        name;

      let photoURLToSave: string | null = existingData?.photoURL ?? null;

      if (authUser.photoURL && authUser.photoURL !== existingData?.photoURL) {
        photoURLToSave = authUser.photoURL;
      }

      const userData: Record<string, any> = {
        uid,
        email: userEmail,
        name,
        displayName,
        photoURL: photoURLToSave,
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (isNewUser) {
        userData.createdAt = admin.firestore.FieldValue.serverTimestamp();
        userData.currentPlan = "Free";
        userData.billingFrequency = null;
        userData.onboardingComplete = false;

        userData.notificationPreferences = {
          invite: true,
          comment_update: true,
          comment_reply: true,
          comment_status: true,
          marketing: true,
        };
      } else {
        userData.currentPlan = existingData?.currentPlan ?? "Free";
        userData.billingFrequency = existingData?.billingFrequency ?? null;
        userData.onboardingComplete = existingData?.onboardingComplete ?? false;
      }

      await userRef.set(userData, { merge: true });

      return {
        success: true,
        message: "User profile created/updated successfully.",
      };
    } catch (error: any) {
      console.error("Erro ao criar/atualizar documento:", error);
      throw new https.HttpsError(
        "internal",
        `Erro ao salvar dados: ${error.message}`,
        { code: error.code, uid }
      );
    }
  }
);
