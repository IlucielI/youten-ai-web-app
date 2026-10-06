'use client';

import React from 'react';
import { formatTime } from '@/lib/time';
import { usePlayerStore } from '@/stores/player.store';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/atoms/tooltip';
import { PlayCircle, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CitationBadgeProps {
  timestamp: number;
  snippet?: string;
  recordingTitle?: string;
  onClick?: (timestamp: number) => void;
  className?: string;
}

export function CitationBadge({
  timestamp,
  snippet,
  recordingTitle,
  onClick,
  className,
}: CitationBadgeProps) {
  const formattedTime = formatTime(timestamp);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onClick) {
      onClick(timestamp);
    } else {
      usePlayerStore.getState().seek(timestamp);
    }
  };

  const badgeButton = (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary transition-all',
        'hover:bg-primary/20 hover:border-primary/50 hover:shadow-sm focus:outline-none focus:ring-1 focus:ring-primary active:scale-95 cursor-pointer',
        className
      )}
      data-testid="citation-badge"
      aria-label={`Loncat ke waktu ${formattedTime}`}
    >
      <PlayCircle className="h-3 w-3 shrink-0" />
      <span>[{formattedTime}]</span>
    </button>
  );

  if (!snippet && !recordingTitle) {
    return badgeButton;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{badgeButton}</TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs border-border/80 bg-popover/95 p-3 text-xs text-popover-foreground shadow-lg backdrop-blur-md"
          data-testid="citation-tooltip"
        >
          <div className="space-y-1.5">
            {recordingTitle && (
              <div className="font-semibold text-primary text-[11px] truncate">
                {recordingTitle}
              </div>
            )}
            {snippet && (
              <div className="flex items-start gap-1.5 text-muted-foreground leading-relaxed">
                <Quote className="h-3 w-3 shrink-0 text-primary/70 mt-0.5" />
                <span className="italic line-clamp-3">&ldquo;{snippet}&rdquo;</span>
              </div>
            )}
            <div className="text-[10px] text-primary/80 font-medium pt-1 border-t border-border/40">
              Klik untuk memutar dari [{formattedTime}]
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
