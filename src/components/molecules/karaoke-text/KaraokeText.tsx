'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/stores/player.store';
import type { WordResultDTO } from '@/server/dtos/recording.dto';

export interface KaraokeTextProps {
  segmentId: string;
  text: string;
  words?: WordResultDTO[] | null;
  currentTime?: number;
  isActiveSegment?: boolean;
  onWordClick?: (word: WordResultDTO) => void;
  className?: string;
  autoScroll?: boolean;
}

export const KaraokeText: React.FC<KaraokeTextProps> = ({
  segmentId,
  text,
  words = [],
  currentTime: propCurrentTime,
  isActiveSegment: propIsActiveSegment,
  onWordClick,
  className,
  autoScroll,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Connect to Zustand player store
  const storeCurrentTime = usePlayerStore((state) => state.currentTime);
  const storeActiveSegmentId = usePlayerStore((state) => state.activeSegmentId);
  const storeIsAutoScrollEnabled = usePlayerStore((state) => state.isAutoScrollEnabled);
  const seek = usePlayerStore((state) => state.seek);
  const setActiveSegment = usePlayerStore((state) => state.setActiveSegment);

  const currentTime = propCurrentTime !== undefined ? propCurrentTime : storeCurrentTime;
  const isActiveSegment =
    propIsActiveSegment !== undefined
      ? propIsActiveSegment
      : storeActiveSegmentId === segmentId;
  const shouldAutoScroll =
    autoScroll !== undefined ? autoScroll : storeIsAutoScrollEnabled;

  const wordList: WordResultDTO[] = useMemo(() => words ?? [], [words]);

  // Auto-scroll when active
  useEffect(() => {
    if (isActiveSegment && shouldAutoScroll && containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [isActiveSegment, shouldAutoScroll]);

  // Synchronize active word index in store when active
  useEffect(() => {
    if (!isActiveSegment || wordList.length === 0) return;
    const activeIdx = wordList.findIndex(
      (w) => currentTime >= w.start && currentTime <= w.end
    );
    if (activeIdx !== -1) {
      setActiveSegment(segmentId, activeIdx);
    }
  }, [isActiveSegment, currentTime, wordList, segmentId, setActiveSegment]);

  // Handle word click
  const handleWordClick = (word: WordResultDTO) => {
    if (onWordClick) {
      onWordClick(word);
    } else {
      seek(word.start);
    }
  };

  // If no detailed words data, render simple text
  if (wordList.length === 0) {
    return (
      <div
        ref={containerRef}
        data-testid={`karaoke-segment-${segmentId}`}
        className={cn(
          'transition-colors duration-200 leading-relaxed text-sm md:text-base',
          isActiveSegment
            ? 'text-foreground font-medium bg-primary/5 rounded-md px-2 py-1'
            : 'text-muted-foreground',
          className
        )}
      >
        {text}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-testid={`karaoke-segment-${segmentId}`}
      className={cn(
        'transition-colors duration-200 leading-relaxed text-sm md:text-base flex flex-wrap gap-x-1 gap-y-1',
        isActiveSegment
          ? 'bg-primary/5 rounded-lg p-2 border border-primary/20 shadow-xs'
          : 'p-1',
        className
      )}
    >
      {wordList.map((wordObj, index) => {
        const isCurrentWord =
          isActiveSegment &&
          currentTime >= wordObj.start &&
          currentTime <= wordObj.end;

        const isPastWord =
          isActiveSegment && currentTime > wordObj.end;

        return (
          <button
            type="button"
            key={`${wordObj.start}-${wordObj.end}-${index}`}
            data-testid={`karaoke-word-${index}`}
            onClick={() => handleWordClick(wordObj)}
            title={`Jump to ${wordObj.start.toFixed(1)}s`}
            className={cn(
              'cursor-pointer px-1 py-0.5 rounded transition-all duration-150 inline-block text-left select-none text-sm md:text-base font-normal',
              isCurrentWord
                ? 'bg-primary text-primary-foreground font-bold shadow-xs scale-105 ring-2 ring-primary/40'
                : isPastWord
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            {wordObj.word}
          </button>
        );
      })}
    </div>
  );
};
