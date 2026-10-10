import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '../constants/auth.constant';

/**
 * Handles Route Protection and Redirection for Authentication:
 * - Redirects authenticated users accessing /login or /register towards /dashboard
 */
export function handleAuthRouting(request: NextRequest): NextResponse | null {
  const { pathname, searchParams } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = Boolean(token && token.trim().length > 0);

  // Prevent logged-in users from accessing login or registration pages
  if (pathname === '/login' || pathname === '/register') {
    if (isAuthenticated) {
      const redirectTo = searchParams.get('redirect') || searchParams.get('from') || '/dashboard';
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
  }

  return null;
}
