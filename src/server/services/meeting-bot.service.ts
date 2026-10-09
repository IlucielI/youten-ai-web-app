import { IMeetingBotService } from './meeting-bot.service.interface';
import {
  IMeetingBotRepository,
  meetingBotRepository as defaultMeetingBotRepository,
} from '../repositories';
import {
  DispatchMeetingBotRequest,
  DispatchMeetingBotResponse,
  MeetingBotSessionStatusResponse,
  StopMeetingBotSessionResponse,
  CapabilitiesResponse,
} from '../dtos';
import { ApiResponse } from '../dtos/response.dto';

export class MeetingBotService implements IMeetingBotService {
  private readonly repo: IMeetingBotRepository;

  constructor(repo: IMeetingBotRepository = defaultMeetingBotRepository) {
    this.repo = repo;
  }

  async getCapabilities(): Promise<ApiResponse<CapabilitiesResponse>> {
    return this.repo.getCapabilities();
  }

  async dispatch(payload: DispatchMeetingBotRequest): Promise<ApiResponse<DispatchMeetingBotResponse>> {
    return this.repo.dispatch(payload);
  }

  async getStatus(sessionId: string): Promise<ApiResponse<MeetingBotSessionStatusResponse>> {
    return this.repo.getStatus(sessionId);
  }

  async stop(sessionId: string): Promise<ApiResponse<StopMeetingBotSessionResponse>> {
    return this.repo.stop(sessionId);
  }
}

/**
 * Colocated singleton instance for MeetingBotService.
 */
export const meetingBotService: IMeetingBotService = new MeetingBotService();
