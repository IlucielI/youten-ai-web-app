import { useState, useCallback } from 'react';
import { useChatStore } from '@/stores/chat.store';
import { useTokenStore } from '@/stores/token.store';
import { parseTimestamp } from '@/lib/time';
import type { MeetingSourceCitationDTO } from '@/server/dtos/workspace.dto';

export interface UseRecordingChatStreamOptions {
  recordingId: string;
  recordingTitle?: string;
  shareToken?: string;
  initialIsOpen?: boolean;
}

export function useRecordingChatStream({
  recordingId,
  recordingTitle = '',
  shareToken,
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
        if (shareToken) {
          headers['x-share-token'] = shareToken;
        }

        const res = await fetch(`/api/recordings/${recordingId}/chat`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            message: text,
            ownership_token: ownershipToken,
            share_token: shareToken,
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
        let currentEventType = '';

        const getSessionStorageKey = () =>
          shareToken ? `youten_share_chat_session_${shareToken}` : `youten_chat_session_${recordingId}`;

        const processLine = (line: string) => {
          const trimmed = line.trim();
          if (!trimmed) {
            currentEventType = '';
            return;
          }
          if (trimmed.startsWith('event:')) {
            currentEventType = trimmed.slice(6).trim();
            return;
          }
          if (trimmed.startsWith('data:')) {
            const rawData = trimmed.slice(5).trim();
            if (!rawData) return;

            try {
              const data = JSON.parse(rawData);
              if (currentEventType === 'session' && data.session_id) {
                setSessionId(data.session_id);
                if (typeof window !== 'undefined') {
                  localStorage.setItem(getSessionStorageKey(), data.session_id);
                }
              } else if (currentEventType === 'token' && data.token) {
                fullContent += data.token;
                appendStreamChunk(data.token);
              } else if (currentEventType === 'done') {
                if (data.session_id) {
                  setSessionId(data.session_id);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem(getSessionStorageKey(), data.session_id);
                  }
                }
                if (data.content && !fullContent) {
                  fullContent = data.content;
                }
                if (Array.isArray(data.citations)) {
                  rawCitations = data.citations;
                }
              } else if (currentEventType === 'error') {
                throw new Error(data.error || 'Terjadi kesalahan pada respon AI');
              }
            } catch (parseErr) {
              if (currentEventType === 'error') throw parseErr;
            }
          }
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            buffer += decoder.decode();
            if (buffer.trim()) {
              const remainingLines = buffer.split('\n');
              for (const line of remainingLines) {
                processLine(line);
              }
            }
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            processLine(line);
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
      shareToken,
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

