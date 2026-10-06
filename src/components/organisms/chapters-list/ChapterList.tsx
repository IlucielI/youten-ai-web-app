'use client';

import React from 'react';
import { ChapterDTO } from '@/server/dtos/recording.dto';
import { formatTime } from '@/lib/time';
import { cn } from '@/lib/utils';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import { Play, BookOpen, Clock } from 'lucide-react';

export interface ChapterListProps {
  chapters: ChapterDTO[];
  currentTime?: number;
  onSeek?: (timestampSec: number) => void;
  className?: string;
}

export function ChapterList({
  chapters,
  currentTime = 0,
  onSeek,
  className,
}: ChapterListProps) {
  if (!chapters || chapters.length === 0) {
    return (
      <div
        data-testid="empty-chapters-state"
        className={cn(
          'flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-border/80 bg-card/40 text-center',
          className
        )}
      >
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
          <BookOpen className="h-5 w-5" />
        </div>
        <h4 className="text-sm font-semibold text-foreground">Belum Ada Bab</h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          Bab percakapan akan dibuat secara otomatis setelah transkrip selesai dianalisis oleh AI.
        </p>
      </div>
    );
  }

  // Sort by sequence_order or start_time
  const sortedChapters = [...chapters].sort((a, b) => {
    if (a.sequence_order !== b.sequence_order) {
      return a.sequence_order - b.sequence_order;
    }
    return a.start_time - b.start_time;
  });

  return (
    <div
      data-testid="chapter-list"
      className={cn('space-y-3', className)}
    >
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1 mb-1">
        <span className="font-medium text-foreground">
          Daftar Bab ({sortedChapters.length})
        </span>
        <span>Klik untuk melompat ke bab terkait</span>
      </div>

      <div className="space-y-2.5">
        {sortedChapters.map((chapter, index) => {
          const isActive =
            currentTime >= chapter.start_time && currentTime < chapter.end_time;
          const duration = Math.max(0, chapter.end_time - chapter.start_time);

          return (
            <div
              key={chapter.id || `chapter-${index}`}
              data-testid={`chapter-item-${chapter.id || index}`}
              className={cn(
                'group relative rounded-xl border p-4 transition-all duration-200',
                isActive
                  ? 'border-primary/60 bg-primary/5 shadow-sm ring-1 ring-primary/20'
                  : 'border-border/60 bg-card/60 hover:border-border hover:bg-card hover:shadow-xs'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <Badge
                      variant={isActive ? 'default' : 'secondary'}
                      className="text-[11px] font-mono px-2 py-0.5"
                    >
                      {formatTime(chapter.start_time)} - {formatTime(chapter.end_time)}
                    </Badge>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTime(duration)}
                    </span>
                    {isActive && (
                      <span
                        data-testid="active-chapter-indicator"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        Sedang Diputar
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {chapter.title}
                  </h4>

                  {chapter.summary && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {chapter.summary}
                    </p>
                  )}
                </div>

                {onSeek && (
                  <Button
                    type="button"
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onSeek(chapter.start_time)}
                    data-testid={`seek-chapter-btn-${chapter.id || index}`}
                    className="shrink-0 h-8 px-2.5 text-xs gap-1.5 transition-transform active:scale-95"
                    title={`Lompat ke ${chapter.title}`}
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Putar</span>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
