'use client';

import React from 'react';
import { HighlightDTO } from '@/server/dtos/recording.dto';
import { formatTime } from '@/lib/time';
import { cn } from '@/lib/utils';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import { Play, Sparkles, User, ExternalLink, Bookmark } from 'lucide-react';

export interface HighlightsGridProps {
  highlights: HighlightDTO[];
  currentTime?: number;
  onSeek?: (timestampSec: number) => void;
  className?: string;
}

export function HighlightsGrid({
  highlights,
  currentTime = 0,
  onSeek,
  className,
}: HighlightsGridProps) {
  if (!highlights || highlights.length === 0) {
    return (
      <div
        data-testid="empty-highlights-state"
        className={cn(
          'flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-border/80 bg-card/40 text-center',
          className
        )}
      >
        <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mb-3">
          <Bookmark className="h-5 w-5" />
        </div>
        <h4 className="text-sm font-semibold text-foreground">Belum Ada Sorotan</h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          Sorotan penting dan momen kunci percakapan akan otomatis dikurasi oleh AI atau dapat ditandai saat mendengarkan.
        </p>
      </div>
    );
  }

  // Sort chronologically by start_time
  const sortedHighlights = [...highlights].sort((a, b) => a.start_time - b.start_time);

  return (
    <div
      data-testid="highlights-grid"
      className={cn('space-y-3', className)}
    >
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1 mb-1">
        <span className="font-medium text-foreground">
          Sorotan Utama ({sortedHighlights.length})
        </span>
        <span>Momen kunci percakapan</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sortedHighlights.map((highlight, index) => {
          const isActive =
            currentTime >= highlight.start_time && currentTime < highlight.end_time;
          const isAiSource = highlight.source ? highlight.source.toLowerCase() === 'ai' : true;

          return (
            <div
              key={highlight.id || `highlight-${index}`}
              data-testid={`highlight-card-${highlight.id || index}`}
              className={cn(
                'group relative flex flex-col justify-between rounded-xl border p-4 transition-all duration-200',
                isActive
                  ? 'border-amber-500/60 bg-amber-500/5 shadow-sm ring-1 ring-amber-500/20'
                  : 'border-border/60 bg-card/60 hover:border-border hover:bg-card hover:shadow-xs'
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge
                    variant={isAiSource ? 'default' : 'secondary'}
                    className={cn(
                      'text-[10px] font-medium px-2 py-0.5 gap-1',
                      isAiSource
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        : 'bg-muted text-muted-foreground'
                    )}
                    data-testid={`highlight-source-badge-${highlight.id || index}`}
                  >
                    {isAiSource ? (
                      <>
                        <Sparkles className="h-3 w-3" />
                        AI Insight
                      </>
                    ) : (
                      <>
                        <User className="h-3 w-3" />
                        Manual Bookmark
                      </>
                    )}
                  </Badge>

                  <span className="text-[11px] font-mono text-muted-foreground">
                    {formatTime(highlight.start_time)} - {formatTime(highlight.end_time)}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {highlight.title || 'Sorotan Percakapan'}
                </h4>

                {highlight.note && (
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-3 leading-relaxed italic border-l-2 border-primary/30 pl-2.5 py-0.5">
                    &ldquo;{highlight.note}&rdquo;
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 mt-4 pt-2 border-t border-border/40">
                {highlight.clip_url ? (
                  <a
                    href={highlight.clip_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`highlight-clip-link-${highlight.id || index}`}
                    className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Unduh Klip
                  </a>
                ) : (
                  <span />
                )}

                {onSeek && (
                  <Button
                    type="button"
                    variant={isActive ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => onSeek(highlight.start_time)}
                    data-testid={`seek-highlight-btn-${highlight.id || index}`}
                    className="h-7 px-2.5 text-xs gap-1.5 transition-transform active:scale-95"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    <span>Dengarkan</span>
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
