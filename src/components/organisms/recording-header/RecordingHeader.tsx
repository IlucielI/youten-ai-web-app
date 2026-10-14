'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, Share2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { ExportMenu } from '@/components/molecules/export-menu';
import { ExportFormat } from '@/server/constants/recording.constant';
import { formatTime } from '@/lib/time';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/locales';

export interface RecordingHeaderProps {
  id: string;
  title: string;
  selectedTemplate: string;
  durationSeconds: number;
  createdAt: string;
  backHref?: string;
  backLabel?: string;
  showShare?: boolean;
  onOpenShare?: () => void;
  showExport?: boolean;
  onExport?: (format: ExportFormat) => Promise<void> | void;
  isExportOpen?: boolean;
  onExportOpenChange?: (open: boolean) => void;
  isPro?: boolean;
  exportVersion?: number;
  showAskAi?: boolean;
  isChatOpen?: boolean;
  onToggleChat?: () => void;
  rightSlot?: React.ReactNode;
  className?: string;
  onUpgradePrompt?: () => void;
}

export function RecordingHeader({
  id,
  title,
  selectedTemplate,
  durationSeconds,
  createdAt,
  backHref = '/',
  backLabel,
  showShare = true,
  onOpenShare,
  showExport = true,
  onExport,
  isExportOpen,
  onExportOpenChange,
  isPro = false,
  exportVersion,
  showAskAi = true,
  isChatOpen = false,
  onToggleChat,
  rightSlot,
  className,
  onUpgradePrompt,
}: RecordingHeaderProps) {
  const { t, locale } = useTranslation();

  return (
    <header
      data-testid="recording-header-toolbar"
      className={cn(
        'border-b border-border/80 bg-background/80 backdrop-blur-md sticky top-0 z-20',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Breadcrumbs, Title, Badges */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link
              href={backHref}
              data-testid="back-to-home-link"
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{backLabel || t('recording.header.backToHome')}</span>
            </Link>
            <span>•</span>
            <span className="font-mono text-[11px] truncate max-w-[140px]">
              ID: {id}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <h1
              data-testid="recording-title"
              className="text-lg sm:text-xl md:text-2xl font-bold text-foreground tracking-tight truncate max-w-xl"
            >
              {title}
            </h1>

            <Badge variant="outline" className="text-xs font-medium uppercase tracking-wider">
              {selectedTemplate}
            </Badge>

            <Badge variant="secondary" className="text-xs font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span>{formatTime(durationSeconds)}</span>
            </Badge>

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {new Date(createdAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Right Action Toolbar */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          {/* Share Button */}
          {showShare && onOpenShare && (
            <Button
              variant="outline"
              size="sm"
              data-testid="open-share-dialog-btn"
              onClick={onOpenShare}
              className="gap-1.5 text-xs font-medium"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{t('recording.header.share')}</span>
            </Button>
          )}

          {/* Export Menu */}
          {showExport && onExport && (
            <ExportMenu
              recordingId={id}
              currentVersion={exportVersion}
              onExport={onExport}
              open={isExportOpen}
              onOpenChange={onExportOpenChange}
              isPro={isPro}
              onUpgradePrompt={onUpgradePrompt}
            />
          )}

          {/* AI Assistant Chat Panel Toggle */}
          {showAskAi && onToggleChat && (
            <Button
              variant={isChatOpen ? 'default' : 'secondary'}
              size="sm"
              data-testid="toggle-chat-panel-btn"
              onClick={onToggleChat}
              className="gap-1.5 text-xs font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('recording.header.askAi')}</span>
            </Button>
          )}

          {rightSlot}
        </div>
      </div>
    </header>
  );
}
