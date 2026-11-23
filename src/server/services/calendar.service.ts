import { ICalendarService } from './calendar.service.interface';
import {
  ICalendarRepository,
  calendarRepository as defaultCalendarRepo,
} from '../repositories';
import {
  GoogleCalendarAuthURLResponse,
  GoogleCalendarCallbackRequest,
  GoogleCalendarConnectionResponse,
  UpdateCalendarSettingsRequest,
  ToggleEventAutoRecordRequest,
  CalendarEventsListResponse,
  ListCalendarEventsQuery,
} from '../dtos/calendar.dto';
import { ApiResponse, BaseResponse } from '../dtos/response.dto';

export class CalendarService implements ICalendarService {
  private readonly calendarRepo: ICalendarRepository;

  constructor(calendarRepo: ICalendarRepository = defaultCalendarRepo) {
    this.calendarRepo = calendarRepo;
  }

  async getAuthURL(): Promise<ApiResponse<GoogleCalendarAuthURLResponse>> {
    return this.calendarRepo.getAuthURL();
  }

  async handleCallback(payload: GoogleCalendarCallbackRequest): Promise<ApiResponse<GoogleCalendarConnectionResponse>> {
    return this.calendarRepo.handleCallback(payload);
  }

  async getStatus(): Promise<ApiResponse<GoogleCalendarConnectionResponse>> {
    return this.calendarRepo.getStatus();
  }

  async updateSettings(payload: UpdateCalendarSettingsRequest): Promise<ApiResponse<GoogleCalendarConnectionResponse>> {
    return this.calendarRepo.updateSettings(payload);
  }

  async syncCalendar(): Promise<ApiResponse<GoogleCalendarConnectionResponse>> {
    return this.calendarRepo.syncCalendar();
  }

  async disconnect(): Promise<BaseResponse> {
    return this.calendarRepo.disconnect();
  }

  async listEvents(query: ListCalendarEventsQuery): Promise<ApiResponse<CalendarEventsListResponse>> {
    return this.calendarRepo.listEvents(query);
  }

  async toggleEventAutoRecord(eventId: string, payload: ToggleEventAutoRecordRequest): Promise<BaseResponse> {
    return this.calendarRepo.toggleEventAutoRecord(eventId, payload);
  }
}

export const calendarService = new CalendarService();

