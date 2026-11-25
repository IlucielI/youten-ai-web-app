'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, FileAudio, ExternalLink, RefreshCw, Trash2 } from 'lucide-react';
import { Navbar } from '@/components/organisms/navbar';
import { Footer } from '@/components/organisms/footer';
import { PipelineStepper } from '@/components/organisms/pipeline-stepper';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/atoms/alert-dialog';
import { RecordingStatus } from '@/server/constants';
import { useRecordingProcessing } from '@/hooks/use-recording-processing';
import { cn } from '@/lib/utils';

export interface RecordingProcessingTemplateProps {
  recordingId: string;
}

export const RecordingProcessingTemplate: React.FC<RecordingProcessingTemplateProps> = ({
  recordingId,
}) => {
  const {
    recordingTitle,
    startedAt,
    status,
    progress,
    message,
    errorCode,
    errorMessage,
    isRetrying,
    handleRetry,
    isCancelModalOpen,
    setIsCancelModalOpen,
    isCancelling,
    handleCancelAndClean,
    router,
    t,
  } = useRecordingProcessing({ recordingId });

  return (
    <div
      data-testid="processing-page-container"
      className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-foreground selection:bg-primary/20 selection:text-primary"
    >
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-10 lg:p-12 relative overflow-hidden">
        {/* Subtle decorative background gradient spots */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] sm:w-[1100px] h-[550px] bg-gradient-to-tr from-primary/15 via-indigo-500/10 to-teal-500/10 blur-3xl pointer-events-none -z-10 rounded-full" />

        <div className="w-full max-w-4xl xl:max-w-5xl space-y-5 sm:space-y-6">
          {/* Header Action & Breadcrumb Navigation */}
          <div
            data-testid="processing-header"
            className="flex items-center justify-between gap-4 px-1"
          >
            <Link
              href="/"
              data-testid="back-to-home-link"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>{t('pipeline.header.backToHome')}</span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              <Badge
                variant="outline"
                data-testid="recording-id-badge"
                className="font-mono text-xs px-2.5 py-0.5 border-border/80 bg-background/80 backdrop-blur-sm text-muted-foreground truncate max-w-[160px] sm:max-w-none"
              >
                ID: {recordingId}
              </Badge>

              {status !== RecordingStatus.COMPLETED && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsCancelModalOpen(true)}
                  disabled={isCancelling}
                  data-testid="header-cancel-button"
                  className="h-7 text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1.5 cursor-pointer px-2.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('pipeline.status.cancelProcess')}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Recording Title Header Card */}
          <div className="bg-card/85 backdrop-blur-sm border border-border/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-inner">
                <FileAudio className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
              </div>
              <div className="min-w-0">
                <h1
                  data-testid="recording-title-display"
                  className="text-base sm:text-lg font-bold text-foreground truncate"
                >
                  {recordingTitle}
                </h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>AI-Powered Diarization &amp; Intelligent Synthesis</span>
                </p>
              </div>
            </div>

            {/* Direct Link button if completed */}
            {status === RecordingStatus.COMPLETED && (
              <Button
                size="default"
                variant="default"
                onClick={() => router.push(`/recordings/${recordingId}`)}
                className="gap-2 shrink-0 px-5 py-2.5 font-semibold"
              >
                <span>{t('pipeline.status.viewResult')}</span>
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}

            {/* Direct Retry button in header if failed */}
            {status === RecordingStatus.FAILED && (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="default"
                  variant="destructive"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  data-testid="page-header-retry-button"
                  className="gap-2 cursor-pointer font-semibold shadow-sm px-5 py-2.5"
                >
                  <RefreshCw className={cn('w-4 h-4', isRetrying && 'animate-spin')} />
                  <span>{isRetrying ? t('common.actions.processing') : t('pipeline.status.retryProcess')}</span>
                </Button>
                <Button
                  size="default"
                  variant="outline"
                  onClick={() => setIsCancelModalOpen(true)}
                  disabled={isCancelling}
                  data-testid="page-header-cancel-button"
                  className="gap-2 cursor-pointer font-semibold shadow-sm px-4 py-2.5 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t('pipeline.status.cancelProcess')}</span>
                </Button>
              </div>
            )}
          </div>

          {/* Live Pipeline Stepper Component */}
          <div data-testid="processing-pipeline-stepper">
            <PipelineStepper
              status={status}
              progress={progress}
              message={message}
              errorCode={errorCode}
              errorMessage={errorMessage}
              onRetry={handleRetry}
              isRetrying={isRetrying}
              onCancel={() => setIsCancelModalOpen(true)}
              isCancelling={isCancelling}
              startedAt={startedAt}
            />
          </div>
        </div>

        {/* Cancellation & Cleanup Confirmation Dialog */}
        <AlertDialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('pipeline.status.cancelModalTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('pipeline.status.cancelModalDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isCancelling}>
                {t('common.actions.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelAndClean}
                disabled={isCancelling}
                data-testid="confirm-cancel-recording-button"
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2 cursor-pointer"
              >
                {isCancelling ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t('pipeline.status.cancellingProcess')}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>{t('pipeline.status.cancelConfirmButton')}</span>
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>

      <Footer />
    </div>
  );
};

