'use client';

import React from 'react';
import Link from 'next/link';
import { SpeakerSummaryDTO } from '@/server/dtos/workspace.dto';
import { Card, CardContent } from '@/components/atoms/card';
import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { cn } from '@/lib/utils';
import { Users, Calendar, Search, Mic } from 'lucide-react';
import { useTranslation } from '@/locales';

export interface SpeakerCardProps {
  speaker: SpeakerSummaryDTO;
  onClick?: (speaker: SpeakerSummaryDTO) => void;
  className?: string;
}

/**
 * Extracts 1-2 letter uppercase initials from speaker name.
 */
export function getSpeakerInitials(name: string): string {
  if (!name || !name.trim()) return 'SP';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return ((parts[0][0] || '') + (parts[parts.length - 1][0] || '')).toUpperCase();
}

/**
 * Generates a consistent pleasant avatar color based on speaker name.
 */
export function getAvatarColorClass(name: string): string {
  const colors = [
    'bg-blue-600 text-white',
    'bg-indigo-600 text-white',
    'bg-violet-600 text-white',
    'bg-emerald-600 text-white',
    'bg-teal-600 text-white',
    'bg-amber-600 text-white',
    'bg-rose-600 text-white',
    'bg-cyan-600 text-white',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * Formats talk time seconds into readable string with locale support.
 */
export function formatTalkDuration(seconds: number, locale: string = 'id'): string {
  if (locale === 'en') {
    if (!Number.isFinite(seconds) || seconds <= 0) return '0s';
    const totalSecs = Math.floor(seconds);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const remainingSecs = totalSecs % 60;

    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    if (minutes > 0) {
      return remainingSecs > 0 ? `${minutes}m ${remainingSecs}s` : `${minutes}m`;
    }
    return `${remainingSecs}s`;
  }

  if (!Number.isFinite(seconds) || seconds <= 0) return '0 dtk';
  const totalSecs = Math.floor(seconds);
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const remainingSecs = totalSecs % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours} jam ${minutes} mnt` : `${hours} jam`;
  }
  if (minutes > 0) {
    return remainingSecs > 0 ? `${minutes} mnt ${remainingSecs} dtk` : `${minutes} mnt`;
  }
  return `${remainingSecs} dtk`;
}

/**
 * Formats ISO date string to localized date format.
 */
export function formatLastActiveDate(dateString: string, locale: string = 'id'): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return '-';
  }
}

export const SpeakerCard: React.FC<SpeakerCardProps> = ({
  speaker,
  onClick,
  className = '',
}) => {
  const { t, locale } = useTranslation();
  const initials = getSpeakerInitials(speaker.name);
  const avatarClass = getAvatarColorClass(speaker.name);
  const formattedDuration = formatTalkDuration(speaker.total_talk_time, locale);
  const formattedLastActive = formatLastActiveDate(speaker.last_active, locale);
  const searchHref = `/dashboard?search=${encodeURIComponent(speaker.name)}`;

  return (
    <Card
      data-testid="speaker-card"
      className={cn(
        'group border border-border bg-card text-card-foreground hover:border-primary/50 hover:shadow-md transition-all duration-200 rounded-2xl overflow-hidden flex flex-col justify-between',
        className
      )}
    >
      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Top Header Row with Avatar & Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              data-testid="speaker-avatar"
              className={cn(
                'w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm tracking-tight shrink-0 shadow-xs ring-2 ring-card',
                avatarClass
              )}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <h3
                data-testid="speaker-name"
                className="font-bold text-base text-foreground group-hover:text-primary transition-colors truncate"
              >
                {speaker.name}
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                <span>{t('speakers.card.lastActive', { date: formattedLastActive })}</span>
              </p>
            </div>
          </div>

          <Badge
            variant="outline"
            className="text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 bg-primary/10 text-primary border-primary/20"
          >
            {t('speakers.card.meetingsCount', { count: speaker.total_meetings })}
          </Badge>
        </div>

        {/* Metric Badges / Stats Container */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="bg-muted/50 border border-border rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
              <Mic className="w-3.5 h-3.5 text-primary" />
              <span>{t('speakers.card.talkTime')}</span>
            </div>
            <div className="text-sm font-bold text-foreground truncate">
              {formattedDuration}
            </div>
          </div>

          <div className="bg-muted/50 border border-border rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
              <Users className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t('speakers.card.attendance')}</span>
            </div>
            <div className="text-sm font-bold text-foreground truncate">
              {t('speakers.card.attendanceMeetings', { count: speaker.total_meetings })}
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="flex items-center justify-between pt-1 border-t border-border">
          <span className="text-[11px] text-muted-foreground/60 font-mono">
            ID: {speaker.name.toLowerCase().replace(/\s+/g, '-')}
          </span>

          <Link href={searchHref} onClick={() => onClick?.(speaker)}>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary hover:text-primary/90 hover:bg-primary/10 gap-1.5 h-8 font-medium px-2.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{t('speakers.card.searchQuotes')}</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
