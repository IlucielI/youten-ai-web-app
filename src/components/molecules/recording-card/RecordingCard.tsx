'use client';

import React from 'react';
import Link from 'next/link';
import { RecordingListItemDTO } from '@/server/dtos/recording.dto';
import { RecordingStatus } from '@/server/constants/recording.constant';
import { formatTime } from '@/lib/time';
import { Badge } from '@/components/atoms/badge';
import { StatusPill } from '@/components/molecules/status-pill';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import {
  Calendar,
  Clock,
  MoreVertical,
  ExternalLink,
  Share2,
  Trash2,
  FileAudio,
  HardDrive,
} from 'lucide-react';
import { useTranslation } from '@/locales';

export interface RecordingCardProps {
  recording: RecordingListItemDTO;
  onShare?: (recording: RecordingListItemDTO) => void;
  onDelete?: (recording: RecordingListItemDTO) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export const templateLabels: Record<string, string> = {
  GENERAL: 'Executive Brief',
  MOM: 'Notulen Rapat (MoM)',
  '1_ON_1': '1-on-1 Review',
  DAILY_STANDUP: 'Daily Standup',
  TECH_REVIEW: 'Tech Architecture',
  SALES_DISCOVERY: 'Sales Discovery',
  INTERVIEW: 'Interview Scorecard',
  PODCAST: 'Podcast & Talkshow',
  LECTURE: 'Lecture & Webinar',
  MUSIC_LYRICS: 'Music Lyrics',
  RESEARCH_DEEPDIVE: 'Research Deep Dive',
};

export const enTemplateLabels: Record<string, string> = {
  GENERAL: 'Executive Brief',
  MOM: 'Minutes of Meeting (MoM)',
  '1_ON_1': '1-on-1 Review',
  DAILY_STANDUP: 'Daily Standup',
  TECH_REVIEW: 'Tech Architecture',
  SALES_DISCOVERY: 'Sales Discovery',
  INTERVIEW: 'Interview Scorecard',
  PODCAST: 'Podcast & Talkshow',
  LECTURE: 'Lecture & Webinar',
  MUSIC_LYRICS: 'Music Lyrics',
  RESEARCH_DEEPDIVE: 'Research Deep Dive',
};

export function getStatusPillConfig(status: string): {
  label: string;
  status: 'online' | 'busy' | 'offline' | 'warning';
} {
  switch (status) {
    case RecordingStatus.COMPLETED:
      return { label: 'Selesai', status: 'online' };
    case RecordingStatus.FAILED:
      return { label: 'Gagal', status: 'warning' };
    case RecordingStatus.QUEUED:
      return { label: 'Antrean', status: 'offline' };
    case RecordingStatus.PENDING:
      return { label: 'Tertunda', status: 'offline' };
    default:
      return { label: 'Memproses', status: 'busy' };
  }
}

export const RecordingCard: React.FC<RecordingCardProps> = ({
  recording,
  onShare,
  onDelete,
  open,
  onOpenChange,
  className = '',
}) => {
  const { t, locale } = useTranslation();
  const rawPillConfig = getStatusPillConfig(recording.status);
  const pillConfig = {
    label:
      locale === 'en'
        ? recording.status === RecordingStatus.COMPLETED
          ? t('dashboard.statusLabels.completed')
          : recording.status === RecordingStatus.FAILED
          ? t('dashboard.statusLabels.failed')
          : recording.status === RecordingStatus.QUEUED
          ? t('dashboard.statusLabels.queued')
          : t('dashboard.statusLabels.processing')
        : rawPillConfig.label,
    status: rawPillConfig.status,
  };
  const templateName =
    locale === 'en'
      ? enTemplateLabels[recording.selected_template] || templateLabels[recording.selected_template] || recording.selected_template
      : templateLabels[recording.selected_template] || recording.selected_template;
  const fileSizeDisplay =
    recording.file_size_bytes > 0
      ? `${(recording.file_size_bytes / (1024 * 1024)).toFixed(1)} MB`
      : '-';

  const formattedDate = new Date(recording.created_at).toLocaleDateString(
    locale === 'en' ? 'en-US' : 'id-ID',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  );

  return (
    <div
      data-testid={`recording-card-${recording.id}`}
      className={`group bg-card text-card-foreground rounded-2xl border border-border hover:border-primary/60 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between p-5 relative overflow-hidden ${className}`}
    >
      {/* Top Header: Template & Menu */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <Badge
          variant="secondary"
          className="text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20"
        >
          {templateName}
        </Badge>

        <DropdownMenu open={open} onOpenChange={onOpenChange}>
          <DropdownMenuTrigger
            aria-label={`Menu pilihan untuk ${recording.title}`}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none"
          >
            <MoreVertical className="w-4 h-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 border-border bg-popover text-popover-foreground">
            <DropdownMenuItem asChild>
              <Link
                href={`/recordings/${recording.id}`}
                className="flex items-center gap-2 cursor-pointer text-foreground hover:bg-muted"
              >
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
                <span>{t('dashboard.table.viewDetail')}</span>
              </Link>
            </DropdownMenuItem>
            {onShare && (
              <DropdownMenuItem
                onClick={() => onShare(recording)}
                className="flex items-center gap-2 cursor-pointer text-foreground hover:bg-muted"
              >
                <Share2 className="w-4 h-4 text-muted-foreground" />
                <span>{t('dashboard.table.share')}</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-border" />
            {onDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(recording)}
                className="flex items-center gap-2 text-destructive focus:text-destructive hover:bg-destructive/10 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
                <span>{t('dashboard.table.delete')}</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Info */}
      <div className="space-y-2 mb-4 flex-1">
        <Link
          href={`/recordings/${recording.id}`}
          className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 text-base leading-snug"
        >
          {recording.title || recording.original_filename}
        </Link>
        <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
          <FileAudio className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="truncate">{recording.original_filename}</span>
        </p>
      </div>

      {/* Metadata footer */}
      <div className="pt-3 border-t border-border/80 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            {formatTime(recording.duration_seconds)}
          </span>
          <span className="flex items-center gap-1">
            <HardDrive className="w-3.5 h-3.5 text-muted-foreground" />
            {fileSizeDisplay}
          </span>
          <span className="hidden sm:flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            {formattedDate}
          </span>
        </div>

        <div>
          <StatusPill label={pillConfig.label} status={pillConfig.status} />
        </div>
      </div>
    </div>
  );
};
