import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";
import { mapFirebaseAuthError } from "@/lib/auth-errors";
import { revalidatePath } from "next/cache";

const SESSION_COOKIE_NAME = "projectude-session";
const SESSION_DURATION_DAYS = 5;
const SESSION_EXPIRES_IN_MS = 60 * 60 * 24 * SESSION_DURATION_DAYS * 1000;

export async function POST(req: NextRequest) {
  console.log("[API] /api/session/login - Início da rota");

  console.log("projectId:", process.env.FIREBASE_PROJECT_ID);
  console.log("clientEmail:", process.env.FIREBASE_CLIENT_EMAIL);
  console.log(
    "privateKey starts with:",
    process.env.FIREBASE_PRIVATE_KEY?.slice(0, 30)
  );

  try {
    const { idToken } = await req.json();

    if (!idToken) {
      console.error("[API] ID token ausente");
      return NextResponse.json(
        {
          success: false,
          message: "ID token é obrigatório para criar a sessão.",
        },
        { status: 400 }
      );
    }

    console.log("[API] ID Token recebido, tentando criar cookie de sessão...");

    const sessionCookie = await admin.auth().createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRES_IN_MS,
    });

    console.log("[API] Session cookie criado com sucesso");

    const response = NextResponse.json({
      success: true,
      message: "Sessão criada com sucesso.",
    });

    response.headers.set(
      "Set-Cookie",
      `${SESSION_COOKIE_NAME}=${sessionCookie}; Max-Age=${
        SESSION_EXPIRES_IN_MS / 1000
      }; Path=/; HttpOnly; ${
        process.env.NODE_ENV === "production" ? "Secure;" : ""
      } SameSite=Lax`
    );

    revalidatePath("/");

    return response;
  } catch (error: any) {
    console.error("[API] Erro ao criar sessão:", error);
    const mappedMessage = mapFirebaseAuthError(error, "session creation API");

    return NextResponse.json(
      {
        success: false,
        message: `Erro ao criar sessão no servidor: ${mappedMessage}`,
      },
      { status: 500 }
    );
  }
}
