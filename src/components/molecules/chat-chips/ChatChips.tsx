'use client';

import React from 'react';
import { Sparkles, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export const DEFAULT_CHAT_PROMPTS = [
  'Apa poin keputusan utama dalam rapat ini?',
  'Daftar semua tindak lanjut (action items) dan PIC',
  'Rangkum tenggat waktu dan komitmen yang dibahas',
  'Apakah ada isu atau blocker kritis yang belum terselesaikan?',
];

export interface ChatChipsProps {
  prompts?: string[];
  onSelectPrompt: (prompt: string) => void;
  className?: string;
  disabled?: boolean;
}

export function ChatChips({
  prompts = DEFAULT_CHAT_PROMPTS,
  onSelectPrompt,
  className,
  disabled = false,
}: ChatChipsProps) {
  if (!prompts || prompts.length === 0) return null;

  return (
    <div data-testid="chat-chips" className={cn('space-y-2', className)}>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span>Pertanyaan Cepat:</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {prompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectPrompt(prompt)}
            disabled={disabled}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card/60 px-3 py-1.5 text-left text-xs text-foreground/90 transition-all',
              'hover:bg-secondary/70 hover:border-primary/40 hover:text-foreground active:scale-98',
              'disabled:pointer-events-none disabled:opacity-50',
              'focus:outline-none focus:ring-1 focus:ring-primary'
            )}
            data-testid={`chat-chip-${idx}`}
          >
            <MessageSquare className="h-3 w-3 text-primary shrink-0 opacity-80" />
            <span className="line-clamp-1">{prompt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
