"use client";

import { doc, updateDoc } from "firebase/firestore";
import { updateProfile, updateEmail } from "firebase/auth";
import { sendPasswordResetEmail } from "firebase/auth";
import { getInitializedFirestore } from "@/lib/firebase";
import { getInitializedAuth } from "@/lib/firebase";

const db = getInitializedFirestore();
const auth = getInitializedAuth();

type Preferences = {
  language: string;
  currency: string;
};

export interface UserPreferences {
  preferences: Preferences;
}

export async function updateUserProfile(
  uid: string,
  data: {
    name: string;
    username: string;
    email: string;
    address: {
      country: string;
      state: string;
      city: string;
      neighborhood: string;
      street: string;
    };
  }
) {
  if (!uid) {
    throw new Error("Usuário não autenticado.");
  }

  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    displayName: data.name,
    username: data.username,
    email: data.email,
    address: data.address,
  });

  // 2) Atualiza o profile no Firebase Auth
  const currentUser = auth.currentUser;
  if (currentUser) {
    await updateProfile(currentUser, {
      displayName: data.name,
    });
  }
}

export async function savePreferences(uid: string, data: UserPreferences) {
  if (!uid) {
    throw new Error("Usuário não autenticado.");
  }

  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      preferences: {
        currency: data.preferences.currency,
        language: data.preferences.language,
      },
    });
  } catch (error) {
    console.error(error);
  }
}

/**
 * Envia um e-mail de redefinição de senha para o usuário.
 *
 * @param email O e-mail cadastrado do usuário que vai receber a redefinição.
 * @throws Lança erro do Firebase Auth (AuthError) em caso de falha.
 */
export async function sendUserPasswordResetEmail(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    // opcional: trate códigos específicos, ex: 'auth/user-not-found', 'auth/invalid-email'
    if (error) {
      console.error("Firebase Auth error sending reset email:", error);
    } else {
      console.error("Unexpected error sending reset email:", error);
    }
    throw error;
  }
}
