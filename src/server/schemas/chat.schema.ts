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
  session_id: z.string().uuid().optional(),
  share_token: z.string().trim().optional(),
});
export type RecordingChatRequestInput = z.infer<typeof RecordingChatRequestSchema>;

export const ChatSessionEventSchema = z.object({
  session_id: z.string().uuid(),
});
export type ChatSessionEventDto = z.infer<typeof ChatSessionEventSchema>;

export const ChatTokenEventSchema = z.object({
  token: z.string(),
});
export type ChatTokenEventDto = z.infer<typeof ChatTokenEventSchema>;

export const ChatDoneEventSchema = z.object({
  message_id: z.string().uuid(),
  session_id: z.string().uuid().optional(),
  content: z.string(),
  citations: z.array(z.string()),
  retrieved_chunk_ids: z.array(z.string()),
});
export type ChatDoneEventDto = z.infer<typeof ChatDoneEventSchema>;

export const ChatMessageResponseSchema = z.object({
  id: z.string().uuid(),
  recording_id: z.string().uuid(),
  session_id: z.string().uuid().nullable().optional(),
  role: z.enum([ChatRole.USER, ChatRole.ASSISTANT, 'system']),
  content: z.string(),
  referenced_chunk_ids: z.array(z.string()).nullable().optional(),
  created_at: z.string(),
});
export type ChatMessageResponseDto = z.infer<typeof ChatMessageResponseSchema>;

export const ChatHistoryResponseSchema = z.object({
  status: z.string(),
  code: z.string(),
  message: z.string(),
  data: z.array(ChatMessageResponseSchema),
});
export type ChatHistoryResponseDto = z.infer<typeof ChatHistoryResponseSchema>;

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
