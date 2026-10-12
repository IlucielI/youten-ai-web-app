import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch, apiFetchData, ApiClientError } from './api-client';

describe('api-client', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should perform GET request and return parsed JSON', async () => {
    const mockData = { status: 'success', data: { id: 1, name: 'Alice' } };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockData,
    });

    const result = await apiFetch<typeof mockData>('/api/test');
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
      headers: expect.objectContaining({ Accept: 'application/json' }),
    }));
  });

  it('should auto-unwrap data property via apiFetchData', async () => {
    const mockPayload = { status: 'success', data: { id: 42, title: 'Test Item' } };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockPayload,
    });

    const data = await apiFetchData<{ id: number; title: string }>('/api/item/42');
    expect(data).toEqual({ id: 42, title: 'Test Item' });
  });

  it('should throw ApiClientError on non-2xx HTTP responses', async () => {
    const errorPayload = {
      code: 'BAD_REQUEST',
      error: 'Invalid parameter',
      details: { field: 'email' },
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => errorPayload,
    });

    await expect(apiFetch('/api/invalid')).rejects.toThrow(ApiClientError);

    try {
      await apiFetch('/api/invalid');
    } catch (err: unknown) {
      const apiErr = err as ApiClientError;
      expect(apiErr.status).toBe(400);
      expect(apiErr.code).toBe('BAD_REQUEST');
      expect(apiErr.message).toBe('Invalid parameter');
      expect(apiErr.details).toEqual({ field: 'email' });
    }
  });

  it('should handle 204 No Content gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Headers(),
    });

    const result = await apiFetch('/api/delete-something', { method: 'DELETE' });
    expect(result).toBeUndefined();
  });

  it('should silently refresh token on 401 and retry the original request', async () => {
    const successData = { status: 'success', data: { user: 'bob' } };
    let callCount = 0;

    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url === '/api/auth/refresh') {
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ status: 'success' }),
        };
      }
      if (url === '/api/user/profile') {
        callCount++;
        if (callCount === 1) {
          return {
            ok: false,
            status: 401,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ code: 'UNAUTHORIZED', error: 'Token expired' }),
          };
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => successData,
        };
      }
      return { ok: false, status: 404 };
    });

    const result = await apiFetch<typeof successData>('/api/user/profile');
    expect(result).toEqual(successData);
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/refresh', expect.anything());
    expect(callCount).toBe(2);
  });

  it('should throw ApiClientError if silent refresh fails on 401', async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url === '/api/auth/refresh') {
        return {
          ok: false,
          status: 401,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ code: 'UNAUTHORIZED', error: 'Invalid refresh token' }),
        };
      }
      return {
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ code: 'UNAUTHORIZED', error: 'Session expired' }),
      };
    });

    await expect(apiFetch('/api/user/profile')).rejects.toThrow(ApiClientError);
  });

  it('should not attempt silent refresh on auth bypass endpoints', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ code: 'UNAUTHORIZED', error: 'Bad credentials' }),
    });

    await expect(apiFetch('/api/auth/login')).rejects.toThrow(ApiClientError);
    expect(global.fetch).not.toHaveBeenCalledWith('/api/auth/refresh', expect.anything());
  });
});
