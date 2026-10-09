import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMeetingBotStore } from './meeting-bot.store';
import * as apiClient from '@/lib/api-client';
import { BotProvider } from '@/server/constants/recording.constant';

describe('useMeetingBotStore', () => {
  beforeEach(() => {
    useMeetingBotStore.getState().resetSession();
    vi.restoreAllMocks();
  });

  it('selects provider and clears error', () => {
    useMeetingBotStore.getState().setProvider(BotProvider.DISCORD);
    expect(useMeetingBotStore.getState().selectedProvider).toBe(BotProvider.DISCORD);
  });

  it('fetches capabilities successfully', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockResolvedValueOnce({
      status: 'success',
      data: {
        meeting_bot: {
          discord: 'available',
          google_meet: 'available',
          ms_teams: 'available',
          zoom: 'available',
        },
      },
    });

    await useMeetingBotStore.getState().fetchCapabilities();

    expect(useMeetingBotStore.getState().capabilities?.discord).toBe('available');
    expect(useMeetingBotStore.getState().isLoadingCapabilities).toBe(false);
  });

  it('handles fetchCapabilities error', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockRejectedValueOnce(new Error('Network failure'));

    await useMeetingBotStore.getState().fetchCapabilities();

    expect(useMeetingBotStore.getState().error).toBe('Network failure');
    expect(useMeetingBotStore.getState().isLoadingCapabilities).toBe(false);
  });

  it('dispatches bot and sets activeSession', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockResolvedValueOnce({
      status: 'success',
      data: {
        session_id: 'sess-123',
        recording_id: 'rec-123',
        provider: 'google_meet',
        status: 'DISPATCHED',
        meeting_url: 'https://meet.google.com/abc-defg-hij',
        message: 'Bot dispatched',
      },
    });

    const sessionId = await useMeetingBotStore.getState().dispatchBot({
      meeting_url: 'https://meet.google.com/abc-defg-hij',
    });

    expect(sessionId).toBe('sess-123');
    expect(useMeetingBotStore.getState().activeSession?.sessionId).toBe('sess-123');
    expect(useMeetingBotStore.getState().activeSession?.status).toBe('DISPATCHED');
  });

  it('polls status and updates activeSession', async () => {
    useMeetingBotStore.setState({
      activeSession: {
        sessionId: 'sess-123',
        recordingId: 'rec-123',
        provider: 'google_meet',
        status: 'DISPATCHED',
      },
    });

    vi.spyOn(apiClient, 'apiFetch').mockResolvedValueOnce({
      status: 'success',
      data: {
        session_id: 'sess-123',
        recording_id: 'rec-123',
        provider: 'google_meet',
        status: 'RECORDING',
        started_at: '2026-10-10T04:00:00Z',
      },
    });

    await useMeetingBotStore.getState().pollStatus('sess-123');

    expect(useMeetingBotStore.getState().activeSession?.status).toBe('RECORDING');
  });

  it('stops session and marks it completed', async () => {
    useMeetingBotStore.setState({
      activeSession: {
        sessionId: 'sess-123',
        recordingId: 'rec-123',
        provider: 'google_meet',
        status: 'RECORDING',
      },
    });

    vi.spyOn(apiClient, 'apiFetch').mockResolvedValueOnce({
      status: 'success',
      data: {
        session_id: 'sess-123',
        recording_id: 'rec-123',
        status: 'COMPLETED',
        message: 'Bot left',
      },
    });

    await useMeetingBotStore.getState().stopSession('sess-123');

    expect(useMeetingBotStore.getState().activeSession?.status).toBe('COMPLETED');
    expect(useMeetingBotStore.getState().isStopping).toBe(false);
  });
});
