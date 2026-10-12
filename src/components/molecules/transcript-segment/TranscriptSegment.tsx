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
import { useTranslation } from '@/locales';

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
  onSaveText?: (segmentId: string, newText: string) => Promise<void> | void;
  className?: string;
}

export function getSpeakerColors(speakerId?: string) {
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
    {
      badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
      avatar: 'bg-sky-600 text-white',
      accent: 'border-l-sky-500',
    },
    {
      badge: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20',
      avatar: 'bg-teal-600 text-white',
      accent: 'border-l-teal-500',
    },
    {
      badge: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20',
      avatar: 'bg-orange-600 text-white',
      accent: 'border-l-orange-500',
    },
    {
      badge: 'bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20',
      avatar: 'bg-pink-600 text-white',
      accent: 'border-l-pink-500',
    },
    {
      badge: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20',
      avatar: 'bg-violet-600 text-white',
      accent: 'border-l-violet-500',
    },
    {
      badge: 'bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/20',
      avatar: 'bg-fuchsia-600 text-white',
      accent: 'border-l-fuchsia-500',
    },
    {
      badge: 'bg-lime-500/10 text-lime-700 dark:text-lime-300 border-lime-500/20',
      avatar: 'bg-lime-600 text-white',
      accent: 'border-l-lime-500',
    },
    {
      badge: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20',
      avatar: 'bg-yellow-600 text-white',
      accent: 'border-l-yellow-500',
    },
    {
      badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
      avatar: 'bg-blue-600 text-white',
      accent: 'border-l-blue-500',
    },
    {
      badge: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
      avatar: 'bg-slate-600 text-white',
      accent: 'border-l-slate-500',
    },
  ];

  const safeId = (speakerId || 'speaker_0').trim();
  const numMatch = safeId.match(/(?:speaker|pembicara)[_\s]*(\d+)/i);
  if (numMatch && numMatch[1]) {
    const idx = parseInt(numMatch[1], 10);
    return palette[idx % palette.length]!;
  }

  let sum = 0;
  for (let i = 0; i < safeId.length; i++) {
    sum += safeId.charCodeAt(i);
  }
  return palette[sum % palette.length] ?? palette[0]!;
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
  onSaveText,
  className,
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(segment.text);
  const [isSaving, setIsSaving] = useState(false);

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

  const displayName = speakerName || segment.speaker_name || segment.speaker_label || t('recording.analytics.participants');
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

  const handleSaveEdit = async () => {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === segment.text) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      if (onSaveText) {
        await onSaveText(segment.id, trimmed);
      }
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save segment text', err);
    } finally {
      setIsSaving(false);
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
                title={t('recording.speakerRename.title')}
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
            title={t('recording.transcript.playFrom', { time: formatTime(segment.start_time) })}
            aria-label={t('recording.transcript.listenFrom', { time: formatTime(segment.start_time) })}
            className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/90 hover:text-primary hover:bg-primary/10 hover:border-primary/30 transition-all cursor-pointer px-2.5 py-0.5 rounded-full shadow-2xs"
          >
            <Play className="w-2.5 h-2.5 fill-current shrink-0 text-primary" />
            <span>{formatTime(segment.start_time)}</span>
          </button>
        </div>

        {/* Right: Inline Hover Actions Toolbar */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          {/* Edit Transcript Button */}
          {onSaveText && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsEditing(true);
                setEditText(segment.text);
              }}
              data-testid="edit-segment-button"
              title={t('recording.transcript.editButton')}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}

          {/* Copy Quote Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleCopyQuote}
            data-testid="copy-quote-button"
            title={copied ? t('recording.transcript.quoteCopied') : t('recording.transcript.copyQuote')}
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
              title={t('recording.transcript.addComment')}
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
              title={t('recording.transcript.askAiAboutThis')}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Body: Synchronized Karaoke Word Highlighter or Inline Editor */}
      <div className="pl-9">
        {isEditing ? (
          <div className="space-y-2 mt-1">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={3}
              data-testid="edit-segment-textarea"
              className="w-full text-sm rounded-lg border border-primary/40 bg-background/90 p-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-y"
              placeholder={t('recording.transcript.editTextPlaceholder')}
              autoFocus
            />
            <div className="flex items-center gap-2 justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                className="h-7 text-xs px-2.5"
              >
                {t('recording.transcript.cancelEdit')}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveEdit}
                disabled={isSaving || !editText.trim()}
                data-testid="save-segment-edit-button"
                className="h-7 text-xs px-3"
              >
                {isSaving ? t('recording.transcript.savingEdit') : t('recording.transcript.saveEdit')}
              </Button>
            </div>
          </div>
        ) : (
          <KaraokeText
            segmentId={segment.id}
            text={segment.text}
            words={segment.words_data}
            currentTime={currentTime}
            isActiveSegment={isSegmentActive}
            className="text-foreground"
          />
        )}
      </div>
    </div>
  );
};
