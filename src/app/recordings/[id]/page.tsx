'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Sparkles,
  Share2,
  Bot,
  AlertTriangle,
  UserCheck,
  FileText,
  ListOrdered,
  Bookmark,
  BarChart3,
  Loader2,
  Search,
} from 'lucide-react';
import { Navbar } from '@/components/organisms/navbar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/atoms/tabs';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import { Input } from '@/components/atoms/input';
import { SummaryViewer, SummaryData } from '@/components/organisms/summary-viewer';
import { SummaryVersionTabs, SummaryVersionItem } from '@/components/molecules/summary-version-tabs';
import { RegenerateModal } from '@/components/organisms/regenerate-modal';
import { TranscriptSegment } from '@/components/molecules/transcript-segment';
import { SpeakerRenameDialog } from '@/components/molecules/speaker-rename-dialog';
import { CommentDrawer } from '@/components/organisms/comment-drawer';
import { ChapterList } from '@/components/organisms/chapters-list';
import { HighlightsGrid } from '@/components/organisms/highlights-grid';
import { AnalyticsCards } from '@/components/organisms/analytics-cards';
import { AudioPlayer } from '@/components/organisms/audio-player';
import { ChatPanel } from '@/components/organisms/chat-panel';
import { ShareDialog } from '@/components/molecules/share-dialog';
import { ExportMenu } from '@/components/molecules/export-menu';
import { formatTime, parseTimestamp } from '@/lib/time';
import { cn } from '@/lib/utils';
import { RecordingStatus } from '@/server/constants';
import { TemplateKey } from '@/server/constants/template.constant';
import { ExportFormat } from '@/server/constants/recording.constant';
import { toast } from 'sonner';
import { usePlayerStore } from '@/stores/player.store';
import { useChatStore } from '@/stores/chat.store';
import { useTokenStore } from '@/stores/token.store';
import { apiFetch } from '@/lib/api-client';
import { claimSingleRecording } from '@/lib/claim';
import { ApiResponse } from '@/server/dtos/response.dto';
import { RecordingDetailDto } from '@/server/schemas/recording.schema';
import type { SummaryVersionResponse } from '@/server/dtos/summary.dto';
import type { TranscriptSegmentDTO } from '@/server/dtos/recording.dto';
import type { CommentResponse, CreateCommentRequest } from '@/server/dtos/comment.dto';
import type { RecordingAnalyticsDTO } from '@/server/dtos/analytics.dto';
import type { MeetingSourceCitationDTO } from '@/server/dtos/workspace.dto';

export default function RecordingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const recordingId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string) || '';

  const [recording, setRecording] = useState<RecordingDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'chapters' | 'analytics'>('summary');

  // Search filter for transcript
  const [transcriptSearch, setTranscriptSearch] = useState<string>('');

  // Speaker rename modal state
  const [renameSpeakerId, setRenameSpeakerId] = useState<string | null>(null);
  const [speakerLabels, setSpeakerLabels] = useState<Record<string, string>>({});

  // Summary versions & regenerate modal
  const [summaryVersions, setSummaryVersions] = useState<SummaryVersionItem[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [isRegenerateOpen, setIsRegenerateOpen] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [activeSummaryData, setActiveSummaryData] = useState<SummaryData | null>(null);

  // Share Dialog State
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [isShared, setIsShared] = useState<boolean>(false);
  const [shareToken, setShareToken] = useState<string | null>(null);

  // Export Menu State
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // AI Chat Panel Collapse State
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  // Claim state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);

  // Comment Drawer State
  const [isCommentDrawerOpen, setIsCommentDrawerOpen] = useState<boolean>(false);
  const [selectedCommentSegment, setSelectedCommentSegment] = useState<TranscriptSegmentDTO | null>(null);
  const [comments, setComments] = useState<CommentResponse[]>([]);

  // Zustand Store Hooks
  const currentTime = usePlayerStore((state) => state.currentTime);
  const seek = usePlayerStore((state) => state.seek);
  const setAudioUrl = usePlayerStore((state) => state.setAudioUrl);
  const setRecordingIdChat = useChatStore((state) => state.setRecordingId);
  const addUserMessage = useChatStore((state) => state.addUserMessage);
  const startAssistantStream = useChatStore((state) => state.startAssistantStream);
  const appendStreamChunk = useChatStore((state) => state.appendStreamChunk);
  const finalizeAssistantMessage = useChatStore((state) => state.finalizeAssistantMessage);
  const setChatError = useChatStore((state) => state.setChatError);

  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  });

  useEffect(() => {
    if (!recording?.is_guest) return;
    apiFetch<ApiResponse<unknown>>('/api/auth/me')
      .then((res) => {
        if (res && (res.status === 'success' || (res.status as string) === 'SUCCESS')) {
          setIsLoggedIn(true);
        }
      })
      .catch(() => {
        setIsLoggedIn(false);
      });
  }, [recording?.is_guest]);

  const handleManualClaim = async () => {
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
  };

  /**
   * Fetch initial recording data.
   */
  useEffect(() => {
    if (!recordingId) return;

    let isMounted = true;
    apiFetch<ApiResponse<RecordingDetailDto>>(`/api/recordings/${recordingId}`)
      .then((res) => {
        if (!isMounted) return;
        if (!res.data) {
          throw new Error('Data rekaman tidak ditemukan.');
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

        // Initialize AI Chat context
        setRecordingIdChat(recordingId);

        // Initialize active summary & version list
        if (data.active_summary) {
          const initialVerId = data.active_summary.id || 'ver-1';
          setSelectedVersionId(initialVerId);
          setActiveSummaryData({
            id: initialVerId,
            version: data.active_summary.version || 1,
            template_category: data.active_summary.template_category || data.selected_template,
            structured_data: data.active_summary.structured_data || null,
            markdown_content: data.active_summary.markdown_content,
            is_active: true,
            created_at: data.active_summary.created_at || data.created_at,
          });

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
        const msg = err instanceof Error ? err.message : 'Gagal memuat detail rekaman.';
        setErrorMessage(msg);
      });

    return () => {
      isMounted = false;
    };
  }, [recordingId, setAudioUrl, setRecordingIdChat]);

  /**
   * Handle speaker rename save.
   */
  const handleSaveSpeakerLabel = async (speakerId: string, newLabel: string) => {
    const updated = { ...speakerLabels, [speakerId]: newLabel };
    setSpeakerLabels(updated);
    setRenameSpeakerId(null);

    try {
      await apiFetch(`/api/recordings/${recordingId}/speakers`, {
        method: 'PUT',
        body: JSON.stringify({ speakers: updated }),
      });
    } catch {
      // Graceful fallback
    }
  };

  /**
   * Handle summary version activation.
   */
  const handleSelectVersion = (versionId: string) => {
    setSelectedVersionId(versionId);
  };

  /**
   * Handle summary regeneration.
   */
  const handleRegenerate = async (payload: { templateCategory: TemplateKey; customAngle?: string }) => {
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
        const newVersionItem: SummaryVersionItem = {
          id: regenerated.id,
          version: regenerated.version,
          template_category: regenerated.template_category as TemplateKey,
          is_active: true,
          created_at: regenerated.created_at,
        };

        setSummaryVersions((prev) => [
          ...prev.map((v) => ({ ...v, is_active: false })),
          newVersionItem,
        ]);
        setSelectedVersionId(regenerated.id);

        setActiveSummaryData({
          id: regenerated.id,
          version: regenerated.version,
          template_category: regenerated.template_category as TemplateKey,
          custom_angle: regenerated.custom_angle,
          structured_data: regenerated.structured_data,
          markdown_content: regenerated.markdown_content,
          is_active: true,
          created_at: regenerated.created_at,
        });

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
  };

  /**
   * Handle sending message in AI Chat panel with real-time SSE streaming.
   */
  const handleSendMessage = async (text: string) => {
    if (!recordingId) return;

    const assistantMsgId = startAssistantStream();
    let fullContent = '';
    let rawCitations: string[] = [];

    try {
      const ownershipToken = useTokenStore.getState().getGuestToken(recordingId);
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
                if (eventType === 'token' && data.token) {
                  fullContent += data.token;
                  appendStreamChunk(data.token);
                } else if (eventType === 'done') {
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
        recording_title: recording?.title || '',
        chunk_index: idx,
        snippet: c,
        start_time: parseTimestamp(c),
        end_time: parseTimestamp(c),
      }));

      finalizeAssistantMessage(assistantMsgId, fullContent, mappedCitations);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Terjadi kesalahan koneksi AI';
      setChatError(errMsg);
      finalizeAssistantMessage(assistantMsgId, fullContent || `Maaf, terjadi kesalahan: ${errMsg}`);
    }
  };

  /**
   * Handle share toggle.
   */
  const handleToggleShare = async (enable: boolean) => {
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
      }
    } catch (err) {
      console.error('Failed to toggle share:', err);
    }
  };

  /**
   * Handle file export.
   */
  const handleExport = async (format: ExportFormat) => {
    if (!recording) return;

    try {
      let ownershipToken = '';
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('youten_guest_tokens');
          if (raw) {
            const parsed = JSON.parse(raw);
            const tokens = parsed?.state?.guestTokens || [];
            const item = tokens.find((t: { id: string }) => t.id === recordingId);
            if (item?.ownership_token) {
              ownershipToken = item.ownership_token;
            }
          }
        } catch {
          // Ignore storage parse errors
        }
      }

      const params = new URLSearchParams({ format });
      if (ownershipToken) {
        params.set('token', ownershipToken);
      }

      const headers: Record<string, string> = {};
      if (ownershipToken) {
        headers['x-ownership-token'] = ownershipToken;
      }

      const res = await fetch(`/api/recordings/${recordingId}/export?${params.toString()}`, {
        method: 'GET',
        headers,
      });

      if (!res.ok) {
        throw new Error(`Export request failed with status ${res.status}`);
      }

      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition');
      let filename = `${recording.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${format === ExportFormat.MARKDOWN ? 'md' : format}`;
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, '');
        }
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      console.warn('Backend export failed, falling back to local exporter:', err);
      // Fallback for offline mode
      const ext = format === ExportFormat.MARKDOWN ? 'md' : format;
      const filename = `${recording.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;
      let content = '';

      if (format === ExportFormat.TXT) {
        content = `# ${recording.title}\n\n${recording.active_summary?.markdown_content || ''}\n\n## Transkrip\n` +
          (recording.segments || []).map((s) => `[${formatTime(s.start_time)}] ${speakerLabels[s.speaker_label] || s.speaker_name || s.speaker_label}: ${s.text}`).join('\n');
      } else if (format === ExportFormat.JSON) {
        content = JSON.stringify(recording, null, 2);
      } else {
        content = recording.active_summary?.markdown_content || recording.title;
      }

      const mimeType = format === ExportFormat.JSON ? 'application/json' : 'text/plain;charset=utf-8';
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  /**
   * Handle comment addition.
   */
  const handleCreateComment = (payload: CreateCommentRequest) => {
    const newComment: CommentResponse = {
      id: `comment-${Date.now()}`,
      recording_id: recordingId,
      user_id: 'current-user',
      author_name: payload.author_name || 'Anda',
      comment_text: payload.comment_text,
      timestamp_sec: payload.timestamp_sec,
      segment_id: payload.segment_id,
      selected_text: payload.selected_text,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setComments((prev) => [newComment, ...prev]);
  };

  /**
   * Handle updating a single transcript segment's text inline.
   */
  const handleSaveSegmentText = async (segmentId: string, newText: string) => {
    if (!recordingId) return;

    let ownershipToken: string | undefined;
    try {
      const raw = localStorage.getItem('youten_guest_tokens');
      if (raw) {
        const parsed = JSON.parse(raw);
        const tokens = parsed?.state?.guestTokens || [];
        const item = tokens.find((t: { id: string }) => t.id === recordingId);
        if (item?.ownership_token) {
          ownershipToken = item.ownership_token;
        }
      }
    } catch {
      // Ignore storage parse errors
    }

    try {
      const res = await fetch(`/api/recordings/${recordingId}/segments/${segmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(ownershipToken ? { 'x-ownership-token': ownershipToken } : {}),
        },
        body: JSON.stringify({
          text: newText,
          ownership_token: ownershipToken,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Gagal menyimpan perubahan teks');
      }

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
  };

  // Filtered transcript segments
  const segments = recording?.segments;
  const filteredSegments = useMemo(() => {
    if (!segments) return [];
    if (!transcriptSearch.trim()) return segments;

    const query = transcriptSearch.toLowerCase();
    return segments.filter(
      (s) =>
        s.text.toLowerCase().includes(query) ||
        (speakerLabels[s.speaker_label] || s.speaker_name || s.speaker_label || '').toLowerCase().includes(query)
    );
  }, [segments, transcriptSearch, speakerLabels]);

  if (isLoading) {
    return (
      <div
        data-testid="recording-detail-loading"
        className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-foreground"
      >
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Memuat rekaman notula...</p>
        </div>
      </div>
    );
  }

  if (errorMessage || !recording) {
    return (
      <div
        data-testid="recording-detail-error"
        className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-foreground"
      >
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Rekaman Tidak Ditemukan</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {errorMessage || 'Berkas rekaman yang Anda tuju tidak tersedia atau telah dihapus.'}
          </p>
          <Button asChild className="mt-6">
            <Link href="/">Kembali ke Beranda</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="recording-detail-container"
      className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-foreground selection:bg-primary/20 selection:text-primary pb-28"
    >
      {/* Top Navbar */}
      <Navbar />

      {/* Main Page Header */}
      <header className="border-b border-border/80 bg-background/80 backdrop-blur-md sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left Title, Date, Badges & Breadcrumb */}
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link
                href="/"
                data-testid="back-to-home-link"
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Beranda</span>
              </Link>
              <span>•</span>
              <span className="font-mono text-[11px] truncate max-w-[140px]">
                ID: {recording.id}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <h1
                data-testid="recording-title"
                className="text-lg sm:text-xl md:text-2xl font-bold text-foreground tracking-tight truncate max-w-xl"
              >
                {recording.title}
              </h1>

              <Badge variant="outline" className="text-xs font-medium uppercase tracking-wider">
                {recording.selected_template}
              </Badge>

              <Badge variant="secondary" className="text-xs font-mono flex items-center gap-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span>{formatTime(recording.duration_seconds)}</span>
              </Badge>

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {new Date(recording.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Toolbar */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            {/* Share Button */}
            <Button
              variant="outline"
              size="sm"
              data-testid="open-share-dialog-btn"
              onClick={() => setIsShareOpen(true)}
              className="gap-1.5 text-xs font-medium"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Bagikan</span>
            </Button>

            {/* Export Menu */}
            <ExportMenu
              recordingId={recording.id}
              onExport={handleExport}
              open={isExportOpen}
              onOpenChange={setIsExportOpen}
            />

            {/* AI Assistant Chat Panel Toggle */}
            <Button
              variant={isChatOpen ? 'default' : 'secondary'}
              size="sm"
              data-testid="toggle-chat-panel-btn"
              onClick={() => setIsChatOpen((prev) => !prev)}
              className="gap-1.5 text-xs font-medium"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Tanya AI</span>
              <Sparkles className="w-3 h-3 text-primary-foreground/80" />
            </Button>
          </div>
        </div>
      </header>

      {/* Guest Session Warning Banner */}
      {recording.is_guest && (
        <div
          data-testid="guest-warning-banner"
          className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-xs text-amber-800 dark:text-amber-300"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong>Rekaman Sementara:</strong> Rekaman ini disimpan lokal di browser. Buat akun atau masuk untuk menyimpan rekaman secara permanen.
              </span>
            </div>
            {isLoggedIn ? (
              <Button
                size="sm"
                variant="outline"
                disabled={isClaiming}
                onClick={handleManualClaim}
                data-testid="claim-account-btn"
                className="text-xs h-7 px-3 shrink-0 border-amber-500/30 hover:bg-amber-500/15"
              >
                {isClaiming ? 'Mengklaim...' : 'Klaim ke Akun'}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                asChild
                data-testid="claim-account-btn"
                className="text-xs h-7 px-3 shrink-0 border-amber-500/30 hover:bg-amber-500/15"
              >
                <Link href={`/login?claim=${recording.id}`}>Klaim ke Akun</Link>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Main Review Canvas + Right Collapsible AI Chat Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left Main Review Canvas */}
          <div className={cn('flex-1 w-full min-w-0 space-y-6', isChatOpen && 'lg:max-w-[calc(100%-400px)]')}>
            {/* 4-Tab Navigation */}
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as typeof activeTab)}
              className="w-full"
            >
              <TabsList className="grid grid-cols-4 w-full max-w-lg mb-6">
                <TabsTrigger
                  value="summary"
                  data-testid="tab-trigger-summary"
                  onClick={() => setActiveTab('summary')}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Ringkasan</span>
                </TabsTrigger>

                <TabsTrigger
                  value="transcript"
                  data-testid="tab-trigger-transcript"
                  onClick={() => setActiveTab('transcript')}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Transkrip</span>
                </TabsTrigger>

                <TabsTrigger
                  value="chapters"
                  data-testid="tab-trigger-chapters"
                  onClick={() => setActiveTab('chapters')}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span>Bab &amp; Sorotan</span>
                </TabsTrigger>

                <TabsTrigger
                  value="analytics"
                  data-testid="tab-trigger-analytics"
                  onClick={() => setActiveTab('analytics')}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Analitik</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Summary Canvas */}
              <TabsContent value="summary" data-testid="summary-tab-content" className="space-y-6 mt-0">
                {/* Version switcher */}
                {summaryVersions.length > 0 && (
                  <SummaryVersionTabs
                    versions={summaryVersions}
                    selectedVersionId={selectedVersionId}
                    onSelectVersion={handleSelectVersion}
                    onOpenRegenerate={() => setIsRegenerateOpen(true)}
                  />
                )}

                {/* Polymorphic Summary Viewer */}
                <div data-testid="summary-viewer-wrapper">
                  <SummaryViewer summary={activeSummaryData} />
                </div>
              </TabsContent>

              {/* Tab 2: Transcript Canvas */}
              <TabsContent value="transcript" data-testid="transcript-tab-content" className="space-y-4 mt-0">
                {/* Search transcript input */}
                <div className="relative max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari teks dalam transkrip..."
                    value={transcriptSearch}
                    onChange={(e) => setTranscriptSearch(e.target.value)}
                    data-testid="transcript-search-input"
                    className="pl-9 text-xs"
                  />
                </div>

                {/* Transcript Segments List */}
                <div data-testid="transcript-segments-list" className="space-y-4">
                  {filteredSegments.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-xl bg-card/40 text-muted-foreground text-xs">
                      Tidak ada percakapan yang cocok dengan pencarian.
                    </div>
                  ) : (
                    filteredSegments.map((segment) => {
                      const isActive =
                        currentTime >= segment.start_time && currentTime <= segment.end_time;
                      const speakerLabel = speakerLabels[segment.speaker_label] || segment.speaker_name || segment.speaker_label;

                      return (
                        <TranscriptSegment
                          key={segment.id}
                          segment={segment}
                          speakerName={speakerLabel}
                          currentTime={currentTime}
                          isActive={isActive}
                          onSeek={(time) => seek(time)}
                          onRenameSpeaker={(speakerLabel) => setRenameSpeakerId(speakerLabel)}
                          onAddComment={(seg) => {
                            setSelectedCommentSegment(seg);
                            setIsCommentDrawerOpen(true);
                          }}
                          onAskAI={(seg) => {
                            setIsChatOpen(true);
                            const prompt = `Jelaskan pernyataan berikut: "${seg.text}"`;
                            addUserMessage(prompt);
                            void handleSendMessage(prompt);
                          }}
                          onSaveText={handleSaveSegmentText}
                        />
                      );
                    })
                  )}
                </div>
              </TabsContent>

              {/* Tab 3: Chapters & Highlights Canvas */}
              <TabsContent value="chapters" data-testid="chapters-tab-content" className="space-y-8 mt-0">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ListOrdered className="w-4 h-4 text-primary" />
                    <h3 className="text-base font-bold text-foreground">Garis Waktu Bab (Chapters)</h3>
                  </div>
                  <ChapterList
                    chapters={recording.chapters || []}
                    currentTime={currentTime}
                    onSeek={(time) => seek(time)}
                  />
                </div>

                <div className="space-y-3 pt-4 border-t border-border/60">
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-amber-500" />
                    <h3 className="text-base font-bold text-foreground">Sorotan Kunci Percakapan</h3>
                  </div>
                  <HighlightsGrid
                    highlights={recording.highlights || []}
                    currentTime={currentTime}
                    onSeek={(time) => seek(time)}
                  />
                </div>
              </TabsContent>

              {/* Tab 4: Analytics Canvas */}
              <TabsContent value="analytics" data-testid="analytics-tab-content" className="space-y-6 mt-0">
                <AnalyticsCards
                  analytics={recording.analytics_data as unknown as RecordingAnalyticsDTO}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Collapsible AI Chat Panel */}
          {isChatOpen && (
            <aside
              data-testid="recording-chat-panel"
              className="w-full lg:w-[380px] shrink-0 border border-border/80 rounded-2xl bg-card shadow-lg sticky top-28 max-h-[calc(100vh-140px)] flex flex-col overflow-hidden animate-in slide-in-from-right duration-300"
            >
              <ChatPanel
                recordingId={recording.id}
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                onSendMessage={handleSendMessage}
                onSeekAudio={(timestamp) => seek(timestamp)}
              />
            </aside>
          )}
        </div>
      </main>

      {/* Sticky Bottom Audio Player Bar */}
      <div data-testid="sticky-audio-player-container">
        <AudioPlayer
          src={recording.audio_url || recording.playback_url || undefined}
          title={recording.title}
          sticky={true}
        />
      </div>

      {/* Speaker Rename Dialog */}
      {renameSpeakerId && (
        <SpeakerRenameDialog
          isOpen={!!renameSpeakerId}
          onClose={() => setRenameSpeakerId(null)}
          speakerId={renameSpeakerId}
          currentLabel={speakerLabels[renameSpeakerId] || renameSpeakerId}
          onSave={handleSaveSpeakerLabel}
        />
      )}

      {/* Regenerate Summary Modal */}
      <RegenerateModal
        open={isRegenerateOpen}
        onOpenChange={setIsRegenerateOpen}
        onSubmit={async (values) => {
          await handleRegenerate({
            templateCategory: values.template_category,
            customAngle: values.custom_angle,
          });
        }}
        defaultTemplate={recording.selected_template as TemplateKey}
        currentVersionsCount={summaryVersions.length}
        isLoading={isRegenerating}
      />

      {/* Share Dialog */}
      <ShareDialog
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        isShared={isShared}
        shareToken={shareToken}
        onToggleShare={handleToggleShare}
      />

      {/* Comment Drawer */}
      <CommentDrawer
        isOpen={isCommentDrawerOpen}
        onClose={() => setIsCommentDrawerOpen(false)}
        comments={comments}
        currentTimestampSec={selectedCommentSegment?.start_time || currentTime}
        onCreateComment={handleCreateComment}
        onSeek={(time) => seek(time)}
      />
    </div>
  );
}
