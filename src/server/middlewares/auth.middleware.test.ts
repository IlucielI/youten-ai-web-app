import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { handleAuthRouting } from './auth.middleware';
import { AUTH_COOKIE_NAME } from '../constants/auth.constant';

describe('handleAuthRouting Middleware', () => {
  it('returns null for public routes regardless of authentication', () => {
    const req = new NextRequest('http://localhost:3000/');
    const res = handleAuthRouting(req);
    expect(res).toBeNull();
  });

  it('returns null when accessing /login without auth cookie', () => {
    const req = new NextRequest('http://localhost:3000/login');
    const res = handleAuthRouting(req);
    expect(res).toBeNull();
  });

  it('redirects to /dashboard when accessing /login with valid auth cookie', () => {
    const req = new NextRequest('http://localhost:3000/login', {
      headers: {
        cookie: `${AUTH_COOKIE_NAME}=valid_access_jwt_token`,
      },
    });
    const res = handleAuthRouting(req);
    expect(res).not.toBeNull();
    expect(res?.status).toBe(307);
    expect(res?.headers.get('location')).toBe('http://localhost:3000/dashboard');
  });

  it('redirects to target query param when accessing /login with redirect param and valid auth cookie', () => {
    const req = new NextRequest('http://localhost:3000/login?redirect=%2Fsettings', {
      headers: {
        cookie: `${AUTH_COOKIE_NAME}=valid_access_jwt_token`,
      },
    });
    const res = handleAuthRouting(req);
    expect(res).not.toBeNull();
    expect(res?.status).toBe(307);
    expect(res?.headers.get('location')).toBe('http://localhost:3000/settings');
  });

  it('redirects to /dashboard when accessing /register with valid auth cookie', () => {
    const req = new NextRequest('http://localhost:3000/register', {
      headers: {
        cookie: `${AUTH_COOKIE_NAME}=valid_access_jwt_token`,
      },
    });
    const res = handleAuthRouting(req);
    expect(res).not.toBeNull();
    expect(res?.status).toBe(307);
    expect(res?.headers.get('location')).toBe('http://localhost:3000/dashboard');
  });
});
