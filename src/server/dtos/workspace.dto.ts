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
  folder_id?: string | null;
  folder_name?: string | null;
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

export interface WorkspaceDTO {
  id: string;
  name: string;
  slug: string;
  description?: string;
  owner_id: string;
  role?: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
}

export interface UpdateWorkspaceRequest {
  name?: string;
  description?: string;
}

export interface WorkspaceMemberDTO {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  full_name?: string;
  email?: string;
  created_at: string;
}

export interface UpdateMemberRoleRequest {
  role: 'owner' | 'admin' | 'member' | 'viewer';
}

export interface WorkspaceInvitationDTO {
  id: string;
  workspace_id: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  token: string;
  accepted_at?: string | null;
  expires_at: string;
  workspace_name?: string;
  inviter_name?: string;
  created_at: string;
}

export interface CreateInvitationRequest {
  email: string;
  role: 'admin' | 'member' | 'viewer';
}

export interface FolderDTO {
  id: string;
  workspace_id: string;
  name: string;
  parent_id?: string | null;
  recordings_count?: number;
  children?: FolderDTO[];
  created_at: string;
  updated_at?: string;
}

export interface CreateFolderRequest {
  name: string;
  parent_id?: string | null;
}

export interface UpdateFolderRequest {
  name?: string;
  parent_id?: string | null;
}

export interface MoveRecordingFolderRequest {
  folder_id?: string | null;
}
