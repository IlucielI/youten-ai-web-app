import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveBffStreamAuth, unauthorizedRefreshResponse } from './stream-auth';
import {
  AUTH_COOKIE_NAME,
  GUEST_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  WORKSPACE_COOKIE_NAME,
} from '@/server/constants';

const mockCookiesGet = vi.fn();
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: mockCookiesGet,
  })),
}));

const mockGetGatewayAnonToken = vi.fn().mockResolvedValue('anon-jwt-token');
vi.mock('@/server/repositories', () => ({
  authRepository: {
    getGatewayAnonToken: (...args: unknown[]) => mockGetGatewayAnonToken(...args),
  },
}));

describe('resolveBffStreamAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookiesGet.mockReturnValue(undefined);
  });

  it('uses AUTH_COOKIE_NAME as Bearer token when present', async () => {
    mockCookiesGet.mockImplementation((name: string) => {
      if (name === AUTH_COOKIE_NAME) return { value: 'user-access-jwt' };
      if (name === REFRESH_COOKIE_NAME) return { value: 'user-refresh-jwt' };
      if (name === WORKSPACE_COOKIE_NAME) return { value: 'ws-123' };
      return undefined;
    });

    const req = new Request('http://localhost/api/recordings/1/chat');
    const result = await resolveBffStreamAuth({ req, allowAnon: true });

    expect(result.requiresRefresh).toBe(false);
    expect(result.headers.authorization).toBe('Bearer user-access-jwt');
    expect(result.headers['x-workspace-id']).toBe('ws-123');
    expect(mockGetGatewayAnonToken).not.toHaveBeenCalled();
  });

  it('requires refresh (returns requiresRefresh=true) when access token is missing but refresh token exists', async () => {
    mockCookiesGet.mockImplementation((name: string) => {
      if (name === REFRESH_COOKIE_NAME) return { value: 'user-refresh-jwt' };
      return undefined;
    });

    const req = new Request('http://localhost/api/recordings/1/chat');
    const result = await resolveBffStreamAuth({ req, allowAnon: true });

    expect(result.requiresRefresh).toBe(true);
    expect(result.headers.authorization).toBeUndefined();
    expect(mockGetGatewayAnonToken).not.toHaveBeenCalled();
  });

  it('falls back to guest/anon token only when neither access nor refresh token exists', async () => {
    mockCookiesGet.mockImplementation((name: string) => {
      if (name === GUEST_COOKIE_NAME) return { value: 'guest-jwt' };
      return undefined;
    });

    const req = new Request('http://localhost/api/recordings/1/chat');
    const result = await resolveBffStreamAuth({
      req,
      allowAnon: true,
      forwardOwnershipFromGuestCookie: true,
    });

    expect(result.requiresRefresh).toBe(false);
    expect(result.headers.authorization).toBe('Bearer guest-jwt');
    expect(result.headers['x-ownership-token']).toBe('guest-jwt');
    expect(mockGetGatewayAnonToken).not.toHaveBeenCalled();
  });

  it('falls back to gateway anon token when allowAnon is true and no cookies exist', async () => {
    const req = new Request('http://localhost/api/recordings/1/chat');
    const result = await resolveBffStreamAuth({ req, allowAnon: true });

    expect(result.requiresRefresh).toBe(false);
    expect(result.headers.authorization).toBe('Bearer anon-jwt-token');
    expect(mockGetGatewayAnonToken).toHaveBeenCalledTimes(1);
  });

  it('builds standardized 401 JSON response for refresh trigger', async () => {
    const res = unauthorizedRefreshResponse();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.code).toBe('UNAUTHORIZED');
  });
});

