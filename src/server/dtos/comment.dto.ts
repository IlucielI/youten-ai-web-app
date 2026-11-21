/**
 * Timestamped inline comments DTOs.
 * Codified directly from youten-ai-core-api/internal/dtos/recording.go.
 */

export interface CreateCommentRequest {
  timestamp_sec: number;
  segment_id?: string | null;
  selected_text?: string | null;
  comment_text: string;
  author_name: string;
  parent_id?: string | null;
  ownership_token?: string;
  mentioned_user_ids?: string[];
}

export interface CommentMentionDTO {
  id: string;
  user_id: string;
  full_name?: string;
  email?: string;
}

export interface CommentResponse {
  id: string;
  recording_id?: string;
  user_id?: string | null;
  segment_id?: string | null;
  timestamp_sec: number;
  selected_text?: string | null;
  author_name: string;
  comment_text: string;
  parent_id?: string | null;
  replies?: CommentResponse[];
  mentions?: CommentMentionDTO[];
  created_at: string;
  updated_at?: string;
}
