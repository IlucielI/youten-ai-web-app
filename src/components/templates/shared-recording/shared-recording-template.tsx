'use client';

import React from 'react';
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
import { SummaryViewer } from '@/components/organisms/summary-viewer';
import { TranscriptSegment } from '@/components/molecules/transcript-segment';
import { ChapterList } from '@/components/organisms/chapters-list';
import { HighlightsGrid } from '@/components/organisms/highlights-grid';
import { AudioPlayer } from '@/components/organisms/audio-player';
import { Footer } from '@/components/organisms/footer';
import { ThemeToggle } from '@/components/molecules/theme-toggle';
import { LanguageSwitcher } from '@/components/molecules/language-switcher';
import { UserNavDropdown } from '@/components/molecules/user-nav-dropdown';
import { ChatPanel } from '@/components/organisms/chat-panel';
import { useSharedRecording } from '@/hooks/use-shared-recording';
import type { RecordingAnalyticsDTO } from '@/server/dtos/analytics.dto';
import { cn } from '@/lib/utils';

export interface SharedRecordingTemplateProps {
  token: string;
}

export const SharedRecordingTemplate: React.FC<SharedRecordingTemplateProps> = ({ token }) => {
  const {
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
  } = useSharedRecording({ token });

  if (isLoading) {
    return (
      <div
        data-testid="shared-recording-loading"
        className="min-h-screen flex flex-col bg-background text-foreground"
      >
        <header className="border-b border-border/60 bg-background/90 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <YoutenLogo size="sm" />
              <span className="font-bold text-sm tracking-tight text-foreground">Youten AI</span>
            </div>
            <div className="flex items-center gap-2.5 sm:gap-3">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
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
        <header className="border-b border-border/60 bg-background/90 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <YoutenLogo size="sm" className="group-hover:scale-105 transition-transform" />
              <span className="font-bold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">
                Youten AI
              </span>
            </Link>
            <div className="flex items-center gap-2.5 sm:gap-3">
              <LanguageSwitcher />
              <ThemeToggle />
              {currentUser ? (
                <div className="flex items-center" data-testid="navbar-user-section">
                  <UserNavDropdown
                    name={currentUser.full_name || currentUser.email}
                    email={currentUser.email}
                    onLogout={handleLogout}
                    showDashboard={true}
                  />
                </div>
              ) : (
                <Button asChild size="sm" variant="default" className="text-xs">
                  <Link href="/">
                    {t('share.tryFree')}
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </Button>
              )}
            </div>
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
      {/* 1. Distraction-Free Header Banner */}
      <header className="border-b border-border/60 bg-background/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
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

          <div className="flex items-center gap-2.5 sm:gap-3">
            <LanguageSwitcher />
            <ThemeToggle />

            {currentUser ? (
              <div className="flex items-center" data-testid="navbar-user-section">
                <UserNavDropdown
                  name={currentUser.full_name || currentUser.email}
                  email={currentUser.email}
                  onLogout={handleLogout}
                  showDashboard={true}
                />
              </div>
            ) : (
              <>
                <span className="hidden md:inline-block text-xs text-muted-foreground">
                  {t('share.poweredBy')}
                </span>
                <Button asChild size="sm" className="text-xs font-semibold shadow-xs">
                  <Link href="/" data-testid="try-free-cta-btn">
                    {t('share.tryFree')}
                    <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Recording Page Header */}
      <RecordingHeader
        id={recording.id}
        title={recording.title}
        selectedTemplate={recording.selected_template}
        durationSeconds={recording.duration_seconds}
        createdAt={recording.created_at}
        backHref={currentUser ? '/dashboard' : '/'}
        showShare={false}
        showAskAi={true}
        isChatOpen={isChatOpen}
        onToggleChat={() => setIsChatOpen((prev) => !prev)}
        showExport={true}
        onExport={handleExport}
        isExportOpen={isExportOpen}
        onExportOpenChange={setIsExportOpen}
        exportVersion={recording.active_summary?.version}
        className="sticky top-16 z-20"
      />

      {/* 3. Main Read-Only Content Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className={cn('flex-1 w-full min-w-0 space-y-6', isChatOpen && 'lg:max-w-[calc(100%-400px)]')}>
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as RecordingTabKey)}
              className="space-y-6"
            >
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
                          onAskAI={(seg) => handleAskAiFromTranscript(seg.text)}
                        />
                      );
                    })
                  )}
                </div>
              </TabsContent>

              {/* TAB 3: CHAPTERS & HIGHLIGHTS */}
              <TabsContent value="chapters" data-testid="chapters-tab-content" className="outline-none space-y-8">
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

      <Footer />
    </div>
  );
};

