'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { formatTime } from '@/lib/time';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { SearchableSelect, SearchableSelectOption } from '@/components/molecules/searchable-select';
import { useTemplates } from '@/hooks';
import { TemplateKey, DefaultTemplateKey } from '@/server/constants/template.constant';
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
import { useTranslation } from '@/locales';
import { cn } from '@/lib/utils';

export type RecorderState = 'idle' | 'recording' | 'paused' | 'stopped';

export interface RecordingProcessOptions {
  title?: string;
  templateCategory?: TemplateKey;
}

export interface BrowserRecorderProps {
  onProcessRecording?: (
    audioBlob: Blob,
    durationSeconds: number,
    options?: RecordingProcessOptions
  ) => Promise<void> | void;
  isProcessing?: boolean;
  className?: string;
}

function extractErrorMessage(
  error: unknown,
  fallback: string,
  t?: (key: string) => string
): string {
  if (typeof error === 'object' && error !== null) {
    const errObj = error as { name?: string; message?: string };
    const name = errObj.name || '';
    const msg = (errObj.message || '').toLowerCase();
    if (msg.includes('permissions policy') || msg.includes('disallowed by permissions policy')) {
      return t
        ? t('ingestion.recorder.permissionsPolicyError')
        : 'Izin mikrofon terhalang oleh cache dokumen browser. Silakan muat ulang (refresh) halaman untuk memuat header izin terbaru.';
    }
    if (
      name === 'NotAllowedError' ||
      name === 'PermissionDeniedError' ||
      msg.includes('permission denied') ||
      msg.includes('permission dismissed')
    ) {
      return t
        ? t('ingestion.recorder.micBlocked')
        : 'Akses mikrofon diblokir atau ditolak oleh browser. Silakan klik ikon pengaturan/gembok di sebelah URL browser (localhost:3000), ubah izin Mikrofon menjadi "Izinkan" (Allow), lalu muat ulang halaman.';
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || msg.includes('not found')) {
      return t
        ? t('ingestion.recorder.micNotFound')
        : 'Perangkat mikrofon tidak ditemukan. Pastikan mikrofon telah terpasang dan aktif di perangkat Anda.';
    }
    if (errObj.message && errObj.message.trim()) {
      return errObj.message;
    }
  }
  return fallback;
}

export function BrowserRecorder({
  onProcessRecording,
  isProcessing = false,
  className,
}: BrowserRecorderProps) {
  const { t } = useTranslation();
  const [recorderState, setRecorderState] = useState<RecorderState>('idle');
  const [duration, setDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [title, setTitle] = useState('');
  const [templateCategory, setTemplateCategory] = useState<TemplateKey>(DefaultTemplateKey);
  const { templates } = useTemplates();

  const templateOptions: SearchableSelectOption[] = useMemo(
    () =>
      templates.map((tmpl) => ({
        value: tmpl.key,
        label: tmpl.label,
        description: tmpl.description,
        icon: tmpl.icon,
      })),
    [templates]
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const audioPreviewUrl = useMemo(() => {
    if (
      !recordedBlob ||
      typeof window === 'undefined' ||
      typeof URL === 'undefined' ||
      typeof URL.createObjectURL !== 'function'
    ) {
      return undefined;
    }
    try {
      return URL.createObjectURL(recordedBlob);
    } catch {
      return undefined;
    }
  }, [recordedBlob]);

  useEffect(() => {
    return () => {
      if (audioPreviewUrl && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(audioPreviewUrl);
      }
    };
  }, [audioPreviewUrl]);

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

  // Reactive permission listener: automatically clear error when user allows mic in browser settings
  useEffect(() => {
    let permissionStatus: PermissionStatus | null = null;
    let handleStatusChange: (() => void) | null = null;
    let isSubscribed = true;

    if (
      typeof navigator !== 'undefined' &&
      'permissions' in navigator &&
      typeof navigator.permissions?.query === 'function'
    ) {
      navigator.permissions
        .query({ name: 'microphone' as PermissionName })
        .then((status) => {
          if (!isSubscribed) return;
          permissionStatus = status;

          handleStatusChange = () => {
            if (status.state === 'granted') {
              setErrorMessage((prev) =>
                prev && prev.includes('Akses mikrofon diblokir') ? null : prev
              );
            }
          };

          status.addEventListener('change', handleStatusChange);
        })
        .catch(() => {
          // Some browsers or older versions might not support microphone query
        });
    }

    return () => {
      isSubscribed = false;
      if (permissionStatus && handleStatusChange) {
        permissionStatus.removeEventListener('change', handleStatusChange);
      }
    };
  }, []);

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
        throw new Error(t('ingestion.recorder.notSupported'));
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
        throw new Error(t('ingestion.recorder.formatNotSupported'));
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
        setTitle((prev) => prev || t('ingestion.recorder.defaultTitle'));
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
        t('ingestion.recorder.micPermissionDeniedFallback'),
        t
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
    setTitle('');
    setTemplateCategory(DefaultTemplateKey);
  };

  const handleProcess = async () => {
    if (!recordedBlob || isProcessing || !onProcessRecording) return;
    try {
      setErrorMessage(null);
      await onProcessRecording(recordedBlob, duration, {
        title: title.trim() || t('ingestion.recorder.defaultTitle'),
        templateCategory,
      });
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, t('ingestion.recorder.defaultProcessError'), t);
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
          <span>{t('ingestion.recorder.headerTitle')}</span>
        </h3>
        <p className="text-xs text-muted-foreground">
          {t('ingestion.recorder.headerSubtitle')}
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
              <span>
                {recorderState === 'stopped'
                  ? t('ingestion.recorder.recordingFinished')
                  : t('ingestion.recorder.readyToRecord')}
              </span>
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
              {t('ingestion.recorder.recordingAudio')}
            </span>
          )}
          {recorderState === 'paused' && (
            <span className="font-semibold text-amber-400">
              {t('ingestion.recorder.recordingPaused')}
            </span>
          )}
          {recorderState === 'stopped' && (
            <span className="font-semibold text-emerald-400">
              {t('ingestion.recorder.recordingSaved', { time: formatTime(duration) })}
            </span>
          )}
        </div>
      </div>

      {/* Configuration & Audio Preview when stopped */}
      {recorderState === 'stopped' && (
        <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 backdrop-blur-md shadow-sm space-y-4 text-left">
          {audioPreviewUrl && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                {t('ingestion.recorder.previewLabel')}
              </Label>
              <audio
                controls
                src={audioPreviewUrl}
                className="w-full h-9 rounded-md"
                data-testid="audio-preview"
              />
            </div>
          )}

          {/* Title Configuration */}
          <div className="space-y-1.5">
            <Label htmlFor="recording-title" className="text-xs font-semibold text-foreground">
              {t('ingestion.recorder.titleLabel')}
            </Label>
            <Input
              id="recording-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isProcessing}
              placeholder={t('ingestion.recorder.titlePlaceholder')}
              className="text-xs"
              data-testid="recording-title-input"
            />
          </div>

          {/* Template Category Picker */}
          <div className="space-y-1.5">
            <Label htmlFor="template-select" className="text-xs font-semibold text-foreground">
              {t('ingestion.recorder.templateLabel')}
            </Label>
            <SearchableSelect
              id="template-select"
              data-testid="template-select"
              value={templateCategory}
              onValueChange={(val) => setTemplateCategory(val as TemplateKey)}
              options={templateOptions}
              disabled={isProcessing}
              placeholder={t('ingestion.recorder.templateLabel')}
              searchPlaceholder="Cari template..."
            />
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {recorderState === 'idle' && (
          <Button
            type="button"
            variant="destructive"
            size="lg"
            onClick={handleStartRecording}
            className="rounded-full shadow-lg shadow-destructive/20"
            data-testid="start-record-btn"
          >
            <Mic className="h-4 w-4" />
            <span>{t('ingestion.recorder.startRecord')}</span>
          </Button>
        )}

        {(recorderState === 'recording' || recorderState === 'paused') && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePauseResume}
              className="rounded-full"
              data-testid="pause-record-btn"
            >
              {recorderState === 'paused' ? (
                <>
                  <Play className="h-3.5 w-3.5" />
                  <span>{t('ingestion.recorder.resume')}</span>
                </>
              ) : (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  <span>{t('ingestion.recorder.pause')}</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleStopRecording}
              className="rounded-full shadow-md shadow-destructive/25"
              data-testid="stop-record-btn"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              <span>{t('ingestion.recorder.stop')}</span>
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
              data-testid="reset-record-btn"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{t('ingestion.recorder.rerecord')}</span>
            </Button>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleProcess}
              disabled={isProcessing || !recordedBlob}
              data-testid="process-record-btn"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{t('ingestion.recorder.processing')}</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{t('ingestion.recorder.processAudio')}</span>
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
          className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-destructive text-left shadow-sm"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.reload();
                }
              }}
              data-testid="reload-page-btn"
            >
              {t('ingestion.recorder.reload')}
            </Button>
            {recorderState === 'idle' && (
              <Button
                type="button"
                size="xs"
                variant="destructive"
                onClick={handleStartRecording}
                data-testid="retry-permission-btn"
              >
                {t('ingestion.recorder.retry')}
              </Button>
            )}
            <Button
              type="button"
              size="xs"
              variant="ghost"
              onClick={() => setErrorMessage(null)}
              data-testid="dismiss-error-btn"
            >
              {t('ingestion.recorder.close')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
