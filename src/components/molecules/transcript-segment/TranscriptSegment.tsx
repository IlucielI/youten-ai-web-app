'use client';

import React, { useState } from 'react';
import {
  Copy,
  Check,
  MessageSquare,
  Sparkles,
  Pencil,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/time';
import { usePlayerStore } from '@/stores/player.store';
import { Button } from '@/components/atoms/button';
import { KaraokeText } from '@/components/molecules/karaoke-text';
import type { TranscriptSegmentDTO } from '@/server/dtos/recording.dto';

export interface TranscriptSegmentProps {
  segment: TranscriptSegmentDTO;
  speakerName?: string;
  currentTime?: number;
  isActive?: boolean;
  onSeek?: (startTime: number) => void;
  onRenameSpeaker?: (speakerId: string) => void;
  onCopyQuote?: (text: string) => void;
  onAddComment?: (segment: TranscriptSegmentDTO) => void;
  onAskAI?: (segment: TranscriptSegmentDTO) => void;
  className?: string;
}

export function getSpeakerColors(speakerId: string) {
  const palette = [
    {
      badge: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
      avatar: 'bg-indigo-600 text-white',
      accent: 'border-l-indigo-500',
    },
    {
      badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
      avatar: 'bg-emerald-600 text-white',
      accent: 'border-l-emerald-500',
    },
    {
      badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
      avatar: 'bg-amber-600 text-white',
      accent: 'border-l-amber-500',
    },
    {
      badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
      avatar: 'bg-rose-600 text-white',
      accent: 'border-l-rose-500',
    },
    {
      badge: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20',
      avatar: 'bg-cyan-600 text-white',
      accent: 'border-l-cyan-500',
    },
    {
      badge: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
      avatar: 'bg-purple-600 text-white',
      accent: 'border-l-purple-500',
    },
  ];

  let sum = 0;
  for (let i = 0; i < speakerId.length; i++) {
    sum += speakerId.charCodeAt(i);
  }
  const color = palette[sum % palette.length];
  return color ?? palette[0]!;
}

export const TranscriptSegment: React.FC<TranscriptSegmentProps> = ({
  segment,
  speakerName,
  currentTime: propCurrentTime,
  isActive: propIsActive,
  onSeek,
  onRenameSpeaker,
  onCopyQuote,
  onAddComment,
  onAskAI,
  className,
}) => {
  const [copied, setCopied] = useState(false);

  // Store connection for playback
  const storeCurrentTime = usePlayerStore((state) => state.currentTime);
  const storeActiveSegmentId = usePlayerStore((state) => state.activeSegmentId);
  const seek = usePlayerStore((state) => state.seek);

  const currentTime = propCurrentTime !== undefined ? propCurrentTime : storeCurrentTime;
  const isSegmentActive =
    propIsActive !== undefined
      ? propIsActive
      : storeActiveSegmentId === segment.id ||
        (currentTime >= segment.start_time && currentTime <= segment.end_time);

  const displayName = speakerName || segment.speaker_name || segment.speaker_label;
  const colors = getSpeakerColors(segment.speaker_label);

  const handleTimestampClick = () => {
    if (onSeek) {
      onSeek(segment.start_time);
    } else {
      seek(segment.start_time);
    }
  };

  const handleCopyQuote = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(segment.text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
      onCopyQuote?.(segment.text);
    } catch {
      // Fallback
      onCopyQuote?.(segment.text);
    }
  };

  return (
    <div
      data-testid={`transcript-segment-card-${segment.id}`}
      className={cn(
        'group relative rounded-2xl border border-border/60 bg-card/60 p-4 transition-all duration-200 border-l-4 hover:border-border hover:shadow-xs',
        colors.accent,
        isSegmentActive && 'bg-primary/5 border-primary/40 shadow-xs ring-1 ring-primary/20',
        className
      )}
    >
      {/* Header: Speaker Avatar, Name, Timestamp Link, and Actions Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        {/* Left: Speaker Identity & Timestamp Badge */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Speaker Avatar Circle */}
          <div
            className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0 select-none',
              colors.avatar
            )}
          >
            {displayName.slice(0, 2)}
          </div>

          {/* Speaker Name with Rename Button */}
          <div className="flex items-center gap-1.5">
            <span
              data-testid="speaker-display-name"
              className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-md border select-none',
                colors.badge
              )}
            >
              {displayName}
            </span>

            {onRenameSpeaker && (
              <button
                type="button"
                onClick={() => onRenameSpeaker(segment.speaker_label)}
                data-testid="rename-speaker-trigger"
                title={`Ubah nama ${segment.speaker_label}`}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Timestamp Badge / Jump to Audio */}
          <button
            type="button"
            data-testid="timestamp-badge"
            onClick={handleTimestampClick}
            title={`Putar mulai ${formatTime(segment.start_time)}`}
            className="flex items-center gap-1 text-[11px] font-mono font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer bg-muted/60 hover:bg-primary/10 px-2 py-0.5 rounded-full"
          >
            <Play className="w-2.5 h-2.5 fill-current" />
            <span>{formatTime(segment.start_time)}</span>
          </button>
        </div>

        {/* Right: Inline Hover Actions Toolbar */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          {/* Copy Quote Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleCopyQuote}
            data-testid="copy-quote-button"
            title={copied ? 'Kutipan disalin!' : 'Salin Kutipan'}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>

          {/* Add Comment Button */}
          {onAddComment && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onAddComment(segment)}
              data-testid="add-comment-button"
              title="Beri Komentar pada Ucapan Ini"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </Button>
          )}

          {/* Ask AI About This */}
          {onAskAI && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onAskAI(segment)}
              data-testid="ask-ai-button"
              title="Tanya AI Tentang Ucapan Ini"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Body: Synchronized Karaoke Word Highlighter */}
      <div className="pl-9">
        <KaraokeText
          segmentId={segment.id}
          text={segment.text}
          words={segment.words_data}
          currentTime={currentTime}
          isActiveSegment={isSegmentActive}
          className="text-foreground"
        />
      </div>
    </div>
  );
};
