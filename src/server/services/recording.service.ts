import { IRecordingService } from './recording.service.interface';
import { IRecordingRepository } from '../repositories/recording.repository.interface';
import { recordingRepository as defaultRecordingRepository } from '../repositories/recording.repository';
import {
  PresignUploadRequest,
  PresignUploadResponse,
  UploadRecordingRequest,
  RecordingUploadResponse,
  ImportUrlRequest,
  RecordingDetailResponse,
  RetryRecordingResponse,
  ShareToggleRequest,
  ShareToggleResponse,
  SharedRecordingResponse,
  UpdateSpeakersRequest,
  UpdateSpeakersResponse,
  BulkClaimRequest,
  BulkClaimResponse,
  RecordingListItem,
  RecordingFilterQuery,
} from '../dtos';
import { ApiResponse, PaginatedResponse, BaseResponse } from '../dtos/response.dto';

export class RecordingService implements IRecordingService {
  constructor(
    private readonly recordingRepo: IRecordingRepository = defaultRecordingRepository
  ) {}

  async presignUpload(payload: PresignUploadRequest): Promise<ApiResponse<PresignUploadResponse>> {
    return this.recordingRepo.presignUpload(payload);
  }

  async uploadRecording(payload: UploadRecordingRequest): Promise<ApiResponse<RecordingUploadResponse>> {
    return this.recordingRepo.uploadRecording(payload);
  }

  async importUrl(payload: ImportUrlRequest): Promise<ApiResponse<RecordingUploadResponse>> {
    return this.recordingRepo.importUrl(payload);
  }

  async getRecordingDetail(id: string): Promise<ApiResponse<RecordingDetailResponse>> {
    return this.recordingRepo.getRecordingDetail(id);
  }

  async listRecordings(query?: RecordingFilterQuery): Promise<PaginatedResponse<RecordingListItem>> {
    return this.recordingRepo.listRecordings(query);
  }

  async deleteRecording(id: string): Promise<BaseResponse> {
    return this.recordingRepo.deleteRecording(id);
  }

  async retryRecording(id: string): Promise<ApiResponse<RetryRecordingResponse>> {
    return this.recordingRepo.retryRecording(id);
  }

  async toggleShare(id: string, payload: ShareToggleRequest): Promise<ApiResponse<ShareToggleResponse>> {
    return this.recordingRepo.toggleShare(id, payload);
  }

  async getSharedRecording(token: string): Promise<ApiResponse<SharedRecordingResponse>> {
    return this.recordingRepo.getSharedRecording(token);
  }

  async updateSpeakers(id: string, payload: UpdateSpeakersRequest): Promise<ApiResponse<UpdateSpeakersResponse>> {
    return this.recordingRepo.updateSpeakers(id, payload);
  }

  async claimRecording(id: string): Promise<ApiResponse<{ claimed: boolean }>> {
    return this.recordingRepo.claimRecording(id);
  }

  async claimBulk(payload: BulkClaimRequest): Promise<ApiResponse<BulkClaimResponse>> {
    return this.recordingRepo.claimBulk(payload);
  }
}

/**
 * Colocated singleton instance for RecordingService.
 */
export const recordingService: IRecordingService = new RecordingService();
