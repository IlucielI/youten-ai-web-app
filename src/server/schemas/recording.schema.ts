import { z } from 'zod';
import {
  RecordingStatus,
  PipelineErrorCode,
  SourceType,
  HighlightSource,
  RecordingSortBy,
  SortOrder,
} from '../constants/recording.constant';
import { SummaryDtoSchema } from './summary.schema';
import { PaginationMetaSchema } from './common.schema';

/**
 * -----------------------------------------------------------------------------
 * 1. Ingestion & Pre-flight Schemas
 * -----------------------------------------------------------------------------
 */

export const PresignUploadRequestSchema = z.object({
  filename: z.string().trim().min(1, 'Filename is required').max(255, 'Filename cannot exceed 255 characters'),
  content_type: z.string().trim().min(1, 'Content-Type is required'),
});
export type PresignUploadRequestInput = z.infer<typeof PresignUploadRequestSchema>;

export const PresignUploadResponseSchema = z.object({
  upload_url: z.string().url(),
  object_key: z.string(),
  filename: z.string(),
});
export type PresignUploadResponseDto = z.infer<typeof PresignUploadResponseSchema>;

export const UploadRecordingRequestSchema = z.object({
  filename: z.string().trim().min(1, 'Filename is required').max(255),
  object_key: z.string().trim().min(1, 'Object key is required'),
  title: z.string().trim().max(255).optional(),
  template: z.string().trim().max(100).optional(),
  language: z.string().trim().max(50).optional(),
});
export type UploadRecordingRequestInput = z.infer<typeof UploadRecordingRequestSchema>;

export const RecordingUploadResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  original_filename: z.string(),
  file_size_bytes: z.number().int().nonnegative(),
  status: z.enum([
    RecordingStatus.PENDING,
    RecordingStatus.QUEUED,
    RecordingStatus.VALIDATING,
    RecordingStatus.EXTRACTING,
    RecordingStatus.TRANSCRIBING,
    RecordingStatus.SUMMARIZING,
    RecordingStatus.INDEXING,
    RecordingStatus.COMPLETED,
    RecordingStatus.FAILED,
  ]),
  selected_template: z.string(),
  output_language: z.string(),
  is_guest: z.boolean(),
  ownership_token: z.string().nullable().optional(),
  created_at: z.string(),
});
export type RecordingUploadResponseDto = z.infer<typeof RecordingUploadResponseSchema>;

export const ImportUrlRequestSchema = z.object({
  url: z.string().trim().url('Invalid URL format').refine(
    (u) => u.startsWith('http://') || u.startsWith('https://'),
    'Only http and https schemes are allowed'
  ),
  title: z.string().trim().max(255).optional(),
  template: z.string().trim().max(100).optional(),
  language: z.string().trim().max(50).optional(),
});
export type ImportUrlRequestInput = z.infer<typeof ImportUrlRequestSchema>;

/**
 * -----------------------------------------------------------------------------
 * 2. Playback, Transcript & Detail Schemas
 * -----------------------------------------------------------------------------
 */

export const WordResultSchema = z.object({
  word: z.string(),
  start: z.number().nonnegative(),
  end: z.number().nonnegative(),
  probability: z.number().min(0).max(1).optional(),
});
export type WordResult = z.infer<typeof WordResultSchema>;

export const TranscriptSegmentSchema = z.object({
  id: z.string().uuid(),
  speaker_label: z.string(),
  speaker_name: z.string(),
  start_time: z.number().nonnegative(),
  end_time: z.number().nonnegative(),
  text: z.string(),
  words_data: z.array(WordResultSchema).nullable().optional(),
  sequence_order: z.number().int().nonnegative(),
});
export type TranscriptSegment = z.infer<typeof TranscriptSegmentSchema>;

export const ChapterSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  start_time: z.number().nonnegative(),
  end_time: z.number().nonnegative(),
  summary: z.string(),
  sequence_order: z.number().int().nonnegative(),
  created_at: z.string(),
});
export type Chapter = z.infer<typeof ChapterSchema>;

export const HighlightSchema = z.object({
  id: z.string().uuid(),
  start_time: z.number().nonnegative(),
  end_time: z.number().nonnegative(),
  title: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  source: z.enum([HighlightSource.MANUAL, HighlightSource.AI]),
  clip_url: z.string().nullable().optional(),
  created_at: z.string(),
});
export type Highlight = z.infer<typeof HighlightSchema>;

export const RecordingDetailResponseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable().optional(),
  title: z.string(),
  original_filename: z.string(),
  file_size_bytes: z.number().int().nonnegative(),
  duration_seconds: z.number().nonnegative(),
  audio_url: z.string().nullable().optional(),
  playback_url: z.string().nullable().optional(),
  source_type: z.enum([SourceType.UPLOAD, SourceType.LINK]),
  status: z.enum([
    RecordingStatus.PENDING,
    RecordingStatus.QUEUED,
    RecordingStatus.VALIDATING,
    RecordingStatus.EXTRACTING,
    RecordingStatus.TRANSCRIBING,
    RecordingStatus.SUMMARIZING,
    RecordingStatus.INDEXING,
    RecordingStatus.COMPLETED,
    RecordingStatus.FAILED,
  ]),
  error_message: z.string().nullable().optional(),
  error_code: z.enum([
    PipelineErrorCode.ERR_AUDIO_CORRUPT,
    PipelineErrorCode.ERR_EXTRACTION_FAILED,
    PipelineErrorCode.ERR_TRANSCRIPTION_FAILED,
    PipelineErrorCode.ERR_NO_SPEECH_DETECTED,
    PipelineErrorCode.ERR_SUMMARIZATION_FAILED,
    PipelineErrorCode.ERR_INDEXING_FAILED,
  ]).nullable().optional(),
  selected_template: z.string(),
  detected_language: z.string().nullable().optional(),
  output_language: z.string(),
  is_guest: z.boolean(),
  consent_given: z.boolean(),
  consent_version: z.string(),
  expires_at: z.string().nullable().optional(),
  analytics_data: z.record(z.string(), z.unknown()).nullable().optional(),
  segments: z.array(TranscriptSegmentSchema),
  active_summary: SummaryDtoSchema.nullable().optional(),
  chapters: z.array(ChapterSchema),
  highlights: z.array(HighlightSchema),
  created_at: z.string(),
  updated_at: z.string(),
});
export type RecordingDetailDto = z.infer<typeof RecordingDetailResponseSchema>;

/**
 * -----------------------------------------------------------------------------
 * 3. Library & Listing Schemas
 * -----------------------------------------------------------------------------
 */

export const RecordingListItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  original_filename: z.string(),
  file_size_bytes: z.number().int().nonnegative(),
  duration_seconds: z.number().nonnegative(),
  source_type: z.string(),
  status: z.string(),
  selected_template: z.string(),
  detected_language: z.string().nullable().optional(),
  output_language: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type RecordingListItemDto = z.infer<typeof RecordingListItemSchema>;

export const RecordingListResponseSchema = z.object({
  items: z.array(RecordingListItemSchema),
  pagination: PaginationMetaSchema,
});
export type RecordingListResponseDto = z.infer<typeof RecordingListResponseSchema>;

export const RecordingFilterQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.string().trim().optional(),
  template: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sort_by: z.enum([
    RecordingSortBy.TITLE,
    RecordingSortBy.DURATION_SECONDS,
    RecordingSortBy.FILE_SIZE_BYTES,
    RecordingSortBy.CREATED_AT,
  ]).default(RecordingSortBy.CREATED_AT),
  sort_order: z.enum([SortOrder.ASC, SortOrder.DESC]).default(SortOrder.DESC),
});
export type RecordingFilterQueryInput = z.infer<typeof RecordingFilterQuerySchema>;

/**
 * -----------------------------------------------------------------------------
 * 4. Claim, Share, Speakers, and Retry Schemas
 * -----------------------------------------------------------------------------
 */

export const ClaimRecordingRequestSchema = z.object({
  ownership_token: z.string().trim().min(1, 'Ownership token is required').max(255),
});
export type ClaimRecordingRequestInput = z.infer<typeof ClaimRecordingRequestSchema>;

export const BulkClaimRequestSchema = z.object({
  tokens: z
    .array(z.string().trim().min(1).max(255))
    .min(1, 'At least one token is required')
    .max(100, 'Cannot claim more than 100 tokens at once'),
});
export type BulkClaimRequestInput = z.infer<typeof BulkClaimRequestSchema>;

export const BulkClaimResponseSchema = z.object({
  claimed_count: z.number().int().nonnegative(),
  recording_ids: z.array(z.string().uuid()),
});
export type BulkClaimResponseDto = z.infer<typeof BulkClaimResponseSchema>;

export const ShareToggleRequestSchema = z.object({
  is_share_enabled: z.boolean(),
});
export type ShareToggleRequestInput = z.infer<typeof ShareToggleRequestSchema>;

export const ShareToggleResponseSchema = z.object({
  is_share_enabled: z.boolean(),
  share_token: z.string().nullable().optional(),
  share_url: z.string().nullable().optional(),
});
export type ShareToggleResponseDto = z.infer<typeof ShareToggleResponseSchema>;

export const SharedRecordingResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  duration_seconds: z.number().nonnegative(),
  audio_url: z.string().nullable().optional(),
  playback_url: z.string().nullable().optional(),
  selected_template: z.string(),
  detected_language: z.string().nullable().optional(),
  output_language: z.string(),
  segments: z.array(TranscriptSegmentSchema),
  active_summary: SummaryDtoSchema.nullable().optional(),
  chapters: z.array(ChapterSchema),
  highlights: z.array(HighlightSchema),
  created_at: z.string(),
});
export type SharedRecordingResponseDto = z.infer<typeof SharedRecordingResponseSchema>;

export const RetryRecordingRequestSchema = z.object({
  ownership_token: z.string().trim().optional(),
});
export type RetryRecordingRequestInput = z.infer<typeof RetryRecordingRequestSchema>;

export const RetryRecordingResponseSchema = z.object({
  id: z.string().uuid(),
  status: z.string(),
  stage: z.string(),
  message: z.string(),
  updated_at: z.string(),
});
export type RetryRecordingResponseDto = z.infer<typeof RetryRecordingResponseSchema>;

export const UpdateSpeakersRequestSchema = z.object({
  speakers: z
    .record(
      z.string().trim().min(1, 'Speaker label cannot be blank').max(50, 'Speaker label cannot exceed 50 characters'),
      z.string().trim().min(1, 'Speaker name cannot be blank').max(100, 'Speaker name cannot exceed 100 characters')
    )
    .refine((mapping) => Object.keys(mapping).length > 0, {
      message: 'Speakers mapping cannot be empty',
    }),
  ownership_token: z.string().trim().optional(),
});
export type UpdateSpeakersRequestInput = z.infer<typeof UpdateSpeakersRequestSchema>;

export const UpdateSpeakersResponseSchema = z.object({
  updated_count: z.number().int().nonnegative(),
  speakers: z.record(z.string(), z.string()),
});
export type UpdateSpeakersResponseDto = z.infer<typeof UpdateSpeakersResponseSchema>;
