'use client';

import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/atoms/input';
import { TranscriptSegment } from '@/components/molecules/transcript-segment';
import { useTranslation } from '@/locales';
import { cn } from '@/lib/utils';
import type { TranscriptSegmentDTO } from '@/server/dtos/recording.dto';

export interface TranscriptCanvasProps {
  segments?: TranscriptSegmentDTO[];
  speakerLabels: Record<string, string>;
  currentTime: number;
  onSeek: (time: number) => void;
  onRenameSpeaker: (speakerLabel: string) => void;
  onAddComment: (segment: TranscriptSegmentDTO) => void;
  onAskAI: (segment: TranscriptSegmentDTO) => void;
  onSaveText: (segmentId: string, newText: string) => Promise<void>;
  className?: string;
}

export const TranscriptCanvas: React.FC<TranscriptCanvasProps> = ({
  segments = [],
  speakerLabels,
  currentTime,
  onSeek,
  onRenameSpeaker,
  onAddComment,
  onAskAI,
  onSaveText,
  className,
}) => {
  const { t } = useTranslation();
  const [transcriptSearch, setTranscriptSearch] = useState<string>('');

  const filteredSegments = useMemo(() => {
    if (!segments || segments.length === 0) return [];
    if (!transcriptSearch.trim()) return segments;

    const query = transcriptSearch.trim().toLowerCase();
    return segments.filter(
      (s) =>
        s.text.toLowerCase().includes(query) ||
        (speakerLabels[s.speaker_label] || s.speaker_name || s.speaker_label || '')
          .toLowerCase()
          .includes(query)
    );
  }, [segments, transcriptSearch, speakerLabels]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search transcript input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          placeholder={t('recording.transcript.searchPlaceholder')}
          value={transcriptSearch}
          onChange={(e) => setTranscriptSearch(e.target.value)}
          data-testid="transcript-search-input"
          className="pl-9 text-xs"
        />
      </div>

      {/* Transcript Segments List */}
      <div data-testid="transcript-segments-list" className="space-y-4">
        {filteredSegments.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-xl bg-card/40 text-muted-foreground text-xs">
            {t('recording.transcript.emptySearch')}
          </div>
        ) : (
          filteredSegments.map((segment) => {
            const isActive =
              currentTime >= segment.start_time && currentTime <= segment.end_time;
            const speakerLabel =
              speakerLabels[segment.speaker_label] || segment.speaker_name || segment.speaker_label;

            return (
              <TranscriptSegment
                key={segment.id}
                segment={segment}
                speakerName={speakerLabel}
                currentTime={currentTime}
                isActive={isActive}
                onSeek={onSeek}
                onRenameSpeaker={onRenameSpeaker}
                onAddComment={onAddComment}
                onAskAI={onAskAI}
                onSaveText={onSaveText}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

