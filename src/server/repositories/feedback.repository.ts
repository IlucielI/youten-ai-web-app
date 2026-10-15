import { IFeedbackRepository } from './feedback.repository.interface';
import { IHttpClient, httpClient as defaultHttpClient } from '../datasources/http';
import { MockDataService, mockDataService as defaultMockDataService } from '../datasources/mock';
import { env } from '../config';
import {
  FeedbackRequest,
  FeedbackResponse,
  FeedbackPresignRequest,
  FeedbackPresignResponse,
} from '../dtos/feedback.dto';
import { ApiResponse } from '../dtos/response.dto';
import { ResponseStatus, ResponseCode } from '../constants';

export class FeedbackRepository implements IFeedbackRepository {
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

  async submitFeedback(payload: FeedbackRequest): Promise<ApiResponse<FeedbackResponse>> {
    if (this.useMock) {
      const data = this.mock.submitFeedback(payload);
      return this.successResponse(data, 'Feedback submitted successfully');
    }

    const headers: Record<string, string> = {};
    if (payload.idempotency_key) {
      headers['Idempotency-Key'] = payload.idempotency_key;
    }

    return this.http.post<ApiResponse<FeedbackResponse>>('/v1/feedback', payload, { headers });
  }

  async presignUpload(payload: FeedbackPresignRequest): Promise<ApiResponse<FeedbackPresignResponse>> {
    if (this.useMock) {
      const data = this.mock.presignFeedbackUpload(payload);
      return this.successResponse(data, 'Presigned upload URL generated successfully');
    }

    return this.http.post<ApiResponse<FeedbackPresignResponse>>('/v1/feedback/presign-upload', payload);
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
 * Colocated singleton instance for FeedbackRepository.
 */
export const feedbackRepository: IFeedbackRepository = new FeedbackRepository();
