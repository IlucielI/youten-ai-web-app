import {
  SemanticSearchQuery,
  SemanticSearchResponse,
  WorkspaceAskRequest,
  WorkspaceAskResponse,
  SpeakerDirectoryResponse,
} from '../dtos';
import { ApiResponse } from '../dtos/response.dto';

export interface IWorkspaceService {
  semanticSearch(query: SemanticSearchQuery): Promise<ApiResponse<SemanticSearchResponse>>;
  askWorkspace(payload: WorkspaceAskRequest): Promise<ApiResponse<WorkspaceAskResponse>>;
  getSpeakers(): Promise<ApiResponse<SpeakerDirectoryResponse>>;
}
