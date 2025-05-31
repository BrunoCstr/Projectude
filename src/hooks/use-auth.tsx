"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { setupOnAuthStateChangedListener } from "@/lib/auth";
import { getInitializedFirestore } from "@/lib/firebase";
import { doc, onSnapshot, Unsubscribe } from "firebase/firestore";
import type { User } from "firebase/auth";

interface UserData {
  currentPlan: string;
  subscriptionId: string;
  displayName: string;
  email: string;
  uid: string;
  photoURL: string | null;
  address?: {
    city?: string;
    country?: string;
    neighborhood?: string;
    state?: string;
    street?: string;
  };
  billingFrequency?: string | null;
  username?: string;
  socialLinks?: any;
  tags?: any;
  bio?: string;
  preferences?: any;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  userData: UserData | null;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  isAuthenticated: false,
  userData: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: false,
    isAuthenticated: false,
    userData: null,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const db = getInitializedFirestore();
    let unsubscribeSnapshot: Unsubscribe | null = null;

    // 1) Listener de autenticação
    const unsubscribeAuth = setupOnAuthStateChangedListener((user) => {
      // sempre que o usuário mudar, cancele o snapshot anterior
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (user) {
        // define o usuário (e limpa userData antes de carregar do Firestore)
        setAuthState({
          user,
          loading: false,
          isAuthenticated: true,
          userData: null,
        });

        // 2) Inicia o snapshot dos dados do profile
        const userRef = doc(db, "users", user.uid);
        unsubscribeSnapshot = onSnapshot(
          userRef,
          (snapshot) => {
            const data = snapshot.data();
            if (data) {
              setAuthState((prev) => ({
                ...prev,
                userData: {
                  currentPlan: data.currentPlan,
                  subscriptionId: data.subscriptionId,
                  displayName: data.displayName,
                  email: data.email,
                  uid: data.uid,
                  photoURL: data.photoURL,

                  // novos campos:
                  username: data.username ?? "",
                  address: {
                    country: data.address?.country ?? "",
                    state: data.address?.state ?? "",
                    city: data.address?.city ?? "",
                    neighborhood: data.address?.neighborhood ?? "",
                    street: data.address?.street ?? "",
                  },

                  bio: data.bio ?? "",
                  socialLinks: Array.isArray(data.socialLinks)
                    ? data.socialLinks.map((link: any) => ({
                        id: link.id ?? "",
                        iconKey: link.iconKey ?? "",
                        url: link.url ?? "",
                      }))
                    : [],
                    
                  tags: {
                    hobbies: data.tags?.hobbies ?? [],
                    skills: data.tags?.skills ?? [],
                    education: data.tags?.education ?? [],
                  },
                  preferences: {
                    currency: data.preferences?.currency ?? "USD",
                    language: data.preferences?.language ?? "en",
                  },
                  billingFrequency: data.billingFrequency ?? ""
                },
              }));
            }
          },
          (error) => {
            console.error("Erro no snapshot de usuário:", error);
          }
        );
      } else {
        // logout
        setAuthState({
          user: null,
          loading: false,
          isAuthenticated: false,
          userData: null,
        });
      }
    });

    // Cleanup: cancela ambos os listeners
    return () => {
      unsubscribeAuth();
      unsubscribeSnapshot?.();
    };
  }, []);

  return (
    <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
