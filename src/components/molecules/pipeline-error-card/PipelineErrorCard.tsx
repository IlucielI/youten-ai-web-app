'use client';

import React, { useState } from 'react';
import { AlertCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PipelineErrorCode } from '@/server/constants';
import { Button } from '@/components/atoms/button';

import { usePipelineStore } from '@/stores/pipeline.store';
import { useTokenStore } from '@/stores/token.store';
import { apiFetch } from '@/lib/api-client';
import { RecordingStatus } from '@/server/constants';
import { useTranslation } from '@/locales';

export interface PipelineErrorCardProps {
  errorCode?: string | null;
  errorMessage?: string | null;
  onRetry?: () => Promise<void> | void;
  isRetrying?: boolean;
  recordingId?: string;
  className?: string;
}

const RETRY_CAPABILITY: Record<string, boolean> = {
  [PipelineErrorCode.ERR_AUDIO_CORRUPT]: false,
  [PipelineErrorCode.ERR_EXTRACTION_FAILED]: true,
  [PipelineErrorCode.ERR_TRANSCRIPTION_FAILED]: true,
  [PipelineErrorCode.ERR_NO_SPEECH_DETECTED]: false,
  [PipelineErrorCode.ERR_SUMMARIZATION_FAILED]: true,
  [PipelineErrorCode.ERR_INDEXING_FAILED]: true,
  [PipelineErrorCode.ERR_IMPORT_FETCH_FAILED]: true,
  [PipelineErrorCode.ERR_GDRIVE_ACCESS_DENIED]: false,
  [PipelineErrorCode.ERR_UNSUPPORTED_MEDIA_TYPE]: false,
  [PipelineErrorCode.ERR_PIPELINE_TIMEOUT]: true,
};

const sanitizeErrorMessage = (msg?: string | null): string | null => {
  if (!msg) return null;
  const lower = msg.toLowerCase();
  if (lower.includes('could not process file') || (lower.includes('valid media file') && lower.includes('400'))) {
    return 'The media file could not be processed. Please ensure it is a valid, uncorrupted audio or video file.';
  }
  if (lower.includes('{"error"') || lower.includes('stt api returned status') || lower.includes('primary stt') || lower.includes('whisper')) {
    return 'Speech-to-text audio processing encountered an error.';
  }
  return msg;
};

export const PipelineErrorCard: React.FC<PipelineErrorCardProps> = ({
  errorCode,
  errorMessage,
  onRetry,
  isRetrying = false,
  recordingId,
  className,
}) => {
  const { t } = useTranslation();
  const [internalLoading, setInternalLoading] = useState(false);
  const [retryConflictError, setRetryConflictError] = useState<string | null>(null);

  const displayErrorMessage = React.useMemo(() => sanitizeErrorMessage(errorMessage), [errorMessage]);

  const errorInfo = React.useMemo(() => {
    if (errorCode && errorCode in RETRY_CAPABILITY) {
      const taxonomyKey = `pipeline.errors.taxonomy.${errorCode}` as const;
      return {
        title: t(`${taxonomyKey}.title`),
        description: t(`${taxonomyKey}.description`),
        canRetry: RETRY_CAPABILITY[errorCode] ?? true,
      };
    }
    return {
      title: t('pipeline.errors.defaultTitle'),
      description: displayErrorMessage || t('pipeline.errors.defaultDescription'),
      canRetry: true,
    };
  }, [errorCode, displayErrorMessage, t]);

  const handleRetryClick = async () => {
    if (isRetrying || internalLoading) return;
    setRetryConflictError(null);
    setInternalLoading(true);

    try {
      if (onRetry) {
        await onRetry();
      } else {
        const targetId = recordingId || usePipelineStore.getState().recordingId;
        if (targetId) {
          const guestToken = useTokenStore.getState().getGuestToken(targetId);
          await apiFetch(`/api/recordings/${targetId}/retry`, {
            method: 'POST',
            headers: guestToken ? { 'x-ownership-token': guestToken } : undefined,
          });
          usePipelineStore.getState().initPipeline(targetId, RecordingStatus.TRANSCRIBING);
          usePipelineStore.getState().updateProgress({
            status: RecordingStatus.TRANSCRIBING,
            stage: 'transcription',
            progress: 35,
            message: t('pipeline.errors.restartingMessage'),
          });
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('409')) {
        setRetryConflictError(t('pipeline.errors.conflictInProgress'));
      } else {
        setRetryConflictError(t('pipeline.errors.conflictFailed'));
      }
    } finally {
      setInternalLoading(false);
    }
  };

  const isLoading = isRetrying || internalLoading;

  return (
    <div
      data-testid="pipeline-error-card"
      className={cn(
        'rounded-2xl border border-destructive/30 bg-destructive/5 p-5 md:p-6 text-foreground shadow-sm transition-all',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="rounded-full bg-destructive/10 p-2.5 text-destructive shrink-0 mt-0.5">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h4
              data-testid="error-card-title"
              className="text-base font-semibold text-destructive leading-tight"
            >
              {errorInfo.title}
            </h4>
            {errorCode && (
              <span
                data-testid="error-code-badge"
                className="text-[11px] font-mono px-2 py-0.5 bg-destructive/15 text-destructive rounded-md font-medium"
              >
                {errorCode}
              </span>
            )}
          </div>

          <p
            data-testid="error-card-description"
            className="text-sm text-muted-foreground leading-relaxed pt-1"
          >
            {errorInfo.description}
          </p>

          {displayErrorMessage && displayErrorMessage !== errorInfo.description && (
            <div className="mt-2 text-xs font-mono bg-background/80 border border-border/60 rounded p-2 text-muted-foreground">
              {displayErrorMessage}
            </div>
          )}

          {retryConflictError && (
            <div
              data-testid="retry-conflict-alert"
              className="mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded-md"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{retryConflictError}</span>
            </div>
          )}

          {errorInfo.canRetry && (
            <div className="pt-3">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                data-testid="retry-stage-button"
                onClick={handleRetryClick}
                disabled={isLoading}
                className="gap-2 cursor-pointer text-xs font-medium"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
                <span>
                  {isLoading
                    ? t('pipeline.errors.retryingButton')
                    : t('pipeline.errors.retryButton')}
                </span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
