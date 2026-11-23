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

export interface ICalendarService {
  getAuthURL(): Promise<ApiResponse<GoogleCalendarAuthURLResponse>>;
  handleCallback(payload: GoogleCalendarCallbackRequest): Promise<ApiResponse<GoogleCalendarConnectionResponse>>;
  getStatus(): Promise<ApiResponse<GoogleCalendarConnectionResponse>>;
  updateSettings(payload: UpdateCalendarSettingsRequest): Promise<ApiResponse<GoogleCalendarConnectionResponse>>;
  syncCalendar(): Promise<ApiResponse<GoogleCalendarConnectionResponse>>;
  disconnect(): Promise<BaseResponse>;
  listEvents(query: ListCalendarEventsQuery): Promise<ApiResponse<CalendarEventsListResponse>>;
  toggleEventAutoRecord(eventId: string, payload: ToggleEventAutoRecordRequest): Promise<BaseResponse>;
}

