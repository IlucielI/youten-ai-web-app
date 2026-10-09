import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiFetch } from '@/lib/api-client';
import { BotProvider } from '@/server/constants/recording.constant';
import type {
  MeetingBotCapabilities,
  CapabilitiesResponse,
  DispatchMeetingBotResponse,
  MeetingBotSessionStatusResponse,
  StopMeetingBotSessionResponse,
} from '@/server/dtos/meeting-bot.dto';
import type { ApiResponse } from '@/server/dtos/response.dto';

export interface MeetingBotSessionInfo {
  sessionId: string;
  recordingId: string;
  provider: string;
  status: string;
  meetingUrl?: string;
  startedAt?: string | null;
  errorMessage?: string | null;
}

export interface MeetingBotState {
  selectedProvider: BotProvider;
  capabilities: MeetingBotCapabilities | null;
  isLoadingCapabilities: boolean;
  isDispatching: boolean;
  isStopping: boolean;
  activeSession: MeetingBotSessionInfo | null;
  error: string | null;
}

export interface MeetingBotActions {
  setProvider: (provider: BotProvider) => void;
  fetchCapabilities: () => Promise<void>;
  dispatchBot: (payload: {
    meeting_url?: string;
    guild_id?: string;
    channel_id?: string;
    title?: string;
    template?: string;
    language?: string;
  }) => Promise<string>;
  pollStatus: (sessionId: string) => Promise<void>;
  stopSession: (sessionId: string) => Promise<void>;
  resetSession: () => void;
  clearError: () => void;
}

export type MeetingBotStore = MeetingBotState & MeetingBotActions;

const initialMeetingBotState: MeetingBotState = {
  selectedProvider: BotProvider.GOOGLE_MEET,
  capabilities: null,
  isLoadingCapabilities: false,
  isDispatching: false,
  isStopping: false,
  activeSession: null,
  error: null,
};

export const useMeetingBotStore = create<MeetingBotStore>()(
  devtools(
    (set, get) => ({
      ...initialMeetingBotState,

      setProvider: (provider: BotProvider) =>
        set({ selectedProvider: provider, error: null }, false, 'meetingBot/setProvider'),

      fetchCapabilities: async () => {
        set({ isLoadingCapabilities: true, error: null }, false, 'meetingBot/fetchCapabilities/start');
        try {
          const res = await apiFetch<ApiResponse<CapabilitiesResponse>>('/api/capabilities');
          set(
            { capabilities: res.data?.meeting_bot || null, isLoadingCapabilities: false },
            false,
            'meetingBot/fetchCapabilities/success'
          );
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Gagal memuat status kapabilitas bot';
          set({ isLoadingCapabilities: false, error: msg }, false, 'meetingBot/fetchCapabilities/error');
        }
      },

      dispatchBot: async (payload) => {
        const { selectedProvider } = get();
        set({ isDispatching: true, error: null }, false, 'meetingBot/dispatchBot/start');

        try {
          const body = {
            provider: selectedProvider,
            ...payload,
          };
          const res = await apiFetch<ApiResponse<DispatchMeetingBotResponse>>('/api/recordings/meeting-bot', {
            method: 'POST',
            body: JSON.stringify(body),
          });

          if (!res.data) {
            throw new Error(res.message || 'Gagal memulai sesi bot rapat');
          }

          const sessionInfo: MeetingBotSessionInfo = {
            sessionId: res.data.session_id,
            recordingId: res.data.recording_id,
            provider: res.data.provider,
            status: res.data.status,
            meetingUrl: res.data.meeting_url,
            startedAt: new Date().toISOString(),
          };

          set({ isDispatching: false, activeSession: sessionInfo }, false, 'meetingBot/dispatchBot/success');
          return sessionInfo.sessionId;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Gagal mengirim bot ke rapat';
          set({ isDispatching: false, error: msg }, false, 'meetingBot/dispatchBot/error');
          throw err;
        }
      },

      pollStatus: async (sessionId: string) => {
        try {
          const res = await apiFetch<ApiResponse<MeetingBotSessionStatusResponse>>(
            `/api/recordings/meeting-bot/${sessionId}/status`
          );
          const data = res.data;
          if (data) {
            set(
              (state) => ({
                activeSession: state.activeSession
                  ? {
                      ...state.activeSession,
                      status: data.status,
                      startedAt: data.started_at || state.activeSession.startedAt,
                      errorMessage: data.error_message || undefined,
                    }
                  : null,
              }),
              false,
              'meetingBot/pollStatus/success'
            );
          }
        } catch {
          // Polling fails gracefully without breaking UI
        }
      },

      stopSession: async (sessionId: string) => {
        set({ isStopping: true, error: null }, false, 'meetingBot/stopSession/start');
        try {
          const res = await apiFetch<ApiResponse<StopMeetingBotSessionResponse>>(
            `/api/recordings/meeting-bot/${sessionId}/stop`,
            { method: 'POST' }
          );
          set(
            (state) => ({
              isStopping: false,
              activeSession: state.activeSession
                ? {
                    ...state.activeSession,
                    status: res.data?.status || 'COMPLETED',
                  }
                : null,
            }),
            false,
            'meetingBot/stopSession/success'
          );
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Gagal menghentikan bot';
          set({ isStopping: false, error: msg }, false, 'meetingBot/stopSession/error');
          throw err;
        }
      },

      resetSession: () => set(initialMeetingBotState, false, 'meetingBot/resetSession'),

      clearError: () => set({ error: null }, false, 'meetingBot/clearError'),
    }),
    { name: 'MeetingBotStore' }
  )
);
