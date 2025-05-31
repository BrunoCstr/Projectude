// src/middleware.ts

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// 1) importe e configure o next-intl
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
const intlMiddleware = createMiddleware(routing);

// 2) sua lista de rotas protegidas / públicas
const protectedPaths = [
  '/dashboard', '/my-projects', '/shared-with-me', '/collaborators',
  '/comments', '/tags', '/settings', '/profile',
  '/notifications', '/help-center', '/onboarding',
];
const publicOnlyPaths = ['/login'];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('projectude-session')?.value;
  const isAuth = Boolean(sessionCookie);

  const cookieLang = request.cookies.get('lang')?.value;
  const supportedLocales = ['en', 'pt', 'es', 'fr'];

  // Redireciona apenas se estiver na raiz "/"
  if (pathname === '/') {
    const toLocale = cookieLang && supportedLocales.includes(cookieLang) ? cookieLang : 'en';
    return NextResponse.redirect(new URL(`/${toLocale}`, request.url));
  }

  // Aplica o middleware do next-intl
  const localeResponse = intlMiddleware(request);
  if (localeResponse) return localeResponse;

  const isProtected = protectedPaths.some(path => pathname.startsWith(path));
  const isPublicOnly = publicOnlyPaths.some(path => pathname.startsWith(path));

  if (isProtected && !isAuth) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isPublicOnly && isAuth) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/((?!api|trpc|_next/static|_next/image|_vercel|.*\\..*).*)'
};