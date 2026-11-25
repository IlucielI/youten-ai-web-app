import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { usePlayerStore } from '@/stores/player.store';
import { useChatStore } from '@/stores/chat.store';
import { apiFetch } from '@/lib/api-client';
import { ApiResponse } from '@/server/dtos/response.dto';
import type { SharedRecordingResponse } from '@/server/dtos/recording.dto';
import type { ChatMessageResponseDto } from '@/server/schemas/chat.schema';
import { ChatRole } from '@/server/constants';
import { ExportFormat } from '@/server/constants/recording.constant';
import { exportRecordingFile } from '@/lib/export-recording';
import { useRecordingChatStream } from '@/hooks/use-recording-chat-stream';
import { RecordingTabKey } from '@/components/molecules/recording-tabs';
import { SummaryData } from '@/components/organisms/summary-viewer';
import { useTranslation } from '@/locales';

export interface UseSharedRecordingOptions {
  token: string;
}

export function useSharedRecording({ token }: UseSharedRecordingOptions) {
  const { t } = useTranslation();

  const [recording, setRecording] = useState<SharedRecordingResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // User Auth State
  const currentUser = useAuthStore((state) => state.user);
  const handleLogout = useAuthStore((state) => state.logout);

  // Active Main Tab & Export state
  const [activeTab, setActiveTab] = useState<RecordingTabKey>('summary');
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Transcript Search Filter
  const [transcriptSearch, setTranscriptSearch] = useState<string>('');

  // Audio Player State
  const currentTime = usePlayerStore((state) => state.currentTime);
  const seek = usePlayerStore((state) => state.seek);
  const setAudioUrl = usePlayerStore((state) => state.setAudioUrl);

  // Chat Store
  const setRecordingIdChat = useChatStore((state) => state.setRecordingId);
  const setSessionId = useChatStore((state) => state.setSessionId);
  const setMessages = useChatStore((state) => state.setMessages);
  const addUserMessage = useChatStore((state) => state.addUserMessage);

  // Real-time Chat Streaming
  const {
    isChatOpen,
    setIsChatOpen,
    sendMessage: handleSendMessage,
  } = useRecordingChatStream({
    recordingId: recording?.id || '',
    recordingTitle: recording?.title || '',
    shareToken: token,
  });

  /**
   * Fetch shared recording details by public token.
   */
  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    apiFetch<ApiResponse<SharedRecordingResponse>>(`/api/recordings/shared/${token}`)
      .then((res) => {
        if (!isMounted) return;
        if (res && res.data) {
          setRecording(res.data);
          const streamUrl = res.data.audio_url || res.data.playback_url;
          if (streamUrl) {
            setAudioUrl(streamUrl);
          }
        } else {
          setErrorMessage(t('share.unavailableDesc'));
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : t('share.unavailableDesc');
        setErrorMessage(msg);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token, setAudioUrl, t]);

  /**
   * Initialize isolated Ask AI session and restore chat history for share link visitor.
   */
  useEffect(() => {
    if (!token || !recording?.id) return;
    setRecordingIdChat(recording.id);

    const savedSessionId =
      typeof window !== 'undefined'
        ? localStorage.getItem(`youten_share_chat_session_${token}`)
        : null;

    if (savedSessionId) {
      setSessionId(savedSessionId);
      let isMounted = true;
      apiFetch<ApiResponse<ChatMessageResponseDto[]>>(
        `/api/recordings/${recording.id}/chat?session_id=${savedSessionId}&share_token=${token}`
      )
        .then((res) => {
          if (!isMounted) return;
          if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
            setMessages(
              res.data.map((m) => ({
                id: m.id,
                role: m.role as ChatRole,
                content: m.content,
                timestamp: m.created_at,
              }))
            );
          }
        })
        .catch(() => {
          // Ignore failure restoring chat history
        });

      return () => {
        isMounted = false;
      };
    }
  }, [token, recording?.id, setRecordingIdChat, setSessionId, setMessages]);

  // Transform active summary for SummaryViewer component
  const summaryData: SummaryData | null = useMemo(() => {
    if (!recording?.active_summary) return null;
    return {
      id: recording.active_summary.id,
      recording_id: recording.id,
      template_category: recording.active_summary.template_category,
      custom_angle: recording.active_summary.custom_angle,
      structured_data: recording.active_summary.structured_data,
      markdown_content: recording.active_summary.markdown_content,
      is_active: recording.active_summary.is_active,
      created_at: recording.active_summary.created_at,
    };
  }, [recording]);

  // Memoized filter for transcript segments
  const filteredSegments = useMemo(() => {
    const segments = recording?.segments || [];
    if (!transcriptSearch.trim()) return segments;

    const query = transcriptSearch.toLowerCase();
    return segments.filter(
      (s) =>
        s.text.toLowerCase().includes(query) ||
        (s.speaker_name || s.speaker_label || '').toLowerCase().includes(query)
    );
  }, [recording, transcriptSearch]);

  // Memoized speaker labels map for AnalyticsCards and Transcript
  const speakerLabels = useMemo(() => {
    const map: Record<string, string> = {};
    if (recording?.segments) {
      for (const s of recording.segments) {
        if (s.speaker_label && (s.speaker_name || !map[s.speaker_label])) {
          map[s.speaker_label] = s.speaker_name || s.speaker_label;
        }
      }
    }
    return map;
  }, [recording]);

  /**
   * Handle exporting shared recording files.
   */
  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (!recording) return;
      await exportRecordingFile({
        recordingId: recording.id,
        format,
        recording,
        activeSummaryData: summaryData,
        speakerLabels,
      });
    },
    [recording, summaryData, speakerLabels]
  );

  /**
   * Handle Ask AI shortcut triggered from a transcript segment.
   */
  const handleAskAiFromTranscript = useCallback(
    (segmentText: string) => {
      setIsChatOpen(true);
      const prompt = t('recording.transcript.askAiPrompt', { text: segmentText });
      addUserMessage(prompt);
      void handleSendMessage(prompt);
    },
    [setIsChatOpen, t, addUserMessage, handleSendMessage]
  );

  return {
    token,
    recording,
    isLoading,
    errorMessage,
    currentUser,
    handleLogout,
    activeTab,
    setActiveTab,
    isExportOpen,
    setIsExportOpen,
    isChatOpen,
    setIsChatOpen,
    transcriptSearch,
    setTranscriptSearch,
    summaryData,
    filteredSegments,
    speakerLabels,
    currentTime,
    seek,
    handleExport,
    handleSendMessage,
    handleAskAiFromTranscript,
    t,
  };
}

