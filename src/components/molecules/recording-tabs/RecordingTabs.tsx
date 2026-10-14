'use client';

import React from 'react';
import { TabsList, TabsTrigger } from '@/components/atoms/tabs';
import {
  FileText,
  UserCheck,
  ListOrdered,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/locales';

export type RecordingTabKey = 'summary' | 'transcript' | 'chapters' | 'analytics';

export interface RecordingTabsProps {
  activeTab: RecordingTabKey;
  onTabChange: (tab: RecordingTabKey) => void;
  segmentsCount?: number;
  chaptersCount?: number;
  className?: string;
}

export function RecordingTabs({
  onTabChange,
  segmentsCount,
  chaptersCount,
  className,
}: RecordingTabsProps) {
  const { t } = useTranslation();

  return (
    <TabsList
      data-testid="recording-tabs-list"
      className={cn(
        'bg-muted/70 p-1 rounded-xl h-auto gap-1 max-w-full overflow-x-auto flex items-center justify-start',
        className
      )}
    >
      <TabsTrigger
        value="summary"
        data-testid="tab-trigger-summary"
        onClick={() => onTabChange('summary')}
        className="flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 shrink-0"
      >
        <FileText className="w-3.5 h-3.5" />
        <span>{t('recording.tabs.summary')}</span>
      </TabsTrigger>

      <TabsTrigger
        value="transcript"
        data-testid="tab-trigger-transcript"
        onClick={() => onTabChange('transcript')}
        className="flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 shrink-0"
      >
        <UserCheck className="w-3.5 h-3.5" />
        <span>
          {t('recording.tabs.transcript')}
          {typeof segmentsCount === 'number' && segmentsCount > 0 ? ` (${segmentsCount})` : ''}
        </span>
      </TabsTrigger>

      <TabsTrigger
        value="chapters"
        data-testid="tab-trigger-chapters"
        onClick={() => onTabChange('chapters')}
        className="flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 shrink-0"
      >
        <ListOrdered className="w-3.5 h-3.5" />
        <span>
          {t('recording.tabs.chapters')}
          {typeof chaptersCount === 'number' && chaptersCount > 0 ? ` (${chaptersCount})` : ''}
        </span>
      </TabsTrigger>

      <TabsTrigger
        value="analytics"
        data-testid="tab-trigger-analytics"
        onClick={() => onTabChange('analytics')}
        className="flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 shrink-0"
      >
        <BarChart3 className="w-3.5 h-3.5" />
        <span>{t('recording.tabs.analytics')}</span>
      </TabsTrigger>
    </TabsList>
  );
}
