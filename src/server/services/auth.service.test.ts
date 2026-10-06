import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service';
import { IAuthRepository } from '../repositories/auth.repository.interface';
import { ResponseStatus, ResponseCode } from '../constants';
import { UserStatus } from '../constants/recording.constant';

describe('AuthService', () => {
  let service: AuthService;
  let mockRepo: IAuthRepository;

  const mockUserResponse = {
    id: 'user-123',
    email: 'test@example.com',
    full_name: 'Test User',
    status: UserStatus.ACTIVE,
    daily_quota: 5,
    email_verified: true,
    created_at: new Date().toISOString(),
  };

  const mockAuthResponse = {
    access_token: 'acc-token',
    refresh_token: 'ref-token',
    token_type: 'Bearer',
    expires_in: 900,
    refresh_expires_in: 604800,
    user: mockUserResponse,
  };

  beforeEach(() => {
    mockRepo = {
      register: vi.fn().mockResolvedValue({
        status: ResponseStatus.SUCCESS,
        code: ResponseCode.SUCCESS,
        message: 'Registered',
        data: mockAuthResponse,
        timestamp: new Date().toISOString(),
      }),
      login: vi.fn().mockResolvedValue({
        status: ResponseStatus.SUCCESS,
        code: ResponseCode.SUCCESS,
        message: 'Logged in',
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
        message: 'Logged out',
        timestamp: new Date().toISOString(),
      }),
      forgotPassword: vi.fn().mockResolvedValue({
        status: ResponseStatus.SUCCESS,
        code: ResponseCode.SUCCESS,
        message: 'Instructions sent',
        timestamp: new Date().toISOString(),
      }),
      resetPassword: vi.fn().mockResolvedValue({
        status: ResponseStatus.SUCCESS,
        code: ResponseCode.SUCCESS,
        message: 'Password reset',
        timestamp: new Date().toISOString(),
      }),
      getMe: vi.fn().mockResolvedValue({
        status: ResponseStatus.SUCCESS,
        code: ResponseCode.SUCCESS,
        message: 'Profile retrieved',
        data: Object.assign({}, mockUserResponse, {
          quota_used_today: 1,
          quota_remaining: 4,
        }),
        timestamp: new Date().toISOString(),
      }),
      updateProfile: vi.fn(),
      changePassword: vi.fn(),
    };

    service = new AuthService(mockRepo);
  });

  it('delegates register to repository', async () => {
    const payload = {
      email: 'test@example.com',
      password: 'Password123',
      full_name: 'Test User',
    };
    const res = await service.register(payload);
    expect(mockRepo.register).toHaveBeenCalledWith(payload);
    expect(res.data?.access_token).toBe('acc-token');
  });

  it('delegates login to repository', async () => {
    const payload = {
      email: 'test@example.com',
      password: 'Password123',
    };
    const res = await service.login(payload);
    expect(mockRepo.login).toHaveBeenCalledWith(payload);
    expect(res.data?.access_token).toBe('acc-token');
  });

  it('delegates refreshToken to repository', async () => {
    const payload = { refresh_token: 'ref-token' };
    const res = await service.refreshToken(payload);
    expect(mockRepo.refreshToken).toHaveBeenCalledWith(payload);
    expect(res.data?.access_token).toBe('acc-token');
  });

  it('delegates logout to repository', async () => {
    const payload = { refresh_token: 'ref-token' };
    const res = await service.logout(payload);
    expect(mockRepo.logout).toHaveBeenCalledWith(payload);
    expect(res.status).toBe(ResponseStatus.SUCCESS);
  });

  it('delegates forgotPassword to repository', async () => {
    const payload = { email: 'test@example.com' };
    const res = await service.forgotPassword(payload);
    expect(mockRepo.forgotPassword).toHaveBeenCalledWith(payload);
    expect(res.status).toBe(ResponseStatus.SUCCESS);
  });

  it('delegates resetPassword to repository', async () => {
    const payload = { token: 'tok-123', new_password: 'NewPassword123' };
    const res = await service.resetPassword(payload);
    expect(mockRepo.resetPassword).toHaveBeenCalledWith(payload);
    expect(res.status).toBe(ResponseStatus.SUCCESS);
  });

  it('delegates getMe to repository', async () => {
    const res = await service.getMe();
    expect(mockRepo.getMe).toHaveBeenCalled();
    expect(res.data?.email).toBe('test@example.com');
  });
});
