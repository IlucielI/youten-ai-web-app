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
} from '../dtos';
import { ApiResponse } from '../dtos/response.dto';
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
