/**
 * User Feedback DTOs.
 * Codified directly from youten-ai-core-api/internal/dtos/feedback.go and go-mr-reviewer submit_feedback schema.
 */

export type FeedbackCategory = 'bug' | 'feature' | 'improvement' | 'praise' | 'general';

export interface FeedbackAttachment {
  url: string;
  filename: string;
  content_type: string;
  file_size_bytes: number;
}

export interface FeedbackRequest {
  title: string;
  category?: FeedbackCategory;
  rating?: number;
  message: string;
  user_name?: string | null;
  user_email?: string | null;
  idempotency_key?: string | null;
  attachments?: FeedbackAttachment[];
  metadata?: Record<string, unknown>;
}

export interface FeedbackResponse {
  id: string;
  title: string;
  category: string;
  rating: number;
  message: string;
  status: string;
  user_name?: string | null;
  user_email?: string | null;
  idempotency_key?: string | null;
  attachments?: FeedbackAttachment[];
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface FeedbackPresignRequest {
  filename: string;
  content_type: string;
  file_size_bytes?: number;
}

export interface FeedbackPresignResponse {
  upload_url: string;
  object_key: string;
  download_url?: string;
  filename: string;
  content_type: string;
  file_size_bytes?: number;
}

