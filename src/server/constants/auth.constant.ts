/**
 * Authentication, session cookie, and transport header constants.
 */

export const AUTH_COOKIE_NAME = 'youten_access_token';
export const REFRESH_COOKIE_NAME = 'youten_refresh_token';
export const GUEST_COOKIE_NAME = 'youten_guest_token';

export const ANON_TOKEN_HEADER = 'x-anon-token';
export const OWNERSHIP_TOKEN_HEADER = 'x-ownership-token';
export const FORWARDED_FOR_HEADER = 'x-forwarded-for';
export const REAL_IP_HEADER = 'x-real-ip';
export const CLIENT_IP_HEADER = 'x-client-ip';

export const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes in seconds
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds
export const GUEST_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export const AUTH_COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export enum CustomerUserRole {
  FREE = 'FREE',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export enum CustomerUserPermission {
  RECORDINGS_READ = 'recordings:read',
  RECORDINGS_CREATE = 'recordings:create',
  RECORDINGS_DELETE = 'recordings:delete',
  RECORDINGS_ALL = 'recordings:*',
  EXPORT_PDF = 'export:pdf',
  EXPORT_MARKDOWN = 'export:markdown',
  EXPORT_JSON = 'export:json',
  CHAT_QUERY = 'chat:query',
}
