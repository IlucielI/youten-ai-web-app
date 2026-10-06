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
} from '../dtos';
import { ApiResponse } from '../dtos/response.dto';

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
}

/**
 * Colocated singleton instance for WorkspaceService.
 */
export const workspaceService: IWorkspaceService = new WorkspaceService();
