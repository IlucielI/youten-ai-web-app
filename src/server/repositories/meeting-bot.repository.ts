import { IMeetingBotRepository } from './meeting-bot.repository.interface';
import { IHttpClient, httpClient as defaultHttpClient } from '../datasources/http';
import { MockDataService, mockDataService as defaultMockDataService } from '../datasources/mock';
import { env } from '../config';
import {
  DispatchMeetingBotRequest,
  DispatchMeetingBotResponse,
  MeetingBotSessionStatusResponse,
  StopMeetingBotSessionResponse,
  CapabilitiesResponse,
} from '../dtos';
import { ApiResponse } from '../dtos/response.dto';
import { ResponseStatus, ResponseCode } from '../constants';

export class MeetingBotRepository implements IMeetingBotRepository {
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

  private successResponse<T>(data: T, message: string = 'Success'): ApiResponse<T> {
    return {
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  async getCapabilities(): Promise<ApiResponse<CapabilitiesResponse>> {
    if (this.useMock) {
      const data = this.mock.getCapabilities();
      return this.successResponse(data, 'Capabilities retrieved successfully');
    }
    return this.http.get<ApiResponse<CapabilitiesResponse>>('/v1/capabilities');
  }

  async dispatch(payload: DispatchMeetingBotRequest): Promise<ApiResponse<DispatchMeetingBotResponse>> {
    if (this.useMock) {
      const data = this.mock.dispatchMeetingBot(payload);
      return this.successResponse(data, 'Meeting bot session dispatched successfully');
    }
    return this.http.post<ApiResponse<DispatchMeetingBotResponse>>('/v1/recordings/meeting-bot', payload);
  }

  async getStatus(sessionId: string): Promise<ApiResponse<MeetingBotSessionStatusResponse>> {
    if (this.useMock) {
      const data = this.mock.getMeetingBotStatus(sessionId);
      return this.successResponse(data, 'Bot session status retrieved successfully');
    }
    return this.http.get<ApiResponse<MeetingBotSessionStatusResponse>>(`/v1/recordings/meeting-bot/${sessionId}/status`);
  }

  async stop(sessionId: string): Promise<ApiResponse<StopMeetingBotSessionResponse>> {
    if (this.useMock) {
      const data = this.mock.stopMeetingBotSession(sessionId);
      return this.successResponse(data, 'Bot leave command dispatched successfully');
    }
    return this.http.post<ApiResponse<StopMeetingBotSessionResponse>>(`/v1/recordings/meeting-bot/${sessionId}/stop`, {});
  }
}

/**
 * Colocated singleton instance for MeetingBotRepository.
 */
export const meetingBotRepository: IMeetingBotRepository = new MeetingBotRepository();
