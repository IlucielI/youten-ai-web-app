import { z } from 'zod';

export const FeedbackCategoryEnum = z.enum(['bug', 'feature', 'improvement', 'praise', 'general']);

export const FeedbackRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(4, 'Judul minimal 4 karakter')
    .max(255, 'Judul maksimal 255 karakter'),
  category: FeedbackCategoryEnum.default('general'),
  rating: z.number().int().min(1).max(5).default(5),
  message: z
    .string()
    .trim()
    .min(10, 'Pesan minimal 10 karakter')
    .max(5000, 'Pesan maksimal 5000 karakter'),
  user_name: z.string().trim().max(150).optional().nullable(),
  user_email: z.string().trim().email('Format email tidak valid').optional().nullable().or(z.literal('')),
  idempotency_key: z.string().trim().max(100).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

export type FeedbackRequestInput = z.infer<typeof FeedbackRequestSchema>;

export const FeedbackResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  category: z.string(),
  rating: z.number(),
  message: z.string(),
  status: z.string(),
  user_name: z.string().nullable().optional(),
  user_email: z.string().nullable().optional(),
  idempotency_key: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  created_at: z.string(),
});

export type FeedbackResponseDto = z.infer<typeof FeedbackResponseSchema>;
