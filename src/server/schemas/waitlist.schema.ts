import { z } from 'zod';
import { WaitlistStatus } from '../constants/recording.constant';

export const WaitlistRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .min(3, 'Email must be at least 3 characters')
    .max(255, 'Email cannot exceed 255 characters')
    .email('Invalid email format'),
  platform: z.string().trim().max(50).default('google_meet'),
  company_size: z.string().trim().max(50).default('1-10'),
});
export type WaitlistRequestInput = z.infer<typeof WaitlistRequestSchema>;

export const WaitlistResponseSchema = z.object({
  email: z.string().email(),
  platform: z.string(),
  company_size: z.string(),
  status: z.enum([WaitlistStatus.PENDING, WaitlistStatus.APPROVED, WaitlistStatus.REJECTED]).or(z.string()),
  message: z.string(),
});
export type WaitlistResponseDto = z.infer<typeof WaitlistResponseSchema>;
