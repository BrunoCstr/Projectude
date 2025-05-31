// src/lib/auth-errors.ts
import { AuthErrorCodes } from "firebase/auth";
import { FirestoreError } from "firebase/firestore";
import { FunctionsError } from "firebase/functions"; // Corrected import

/**
 * Maps Firebase Auth/Firestore/Functions error codes to user-friendly messages.
 * @param error - The error object from Firebase Auth/Firestore/Functions.
 * @param context - Optional context ('login', 'signup', 'firestore write', 'Cloud Function call', etc.) for more specific messages.
 * @returns A user-friendly error message string.
 */
export function mapFirebaseAuthError(error: any, context?: string): string {
  const errorCode = error?.code;
  const errorMessage = error?.message;
  const opContext = context || "operação"; // Default context for messages

  // --- Initialization Errors (High Priority) ---
  if (
    errorMessage?.includes("Firebase App is not initialized") ||
    (errorCode === "auth/internal-error" &&
      errorMessage?.includes("initialize")) ||
    (errorCode === "invalid-argument" &&
      errorMessage?.includes("FirebaseApp instance"))
  ) {
    console.error(
      `[AuthErrorMap] FATAL: Firebase App Initialization Error during ${opContext}.`,
      error
    );
    return `Erro fatal: Serviço do Firebase não pôde ser inicializado corretamente. Detalhes: ${
      errorMessage || errorCode
    }`; // Include original message or code
  }
  // Explicit check for Auth service unavailable message
  if (
    errorMessage?.includes("Auth service unavailable") ||
    errorCode === "auth/auth-domain-config-required" ||
    errorCode === "auth/app-not-authorized" ||
    errorCode === "auth/invalid-api-key" ||
    errorMessage?.includes("auth service is unavailable")
  ) {
    console.error(
      `[AuthErrorMap] FATAL: Firebase Auth Service Initialization Error during ${opContext}. Code: ${errorCode}`,
      error
    );
    return `Erro fatal: Serviço de autenticação não pôde ser inicializado. Verifique a configuração e as chaves de API do Firebase. Detalhes: ${
      errorMessage || errorCode
    }`;
  }
  // Explicit check for Firestore service unavailable message
  if (
    errorMessage?.includes("Firestore service unavailable") ||
    errorCode === "firestore/unavailable" ||
    (errorCode === "unavailable" && opContext?.includes("firestore"))
  ) {
    console.error(
      `[AuthErrorMap] FATAL: Firebase Firestore Service Initialization or Connection Error during ${opContext}. Code: ${errorCode}`,
      error
    );
    return `Erro fatal: Serviço Firestore não pôde ser inicializado ou está indisponível. Verifique a conexão ou o status do serviço. Detalhes: ${
      errorMessage || errorCode
    }`;
  }
  // Explicit check for Functions service unavailable message
  if (
    errorMessage?.includes("Functions service unavailable") ||
    errorCode === "functions/unavailable" ||
    (errorCode === "unavailable" && opContext?.includes("function"))
  ) {
    console.error(
      `[AuthErrorMap] FATAL: Firebase Functions Service Initialization or Connection Error during ${opContext}. Code: ${errorCode}`,
      error
    );
    return `Erro fatal: Serviço Functions não pôde ser inicializado ou está indisponível. Verifique a conexão ou o status do serviço. Detalhes: ${
      errorMessage || errorCode
    }`;
  }
  // Explicit catch-all for other generic initialization-like issues
  if (
    errorCode === "auth/internal-error" &&
    errorMessage?.includes("Auth is not initialized")
  ) {
    console.error(
      `[AuthErrorMap] FATAL: Firebase Auth Initialization Error during ${opContext} (explicit "not initialized" message). Code: ${errorCode}`,
      error
    );
    return `Erro fatal: Serviço de autenticação não pôde ser inicializado.`;
  }
  // Handle the specific error "Firebase client SDK cannot be initialized properly"
  if (
    errorMessage?.includes("Firebase client SDK cannot be initialized properly")
  ) {
    console.error(
      `[AuthErrorMap] FATAL: Firebase client SDK initialization issue during ${opContext}.`,
      error
    );
    return `Erro fatal: Serviço de autenticação não pôde ser inicializado. Detalhes: Firebase client SDK cannot be initialized properly.`;
  }
  // Handle the specific error "Firebase client SDK cannot be initialized server-side"
  if (
    errorMessage?.includes(
      "Firebase client SDK cannot be initialized server-side"
    )
  ) {
    console.error(
      `[AuthErrorMap] FATAL: Attempted client SDK init on server during ${opContext}.`,
      error
    );
    return `Erro fatal: Serviço de autenticação não pôde ser inicializado. Detalhes: Firebase client SDK cannot be initialized server-side.`;
  }

  // --- Specific Service Errors ---

  // Firestore Error Mapping
  if (error instanceof FirestoreError || errorCode?.startsWith("firestore/")) {
    console.warn(
      `[AuthErrorMap] Firestore error detected (Code: ${errorCode}) during ${opContext}`
    );
    const operationDesc =
      context === "profile update" || context === "profile creation"
        ? "atualizar/criar o perfil"
        : "operação no banco de dados";
    switch (errorCode) {
      case "permission-denied":
        console.error(
          "[AuthErrorMap] FIRESTORE PERMISSION DENIED. Check firestore.rules."
        );
        return `Permissão negada para ${operationDesc}. Verifique as regras de segurança do Firestore.`;
      case "unavailable":
        console.error(
          `[AuthErrorMap] Firestore Network/Availability error (Code: ${errorCode}). Check Firebase status and connectivity.`
        );
        // Check if running locally and suggest emulator check
        if (
          process.env.NODE_ENV === "development" &&
          typeof window !== "undefined" &&
          window.location.hostname === "localhost"
        ) {
          return `Falha na conexão com o banco de dados. Verifique sua conexão e se os emuladores do Firebase (Firestore) estão rodando. (${errorCode})`;
        }
        return `Falha na conexão com o banco de dados. Verifique sua conexão e tente novamente. (${errorCode})`;
      case "cancelled":
      case "deadline-exceeded":
        console.error(
          `[AuthErrorMap] Firestore Network/Timeout error (Code: ${errorCode}).`
        );
        return `Tempo limite excedido ao conectar ao banco de dados. Verifique sua conexão. (${errorCode})`;
      case "internal":
        console.error(
          `[AuthErrorMap] Firestore Internal error (Code: ${errorCode}).`
        );
        return `Erro interno do banco de dados. Tente novamente mais tarde. (${errorCode})`;
      case "failed-precondition":
        console.error(
          `[AuthErrorMap] Firestore Failed Precondition (Code: ${errorCode}). Check rules/indexes/data state.`
        );
        return `Falha na operação do banco de dados (${errorCode}). Verifique as regras ou configuração.`;
      case "resource-exhausted":
        console.error(
          `[AuthErrorMap] Firestore Resource Exhausted (Code: ${errorCode}). Check quota.`
        );
        return `Recursos do banco de dados excedidos. (${errorCode})`;
      default:
        // Specific check for offline message
        if (
          errorMessage?.toLowerCase().includes("offline") ||
          errorMessage
            ?.toLowerCase()
            .includes("failed to get document because the client is offline")
        ) {
          console.error(
            `[AuthErrorMap] Firestore Offline error detected: ${errorMessage}`
          );
          return "Falha na conexão com o banco de dados. Verifique sua conexão e tente novamente.";
        }
        if (errorMessage?.toLowerCase().includes("network")) {
          console.error(
            `[AuthErrorMap] Network-related Firestore error message detected: ${errorMessage}`
          );
          if (
            process.env.NODE_ENV === "development" &&
            typeof window !== "undefined" &&
            window.location.hostname === "localhost"
          ) {
            return "Falha na conexão de rede ao acessar o banco de dados. Verifique sua conexão e se os emuladores do Firebase (Firestore) estão rodando.";
          }
          return "Falha na conexão de rede ao acessar o banco de dados. Verifique sua conexão.";
        }
        console.warn(
          `[AuthErrorMap] UNHANDLED Firestore error code: ${
            errorCode || "Unknown"
          }.`
        );
        return `Falha ao ${operationDesc}. Verifique sua conexão ou as permissões do banco.`;
    }
  }

  // Firebase Functions (HTTPS Callable) Error Mapping - Check instanceof AND error code
  if (error instanceof FunctionsError || errorCode?.startsWith("functions/")) {
    // Use FunctionsError here
    console.warn(
      `[AuthErrorMap] Firebase Functions error detected (Code: ${errorCode}) during ${opContext}`
    );

    switch (errorCode) {
      case "unauthenticated":
        return "Autenticação necessária para esta operação. Faça login novamente.";
      case "permission-denied":
        return "Permissão negada para executar esta operação.";
      case "not-found":
        return "Recurso não encontrado durante cloud function call. Verifique o nome da função."; // Specific message for 'not-found'
      case "cancelled":
        return "A operação foi cancelada.";
      case "deadline-exceeded":
        return "Tempo limite excedido ao chamar a função. Verifique sua conexão.";
      case "unavailable":
        console.error(
          `[AuthErrorMap] Firebase Functions Service Unavailable (Code: ${errorCode}). Check function status/region.`
        );
        // Check if running locally and suggest emulator check
        if (
          process.env.NODE_ENV === "development" &&
          typeof window !== "undefined" &&
          window.location.hostname === "localhost"
        ) {
          return `O serviço de funções está indisponível. Verifique se os emuladores do Firebase (Functions) estão rodando. (${errorCode})`;
        }
        return "O serviço está temporariamente indisponível. Tente novamente mais tarde.";
      case "internal":
        return "Ocorreu um erro interno no servidor da função. Tente novamente mais tarde.";
      case "invalid-argument":
        return "Dados inválidos enviados para a função.";
      case "already-exists":
        return "O recurso que você está tentando criar já existe.";
      case "aborted":
        return "A operação foi abortada, possivelmente devido a um problema simultâneo.";
      case "data-loss":
        return "Ocorreu uma perda de dados irrecuperável ou corrupção.";
      case "failed-precondition":
        return "A operação foi rejeitada porque o sistema não está no estado necessário.";
      case "out-of-range":
        return "A operação foi tentada fora de um intervalo válido.";
      case "resource-exhausted":
        return "Recursos esgotados, como cota excedida.";
      case "unimplemented":
        return "A operação não está implementada ou não é suportada.";
      case "unknown":
      default:
        console.warn(
          `[AuthErrorMap] UNHANDLED Firebase Functions error code: ${
            errorCode || "Unknown"
          }.`
        );
        if (
          errorMessage?.toLowerCase().includes("network error") ||
          errorMessage?.toLowerCase().includes("fetch failed")
        ) {
          if (
            process.env.NODE_ENV === "development" &&
            typeof window !== "undefined" &&
            window.location.hostname === "localhost"
          ) {
            return `Erro de rede ao chamar a função. Verifique sua conexão e se os emuladores do Firebase (Functions) estão rodando. (${
              errorCode || "unknown"
            })`;
          }
          return `Erro de rede ao chamar a função (${
            errorCode || "unknown"
          }). Tente novamente.`;
        }
        return `Erro na comunicação com o servidor (${
          errorCode || "unknown"
        }). Tente novamente.`;
    }
  }

  // Firebase Auth Error Mapping
  if (
    errorCode &&
    typeof errorCode === "string" &&
    errorCode.startsWith("auth/")
  ) {
    switch (errorCode) {
      case AuthErrorCodes.INVALID_EMAIL:
        return "Formato de e-mail inválido.";
      case AuthErrorCodes.USER_DISABLED:
        return "Esta conta de usuário foi desativada.";
      case AuthErrorCodes.USER_DELETED: // User not found
        return "Nenhuma conta encontrada com este e-mail.";
      case AuthErrorCodes.INVALID_PASSWORD: // Deprecated, use INVALID_LOGIN_CREDENTIALS
      case AuthErrorCodes.INVALID_LOGIN_CREDENTIALS:
        return "E-mail ou senha inválidos.";
      case AuthErrorCodes.EMAIL_EXISTS:
        return "Já existe uma conta com este endereço de e-mail.";
      case AuthErrorCodes.WEAK_PASSWORD:
        return "A senha é muito fraca. Certifique-se de que atende a todos os requisitos.";
      case AuthErrorCodes.CREDENTIAL_TOO_OLD_LOGIN_AGAIN:
        return `Esta ação é sensível e requer autenticação recente. Faça login novamente.`;
      case AuthErrorCodes.TOO_MANY_ATTEMPTS_TRY_LATER:
        return "Acesso temporariamente bloqueado devido a muitas tentativas. Tente novamente mais tarde.";
      case AuthErrorCodes.OPERATION_NOT_ALLOWED:
        console.error(
          `[AuthErrorMap] Operation not allowed for context: ${opContext}. Ensure the auth method is enabled in Firebase.`
        );
        return `Operação não permitida (${opContext}). Verifique as configurações de autenticação.`;
        return "Senha ausente.";
      case AuthErrorCodes.NETWORK_REQUEST_FAILED:
        console.error(
          `[AuthErrorMap] Network error detected (Auth Code: ${errorCode}) during ${opContext}. Check network and Firebase status.`
        );
        // Add check for development environment to suggest checking emulators
        if (
          process.env.NODE_ENV === "development" &&
          typeof window !== "undefined" &&
          window.location.hostname === "localhost"
        ) {
          return "Falha na conexão de rede ao tentar autenticar. Verifique sua conexão com a internet e se os emuladores do Firebase (Auth) estão rodando.";
        } else {
          return "Falha na conexão de rede ao tentar autenticar. Verifique sua conexão com a internet e tente novamente.";
        }
      case AuthErrorCodes.INTERNAL_ERROR:
        // Check for specific internal error messages if needed
        if (errorMessage?.includes("auth/network-request-failed")) {
          // Sometimes network issues manifest as internal
          console.error(
            `[AuthErrorMap] Internal error masking a network issue (Auth Code: ${errorCode}) during ${opContext}. Check network and Firebase status.`
          );
          if (
            process.env.NODE_ENV === "development" &&
            typeof window !== "undefined" &&
            window.location.hostname === "localhost"
          ) {
            return "Falha na conexão de rede ao tentar autenticar (erro interno). Verifique sua conexão e se os emuladores do Firebase (Auth) estão rodando.";
          } else {
            return "Falha na conexão de rede ao tentar autenticar (erro interno). Verifique sua conexão e tente novamente.";
          }
        }
        console.error(
          "[AuthErrorMap] Firebase internal auth error. Check config, keys, allowed domains.",
          error
        );
        return "Ocorreu um erro interno no servidor de autenticação. Tente novamente mais tarde.";
      case AuthErrorCodes.POPUP_CLOSED_BY_USER:
        return "Login cancelado pelo usuário.";
        return "Já existe uma conta com este e-mail usando um método de login diferente (ex: senha).";
      case AuthErrorCodes.POPUP_BLOCKED:
        return "A janela de login foi bloqueada pelo navegador. Habilite pop-ups para este site.";
      case AuthErrorCodes.INVALID_APP_CREDENTIAL:
        console.error(
          `[AuthErrorMap] Firebase Auth Initialization/Configuration Error (Auth Code: ${errorCode})`
        );
        return `Erro de configuração da autenticação Firebase (${errorCode}). Verifique a configuração do seu projeto.`;

      default:
        console.warn(
          `[AuthErrorMap] UNHANDLED Firebase Auth error code: ${errorCode}.`
        );
        return "Ocorreu um erro de autenticação. Por favor, tente novamente.";
    }
  }

  // Fallback for non-Firebase errors or errors without a known code
  console.warn(
    "[AuthErrorMap] Received non-Firebase error or error without a known code:",
    error
  );
  if (errorMessage) {
    // General network error check
    if (
      errorMessage.toLowerCase().includes("network error") ||
      errorMessage.toLowerCase().includes("failed to fetch") ||
      errorMessage.toLowerCase().includes("connection refused")
    ) {
      // Add check for development environment to suggest checking emulators
      if (
        process.env.NODE_ENV === "development" &&
        typeof window !== "undefined" &&
        window.location.hostname === "localhost"
      ) {
        return `Falha na conexão de rede para a ${opContext}. Verifique sua internet e se os emuladores do Firebase estão rodando.`;
      }
      return `Falha na conexão de rede para a ${opContext}. Verifique sua internet e tente novamente.`;
    }
    // Return the message if it seems useful, otherwise generic
    return `Ocorreu um erro inesperado: ${errorMessage}`;
  }
  return "Ocorreu um erro desconhecido. Por favor, tente novamente.";
}
