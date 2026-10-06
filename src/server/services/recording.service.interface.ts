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
} from '../dtos';
import { ApiResponse } from '../dtos/response.dto';

export interface IRecordingService {
  presignUpload(payload: PresignUploadRequest): Promise<ApiResponse<PresignUploadResponse>>;
  uploadRecording(payload: UploadRecordingRequest): Promise<ApiResponse<RecordingUploadResponse>>;
  importUrl(payload: ImportUrlRequest): Promise<ApiResponse<RecordingUploadResponse>>;
  getRecordingDetail(id: string): Promise<ApiResponse<RecordingDetailResponse>>;
  retryRecording(id: string): Promise<ApiResponse<RetryRecordingResponse>>;
  toggleShare(id: string, payload: ShareToggleRequest): Promise<ApiResponse<ShareToggleResponse>>;
  getSharedRecording(token: string): Promise<ApiResponse<SharedRecordingResponse>>;
  updateSpeakers(id: string, payload: UpdateSpeakersRequest): Promise<ApiResponse<UpdateSpeakersResponse>>;
  claimRecording(id: string): Promise<ApiResponse<{ claimed: boolean }>>;
  claimBulk(payload: BulkClaimRequest): Promise<ApiResponse<BulkClaimResponse>>;
}
