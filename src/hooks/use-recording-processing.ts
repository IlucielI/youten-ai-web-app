import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { RecordingStatus } from '@/server/constants';
import { usePipelineStore, PipelineProgressPayload } from '@/stores/pipeline.store';
import { useTokenStore } from '@/stores/token.store';
import { apiFetch } from '@/lib/api-client';
import { ApiResponse } from '@/server/dtos/response.dto';
import { RecordingDetailDto, RetryRecordingResponseDto } from '@/server/schemas/recording.schema';
import { useTranslation } from '@/locales';
import { toast } from 'sonner';

export interface UseRecordingProcessingOptions {
  recordingId: string;
}

export function useRecordingProcessing({ recordingId }: UseRecordingProcessingOptions) {
  const router = useRouter();
  const { t, locale } = useTranslation();

  const [recordingTitle, setRecordingTitle] = useState<string>(() => t('pipeline.header.loadingTitle'));
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Persistent elapsed timer state across page refreshes
  const [startedAt, setStartedAt] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const guestItem = useTokenStore.getState().guestTokens.find((item) => item.id === recordingId);
    if (guestItem?.created_at) {
      return guestItem.created_at;
    }
    const stored = sessionStorage.getItem(`pipeline_started_${recordingId}`);
    if (stored) {
      return stored;
    }
    const nowIso = new Date().toISOString();
    sessionStorage.setItem(`pipeline_started_${recordingId}`, nowIso);
    return nowIso;
  });

  // Zustand pipeline store selectors
  const status = usePipelineStore((state) => state.status);
  const progress = usePipelineStore((state) => state.progress);
  const message = usePipelineStore((state) => state.message);
  const errorCode = usePipelineStore((state) => state.errorCode);
  const errorMessage = usePipelineStore((state) => state.errorMessage);

  const routerRef = useRef(router);
  const tRef = useRef(t);
  const localeRef = useRef(locale);
  useEffect(() => {
    routerRef.current = router;
    tRef.current = t;
    localeRef.current = locale;
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

  const getStatusMetaRef = useRef(getStatusMeta);
  useEffect(() => {
    getStatusMetaRef.current = getStatusMeta;
  }, [getStatusMeta]);

  /**
   * Connect to real-time Server-Sent Events (SSE) progress stream.
   */
  const connectSSE = useCallback(
    (id: string) => {
      if (!id) return;

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

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
          const meta = getStatusMetaRef.current(recStatus || '');
          const errCode = payload.error_code || payload.errorCode || 'ERR_PIPELINE_FAILED';
          const errMsg =
            payload.error_message ||
            payload.errorMessage ||
            payload.message ||
            (localeRef.current === 'en' ? 'Recording processing failed.' : 'Pemrosesan rekaman gagal.');

          if (recStatus === RecordingStatus.COMPLETED) {
            usePipelineStore.getState().setCompleted(payload.message || meta.message);
            if (eventSourceRef.current) {
              eventSourceRef.current.close();
              eventSourceRef.current = null;
            }

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
          // Ignore parse errors
        }
      };

      eventSource.onmessage = handleProgressEvent;
      if (typeof eventSource.addEventListener === 'function') {
        eventSource.addEventListener('progress', handleProgressEvent as EventListener);
      }

      eventSource.onerror = () => {
        if (eventSource.readyState === EventSource.CLOSED) {
          eventSourceRef.current = null;
        }
      };
    },
    []
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
            const meta = getStatusMetaRef.current(RecordingStatus.COMPLETED);
            usePipelineStore.getState().setCompleted(meta.message);
            const isInitial =
              !usePipelineStore.getState().isProcessing && usePipelineStore.getState().progress === 0;
            const redirectDelay = isInitial ? 400 : 1200;
            setTimeout(() => {
              routerRef.current.push(`/recordings/${recordingId}`);
            }, redirectDelay);
            return;
          }

          if (recStatus === RecordingStatus.FAILED) {
            usePipelineStore.getState().setFailure({
              code: res.data?.error_code || 'ERR_PIPELINE_FAILED',
              message: res.data?.error_message || tRef.current('pipeline.errors.haltedMessage'),
            });
            return;
          }

          const meta = getStatusMetaRef.current(recStatus);
          usePipelineStore.getState().updateProgress({
            status: recStatus,
            stage: meta.stage,
            progress: meta.progress,
            message: meta.message,
          });
        })
        .catch(() => {
          if (!isMounted) return;
          setRecordingTitle(tRef.current('pipeline.errors.defaultAudioTitle'));
        });
    };

    checkStatus();
    connectSSE(recordingId);

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
  }, [recordingId, connectSSE]);

  /**
   * Handle retry action on failure.
   */
  const handleRetry = useCallback(async () => {
    if (!recordingId || isRetrying) return;
    setIsRetrying(true);

    try {
      const guestToken = useTokenStore.getState().getGuestToken(recordingId);

      const res = await apiFetch<ApiResponse<RetryRecordingResponseDto>>(
        `/api/recordings/${recordingId}/retry`,
        {
          method: 'POST',
          headers: guestToken ? { 'x-ownership-token': guestToken } : undefined,
        }
      );

      if (res.data) {
        usePipelineStore.getState().initPipeline(recordingId, RecordingStatus.TRANSCRIBING);
        usePipelineStore.getState().updateProgress({
          status: RecordingStatus.TRANSCRIBING,
          stage: 'transcription',
          progress: 35,
          message: t('pipeline.errors.restartingMessage'),
        });

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
  }, [recordingId, isRetrying, connectSSE, t]);

  /**
   * Handle cancel and cleanup action for stuck or unwanted recording session.
   */
  const handleCancelAndClean = useCallback(async () => {
    if (!recordingId || isCancelling) return;
    setIsCancelling(true);

    try {
      const guestToken = useTokenStore.getState().getGuestToken(recordingId);

      await apiFetch<ApiResponse<{ message?: string }>>(`/api/recordings/${recordingId}`, {
        method: 'DELETE',
        headers: guestToken ? { 'x-ownership-token': guestToken } : undefined,
      });

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(`pipeline_started_${recordingId}`);
      }
      usePipelineStore.getState().resetPipeline();
      useTokenStore.getState().removeGuestToken(recordingId);

      toast.success(t('pipeline.status.cancelSuccess'));
      setIsCancelModalOpen(false);

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      const isGuest = !!guestToken;
      routerRef.current.push(isGuest ? '/' : '/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('pipeline.status.cancelFailed');
      toast.error(msg);
    } finally {
      setIsCancelling(false);
    }
  }, [recordingId, isCancelling, t]);

  return {
    recordingId,
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
  };
}

