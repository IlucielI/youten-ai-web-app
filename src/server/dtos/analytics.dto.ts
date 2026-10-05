/**
 * Speaker participation and recording analytics DTOs.
 * Codified directly from youten-ai-core-api/internal/dtos/recording.go.
 */

export interface SpeakerAnalyticsDTO {
  name: string;
  total_seconds: number;
  word_count: number;
  share_percent: number;
}

export interface RecordingAnalyticsDTO {
  total_duration_seconds: number;
  total_words: number;
  speakers: SpeakerAnalyticsDTO[];
}
