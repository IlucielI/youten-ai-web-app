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
  SummaryVersionResponse,
  RegenerateSummaryRequest,
  UpdateTranscriptSegmentRequest,
  TranscriptSegmentDTO,
} from '../dtos';
import { ApiResponse, PaginatedResponse, BaseResponse } from '../dtos/response.dto';

export interface IRecordingService {
  presignUpload(payload: PresignUploadRequest): Promise<ApiResponse<PresignUploadResponse>>;
  uploadRecording(payload: UploadRecordingRequest): Promise<ApiResponse<RecordingUploadResponse>>;
  importUrl(payload: ImportUrlRequest): Promise<ApiResponse<RecordingUploadResponse>>;
  getRecordingDetail(id: string, ownershipToken?: string): Promise<ApiResponse<RecordingDetailResponse>>;
  listRecordings(query?: RecordingFilterQuery): Promise<PaginatedResponse<RecordingListItem>>;
  deleteRecording(id: string): Promise<BaseResponse>;
  retryRecording(id: string, ownershipToken?: string): Promise<ApiResponse<RetryRecordingResponse>>;
  toggleShare(id: string, payload: ShareToggleRequest): Promise<ApiResponse<ShareToggleResponse>>;
  getSharedRecording(token: string): Promise<ApiResponse<SharedRecordingResponse>>;
  updateSpeakers(id: string, payload: UpdateSpeakersRequest): Promise<ApiResponse<UpdateSpeakersResponse>>;
  updateTranscriptSegment(
    recordingId: string,
    segmentId: string,
    payload: UpdateTranscriptSegmentRequest
  ): Promise<ApiResponse<TranscriptSegmentDTO>>;
  claimRecording(id: string): Promise<ApiResponse<{ claimed: boolean }>>;
  claimBulk(payload: BulkClaimRequest): Promise<ApiResponse<BulkClaimResponse>>;
  regenerateSummary(
    id: string,
    payload: RegenerateSummaryRequest,
    ownershipToken?: string
  ): Promise<ApiResponse<SummaryVersionResponse>>;
  listSummaryVersions(
    id: string,
    ownershipToken?: string
  ): Promise<ApiResponse<SummaryVersionResponse[]>>;
  activateSummaryVersion(
    id: string,
    versionId: string,
    ownershipToken?: string
  ): Promise<ApiResponse<SummaryVersionResponse>>;
}
