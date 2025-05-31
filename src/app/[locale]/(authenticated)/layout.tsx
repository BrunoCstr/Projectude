// src/app/[locale]/layout.tsx
"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation"; 
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppStructure } from "@/components/layout/app-structure";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { setCookie } from "cookies-next";

interface AuthenticatedLocaleLayoutProps {
  children: React.ReactNode;
}

export default function AuthenticatedLocaleLayout({
  children,
}: AuthenticatedLocaleLayoutProps) {
  const { user, loading, isAuthenticated, userData } = useAuth();

  const router = useRouter();
  const pathname = usePathname(); // ex: "/pt/settings" ou "/en-US/dashboard"

  // Extrai o segmento de locale (o primeiro após a barra)
  const segments = pathname.split("/");
  const currentLocale = segments[1] || "en"; // fallback caso não encontre

  // Remove o segmento de locale do início da URL
  const stripLocale = (path: string, locale: string) =>
    path.startsWith(`/${locale}`) ? path.slice(locale.length + 1) : path;

  useEffect(() => {
    if (!loading && isAuthenticated && userData) {
      const preferredLang = userData.preferences?.language || "en";

      setCookie("lang", preferredLang, { path: "/", maxAge: 60 * 60 * 24 * 365 });

      // Atualiza o cookie se necessário
      if (typeof window !== "undefined") {
        const cookieLang = document.cookie
          .split("; ")
          .find((row) => row.startsWith("lang="))
          ?.split("=")[1];

        if (cookieLang !== preferredLang) {
          setCookie("lang", preferredLang, { path: "/", maxAge: 60 * 60 * 24 * 365 });
        }
      }
    }

    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, user, currentLocale, pathname, router, userData]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-4 w-[200px] ml-4" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // enquanto faz o push pra /login
  }

  return (
    <SidebarProvider defaultOpen>
      <AppStructure>{children}</AppStructure>
    </SidebarProvider>
  );
}
