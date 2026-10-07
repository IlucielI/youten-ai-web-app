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

export interface IRecordingRepository {
  presignUpload(payload: PresignUploadRequest): Promise<ApiResponse<PresignUploadResponse>>;
  uploadRecording(payload: UploadRecordingRequest): Promise<ApiResponse<RecordingUploadResponse>>;
  importUrl(payload: ImportUrlRequest): Promise<ApiResponse<RecordingUploadResponse>>;
  getRecordingDetail(id: string, ownershipToken?: string): Promise<ApiResponse<RecordingDetailResponse>>;
  listRecordings(query?: RecordingFilterQuery): Promise<PaginatedResponse<RecordingListItem>>;
  deleteRecording(id: string): Promise<BaseResponse>;
  claimRecording(id: string): Promise<ApiResponse<{ claimed: boolean }>>;
  claimBulk(payload: BulkClaimRequest): Promise<ApiResponse<BulkClaimResponse>>;
  toggleShare(id: string, payload: ShareToggleRequest): Promise<ApiResponse<ShareToggleResponse>>;
  getSharedRecording(token: string): Promise<ApiResponse<SharedRecordingResponse>>;
  retryRecording(id: string, ownershipToken?: string): Promise<ApiResponse<RetryRecordingResponse>>;
  updateSpeakers(id: string, payload: UpdateSpeakersRequest): Promise<ApiResponse<UpdateSpeakersResponse>>;
  updateTranscriptSegment(
    recordingId: string,
    segmentId: string,
    payload: UpdateTranscriptSegmentRequest
  ): Promise<ApiResponse<TranscriptSegmentDTO>>;
  regenerateSummary(
    id: string,
    payload: RegenerateSummaryRequest,
    ownershipToken?: string
  ): Promise<ApiResponse<SummaryVersionResponse>>;
}
