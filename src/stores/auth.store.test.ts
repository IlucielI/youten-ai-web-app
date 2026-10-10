import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAuthStore } from './auth.store';
import * as apiClient from '@/lib/api-client';
import { ResponseStatus, ResponseCode } from '@/server/constants';
import { UserProfileResponse } from '@/server/dtos/auth.dto';

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().reset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with default state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.isInitialized).toBe(false);
  });

  it('sets user successfully', () => {
    const mockUser: UserProfileResponse = {
      id: 'user-1',
      email: 'bayu@youten.ai',
      full_name: 'Bayu',
      status: 'active',
      role_id: 'role-1',
      role_code: 'PRO',
      role_name: 'Pro Member',
      permissions: ['recordings:*'],
      daily_quota: 9999,
      quota_used_today: 0,
      quota_remaining: 9999,
      email_verified: true,
      created_at: new Date().toISOString(),
    };

    useAuthStore.getState().setUser(mockUser);
    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isInitialized).toBe(true);
  });

  it('fetches user profile successfully from /api/auth/me', async () => {
    const mockUser: UserProfileResponse = {
      id: 'user-1',
      email: 'bayu@youten.ai',
      full_name: 'Bayu',
      status: 'active',
      role_id: 'role-1',
      role_code: 'PRO',
      role_name: 'Pro Member',
      permissions: ['recordings:*'],
      daily_quota: 9999,
      quota_used_today: 0,
      quota_remaining: 9999,
      email_verified: true,
      created_at: new Date().toISOString(),
    };

    vi.spyOn(apiClient, 'apiFetch').mockResolvedValueOnce({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'OK',
      data: mockUser,
      timestamp: new Date().toISOString(),
    });

    const result = await useAuthStore.getState().fetchUser();

    expect(result).toEqual(mockUser);
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().isLoading).toBe(false);
    expect(useAuthStore.getState().isInitialized).toBe(true);
  });

  it('handles error gracefully when /api/auth/me fails', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockRejectedValueOnce(new Error('Unauthorized'));

    const result = await useAuthStore.getState().fetchUser();

    expect(result).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isLoading).toBe(false);
    expect(useAuthStore.getState().isInitialized).toBe(true);
  });

  it('calls /api/auth/logout and clears user on logout', async () => {
    const spy = vi.spyOn(apiClient, 'apiFetch').mockResolvedValueOnce({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Logged out',
      timestamp: new Date().toISOString(),
    });

    useAuthStore.getState().setUser({
      id: 'user-1',
      email: 'bayu@youten.ai',
      full_name: 'Bayu',
      status: 'active',
      role_id: 'role-1',
      role_code: 'PRO',
      role_name: 'Pro Member',
      permissions: [],
      daily_quota: 10,
      quota_used_today: 0,
      quota_remaining: 10,
      email_verified: true,
      created_at: new Date().toISOString(),
    });

    await useAuthStore.getState().logout();

    expect(spy).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
    expect(useAuthStore.getState().user).toBeNull();
  });
});
