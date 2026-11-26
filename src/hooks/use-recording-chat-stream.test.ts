import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRecordingChatStream } from './use-recording-chat-stream';
import { useChatStore } from '@/stores/chat.store';

describe('useRecordingChatStream', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    useChatStore.getState().setRecordingId('rec-123');
    useChatStore.getState().clearChat();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('silently refreshes session on 401 response and completes SSE chat stream', async () => {
    const encoder = new TextEncoder();
    const sseBody = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode('event: session\ndata: {"session_id":"sess-new"}\n\n')
        );
        controller.enqueue(
          encoder.encode('event: token\ndata: {"token":"HLD LLD dibahas oleh Diki."}\n\n')
        );
        controller.enqueue(
          encoder.encode('event: done\ndata: {"session_id":"sess-new","citations":["02:15"]}\n\n')
        );
        controller.close();
      },
    });

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ code: 'UNAUTHORIZED', message: 'Access token expired' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 'success' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: sseBody,
      });

    const { result } = renderHook(() =>
      useRecordingChatStream({
        recordingId: 'rec-123',
        recordingTitle: 'Alignin TICS',
      })
    );

    await act(async () => {
      useChatStore.getState().addUserMessage('HLD LLD di mention oleh siapa?');
      await result.current.sendMessage('HLD LLD di mention oleh siapa?');
    });

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      '/api/auth/refresh',
      expect.objectContaining({ method: 'POST' })
    );

    const state = useChatStore.getState();
    expect(state.error).toBeNull();
    expect(state.sessionId).toBe('sess-new');
    expect(state.messages).toHaveLength(2);
    expect(state.messages[1].content).toBe('HLD LLD dibahas oleh Diki.');
  });

  it('discards empty assistant placeholder when HTTP 403 error occurs instead of showing empty AI response card', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ code: 'FORBIDDEN', message: 'forbidden access' }),
    });

    const { result } = renderHook(() =>
      useRecordingChatStream({
        recordingId: 'rec-123',
        recordingTitle: 'Alignin TICS',
      })
    );

    await act(async () => {
      useChatStore.getState().addUserMessage('Test query');
      await result.current.sendMessage('Test query');
    });

    const state = useChatStore.getState();
    expect(state.error).toBe('forbidden access');
    // Only user message should remain; no empty assistant bubble triggering false emptyResponseError
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].role).toBe('user');
  });
});

