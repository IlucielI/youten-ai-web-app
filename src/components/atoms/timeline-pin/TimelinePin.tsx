'use client';

import React from 'react';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/time';

export interface TimelinePinProps {
  timestampSec: number;
  totalDurationSec: number;
  commentCount?: number;
  label?: string;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export function TimelinePin({
  timestampSec,
  totalDurationSec,
  commentCount = 1,
  label,
  isActive = false,
  onClick,
  className,
}: TimelinePinProps) {
  const percentage =
    totalDurationSec > 0
      ? Math.max(0, Math.min(100, (timestampSec / totalDurationSec) * 100))
      : 0;

  const formattedTime = formatTime(timestampSec);
  const ariaLabel = label
    ? `Komentar di ${formattedTime}: ${label}`
    : `Komentar di ${formattedTime}`;

  return (
    <div
      className={cn('absolute -top-1.5 -translate-x-1/2 z-20 group', className)}
      style={{ left: `${percentage}%` }}
      data-testid="timeline-pin-container"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        aria-label={ariaLabel}
        data-testid="timeline-pin-btn"
        className={cn(
          'relative flex items-center justify-center rounded-full transition-transform duration-200 outline-none',
          'hover:scale-125 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
          isActive
            ? 'h-5 w-5 bg-amber-500 text-amber-950 shadow-md shadow-amber-500/50 scale-110 ring-2 ring-amber-300'
            : 'h-4 w-4 bg-primary text-primary-foreground shadow-sm shadow-primary/30 hover:bg-primary/90'
        )}
      >
        <MessageSquare className={cn(isActive ? 'h-3 w-3' : 'h-2.5 w-2.5')} />
        {commentCount > 1 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground">
            {commentCount > 9 ? '9+' : commentCount}
          </span>
        )}
      </button>

      {/* Tooltip Hover Preview */}
      <div
        role="tooltip"
        className="pointer-events-none absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-30 whitespace-nowrap"
      >
        <div className="rounded-md bg-popover/95 border border-border px-2 py-1 text-[11px] font-medium text-popover-foreground shadow-lg backdrop-blur-sm max-w-xs truncate">
          <span className="font-mono text-primary mr-1">[{formattedTime}]</span>
          {label && <span className="text-muted-foreground truncate">{label}</span>}
        </div>
        <div className="h-1 w-2 -mt-[1px] border-x-4 border-x-transparent border-t-4 border-t-popover/95" />
      </div>
    </div>
  );
}
