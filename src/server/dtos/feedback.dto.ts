/**
 * User Feedback DTOs.
 * Codified directly from youten-ai-core-api/internal/dtos/feedback.go and go-mr-reviewer submit_feedback schema.
 */

export type FeedbackCategory = 'bug' | 'feature' | 'improvement' | 'praise' | 'general';

export interface FeedbackRequest {
  title: string;
  category?: FeedbackCategory;
  rating?: number;
  message: string;
  user_name?: string | null;
  user_email?: string | null;
  idempotency_key?: string | null;
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
  metadata?: Record<string, unknown>;
  created_at: string;
}
