import {
  SemanticSearchQuery,
  SemanticSearchResponse,
  WorkspaceAskRequest,
  WorkspaceAskResponse,
  SpeakerDirectoryResponse,
  WorkspaceDTO,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  WorkspaceMemberDTO,
  UpdateMemberRoleRequest,
  WorkspaceInvitationDTO,
  CreateInvitationRequest,
  FolderDTO,
  CreateFolderRequest,
  UpdateFolderRequest,
} from '../dtos';
import { ApiResponse, BaseResponse } from '../dtos/response.dto';

export interface IWorkspaceService {
  semanticSearch(query: SemanticSearchQuery): Promise<ApiResponse<SemanticSearchResponse>>;
  askWorkspace(payload: WorkspaceAskRequest): Promise<ApiResponse<WorkspaceAskResponse>>;
  getSpeakers(): Promise<ApiResponse<SpeakerDirectoryResponse>>;

  listWorkspaces(): Promise<ApiResponse<WorkspaceDTO[]>>;
  createWorkspace(payload: CreateWorkspaceRequest): Promise<ApiResponse<WorkspaceDTO>>;
  getWorkspace(id: string): Promise<ApiResponse<WorkspaceDTO>>;
  updateWorkspace(id: string, payload: UpdateWorkspaceRequest): Promise<ApiResponse<WorkspaceDTO>>;
  deleteWorkspace(id: string): Promise<BaseResponse>;

  listMembers(workspaceId: string): Promise<ApiResponse<WorkspaceMemberDTO[]>>;
  updateMemberRole(workspaceId: string, userId: string, payload: UpdateMemberRoleRequest): Promise<ApiResponse<WorkspaceMemberDTO>>;
  removeMember(workspaceId: string, userId: string): Promise<BaseResponse>;

  listInvitations(workspaceId: string): Promise<ApiResponse<WorkspaceInvitationDTO[]>>;
  createInvitation(workspaceId: string, payload: CreateInvitationRequest): Promise<ApiResponse<WorkspaceInvitationDTO>>;
  revokeInvitation(workspaceId: string, inviteId: string): Promise<BaseResponse>;
  getInvitationByToken(token: string): Promise<ApiResponse<WorkspaceInvitationDTO>>;
  acceptInvitation(token: string): Promise<ApiResponse<WorkspaceDTO>>;

  listFolders(workspaceId?: string): Promise<ApiResponse<FolderDTO[]>>;
  createFolder(payload: CreateFolderRequest): Promise<ApiResponse<FolderDTO>>;
  updateFolder(id: string, payload: UpdateFolderRequest): Promise<ApiResponse<FolderDTO>>;
  deleteFolder(id: string): Promise<BaseResponse>;
  moveRecordingFolder(recordingId: string, folderId: string | null, workspaceId?: string | null): Promise<BaseResponse>;

  // Multi-Meeting / Folder Chat Sessions
  listWorkspaceChatSessions(folderId?: string): Promise<ApiResponse<import('../dtos').WorkspaceChatSessionDTO[]>>;
  createWorkspaceChatSession(payload: import('../dtos').CreateWorkspaceChatSessionDTO): Promise<ApiResponse<import('../dtos').WorkspaceChatSessionDTO>>;
  getWorkspaceChatSessionHistory(sessionId: string): Promise<ApiResponse<import('../dtos').WorkspaceChatMessageDTO[]>>;
  deleteWorkspaceChatSession(sessionId: string): Promise<BaseResponse>;
}
