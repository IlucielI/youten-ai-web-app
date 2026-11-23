import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCalendarStore } from './calendar.store';
import * as apiClient from '@/lib/api-client';

describe('useCalendarStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCalendarStore.setState({
      connection: null,
      events: [],
      totalEvents: 0,
      isLoadingStatus: false,
      isLoadingEvents: false,
      isSyncing: false,
      isUpdatingSettings: false,
      error: null,
    });
  });

  it('fetchStatus updates connection state successfully', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockResolvedValueOnce({
      status: 'success',
      code: 'OK',
      message: 'Status retrieved',
      data: {
        connected: true,
        google_email: 'user@example.com',
        is_auto_record_enabled: true,
        lead_time_minutes: 2,
        status: 'active',
      },
      timestamp: '2026-11-23T10:00:00Z',
    });

    await useCalendarStore.getState().fetchStatus();

    const state = useCalendarStore.getState();
    expect(state.connection?.connected).toBe(true);
    expect(state.connection?.google_email).toBe('user@example.com');
    expect(state.isLoadingStatus).toBe(false);
  });

  it('fetchEvents updates events list', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockResolvedValueOnce({
      status: 'success',
      code: 'OK',
      message: 'Events retrieved',
      data: {
        items: [
          {
            id: 'evt-1',
            google_event_id: 'g-1',
            title: 'Design Review',
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
    });

    await useCalendarStore.getState().fetchEvents();

    const state = useCalendarStore.getState();
    expect(state.events.length).toBe(1);
    expect(state.events[0].title).toBe('Design Review');
  });

  it('toggleAutoRecord applies optimistic update', async () => {
    useCalendarStore.setState({
      events: [
        {
          id: 'evt-1',
          google_event_id: 'g-1',
          title: 'Design Review',
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
    });

    vi.spyOn(apiClient, 'apiFetch').mockResolvedValueOnce({
      status: 'success',
      code: 'OK',
      message: 'Updated',
      timestamp: '2026-11-23T10:00:00Z',
    });

    await useCalendarStore.getState().toggleAutoRecord('evt-1', false);

    expect(useCalendarStore.getState().events[0].auto_record_enabled).toBe(false);
  });
});

