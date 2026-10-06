'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { formatTime } from '@/lib/time';
import { Button } from '@/components/atoms/button';
import {
  Mic,
  Square,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type RecorderState = 'idle' | 'recording' | 'paused' | 'stopped';

export interface BrowserRecorderProps {
  onProcessRecording?: (audioBlob: Blob, durationSeconds: number) => Promise<void> | void;
  isProcessing?: boolean;
  className?: string;
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export function BrowserRecorder({
  onProcessRecording,
  isProcessing = false,
  className,
}: BrowserRecorderProps) {
  const [recorderState, setRecorderState] = useState<RecorderState>('idle');
  const [duration, setDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const clearTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
      cleanupStream();
    };
  }, [clearTimer, cleanupStream]);

  const handleStartRecording = async () => {
    setErrorMessage(null);
    setRecordedBlob(null);
    setDuration(0);
    audioChunksRef.current = [];

    try {
      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia ||
        typeof MediaRecorder === 'undefined'
      ) {
        throw new Error('Perekaman audio tidak didukung oleh browser Anda.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const supportedMimeTypes = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav'];
      const mimeType = supportedMimeTypes.find((type) => {
        try {
          return MediaRecorder.isTypeSupported(type);
        } catch {
          return false;
        }
      });

      if (!mimeType) {
        cleanupStream();
        throw new Error('Format perekaman audio tidak didukung oleh browser Anda.');
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setRecordedBlob(finalBlob);
        cleanupStream();
      };

      mediaRecorder.start(250); // Slice data every 250ms
      setRecorderState('recording');

      timerIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      cleanupStream();
      const msg = extractErrorMessage(
        err,
        'Izin akses mikrofon ditolak atau mikrofon tidak ditemukan.'
      );
      setErrorMessage(msg);
      setRecorderState('idle');
    }
  };

  const handlePauseResume = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    if (recorderState === 'recording' && recorder.state === 'recording') {
      recorder.pause();
      clearTimer();
      setRecorderState('paused');
    } else if (recorderState === 'paused' && recorder.state === 'paused') {
      recorder.resume();
      timerIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
      setRecorderState('recording');
    }
  };

  const handleStopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    clearTimer();
    if (recorder.state !== 'inactive') {
      recorder.stop();
    }
    setRecorderState('stopped');
  };

  const handleReset = () => {
    clearTimer();
    const activeRecorder = mediaRecorderRef.current;
    if (activeRecorder && activeRecorder.state !== 'inactive') {
      activeRecorder.onstop = null;
      activeRecorder.stop();
    }
    cleanupStream();
    setRecorderState('idle');
    setDuration(0);
    setRecordedBlob(null);
    audioChunksRef.current = [];
    setErrorMessage(null);
  };

  const handleProcess = async () => {
    if (!recordedBlob || isProcessing || !onProcessRecording) return;
    try {
      setErrorMessage(null);
      await onProcessRecording(recordedBlob, duration);
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'Gagal memproses rekaman audio.');
      setErrorMessage(msg);
    }
  };

  return (
    <div
      data-testid="browser-recorder"
      className={cn(
        'w-full max-w-xl mx-auto rounded-2xl border border-border/80 bg-card/60 p-6 backdrop-blur-md shadow-md space-y-6 text-foreground text-center',
        className
      )}
    >
      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-base font-bold text-foreground flex items-center justify-center gap-2">
          <Mic className="h-5 w-5 text-primary" />
          <span>Rekam Langsung dari Mikrofon</span>
        </h3>
        <p className="text-xs text-muted-foreground">
          Tangkap percakapan tatap muka atau audio browser Anda secara langsung.
        </p>
      </div>

      {/* Visualizer & Timer Display */}
      <div className="rounded-2xl border border-border/60 bg-secondary/30 p-8 flex flex-col items-center justify-center space-y-4">
        {/* Animated Waveform Indicator */}
        <div className="flex items-center justify-center gap-1.5 h-12" data-testid="waveform-visualizer">
          {recorderState === 'recording' ? (
            Array.from({ length: 9 }).map((_, i) => (
              <span
                key={i}
                className="w-1.5 bg-primary rounded-full animate-pulse transition-all"
                style={{
                  height: `${20 + ((i * 17) % 28)}px`,
                  animationDuration: `${0.4 + (i % 4) * 0.2}s`,
                }}
              />
            ))
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground/60 text-xs">
              <Mic className="h-6 w-6" />
              <span>{recorderState === 'stopped' ? 'Rekaman selesai' : 'Siap merekam'}</span>
            </div>
          )}
        </div>

        {/* Live Timer Counter */}
        <div
          data-testid="recorder-timer"
          className="text-3xl font-mono font-bold tracking-wider text-foreground"
        >
          {formatTime(duration)}
        </div>

        {/* State Badge */}
        <div className="text-xs">
          {recorderState === 'recording' && (
            <span className="inline-flex items-center gap-1.5 font-semibold text-rose-400">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              Merekam Audio...
            </span>
          )}
          {recorderState === 'paused' && (
            <span className="font-semibold text-amber-400">Perekaman Dijeda</span>
          )}
          {recorderState === 'stopped' && (
            <span className="font-semibold text-emerald-400">Rekaman Tersimpan ({formatTime(duration)})</span>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {recorderState === 'idle' && (
          <Button
            type="button"
            onClick={handleStartRecording}
            className="text-xs gap-2 px-6 py-2.5 h-auto rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20"
            data-testid="start-record-btn"
          >
            <Mic className="h-4 w-4" />
            <span>Mulai Rekam</span>
          </Button>
        )}

        {(recorderState === 'recording' || recorderState === 'paused') && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePauseResume}
              className="text-xs gap-1.5"
              data-testid="pause-record-btn"
            >
              {recorderState === 'paused' ? (
                <>
                  <Play className="h-3.5 w-3.5" />
                  <span>Lanjutkan</span>
                </>
              ) : (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  <span>Jeda</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleStopRecording}
              className="text-xs gap-1.5"
              data-testid="stop-record-btn"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              <span>Selesai</span>
            </Button>
          </>
        )}

        {recorderState === 'stopped' && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isProcessing}
              className="text-xs gap-1.5"
              data-testid="reset-record-btn"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Rekam Ulang</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleProcess}
              disabled={isProcessing || !recordedBlob}
              className="text-xs gap-2"
              data-testid="process-record-btn"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Proses & Transkrip Audio</span>
                </>
              )}
            </Button>
          </>
        )}
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div
          data-testid="recorder-error-alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 flex items-start gap-2.5 text-xs text-rose-300 text-left"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
