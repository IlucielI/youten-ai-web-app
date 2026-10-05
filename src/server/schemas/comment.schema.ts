import { z } from 'zod';

export const CreateCommentRequestSchema = z.object({
  timestamp_sec: z.number().min(0, 'Timestamp cannot be negative'),
  segment_id: z.string().uuid().nullable().optional(),
  selected_text: z.string().trim().nullable().optional(),
  comment_text: z
    .string()
    .trim()
    .min(1, 'Comment text cannot be empty')
    .max(5000, 'Comment text cannot exceed 5000 characters'),
  author_name: z.string().trim().max(100, 'Author name cannot exceed 100 characters').default('Anonymous'),
  parent_id: z.string().uuid().nullable().optional(),
  ownership_token: z.string().trim().optional(),
});
export type CreateCommentRequestInput = z.infer<typeof CreateCommentRequestSchema>;

export type CommentResponseDto = {
  id: string;
  recording_id?: string;
  user_id?: string | null;
  segment_id?: string | null;
  timestamp_sec: number;
  selected_text?: string | null;
  author_name: string;
  comment_text: string;
  parent_id?: string | null;
  replies?: CommentResponseDto[];
  created_at: string;
  updated_at?: string;
};

export const CommentResponseSchema: z.ZodType<CommentResponseDto> = z.lazy(() =>
  z.object({
    id: z.string().uuid(),
    recording_id: z.string().uuid().optional(),
    user_id: z.string().uuid().nullable().optional(),
    segment_id: z.string().uuid().nullable().optional(),
    timestamp_sec: z.number().nonnegative(),
    selected_text: z.string().nullable().optional(),
    author_name: z.string(),
    comment_text: z.string(),
    parent_id: z.string().uuid().nullable().optional(),
    replies: z.array(CommentResponseSchema).optional(),
    created_at: z.string(),
    updated_at: z.string().optional(),
  })
);
