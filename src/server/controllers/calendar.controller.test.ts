import { describe, it, expect, vi } from 'vitest';
import { CalendarController } from './calendar.controller';
import { ICalendarService } from '../services';
import { ResponseStatus, ResponseCode } from '../constants';

describe('CalendarController', () => {
  const mockService: ICalendarService = {
    getAuthURL: vi.fn().mockResolvedValue({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Google calendar authorization URL generated',
      data: {
        auth_url: 'https://accounts.google.com/o/oauth2/v2/auth?state=csrf-token',
        state: 'csrf-token',
      },
      timestamp: '2026-11-23T10:00:00Z',
    }),
    handleCallback: vi.fn().mockResolvedValue({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Google calendar successfully connected',
      data: {
        connected: true,
        google_email: 'user@example.com',
        is_auto_record_enabled: true,
        lead_time_minutes: 2,
        status: 'active',
      },
      timestamp: '2026-11-23T10:00:00Z',
    }),
    getStatus: vi.fn().mockResolvedValue({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Google calendar status retrieved',
      data: {
        connected: true,
        google_email: 'user@example.com',
        is_auto_record_enabled: true,
        lead_time_minutes: 2,
        status: 'active',
      },
      timestamp: '2026-11-23T10:00:00Z',
    }),
    updateSettings: vi.fn().mockResolvedValue({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Calendar settings updated successfully',
      data: {
        connected: true,
        google_email: 'user@example.com',
        is_auto_record_enabled: false,
        lead_time_minutes: 5,
        status: 'active',
      },
      timestamp: '2026-11-23T10:00:00Z',
    }),
    syncCalendar: vi.fn().mockResolvedValue({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Calendar synchronized successfully',
      data: {
        connected: true,
        google_email: 'user@example.com',
        is_auto_record_enabled: true,
        lead_time_minutes: 2,
        status: 'active',
      },
      timestamp: '2026-11-23T10:00:00Z',
    }),
    disconnect: vi.fn().mockResolvedValue({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Google calendar disconnected successfully',
      timestamp: '2026-11-23T10:00:00Z',
    }),
    listEvents: vi.fn().mockResolvedValue({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Calendar events retrieved successfully',
      data: {
        items: [
          {
            id: 'evt-123',
            google_event_id: 'g-evt-123',
            title: 'Weekly Standup',
            start_time: '2026-11-23T14:00:00Z',
            end_time: '2026-11-23T15:00:00Z',
            scheduled_dispatch_at: '2026-11-23T13:58:00Z',
            meeting_url: 'https://meet.google.com/abc-defg-hij',
            meeting_platform: 'google_meet',
            user_response_status: 'accepted',
            auto_record_enabled: true,
            dispatch_status: 'PENDING',
            created_at: '2026-11-23T10:00:00Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total_items: 1,
          total_pages: 1,
        },
      },
      timestamp: '2026-11-23T10:00:00Z',
    }),
    toggleEventAutoRecord: vi.fn().mockResolvedValue({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Event auto-record preference updated successfully',
      timestamp: '2026-11-23T10:00:00Z',
    }),
  };

  const controller = new CalendarController(mockService);

  it('handles getAuthURL returning 200 with auth url', async () => {
    const req = new Request('http://localhost:3000/api/integrations/google-calendar/auth-url', { method: 'GET' });
    const res = await controller.getAuthURL(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.auth_url).toContain('accounts.google.com');
  });

  it('handles handleCallback returning 200 with connection details', async () => {
    const req = new Request('http://localhost:3000/api/integrations/google-calendar/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'auth-code-123', state: 'csrf-token' }),
    });
    const res = await controller.handleCallback(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.connected).toBe(true);
    expect(json.data.google_email).toBe('user@example.com');
  });

  it('handles getStatus returning 200 with integration status', async () => {
    const req = new Request('http://localhost:3000/api/integrations/google-calendar/status', { method: 'GET' });
    const res = await controller.getStatus(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.status).toBe('active');
  });

  it('handles listEvents returning 200 with event items', async () => {
    const req = new Request('http://localhost:3000/api/calendar/events?platform=google_meet', { method: 'GET' });
    const res = await controller.listEvents(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.items.length).toBe(1);
    expect(json.data.items[0].title).toBe('Weekly Standup');
  });

  it('handles toggleEventAutoRecord returning 200', async () => {
    const req = new Request('http://localhost:3000/api/calendar/events/evt-123/auto-record', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auto_record_enabled: false }),
    });
    const res = await controller.toggleEventAutoRecord(req, 'evt-123');

    expect(res.status).toBe(200);
    expect(mockService.toggleEventAutoRecord).toHaveBeenCalledWith('evt-123', { auto_record_enabled: false });
  });
});

