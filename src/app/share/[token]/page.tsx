'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Sparkles,
  FileText,
  ListOrdered,
  Bookmark,
  Loader2,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/atoms/tabs';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import { Input } from '@/components/atoms/input';
import { SummaryViewer, SummaryData } from '@/components/organisms/summary-viewer';
import { TranscriptSegment } from '@/components/molecules/transcript-segment';
import { ChapterList } from '@/components/organisms/chapters-list';
import { HighlightsGrid } from '@/components/organisms/highlights-grid';
import { AudioPlayer } from '@/components/organisms/audio-player';
import { formatTime } from '@/lib/time';
import { usePlayerStore } from '@/stores/player.store';
import { apiFetch } from '@/lib/api-client';
import { ApiResponse } from '@/server/dtos/response.dto';
import type { SharedRecordingResponse } from '@/server/dtos/recording.dto';

/**
 * Public Read-Only Share Viewer Page.
 * Displays shared recording summaries, transcript, chapters, and highlights without dashboard chrome.
 * Mutation actions (AI chat, speaker rename, summary regeneration, commenting) are explicitly disabled.
 */
export default function SharedRecordingPage() {
  const params = useParams();
  const token = typeof params?.token === 'string' ? params.token : '';

  const [recording, setRecording] = useState<SharedRecordingResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Main Tab: summary, transcript, chapters
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'chapters'>('summary');

  // Search filter for transcript
  const [transcriptSearch, setTranscriptSearch] = useState<string>('');

  // Zustand Store Hooks
  const currentTime = usePlayerStore((state) => state.currentTime);
  const seek = usePlayerStore((state) => state.seek);
  const setAudioUrl = usePlayerStore((state) => state.setAudioUrl);

  /**
   * Fetch shared recording details by public token.
   */
  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    apiFetch<ApiResponse<SharedRecordingResponse>>(`/api/recordings/shared/${token}`)
      .then((res) => {
        if (!isMounted) return;
        if (!res.data) {
          throw new Error('Tautan berbagi tidak ditemukan atau telah dinonaktifkan.');
        }

        const data = res.data;
        setRecording(data);

        // Initialize audio player URL
        if (data.audio_url || data.playback_url) {
          setAudioUrl(data.audio_url || data.playback_url || null);
        }

        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setIsLoading(false);
        const msg =
          err instanceof Error
            ? err.message
            : 'Gagal memuat rekaman berbagi. Tautan mungkin telah kedaluwarsa atau dinonaktifkan.';
        setErrorMessage(msg);
      });

    return () => {
      isMounted = false;
    };
  }, [token, setAudioUrl]);

  // Formatted active summary data
  const summaryData: SummaryData | null = useMemo(() => {
    if (!recording?.active_summary) return null;
    return {
      id: recording.active_summary.id,
      version: recording.active_summary.version,
      template_category: recording.active_summary.template_category || recording.selected_template,
      custom_angle: recording.active_summary.custom_angle,
      structured_data: recording.active_summary.structured_data || null,
      markdown_content: recording.active_summary.markdown_content,
      is_active: true,
      created_at: recording.active_summary.created_at || recording.created_at,
    };
  }, [recording]);

  // Filtered transcript segments based on search
  const segments = recording?.segments;
  const filteredSegments = useMemo(() => {
    if (!segments) return [];
    if (!transcriptSearch.trim()) return segments;

    const query = transcriptSearch.toLowerCase();
    return segments.filter(
      (s) =>
        s.text.toLowerCase().includes(query) ||
        (s.speaker_name || s.speaker_label || '').toLowerCase().includes(query)
    );
  }, [segments, transcriptSearch]);

  if (isLoading) {
    return (
      <div
        data-testid="shared-recording-loading"
        className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-foreground"
      >
        {/* Distraction-free Top Banner */}
        <header className="border-b border-border/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-xs">
              Y
            </div>
            <span className="font-bold text-sm tracking-tight text-foreground">Youten AI</span>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Memuat rekaman bersama...</p>
        </div>
      </div>
    );
  }

  if (errorMessage || !recording) {
    return (
      <div
        data-testid="shared-recording-error"
        className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-foreground"
      >
        {/* Distraction-free Top Banner */}
        <header className="border-b border-border/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-xs group-hover:bg-primary-hover transition-colors">
              Y
            </div>
            <span className="font-bold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">
              Youten AI
            </span>
          </Link>
          <Button asChild size="sm" variant="default" className="text-xs">
            <Link href="/">
              Coba Gratis Sekarang
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto text-center px-4">
          <div className="w-14 h-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold tracking-tight mb-2">Tautan Tidak Tersedia</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {errorMessage || 'Rekaman ini tidak ditemukan atau tautan berbagi publik telah dinonaktifkan oleh pemiliknya.'}
          </p>
          <Button asChild variant="outline">
            <Link href="/" data-testid="back-to-home-btn">
              Kembali ke Beranda
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="shared-recording-container"
      className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-foreground selection:bg-primary/20 selection:text-primary pb-28"
    >
      {/* 1. Distraction-Free Powered-by Header Banner */}
      <header className="border-b border-border/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Left: Branding & Read-Only Badge */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-xs group-hover:bg-primary-hover transition-colors">
                Y
              </div>
              <span className="font-bold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">
                Youten AI
              </span>
            </Link>

            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-secondary-foreground border border-border/80">
              <ShieldCheck className="w-3 h-3 text-primary" />
              Tautan Berbagi Publik (Hanya Lihat)
            </span>
          </div>

          {/* Right: Promotional CTA */}
          <div className="flex items-center gap-2.5">
            <span className="hidden md:inline-block text-xs text-muted-foreground">
              Dibuat dengan Youten AI
            </span>
            <Button asChild size="sm" className="text-xs font-semibold shadow-xs">
              <Link href="/" data-testid="try-free-cta-btn">
                Coba Gratis Sekarang
                <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Recording Metadata Bar */}
      <section className="border-b border-border/60 bg-background/60 backdrop-blur-xs py-5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <h1
                data-testid="shared-recording-title"
                className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate"
              >
                {recording.title}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span
                  data-testid="shared-duration-badge"
                  className="inline-flex items-center gap-1 font-mono font-medium bg-secondary/80 px-2 py-0.5 rounded-md text-foreground"
                >
                  <Clock className="w-3 h-3 text-primary" />
                  {formatTime(recording.duration_seconds)}
                </span>

                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {new Date(recording.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>

                <Badge variant="outline" className="text-[11px] font-medium capitalize">
                  <Sparkles className="w-3 h-3 mr-1 text-primary" />
                  Format: {recording.selected_template}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Read-Only Content Canvas */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as 'summary' | 'transcript' | 'chapters')}
          className="space-y-6"
        >
          {/* Tab Selection Header */}
          <div className="border-b border-border/80 pb-px">
            <TabsList className="bg-muted/70 p-1 rounded-xl">
              <TabsTrigger
                value="summary"
                data-testid="tab-trigger-summary"
                onClick={() => setActiveTab('summary')}
                className="flex items-center gap-2 text-xs font-semibold px-4 py-2"
              >
                <FileText className="w-3.5 h-3.5" />
                Ringkasan Notula
              </TabsTrigger>

              <TabsTrigger
                value="transcript"
                data-testid="tab-trigger-transcript"
                onClick={() => setActiveTab('transcript')}
                className="flex items-center gap-2 text-xs font-semibold px-4 py-2"
              >
                <ListOrdered className="w-3.5 h-3.5" />
                Transkrip ({recording.segments?.length || 0})
              </TabsTrigger>

              <TabsTrigger
                value="chapters"
                data-testid="tab-trigger-chapters"
                onClick={() => setActiveTab('chapters')}
                className="flex items-center gap-2 text-xs font-semibold px-4 py-2"
              >
                <Bookmark className="w-3.5 h-3.5" />
                Bab &amp; Sorotan ({recording.chapters?.length || 0})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: SUMMARY */}
          <TabsContent value="summary" data-testid="summary-tab-content" className="outline-none">
            {summaryData ? (
              <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs">
                <SummaryViewer summary={summaryData} />
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed rounded-xl bg-card/40 text-muted-foreground text-sm">
                Belum ada ringkasan notula yang tersedia untuk rekaman ini.
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
                placeholder="Cari kata atau pembicara..."
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
                  Tidak ada dialog percakapan yang cocok dengan pencarian.
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
                      // Notice: onRenameSpeaker, onAddComment, onAskAI are NOT passed here (strictly read-only)
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
                Daftar Bab & Topik
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
                  Sorotan Utama & Kutipan Kunci
                </h3>
                <HighlightsGrid
                  highlights={recording.highlights}
                  currentTime={currentTime}
                  onSeek={(time) => seek(time)}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* 4. Sticky Bottom Audio Player */}
      <AudioPlayer
        src={recording.audio_url || recording.playback_url || undefined}
        title={recording.title}
      />
    </div>
  );
}
