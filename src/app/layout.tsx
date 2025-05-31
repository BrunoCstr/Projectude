// src/app/layout.tsx

import type { Metadata } from "next";
// Removed Geist font imports
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/use-auth"; // Import AuthProvider

import { NextIntlClientProvider, hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";

export const metadata: Metadata = {
  title: "Projectude", // Updated title
  description: "Collaborative project management platform",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale?: string };
}) {
  const locale = params.locale ?? "en";

  if (!hasLocale(routing.locales, locale)) {
    throw new Error("Locale não suportado");
  }

  const messages = (await import(`../../messages/${locale}.json`)).default;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased"
          // Defaulting to sans-serif as Geist fonts were removed
        )}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            themes={["dark", "cafe"]} // Add 'cafe' to supported themes
          >
            {/* Wrap the main content with AuthProvider */}
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
