export interface GoogleCalendarAuthURLResponse {
  auth_url: string;
  state: string;
}

export interface GoogleCalendarCallbackRequest {
  code: string;
  state: string;
}

export interface GoogleCalendarConnectionResponse {
  connected: boolean;
  google_email?: string;
  is_auto_record_enabled: boolean;
  lead_time_minutes: number;
  last_synced_at?: string;
  status: string;
}

export interface UpdateCalendarSettingsRequest {
  is_auto_record_enabled?: boolean;
  lead_time_minutes?: number;
}

export interface ToggleEventAutoRecordRequest {
  auto_record_enabled: boolean;
}

export interface CalendarEventDTO {
  id: string;
  google_event_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  scheduled_dispatch_at: string;
  meeting_url: string;
  meeting_platform: 'google_meet' | 'zoom' | 'ms_teams' | 'none';
  organizer_email?: string;
  user_response_status: 'accepted' | 'tentative' | 'declined';
  auto_record_enabled: boolean;
  dispatch_status: 'PENDING' | 'DISPATCHING' | 'DISPATCHED' | 'SKIPPED_MANUAL' | 'SKIPPED_QUOTA' | 'FAILED';
  bot_session_id?: string;
  recording_id?: string;
  error_message?: string;
  created_at: string;
}

export interface CalendarEventsListResponse {
  items: CalendarEventDTO[];
  pagination: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
  };
}

export interface ListCalendarEventsQuery {
  start_date?: string;
  end_date?: string;
  platform?: string;
  dispatch_status?: string;
  page?: number;
  limit?: number;
}

