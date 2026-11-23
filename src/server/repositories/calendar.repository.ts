import { ICalendarRepository } from './calendar.repository.interface';
import { IHttpClient, httpClient as defaultHttpClient } from '../datasources/http';
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

export class CalendarRepository implements ICalendarRepository {
  private readonly http: IHttpClient;

  constructor(http: IHttpClient = defaultHttpClient) {
    this.http = http;
  }

  async getAuthURL(): Promise<ApiResponse<GoogleCalendarAuthURLResponse>> {
    return this.http.get<ApiResponse<GoogleCalendarAuthURLResponse>>('/v1/integrations/google-calendar/auth-url');
  }

  async handleCallback(payload: GoogleCalendarCallbackRequest): Promise<ApiResponse<GoogleCalendarConnectionResponse>> {
    return this.http.post<ApiResponse<GoogleCalendarConnectionResponse>>('/v1/integrations/google-calendar/callback', payload);
  }

  async getStatus(): Promise<ApiResponse<GoogleCalendarConnectionResponse>> {
    return this.http.get<ApiResponse<GoogleCalendarConnectionResponse>>('/v1/integrations/google-calendar/status');
  }

  async updateSettings(payload: UpdateCalendarSettingsRequest): Promise<ApiResponse<GoogleCalendarConnectionResponse>> {
    return this.http.patch<ApiResponse<GoogleCalendarConnectionResponse>>('/v1/integrations/google-calendar/settings', payload);
  }

  async syncCalendar(): Promise<ApiResponse<GoogleCalendarConnectionResponse>> {
    return this.http.post<ApiResponse<GoogleCalendarConnectionResponse>>('/v1/integrations/google-calendar/sync', {});
  }

  async disconnect(): Promise<BaseResponse> {
    return this.http.delete<BaseResponse>('/v1/integrations/google-calendar');
  }

  async listEvents(query: ListCalendarEventsQuery): Promise<ApiResponse<CalendarEventsListResponse>> {
    const params = new URLSearchParams();
    if (query.start_date) params.set('start_date', query.start_date);
    if (query.end_date) params.set('end_date', query.end_date);
    if (query.platform) params.set('platform', query.platform);
    if (query.dispatch_status) params.set('dispatch_status', query.dispatch_status);
    if (query.page) params.set('page', query.page.toString());
    if (query.limit) params.set('limit', query.limit.toString());

    const qs = params.toString();
    const endpoint = qs ? `/v1/calendar/events?${qs}` : '/v1/calendar/events';
    return this.http.get<ApiResponse<CalendarEventsListResponse>>(endpoint);
  }

  async toggleEventAutoRecord(eventId: string, payload: ToggleEventAutoRecordRequest): Promise<BaseResponse> {
    return this.http.patch<BaseResponse>(`/v1/calendar/events/${eventId}/auto-record`, payload);
  }
}

export const calendarRepository = new CalendarRepository();

