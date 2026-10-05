import { z } from 'zod';
import { DomainLimits } from '../constants/recording.constant';
import { ChatMessageInputSchema } from './chat.schema';

export const SemanticSearchQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(1, 'Search query cannot be blank')
    .max(1000, 'Search query cannot exceed 1000 characters'),
  limit: z.coerce
    .number()
    .int()
    .min(0)
    .max(DomainLimits.MAX_SEARCH_LIMIT)
    .default(DomainLimits.DEFAULT_SEARCH_LIMIT),
  threshold: z.coerce.number().min(0.0).max(1.0).default(0.0),
});
export type SemanticSearchQueryInput = z.infer<typeof SemanticSearchQuerySchema>;

export const SearchResultItemSchema = z.object({
  recording_id: z.string().uuid(),
  recording_title: z.string(),
  chunk_index: z.number().int().nonnegative(),
  snippet: z.string(),
  start_time: z.number().nonnegative(),
  end_time: z.number().nonnegative(),
  score: z.number(),
});
export type SearchResultItem = z.infer<typeof SearchResultItemSchema>;

export const SemanticSearchResponseSchema = z.object({
  query: z.string(),
  count: z.number().int().nonnegative(),
  results: z.array(SearchResultItemSchema),
});
export type SemanticSearchResponseDto = z.infer<typeof SemanticSearchResponseSchema>;

export const WorkspaceAskRequestSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, 'Question cannot be blank')
    .max(4000, 'Question cannot exceed 4000 characters'),
  history: z.array(ChatMessageInputSchema).optional(),
});
export type WorkspaceAskRequestInput = z.infer<typeof WorkspaceAskRequestSchema>;

export const MeetingSourceCitationSchema = z.object({
  recording_id: z.string().uuid(),
  recording_title: z.string(),
  chunk_index: z.number().int().nonnegative(),
  snippet: z.string(),
  start_time: z.number().nonnegative(),
  end_time: z.number().nonnegative(),
});
export type MeetingSourceCitation = z.infer<typeof MeetingSourceCitationSchema>;

export const WorkspaceAskResponseSchema = z.object({
  answer: z.string(),
  sources: z.array(MeetingSourceCitationSchema),
});
export type WorkspaceAskResponseDto = z.infer<typeof WorkspaceAskResponseSchema>;

export const SpeakerSummarySchema = z.object({
  name: z.string(),
  total_meetings: z.number().int().nonnegative(),
  total_talk_time: z.number().nonnegative(),
  last_active: z.string(),
});
export type SpeakerSummary = z.infer<typeof SpeakerSummarySchema>;

export const SpeakerDirectoryResponseSchema = z.object({
  count: z.number().int().nonnegative(),
  speakers: z.array(SpeakerSummarySchema),
});
export type SpeakerDirectoryResponseDto = z.infer<typeof SpeakerDirectoryResponseSchema>;
