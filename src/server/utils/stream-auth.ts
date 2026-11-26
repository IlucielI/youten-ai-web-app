import { cookies } from 'next/headers';
import {
  AUTH_COOKIE_NAME,
  GUEST_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  WORKSPACE_COOKIE_NAME,
} from '@/server/constants';
import { authRepository } from '@/server/repositories';

export interface ResolveBffStreamAuthOptions {
  req: Request;
  allowAnon?: boolean;
  forwardOwnershipFromGuestCookie?: boolean;
}

export interface ResolveBffStreamAuthResult {
  headers: Record<string, string>;
  requiresRefresh: boolean;
}

/**
 * Resolves upstream authorization, workspace, and client metadata headers for Next.js BFF
 * streaming and download route handlers.
 *
 * CRITICAL SECURITY & SESSION INVARIANT:
 * If the short-lived access token cookie (`AUTH_COOKIE_NAME`) has expired and been evicted by the
 * browser while `REFRESH_COOKIE_NAME` is still present, this helper MUST signal `requiresRefresh: true`
 * (causing the route to return HTTP 401) instead of silently downgrading the user to an anonymous
 * gateway session, which causes upstream 403 Forbidden errors on owned resources.
 */
export async function resolveBffStreamAuth({
  req,
  allowAnon = true,
  forwardOwnershipFromGuestCookie = false,
}: ResolveBffStreamAuthOptions): Promise<ResolveBffStreamAuthResult> {
  const headers: Record<string, string> = {};

  const reqId = req.headers.get('x-request-id');
  if (reqId) headers['x-request-id'] = reqId;

  const authHeader = req.headers.get('authorization');
  if (authHeader) headers['authorization'] = authHeader;

  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) headers['cookie'] = cookieHeader;

  const forwardedFor = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
  if (forwardedFor) {
    headers['x-forwarded-for'] = forwardedFor;
    headers['x-real-ip'] = forwardedFor;
  }

  const reqWsId = req.headers.get('x-workspace-id');
  if (reqWsId) headers['x-workspace-id'] = reqWsId;

  let hasRefreshCookie = false;

  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get(AUTH_COOKIE_NAME);
    const refreshCookie = cookieStore.get(REFRESH_COOKIE_NAME);
    hasRefreshCookie = Boolean(refreshCookie?.value);

    if (authCookie?.value && !headers['authorization']) {
      headers['authorization'] = `Bearer ${authCookie.value}`;
    } else if (!hasRefreshCookie) {
      const guestCookie = cookieStore.get(GUEST_COOKIE_NAME);
      if (guestCookie?.value && !headers['authorization']) {
        headers['authorization'] = `Bearer ${guestCookie.value}`;
        if (forwardOwnershipFromGuestCookie && !headers['x-ownership-token']) {
          headers['x-ownership-token'] = guestCookie.value;
        }
      }
    }

    const wsCookie = cookieStore.get(WORKSPACE_COOKIE_NAME);
    if (wsCookie?.value && !headers['x-workspace-id']) {
      headers['x-workspace-id'] = wsCookie.value;
    }
  } catch {
    // Ignore cookie parsing error outside request context
  }

  // User session exists via refresh token, but access token expired -> ask client to refresh via 401
  if (!headers['authorization'] && hasRefreshCookie) {
    return { headers, requiresRefresh: true };
  }

  if (!headers['authorization'] && allowAnon) {
    try {
      const anonToken = await authRepository.getGatewayAnonToken();
      if (anonToken) {
        headers['authorization'] = `Bearer ${anonToken}`;
      }
    } catch {
      // Ignore fallback error
    }
  }

  return { headers, requiresRefresh: false };
}

/**
 * Standardized 401 response prompting client `fetchWithAuth` to perform silent token refresh.
 */
export function unauthorizedRefreshResponse(): Response {
  return new Response(
    JSON.stringify({
      status: 'fail',
      code: 'UNAUTHORIZED',
      message: 'Session access token expired',
    }),
    {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

