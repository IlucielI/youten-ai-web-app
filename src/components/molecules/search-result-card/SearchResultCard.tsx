'use client';

import React from 'react';
import Link from 'next/link';
import { SearchResultItemDTO } from '@/server/dtos/workspace.dto';
import { Card, CardContent } from '@/components/atoms/card';
import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { formatTime } from '@/lib/time';
import { cn } from '@/lib/utils';
import { FileText, PlayCircle, Sparkles, ExternalLink } from 'lucide-react';

export interface SearchResultCardProps {
  result: SearchResultItemDTO;
  onClick?: (result: SearchResultItemDTO) => void;
  className?: string;
}

export function getScoreBadgeConfig(score: number): { label: string; className: string } {
  const percentage = Math.round(score > 1 ? score : score * 100);
  if (percentage >= 85) {
    return {
      label: `${percentage}% Relevan`,
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    };
  }
  if (percentage >= 70) {
    return {
      label: `${percentage}% Relevan`,
      className: 'bg-blue-50 text-blue-700 border-blue-200/80',
    };
  }
  return {
    label: `${percentage}% Relevan`,
    className: 'bg-amber-50 text-amber-700 border-amber-200/80',
  };
}

export const SearchResultCard: React.FC<SearchResultCardProps> = ({
  result,
  onClick,
  className = '',
}) => {
  const scoreBadge = getScoreBadgeConfig(result.score);
  const timeRange = `${formatTime(result.start_time)} - ${formatTime(result.end_time)}`;
  const recordingHref = `/recordings/${result.recording_id}?t=${Math.floor(result.start_time)}`;

  return (
    <Card
      className={cn(
        'group border border-slate-200/80 bg-white hover:border-blue-300/80 hover:shadow-md transition-all duration-200 rounded-2xl overflow-hidden',
        className
      )}
      data-testid="search-result-card"
    >
      <CardContent className="p-5 sm:p-6 space-y-3.5">
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center shrink-0 text-blue-600">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <Link
                href={recordingHref}
                onClick={() => onClick?.(result)}
                className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-blue-600 transition-colors truncate block"
              >
                {result.recording_title}
              </Link>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                  <PlayCircle className="w-3 h-3 text-slate-400" />
                  {timeRange}
                </span>
                <span>•</span>
                <span>Bagian #{result.chunk_index + 1}</span>
              </div>
            </div>
          </div>

          {/* Relevance Badge */}
          <Badge
            variant="outline"
            className={cn('text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 flex items-center gap-1', scoreBadge.className)}
          >
            <Sparkles className="w-3 h-3" />
            {scoreBadge.label}
          </Badge>
        </div>

        {/* Snippet Block */}
        <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3.5 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans relative">
          <p className="line-clamp-3 italic text-slate-600">
            &ldquo;{result.snippet}&rdquo;
          </p>
        </div>

        {/* Card Footer / Action */}
        <div className="flex items-center justify-end pt-1">
          <Link href={recordingHref} onClick={() => onClick?.(result)}>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1.5 h-8 font-medium"
            >
              <span>Buka di Rekaman</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
