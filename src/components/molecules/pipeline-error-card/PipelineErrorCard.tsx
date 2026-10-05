'use client';

import React, { useState } from 'react';
import { AlertCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PipelineErrorCode } from '@/server/constants';
import { Button } from '@/components/atoms/button';

export interface PipelineErrorCardProps {
  errorCode?: string | null;
  errorMessage?: string | null;
  onRetry?: () => Promise<void> | void;
  isRetrying?: boolean;
  className?: string;
}

export const PIPELINE_ERROR_TAXONOMY: Record<
  string,
  { title: string; description: string; canRetry: boolean }
> = {
  [PipelineErrorCode.ERR_AUDIO_CORRUPT]: {
    title: 'Berkas Audio Tidak Valid atau Rusak',
    description: 'Format audio tidak dapat dibaca atau file terpotong saat pengunggahan.',
    canRetry: false,
  },
  [PipelineErrorCode.ERR_EXTRACTION_FAILED]: {
    title: 'Ekstraksi Audio Gagal',
    description: 'Sistem gagal mengekstrak aliran audio dari media yang diunggah.',
    canRetry: true,
  },
  [PipelineErrorCode.ERR_TRANSCRIPTION_FAILED]: {
    title: 'Transkripsi Speech-to-Text Terkendala',
    description: 'Mesin AI transkripsi mengalami gangguan saat memproses ujaran suara.',
    canRetry: true,
  },
  [PipelineErrorCode.ERR_NO_SPEECH_DETECTED]: {
    title: 'Tidak Ada Percakapan Terdeteksi',
    description: 'Tidak ditemukan suara atau percakapan manusia yang dapat ditranskripsikan.',
    canRetry: false,
  },
  [PipelineErrorCode.ERR_SUMMARIZATION_FAILED]: {
    title: 'Ringkasan AI Mengalami Gangguan',
    description: 'Model AI mengalami kegagalan saat mengekstraksi poin dan ringkasan terstruktur.',
    canRetry: true,
  },
  [PipelineErrorCode.ERR_INDEXING_FAILED]: {
    title: 'Pengindeksan Vektor Semantik Gagal',
    description: 'Gagal membuat indeks memori untuk fitur pencarian percakapan.',
    canRetry: true,
  },
};

export const PipelineErrorCard: React.FC<PipelineErrorCardProps> = ({
  errorCode,
  errorMessage,
  onRetry,
  isRetrying = false,
  className,
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const [retryConflictError, setRetryConflictError] = useState<string | null>(null);

  const errorInfo = (errorCode && PIPELINE_ERROR_TAXONOMY[errorCode]) || {
    title: 'Pemrosesan Rekaman Terkendala',
    description: errorMessage || 'Terjadi kendala teknis saat memproses aliran pipeline.',
    canRetry: true,
  };

  const handleRetryClick = async () => {
    if (!onRetry || isRetrying || internalLoading) return;
    setRetryConflictError(null);
    setInternalLoading(true);

    try {
      await onRetry();
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('409')) {
        setRetryConflictError('Pipeline sedang diproses kembali di latar belakang.');
      } else {
        setRetryConflictError('Gagal memicu percobaan ulang. Silakan coba sesaat lagi.');
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

          {errorMessage && errorMessage !== errorInfo.description && (
            <div className="mt-2 text-xs font-mono bg-background/80 border border-border/60 rounded p-2 text-muted-foreground">
              {errorMessage}
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

          {errorInfo.canRetry && onRetry && (
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
                    ? 'Memulai Ulang Pipeline...'
                    : 'Coba Lagi dari Tahap Terakhir'}
                </span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
