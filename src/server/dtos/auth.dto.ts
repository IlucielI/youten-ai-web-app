/**
 * Authentication and user lifecycle DTOs.
 * Codified directly from youten-ai-core-api/internal/dtos/auth.go.
 */

import type { UserStatus } from '../constants/recording.constant';

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  anon_token?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  status: UserStatus;
  role_id?: string | null;
  role_code?: string;
  role_name?: string;
  permissions?: string[];
  daily_quota: number;
  daily_quota_override?: number | null;
  email_verified: boolean;
  created_at: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  full_name: string;
  status: UserStatus;
  role_id?: string | null;
  role_code?: string;
  role_name?: string;
  permissions?: string[];
  daily_quota: number;
  quota_used_today: number;
  quota_remaining: number;
  email_verified: boolean;
  created_at: string;
}

export interface UpdateProfileRequest {
  full_name: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  anon_token?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in: number;
  user: UserResponse;
  claimed_recordings_count?: number;
}

export interface AnonTokenResponse {
  anon_token: string;
  session_id: string;
  client_id: string;
  token_type: string;
  expires_in: number;
  scopes: string[];
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

