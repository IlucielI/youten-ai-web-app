'use client';

import React from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/atoms/input';
import { Button } from '@/components/atoms/button';

export interface TranscriptSearchProps {
  value: string;
  onChange: (value: string) => void;
  matchCount?: number;
  currentMatchIndex?: number;
  onNextMatch?: () => void;
  onPrevMatch?: () => void;
  onClear?: () => void;
  className?: string;
  placeholder?: string;
}

export const TranscriptSearch: React.FC<TranscriptSearchProps> = ({
  value,
  onChange,
  matchCount = 0,
  currentMatchIndex = 0,
  onNextMatch,
  onPrevMatch,
  onClear,
  className,
  placeholder = 'Cari kata atau frasa dalam transkripsi...',
}) => {
  const hasQuery = value.trim().length > 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        onPrevMatch?.();
      } else {
        onNextMatch?.();
      }
    } else if (e.key === 'Escape') {
      handleClear();
    }
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onChange('');
    }
  };

  return (
    <div
      data-testid="transcript-search-container"
      className={cn(
        'relative flex items-center w-full max-w-md rounded-xl border border-border/80 bg-background/90 shadow-xs focus-within:ring-2 focus-within:ring-ring/40 transition-all',
        className
      )}
    >
      <Search className="w-4 h-4 ml-3 text-muted-foreground shrink-0 pointer-events-none" />

      <Input
        data-testid="transcript-search-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="border-0 shadow-none focus-visible:ring-0 px-2.5 h-9 text-sm"
      />

      {hasQuery && (
        <div className="flex items-center gap-1 pr-2 shrink-0">
          {/* Match Counter Badge */}
          <span
            data-testid="search-match-counter"
            className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium"
          >
            {matchCount > 0
              ? `${currentMatchIndex + 1}/${matchCount}`
              : '0 hasil'}
          </span>

          {/* Prev / Next Match Controls */}
          {matchCount > 0 && (
            <div className="flex items-center">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onPrevMatch}
                title="Hasil sebelumnya (Shift+Enter)"
                data-testid="prev-match-button"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onNextMatch}
                title="Hasil berikutnya (Enter)"
                data-testid="next-match-button"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}

          {/* Clear Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            title="Hapus pencarian (Esc)"
            data-testid="clear-search-button"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
};
