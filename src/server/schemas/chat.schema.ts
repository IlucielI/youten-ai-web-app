import { z } from 'zod';
import { ChatRole } from '../constants/recording.constant';

export const ChatMessageInputSchema = z.object({
  role: z.enum([ChatRole.USER, ChatRole.ASSISTANT, 'system']),
  content: z.string().trim().min(1, 'Content cannot be empty'),
});
export type ChatMessageInputDto = z.infer<typeof ChatMessageInputSchema>;

export const RecordingChatRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(4000, 'Message cannot exceed 4000 characters'),
  conversation_history: z.array(ChatMessageInputSchema).optional(),
  ownership_token: z.string().trim().optional(),
});
export type RecordingChatRequestInput = z.infer<typeof RecordingChatRequestSchema>;

export const ChatTokenEventSchema = z.object({
  token: z.string(),
});
export type ChatTokenEventDto = z.infer<typeof ChatTokenEventSchema>;

export const ChatDoneEventSchema = z.object({
  message_id: z.string().uuid(),
  content: z.string(),
  citations: z.array(z.string()),
  retrieved_chunk_ids: z.array(z.string()),
});
export type ChatDoneEventDto = z.infer<typeof ChatDoneEventSchema>;

export const ChatErrorEventSchema = z.object({
  error: z.string(),
});
export type ChatErrorEventDto = z.infer<typeof ChatErrorEventSchema>;

export const ProgressEventSchema = z.object({
  recording_id: z.string().uuid(),
  status: z.string(),
  stage: z.string(),
  progress: z.number().int().min(0).max(100),
  error_code: z.string().nullable().optional(),
  error_message: z.string().nullable().optional(),
  updated_at: z.string(),
});
export type ProgressEventDto = z.infer<typeof ProgressEventSchema>;
