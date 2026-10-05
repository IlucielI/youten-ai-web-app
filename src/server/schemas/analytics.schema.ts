import { z } from 'zod';

export const SpeakerAnalyticsSchema = z.object({
  name: z.string(),
  total_seconds: z.number().nonnegative(),
  word_count: z.number().int().nonnegative(),
  share_percent: z.number().min(0).max(100),
});
export type SpeakerAnalyticsSchemaType = z.infer<typeof SpeakerAnalyticsSchema>;

export const RecordingAnalyticsSchema = z.object({
  total_duration_seconds: z.number().nonnegative(),
  total_words: z.number().int().nonnegative(),
  speakers: z.array(SpeakerAnalyticsSchema),
});
export type RecordingAnalyticsSchemaType = z.infer<typeof RecordingAnalyticsSchema>;
