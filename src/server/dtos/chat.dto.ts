/**
 * Grounded RAG Chat and SSE event DTOs.
 * Codified directly from youten-ai-core-api/internal/dtos/llm.go & internal/sse/event.go.
 */

export interface ChatMessageInput {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface RecordingChatRequest {
  message: string;
  conversation_history?: ChatMessageInput[];
  ownership_token?: string;
}

export interface ChatTokenEvent {
  token: string;
}

export interface ChatDoneEvent {
  message_id: string;
  content: string;
  citations: string[];
  retrieved_chunk_ids: string[];
}

export interface ChatErrorEvent {
  error: string;
}

export interface ProgressEvent {
  recording_id: string;
  status: string;
  stage: string;
  progress: number;
  error_code?: string | null;
  error_message?: string | null;
  updated_at: string;
}
