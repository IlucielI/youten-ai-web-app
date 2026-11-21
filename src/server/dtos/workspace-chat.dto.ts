import { MeetingSourceCitationDTO } from './workspace.dto';

export interface CreateWorkspaceChatSessionDTO {
  title?: string;
  folder_id?: string | null;
}

export interface StreamWorkspaceChatDTO {
  query: string;
  session_id?: string;
  folder_id?: string | null;
}

export interface WorkspaceChatSessionDTO {
  id: string;
  workspace_id: string;
  folder_id?: string | null;
  folder_name?: string | null;
  title: string;
  user_id: string;
  message_count?: number;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceChatMessageDTO {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: MeetingSourceCitationDTO[];
  created_at: string;
}

