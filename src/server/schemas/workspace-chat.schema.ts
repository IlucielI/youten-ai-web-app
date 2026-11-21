import { z } from 'zod';
import { MeetingSourceCitationSchema } from './workspace.schema';

export const CreateWorkspaceChatSessionSchema = z.object({
  title: z.string().trim().max(120, 'Title cannot exceed 120 characters').optional(),
  folder_id: z.string().uuid().nullable().optional(),
});
export type CreateWorkspaceChatSessionInput = z.infer<typeof CreateWorkspaceChatSessionSchema>;

export const StreamWorkspaceChatSchema = z
  .object({
    query: z.string().trim().max(4000, 'Query cannot exceed 4000 characters').optional(),
    question: z.string().trim().max(4000, 'Question cannot exceed 4000 characters').optional(),
    session_id: z.string().uuid().optional(),
    folder_id: z.string().uuid().nullable().optional(),
  })
  .transform((data) => ({
    ...data,
    query: (data.query || data.question || '').trim(),
  }))
  .refine((data) => data.query.length > 0, {
    message: 'Query cannot be empty',
    path: ['query'],
  });
export type StreamWorkspaceChatInput = z.infer<typeof StreamWorkspaceChatSchema>;

export const WorkspaceChatSessionSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  folder_id: z.string().uuid().nullable().optional(),
  folder_name: z.string().nullable().optional(),
  title: z.string(),
  user_id: z.string().uuid(),
  message_count: z.number().int().nonnegative().optional(),
  last_message_at: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type WorkspaceChatSessionDto = z.infer<typeof WorkspaceChatSessionSchema>;

export const WorkspaceChatMessageSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  citations: z.array(MeetingSourceCitationSchema).optional(),
  created_at: z.string(),
});
export type WorkspaceChatMessageDto = z.infer<typeof WorkspaceChatMessageSchema>;

