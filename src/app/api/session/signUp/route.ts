import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";
import { mapFirebaseAuthError } from "@/lib/auth-errors";
import { revalidatePath } from "next/cache";

const SESSION_COOKIE_NAME = 'projectude-session';
const SESSION_DURATION_DAYS = 5;
const SESSION_EXPIRES_IN_MS = 60 * 60 * 24 * SESSION_DURATION_DAYS * 1000;

export async function POST(req: NextRequest) {
  console.log("[API] /api/session/signup - Início da rota");

  try {
    const { idToken } = await req.json();
    console.log("[API] Body recebido:", { idToken });

    if (!idToken) {
      console.error("[API] ID token ausente após signup.");
      return NextResponse.json(
        {
          success: false,
          message: "Cadastro bem-sucedido, mas token de sessão não fornecido.",
        },
        { status: 400 }
      );
    }

    console.log("[API] ID Token recebido, tentando criar sessão...");

    const sessionCookie = await admin.auth().createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRES_IN_MS,
    });

    console.log("[API] Session cookie criado com sucesso");

    const response = NextResponse.json({
      success: true,
      message: "Sessão criada com sucesso.",
      redirectPath: "/onboarding",
    });

    response.headers.set(
      "Set-Cookie",
      `${SESSION_COOKIE_NAME}=${sessionCookie}; Max-Age=${SESSION_EXPIRES_IN_MS / 1000}; Path=/; HttpOnly; ${
        process.env.NODE_ENV === "production" ? "Secure;" : ""
      } SameSite=Lax`
    );

    revalidatePath("/");

    // ✅ ESSENCIAL: return response
    return response;

  } catch (error: any) {
    console.error("[API] Erro ao criar sessão após signup:", error);
    const mappedMessage = mapFirebaseAuthError(error, "session creation after signup");

    // ✅ ESSENCIAL: return erro também
    return NextResponse.json(
      {
        success: false,
        message: `Cadastro bem-sucedido, mas falha ao criar sessão: ${mappedMessage}`,
      },
      { status: 500 }
    );
  }
}
