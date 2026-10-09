/**
 * Recording and pipeline lifecycle constants.
 * Codified directly from youten-ai-core-api (internal/constants & internal/models).
 */

export const RecordingStatus = {
  PENDING: 'PENDING',
  QUEUED: 'QUEUED',
  VALIDATING: 'VALIDATING',
  EXTRACTING: 'EXTRACTING',
  TRANSCRIBING: 'TRANSCRIBING',
  SUMMARIZING: 'SUMMARIZING',
  INDEXING: 'INDEXING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export type RecordingStatus = (typeof RecordingStatus)[keyof typeof RecordingStatus];

export const PipelineErrorCode = {
  ERR_AUDIO_CORRUPT: 'ERR_AUDIO_CORRUPT',
  ERR_EXTRACTION_FAILED: 'ERR_EXTRACTION_FAILED',
  ERR_TRANSCRIPTION_FAILED: 'ERR_TRANSCRIPTION_FAILED',
  ERR_NO_SPEECH_DETECTED: 'ERR_NO_SPEECH_DETECTED',
  ERR_SUMMARIZATION_FAILED: 'ERR_SUMMARIZATION_FAILED',
  ERR_INDEXING_FAILED: 'ERR_INDEXING_FAILED',
} as const;

export type PipelineErrorCode = (typeof PipelineErrorCode)[keyof typeof PipelineErrorCode];

export const SourceType = {
  UPLOAD: 'UPLOAD',
  LINK: 'LINK',
  LIVE_RECORDING: 'LIVE_RECORDING',
  MEETING_BOT: 'MEETING_BOT',
} as const;

export type SourceType = (typeof SourceType)[keyof typeof SourceType];

export const BotProvider = {
  DISCORD: 'discord',
  GOOGLE_MEET: 'google_meet',
  MS_TEAMS: 'ms_teams',
  ZOOM: 'zoom',
} as const;

export type BotProvider = (typeof BotProvider)[keyof typeof BotProvider];

export const BotSessionStatus = {
  DISPATCHED: 'DISPATCHED',
  WAITING_ADMIT: 'WAITING_ADMIT',
  JOINED: 'JOINED',
  RECORDING: 'RECORDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;

export type BotSessionStatus = (typeof BotSessionStatus)[keyof typeof BotSessionStatus];

export const HighlightSource = {
  MANUAL: 'manual',
  AI: 'ai',
} as const;

export type HighlightSource = (typeof HighlightSource)[keyof typeof HighlightSource];

export const ExportFormat = {
  MARKDOWN: 'markdown',
  TXT: 'txt',
  JSON: 'json',
  PDF: 'pdf',
} as const;

export type ExportFormat = (typeof ExportFormat)[keyof typeof ExportFormat];

export const ChatRole = {
  USER: 'user',
  ASSISTANT: 'assistant',
} as const;

export type ChatRole = (typeof ChatRole)[keyof typeof ChatRole];

export const UserStatus = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const WaitlistStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type WaitlistStatus = (typeof WaitlistStatus)[keyof typeof WaitlistStatus];

export const RecordingSortBy = {
  TITLE: 'title',
  DURATION_SECONDS: 'duration_seconds',
  FILE_SIZE_BYTES: 'file_size_bytes',
  CREATED_AT: 'created_at',
} as const;

export type RecordingSortBy = (typeof RecordingSortBy)[keyof typeof RecordingSortBy];

export const SortOrder = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];

export const SseEvent = {
  PROGRESS: 'progress',
  TOKEN: 'token',
  DONE: 'done',
  ERROR: 'error',
} as const;

export type SseEvent = (typeof SseEvent)[keyof typeof SseEvent];

export const DomainLimits = {
  MAX_SUMMARY_VERSIONS: 5,
  DEFAULT_USER_DAILY_QUOTA: 5,
  DEFAULT_GUEST_DAILY_QUOTA: 1,
  GUEST_RETENTION_HOURS: 24,
  MAX_SEARCH_LIMIT: 50,
  DEFAULT_SEARCH_LIMIT: 10,
  MAX_BULK_CLAIM_TOKENS: 100,
  DEFAULT_SPEAKER_LABEL: 'Speaker 0',
} as const;

export const SupportedMediaExtensions = [
  '.mp3',
  '.wav',
  '.mp4',
  '.m4a',
  '.webm',
  '.ogg',
  '.mov',
] as const;

export type SupportedMediaExtension = (typeof SupportedMediaExtensions)[number];

export const SupportedMimeTypes = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/mp4',
  'video/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/webm',
  'video/webm',
  'audio/ogg',
  'video/quicktime',
] as const;

export type SupportedMimeType = (typeof SupportedMimeTypes)[number];
