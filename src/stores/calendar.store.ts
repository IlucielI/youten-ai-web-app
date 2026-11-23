import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiFetch } from '@/lib/api-client';
import type {
  GoogleCalendarConnectionResponse,
  GoogleCalendarAuthURLResponse,
  CalendarEventDTO,
  CalendarEventsListResponse,
  ListCalendarEventsQuery,
} from '@/server/dtos/calendar.dto';
import type { ApiResponse, BaseResponse } from '@/server/dtos/response.dto';

export interface CalendarState {
  connection: GoogleCalendarConnectionResponse | null;
  events: CalendarEventDTO[];
  totalEvents: number;
  isLoadingStatus: boolean;
  isLoadingEvents: boolean;
  isSyncing: boolean;
  isUpdatingSettings: boolean;
  error: string | null;
}

export interface CalendarActions {
  fetchStatus: () => Promise<void>;
  connect: () => Promise<void>;
  handleCallback: (code: string, state: string) => Promise<void>;
  disconnect: () => Promise<void>;
  updateSettings: (settings: { is_auto_record_enabled?: boolean; lead_time_minutes?: number }) => Promise<void>;
  syncNow: () => Promise<void>;
  fetchEvents: (query?: ListCalendarEventsQuery) => Promise<void>;
  toggleAutoRecord: (eventId: string, enabled: boolean) => Promise<void>;
  clearError: () => void;
}

export type CalendarStore = CalendarState & CalendarActions;

const initialState: CalendarState = {
  connection: null,
  events: [],
  totalEvents: 0,
  isLoadingStatus: false,
  isLoadingEvents: false,
  isSyncing: false,
  isUpdatingSettings: false,
  error: null,
};

export const useCalendarStore = create<CalendarStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      fetchStatus: async () => {
        set({ isLoadingStatus: true, error: null }, false, 'calendar/fetchStatus/start');
        try {
          const res = await apiFetch<ApiResponse<GoogleCalendarConnectionResponse>>(
            '/api/integrations/google-calendar/status'
          );
          set(
            { connection: res.data || null, isLoadingStatus: false },
            false,
            'calendar/fetchStatus/success'
          );
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Failed to fetch calendar status';
          set({ isLoadingStatus: false, error: msg }, false, 'calendar/fetchStatus/error');
        }
      },

      connect: async () => {
        try {
          const res = await apiFetch<ApiResponse<GoogleCalendarAuthURLResponse>>(
            '/api/integrations/google-calendar/auth-url'
          );
          if (res.data?.auth_url && typeof window !== 'undefined') {
            window.location.href = res.data.auth_url;
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Failed to initiate google calendar oauth';
          set({ error: msg }, false, 'calendar/connect/error');
          throw err;
        }
      },

      handleCallback: async (code: string, state: string) => {
        set({ isLoadingStatus: true, error: null }, false, 'calendar/handleCallback/start');
        try {
          const res = await apiFetch<ApiResponse<GoogleCalendarConnectionResponse>>(
            '/api/integrations/google-calendar/callback',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code, state }),
            }
          );
          set(
            { connection: res.data || null, isLoadingStatus: false },
            false,
            'calendar/handleCallback/success'
          );
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Google OAuth exchange failed';
          set({ isLoadingStatus: false, error: msg }, false, 'calendar/handleCallback/error');
          throw err;
        }
      },

      disconnect: async () => {
        try {
          await apiFetch<BaseResponse>('/api/integrations/google-calendar', {
            method: 'DELETE',
          });
          set(
            {
              connection: {
                connected: false,
                is_auto_record_enabled: false,
                lead_time_minutes: 2,
                status: 'disconnected',
              },
              events: [],
              totalEvents: 0,
            },
            false,
            'calendar/disconnect/success'
          );
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Failed to disconnect calendar';
          set({ error: msg }, false, 'calendar/disconnect/error');
          throw err;
        }
      },

      updateSettings: async (settings) => {
        set({ isUpdatingSettings: true }, false, 'calendar/updateSettings/start');
        try {
          const res = await apiFetch<ApiResponse<GoogleCalendarConnectionResponse>>(
            '/api/integrations/google-calendar/settings',
            {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(settings),
            }
          );
          set(
            { connection: res.data || null, isUpdatingSettings: false },
            false,
            'calendar/updateSettings/success'
          );
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Failed to update calendar settings';
          set({ isUpdatingSettings: false, error: msg }, false, 'calendar/updateSettings/error');
          throw err;
        }
      },

      syncNow: async () => {
        set({ isSyncing: true, error: null }, false, 'calendar/syncNow/start');
        try {
          const res = await apiFetch<ApiResponse<GoogleCalendarConnectionResponse>>(
            '/api/integrations/google-calendar/sync',
            { method: 'POST' }
          );
          set(
            { connection: res.data || null, isSyncing: false },
            false,
            'calendar/syncNow/success'
          );
          await get().fetchEvents();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Failed to synchronize calendar';
          set({ isSyncing: false, error: msg }, false, 'calendar/syncNow/error');
          throw err;
        }
      },

      fetchEvents: async (query?: ListCalendarEventsQuery) => {
        set({ isLoadingEvents: true, error: null }, false, 'calendar/fetchEvents/start');
        try {
          const params = new URLSearchParams();
          if (query?.start_date) params.set('start_date', query.start_date);
          if (query?.end_date) params.set('end_date', query.end_date);
          if (query?.platform) params.set('platform', query.platform);
          if (query?.dispatch_status) params.set('dispatch_status', query.dispatch_status);
          if (query?.page) params.set('page', query.page.toString());
          if (query?.limit) params.set('limit', query.limit.toString());

          const qs = params.toString();
          const endpoint = qs ? `/api/calendar/events?${qs}` : '/api/calendar/events';
          const res = await apiFetch<ApiResponse<CalendarEventsListResponse>>(endpoint);

          set(
            {
              events: res.data?.items || [],
              totalEvents: res.data?.pagination?.total_items || 0,
              isLoadingEvents: false,
            },
            false,
            'calendar/fetchEvents/success'
          );
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Failed to fetch calendar events';
          set({ isLoadingEvents: false, error: msg }, false, 'calendar/fetchEvents/error');
        }
      },

      toggleAutoRecord: async (eventId: string, enabled: boolean) => {
        // Optimistic UI update
        const prevEvents = get().events;
        set(
          {
            events: prevEvents.map((evt) =>
              evt.id === eventId ? { ...evt, auto_record_enabled: enabled } : evt
            ),
          },
          false,
          'calendar/toggleAutoRecord/optimistic'
        );

        try {
          await apiFetch<BaseResponse>(`/api/calendar/events/${eventId}/auto-record`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ auto_record_enabled: enabled }),
          });
        } catch (err: unknown) {
          // Revert on error
          set({ events: prevEvents }, false, 'calendar/toggleAutoRecord/revert');
          const msg = err instanceof Error ? err.message : 'Failed to toggle auto record';
          set({ error: msg }, false, 'calendar/toggleAutoRecord/error');
          throw err;
        }
      },

      clearError: () => set({ error: null }, false, 'calendar/clearError'),
    }),
    { name: 'CalendarStore' }
  )
);

