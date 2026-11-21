import { IWorkspaceService } from './workspace.service.interface';
import {
  IWorkspaceRepository,
  workspaceRepository as defaultWorkspaceRepo,
} from '../repositories';
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

export class WorkspaceService implements IWorkspaceService {
  private readonly workspaceRepo: IWorkspaceRepository;

  constructor(workspaceRepo: IWorkspaceRepository = defaultWorkspaceRepo) {
    this.workspaceRepo = workspaceRepo;
  }

  async semanticSearch(query: SemanticSearchQuery): Promise<ApiResponse<SemanticSearchResponse>> {
    return this.workspaceRepo.semanticSearch(query);
  }

  async askWorkspace(payload: WorkspaceAskRequest): Promise<ApiResponse<WorkspaceAskResponse>> {
    return this.workspaceRepo.askWorkspace(payload);
  }

  async getSpeakers(): Promise<ApiResponse<SpeakerDirectoryResponse>> {
    return this.workspaceRepo.getSpeakers();
  }

  async listWorkspaces(): Promise<ApiResponse<WorkspaceDTO[]>> {
    return this.workspaceRepo.listWorkspaces();
  }

  async createWorkspace(payload: CreateWorkspaceRequest): Promise<ApiResponse<WorkspaceDTO>> {
    return this.workspaceRepo.createWorkspace(payload);
  }

  async getWorkspace(id: string): Promise<ApiResponse<WorkspaceDTO>> {
    return this.workspaceRepo.getWorkspace(id);
  }

  async updateWorkspace(id: string, payload: UpdateWorkspaceRequest): Promise<ApiResponse<WorkspaceDTO>> {
    return this.workspaceRepo.updateWorkspace(id, payload);
  }

  async deleteWorkspace(id: string): Promise<BaseResponse> {
    return this.workspaceRepo.deleteWorkspace(id);
  }

  async listMembers(workspaceId: string): Promise<ApiResponse<WorkspaceMemberDTO[]>> {
    return this.workspaceRepo.listMembers(workspaceId);
  }

  async updateMemberRole(
    workspaceId: string,
    userId: string,
    payload: UpdateMemberRoleRequest
  ): Promise<ApiResponse<WorkspaceMemberDTO>> {
    return this.workspaceRepo.updateMemberRole(workspaceId, userId, payload);
  }

  async removeMember(workspaceId: string, userId: string): Promise<BaseResponse> {
    return this.workspaceRepo.removeMember(workspaceId, userId);
  }

  async listInvitations(workspaceId: string): Promise<ApiResponse<WorkspaceInvitationDTO[]>> {
    return this.workspaceRepo.listInvitations(workspaceId);
  }

  async createInvitation(
    workspaceId: string,
    payload: CreateInvitationRequest
  ): Promise<ApiResponse<WorkspaceInvitationDTO>> {
    return this.workspaceRepo.createInvitation(workspaceId, payload);
  }

  async revokeInvitation(workspaceId: string, inviteId: string): Promise<BaseResponse> {
    return this.workspaceRepo.revokeInvitation(workspaceId, inviteId);
  }

  async getInvitationByToken(token: string): Promise<ApiResponse<WorkspaceInvitationDTO>> {
    return this.workspaceRepo.getInvitationByToken(token);
  }

  async acceptInvitation(token: string): Promise<ApiResponse<WorkspaceDTO>> {
    return this.workspaceRepo.acceptInvitation(token);
  }

  async listFolders(workspaceId?: string): Promise<ApiResponse<FolderDTO[]>> {
    return this.workspaceRepo.listFolders(workspaceId);
  }

  async createFolder(payload: CreateFolderRequest): Promise<ApiResponse<FolderDTO>> {
    return this.workspaceRepo.createFolder(payload);
  }

  async updateFolder(id: string, payload: UpdateFolderRequest): Promise<ApiResponse<FolderDTO>> {
    return this.workspaceRepo.updateFolder(id, payload);
  }

  async deleteFolder(id: string): Promise<BaseResponse> {
    return this.workspaceRepo.deleteFolder(id);
  }

  async moveRecordingFolder(recordingId: string, folderId: string | null): Promise<BaseResponse> {
    return this.workspaceRepo.moveRecordingFolder(recordingId, folderId);
  }
}

/**
 * Colocated singleton instance for WorkspaceService.
 */
export const workspaceService: IWorkspaceService = new WorkspaceService();
