import { UserProfileResponse, UserResponse, AuthResponse } from '../../../dtos';
import { UserStatus } from '../../../constants';

export const mockUser: UserResponse = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'founder@youten.ai',
  full_name: 'Bayu Anugerah',
  status: UserStatus.ACTIVE,
  daily_quota: 5,
  daily_quota_override: null,
  email_verified: true,
  created_at: '2026-10-01T00:00:00.000Z',
};

export const mockUserProfile: UserProfileResponse = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'founder@youten.ai',
  full_name: 'Bayu Anugerah',
  status: UserStatus.ACTIVE,
  daily_quota: 5,
  quota_used_today: 1,
  quota_remaining: 4,
  email_verified: true,
  created_at: '2026-10-01T00:00:00.000Z',
};

export const mockAuthResponse: AuthResponse = {
  access_token: 'mock-access-token-jwt-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  refresh_token: 'mock-refresh-token-jwt-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  token_type: 'Bearer',
  expires_in: 900, // 15 mins
  refresh_expires_in: 604800, // 7 days
  user: mockUser,
};
