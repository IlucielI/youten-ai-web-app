'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, FileAudio, ExternalLink } from 'lucide-react';
import { Navbar } from '@/components/organisms/navbar';
import { PipelineStepper } from '@/components/organisms/pipeline-stepper';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import { RecordingStatus } from '@/server/constants';
import { usePipelineStore, PipelineProgressPayload } from '@/stores/pipeline.store';
import { apiFetch } from '@/lib/api-client';
import { ApiResponse } from '@/server/dtos/response.dto';
import { RecordingDetailDto, RetryRecordingResponseDto } from '@/server/schemas/recording.schema';

export default function RecordingProcessingPage() {
  const params = useParams();
  const router = useRouter();
  const recordingId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string) || '';

  const [recordingTitle, setRecordingTitle] = useState<string>('Memuat Rekaman...');
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const eventSourceRef = useRef<EventSource | null>(null);

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
   * Connect to real-time Server-Sent Events (SSE) progress stream.
   */
  const connectSSE = useCallback((id: string) => {
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

    const eventSource = new EventSource(`/api/recordings/${id}/progress`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as PipelineProgressPayload & {
          errorCode?: string;
          errorMessage?: string;
        };

        if (payload.status === RecordingStatus.COMPLETED) {
          usePipelineStore.getState().setCompleted(payload.message || 'Pemrosesan rekaman selesai');
          eventSource.close();
          eventSourceRef.current = null;

          // Smooth redirect transition to review detail screen
          setTimeout(() => {
            routerRef.current.push(`/recordings/${id}`);
          }, 1200);
        } else if (payload.status === RecordingStatus.FAILED) {
          usePipelineStore.getState().setFailure({
            code: payload.errorCode || 'ERR_PIPELINE_FAILED',
            message: payload.errorMessage || payload.message || 'Pemrosesan rekaman gagal.',
          });
          eventSource.close();
          eventSourceRef.current = null;
        } else {
          usePipelineStore.getState().updateProgress(payload);
        }
      } catch {
        // Ignore parse errors on ping/comments
      }
    };

    eventSource.onerror = () => {
      // Handle connection termination
      if (eventSource.readyState === EventSource.CLOSED) {
        eventSourceRef.current = null;
      }
    };
  }, []);

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

    // Fetch initial recording metadata
    apiFetch<ApiResponse<RecordingDetailDto>>(`/api/recordings/${recordingId}`)
      .then((res) => {
        if (!isMounted) return;
        if (res.data?.title) {
          setRecordingTitle(res.data.title);
        }
        if (res.data?.status === RecordingStatus.COMPLETED) {
          usePipelineStore.getState().setCompleted('Rekaman sudah selesai diproses.');
          setTimeout(() => {
            routerRef.current.push(`/recordings/${recordingId}`);
          }, 800);
          return;
        }
        if (res.data?.status === RecordingStatus.FAILED) {
          usePipelineStore.getState().setFailure({
            code: res.data.error_code || 'ERR_PIPELINE_FAILED',
            message: res.data.error_message || 'Pemrosesan rekaman terhenti.',
          });
          return;
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setRecordingTitle('Rekaman Audio');
      });

    connectSSE(recordingId);

    return () => {
      isMounted = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [recordingId, connectSSE]);

  /**
   * Handle retry action on failure.
   */
  const handleRetry = async () => {
    if (!recordingId || isRetrying) return;
    setIsRetrying(true);

    try {
      // Call BFF retry endpoint
      const res = await apiFetch<ApiResponse<RetryRecordingResponseDto>>(
        `/api/recordings/${recordingId}/retry`,
        { method: 'POST' }
      );

      if (res.data) {
        // Reset pipeline store to resumed status
        usePipelineStore.getState().initPipeline(recordingId, RecordingStatus.TRANSCRIBING);
        usePipelineStore.getState().updateProgress({
          status: RecordingStatus.TRANSCRIBING,
          stage: 'transcription',
          progress: 35,
          message: 'Memulai ulang pemrosesan pipeline...',
        });

        // Reconnect SSE
        connectSSE(recordingId);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memulai ulang pemrosesan.';
      usePipelineStore.getState().setFailure({
        code: 'ERR_RETRY_FAILED',
        message: msg,
      });
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div
      data-testid="processing-page-container"
      className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-foreground selection:bg-primary/20 selection:text-primary"
    >
      {/* Top Navigation */}
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-10 relative overflow-hidden">
        {/* Subtle decorative background gradient spots */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-primary/10 via-indigo-500/10 to-teal-500/5 blur-3xl pointer-events-none -z-10 rounded-full" />

        <div className="w-full max-w-3xl space-y-6">
          {/* Header Action & Breadcrumb Navigation */}
          <div
            data-testid="processing-header"
            className="flex items-center justify-between gap-4"
          >
            <Link
              href="/"
              data-testid="back-to-home-link"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </Link>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                data-testid="recording-id-badge"
                className="font-mono text-[11px] px-2.5 py-0.5 border-border bg-background/60 backdrop-blur-sm text-muted-foreground truncate max-w-[160px] sm:max-w-none"
              >
                ID: {recordingId}
              </Badge>
            </div>
          </div>

          {/* Recording Title Header Card */}
          <div className="bg-card/70 backdrop-blur-sm border border-border/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                <FileAudio className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1
                  data-testid="recording-title-display"
                  className="text-base sm:text-lg font-bold text-foreground truncate"
                >
                  {recordingTitle}
                </h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>AI Diarization &amp; Intelligent Synthesis</span>
                </p>
              </div>
            </div>

            {/* Direct Link button if completed */}
            {status === RecordingStatus.COMPLETED && (
              <Button
                size="sm"
                variant="default"
                onClick={() => router.push(`/recordings/${recordingId}`)}
                className="gap-1.5 shrink-0"
              >
                <span>Buka Notula</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
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
            />
          </div>

          {/* User Guidance Banner */}
          <p className="text-center text-xs text-muted-foreground/80 leading-relaxed max-w-lg mx-auto">
            Proses dienkripsi secara end-to-end. Anda dapat tetap berada di layar ini atau kembali ke beranda kapan saja — progres pemrosesan akan tetap berjalan di latar belakang.
          </p>
        </div>
      </main>
    </div>
  );
}
