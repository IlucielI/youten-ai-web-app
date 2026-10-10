'use client';

import React from 'react';
import { RecordingAnalyticsDTO } from '@/server/dtos/analytics.dto';
import { formatTime } from '@/lib/time';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/atoms/avatar';
import { Clock, MessageSquare, Gauge, Users, BarChart3 } from 'lucide-react';

export interface AnalyticsCardsProps {
  analytics?: RecordingAnalyticsDTO | null;
  speakerLabels?: Record<string, string>;
  className?: string;
}

const SPEAKER_PALETTES = [
  { bar: 'bg-primary', text: 'text-primary', bg: 'bg-primary/10' },
  { bar: 'bg-emerald-500', text: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { bar: 'bg-amber-500', text: 'text-amber-500', bg: 'bg-amber-500/10' },
  { bar: 'bg-violet-500', text: 'text-violet-500', bg: 'bg-violet-500/10' },
  { bar: 'bg-sky-500', text: 'text-sky-500', bg: 'bg-sky-500/10' },
  { bar: 'bg-rose-500', text: 'text-rose-500', bg: 'bg-rose-500/10' },
];

function getInitials(name?: string): string {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AnalyticsCards({ analytics, speakerLabels, className }: AnalyticsCardsProps) {
  // Deduplicate and aggregate speakers if multiple entries share the same display name or if speakerLabels maps them
  const aggregatedSpeakers = React.useMemo(() => {
    const rawSpeakers = analytics?.speakers ?? [];
    if (!rawSpeakers.length) return [];
    const map = new Map<string, { name: string; total_seconds: number; word_count: number; share_percent: number }>();
    for (const spk of rawSpeakers) {
      const displayName = (speakerLabels && speakerLabels[spk.name]) ? speakerLabels[spk.name] : spk.name;
      const existing = map.get(displayName);
      if (existing) {
        existing.total_seconds += spk.total_seconds ?? 0;
        existing.word_count += spk.word_count ?? 0;
        existing.share_percent += spk.share_percent ?? 0;
      } else {
        map.set(displayName, {
          name: displayName,
          total_seconds: spk.total_seconds ?? 0,
          word_count: spk.word_count ?? 0,
          share_percent: spk.share_percent ?? 0,
        });
      }
    }
    return Array.from(map.values());
  }, [analytics?.speakers, speakerLabels]);

  if (!analytics || (!aggregatedSpeakers.length && !analytics.total_duration_seconds)) {
    return (
      <div
        data-testid="empty-analytics-state"
        className={cn(
          'flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-border/80 bg-card/40 text-center',
          className
        )}
      >
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
          <BarChart3 className="h-5 w-5" />
        </div>
        <h4 className="text-sm font-semibold text-foreground">Data Analitik Belum Tersedia</h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          Metrik durasi, kecepatan bicara (WPM), dan distribusi partisipasi pembicara akan muncul setelah pemrosesan selesai.
        </p>
      </div>
    );
  }

  const { total_duration_seconds = 0, total_words = 0 } = analytics;

  // Words per minute (WPM)
  const paceWpm =
    total_duration_seconds > 0
      ? Math.round((total_words / total_duration_seconds) * 60)
      : 0;

  // Sort speakers by share_percent descending
  const sortedSpeakers = [...aggregatedSpeakers].sort(
    (a, b) => b.share_percent - a.share_percent
  );

  return (
    <div data-testid="analytics-cards" className={cn('space-y-4', className)}>
      {/* Top 4 Quick Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Duration */}
        <div
          data-testid="metric-duration-card"
          className="rounded-xl border border-border/60 bg-card/60 p-3.5 hover:border-border transition-colors"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium">Total Durasi</span>
          </div>
          <div className="text-xl font-bold text-foreground">
            {formatTime(total_duration_seconds)}
          </div>
          <span className="text-[11px] text-muted-foreground">
            {Math.round(total_duration_seconds)} detik rekaman
          </span>
        </div>

        {/* Total Words */}
        <div
          data-testid="metric-words-card"
          className="rounded-xl border border-border/60 bg-card/60 p-3.5 hover:border-border transition-colors"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <MessageSquare className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-medium">Total Kata</span>
          </div>
          <div className="text-xl font-bold text-foreground">
            {(total_words ?? 0).toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-muted-foreground">kata terucap</span>
        </div>

        {/* Speaking Pace (WPM) */}
        <div
          data-testid="metric-wpm-card"
          className="rounded-xl border border-border/60 bg-card/60 p-3.5 hover:border-border transition-colors"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Gauge className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium">Kecepatan Bicara</span>
          </div>
          <div className="text-xl font-bold text-foreground">{paceWpm} WPM</div>
          <span className="text-[11px] text-muted-foreground">
            {paceWpm > 160 ? 'Cepat' : paceWpm < 120 ? 'Santai' : 'Normal / Sedang'}
          </span>
        </div>

        {/* Speakers Count */}
        <div
          data-testid="metric-speakers-card"
          className="rounded-xl border border-border/60 bg-card/60 p-3.5 hover:border-border transition-colors"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="h-4 w-4 text-violet-500" />
            <span className="text-xs font-medium">Partisipan</span>
          </div>
          <div className="text-xl font-bold text-foreground">
            {sortedSpeakers.length} Pembicara
          </div>
          <span className="text-[11px] text-muted-foreground">terdeteksi diarization</span>
        </div>
      </div>

      {/* Speaker Talk-Time Distribution Section */}
      {sortedSpeakers.length > 0 && (
        <div
          data-testid="speakers-distribution-card"
          className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Distribusi Waktu Bicara
            </h4>
            <span className="text-xs text-muted-foreground">
              {sortedSpeakers.length} pembicara
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {sortedSpeakers.map((speaker, index) => {
              const palette = SPEAKER_PALETTES[index % SPEAKER_PALETTES.length];
              const share = Math.min(100, Math.max(0, Math.round(speaker.share_percent ?? 0)));

              return (
                <div
                  key={speaker.name || `speaker-${index}`}
                  data-testid={`speaker-row-${index}`}
                  className="space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5 text-[9px] font-bold">
                        <AvatarFallback className={cn(palette.bg, palette.text)}>
                          {getInitials(speaker.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">
                        {speaker.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span>{(speaker.word_count ?? 0).toLocaleString('id-ID')} kata</span>
                      <span>{formatTime(speaker.total_seconds ?? 0)}</span>
                      <span className={cn('font-semibold min-w-9 text-right', palette.text)}>
                        {share}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar Track */}
                  <div className="h-2 w-full rounded-full bg-secondary/50 overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', palette.bar)}
                      style={{ width: `${share}%` }}
                      data-testid={`speaker-progress-bar-${index}`}
                      role="progressbar"
                      aria-valuenow={share}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
