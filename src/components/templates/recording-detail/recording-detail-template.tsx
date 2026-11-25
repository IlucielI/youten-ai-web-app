'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ListOrdered, Bookmark, Loader2 } from 'lucide-react';
import { Navbar } from '@/components/organisms/navbar';
import { Footer } from '@/components/organisms/footer';
import { Tabs, TabsContent } from '@/components/atoms/tabs';
import { Button } from '@/components/atoms/button';
import { SummaryViewer } from '@/components/organisms/summary-viewer';
import { SummaryVersionTabs } from '@/components/molecules/summary-version-tabs';
import { RegenerateModal } from '@/components/organisms/regenerate-modal';
import { SpeakerRenameDialog } from '@/components/molecules/speaker-rename-dialog';
import { CommentDrawer } from '@/components/organisms/comment-drawer';
import { ChapterList } from '@/components/organisms/chapters-list';
import { HighlightsGrid } from '@/components/organisms/highlights-grid';
import { AnalyticsCards } from '@/components/organisms/analytics-cards';
import { AudioPlayer } from '@/components/organisms/audio-player';
import { ChatPanel } from '@/components/organisms/chat-panel';
import { ShareDialog } from '@/components/molecules/share-dialog';
import { RecordingHeader } from '@/components/organisms/recording-header';
import { RecordingTabs } from '@/components/molecules/recording-tabs';
import { GuestWarningBanner } from '@/components/molecules/guest-warning-banner';
import { TranscriptCanvas } from '@/components/organisms/transcript-canvas';
import { useTranslation } from '@/locales';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/stores/player.store';
import { useChatStore } from '@/stores/chat.store';
import { useRecordingDetail } from '@/hooks/use-recording-detail';
import { useRecordingChatStream } from '@/hooks/use-recording-chat-stream';
import type { RecordingAnalyticsDTO } from '@/server/dtos/analytics.dto';
import type { TemplateKey } from '@/server/constants/template.constant';

export interface RecordingDetailTemplateProps {
  recordingId: string;
}

export const RecordingDetailTemplate: React.FC<RecordingDetailTemplateProps> = ({
  recordingId,
}) => {
  const { t } = useTranslation();

  const {
    recording,
    isLoading,
    errorMessage,
    activeTab,
    setActiveTab,
    speakerLabels,
    renameSpeakerId,
    setRenameSpeakerId,
    handleSaveSpeakerLabel,
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
  } = useRecordingDetail(recordingId);

  const { isChatOpen, setIsChatOpen, toggleChat, sendMessage } = useRecordingChatStream({
    recordingId,
    recordingTitle: recording?.title,
  });

  const currentTime = usePlayerStore((state) => state.currentTime);
  const seek = usePlayerStore((state) => state.seek);
  const addUserMessage = useChatStore((state) => state.addUserMessage);

  if (isLoading) {
    return (
      <div
        data-testid="recording-detail-loading"
        className="min-h-screen flex flex-col bg-background text-foreground"
      >
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t('recording.loading')}</p>
        </div>
      </div>
    );
  }

  if (errorMessage || !recording) {
    return (
      <div
        data-testid="recording-detail-error"
        className="min-h-screen flex flex-col bg-background text-foreground"
      >
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-foreground">{t('recording.notFoundTitle')}</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {errorMessage || t('recording.notFoundDesc')}
          </p>
          <Button asChild className="mt-6">
            <Link href="/">{t('pipeline.header.backToHome')}</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div
      data-testid="recording-detail-container"
      className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary"
    >
      {/* Top Navbar */}
      <Navbar />

      {/* Main Page Header */}
      <RecordingHeader
        id={recording.id}
        title={recording.title}
        selectedTemplate={recording.selected_template}
        durationSeconds={recording.duration_seconds}
        createdAt={recording.created_at}
        backHref="/"
        showShare={true}
        onOpenShare={() => setIsShareOpen(true)}
        showExport={true}
        onExport={handleExport}
        isExportOpen={isExportOpen}
        onExportOpenChange={setIsExportOpen}
        isPro={isLoggedIn ? canExportPdf : false}
        exportVersion={activeSummaryData?.version}
        showAskAi={true}
        isChatOpen={isChatOpen}
        onToggleChat={toggleChat}
        className="sticky top-16 z-30"
      />

      {/* Guest Session Warning Banner */}
      {recording.is_guest && (
        <GuestWarningBanner
          recordingId={recording.id}
          isLoggedIn={isLoggedIn}
          isClaiming={isClaiming}
          onClaim={handleManualClaim}
        />
      )}

      {/* Main Review Canvas + Right Collapsible AI Chat Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left Main Review Canvas */}
          <div
            className={cn(
              'flex-1 w-full min-w-0 space-y-6',
              isChatOpen && 'lg:max-w-[calc(100%-400px)]'
            )}
          >
            {/* 4-Tab Navigation */}
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as typeof activeTab)}
              className="w-full"
            >
              <RecordingTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                segmentsCount={recording.segments?.length}
                chaptersCount={recording.chapters?.length}
                className="mb-6"
              />

              {/* Tab 1: Summary Canvas */}
              <TabsContent
                value="summary"
                data-testid="summary-tab-content"
                className="space-y-6 mt-0"
              >
                {/* Version switcher */}
                {summaryVersions.length > 0 && (
                  <SummaryVersionTabs
                    versions={summaryVersions}
                    selectedVersionId={selectedVersionId}
                    onSelectVersion={handleSelectVersion}
                    onActivateVersion={handleActivateVersion}
                    isActivating={isActivatingVersion}
                    onOpenRegenerate={() => setIsRegenerateOpen(true)}
                  />
                )}

                {/* Polymorphic Summary Viewer */}
                <div data-testid="summary-viewer-wrapper">
                  <SummaryViewer summary={activeSummaryData} />
                </div>
              </TabsContent>

              {/* Tab 2: Transcript Canvas */}
              <TabsContent
                value="transcript"
                data-testid="transcript-tab-content"
                className="space-y-4 mt-0"
              >
                <TranscriptCanvas
                  segments={recording.segments}
                  speakerLabels={speakerLabels}
                  currentTime={currentTime}
                  onSeek={(time) => seek(time)}
                  onRenameSpeaker={(label) => setRenameSpeakerId(label)}
                  onAddComment={(seg) => {
                    setSelectedCommentSegment(seg);
                    setIsCommentDrawerOpen(true);
                  }}
                  onAskAI={(seg) => {
                    setIsChatOpen(true);
                    const prompt = t('recording.transcript.askAiPrompt', { text: seg.text });
                    addUserMessage(prompt);
                    void sendMessage(prompt);
                  }}
                  onSaveText={handleSaveSegmentText}
                />
              </TabsContent>

              {/* Tab 3: Chapters & Highlights Canvas */}
              <TabsContent
                value="chapters"
                data-testid="chapters-tab-content"
                className="space-y-8 mt-0"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ListOrdered className="w-4 h-4 text-primary" />
                    <h3 className="text-base font-bold text-foreground">
                      {t('recording.chapters.sectionTitle')}
                    </h3>
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
                    <h3 className="text-base font-bold text-foreground">
                      {t('recording.highlights.sectionTitle')}
                    </h3>
                  </div>
                  <HighlightsGrid
                    highlights={recording.highlights || []}
                    currentTime={currentTime}
                    onSeek={(time) => seek(time)}
                  />
                </div>
              </TabsContent>

              {/* Tab 4: Analytics Canvas */}
              <TabsContent
                value="analytics"
                data-testid="analytics-tab-content"
                className="space-y-6 mt-0"
              >
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
              data-testid="recording-chat-panel"
              className="w-full lg:w-[380px] shrink-0 sticky top-[168px] max-h-[calc(100vh-184px)] flex flex-col animate-in slide-in-from-right duration-300 z-20"
            >
              <ChatPanel
                recordingId={recording.id}
                template={activeSummaryData?.template_category || recording.selected_template}
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                onSendMessage={sendMessage}
                onSeekAudio={(timestamp) => seek(timestamp)}
                className="h-full max-w-none shadow-lg"
              />
            </div>
          )}
        </div>
      </main>

      {/* Bottom Audio Player Bar */}
      <div
        data-testid="sticky-audio-player-container"
        className="w-full max-w-4xl mx-auto px-4 my-6"
      >
        <AudioPlayer
          src={recording.audio_url || recording.playback_url || undefined}
          title={recording.title}
          sticky={false}
        />
      </div>

      {/* Global Application Footer */}
      <Footer />

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
        isGuest={Boolean(recording?.is_guest)}
        onClaim={isLoggedIn ? handleManualClaim : undefined}
        claimUrl={!isLoggedIn && recording ? `/login?claim=${recording.id}` : undefined}
        isClaiming={isClaiming}
      />

      {/* Comment Drawer */}
      <CommentDrawer
        isOpen={isCommentDrawerOpen}
        onClose={() => setIsCommentDrawerOpen(false)}
        comments={comments}
        currentTimestampSec={selectedCommentSegment?.start_time || currentTime}
        onCreateComment={handleCreateComment}
        onReplyComment={handleReplyComment}
        onSeek={(time) => seek(time)}
      />
    </div>
  );
};

