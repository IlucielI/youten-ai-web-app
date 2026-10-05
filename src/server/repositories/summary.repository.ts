import { ISummaryRepository } from './summary.repository.interface';
import { IHttpClient, httpClient as defaultHttpClient } from '../datasources/http';
import { MockDataService, mockDataService as defaultMockDataService } from '../datasources/mock';
import { env } from '../config';
import {
  RegenerateSummaryRequest,
  SummaryVersionResponse,
} from '../dtos';
import { ApiResponse } from '../dtos/response.dto';
import { ResponseStatus, ResponseCode } from '../constants';
import { NotFoundError } from '../errors/app.error';

export class SummaryRepository implements ISummaryRepository {
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

  async regenerateSummary(
    recordingId: string,
    payload: RegenerateSummaryRequest
  ): Promise<ApiResponse<SummaryVersionResponse>> {
    if (this.useMock) {
      const data = this.mock.regenerateSummary(recordingId, payload);
      return this.successResponse(data, 'Summary regenerated successfully');
    }
    return this.http.post<ApiResponse<SummaryVersionResponse>>(
      `/v1/recordings/${recordingId}/regenerate`,
      payload
    );
  }

  async listSummaryVersions(recordingId: string): Promise<ApiResponse<SummaryVersionResponse[]>> {
    if (this.useMock) {
      const data = this.mock.listSummaryVersions(recordingId);
      return this.successResponse(data, 'Summary versions listed successfully');
    }
    return this.http.get<ApiResponse<SummaryVersionResponse[]>>(
      `/v1/recordings/${recordingId}/summaries`
    );
  }

  async activateSummaryVersion(
    recordingId: string,
    versionId: string
  ): Promise<ApiResponse<SummaryVersionResponse>> {
    if (this.useMock) {
      const data = this.mock.activateSummaryVersion(recordingId, versionId);
      if (!data) {
        throw new NotFoundError(`Summary version with id ${versionId} not found`);
      }
      return this.successResponse(data, 'Summary version activated successfully');
    }
    return this.http.patch<ApiResponse<SummaryVersionResponse>>(
      `/v1/recordings/${recordingId}/summaries/${versionId}/activate`
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
}

/**
 * Colocated singleton instance for SummaryRepository.
 */
export const summaryRepository: ISummaryRepository = new SummaryRepository();
