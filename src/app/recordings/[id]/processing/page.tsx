'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, FileAudio, ExternalLink, RefreshCw, Trash2 } from 'lucide-react';
import { Navbar } from '@/components/organisms/navbar';
import { Footer } from '@/components/organisms/footer';
import { PipelineStepper } from '@/components/organisms/pipeline-stepper';
import { Button } from '@/components/atoms/button';
import { cn } from '@/lib/utils';
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
import { toast } from 'sonner';
import { RecordingStatus } from '@/server/constants';
import { usePipelineStore, PipelineProgressPayload } from '@/stores/pipeline.store';
import { useTokenStore } from '@/stores/token.store';
import { apiFetch } from '@/lib/api-client';
import { ApiResponse } from '@/server/dtos/response.dto';
import { RecordingDetailDto, RetryRecordingResponseDto } from '@/server/schemas/recording.schema';
import { useTranslation } from '@/locales';

export default function RecordingProcessingPage() {
  const params = useParams();
  const router = useRouter();
  const { t, locale } = useTranslation();
  const recordingId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string) || '';

  const [recordingTitle, setRecordingTitle] = useState<string>(() => t('pipeline.header.loadingTitle'));
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Persistent elapsed timer state across page refreshes
  const [startedAt, setStartedAt] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    // Priority 1: Guest Token store created_at
    const guestItem = useTokenStore.getState().guestTokens.find((t) => t.id === recordingId);
    if (guestItem?.created_at) {
      return guestItem.created_at;
    }
    // Priority 2: SessionStorage
    const stored = sessionStorage.getItem(`pipeline_started_${recordingId}`);
    if (stored) {
      return stored;
    }
    // Priority 3: Initialize current time
    const nowIso = new Date().toISOString();
    sessionStorage.setItem(`pipeline_started_${recordingId}`, nowIso);
    return nowIso;
  });

  // Zustand pipeline store selectors (granular to avoid unnecessary rerenders)
  const status = usePipelineStore((state) => state.status);
  const progress = usePipelineStore((state) => state.progress);
  const message = usePipelineStore((state) => state.message);
  const errorCode = usePipelineStore((state) => state.errorCode);
  const errorMessage = usePipelineStore((state) => state.errorMessage);

  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  });

  const lastInitializedIdRef = useRef<string | null>(null);

  /**
   * Helper to derive stage metadata, monotonic progress target, and localized message from recording status.
   */
  const getStatusMeta = useCallback(
    (targetStatus: RecordingStatus | string) => {
      const isEn = locale === 'en';
      switch (targetStatus) {
        case RecordingStatus.PENDING:
          return {
            progress: 10,
            stage: 'extraction',
            message: isEn
              ? 'In queue, preparing recording pipeline...'
              : 'Dalam antrean, menyiapkan pemrosesan...',
          };
        case RecordingStatus.QUEUED:
          return {
            progress: 15,
            stage: 'extraction',
            message: isEn
              ? 'Allocated to worker pipeline...'
              : 'Antrean dialokasikan ke pekerja...',
          };
        case RecordingStatus.VALIDATING:
          return {
            progress: 25,
            stage: 'extraction',
            message: isEn
              ? 'Verifying audio file and stream format...'
              : 'Memvalidasi berkas audio dan format stream...',
          };
        case RecordingStatus.EXTRACTING:
          return {
            progress: 40,
            stage: 'extraction',
            message: isEn
              ? 'Extracting and normalizing audio tracks...'
              : 'Mengekstrak dan menormalisasi trek audio...',
          };
        case RecordingStatus.TRANSCRIBING:
          return {
            progress: 65,
            stage: 'transcription',
            message: isEn
              ? 'Transcribing speech & detecting speaker segments...'
              : 'Mentranskripsi ujaran percakapan & mendeteksi pembicara...',
          };
        case RecordingStatus.SUMMARIZING:
          return {
            progress: 85,
            stage: 'intelligence',
            message: isEn
              ? 'Synthesizing AI minutes summary and action items...'
              : 'Menyusun ringkasan notula cerdas AI & poin keputusan...',
          };
        case RecordingStatus.INDEXING:
          return {
            progress: 95,
            stage: 'intelligence',
            message: isEn
              ? 'Indexing semantic vectors & final checks...'
              : 'Mengindeks vektor semantik & pemeriksaan akhir...',
          };
        case RecordingStatus.COMPLETED:
          return {
            progress: 100,
            stage: 'completed',
            message: isEn
              ? 'Recording processing completed and ready for review!'
              : 'Pemrosesan rekaman berhasil selesai!',
          };
        case RecordingStatus.FAILED:
          return {
            progress: 100,
            stage: 'failed',
            message: isEn
              ? 'Recording processing halted.'
              : 'Pemrosesan rekaman terhenti.',
          };
        default:
          return {
            progress: 15,
            stage: 'extraction',
            message: isEn
              ? 'Processing recording pipeline...'
              : 'Memproses rekaman percakapan...',
          };
      }
    },
    [locale]
  );

  /**
   * Connect to real-time Server-Sent Events (SSE) progress stream.
   */
  const connectSSE = useCallback(
    (id: string) => {
      if (!id) return;

      // Close any existing SSE stream
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // Check if EventSource is supported in browser/environment
      if (typeof window === 'undefined' || !window.EventSource) {
        return;
      }

      const guestToken = useTokenStore.getState().getGuestToken(id);
      const sseUrl = guestToken
        ? `/api/recordings/${id}/progress?token=${encodeURIComponent(guestToken)}`
        : `/api/recordings/${id}/progress`;

      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;

      const handleProgressEvent = (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data) as PipelineProgressPayload & {
            recording_id?: string;
            error_code?: string;
            error_message?: string;
            errorCode?: string;
            errorMessage?: string;
          };

          const recStatus = payload.status;
          const meta = getStatusMeta(recStatus || '');
          const errCode = payload.error_code || payload.errorCode || 'ERR_PIPELINE_FAILED';
          const errMsg =
            payload.error_message ||
            payload.errorMessage ||
            payload.message ||
            (locale === 'en' ? 'Recording processing failed.' : 'Pemrosesan rekaman gagal.');

          if (recStatus === RecordingStatus.COMPLETED) {
            usePipelineStore
              .getState()
              .setCompleted(
                payload.message || meta.message
              );
            if (eventSourceRef.current) {
              eventSourceRef.current.close();
              eventSourceRef.current = null;
            }

            // Smooth redirect transition to review detail screen
            setTimeout(() => {
              routerRef.current.push(`/recordings/${id}`);
            }, 1200);
          } else if (recStatus === RecordingStatus.FAILED) {
            usePipelineStore.getState().setFailure({
              code: errCode,
              message: errMsg,
            });
            if (eventSourceRef.current) {
              eventSourceRef.current.close();
              eventSourceRef.current = null;
            }
          } else if (recStatus) {
            usePipelineStore.getState().updateProgress({
              status: recStatus,
              stage: payload.stage || meta.stage,
              progress: payload.progress !== undefined ? payload.progress : meta.progress,
              message: payload.message || meta.message,
            });
          }
        } catch {
          // Ignore parse errors on ping/comments
        }
      };

      // Support both default message events and named 'progress' events
      eventSource.onmessage = handleProgressEvent;
      if (typeof eventSource.addEventListener === 'function') {
        eventSource.addEventListener('progress', handleProgressEvent as EventListener);
      }

      eventSource.onerror = () => {
        // Handle connection termination
        if (eventSource.readyState === EventSource.CLOSED) {
          eventSourceRef.current = null;
        }
      };
    },
    [locale, getStatusMeta]
  );

  /**
   * Initial mount: fetch recording details & start SSE stream.
   */
  useEffect(() => {
    if (!recordingId) return;

    if (lastInitializedIdRef.current !== recordingId) {
      lastInitializedIdRef.current = recordingId;
      usePipelineStore.getState().initPipeline(recordingId, RecordingStatus.PENDING);
    }

    let isMounted = true;
    const guestToken = useTokenStore.getState().getGuestToken(recordingId);

    const checkStatus = () => {
      apiFetch<ApiResponse<RecordingDetailDto>>(`/api/recordings/${recordingId}`, {
        headers: guestToken ? { 'x-ownership-token': guestToken } : undefined,
      })
        .then((res) => {
          if (!isMounted) return;
          if (res.data?.title) {
            setRecordingTitle(res.data.title);
          }
          if (res.data?.created_at) {
            setStartedAt(res.data.created_at);
            if (typeof window !== 'undefined') {
              sessionStorage.setItem(`pipeline_started_${recordingId}`, res.data.created_at);
            }
          }

          const recStatus = res.data?.status;
          if (!recStatus) return;

          if (recStatus === RecordingStatus.COMPLETED) {
            const meta = getStatusMeta(RecordingStatus.COMPLETED);
            usePipelineStore.getState().setCompleted(meta.message);
            // If already completed on initial mount, redirect promptly
            const isInitial = !usePipelineStore.getState().isProcessing && usePipelineStore.getState().progress === 0;
            const redirectDelay = isInitial ? 400 : 1200;
            setTimeout(() => {
              routerRef.current.push(`/recordings/${recordingId}`);
            }, redirectDelay);
            return;
          }

          if (recStatus === RecordingStatus.FAILED) {
            usePipelineStore.getState().setFailure({
              code: res.data?.error_code || 'ERR_PIPELINE_FAILED',
              message: res.data?.error_message || t('pipeline.errors.haltedMessage'),
            });
            return;
          }

          // Advance intermediate pipeline progress (VALIDATING, EXTRACTING, TRANSCRIBING, SUMMARIZING, INDEXING, etc.)
          const meta = getStatusMeta(recStatus);
          usePipelineStore.getState().updateProgress({
            status: recStatus,
            stage: meta.stage,
            progress: meta.progress,
            message: meta.message,
          });
        })
        .catch(() => {
          if (!isMounted) return;
          setRecordingTitle(t('pipeline.errors.defaultAudioTitle'));
        });
    };

    // Initial check & connect SSE
    checkStatus();
    connectSSE(recordingId);

    // Fallback polling interval every 2.5s to ensure progress updates even if SSE drops
    const pollInterval = setInterval(() => {
      const currentStatus = usePipelineStore.getState().status;
      if (currentStatus === RecordingStatus.COMPLETED || currentStatus === RecordingStatus.FAILED) {
        clearInterval(pollInterval);
        return;
      }
      checkStatus();
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [recordingId, connectSSE, getStatusMeta, t, locale]);

  /**
   * Handle retry action on failure.
   */
  const handleRetry = async () => {
    if (!recordingId || isRetrying) return;
    setIsRetrying(true);

    try {
      const guestToken = useTokenStore.getState().getGuestToken(recordingId);

      // Call BFF retry endpoint
      const res = await apiFetch<ApiResponse<RetryRecordingResponseDto>>(
        `/api/recordings/${recordingId}/retry`,
        {
          method: 'POST',
          headers: guestToken ? { 'x-ownership-token': guestToken } : undefined,
        }
      );

      if (res.data) {
        // Reset pipeline store to resumed status
        usePipelineStore.getState().initPipeline(recordingId, RecordingStatus.TRANSCRIBING);
        usePipelineStore.getState().updateProgress({
          status: RecordingStatus.TRANSCRIBING,
          stage: 'transcription',
          progress: 35,
          message: t('pipeline.errors.restartingMessage'),
        });

        // Reconnect SSE
        connectSSE(recordingId);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('pipeline.errors.retryFailedMessage');
      usePipelineStore.getState().setFailure({
        code: 'ERR_RETRY_FAILED',
        message: msg,
      });
    } finally {
      setIsRetrying(false);
    }
  };

  /**
   * Handle cancel and cleanup action for stuck or unwanted recording session.
   */
  const handleCancelAndClean = async () => {
    if (!recordingId || isCancelling) return;
    setIsCancelling(true);

    try {
      const guestToken = useTokenStore.getState().getGuestToken(recordingId);

      // Call BFF DELETE endpoint
      await apiFetch<ApiResponse<{ message?: string }>>(`/api/recordings/${recordingId}`, {
        method: 'DELETE',
        headers: guestToken ? { 'x-ownership-token': guestToken } : undefined,
      });

      // Clear local session storage and store states
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(`pipeline_started_${recordingId}`);
      }
      usePipelineStore.getState().resetPipeline();
      useTokenStore.getState().removeGuestToken(recordingId);

      toast.success(t('pipeline.status.cancelSuccess'));
      setIsCancelModalOpen(false);

      // Close SSE connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // Redirect user to home or dashboard
      const isGuest = !!guestToken;
      routerRef.current.push(isGuest ? '/' : '/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('pipeline.status.cancelFailed');
      toast.error(msg);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div
      data-testid="processing-page-container"
      className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-foreground selection:bg-primary/20 selection:text-primary"
    >
      {/* Top Navigation */}
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
                  <span>AI Diarization &amp; Intelligent Synthesis</span>
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

      {/* Global Application Footer */}
      <Footer />
    </div>
  );
}
