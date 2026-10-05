/**
 * Recording ingestion, playback, detail, and sharing DTOs.
 * Codified directly from youten-ai-core-api/internal/dtos/recording.go & stt.go.
 */

import { SummaryDTO } from './summary.dto';
import { PaginationMeta } from './response.dto';

export interface PresignUploadRequest {
  filename: string;
  content_type: string;
}

export interface PresignUploadResponse {
  upload_url: string;
  object_key: string;
  filename: string;
}

export interface UploadRecordingRequest {
  filename: string;
  object_key: string;
  title?: string;
  template?: string;
  language?: string;
}

export interface RecordingUploadResponse {
  id: string;
  title: string;
  original_filename: string;
  file_size_bytes: number;
  status: string;
  selected_template: string;
  output_language: string;
  is_guest: boolean;
  ownership_token?: string | null;
  created_at: string;
}

export interface ImportURLRequest {
  url: string;
  title?: string;
  template?: string;
  language?: string;
}

export interface WordResultDTO {
  word: string;
  start: number;
  end: number;
  probability?: number;
}

export interface TranscriptSegmentDTO {
  id: string;
  speaker_label: string;
  speaker_name: string;
  start_time: number;
  end_time: number;
  text: string;
  words_data?: WordResultDTO[] | null;
  sequence_order: number;
}

export interface ChapterDTO {
  id: string;
  title: string;
  start_time: number;
  end_time: number;
  summary: string;
  sequence_order: number;
  created_at: string;
}

export interface HighlightDTO {
  id: string;
  start_time: number;
  end_time: number;
  title?: string | null;
  note?: string | null;
  source: string;
  clip_url?: string | null;
  created_at: string;
}

export interface RecordingDetailResponse {
  id: string;
  user_id?: string | null;
  title: string;
  original_filename: string;
  file_size_bytes: number;
  duration_seconds: number;
  audio_url?: string | null;
  playback_url?: string | null;
  source_type: string;
  status: string;
  error_message?: string | null;
  error_code?: string | null;
  selected_template: string;
  detected_language?: string | null;
  output_language: string;
  is_guest: boolean;
  consent_given: boolean;
  consent_version: string;
  expires_at?: string | null;
  analytics_data?: Record<string, unknown> | null;
  segments: TranscriptSegmentDTO[];
  active_summary?: SummaryDTO | null;
  chapters: ChapterDTO[];
  highlights: HighlightDTO[];
  created_at: string;
  updated_at: string;
}

export interface RecordingListItemDTO {
  id: string;
  title: string;
  original_filename: string;
  file_size_bytes: number;
  duration_seconds: number;
  source_type: string;
  status: string;
  selected_template: string;
  detected_language?: string | null;
  output_language: string;
  created_at: string;
  updated_at: string;
}

export interface RecordingListResponse {
  items: RecordingListItemDTO[];
  pagination: PaginationMeta;
}

export interface RecordingFilterQuery {
  search?: string;
  status?: string;
  template?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface ClaimRecordingRequest {
  ownership_token: string;
}

export interface BulkClaimRequest {
  tokens: string[];
}

export interface BulkClaimResponse {
  claimed_count: number;
  recording_ids: string[];
}

export interface ShareToggleRequest {
  is_share_enabled: boolean;
}

export interface ShareToggleResponse {
  is_share_enabled: boolean;
  share_token?: string | null;
  share_url?: string | null;
}

export interface SharedRecordingResponse {
  id: string;
  title: string;
  duration_seconds: number;
  audio_url?: string | null;
  playback_url?: string | null;
  selected_template: string;
  detected_language?: string | null;
  output_language: string;
  segments: TranscriptSegmentDTO[];
  active_summary?: SummaryDTO | null;
  chapters: ChapterDTO[];
  highlights: HighlightDTO[];
  created_at: string;
}

export interface RetryRecordingRequest {
  ownership_token?: string;
}

export interface RetryRecordingResponse {
  id: string;
  status: string;
  stage: string;
  message: string;
  updated_at: string;
}

export interface UpdateSpeakersRequest {
  speakers: Record<string, string>;
  ownership_token?: string;
}

export interface UpdateSpeakersResponse {
  updated_count: number;
  speakers: Record<string, string>;
}

export type ImportUrlRequest = ImportURLRequest;
export type RecordingListItem = RecordingListItemDTO;
