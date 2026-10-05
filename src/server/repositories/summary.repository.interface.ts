import {
  RegenerateSummaryRequest,
  SummaryVersionResponse,
} from '../dtos';
import { ApiResponse } from '../dtos/response.dto';

export interface ISummaryRepository {
  regenerateSummary(
    recordingId: string,
    payload: RegenerateSummaryRequest
  ): Promise<ApiResponse<SummaryVersionResponse>>;
  listSummaryVersions(recordingId: string): Promise<ApiResponse<SummaryVersionResponse[]>>;
  activateSummaryVersion(
    recordingId: string,
    versionId: string
  ): Promise<ApiResponse<SummaryVersionResponse>>;
}
