import { z } from 'zod';
import { UserStatus } from '../constants/recording.constant';

/**
 * Password validation matching Core API rules:
 * - 8 to 72 characters
 * - Must contain at least one digit
 */
export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must not exceed 72 characters')
  .regex(/[0-9]/, 'Password must contain at least one digit');

export const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Email is required')
  .email('Invalid email format');

export const FullNameSchema = z
  .string()
  .trim()
  .min(2, 'Full name must be at least 2 characters')
  .max(100, 'Full name must not exceed 100 characters');

export const RegisterRequestSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  full_name: FullNameSchema,
  anon_token: z.string().trim().optional(),
});
export type RegisterRequestInput = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password is required'),
  anon_token: z.string().trim().optional(),
});
export type LoginRequestInput = z.infer<typeof LoginRequestSchema>;

export const RefreshTokenRequestSchema = z.object({
  refresh_token: z.string().trim().min(1, 'Refresh token is required'),
});
export type RefreshTokenRequestInput = z.infer<typeof RefreshTokenRequestSchema>;

export const LogoutRequestSchema = z.object({
  refresh_token: z.string().trim().min(1, 'Refresh token is required'),
});
export type LogoutRequestInput = z.infer<typeof LogoutRequestSchema>;

export const ForgotPasswordRequestSchema = z.object({
  email: EmailSchema,
});
export type ForgotPasswordRequestInput = z.infer<typeof ForgotPasswordRequestSchema>;

export const ResetPasswordRequestSchema = z.object({
  token: z.string().trim().min(1, 'Reset token is required'),
  new_password: PasswordSchema,
});
export type ResetPasswordRequestInput = z.infer<typeof ResetPasswordRequestSchema>;

export const UpdateProfileRequestSchema = z.object({
  full_name: FullNameSchema,
});
export type UpdateProfileRequestInput = z.infer<typeof UpdateProfileRequestSchema>;

export const ChangePasswordRequestSchema = z
  .object({
    old_password: z.string().min(1, 'Old password is required'),
    new_password: PasswordSchema,
  })
  .refine((data) => data.new_password !== data.old_password, {
    message: 'New password cannot be the same as current password',
    path: ['new_password'],
  });
export type ChangePasswordRequestInput = z.infer<typeof ChangePasswordRequestSchema>;

export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string(),
  status: z.enum([UserStatus.ACTIVE, UserStatus.SUSPENDED]),
  role_id: z.string().uuid().nullable().optional(),
  role_code: z.string().optional(),
  role_name: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  daily_quota: z.number().int().nonnegative(),
  daily_quota_override: z.number().int().positive().nullable().optional(),
  email_verified: z.boolean(),
  created_at: z.string(),
});
export type UserResponseDto = z.infer<typeof UserResponseSchema>;

export const UserProfileResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string(),
  status: z.enum([UserStatus.ACTIVE, UserStatus.SUSPENDED]),
  role_id: z.string().uuid().nullable().optional(),
  role_code: z.string().optional(),
  role_name: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  daily_quota: z.number().int().nonnegative(),
  quota_used_today: z.number().int().nonnegative(),
  quota_remaining: z.number().int().nonnegative(),
  email_verified: z.boolean(),
  created_at: z.string(),
});
export type UserProfileResponseDto = z.infer<typeof UserProfileResponseSchema>;

export const AuthResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string().default('Bearer'),
  expires_in: z.number().int().positive(),
  refresh_expires_in: z.number().int().positive(),
  user: UserResponseSchema,
  claimed_recordings_count: z.number().int().nonnegative().optional(),
});
export type AuthResponseDto = z.infer<typeof AuthResponseSchema>;

export const AnonTokenResponseSchema = z.object({
  anon_token: z.string(),
  session_id: z.string().uuid(),
  client_id: z.string(),
  token_type: z.string().default('Bearer'),
  expires_in: z.number().int().positive(),
  scopes: z.array(z.string()),
});
export type AnonTokenResponseDto = z.infer<typeof AnonTokenResponseSchema>;

