// src/components/auth/authenticated-guard.tsx
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthenticatedGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated, userData } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const segments = pathname.split("/");
  const currentLocale = segments[1] || "en";

  const stripLocale = (path: string, locale: string) =>
    path.startsWith(`/${locale}`) ? path.slice(locale.length + 1) : path;

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }

      const prefLang = userData?.preferences?.language;
      if (prefLang && prefLang !== currentLocale) {
        const basePath = stripLocale(pathname, currentLocale);
        const newUrl = `/${prefLang}${basePath}`;
        router.replace(newUrl);
      }
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
    return null;
  }

  return <>{children}</>;
}
