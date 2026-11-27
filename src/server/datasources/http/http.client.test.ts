import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { HttpClient } from './http.client';
import {
  AUTH_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  GUEST_COOKIE_NAME,
} from '../../constants/auth.constant';
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  BadGatewayError,
  GatewayTimeoutError,
} from '../../errors/app.error';

const mockCookiesGet = vi.fn();
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: mockCookiesGet,
  })),
  headers: vi.fn(async () => new Headers()),
}));

describe('HttpClient DataSource', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockCookiesGet.mockReset();
    mockCookiesGet.mockReturnValue(undefined);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should make GET request with baseUrl and query parameters', async () => {
    const mockResponseData = { id: 1, name: 'Sample' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponseData,
    });

    const client = new HttpClient({ baseUrl: 'https://api.internal.com' });
    const result = await client.get('/items', {
      params: { search: 'test', page: 1, active: true },
      requestId: 'req-123',
    });

    expect(result).toEqual(mockResponseData);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.internal.com/items?search=test&page=1&active=true',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'x-request-id': 'req-123',
          Accept: 'application/json',
        }),
      })
    );
  });

  it('should make POST request with JSON serialized body', async () => {
    const mockCreated = { id: 2, created: true };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => mockCreated,
    });

    const client = new HttpClient({ baseUrl: 'https://api.internal.com' });
    const result = await client.post('/items', { title: 'New Item' });

    expect(result).toEqual(mockCreated);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.internal.com/items',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ title: 'New Item' }),
      })
    );
  });

  it('should handle 204 No Content correctly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    });

    const client = new HttpClient();
    const result = await client.delete('https://api.internal.com/items/1');
    expect(result).toBeUndefined();
  });

  it('should validate and transform response using Zod schema', async () => {
    const RawItemSchema = z.object({
      item_id: z.string(),
      item_name: z.string(),
    }).transform((raw) => ({
      id: raw.item_id,
      name: raw.item_name,
    }));

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ item_id: 'i-100', item_name: 'Transformed Widget' }),
    });

    const client = new HttpClient();
    const result = await client.get('https://api.internal.com/item', {
      schema: RawItemSchema,
    });

    expect(result).toEqual({ id: 'i-100', name: 'Transformed Widget' });
  });

  it('should throw BadGatewayError if Zod validation fails', async () => {
    const StrictSchema = z.object({
      required_field: z.string(),
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ wrong_field: 123 }),
    });

    const client = new HttpClient();
    await expect(
      client.get('https://api.internal.com/item', { schema: StrictSchema })
    ).rejects.toThrow(BadGatewayError);
  });

  it('should map HTTP 400 error to BadRequestError', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Invalid payload parameter' }),
    });

    const client = new HttpClient();
    await expect(client.get('https://api.internal.com/bad')).rejects.toThrow(BadRequestError);
  });

  it('should map HTTP 401 error to UnauthorizedError', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Token expired' }),
    });

    const client = new HttpClient();
    await expect(client.get('https://api.internal.com/auth')).rejects.toThrow(UnauthorizedError);
  });

  it('should map HTTP 404 error to NotFoundError', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: 'User not found' }),
    });

    const client = new HttpClient();
    await expect(client.get('https://api.internal.com/users/999')).rejects.toThrow(NotFoundError);
  });

  it('should map HTTP 500 error to BadGatewayError', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal server crash in backend' }),
    });

    const client = new HttpClient();
    await expect(client.get('https://api.internal.com/crash')).rejects.toThrow(BadGatewayError);
  });

  it('should throw GatewayTimeoutError when fetch is aborted by timeout', async () => {
    global.fetch = vi.fn().mockImplementation(() => {
      const abortError = new Error('The user aborted a request.');
      abortError.name = 'AbortError';
      return Promise.reject(abortError);
    });

    const client = new HttpClient({ defaultTimeoutMs: 100 });
    await expect(client.get('https://api.internal.com/timeout')).rejects.toThrow(GatewayTimeoutError);
  });

  it('should auto-inject Authorization header when token option is provided', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    const client = new HttpClient({ baseUrl: 'https://api.internal.com' });
    await client.get('/v1/auth/me', { token: 'jwt-access-token-123' });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.internal.com/v1/auth/me',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer jwt-access-token-123',
        }),
      })
    );
  });

  it('should auto-forward X-Forwarded-For and X-Real-IP when clientIp is provided', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    const client = new HttpClient({ baseUrl: 'https://api.internal.com' });
    await client.post('/v1/recordings/upload', {}, { clientIp: '203.0.113.195' });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.internal.com/v1/recordings/upload',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-forwarded-for': '203.0.113.195',
          'x-real-ip': '203.0.113.195',
        }),
      })
    );
  });

  it('should auto-forward X-Ownership-Token when ownershipToken is provided', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    const client = new HttpClient({ baseUrl: 'https://api.internal.com' });
    await client.get('/v1/recordings/rec-123', { ownershipToken: 'guest-claim-token-xyz' });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.internal.com/v1/recordings/rec-123',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-ownership-token': 'guest-claim-token-xyz',
        }),
      })
    );
  });

  it('should auto-forward x-anon-token when anonToken is provided', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    const client = new HttpClient({ baseUrl: 'https://api.internal.com' });
    await client.post('/v1/recordings/presign', {}, { anonToken: 'guest-anon-jwt-token' });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.internal.com/v1/recordings/presign',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-anon-token': 'guest-anon-jwt-token',
        }),
      })
    );
  });

  it('should invoke and attach authHeaderResolver when no session authorization is present', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    const client = new HttpClient({
      baseUrl: 'https://api.internal.com',
      authHeaderResolver: async () => 'Bearer gateway-anon-token-123',
    });
    await client.get('/v1/templates');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.internal.com/v1/templates',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer gateway-anon-token-123',
        }),
      })
    );
  });

  it('should prefer explicit token over authHeaderResolver', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    const client = new HttpClient({
      baseUrl: 'https://api.internal.com',
      authHeaderResolver: async () => 'Bearer fallback-token',
    });
    await client.get('/v1/templates', { token: 'explicit-user-token' });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.internal.com/v1/templates',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer explicit-user-token',
        }),
      })
    );
  });

  it('should throw UnauthorizedError when AUTH_COOKIE_NAME is missing while REFRESH_COOKIE_NAME exists', async () => {
    mockCookiesGet.mockImplementation((name: string) => {
      if (name === REFRESH_COOKIE_NAME) return { value: 'valid-refresh-jwt' };
      if (name === GUEST_COOKIE_NAME) return { value: 'stale-guest-jwt' };
      return undefined;
    });
    const resolver = vi.fn().mockResolvedValue('Bearer anon-jwt');
    global.fetch = vi.fn();

    const client = new HttpClient({
      baseUrl: 'https://api.internal.com',
      authHeaderResolver: resolver,
    });

    await expect(client.get('/v1/recordings/rec-1')).rejects.toThrow(UnauthorizedError);
    expect(resolver).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should allow anon fallback when allowAnonFallback is true even with REFRESH_COOKIE_NAME', async () => {
    mockCookiesGet.mockImplementation((name: string) => {
      if (name === REFRESH_COOKIE_NAME) return { value: 'valid-refresh-jwt' };
      return undefined;
    });
    const resolver = vi.fn().mockResolvedValue('Bearer anon-gateway-jwt');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'success' }),
    });

    const client = new HttpClient({
      baseUrl: 'https://api.internal.com',
      authHeaderResolver: resolver,
    });

    await client.post('/v1/auth/refresh', { refresh_token: 'valid-refresh-jwt' }, { allowAnonFallback: true });
    expect(resolver).toHaveBeenCalledOnce();
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.internal.com/v1/auth/refresh',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer anon-gateway-jwt',
        }),
      })
    );
  });

  it('should attach AUTH_COOKIE_NAME directly when both auth and refresh cookies exist', async () => {
    mockCookiesGet.mockImplementation((name: string) => {
      if (name === AUTH_COOKIE_NAME) return { value: 'user-access-jwt' };
      if (name === REFRESH_COOKIE_NAME) return { value: 'user-refresh-jwt' };
      return undefined;
    });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    const client = new HttpClient({ baseUrl: 'https://api.internal.com' });
    await client.get('/v1/recordings');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.internal.com/v1/recordings',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer user-access-jwt',
        }),
      })
    );
  });
});

