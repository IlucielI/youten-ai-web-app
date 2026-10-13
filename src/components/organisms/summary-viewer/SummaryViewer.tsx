import React, { useMemo } from 'react';
import { TemplateKey } from '@/server/constants/template.constant';
import {
  MomStructuredDataSchema,
  OneOnOneStructuredDataSchema,
  InterviewStructuredDataSchema,
  TechReviewStructuredDataSchema,
  SalesDiscoveryStructuredDataSchema,
  DailyStandupStructuredDataSchema,
  GeneralStructuredDataSchema,
  PodcastStructuredDataSchema,
  LectureStructuredDataSchema,
  MusicLyricsStructuredDataSchema,
  ResearchDeepdiveStructuredDataSchema,
} from '@/server/schemas/summary.schema';
import {
  MomRenderer,
  OneOnOneRenderer,
  InterviewRenderer,
  TechReviewRenderer,
  SalesDiscoveryRenderer,
  DailyStandupRenderer,
  GeneralRenderer,
  PodcastRenderer,
  LectureRenderer,
  MusicLyricsRenderer,
  ResearchDeepdiveRenderer,
  MarkdownFallback,
} from './renderers';
import { Skeleton } from '@/components/atoms/skeleton';
import { Sparkles, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/locales';

export interface SummaryData {
  id?: string;
  version?: number;
  template_category: string;
  custom_angle?: string | null;
  structured_data?: Record<string, unknown> | null;
  markdown_content?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface SummaryViewerProps {
  summary?: SummaryData | null;
  isLoading?: boolean;
  className?: string;
}

export function SummaryViewer({ summary, isLoading = false, className }: SummaryViewerProps) {
  const { t } = useTranslation();

  // Polymorphic Schema Matching & Rendering (Called before any early returns to respect Rules of Hooks)
  const renderedContent = useMemo(() => {
    if (isLoading || !summary) return null;

    const { template_category, structured_data, markdown_content } = summary;
    let rawData: Record<string, unknown> =
      structured_data && typeof structured_data === 'object' ? structured_data : {};

    // Auto-parse fallback: If structured_data is empty or missing, but markdown_content contains JSON
    if (Object.keys(rawData).length === 0 && markdown_content) {
      const trimmed = markdown_content.trim();
      if (
        (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('```json') && trimmed.includes('{')) ||
        (trimmed.startsWith('```') && trimmed.includes('{'))
      ) {
        try {
          const jsonStr = trimmed.startsWith('```')
            ? trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
            : trimmed;
          const parsedJSON = JSON.parse(jsonStr);
          if (parsedJSON && typeof parsedJSON === 'object' && !Array.isArray(parsedJSON)) {
            rawData = parsedJSON as Record<string, unknown>;
          }
        } catch {
          // ignore parsing error, retain original rawData
        }
      }
    }

    const normalizedCategory = (template_category || '').trim().toUpperCase();

    switch (normalizedCategory) {
      case TemplateKey.MOM: {
        const parsed = MomStructuredDataSchema.safeParse(rawData);
        if (parsed.success) {
          return <MomRenderer data={parsed.data} />;
        }
        break;
      }

      case TemplateKey.ONE_ON_ONE: {
        const parsed = OneOnOneStructuredDataSchema.safeParse(rawData);
        if (parsed.success) {
          return <OneOnOneRenderer data={parsed.data} />;
        }
        break;
      }

      case TemplateKey.INTERVIEW: {
        const parsed = InterviewStructuredDataSchema.safeParse(rawData);
        if (parsed.success) {
          return <InterviewRenderer data={parsed.data} />;
        }
        break;
      }

      case TemplateKey.TECH_REVIEW: {
        const parsed = TechReviewStructuredDataSchema.safeParse(rawData);
        if (parsed.success) {
          return <TechReviewRenderer data={parsed.data} />;
        }
        break;
      }

      case TemplateKey.SALES_DISCOVERY: {
        const parsed = SalesDiscoveryStructuredDataSchema.safeParse(rawData);
        if (parsed.success) {
          return <SalesDiscoveryRenderer data={parsed.data} />;
        }
        break;
      }

      case TemplateKey.DAILY_STANDUP: {
        const parsed = DailyStandupStructuredDataSchema.safeParse(rawData);
        if (parsed.success) {
          return <DailyStandupRenderer data={parsed.data} />;
        }
        break;
      }

      case TemplateKey.GENERAL: {
        const parsed = GeneralStructuredDataSchema.safeParse(rawData);
        if (parsed.success) {
          return <GeneralRenderer data={parsed.data} />;
        }
        break;
      }

      case TemplateKey.PODCAST: {
        const parsed = PodcastStructuredDataSchema.safeParse(rawData);
        if (parsed.success) {
          return <PodcastRenderer data={parsed.data} />;
        }
        // Adaptive fallback: if rawData has executive_overview or core_themes, adapt it into Podcast format
        if (typeof rawData.executive_overview === 'string' || Array.isArray(rawData.core_themes)) {
          const adaptedPodcast = {
            episode_title:
              (rawData.episode_title as string) ||
              (rawData.title as string) ||
              'Ringkasan Episode Podcast',
            show_notes:
              (rawData.show_notes as string) || (rawData.executive_overview as string) || '',
            topic_chapters: Array.isArray(rawData.core_themes)
              ? (rawData.core_themes as Array<{ theme?: string; summary_points?: string[] }>).map(
                  (theme, i) => ({
                    timestamp: `Bagian ${i + 1}`,
                    topic: theme.theme || `Topik ${i + 1}`,
                    summary: Array.isArray(theme.summary_points)
                      ? theme.summary_points.join('\n')
                      : '',
                  })
                )
              : [],
            key_takeaways: Array.isArray(rawData.key_takeaways)
              ? (rawData.key_takeaways as string[])
              : [],
            golden_quotes: Array.isArray(rawData.notable_quotes)
              ? (
                  rawData.notable_quotes as Array<{
                    quote?: string;
                    speaker?: string;
                    context?: string;
                  }>
                ).map((q) => ({
                  quote: q.quote || '',
                  speaker: q.speaker || 'Pembicara',
                  context: q.context || '',
                }))
              : Array.isArray(rawData.golden_quotes)
              ? (rawData.golden_quotes as Array<{ quote: string; speaker: string; context?: string }>)
              : [],
            referenced_resources: Array.isArray(rawData.referenced_resources)
              ? (rawData.referenced_resources as unknown[]).map((r) => {
                  if (typeof r === 'string') return { title: r, type: 'referensi', description: '' };
                  if (typeof r === 'object' && r !== null)
                    return r as { title?: string; type?: string; description?: string };
                  return { title: String(r) };
                })
              : [],
          };
          const adaptedParsed = PodcastStructuredDataSchema.safeParse(adaptedPodcast);
          if (adaptedParsed.success) {
            return <PodcastRenderer data={adaptedParsed.data} />;
          }
        }
        break;
      }

      case TemplateKey.LECTURE: {
        const parsed = LectureStructuredDataSchema.safeParse(rawData);
        if (parsed.success) {
          return <LectureRenderer data={parsed.data} />;
        }
        break;
      }

      case TemplateKey.MUSIC_LYRICS: {
        const parsed = MusicLyricsStructuredDataSchema.safeParse(rawData);
        if (parsed.success) {
          return <MusicLyricsRenderer data={parsed.data} />;
        }
        break;
      }

      case TemplateKey.RESEARCH_DEEPDIVE: {
        const parsed = ResearchDeepdiveStructuredDataSchema.safeParse(rawData);
        if (parsed.success) {
          return <ResearchDeepdiveRenderer data={parsed.data} />;
        }
        break;
      }

      default:
        break;
    }

    // Failsafe Layer 2: Universal structured schema matching across known templates (specific templates prioritized first)
    const momParsed = MomStructuredDataSchema.safeParse(rawData);
    if (momParsed.success) {
      return <MomRenderer data={momParsed.data} />;
    }

    const interviewParsed = InterviewStructuredDataSchema.safeParse(rawData);
    if (interviewParsed.success) {
      return <InterviewRenderer data={interviewParsed.data} />;
    }

    const techParsed = TechReviewStructuredDataSchema.safeParse(rawData);
    if (techParsed.success) {
      return <TechReviewRenderer data={techParsed.data} />;
    }

    const salesParsed = SalesDiscoveryStructuredDataSchema.safeParse(rawData);
    if (salesParsed.success) {
      return <SalesDiscoveryRenderer data={salesParsed.data} />;
    }

    const standupParsed = DailyStandupStructuredDataSchema.safeParse(rawData);
    if (standupParsed.success) {
      return <DailyStandupRenderer data={standupParsed.data} />;
    }

    const podcastParsed = PodcastStructuredDataSchema.safeParse(rawData);
    if (podcastParsed.success) {
      return <PodcastRenderer data={podcastParsed.data} />;
    }

    const lectureParsed = LectureStructuredDataSchema.safeParse(rawData);
    if (lectureParsed.success) {
      return <LectureRenderer data={lectureParsed.data} />;
    }

    const musicParsed = MusicLyricsStructuredDataSchema.safeParse(rawData);
    if (musicParsed.success) {
      return <MusicLyricsRenderer data={musicParsed.data} />;
    }

    const researchParsed = ResearchDeepdiveStructuredDataSchema.safeParse(rawData);
    if (researchParsed.success) {
      return <ResearchDeepdiveRenderer data={researchParsed.data} />;
    }

    const generalParsed = GeneralStructuredDataSchema.safeParse(rawData);
    if (generalParsed.success) {
      return <GeneralRenderer data={generalParsed.data} />;
    }

    // Failsafe Layer 3: Markdown fallback (with automated JSON-to-markdown conversion)
    return (
      <MarkdownFallback
        content={markdown_content || ''}
        templateCategory={summary.template_category}
      />
    );
  }, [isLoading, summary]);

  // Skeleton Loading State
  if (isLoading) {
    return (
      <div data-testid="summary-viewer-loading" className={cn('space-y-4 p-4', className)}>
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // Empty State
  if (!summary) {
    return (
      <div
        data-testid="summary-viewer-empty"
        className={cn(
          'flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-12 text-center text-muted-foreground',
          className
        )}
      >
        <Sparkles className="h-10 w-10 text-muted-foreground/60 mb-3" />
        <h3 className="text-base font-semibold text-foreground">{t('recording.templates.emptyTitle')}</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          {t('recording.templates.emptyDesc')}
        </p>
      </div>
    );
  }

  return (
    <div data-testid="summary-viewer" className={cn('space-y-4 max-w-full min-w-0', className)}>
      {/* Custom Perspective Angle Banner */}
      {summary.custom_angle && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary max-w-full min-w-0">
          <Compass className="h-3.5 w-3.5 shrink-0" />
          <span className="font-medium shrink-0">{t('recording.templates.customAngleLabel')}</span>
          <span className="text-foreground/90 italic break-words min-w-0">&ldquo;{summary.custom_angle}&rdquo;</span>
        </div>
      )}

      {/* Main Rendered Content */}
      <div className="max-w-full min-w-0">
        {renderedContent}
      </div>
    </div>
  );
}
