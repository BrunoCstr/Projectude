"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation"; // Keep useRouter for other potential uses
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  User,
  Briefcase,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image"; // Keep Image import if logo/cover uses it
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ForgotPasswordDialog } from "@/components/auth/forgot-password-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  loginSchema,
  signupSchema,
  type LoginFormData,
  type SignupFormData,
} from "@/lib/schemas";
import { PasswordStrengthIndicator } from "@/components/auth/password-strength-indicator";
// Import CLIENT SDK handlers for direct Firebase interaction
import {
  handleLogin,
  handleSignup,
  handleGoogleSignInClient,
} from "@/lib/auth";
// Import SERVER actions for session management
import {
  handleSessionLogin,
  handleSessionSignup,
  handleGoogleSessionLogin,
  logoutAction,
} from "@/actions/auth-actions"; // Renamed loginAction -> handleSessionLogin, use handleGoogleSignInAction
import {
  TermsDialog,
  TermsAndConditionsContent,
  CookiePolicyContent,
  PrivacyPolicyContent,
} from "@/components/auth/terms-dialog";
import { useAuth } from "@/hooks/use-auth";
import { ProjectudeLogoSmall } from "@/components/layout/projectude-logo-small";
import type { User as FirebaseAuthUser } from "firebase/auth"; // Rename User to avoid potential conflicts

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

// --- Mock Social Icons (Keep as is) ---
const GoogleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
    <path d="M1 1h22v22H1z" fill="none" />
  </svg>
);
// Updated Apple Icon
const AppleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12.01 16.905c-.253 0-.506-.01-.76-.03-.583-.048-1.173-.15-1.768-.31-.596-.16-1.186-.388-1.77-.68-.583-.292-1.15-.65-1.702-1.073-.553-.423-.977-.88-1.274-1.37-.297-.49-.445-.98-.445-1.47 0-.616.19-1.19.57-1.72.38-.53.897-1.01 1.55-1.44.653-.43 1.39-.756 2.212-1.006.82-.25 1.65-.375 2.488-.375.74 0 1.458.103 2.153.31.696.206 1.32.516 1.87.928.55.413.996.91 1.34 1.493.343.583.515 1.21.515 1.88 0 .188-.013.37-.04.546-.026.177-.066.34-.12.49-.053.15-.117.285-.19.405-.074.12-.16.22-.258.303-.1.083-.206.147-.32.19-.113.044-.232.066-.355.066-.23 0-.444-.06-.64-.18-.195-.12-.33-.283-.404-.49-.074-.206-.113-.433-.113-.68 0-.35.07-.65.21-.9.14-.25.33-.45.57-.6.24-.15.5-.26.78-.33.28-.07.563-.104.85-.104.133 0 .263.007.39.02.126.013.25.03.37.05.05.006.096.01.14.01.043 0 .083-.003.12-.01.19-.03.357-.07.498-.12.143-.05.266-.11.37-.18.103-.07.186-.15.25-.24.063-.09.103-.19.12-.3.016-.108.025-.22.025-.335 0-.55-.173-1.04-.52-1.47-.347-.43-.8-.77-1.36-1.02-.56-.25-1.178-.375-1.85-.375-.777 0-1.53.16-2.26.48-.73.32-1.347.76-1.85 1.32-.5.56-.854 1.2-.96 1.92-.03.114-.046.226-.046.336 0 .11.006.21.02.3.013.09.03.176.05.258.02.08.046.15.08.21.11.17.26.297.45.38.19.08.4.12.63.12.166 0 .32-.02.46-.06.14-.04.27-.1.39-.18.12-.08.22-.17.3-.27.08-.1.14-.2.18-.3.11-.29.167-.59.167-.9 0-.57-.18-1.07-.54-1.5-.36-.43-.83-.76-1.41-.99-.58-.23-1.21-.345-1.89-.345-.73 0-1.41.13-2.04.4-.63.27-1.18.63-1.65 1.08-.47.45-.82.96-1.05 1.53-.23.57-.345 1.17-.345 1.8 0 .67.13 1.3.39 1.89.26.59.627 1.107 1.097 1.55.47.443 1.02.797 1.65 1.06.63.263 1.31.394 2.04.394.08 0 .16-.003.24-.01.39-.026.757-.07 1.1-.13.343-.06.67-.136.98-.23.31-.093.597-.2.86-.32.263-.12.49-.25.68-.39.19-.14.337-.28.44-.42.103-.14.17-.27.2-.39.03-.12.045-.23.045-.33 0-.06-.003-.11-.01-.15-.006-.04-.013-.07-.02-.09-.043-.11-.1-.2-.17-.27-.07-.07-.15-.12-.24-.15-.09-.03-.18-.045-.27-.045-.11 0-.21.017-.3.05-.09.033-.17.076-.24.13-.07.053-.13.11-.18.17-.05.06-.08.11-.09.15-.06.16-.09.33-.09.51 0 .29.06.56.18.81.12.25.29.46.51.63.22.17.47.29.75.37.28.08.58.12.9.12.233 0 .46-.017.68-.05.74-.11 1.41-.3 2.01-.57.6-.27 1.1-.6 1.5-.99.4-.39.7-.81.9-1.26.2-.45.3-.9.3-1.35 0-.74-.197-1.41-.59-2.01-.393-.6-.9-1.08-1.52-1.44-.62-.36-1.3-.61-2.04-.75-.74-.14-1.47-.21-2.19-.21-.11 0-.21.003-.3.01zm.946-4.456c-.646 0-1.256-.15-1.83-.45-.574-.3-1.06-.69-1.46-1.17-.4-.48-.697-1.02-.89-1.62-.193-.6-.29-1.23-.29-1.89 0-1 .32-1.91 1.016-2.73.696-.82 1.62-1.44 2.77-1.86 1.15-.42 2.38-.63 3.69-.63.46 0 .9.03 1.32.09.42.06.8.14 1.14.24.34.1.63.21.87.33.24.12.42.25.54.39.48.56.72 1.23.72 2.01 0 .66-.15 1.28-.45 1.86-.3.58-.73 1.09-1.29 1.53-.56.44-1.2.78-1.92 1.02-.72.24-1.47.36-2.25.36z" />
  </svg>
);
const FacebookIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="#1877F2"
  >
    <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C11.24.5 9.5 3.14 9.5 5.95V7.46H6.17v4.2h3.33v9.92h5V11.66h3.39L18.77 7.46z" />
  </svg>
);

// --- Logo ---
const ProjectudeLogo = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true); // Marca quando o componente foi montado no client
  }, []);

  if (!mounted) {
    // Evita renderizar imagem errada no SSR
    return (
      <Image
        src="/logo_dark_mode.png" // fallback padrão no SSR
        width={150}
        height={150}
        alt="Logo dark mode"
        className="group-data-[collapsible=icon]:hidden"
      />
    );
  }

  const logoSrc =
    resolvedTheme === "cafe" || resolvedTheme === "light"
      ? "/logo_light_mode.png"
      : "/logo_dark_mode.png";

  return (
    <Image
      src={logoSrc}
      width={150}
      height={150}
      alt="Logo"
      className="group-data-[collapsible=icon]:hidden"
    />
  );
};

export default function AuthPage() {
  const [mode, setMode] = React.useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false); // Corrected useState usage
  const { toast } = useToast();
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth(); // Use the auth hook

  const t = useTranslations("auth");

  // Redirect if already authenticated (client-side check)
  React.useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [loading, isAuthenticated, router]);

  // --- Forms ---
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
    mode: "onChange",
  });

  // --- Watch Password for Strength Feedback ---
  const signupPasswordValue = signupForm.watch("password");

  // --- Handlers ---

  const onLoginSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    loginForm.clearErrors();
    let result: {
      success: boolean;
      message: string;
      user?: FirebaseAuthUser;
      idToken?: string;
    } | null = null; // Store the result

    try {
      result = await handleLogin(data); // Call the client SDK handler directly

      if (result?.success && result.idToken) {
        // Added null check for result
        // Pass the ID token string to the server action
        const response = await fetch("/api/session/signIn", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ idToken: result.idToken }),
        });

        const sessionResult = await response.json();

        if (sessionResult.success) {
          toast({
            title: t("toastAuth.toastLoginSuccessTitle"),
            description: t("toastAuth.toastLoginSuccessDescription"),
          });
          router.refresh(); // Força a revalidação do `useAuth`
          router.push("/dashboard"); // redireciona imediatamente
          return;
        } else {
          // Session creation failed on server
          throw new Error(
            sessionResult.message || "Falha ao criar sessão no servidor."
          );
        }
      } else {
        // Either login failed or no idToken was returned (or bypass failed)
        // Check specifically if result exists before accessing message
        const loginResultMessage =
          result?.message || t("toastAuth.errorFallbackUnexpectedLogin");
        throw new Error(loginResultMessage);
      }
    } catch (error: any) {
      // Log failure message specifically
      console.error(
        "[AuthPage:onLoginSubmit] Login failed:",
        result?.message || "No error message returned"
      );
      // Log raw result object for more context
      console.error(
        "[AuthPage:onLoginSubmit] Raw login action result:",
        result
      );
      // Ensure a fallback message if result or result.message is undefined
      const errorMessage =
        result?.message ||
        error?.message ||
        "Erro desconhecido ou formato de resposta inesperado."; // Include error.message
      toast({
        variant: "destructive",
        title: t("toastAuth.toastLoginFailureTitle"),
        description: errorMessage,
      }); // Use updated errorMessage

      // Set form errors based on the final error message
      const lowerCaseMessage = errorMessage.toLowerCase();
      if (
        lowerCaseMessage.includes("senha") ||
        lowerCaseMessage.includes("password") ||
        lowerCaseMessage.includes("credential")
      ) {
        loginForm.setError("password", {
          type: "manual",
          message: errorMessage,
        });
      } else if (
        lowerCaseMessage.includes("email") ||
        lowerCaseMessage.includes("user") ||
        lowerCaseMessage.includes("conta") ||
        lowerCaseMessage.includes("user-not-found")
      ) {
        loginForm.setError("email", { type: "manual", message: errorMessage });
      } else if (
        lowerCaseMessage.includes("conexão") ||
        lowerCaseMessage.includes("network") ||
        lowerCaseMessage.includes("offline") ||
        lowerCaseMessage.includes("firestore") ||
        lowerCaseMessage.includes("unavailable") ||
        lowerCaseMessage.includes("rede")
      ) {
        // Specific error for network issues
        loginForm.setError("root", {
          type: "manual",
          message: t("toastAuth.errorNetwork"),
        });
      } else if (
        lowerCaseMessage.includes("inicialização") ||
        lowerCaseMessage.includes("initialized") ||
        lowerCaseMessage.includes("auth service unavailable")
      ) {
        loginForm.setError("root", {
          type: "manual",
          message: t("toastAuth.errorInitialization"),
        });
      } else if (lowerCaseMessage.includes("sessão")) {
        loginForm.setError("root", {
          type: "manual",
          message: `${t("toastAuth.errorSession")} ${errorMessage}`,
        });
      } else if (
        lowerCaseMessage.includes("perfil") ||
        lowerCaseMessage.includes("profile update") ||
        lowerCaseMessage.includes("cloud function")
      ) {
        // Handle profile update errors explicitly
        loginForm.setError("root", { type: "manual", message: errorMessage }); // Show profile update error on root
      } else {
        loginForm.setError("root", { type: "manual", message: errorMessage });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSignupSubmit = async (data: SignupFormData) => {
    setIsSubmitting(true);
    signupForm.clearErrors();
    let result: {
      success: boolean;
      message: string;
      user?: FirebaseAuthUser;
      idToken?: string;
      redirectPath?: string;
    } | null = null;

    try {
      result = await handleSignup(data); // Call client SDK handler

      if (result?.success && result.idToken) {
        // Added null check
        // Pass the ID token and data to the server action
        const response = await fetch("/api/session/signUp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ idToken: result.idToken }),
        });

        const sessionResult = await response.json();

        if (sessionResult.success) {
          toast({
            title: t("toastAuth.toastSignupSuccessTitle"),
            description: t("toastAuth.toastSignupSuccessDescription"),
          });
          // Redirect is handled by the server action throwing
          router.push(result.redirectPath!);
          return; // interrompe aqui
        } else {
          // Session creation failed after signup
          throw new Error(
            sessionResult.message ||
              "Cadastro bem-sucedido, mas falha ao criar sessão no servidor."
          );
        }
      } else {
        // Signup itself failed
        const signupErrorMessage =
          result?.message || t("toastAuth.errorFallbackUnexpectedSignup");
        throw new Error(signupErrorMessage);
      }
    } catch (error: any) {
      // Handle errors from handleSignup OR handleSessionSignup
      const errorMessage =
        result?.message ||
        error?.message ||
        t("toastAuth.errorFallbackGeneric"); // Get message from result first, then error
      console.error("[AuthPage:onSignupSubmit] Signup failed:", errorMessage);
      console.error(
        "[AuthPage:onSignupSubmit] Raw signup action result:",
        result
      ); // Log the raw result
      toast({
        variant: "destructive",
        title: t("toastAuth.toastSignupFailureTitle"),
        description: errorMessage,
      });

      // Set specific errors based on the message from the action
      const lowerCaseMessage = errorMessage.toLowerCase();
      if (
        lowerCaseMessage.includes("email já em uso") ||
        lowerCaseMessage.includes("email already in use")
      ) {
        signupForm.setError("email", { type: "manual", message: errorMessage });
      } else if (
        lowerCaseMessage.includes("senha") ||
        lowerCaseMessage.includes("password")
      ) {
        if (
          lowerCaseMessage.includes("fraca") ||
          lowerCaseMessage.includes("weak")
        ) {
          signupForm.setError("password", {
            type: "manual",
            message: errorMessage,
          });
        } else if (
          lowerCaseMessage.includes("não coincidem") ||
          lowerCaseMessage.includes("match")
        ) {
          signupForm.setError("confirmPassword", {
            type: "manual",
            message: errorMessage,
          });
        } else {
          signupForm.setError("password", {
            type: "manual",
            message: errorMessage,
          }); // General password error
        }
      } else if (
        lowerCaseMessage.includes("termos") ||
        lowerCaseMessage.includes("terms")
      ) {
        signupForm.setError("terms", { type: "manual", message: errorMessage });
      } else if (
        lowerCaseMessage.includes("conexão") ||
        lowerCaseMessage.includes("network") ||
        lowerCaseMessage.includes("offline") ||
        lowerCaseMessage.includes("firestore") ||
        lowerCaseMessage.includes("unavailable") ||
        lowerCaseMessage.includes("rede")
      ) {
        // Specific error for network issues
        signupForm.setError("root", {
          type: "manual",
          message: t("toastAuth.errorNetwork"),
        });
      } else if (
        lowerCaseMessage.includes("inicialização") ||
        lowerCaseMessage.includes("initialized") ||
        lowerCaseMessage.includes("auth service unavailable")
      ) {
        signupForm.setError("root", {
          type: "manual",
          message: t("toastAuth.errorInitialization"),
        });
      } else if (
        lowerCaseMessage.includes("perfil") ||
        lowerCaseMessage.includes("profile update") ||
        lowerCaseMessage.includes("cloud function")
      ) {
        // Handle profile update errors
        signupForm.setError("root", { type: "manual", message: errorMessage });
      } else if (lowerCaseMessage.includes("sessão")) {
        signupForm.setError("root", {
          type: "manual",
          message: `Erro de sessão: ${errorMessage}`,
        });
      } else {
        signupForm.setError("root", { type: "manual", message: errorMessage });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    loginForm.clearErrors(); // Clear errors from other forms
    signupForm.clearErrors();
    let result: {
      success: boolean;
      message: string;
      user?: FirebaseAuthUser;
      idToken?: string;
      isNewUser?: boolean;
    } | null = null;

    try {
      result = await handleGoogleSignInClient(); // Call client SDK handler

      if (result?.success && result.idToken) {
        // Added null check
        // Pass the ID token and isNewUser flag to the server action
        const sessionResult = await handleGoogleSessionLogin(
          result.idToken,
          result.isNewUser ?? false
        );

        if (sessionResult.success) {
          toast({
            title: t("toastAuth.toastGoogleSuccessTitle"),
            description: t("toastAuth.toastLoginSuccessDescription"),
          });
          // Redirect is handled by the server action throwing
        } else {
          // Session creation failed after Google sign-in
          throw new Error(
            sessionResult.message ||
              "Login com Google bem-sucedido, mas falha ao criar sessão no servidor."
          );
        }
      } else {
        // Google sign-in itself failed
        const googleErrorMessage =
          result?.message ||
          "Falha no login com Google (resultado inesperado).";
        throw new Error(googleErrorMessage);
      }
    } catch (error: any) {
      const errorMessage =
        result?.message ||
        error?.message ||
        "Erro desconhecido ou formato de resposta inesperado."; // Use message from result or error
      console.error(
        "[AuthPage:handleGoogleSignIn] Google Sign-In failed:",
        errorMessage
      );
      console.error(
        "[AuthPage:handleGoogleSignIn] Raw Google Sign-In action result:",
        result
      ); // Log raw result

      toast({
        variant: "destructive",
        title: t("toastAuth.toastGoogleFailureTitle"),
        description: errorMessage,
      });
      // Display error in a generic way, maybe root error
      const lowerCaseMessage = errorMessage.toLowerCase();
      if (
        lowerCaseMessage.includes("conexão") ||
        lowerCaseMessage.includes("network") ||
        lowerCaseMessage.includes("offline")
      ) {
        loginForm.setError("root", {
          type: "manual",
          message: "Erro de conexão com Google. Verifique sua internet.",
        });
      } else {
        loginForm.setError("root", {
          type: "manual",
          message: `Google Sign-In failed: ${errorMessage}`,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading skeleton if auth state is still loading OR if user is authenticated (before redirect)
  if (loading || (!loading && isAuthenticated)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 dark:bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  // Render form only if not loading and not authenticated
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 dark:bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center items-center">
          <ProjectudeLogo />
        </div>

        <div className="rounded-lg bg-card p-8 shadow-lg border border-border">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {mode === "login" ? t("welcomeBack") : t("createAccountTitle")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "login"
                ? t("loginDescription")
                : t("signupDescription")}
            </p>
          </div>

          <Tabs
            value={mode}
            onValueChange={(value) => {
              setMode(value as "login" | "signup");
              loginForm.reset();
              signupForm.reset();
              setShowPassword(false);
              setShowConfirmPassword(false);
              setIsSubmitting(false);
            }}
            className="w-full flex justify-center mb-6"
          >
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-lg h-11">
              <TabsTrigger
                value="login"
                className={cn(
                  "px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors",
                  "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:rounded-md h-full"
                )}
              >
                {t("tabLogin")}
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className={cn(
                  "px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors",
                  "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:rounded-md h-full"
                )}
              >
                {t("tabSignup")}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="transition-all duration-300">
            {/* Login Form */}
            {mode === "login" && (
              <Form {...loginForm}>
                <form
                  onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                  className="space-y-6 animate-in fade-in duration-300"
                >
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("emailLabel")}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="login-email"
                              type="email"
                              placeholder={t("emailPlaceholder")}
                              className="pl-10"
                              {...field}
                              disabled={isSubmitting}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>{t("passwordLabel")}</FormLabel>
                          <ForgotPasswordDialog>
                            <button
                              type="button"
                              className="text-xs text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={isSubmitting}
                            >
                              {t("forgotPassword")}
                            </button>
                          </ForgotPasswordDialog>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="login-password"
                              type={showPassword ? "text" : "password"}
                              placeholder={t("yourPassword")}
                              className="pl-10 pr-10"
                              {...field}
                              disabled={isSubmitting}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                              onClick={() => setShowPassword((prev) => !prev)}
                              tabIndex={-1}
                              disabled={isSubmitting}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                              <span className="sr-only">
                                {showPassword
                                  ? t("hidePassword")
                                  : t("showPassword")}
                              </span>
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            id="remember-me"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormLabel
                          htmlFor="remember-me"
                          className="text-sm font-normal text-muted-foreground"
                        >
                          {t("rememberMe")}
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  {loginForm.formState.errors.root && (
                    <p className="text-sm text-destructive">
                      {loginForm.formState.errors.root.message}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 text-base"
                    disabled={isSubmitting || !loginForm.formState.isValid}
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <LogIn className="mr-2 h-5 w-5" />
                    )}
                    {isSubmitting ? t("loggingIn") : t("loginButton")}
                  </Button>
                </form>
              </Form>
            )}

            {/* Signup Form */}
            {mode === "signup" && (
              <Form {...signupForm}>
                <form
                  onSubmit={signupForm.handleSubmit(onSignupSubmit)}
                  className="space-y-6 animate-in fade-in duration-300"
                >
                  <FormField
                    control={signupForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("nameLabel")}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="signup-name"
                              type="text"
                              placeholder={t("namePlaceholder")}
                              className="pl-10"
                              {...field}
                              disabled={isSubmitting}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signupForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("emailLabel")}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="signup-email"
                              type="email"
                              placeholder={t("emailPlaceholder")}
                              className="pl-10"
                              {...field}
                              disabled={isSubmitting}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signupForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("passwordLabel")}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="signup-password"
                              type={showPassword ? "text" : "password"}
                              placeholder={t("signupPasswordPlaceholder")}
                              className="pl-10 pr-10"
                              {...field}
                              disabled={isSubmitting}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                              onClick={() => setShowPassword((prev) => !prev)}
                              tabIndex={-1}
                              disabled={isSubmitting}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                              <span className="sr-only">
                                {showPassword
                                  ? t("hidePassword")
                                  : t("showPassword")}
                              </span>
                            </Button>
                          </div>
                        </FormControl>
                        {signupPasswordValue && (
                          <PasswordStrengthIndicator
                            password={signupPasswordValue}
                          />
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signupForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("confirmPasswordLabel")}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="signup-confirm-password"
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder={t("confirmPasswordPlaceholder")}
                              className="pl-10 pr-10"
                              {...field}
                              disabled={isSubmitting}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                              onClick={() =>
                                setShowConfirmPassword((prev) => !prev)
                              }
                              tabIndex={-1}
                              disabled={isSubmitting}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                              <span className="sr-only">
                                {showConfirmPassword
                                  ? t("hidePassword")
                                  : t("showPassword")}
                              </span>
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signupForm.control}
                    name="terms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-2 pt-2">
                        <FormControl>
                          <Checkbox
                            id="terms-signup"
                            className="mt-0.5"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel
                            htmlFor="terms-signup"
                            className="text-xs font-normal text-muted-foreground leading-snug"
                          >
                            {t("acceptTermsPrefix")}{" "}
                            <TermsDialog
                              title="Termos e Condições de Uso"
                              content={<TermsAndConditionsContent />}
                            >
                              <span className="underline hover:text-primary cursor-pointer">
                                {t("termsOfUse")}
                              </span>
                            </TermsDialog>{" "}
                            {t("and")}{" "}
                            <TermsDialog
                              title={t("toastAuth.labelPrivacyDialogTitle")}
                              content={<PrivacyPolicyContent />}
                            >
                              <span className="underline hover:text-primary cursor-pointer">
                                {t("privacyPolicy")}
                              </span>
                            </TermsDialog>
                            .
                          </FormLabel>
                          <FormMessage className="text-xs" />
                        </div>
                      </FormItem>
                    )}
                  />

                  {signupForm.formState.errors.root && (
                    <p className="text-sm text-destructive">
                      {signupForm.formState.errors.root.message}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 text-base"
                    disabled={isSubmitting || !signupForm.formState.isValid}
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <UserPlus className="mr-2 h-5 w-5" />
                    )}
                    {isSubmitting
                      ? t("creatingAccount")
                      : t("createAccountButton")}
                  </Button>
                </form>
              </Form>
            )}
          </div>

          <div className="space-y-6 mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  {t("orContinueWith")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="h-10"
                disabled={isSubmitting}
                onClick={handleGoogleSignIn}
              >
                <GoogleIcon />
                <span className="sr-only">{t("orContinueWith")}</span>
              </Button>
              <Button
                variant="outline"
                className="h-10"
                disabled={isSubmitting}
              >
                <AppleIcon />
                <span className="sr-only">{t("loginWithApple")}</span>
              </Button>
              <Button
                variant="outline"
                className="h-10"
                disabled={isSubmitting}
              >
                <FacebookIcon />
                <span className="sr-only">{t("loginWithFacebook")}</span>
              </Button>
            </div>
          </div>
        </div>

        <footer className="mt-8 text-center text-xs text-muted-foreground space-x-4">
          <TermsDialog
            title={t("toastAuth.labelCookiesDialogTitle")}
            content={<CookiePolicyContent />}
          >
            <span className="hover:underline cursor-pointer">
              {t("cookies")}
            </span>
          </TermsDialog>
          <span>&bull;</span>
          <TermsDialog
            title={t("toastAuth.labelPrivacyDialogTitle")}
            content={<PrivacyPolicyContent />}
          >
            <span className="hover:underline cursor-pointer">
              {t("footerPrivacy")}
            </span>
          </TermsDialog>
          <span>&bull;</span>
          <TermsDialog
            title={t("toastAuth.labelTermsDialogTitle")}
            content={<TermsAndConditionsContent />}
          >
            <span className="hover:underline cursor-pointer">
              {t("footerTerms")}
            </span>
          </TermsDialog>
        </footer>
      </div>
    </div>
  );
}
