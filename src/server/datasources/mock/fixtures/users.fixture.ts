import { UserProfileResponse, UserResponse, AuthResponse, AnonTokenResponse } from '../../../dtos';
import { UserStatus, CustomerUserRole, CustomerUserPermission } from '../../../constants';

export const mockUser: UserResponse = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'founder@youten.ai',
  full_name: 'Bayu Anugerah',
  status: UserStatus.ACTIVE,
  role_id: '11111111-1111-1111-1111-111111111111',
  role_code: CustomerUserRole.PRO,
  role_name: 'Pro Member',
  permissions: [
    CustomerUserPermission.RECORDINGS_ALL,
    CustomerUserPermission.EXPORT_PDF,
    CustomerUserPermission.EXPORT_MARKDOWN,
    CustomerUserPermission.EXPORT_JSON,
    CustomerUserPermission.CHAT_QUERY,
  ],
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
  role_id: '11111111-1111-1111-1111-111111111111',
  role_code: CustomerUserRole.PRO,
  role_name: 'Pro Member',
  permissions: [
    CustomerUserPermission.RECORDINGS_ALL,
    CustomerUserPermission.EXPORT_PDF,
    CustomerUserPermission.EXPORT_MARKDOWN,
    CustomerUserPermission.EXPORT_JSON,
    CustomerUserPermission.CHAT_QUERY,
  ],
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
  claimed_recordings_count: 0,
};

export const mockAnonTokenResponse: AnonTokenResponse = {
  anon_token: 'mock-anon-jwt-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  session_id: '22222222-2222-2222-2222-222222222222',
  client_id: 'client-app',
  token_type: 'Bearer',
  expires_in: 604800,
  scopes: ['recordings:create', 'recordings:read', 'recordings:update'],
};

