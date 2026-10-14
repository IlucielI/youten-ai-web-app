'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  Bookmark,
  Loader2,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { Tabs, TabsContent } from '@/components/atoms/tabs';
import { Button } from '@/components/atoms/button';
import { YoutenLogo } from '@/components/atoms/youten-logo';
import { Input } from '@/components/atoms/input';
import { RecordingHeader } from '@/components/organisms/recording-header';
import { RecordingTabs, RecordingTabKey } from '@/components/molecules/recording-tabs';
import { AnalyticsCards } from '@/components/organisms/analytics-cards';
import { SummaryViewer, SummaryData } from '@/components/organisms/summary-viewer';
import { TranscriptSegment } from '@/components/molecules/transcript-segment';
import { ChapterList } from '@/components/organisms/chapters-list';
import { HighlightsGrid } from '@/components/organisms/highlights-grid';
import { AudioPlayer } from '@/components/organisms/audio-player';
import { Footer } from '@/components/organisms/footer';
import { ThemeToggle } from '@/components/molecules/theme-toggle';
import { ChatPanel } from '@/components/organisms/chat-panel';
import { usePlayerStore } from '@/stores/player.store';
import { useChatStore } from '@/stores/chat.store';
import { apiFetch } from '@/lib/api-client';
import { ApiResponse } from '@/server/dtos/response.dto';
import type { SharedRecordingResponse } from '@/server/dtos/recording.dto';
import type { RecordingAnalyticsDTO } from '@/server/dtos/analytics.dto';
import type { MeetingSourceCitationDTO } from '@/server/dtos/workspace.dto';
import type { ChatMessageResponseDto } from '@/server/schemas/chat.schema';
import { ChatRole } from '@/server/constants';
import { ExportFormat } from '@/server/constants/recording.constant';
import { parseTimestamp } from '@/lib/time';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/locales';

/**
 * Public Read-Only Share Viewer Page.
 * Displays shared recording summaries, transcript, chapters, and highlights without dashboard chrome.
 * Mutation actions (AI chat, speaker rename, summary regeneration, commenting) are explicitly disabled.
 */
export default function SharedRecordingPage() {
  const params = useParams();
  const token = typeof params?.token === 'string' ? params.token : '';
  const { t } = useTranslation();

  const [recording, setRecording] = useState<SharedRecordingResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Main Tab: summary, transcript, chapters, analytics
  const [activeTab, setActiveTab] = useState<RecordingTabKey>('summary');
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  // Search filter for transcript
  const [transcriptSearch, setTranscriptSearch] = useState<string>('');

  // Zustand Store Hooks
  const currentTime = usePlayerStore((state) => state.currentTime);
  const seek = usePlayerStore((state) => state.seek);
  const setAudioUrl = usePlayerStore((state) => state.setAudioUrl);

  const setRecordingIdChat = useChatStore((state) => state.setRecordingId);
  const sessionId = useChatStore((state) => state.sessionId);
  const setSessionId = useChatStore((state) => state.setSessionId);
  const setMessages = useChatStore((state) => state.setMessages);
  const addUserMessage = useChatStore((state) => state.addUserMessage);
  const startAssistantStream = useChatStore((state) => state.startAssistantStream);
  const appendStreamChunk = useChatStore((state) => state.appendStreamChunk);
  const finalizeAssistantMessage = useChatStore((state) => state.finalizeAssistantMessage);
  const setChatError = useChatStore((state) => state.setChatError);

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
          // Set audio stream url in global player store
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
        const msg =
          err instanceof Error
            ? err.message
            : t('share.unavailableDesc');
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
      apiFetch<ApiResponse<ChatMessageResponseDto[]>>(
        `/api/recordings/${recording.id}/chat?session_id=${savedSessionId}&share_token=${token}`
      )
        .then((res) => {
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

  const handleExport = async (format: ExportFormat) => {
    if (!recording) return;

    try {
      const params = new URLSearchParams({ format });
      const res = await fetch(`/api/recordings/${recording.id}/export?${params.toString()}`, {
        method: 'GET',
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
    } catch (err) {
      console.error('Failed to export shared recording:', err);
    }
  };

  /**
   * Handle sending message in AI Chat panel with real-time SSE streaming for share viewers.
   */
  const handleSendMessage = async (text: string) => {
    if (!recording) return;

    const assistantMsgId = startAssistantStream();
    let fullContent = '';
    let rawCitations: string[] = [];

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-share-token': token,
      };

      const res = await fetch(`/api/recordings/${recording.id}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: text,
          share_token: token,
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
                    localStorage.setItem(`youten_share_chat_session_${token}`, data.session_id);
                  }
                } else if (eventType === 'token' && data.token) {
                  fullContent += data.token;
                  appendStreamChunk(data.token);
                } else if (eventType === 'done') {
                  if (data.session_id) {
                    setSessionId(data.session_id);
                    if (typeof window !== 'undefined') {
                      localStorage.setItem(`youten_share_chat_session_${token}`, data.session_id);
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
        recording_id: recording.id,
        recording_title: recording.title || '',
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

  if (isLoading) {
    return (
      <div
        data-testid="shared-recording-loading"
        className="min-h-screen flex flex-col bg-background text-foreground"
      >
        {/* Distraction-free Top Banner */}
        <header className="border-b border-border/60 bg-background/90 backdrop-blur-md px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <YoutenLogo size="sm" />
            <span className="font-bold text-sm tracking-tight text-foreground">Youten AI</span>
          </div>
          <ThemeToggle />
        </header>

        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">{t('share.loading')}</p>
        </div>
      </div>
    );
  }

  if (errorMessage || !recording) {
    return (
      <div
        data-testid="shared-recording-error"
        className="min-h-screen flex flex-col bg-background text-foreground"
      >
        {/* Distraction-free Top Banner */}
        <header className="border-b border-border/60 bg-background/90 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <YoutenLogo size="sm" className="group-hover:scale-105 transition-transform" />
            <span className="font-bold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">
              Youten AI
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild size="sm" variant="default" className="text-xs">
              <Link href="/">
                {t('share.tryFree')}
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto text-center px-4">
          <div className="w-14 h-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold tracking-tight mb-2">{t('share.unavailableTitle')}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {errorMessage || t('share.unavailableDesc')}
          </p>
          <Button asChild variant="outline">
            <Link href="/" data-testid="back-to-home-btn">
              {t('share.backToHome')}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="shared-recording-container"
      className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary"
    >
      {/* 1. Distraction-Free Powered-by Header Banner */}
      <header className="border-b border-border/60 bg-background/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Left: Branding & Read-Only Badge */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <YoutenLogo size="sm" className="group-hover:scale-105 transition-transform" />
              <span className="font-bold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">
                Youten AI
              </span>
            </Link>

            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-secondary-foreground border border-border/80">
              <ShieldCheck className="w-3 h-3 text-primary" />
              {t('share.publicBadge')}
            </span>
          </div>

          {/* Right: Promotional CTA & ThemeToggle */}
          <div className="flex items-center gap-2.5">
            <span className="hidden md:inline-block text-xs text-muted-foreground">
              {t('share.poweredBy')}
            </span>
            <ThemeToggle />
            <Button asChild size="sm" className="text-xs font-semibold shadow-xs">
              <Link href="/" data-testid="try-free-cta-btn">
                {t('share.tryFree')}
                <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Recording Page Header (Shared component with /recordings/[id]) */}
      <RecordingHeader
        id={recording.id}
        title={recording.title}
        selectedTemplate={recording.selected_template}
        durationSeconds={recording.duration_seconds}
        createdAt={recording.created_at}
        backHref="/"
        showShare={false}
        showAskAi={true}
        isChatOpen={isChatOpen}
        onToggleChat={() => setIsChatOpen((prev) => !prev)}
        showExport={true}
        onExport={handleExport}
        isExportOpen={isExportOpen}
        onExportOpenChange={setIsExportOpen}
        exportVersion={recording.active_summary?.version}
        className="sticky top-14 z-20"
      />

      {/* 3. Main Read-Only Content Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left Review Canvas */}
          <div className={cn('flex-1 w-full min-w-0 space-y-6', isChatOpen && 'lg:max-w-[calc(100%-400px)]')}>
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as RecordingTabKey)}
              className="space-y-6"
            >
              {/* Reusable Tab Navigation Component */}
              <RecordingTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                segmentsCount={recording.segments?.length}
                chaptersCount={recording.chapters?.length}
                className="mb-6"
              />

              {/* TAB 1: SUMMARY */}
              <TabsContent value="summary" data-testid="summary-tab-content" className="outline-none">
                {summaryData ? (
                  <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs">
                    <SummaryViewer summary={summaryData} />
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed rounded-xl bg-card/40 text-muted-foreground text-sm">
                    {t('share.emptySummary')}
                  </div>
                )}
              </TabsContent>

              {/* TAB 2: TRANSCRIPT */}
              <TabsContent value="transcript" data-testid="transcript-tab-content" className="outline-none space-y-4">
                {/* Search Filter Bar */}
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={t('recording.transcript.searchPlaceholder')}
                    value={transcriptSearch}
                    onChange={(e) => setTranscriptSearch(e.target.value)}
                    data-testid="shared-transcript-search"
                    className="pl-9 text-xs"
                  />
                </div>

                {/* Transcript Segments List */}
                <div data-testid="shared-transcript-list" className="space-y-3.5">
                  {filteredSegments.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-xl bg-card/40 text-muted-foreground text-xs">
                      {t('recording.transcript.emptySearch')}
                    </div>
                  ) : (
                    filteredSegments.map((segment) => {
                      const isActive =
                        currentTime >= segment.start_time && currentTime <= segment.end_time;

                      return (
                        <TranscriptSegment
                          key={segment.id}
                          segment={segment}
                          speakerName={segment.speaker_name || segment.speaker_label}
                          currentTime={currentTime}
                          isActive={isActive}
                          onSeek={(time) => seek(time)}
                          onAskAI={(seg) => {
                            setIsChatOpen(true);
                            const prompt = t('recording.transcript.askAiPrompt', { text: seg.text });
                            addUserMessage(prompt);
                            void handleSendMessage(prompt);
                          }}
                        />
                      );
                    })
                  )}
                </div>
              </TabsContent>

              {/* TAB 3: CHAPTERS & HIGHLIGHTS */}
              <TabsContent value="chapters" data-testid="chapters-tab-content" className="outline-none space-y-8">
                {/* Chapters Section */}
                <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs">
                  <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-primary" />
                    {t('recording.chapters.sectionTitle')}
                  </h3>
                  <ChapterList
                    chapters={recording.chapters || []}
                    currentTime={currentTime}
                    onSeek={(time) => seek(time)}
                  />
                </div>

                {/* Highlights Grid Section */}
                {recording.highlights && recording.highlights.length > 0 && (
                  <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs">
                    <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      {t('recording.highlights.sectionTitle')}
                    </h3>
                    <HighlightsGrid
                      highlights={recording.highlights}
                      currentTime={currentTime}
                      onSeek={(time) => seek(time)}
                    />
                  </div>
                )}
              </TabsContent>

              {/* TAB 4: ANALYTICS */}
              <TabsContent value="analytics" data-testid="analytics-tab-content" className="outline-none">
                <AnalyticsCards
                  analytics={recording.analytics_data as unknown as RecordingAnalyticsDTO}
                  speakerLabels={speakerLabels}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Collapsible AI Chat Panel */}
          {isChatOpen && (
            <div
              data-testid="shared-chat-panel"
              className="w-full lg:w-[380px] shrink-0 sticky top-[140px] max-h-[calc(100vh-160px)] flex flex-col animate-in slide-in-from-right duration-300 z-20"
            >
              <ChatPanel
                recordingId={recording.id}
                template={recording.selected_template}
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                onSendMessage={handleSendMessage}
                onSeekAudio={(timestamp) => seek(timestamp)}
                className="h-full max-w-none shadow-lg"
              />
            </div>
          )}
        </div>
      </main>

      {/* 4. Bottom Audio Player */}
      <div className="w-full max-w-4xl mx-auto px-4 my-6">
        <AudioPlayer
          src={recording.audio_url || recording.playback_url || undefined}
          title={recording.title}
          sticky={false}
        />
      </div>

      {/* Global Application Footer */}
      <Footer />
    </div>
  );
}
