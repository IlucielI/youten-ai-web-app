import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthController } from './auth.controller';
import { IAuthService } from '../services/auth.service.interface';
import { ResponseStatus, ResponseCode } from '../constants';
import { UserStatus } from '../constants/recording.constant';
import { AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME, GUEST_COOKIE_NAME } from '../constants/auth.constant';

describe('AuthController', () => {
  let controller: AuthController;
  let mockService: IAuthService;

  const mockUserResponse = {
    id: 'user-456',
    email: 'test@example.com',
    full_name: 'Test Person',
    status: UserStatus.ACTIVE,
    daily_quota: 5,
    email_verified: true,
    created_at: new Date().toISOString(),
  };

  const mockAuthResponse = {
    access_token: 'jwt-access-token',
    refresh_token: 'jwt-refresh-token',
    token_type: 'Bearer',
    expires_in: 900,
    refresh_expires_in: 604800,
    user: mockUserResponse,
  };

  beforeEach(() => {
    mockService = {
      anonToken: vi.fn().mockResolvedValue({
        status: ResponseStatus.SUCCESS,
        code: ResponseCode.SUCCESS,
        message: 'Anonymous session initialized',
        data: {
          anon_token: 'anon-jwt-token',
          session_id: '00000000-0000-0000-0000-000000000002',
          client_id: 'client-app',
          token_type: 'Bearer',
          expires_in: 604800,
          scopes: ['recordings:create'],
        },
        timestamp: new Date().toISOString(),
      }),
      register: vi.fn().mockResolvedValue({
        status: ResponseStatus.SUCCESS,
        code: ResponseCode.SUCCESS,
        message: 'Registered successfully',
        data: mockAuthResponse,
        timestamp: new Date().toISOString(),
      }),
      login: vi.fn().mockResolvedValue({
        status: ResponseStatus.SUCCESS,
        code: ResponseCode.SUCCESS,
        message: 'Logged in successfully',
        data: mockAuthResponse,
        timestamp: new Date().toISOString(),
      }),
      refreshToken: vi.fn().mockResolvedValue({
        status: ResponseStatus.SUCCESS,
        code: ResponseCode.SUCCESS,
        message: 'Refreshed',
        data: mockAuthResponse,
        timestamp: new Date().toISOString(),
      }),
      logout: vi.fn().mockResolvedValue({
        status: ResponseStatus.SUCCESS,
        code: ResponseCode.SUCCESS,
        message: 'Logged out successfully',
        timestamp: new Date().toISOString(),
      }),
      forgotPassword: vi.fn().mockResolvedValue({
        status: ResponseStatus.SUCCESS,
        code: ResponseCode.SUCCESS,
        message: 'Reset email sent',
        timestamp: new Date().toISOString(),
      }),
      resetPassword: vi.fn().mockResolvedValue({
        status: ResponseStatus.SUCCESS,
        code: ResponseCode.SUCCESS,
        message: 'Password reset successfully',
        timestamp: new Date().toISOString(),
      }),
      getMe: vi.fn().mockResolvedValue({
        status: ResponseStatus.SUCCESS,
        code: ResponseCode.SUCCESS,
        message: 'Profile retrieved',
        data: Object.assign({}, mockUserResponse, {
          quota_used_today: 0,
          quota_remaining: 5,
        }),
        timestamp: new Date().toISOString(),
      }),
      updateProfile: vi.fn().mockResolvedValue({
        status: ResponseStatus.SUCCESS,
        code: ResponseCode.SUCCESS,
        message: 'Profile updated',
        data: mockUserResponse,
        timestamp: new Date().toISOString(),
      }),
      changePassword: vi.fn().mockResolvedValue({
        status: ResponseStatus.SUCCESS,
        code: ResponseCode.SUCCESS,
        message: 'Password changed successfully',
        timestamp: new Date().toISOString(),
      }),
    };

    controller = new AuthController(mockService);
  });

  describe('anonToken', () => {
    it('returns 201 and sets guest cookie on handshake', async () => {
      const req = new Request('http://localhost/api/auth/anon', {
        method: 'POST',
      });

      const res = await controller.anonToken(req);
      expect(res.status).toBe(201);
      const setCookie = res.headers.get('set-cookie');
      expect(setCookie).toMatch(new RegExp(`^${GUEST_COOKIE_NAME}=anon-jwt-token`));
      expect(setCookie).toMatch(/httponly/i);
      expect(setCookie).toMatch(/samesite=lax/i);
    });
  });

  describe('register', () => {
    it('returns 201 and sets auth cookies on valid registration', async () => {
      const req = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: 'Test Person',
          email: 'test@example.com',
          password: 'Password123',
        }),
      });

      const res = await controller.register(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.user.email).toBe('test@example.com');

      const cookies = res.cookies.getAll();
      const accessCookie = cookies.find((c) => c.name === AUTH_COOKIE_NAME);
      const refreshCookie = cookies.find((c) => c.name === REFRESH_COOKIE_NAME);
      expect(accessCookie?.value).toBe('jwt-access-token');
      expect(refreshCookie?.value).toBe('jwt-refresh-token');
    });

    it('returns 400 when registration body is invalid', async () => {
      const req = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: '',
          email: 'invalid-email',
          password: 'short',
        }),
      });

      const res = await controller.register(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe(ResponseCode.BAD_REQUEST);
    });
  });

  describe('login', () => {
    it('returns 200 and sets auth cookies on valid credentials', async () => {
      const req = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123',
        }),
      });

      const res = await controller.login(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.user.email).toBe('test@example.com');

      const cookies = res.cookies.getAll();
      const accessCookie = cookies.find((c) => c.name === AUTH_COOKIE_NAME);
      const refreshCookie = cookies.find((c) => c.name === REFRESH_COOKIE_NAME);
      expect(accessCookie?.value).toBe('jwt-access-token');
      expect(refreshCookie?.value).toBe('jwt-refresh-token');
    });

    it('returns 400 when login body is missing fields', async () => {
      const req = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '' }),
      });

      const res = await controller.login(req);
      expect(res.status).toBe(400);
    });
  });

  describe('logout', () => {
    it('clears auth cookies and returns 200', async () => {
      const req = new Request('http://localhost/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `${REFRESH_COOKIE_NAME}=jwt-refresh-token;`,
        },
        body: JSON.stringify({ refresh_token: 'jwt-refresh-token' }),
      });

      const res = await controller.logout(req);
      expect(res.status).toBe(200);

      // Verify cookie deletion
      const cookies = res.cookies.getAll();
      const accessCookie = cookies.find((c) => c.name === AUTH_COOKIE_NAME);
      const refreshCookie = cookies.find((c) => c.name === REFRESH_COOKIE_NAME);
      expect(accessCookie?.maxAge).toBe(0);
      expect(refreshCookie?.maxAge).toBe(0);
    });
  });

  describe('getMe', () => {
    it('returns user profile', async () => {
      const req = new Request('http://localhost/api/auth/me');
      const res = await controller.getMe(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.email).toBe('test@example.com');
      expect(json.data.quota_remaining).toBe(5);
    });
  });

  describe('forgotPassword', () => {
    it('returns 200 on valid email submission', async () => {
      const req = new Request('http://localhost/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      const res = await controller.forgotPassword(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.message).toBe('Reset email sent');
    });
  });

  describe('resetPassword', () => {
    it('returns 200 on valid token and new password', async () => {
      const req = new Request('http://localhost/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'token-abc',
          new_password: 'NewPassword123',
        }),
      });

      const res = await controller.resetPassword(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.message).toBe('Password reset successfully');
    });

    it('returns 400 when new password has no digit', async () => {
      const req = new Request('http://localhost/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'token-abc',
          new_password: 'OnlyLettersPassword',
        }),
      });

      const res = await controller.resetPassword(req);
      expect(res.status).toBe(400);
    });
  });

  describe('updateProfile', () => {
    it('returns 200 on valid full_name', async () => {
      const mockUpdatedUser = Object.assign({}, mockUserResponse, { full_name: 'Jane Doe' });
      (mockService.updateProfile as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        status: ResponseStatus.SUCCESS,
        code: ResponseCode.SUCCESS,
        message: 'Profile updated',
        data: mockUpdatedUser,
        timestamp: new Date().toISOString(),
      });

      const req = new Request('http://localhost/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: 'Jane Doe' }),
      });

      const res = await controller.updateProfile(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.full_name).toBe('Jane Doe');
      expect(mockService.updateProfile).toHaveBeenCalledWith({ full_name: 'Jane Doe' });
    });

    it('returns 400 on invalid full_name', async () => {
      const req = new Request('http://localhost/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: 'x' }),
      });

      const res = await controller.updateProfile(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe(ResponseCode.BAD_REQUEST);
      expect(mockService.updateProfile).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('returns 200 on valid passwords', async () => {
      const req = new Request('http://localhost/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          old_password: 'OldPassword123',
          new_password: 'NewPassword456',
        }),
      });

      const res = await controller.changePassword(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.message).toBe('Password changed successfully');
      expect(mockService.changePassword).toHaveBeenCalledWith({
        old_password: 'OldPassword123',
        new_password: 'NewPassword456',
      });
    });

    it('returns 400 when new_password is the same as old_password', async () => {
      const req = new Request('http://localhost/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          old_password: 'SamePassword123',
          new_password: 'SamePassword123',
        }),
      });

      const res = await controller.changePassword(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe(ResponseCode.BAD_REQUEST);
      expect(mockService.changePassword).not.toHaveBeenCalled();
    });
  });
});

