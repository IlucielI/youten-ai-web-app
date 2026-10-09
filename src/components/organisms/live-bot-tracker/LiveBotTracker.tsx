'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMeetingBotStore } from '@/stores/meeting-bot.store';
import { Button } from '@/components/atoms/button';
import {
  Bot,
  Square,
  ArrowRight,
  Loader2,
  AlertCircle,
  Radio,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LiveBotTrackerProps {
  className?: string;
  onFinished?: () => void;
}

export function LiveBotTracker({ className, onFinished }: LiveBotTrackerProps) {
  const { activeSession, pollStatus, stopSession, isStopping, resetSession } = useMeetingBotStore();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Poll status every 4 seconds while active
  useEffect(() => {
    if (!activeSession?.sessionId) return;

    const interval = setInterval(() => {
      if (activeSession.status !== 'COMPLETED' && activeSession.status !== 'FAILED') {
        pollStatus(activeSession.sessionId);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [activeSession?.sessionId, activeSession?.status, pollStatus]);

  // Elapsed timer when recording
  useEffect(() => {
    const isRecording = activeSession?.status === 'RECORDING';
    if (!isRecording) return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeSession?.status]);

  if (!activeSession) {
    return null;
  }

  const formatTimer = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isCompleted = activeSession.status === 'COMPLETED';
  const isFailed = activeSession.status === 'FAILED';
  const isRecording = activeSession.status === 'RECORDING';
  const isWaiting = activeSession.status === 'WAITING_ADMIT' || activeSession.status === 'DISPATCHED';

  const handleStop = async () => {
    await stopSession(activeSession.sessionId);
    if (onFinished) {
      onFinished();
    }
  };

  return (
    <div
      data-testid="live-bot-tracker"
      className={cn(
        'rounded-2xl border bg-card/80 backdrop-blur-sm p-6 text-left space-y-6 shadow-sm animate-in fade-in',
        isRecording && 'border-primary/40 ring-1 ring-primary/20',
        isCompleted && 'border-emerald-500/40 bg-emerald-500/5',
        isFailed && 'border-destructive/40 bg-destructive/5',
        className
      )}
    >
      {/* Header with status badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
              isRecording
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                : isCompleted
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-primary/10 text-primary'
            )}
          >
            {isRecording ? (
              <Radio className="h-5 w-5 animate-pulse" />
            ) : isCompleted ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Bot className="h-5 w-5" />
            )}
          </div>

          <div>
            <h4 className="text-sm font-bold text-foreground capitalize">
              Asisten Bot ({activeSession.provider.replace('_', ' ')})
            </h4>
            <p className="text-xs text-muted-foreground truncate max-w-xs sm:max-w-md">
              {activeSession.meetingUrl || 'Voice Channel'}
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div>
          <span
            data-testid="live-bot-status-pill"
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
              isRecording && 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
              isWaiting && 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
              isCompleted && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
              isFailed && 'bg-destructive/10 text-destructive border-destructive/20'
            )}
          >
            {isRecording && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
            {isWaiting && <Loader2 className="h-3 w-3 animate-spin" />}
            {isRecording
              ? `Sedang Merekam (${formatTimer(elapsedSeconds)})`
              : isWaiting
              ? 'Menghubungkan...'
              : isCompleted
              ? 'Selesai'
              : 'Gagal'}
          </span>
        </div>
      </div>

      {/* Progress Message */}
      <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
          {isRecording ? (
            <>
              <Clock className="h-3.5 w-3.5 text-rose-500" />
              <span>Bot sedang merekam percakapan di dalam ruang rapat secara real-time.</span>
            </>
          ) : isWaiting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
              <span>Bot sedang meminta izin masuk meeting. Mohon terima (admit) bot jika diminta.</span>
            </>
          ) : isCompleted ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>Bot telah keluar dari rapat. Audio sedang diproses ke pipeline AI notula!</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-3.5 w-3.5 text-destructive" />
              <span>{activeSession.errorMessage || 'Terjadi kesalahan pada sesi bot rapat.'}</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
        {isCompleted ? (
          <>
            <Button asChild className="w-full sm:w-auto h-10 gap-2 text-xs font-semibold">
              <Link
                href={`/recordings/${activeSession.recordingId}`}
                data-testid="view-notula-btn"
              >
                Lihat Notula Rapat <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetSession}
              data-testid="reset-session-btn"
              className="text-xs"
            >
              Mulai Sesi Baru
            </Button>
          </>
        ) : isFailed ? (
          <Button
            variant="outline"
            onClick={resetSession}
            data-testid="retry-new-session-btn"
            className="w-full sm:w-auto text-xs"
          >
            Coba Lagi
          </Button>
        ) : (
          <>
            <Button
              variant="destructive"
              onClick={handleStop}
              disabled={isStopping}
              data-testid="stop-bot-btn"
              className="w-full sm:w-auto h-10 gap-2 text-xs font-semibold"
            >
              {isStopping ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Menghentikan Bot...</span>
                </>
              ) : (
                <>
                  <Square className="h-3.5 w-3.5 fill-current" />
                  <span>Hentikan & Proses Notula Sekarang</span>
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={resetSession}
              disabled={isStopping}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Tutup Status
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
