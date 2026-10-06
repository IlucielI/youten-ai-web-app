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
  const pillConfig = getStatusPillConfig(recording.status);
  const templateName = templateLabels[recording.selected_template] || recording.selected_template;
  const fileSizeMb = (recording.file_size_bytes / (1024 * 1024)).toFixed(1);

  const formattedDate = new Date(recording.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      data-testid={`recording-card-${recording.id}`}
      className={`group bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between p-5 relative overflow-hidden ${className}`}
    >
      {/* Top Header: Template & Menu */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <Badge
          variant="secondary"
          className="text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60"
        >
          {templateName}
        </Badge>

        <DropdownMenu open={open} onOpenChange={onOpenChange}>
          <DropdownMenuTrigger
            aria-label={`Menu pilihan untuk ${recording.title}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none"
          >
            <MoreVertical className="w-4 h-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem asChild>
              <Link
                href={`/recordings/${recording.id}`}
                className="flex items-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-slate-500" />
                <span>Buka Detail</span>
              </Link>
            </DropdownMenuItem>
            {onShare && (
              <DropdownMenuItem
                onClick={() => onShare(recording)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-slate-500" />
                <span>Bagikan</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {onDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(recording)}
                className="flex items-center gap-2 text-rose-600 focus:text-rose-700 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-500" />
                <span>Hapus Rekaman</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Info */}
      <div className="space-y-2 mb-4 flex-1">
        <Link
          href={`/recordings/${recording.id}`}
          className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 text-base leading-snug"
        >
          {recording.title || recording.original_filename}
        </Link>
        <p className="text-xs text-slate-400 truncate flex items-center gap-1.5">
          <FileAudio className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{recording.original_filename}</span>
        </p>
      </div>

      {/* Metadata footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {formatTime(recording.duration_seconds)}
          </span>
          <span className="flex items-center gap-1">
            <HardDrive className="w-3.5 h-3.5 text-slate-400" />
            {fileSizeMb} MB
          </span>
          <span className="hidden sm:flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
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
