'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  FileAudio,
  Mic,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RecordingStatus } from '@/server/constants';
import { usePipelineStore } from '@/stores/pipeline.store';
import { PipelineErrorCard } from '@/components/molecules/pipeline-error-card';
import { Button } from '@/components/atoms/button';

export interface PipelineStepperProps {
  status?: RecordingStatus;
  progress?: number;
  message?: string;
  errorCode?: string | null;
  errorMessage?: string | null;
  onRetry?: () => Promise<void> | void;
  isRetrying?: boolean;
  className?: string;
  startedAt?: string | number | Date | null;
}

interface StepDefinition {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  expectedProgress: number;
  matchedStatuses: readonly RecordingStatus[];
}

const PIPELINE_STEPS: readonly StepDefinition[] = [
  {
    id: 'extraction',
    title: 'Validasi & Ekstraksi',
    description: 'Verifikasi berkas audio, format stream & normalisasi sampel',
    icon: FileAudio,
    expectedProgress: 30,
    matchedStatuses: [
      RecordingStatus.PENDING,
      RecordingStatus.QUEUED,
      RecordingStatus.VALIDATING,
      RecordingStatus.EXTRACTING,
    ],
  },
  {
    id: 'transcription',
    title: 'Transkripsi Multi-Pembicara',
    description: 'Diarisasi ujaran, stempel waktu, dan pengenalan pembicara',
    icon: Mic,
    expectedProgress: 55,
    matchedStatuses: [RecordingStatus.TRANSCRIBING],
  },
  {
    id: 'intelligence',
    title: 'AI Intelligence & Pengindeksan',
    description: 'Sintesis ringkasan notula, action items, dan vektor semantik',
    icon: Sparkles,
    expectedProgress: 85,
    matchedStatuses: [RecordingStatus.SUMMARIZING, RecordingStatus.INDEXING],
  },
  {
    id: 'completed',
    title: 'Siap Ditinjau',
    description: 'Seluruh analitik rekaman dan transkripsi siap diakses',
    icon: CheckCircle2,
    expectedProgress: 100,
    matchedStatuses: [RecordingStatus.COMPLETED],
  },
] as const;

export const PipelineStepper: React.FC<PipelineStepperProps> = ({
  status: propStatus,
  progress: propProgress,
  message: propMessage,
  errorCode: propErrorCode,
  errorMessage: propErrorMessage,
  onRetry,
  isRetrying = false,
  className,
  startedAt,
}) => {
  // Connect to Zustand pipeline store
  const storeStatus = usePipelineStore((state) => state.status);
  const storeProgress = usePipelineStore((state) => state.progress);
  const storeMessage = usePipelineStore((state) => state.message);
  const storeErrorCode = usePipelineStore((state) => state.errorCode);
  const storeErrorMessage = usePipelineStore((state) => state.errorMessage);

  const status = propStatus ?? storeStatus;
  const progress = propProgress !== undefined ? propProgress : storeProgress;
  const message = propMessage ?? storeMessage;
  const errorCode = propErrorCode !== undefined ? propErrorCode : storeErrorCode;
  const errorMessage = propErrorMessage !== undefined ? propErrorMessage : storeErrorMessage;

  const isFailed = status === RecordingStatus.FAILED;
  const isCompleted = status === RecordingStatus.COMPLETED;

  // Live timer for elapsed processing duration (persistent across refreshes when startedAt is provided)
  const [mountTime] = useState<number>(() => Date.now());
  const [tickSeconds, setTickSeconds] = useState<number>(0);

  useEffect(() => {
    if (isCompleted || isFailed) return;

    const timer = setInterval(() => {
      setTickSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isCompleted, isFailed]);

  const elapsedSeconds = useMemo(() => {
    if (startedAt) {
      const baseMs = new Date(startedAt).getTime();
      if (!isNaN(baseMs)) {
        const initialElapsed = Math.max(0, Math.floor((mountTime - baseMs) / 1000));
        return initialElapsed + tickSeconds;
      }
    }
    return tickSeconds;
  }, [startedAt, mountTime, tickSeconds]);

  // Determine current active step index (0 to 3)
  const currentStepIndex = useMemo(() => {
    if (isCompleted) return 3;
    if (isFailed) {
      // Find step based on progress fallback
      if (progress >= 85) return 2;
      if (progress >= 55) return 1;
      return 0;
    }
    const idx = PIPELINE_STEPS.findIndex((step) =>
      step.matchedStatuses.includes(status)
    );
    return idx !== -1 ? idx : 0;
  }, [status, isCompleted, isFailed, progress]);

  // Format timer mm:ss
  const formattedTimer = useMemo(() => {
    const mins = Math.floor(elapsedSeconds / 60)
      .toString()
      .padStart(2, '0');
    const secs = (elapsedSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }, [elapsedSeconds]);

  return (
    <div
      data-testid="pipeline-stepper-container"
      className={cn(
        'w-full rounded-3xl border border-border/80 bg-card/95 backdrop-blur-md shadow-xl p-6 sm:p-8 md:p-10 lg:p-12 space-y-8 sm:space-y-10',
        className
      )}
    >
      {/* Top Header: Title, Live Timer, and Percentage */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-wider">
            Youten Intelligence Pipeline
          </span>
          <h3
            data-testid="pipeline-headline"
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground mt-1.5"
          >
            {isCompleted
              ? 'Pemrosesan Selesai'
              : isFailed
                ? 'Pemrosesan Terhenti'
                : 'Menganalisis Percakapan...'}
          </h3>
          <p
            data-testid="pipeline-current-message"
            className="text-sm sm:text-base text-muted-foreground mt-1.5 truncate max-w-xl"
          >
            {message}
          </p>
        </div>

        {/* Status Pill & Live Timer Badge */}
        <div className="flex items-center gap-3">
          {isFailed && onRetry && (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={onRetry}
              disabled={isRetrying}
              data-testid="header-retry-button"
              className="gap-2 cursor-pointer text-xs sm:text-sm font-semibold shadow-sm px-4 py-2"
            >
              <RefreshCw className={cn('w-4 h-4', isRetrying && 'animate-spin')} />
              <span>{isRetrying ? 'Memulai Ulang...' : 'Coba Lagi'}</span>
            </Button>
          )}

          <div
            data-testid="live-timer-badge"
            className="flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-muted/80 border border-border/60 text-xs sm:text-sm font-mono font-medium text-foreground"
          >
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{formattedTimer}</span>
          </div>

          <div
            data-testid="progress-percentage-badge"
            className={cn(
              'px-4 py-1.5 sm:px-5 sm:py-2 rounded-full text-xs sm:text-sm font-bold font-mono transition-colors',
              isCompleted
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : isFailed
                  ? 'bg-destructive/15 text-destructive border border-destructive/30'
                  : 'bg-primary/15 text-primary border border-primary/30'
            )}
          >
            {Math.round(progress)}%
          </div>
        </div>
      </div>

      {/* Progressive Percentage Bar */}
      <div className="space-y-2">
        <div
          data-testid="pipeline-progress-track"
          className="relative h-3 sm:h-3.5 w-full overflow-hidden rounded-full bg-muted/80 shadow-inner"
        >
          <div
            data-testid="pipeline-progress-fill"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            className={cn(
              'h-full transition-all duration-500 ease-out rounded-full shadow-sm',
              isCompleted
                ? 'bg-emerald-500'
                : isFailed
                  ? 'bg-destructive'
                  : 'bg-gradient-to-r from-primary to-indigo-500'
            )}
          />
        </div>
      </div>

      {/* 4-Stage Stepper Cards Grid */}
      <div
        data-testid="stepper-stages-grid"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6"
      >
        {PIPELINE_STEPS.map((step, idx) => {
          const StepIcon = step.icon;
          const isCurrent = idx === currentStepIndex && !isCompleted && !isFailed;
          const isPassed = idx < currentStepIndex || isCompleted;
          const isErrorStep = idx === currentStepIndex && isFailed;

          return (
            <div
              key={step.id}
              data-testid={`pipeline-step-${step.id}`}
              className={cn(
                'relative flex flex-col p-5 sm:p-6 rounded-2xl border transition-all duration-300 min-h-[170px] sm:min-h-[190px]',
                isPassed &&
                  'bg-emerald-500/5 border-emerald-500/20 text-foreground',
                isCurrent &&
                  'bg-primary/5 border-primary/40 shadow-md ring-2 ring-primary/20 scale-[1.02]',
                isErrorStep &&
                  'bg-destructive/10 border-destructive/40 shadow-md ring-2 ring-destructive/20',
                !isPassed &&
                  !isCurrent &&
                  !isErrorStep &&
                  'bg-card/50 border-border/50 text-muted-foreground opacity-60'
              )}
            >
              {/* Top Step Icon & Step Number */}
              <div className="flex items-center justify-between mb-4">
                <div
                  className={cn(
                    'p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-colors',
                    isPassed && 'bg-emerald-500/15 text-emerald-500',
                    isCurrent && 'bg-primary text-primary-foreground shadow-sm',
                    isErrorStep && 'bg-destructive text-destructive-foreground shadow-sm',
                    !isPassed && !isCurrent && !isErrorStep && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isPassed ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isErrorStep ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <StepIcon className="w-5 h-5" />
                  )}
                </div>

                <span className="text-xs sm:text-sm font-mono font-semibold text-muted-foreground">
                  0{idx + 1}
                </span>
              </div>

              {/* Title & Description */}
              <h5 className="text-sm sm:text-base font-bold text-foreground leading-snug">
                {step.title}
              </h5>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1.5 flex-1">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Render Smart Error Card if failed */}
      {isFailed && (
        <div className="pt-2 animate-in fade-in duration-300">
          <PipelineErrorCard
            errorCode={errorCode}
            errorMessage={errorMessage}
            onRetry={onRetry}
            isRetrying={isRetrying}
          />
        </div>
      )}
    </div>
  );
};
