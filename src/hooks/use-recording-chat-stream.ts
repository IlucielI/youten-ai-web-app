import { useState, useCallback } from 'react';
import { useChatStore } from '@/stores/chat.store';
import { useTokenStore } from '@/stores/token.store';
import { parseTimestamp } from '@/lib/time';
import type { MeetingSourceCitationDTO } from '@/server/dtos/workspace.dto';

export interface UseRecordingChatStreamOptions {
  recordingId: string;
  recordingTitle?: string;
  initialIsOpen?: boolean;
}

export function useRecordingChatStream({
  recordingId,
  recordingTitle = '',
  initialIsOpen = false,
}: UseRecordingChatStreamOptions) {
  const [isChatOpen, setIsChatOpen] = useState<boolean>(initialIsOpen);

  const sessionId = useChatStore((state) => state.sessionId);
  const setSessionId = useChatStore((state) => state.setSessionId);
  const startAssistantStream = useChatStore((state) => state.startAssistantStream);
  const appendStreamChunk = useChatStore((state) => state.appendStreamChunk);
  const finalizeAssistantMessage = useChatStore((state) => state.finalizeAssistantMessage);
  const setChatError = useChatStore((state) => state.setChatError);

  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => !prev);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!recordingId) return;

      const assistantMsgId = startAssistantStream();
      let fullContent = '';
      let rawCitations: string[] = [];

      try {
        const ownershipToken =
          useTokenStore.getState().getGuestToken(recordingId) ||
          (typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('token') || undefined
            : undefined);
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (ownershipToken) {
          headers['x-ownership-token'] = ownershipToken;
        }

        const res = await fetch(`/api/recordings/${recordingId}/chat`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            message: text,
            ownership_token: ownershipToken,
            session_id: sessionId || undefined,
          }),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || errJson.message || 'Gagal menghubungi asisten AI');
        }

        if (!res.body) {
          throw new Error('Respon tidak memiliki data streaming');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]?.trim() || '';
            if (line.startsWith('event:')) {
              const eventType = line.slice(6).trim();
              const nextLine = lines[i + 1]?.trim() || '';
              if (nextLine.startsWith('data:')) {
                i++;
                const rawData = nextLine.slice(5).trim();
                if (!rawData) continue;

                try {
                  const data = JSON.parse(rawData);
                  if (eventType === 'session' && data.session_id) {
                    setSessionId(data.session_id);
                    if (typeof window !== 'undefined') {
                      localStorage.setItem(`youten_chat_session_${recordingId}`, data.session_id);
                    }
                  } else if (eventType === 'token' && data.token) {
                    fullContent += data.token;
                    appendStreamChunk(data.token);
                  } else if (eventType === 'done') {
                    if (data.session_id) {
                      setSessionId(data.session_id);
                      if (typeof window !== 'undefined') {
                        localStorage.setItem(`youten_chat_session_${recordingId}`, data.session_id);
                      }
                    }
                    if (data.content && !fullContent) {
                      fullContent = data.content;
                    }
                    if (Array.isArray(data.citations)) {
                      rawCitations = data.citations;
                    }
                  } else if (eventType === 'error') {
                    throw new Error(data.error || 'Terjadi kesalahan pada respon AI');
                  }
                } catch (parseErr) {
                  if (eventType === 'error') throw parseErr;
                }
              }
            }
          }
        }

        const mappedCitations: MeetingSourceCitationDTO[] = rawCitations.map((c, idx) => ({
          recording_id: recordingId,
          recording_title: recordingTitle,
          chunk_index: idx,
          snippet: c,
          start_time: parseTimestamp(c),
          end_time: parseTimestamp(c),
        }));

        finalizeAssistantMessage(assistantMsgId, fullContent, mappedCitations);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Terjadi kesalahan koneksi AI';
        setChatError(errMsg);
        finalizeAssistantMessage(assistantMsgId, fullContent);
      }
    },
    [
      recordingId,
      recordingTitle,
      sessionId,
      startAssistantStream,
      appendStreamChunk,
      setSessionId,
      finalizeAssistantMessage,
      setChatError,
    ]
  );

  return {
    isChatOpen,
    setIsChatOpen,
    toggleChat,
    sendMessage,
  };
}

