import { ICommentRepository } from './comment.repository.interface';
import { IHttpClient, httpClient as defaultHttpClient } from '../datasources/http';
import { MockDataService, mockDataService as defaultMockDataService } from '../datasources/mock';
import { env } from '../config';
import {
  CreateCommentRequest,
  CommentResponse,
} from '../dtos';
import { ApiResponse, BaseResponse } from '../dtos/response.dto';
import { ResponseStatus, ResponseCode } from '../constants';

export class CommentRepository implements ICommentRepository {
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

  async createComment(
    recordingId: string,
    payload: CreateCommentRequest
  ): Promise<ApiResponse<CommentResponse>> {
    if (this.useMock) {
      const data = this.mock.createComment(recordingId, payload);
      return this.successResponse(data, 'Comment created successfully');
    }
    return this.http.post<ApiResponse<CommentResponse>>(
      `/v1/recordings/${recordingId}/comments`,
      payload
    );
  }

  async listComments(recordingId: string): Promise<ApiResponse<CommentResponse[]>> {
    if (this.useMock) {
      const data = this.mock.listComments(recordingId);
      return this.successResponse(data, 'Comments retrieved successfully');
    }
    return this.http.get<ApiResponse<CommentResponse[]>>(
      `/v1/recordings/${recordingId}/comments`
    );
  }

  async deleteComment(recordingId: string, commentId: string): Promise<BaseResponse> {
    if (this.useMock) {
      this.mock.deleteComment(commentId);
      return this.baseSuccessResponse('Comment deleted successfully');
    }
    return this.http.delete<BaseResponse>(
      `/v1/recordings/${recordingId}/comments/${commentId}`
    );
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

  private baseSuccessResponse(message: string): BaseResponse {
    return {
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Colocated singleton instance for CommentRepository.
 */
export const commentRepository: ICommentRepository = new CommentRepository();
