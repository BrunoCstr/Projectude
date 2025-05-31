'use server';

import { cookies } from 'next/headers';
import { admin } from "@/lib/firebase-admin";
import { redirect } from "next/navigation";

const SESSION_COOKIE_NAME = 'projectude-session';
const SESSION_DURATION_DAYS = 5;
const SESSION_EXPIRES_IN_MS = 60 * 60 * 24 * SESSION_DURATION_DAYS * 1000;

/**
 * Cria o cookie da sessão com o ID token obtido pelo Firebase Client SDK.
 */
export async function createSessionCookie(idToken: string): Promise<void> {
  if (!idToken) {
    throw new Error('Cannot create session with invalid ID token.');
  }

  const sessionCookie = await admin.auth().createSessionCookie(idToken, {
    expiresIn: SESSION_EXPIRES_IN_MS,
  });

  const cookieStore = await cookies();

  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: sessionCookie,
    maxAge: SESSION_EXPIRES_IN_MS / 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
  });
}

/**
 * Limpa o cookie de sessão (logout).
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Verifica a sessão com segurança usando o Firebase Admin SDK.
 */
export async function verifySessionCookie(): Promise<{ uid: string } | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) return null;

  try {
    const decodedToken = await admin.auth().verifySessionCookie(sessionCookie, true);
    return { uid: decodedToken.uid };
  } catch (error: any) {
    if (
      ['auth/session-cookie-expired', 'auth/invalid-session-cookie'].includes(error.code)
    ) {
      await clearSessionCookie();
    }
    return null;
  }
}

/**
 * Verifica se o usuário está autenticado. Deve ser usado em layouts/pages protegidas.
 */
export async function requireAuth() {
  const user = await verifySessionCookie();
  
  if (!user) {
    redirect("/login");
  }
  
  return user;
}
