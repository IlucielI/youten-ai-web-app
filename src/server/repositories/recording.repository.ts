import { IRecordingRepository } from './recording.repository.interface';
import { IHttpClient, httpClient as defaultHttpClient } from '../datasources/http';
import { MockDataService, mockDataService as defaultMockDataService } from '../datasources/mock';
import { env } from '../config';
import {
  PresignUploadRequest,
  PresignUploadResponse,
  UploadRecordingRequest,
  RecordingUploadResponse,
  ImportUrlRequest,
  RecordingDetailResponse,
  RecordingListItem,
  RecordingFilterQuery,
  BulkClaimRequest,
  BulkClaimResponse,
  ShareToggleRequest,
  ShareToggleResponse,
  SharedRecordingResponse,
  RetryRecordingResponse,
  UpdateSpeakersRequest,
  UpdateSpeakersResponse,
  SummaryVersionResponse,
  RegenerateSummaryRequest,
  UpdateTranscriptSegmentRequest,
  TranscriptSegmentDTO,
} from '../dtos';
import { ApiResponse, PaginatedResponse, BaseResponse } from '../dtos/response.dto';
import { ResponseStatus, ResponseCode } from '../constants';
import { NotFoundError } from '../errors/app.error';

export class RecordingRepository implements IRecordingRepository {
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

  async presignUpload(payload: PresignUploadRequest): Promise<ApiResponse<PresignUploadResponse>> {
    if (this.useMock) {
      const data = this.mock.presignUpload(payload);
      return this.successResponse(data, 'Presigned URL generated successfully');
    }
    return this.http.post<ApiResponse<PresignUploadResponse>>('/v1/recordings/presign-upload', payload);
  }

  async uploadRecording(payload: UploadRecordingRequest): Promise<ApiResponse<RecordingUploadResponse>> {
    if (this.useMock) {
      const data = this.mock.uploadRecording(payload);
      return this.successResponse(data, 'Recording uploaded and queued for processing');
    }
    return this.http.post<ApiResponse<RecordingUploadResponse>>('/v1/recordings/upload', payload);
  }

  async importUrl(payload: ImportUrlRequest): Promise<ApiResponse<RecordingUploadResponse>> {
    if (this.useMock) {
      const data = this.mock.importUrl(payload);
      return this.successResponse(data, 'Recording import scheduled');
    }
    return this.http.post<ApiResponse<RecordingUploadResponse>>('/v1/recordings/import-url', payload);
  }

  async getRecordingDetail(id: string, ownershipToken?: string): Promise<ApiResponse<RecordingDetailResponse>> {
    if (this.useMock) {
      const data = this.mock.getRecordingDetail(id);
      if (!data) {
        throw new NotFoundError(`Recording with id ${id} not found`);
      }
      return this.successResponse(data, 'Recording detail retrieved successfully');
    }
    const headers: Record<string, string> = {};
    if (ownershipToken) {
      headers['x-ownership-token'] = ownershipToken;
    }
    return this.http.get<ApiResponse<RecordingDetailResponse>>(`/v1/recordings/${id}`, {
      headers,
      ownershipToken,
    });
  }

  async listRecordings(query?: RecordingFilterQuery): Promise<PaginatedResponse<RecordingListItem>> {
    if (this.useMock) {
      const { items, total } = this.mock.listRecordings(query);
      const page = query?.page ?? 1;
      const limit = query?.limit ?? 10;
      const totalPages = Math.ceil(total / limit) || 1;

      return {
        status: ResponseStatus.SUCCESS,
        code: ResponseCode.SUCCESS,
        message: 'Recordings listed successfully',
        data: items,
        pagination: {
          page,
          limit,
          totalItems: total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        timestamp: new Date().toISOString(),
      };
    }

    const params: Record<string, string | number | undefined> = {};
    if (query?.page) params.page = query.page;
    if (query?.limit) params.limit = query.limit;
    if (query?.search) params.search = query.search;
    if (query?.template) params.template = query.template;
    if (query?.status) params.status = query.status;
    if (query?.sort_by) params.sort_by = query.sort_by;
    if (query?.sort_order) params.sort_order = query.sort_order;

    return this.http.get<PaginatedResponse<RecordingListItem>>('/v1/recordings', { params });
  }

  async deleteRecording(id: string): Promise<BaseResponse> {
    if (this.useMock) {
      this.mock.deleteRecording(id);
      return this.baseSuccessResponse('Recording deleted successfully');
    }
    return this.http.delete<BaseResponse>(`/v1/recordings/${id}`);
  }

  async claimRecording(id: string): Promise<ApiResponse<{ claimed: boolean }>> {
    if (this.useMock) {
      const data = this.mock.claimRecording(id);
      return this.successResponse(data, 'Recording claimed successfully');
    }
    return this.http.post<ApiResponse<{ claimed: boolean }>>(`/v1/recordings/${id}/claim`);
  }

  async claimBulk(payload: BulkClaimRequest): Promise<ApiResponse<BulkClaimResponse>> {
    if (this.useMock) {
      const data = this.mock.claimBulkRecordings(payload);
      return this.successResponse(data, 'Bulk recordings claimed successfully');
    }
    return this.http.post<ApiResponse<BulkClaimResponse>>('/v1/recordings/claim', payload);
  }

  async toggleShare(id: string, payload: ShareToggleRequest): Promise<ApiResponse<ShareToggleResponse>> {
    if (this.useMock) {
      const data = this.mock.toggleShare(id, payload);
      return this.successResponse(data, 'Share status updated successfully');
    }
    return this.http.patch<ApiResponse<ShareToggleResponse>>(`/v1/recordings/${id}/share`, payload);
  }

  async getSharedRecording(token: string): Promise<ApiResponse<SharedRecordingResponse>> {
    if (this.useMock) {
      const data = this.mock.getSharedRecording(token);
      if (!data) {
        throw new NotFoundError(`Shared recording not found or expired`);
      }
      return this.successResponse(data, 'Shared recording retrieved successfully');
    }
    return this.http.get<ApiResponse<SharedRecordingResponse>>(`/v1/recordings/shared/${token}`);
  }

  async retryRecording(id: string, ownershipToken?: string): Promise<ApiResponse<RetryRecordingResponse>> {
    if (this.useMock) {
      const data = this.mock.retryRecording(id);
      return this.successResponse(data, 'Pipeline retry initiated');
    }
    const headers: Record<string, string> = {};
    if (ownershipToken) {
      headers['x-ownership-token'] = ownershipToken;
    }
    return this.http.post<ApiResponse<RetryRecordingResponse>>(`/v1/recordings/${id}/retry`, undefined, {
      headers,
      ownershipToken,
    });
  }

  async updateSpeakers(id: string, payload: UpdateSpeakersRequest): Promise<ApiResponse<UpdateSpeakersResponse>> {
    if (this.useMock) {
      const data = this.mock.updateSpeakers(id, payload);
      return this.successResponse(data, 'Speakers updated successfully');
    }
    return this.http.put<ApiResponse<UpdateSpeakersResponse>>(`/v1/recordings/${id}/speakers`, payload);
  }

  async updateTranscriptSegment(
    recordingId: string,
    segmentId: string,
    payload: UpdateTranscriptSegmentRequest
  ): Promise<ApiResponse<TranscriptSegmentDTO>> {
    if (this.useMock) {
      const mockResult: TranscriptSegmentDTO = {
        id: segmentId,
        speaker_label: 'Speaker 0',
        speaker_name: 'Speaker 0',
        start_time: 0,
        end_time: 5,
        text: payload.text,
        sequence_order: 1,
      };
      return this.successResponse(mockResult, 'Transcript segment updated successfully');
    }
    const headers: Record<string, string> = {};
    if (payload.ownership_token) {
      headers['x-ownership-token'] = payload.ownership_token;
    }
    return this.http.patch<ApiResponse<TranscriptSegmentDTO>>(
      `/v1/recordings/${recordingId}/segments/${segmentId}`,
      payload,
      {
        headers,
        ownershipToken: payload.ownership_token,
      }
    );
  }

  async regenerateSummary(
    id: string,
    payload: RegenerateSummaryRequest,
    ownershipToken?: string
  ): Promise<ApiResponse<SummaryVersionResponse>> {
    if (this.useMock) {
      const mockResult: SummaryVersionResponse = {
        id: `summary-${Date.now()}`,
        version: 2,
        template_category: payload.template_category || 'GENERAL',
        custom_angle: payload.custom_angle,
        structured_data: {},
        markdown_content: 'Mock regenerated summary content',
        is_active: true,
        created_at: new Date().toISOString(),
      };
      return this.successResponse(mockResult, 'Summary regenerated successfully');
    }
    const headers: Record<string, string> = {};
    if (ownershipToken) {
      headers['x-ownership-token'] = ownershipToken;
    }
    return this.http.post<ApiResponse<SummaryVersionResponse>>(`/v1/recordings/${id}/regenerate`, payload, {
      headers,
      ownershipToken,
    });
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
 * Colocated singleton instance for RecordingRepository.
 */
export const recordingRepository: IRecordingRepository = new RecordingRepository();
