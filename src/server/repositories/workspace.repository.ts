import { IWorkspaceRepository } from './workspace.repository.interface';
import { IHttpClient, httpClient as defaultHttpClient } from '../datasources/http';
import { MockDataService, mockDataService as defaultMockDataService } from '../datasources/mock';
import { env } from '../config';
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
  WorkspaceChatSessionDTO,
  CreateWorkspaceChatSessionDTO,
  WorkspaceChatMessageDTO,
} from '../dtos';
import { ApiResponse, BaseResponse } from '../dtos/response.dto';
import { ResponseStatus, ResponseCode } from '../constants';

export class WorkspaceRepository implements IWorkspaceRepository {
  private readonly http: IHttpClient;
  private readonly mock: MockDataService;
  private readonly useMock: boolean;

  constructor(
    http: IHttpClient = defaultHttpClient,
    mock: MockDataService = defaultMockDataService,
    useMock: boolean = env.MOCK_CORE_API || env.USE_MOCK_DATA
  ) {
    this.http = http;
    this.mock = mock;
    this.useMock = useMock;
  }

  async semanticSearch(query: SemanticSearchQuery): Promise<ApiResponse<SemanticSearchResponse>> {
    if (this.useMock) {
      const data = this.mock.semanticSearch(query);
      return this.successResponse(data, 'Semantic search completed successfully');
    }

    const params: Record<string, string | number | undefined> = {
      q: query.q,
    };
    if (query.limit !== undefined) params.limit = query.limit;
    if (query.threshold !== undefined) params.threshold = query.threshold;

    return this.http.get<ApiResponse<SemanticSearchResponse>>('/v1/recordings/search', { params });
  }

  async askWorkspace(payload: WorkspaceAskRequest): Promise<ApiResponse<WorkspaceAskResponse>> {
    if (this.useMock) {
      const data = this.mock.askWorkspace(payload);
      return this.successResponse(data, 'Workspace query processed');
    }
    return this.http.post<ApiResponse<WorkspaceAskResponse>>('/v1/recordings/ask', payload);
  }

  async getSpeakers(): Promise<ApiResponse<SpeakerDirectoryResponse>> {
    if (this.useMock) {
      const data = this.mock.getSpeakers();
      return this.successResponse(data, 'Speakers directory retrieved successfully');
    }
    return this.http.get<ApiResponse<SpeakerDirectoryResponse>>('/v1/speakers');
  }

  async listWorkspaces(): Promise<ApiResponse<WorkspaceDTO[]>> {
    return this.http.get<ApiResponse<WorkspaceDTO[]>>('/v1/workspaces');
  }

  async createWorkspace(payload: CreateWorkspaceRequest): Promise<ApiResponse<WorkspaceDTO>> {
    return this.http.post<ApiResponse<WorkspaceDTO>>('/v1/workspaces', payload);
  }

  async getWorkspace(id: string): Promise<ApiResponse<WorkspaceDTO>> {
    return this.http.get<ApiResponse<WorkspaceDTO>>(`/v1/workspaces/${id}`);
  }

  async updateWorkspace(id: string, payload: UpdateWorkspaceRequest): Promise<ApiResponse<WorkspaceDTO>> {
    return this.http.put<ApiResponse<WorkspaceDTO>>(`/v1/workspaces/${id}`, payload);
  }

  async deleteWorkspace(id: string): Promise<BaseResponse> {
    return this.http.delete<BaseResponse>(`/v1/workspaces/${id}`);
  }

  async listMembers(workspaceId: string): Promise<ApiResponse<WorkspaceMemberDTO[]>> {
    return this.http.get<ApiResponse<WorkspaceMemberDTO[]>>(`/v1/workspaces/${workspaceId}/members`);
  }

  async updateMemberRole(
    workspaceId: string,
    userId: string,
    payload: UpdateMemberRoleRequest
  ): Promise<ApiResponse<WorkspaceMemberDTO>> {
    return this.http.put<ApiResponse<WorkspaceMemberDTO>>(`/v1/workspaces/${workspaceId}/members/${userId}`, payload);
  }

  async removeMember(workspaceId: string, userId: string): Promise<BaseResponse> {
    return this.http.delete<BaseResponse>(`/v1/workspaces/${workspaceId}/members/${userId}`);
  }

  async listInvitations(workspaceId: string): Promise<ApiResponse<WorkspaceInvitationDTO[]>> {
    return this.http.get<ApiResponse<WorkspaceInvitationDTO[]>>(`/v1/workspaces/${workspaceId}/invites`);
  }

  async createInvitation(
    workspaceId: string,
    payload: CreateInvitationRequest
  ): Promise<ApiResponse<WorkspaceInvitationDTO>> {
    return this.http.post<ApiResponse<WorkspaceInvitationDTO>>(`/v1/workspaces/${workspaceId}/invites`, payload);
  }

  async revokeInvitation(workspaceId: string, inviteId: string): Promise<BaseResponse> {
    return this.http.delete<BaseResponse>(`/v1/workspaces/${workspaceId}/invites/${inviteId}`);
  }

  async getInvitationByToken(token: string): Promise<ApiResponse<WorkspaceInvitationDTO>> {
    return this.http.get<ApiResponse<WorkspaceInvitationDTO>>(`/v1/workspaces/invitations/${token}`);
  }

  async acceptInvitation(token: string): Promise<ApiResponse<WorkspaceDTO>> {
    return this.http.post<ApiResponse<WorkspaceDTO>>(`/v1/workspaces/invitations/${token}/accept`);
  }

  async listFolders(workspaceId?: string): Promise<ApiResponse<FolderDTO[]>> {
    return this.http.get<ApiResponse<FolderDTO[]>>('/v1/folders', { workspaceId });
  }

  async createFolder(payload: CreateFolderRequest): Promise<ApiResponse<FolderDTO>> {
    return this.http.post<ApiResponse<FolderDTO>>('/v1/folders', payload);
  }

  async updateFolder(id: string, payload: UpdateFolderRequest): Promise<ApiResponse<FolderDTO>> {
    return this.http.put<ApiResponse<FolderDTO>>(`/v1/folders/${id}`, payload);
  }

  async deleteFolder(id: string): Promise<BaseResponse> {
    return this.http.delete<BaseResponse>(`/v1/folders/${id}`);
  }

  async moveRecordingFolder(recordingId: string, folderId: string | null, workspaceId?: string | null): Promise<BaseResponse> {
    const payload: { folder_id: string | null; workspace_id?: string | null } = { folder_id: folderId };
    if (workspaceId !== undefined) {
      payload.workspace_id = workspaceId;
    }
    return this.http.patch<BaseResponse>(`/v1/recordings/${recordingId}/folder`, payload);
  }

  async listWorkspaceChatSessions(folderId?: string): Promise<ApiResponse<WorkspaceChatSessionDTO[]>> {
    const query = folderId ? `?folder_id=${encodeURIComponent(folderId)}` : '';
    return this.http.get<ApiResponse<WorkspaceChatSessionDTO[]>>(`/v1/chat/sessions${query}`);
  }

  async createWorkspaceChatSession(payload: CreateWorkspaceChatSessionDTO): Promise<ApiResponse<WorkspaceChatSessionDTO>> {
    return this.http.post<ApiResponse<WorkspaceChatSessionDTO>>('/v1/chat/sessions', payload);
  }

  async getWorkspaceChatSessionHistory(sessionId: string): Promise<ApiResponse<WorkspaceChatMessageDTO[]>> {
    return this.http.get<ApiResponse<WorkspaceChatMessageDTO[]>>(`/v1/chat/sessions/${sessionId}`);
  }

  async deleteWorkspaceChatSession(sessionId: string): Promise<BaseResponse> {
    return this.http.delete<BaseResponse>(`/v1/chat/sessions/${sessionId}`);
  }

  private baseSuccessResponse(message: string): BaseResponse {
    return {
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  private successResponse<T>(data: T, message: string): ApiResponse<T> {
    return {
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Colocated singleton instance for WorkspaceRepository.
 */
export const workspaceRepository: IWorkspaceRepository = new WorkspaceRepository();
