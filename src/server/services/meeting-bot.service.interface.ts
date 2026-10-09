import {
  DispatchMeetingBotRequest,
  DispatchMeetingBotResponse,
  MeetingBotSessionStatusResponse,
  StopMeetingBotSessionResponse,
  CapabilitiesResponse,
} from '../dtos';
import { ApiResponse } from '../dtos/response.dto';

export interface IMeetingBotService {
  getCapabilities(): Promise<ApiResponse<CapabilitiesResponse>>;
  dispatch(payload: DispatchMeetingBotRequest): Promise<ApiResponse<DispatchMeetingBotResponse>>;
  getStatus(sessionId: string): Promise<ApiResponse<MeetingBotSessionStatusResponse>>;
  stop(sessionId: string): Promise<ApiResponse<StopMeetingBotSessionResponse>>;
}
