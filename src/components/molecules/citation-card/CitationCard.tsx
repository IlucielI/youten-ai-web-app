'use client';

import React from 'react';
import Link from 'next/link';
import { formatTime } from '@/lib/time';
import { MeetingSourceCitationDTO } from '@/server/dtos';
import { ExternalLink, Folder, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CitationCardProps {
  citation: MeetingSourceCitationDTO;
  className?: string;
}

export function CitationCard({ citation, className }: CitationCardProps) {
  const startTime = formatTime(citation.start_time);
  const endTime = formatTime(citation.end_time);
  const targetUrl = `/recordings/${citation.recording_id}?t=${Math.floor(citation.start_time)}`;

  return (
    <div
      data-testid="citation-card"
      className={cn(
        'group flex flex-col gap-1.5 rounded-lg border border-border/70 bg-card/60 p-2.5 text-xs transition-colors hover:border-primary/40 hover:bg-card/90',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Link
          href={targetUrl}
          data-testid="citation-title"
          className="flex items-center gap-1.5 font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
          title={citation.recording_title || 'Meeting recording'}
        >
          <PlayCircle className="h-3.5 w-3.5 shrink-0 text-primary/80 group-hover:text-primary" />
          <span className="truncate">{citation.recording_title || 'Meeting recording'}</span>
          <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
        <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
          {startTime} - {endTime}
        </span>
      </div>

      {citation.folder_name && (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Folder className="h-3 w-3 text-muted-foreground/70" />
          <span>{citation.folder_name}</span>
        </div>
      )}

      {citation.snippet && (
        <p className="line-clamp-2 text-[11px] text-muted-foreground/90 italic">
          &ldquo;{citation.snippet}&rdquo;
        </p>
      )}
    </div>
  );
}

