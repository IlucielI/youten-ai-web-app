import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api-client';
import { claimSingleRecording } from '@/lib/claim';
import { exportRecordingFile, getStoredGuestToken } from '@/lib/export-recording';
import { useTranslation } from '@/locales';
import { usePlayerStore } from '@/stores/player.store';
import { useChatStore } from '@/stores/chat.store';
import { useTokenStore } from '@/stores/token.store';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { usePermissions } from '@/hooks/use-permissions';
import { RecordingStatus, ChatRole } from '@/server/constants';
import { TemplateKey } from '@/server/constants/template.constant';
import { ExportFormat } from '@/server/constants/recording.constant';
import type { ApiResponse } from '@/server/dtos/response.dto';
import type { RecordingDetailDto } from '@/server/schemas/recording.schema';
import type { SummaryData } from '@/components/organisms/summary-viewer';
import type { SummaryVersionItem } from '@/components/molecules/summary-version-tabs';
import type { SummaryVersionResponse } from '@/server/dtos/summary.dto';
import type { TranscriptSegmentDTO } from '@/server/dtos/recording.dto';
import type { CommentResponse, CreateCommentRequest } from '@/server/dtos/comment.dto';
import type { RecordingAnalyticsDTO } from '@/server/dtos/analytics.dto';
import type { UserProfileResponse } from '@/server/dtos/auth.dto';
import type { ChatMessageResponseDto } from '@/server/schemas/chat.schema';

export function useRecordingDetail(recordingId: string) {
  const router = useRouter();
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  });

  const { t, locale } = useTranslation();
  const localeRef = useRef(locale);
  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

  const [recording, setRecording] = useState<RecordingDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'chapters' | 'analytics'>('summary');

  // Speaker rename modal state
  const [renameSpeakerId, setRenameSpeakerId] = useState<string | null>(null);
  const [speakerLabels, setSpeakerLabels] = useState<Record<string, string>>({});

  // Summary versions & regenerate modal
  const [allSummaries, setAllSummaries] = useState<SummaryData[]>([]);
  const [summaryVersions, setSummaryVersions] = useState<SummaryVersionItem[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [isActivatingVersion, setIsActivatingVersion] = useState<boolean>(false);
  const [isRegenerateOpen, setIsRegenerateOpen] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [activeSummaryData, setActiveSummaryData] = useState<SummaryData | null>(null);

  // Share Dialog State
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [isShared, setIsShared] = useState<boolean>(false);
  const [shareToken, setShareToken] = useState<string | null>(null);

  // Export Menu State
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Claim state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfileResponse | null>(null);

  // Comment Drawer State
  const [isCommentDrawerOpen, setIsCommentDrawerOpen] = useState<boolean>(false);
  const [selectedCommentSegment, setSelectedCommentSegment] = useState<TranscriptSegmentDTO | null>(null);
  const [comments, setComments] = useState<CommentResponse[]>([]);

  // Permissions
  const { canExportPdf } = usePermissions(currentUser);

  // Zustand Store Hooks
  const setAudioUrl = usePlayerStore((state) => state.setAudioUrl);
  const setRecordingIdChat = useChatStore((state) => state.setRecordingId);
  const setSessionId = useChatStore((state) => state.setSessionId);
  const setMessages = useChatStore((state) => state.setMessages);

  // Check authenticated user profile after recording loads (used for guest claim UI & Pro PDF export gating)
  const loadedRecordingId = recording?.id;
  useEffect(() => {
    if (!loadedRecordingId) return;
    let mounted = true;
    apiFetch<ApiResponse<UserProfileResponse>>('/api/auth/me')
      .then((res) => {
        if (!mounted) return;
        if (res && (res.status === 'success' || (res.status as string) === 'SUCCESS') && res.data) {
          setIsLoggedIn(true);
          setCurrentUser(res.data);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setIsLoggedIn(false);
        setCurrentUser(null);
      });
    return () => {
      mounted = false;
    };
  }, [loadedRecordingId]);

  const handleManualClaim = useCallback(async () => {
    if (!recording) return;
    setIsClaiming(true);
    try {
      const success = await claimSingleRecording(recording.id);
      if (success) {
        setRecording((prev) => (prev ? { ...prev, is_guest: false } : prev));
      }
    } finally {
      setIsClaiming(false);
    }
  }, [recording]);

  // Initial recording fetch
  useEffect(() => {
    if (!recordingId) return;

    let isMounted = true;
    apiFetch<ApiResponse<RecordingDetailDto>>(`/api/recordings/${recordingId}`)
      .then((res) => {
        if (!isMounted) return;
        if (!res.data) {
          throw new Error(localeRef.current === 'en' ? 'Recording data not found.' : 'Data rekaman tidak ditemukan.');
        }

        const data = res.data;

        // If recording is still in pipeline progress, redirect to processing screen
        if (data.status !== RecordingStatus.COMPLETED && data.status !== RecordingStatus.FAILED) {
          routerRef.current.push(`/recordings/${recordingId}/processing`);
          return;
        }

        setRecording(data);

        // Initialize player audio URL
        if (data.audio_url || data.playback_url) {
          setAudioUrl(data.audio_url || data.playback_url || null);
        }

        // Initialize AI Chat context & restore previous session
        setRecordingIdChat(recordingId);
        const savedSessionId =
          typeof window !== 'undefined'
            ? localStorage.getItem(`youten_chat_session_${recordingId}`)
            : null;
        if (savedSessionId) {
          setSessionId(savedSessionId);
          const ownershipToken =
            useTokenStore.getState().getGuestToken(recordingId) ||
            (typeof window !== 'undefined'
              ? new URLSearchParams(window.location.search).get('token') || undefined
              : undefined);
          const chatHeaders: Record<string, string> = {};
          if (ownershipToken) chatHeaders['x-ownership-token'] = ownershipToken;
          apiFetch<ApiResponse<ChatMessageResponseDto[]>>(
            `/api/recordings/${recordingId}/chat?session_id=${savedSessionId}`,
            { headers: chatHeaders }
          )
            .then((chatRes) => {
              if (!isMounted) return;
              if (chatRes && chatRes.data && Array.isArray(chatRes.data) && chatRes.data.length > 0) {
                setMessages(
                  chatRes.data.map((m) => ({
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
        }

        // Initialize active summary & version list
        if (data.active_summary) {
          const initialVerId = data.active_summary.id || 'ver-1';
          setSelectedVersionId(initialVerId);
          const initialSummary: SummaryData = {
            id: initialVerId,
            version: data.active_summary.version || 1,
            template_category: data.active_summary.template_category || data.selected_template,
            custom_angle: data.active_summary.custom_angle,
            structured_data: data.active_summary.structured_data || null,
            markdown_content: data.active_summary.markdown_content,
            is_active: true,
            created_at: data.active_summary.created_at || data.created_at,
          };
          setActiveSummaryData(initialSummary);
          setAllSummaries([initialSummary]);

          setSummaryVersions([
            {
              id: initialVerId,
              version: data.active_summary.version || 1,
              template_category: data.active_summary.template_category || data.selected_template,
              is_active: true,
              created_at: data.active_summary.created_at || data.created_at,
            },
          ]);
        }

        // Fetch all historical summary versions from API
        const ownershipToken = useTokenStore.getState().getGuestToken(recordingId);
        const versionHeaders: Record<string, string> = {};
        if (ownershipToken) {
          versionHeaders['x-ownership-token'] = ownershipToken;
        }
        apiFetch<ApiResponse<SummaryVersionResponse[]>>(
          `/api/recordings/${recordingId}/summaries`,
          { headers: versionHeaders }
        )
          .then((versionsRes) => {
            if (!isMounted) return;
            if (versionsRes.data && versionsRes.data.length > 0) {
              const fullSummaries: SummaryData[] = versionsRes.data.map((item) => ({
                id: item.id,
                version: item.version,
                template_category: item.template_category,
                custom_angle: item.custom_angle,
                structured_data: item.structured_data,
                markdown_content: item.markdown_content,
                is_active: item.is_active,
                created_at: item.created_at,
              }));
              setAllSummaries(fullSummaries);

              const versionTabs: SummaryVersionItem[] = fullSummaries.map((s) => ({
                id: s.id || '',
                version: s.version || 1,
                template_category: s.template_category,
                is_active: !!s.is_active,
                created_at: s.created_at,
              }));
              setSummaryVersions(versionTabs);

              const activeVer = fullSummaries.find((s) => s.is_active) || fullSummaries[0];
              if (activeVer) {
                setSelectedVersionId(activeVer.id || '');
                setActiveSummaryData(activeVer);
              }
            }
          })
          .catch(() => {
            // Gracefully keep initial active summary
          });

        // Initialize speaker labels map
        if (data.segments && data.segments.length > 0) {
          const map: Record<string, string> = {};
          for (const s of data.segments) {
            if (s.speaker_label) {
              const currentVal = map[s.speaker_label];
              const isGeneric =
                !currentVal ||
                currentVal.toLowerCase().startsWith('speaker') ||
                currentVal.toLowerCase().startsWith('pembicara');
              const newName = s.speaker_name?.trim();
              const isNewNameReal =
                newName &&
                !newName.toLowerCase().startsWith('speaker') &&
                !newName.toLowerCase().startsWith('pembicara');

              if (isNewNameReal && isGeneric) {
                map[s.speaker_label] = newName;
              } else if (!currentVal) {
                map[s.speaker_label] = s.speaker_name || s.speaker_label;
              }
            }
          }
          setSpeakerLabels(map);
        }

        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setIsLoading(false);
        const msg =
          err instanceof Error
            ? err.message
            : localeRef.current === 'en'
            ? 'Failed to load recording details.'
            : 'Gagal memuat detail rekaman.';
        setErrorMessage(msg);
      });

    return () => {
      isMounted = false;
    };
  }, [recordingId, setAudioUrl, setRecordingIdChat, setSessionId, setMessages]);

  // Handle speaker rename
  const handleSaveSpeakerLabel = useCallback(
    async (speakerId: string, newLabel: string) => {
      const updated = { ...speakerLabels, [speakerId]: newLabel };
      setSpeakerLabels(updated);
      setRenameSpeakerId(null);

      if (recording?.analytics_data && typeof recording.analytics_data === 'object') {
        const currentAnalytics = recording.analytics_data as unknown as RecordingAnalyticsDTO;
        if (Array.isArray(currentAnalytics.speakers)) {
          const updatedSpeakers = currentAnalytics.speakers.map((spk) => {
            if (spk.name === speakerId || speakerLabels[speakerId] === spk.name) {
              return { ...spk, name: newLabel };
            }
            return spk;
          });
          setRecording({
            ...recording,
            analytics_data: {
              ...currentAnalytics,
              speakers: updatedSpeakers,
            } as unknown as Record<string, unknown>,
          });
        }
      }

      try {
        await apiFetch(`/api/recordings/${recordingId}/speakers`, {
          method: 'PUT',
          body: JSON.stringify({ speakers: updated }),
        });
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : localeRef.current === 'en'
            ? 'Failed to save speaker label'
            : 'Gagal menyimpan nama pembicara';
        toast.error(msg);
      }
    },
    [recording, recordingId, speakerLabels]
  );

  // Handle summary version selection
  const handleSelectVersion = useCallback(
    (versionId: string) => {
      setSelectedVersionId(versionId);
      const targetSummary = allSummaries.find((s) => s.id === versionId);
      if (targetSummary) {
        setActiveSummaryData(targetSummary);
      }
    },
    [allSummaries]
  );

  // Handle setting summary version as active
  const handleActivateVersion = useCallback(
    async (versionId: string) => {
      if (!recordingId) return;
      try {
        setIsActivatingVersion(true);
        const ownershipToken = useTokenStore.getState().getGuestToken(recordingId);
        const headers: Record<string, string> = {};
        if (ownershipToken) {
          headers['x-ownership-token'] = ownershipToken;
        }

        const res = await apiFetch<ApiResponse<SummaryVersionResponse>>(
          `/api/recordings/${recordingId}/summaries/${versionId}/activate`,
          {
            method: 'PATCH',
            headers,
          }
        );

        if (res.data) {
          const activated = res.data;
          setAllSummaries((prev) =>
            prev.map((s) => ({
              ...s,
              is_active: s.id === versionId,
            }))
          );
          setSummaryVersions((prev) =>
            prev.map((v) => ({
              ...v,
              is_active: v.id === versionId,
            }))
          );
          setActiveSummaryData((prev) =>
            prev ? { ...prev, is_active: prev.id === versionId } : prev
          );
          toast.success(`Versi ${activated.version} berhasil dijadikan versi aktif!`);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal mengaktifkan versi ringkasan.';
        toast.error(msg);
      } finally {
        setIsActivatingVersion(false);
      }
    },
    [recordingId]
  );

  // Handle summary regeneration
  const handleRegenerate = useCallback(
    async (payload: { templateCategory: TemplateKey; customAngle?: string }) => {
      if (!recordingId) return;

      try {
        setIsRegenerating(true);
        const ownershipToken = useTokenStore.getState().getGuestToken(recordingId);

        const headers: Record<string, string> = {};
        if (ownershipToken) {
          headers['x-ownership-token'] = ownershipToken;
        }

        const res = await apiFetch<ApiResponse<SummaryVersionResponse>>(
          `/api/recordings/${recordingId}/regenerate`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              template_category: payload.templateCategory,
              custom_angle: payload.customAngle,
              ownership_token: ownershipToken,
            }),
          }
        );

        if (res.data) {
          const regenerated = res.data;
          const newSummary: SummaryData = {
            id: regenerated.id,
            version: regenerated.version,
            template_category: regenerated.template_category as TemplateKey,
            custom_angle: regenerated.custom_angle,
            structured_data: regenerated.structured_data,
            markdown_content: regenerated.markdown_content,
            is_active: true,
            created_at: regenerated.created_at,
          };
          const newVersionItem: SummaryVersionItem = {
            id: regenerated.id,
            version: regenerated.version,
            template_category: regenerated.template_category as TemplateKey,
            is_active: true,
            created_at: regenerated.created_at,
          };

          setAllSummaries((prev) => [
            ...prev.map((s) => ({ ...s, is_active: false })),
            newSummary,
          ]);
          setSummaryVersions((prev) => [
            ...prev.map((v) => ({ ...v, is_active: false })),
            newVersionItem,
          ]);
          setSelectedVersionId(regenerated.id);
          setActiveSummaryData(newSummary);

          toast.success(`Versi ringkasan baru (${regenerated.version}) berhasil dibuat!`);
        }

        setIsRegenerateOpen(false);
      } catch (err: unknown) {
        console.error('Failed to regenerate summary:', err);
        const msg = err instanceof Error ? err.message : 'Gagal membuat versi ringkasan baru';
        toast.error(msg);
      } finally {
        setIsRegenerating(false);
      }
    },
    [recordingId]
  );

  // Handle public share toggle
  const handleToggleShare = useCallback(
    async (enable: boolean) => {
      if (!recordingId) return;

      try {
        const res = await apiFetch<ApiResponse<{ is_share_enabled: boolean; share_token?: string }>>(
          `/api/recordings/${recordingId}/share`,
          {
            method: 'PATCH',
            body: JSON.stringify({ is_share_enabled: enable }),
          }
        );

        if (res.data) {
          setIsShared(res.data.is_share_enabled);
          setShareToken(res.data.share_token || null);
          toast.success(
            enable
              ? locale === 'en'
                ? 'Public link enabled'
                : 'Tautan publik diaktifkan'
              : locale === 'en'
              ? 'Public link disabled'
              : 'Tautan publik dinonaktifkan'
          );
        }
      } catch (err) {
        console.error('Failed to toggle share:', err);
        toast.error(
          locale === 'en'
            ? 'Failed to update public link settings'
            : 'Gagal memperbarui pengaturan tautan publik'
        );
        throw err;
      }
    },
    [recordingId, locale]
  );

  // Handle file export
  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (!recording) return;
      await exportRecordingFile({
        recordingId,
        format,
        recording,
        activeSummaryData,
        speakerLabels,
        onSuccess: (fmt) => {
          if (fmt === ExportFormat.DOCX) {
            toast.success(t('recording.exportMenu.docxSuccessToast'));
          }
        },
      });
    },
    [recording, recordingId, activeSummaryData, speakerLabels, t]
  );

  // Handle comment creation
  const handleCreateComment = useCallback(
    (payload: CreateCommentRequest) => {
      const members = useWorkspaceStore.getState().members;
      const mentions = (payload.mentioned_user_ids || []).map((uid) => {
        const m = members.find((x) => x.user_id === uid);
        return {
          id: `mention-${uid}-${Date.now()}`,
          user_id: uid,
          full_name: m?.full_name,
          email: m?.email,
        };
      });

      const newComment: CommentResponse = {
        id: `comment-${Date.now()}`,
        recording_id: recordingId,
        user_id: 'current-user',
        author_name: payload.author_name || 'Anda',
        comment_text: payload.comment_text,
        timestamp_sec: payload.timestamp_sec,
        segment_id: payload.segment_id,
        selected_text: payload.selected_text,
        mentions: mentions.length > 0 ? mentions : undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setComments((prev) => [newComment, ...prev]);
    },
    [recordingId]
  );

  // Handle replying to comment
  const handleReplyComment = useCallback(
    (parentId: string, payload: CreateCommentRequest) => {
      const members = useWorkspaceStore.getState().members;
      const mentions = (payload.mentioned_user_ids || []).map((uid) => {
        const m = members.find((x) => x.user_id === uid);
        return {
          id: `mention-${uid}-${Date.now()}`,
          user_id: uid,
          full_name: m?.full_name,
          email: m?.email,
        };
      });

      const reply: CommentResponse = {
        id: `reply-${Date.now()}`,
        recording_id: recordingId,
        user_id: 'current-user',
        author_name: payload.author_name || 'Anda',
        comment_text: payload.comment_text,
        timestamp_sec: payload.timestamp_sec,
        parent_id: parentId,
        mentions: mentions.length > 0 ? mentions : undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setComments((prev) =>
        prev.map((c) => {
          if (c.id === parentId) {
            return {
              ...c,
              replies: [...(c.replies || []), reply],
            };
          }
          return c;
        })
      );
    },
    [recordingId]
  );

  // Handle saving segment text inline
  const handleSaveSegmentText = useCallback(
    async (segmentId: string, newText: string) => {
      if (!recordingId) return;

      const ownershipToken = getStoredGuestToken(recordingId);

      try {
        await apiFetch(`/api/recordings/${recordingId}/segments/${segmentId}`, {
          method: 'PATCH',
          headers: ownershipToken ? { 'x-ownership-token': ownershipToken } : undefined,
          body: JSON.stringify({
            text: newText,
            ownership_token: ownershipToken,
          }),
        });

        setRecording((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            segments: (prev.segments || []).map((seg) =>
              seg.id === segmentId ? { ...seg, text: newText } : seg
            ),
          };
        });

        toast.success('Transkrip berhasil diperbarui');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal memperbarui segmen';
        toast.error(msg);
        throw err;
      }
    },
    [recordingId]
  );

  return {
    recording,
    isLoading,
    errorMessage,
    activeTab,
    setActiveTab,
    speakerLabels,
    renameSpeakerId,
    setRenameSpeakerId,
    handleSaveSpeakerLabel,
    allSummaries,
    summaryVersions,
    selectedVersionId,
    activeSummaryData,
    isActivatingVersion,
    isRegenerateOpen,
    setIsRegenerateOpen,
    isRegenerating,
    handleSelectVersion,
    handleActivateVersion,
    handleRegenerate,
    isShareOpen,
    setIsShareOpen,
    isShared,
    shareToken,
    handleToggleShare,
    isExportOpen,
    setIsExportOpen,
    handleExport,
    isLoggedIn,
    isClaiming,
    handleManualClaim,
    canExportPdf,
    comments,
    isCommentDrawerOpen,
    setIsCommentDrawerOpen,
    selectedCommentSegment,
    setSelectedCommentSegment,
    handleCreateComment,
    handleReplyComment,
    handleSaveSegmentText,
  };
}

