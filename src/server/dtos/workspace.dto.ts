/**
 * Workspace semantic search, workspace memory ask, and speaker directory DTOs.
 * Codified directly from youten-ai-core-api/internal/dtos/workspace.go.
 */

import { ChatMessageInput } from './chat.dto';

export interface SemanticSearchQuery {
  q: string;
  limit?: number;
  threshold?: number;
}

export interface SearchResultItemDTO {
  recording_id: string;
  recording_title: string;
  chunk_index: number;
  snippet: string;
  start_time: number;
  end_time: number;
  score: number;
}

export interface SemanticSearchResponse {
  query: string;
  count: number;
  results: SearchResultItemDTO[];
}

export interface WorkspaceAskRequest {
  question: string;
  history?: ChatMessageInput[];
}

export interface MeetingSourceCitationDTO {
  recording_id: string;
  recording_title: string;
  chunk_index: number;
  snippet: string;
  start_time: number;
  end_time: number;
}

export interface WorkspaceAskResponse {
  answer: string;
  sources: MeetingSourceCitationDTO[];
}

export interface SpeakerSummaryDTO {
  name: string;
  total_meetings: number;
  total_talk_time: number;
  last_active: string;
}

export interface SpeakerDirectoryResponse {
  count: number;
  speakers: SpeakerSummaryDTO[];
}
