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
} from '@/server/schemas/summary.schema';
import {
  MomRenderer,
  OneOnOneRenderer,
  InterviewRenderer,
  TechReviewRenderer,
  SalesDiscoveryRenderer,
  DailyStandupRenderer,
  GeneralRenderer,
  MarkdownFallback,
} from './renderers';
import { Skeleton } from '@/components/atoms/skeleton';
import { Sparkles, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  // Polymorphic Schema Matching & Rendering (Called before any early returns to respect Rules of Hooks)
  const renderedContent = useMemo(() => {
    if (isLoading || !summary) return null;

    const { template_category, structured_data, markdown_content } = summary;
    const rawData = structured_data || {};

    switch (template_category) {
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

      default:
        break;
    }

    // Fallback to Markdown
    return (
      <MarkdownFallback
        content={markdown_content || ''}
        templateCategory={template_category}
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
        <h3 className="text-base font-semibold text-foreground">Belum Ada Ringkasan</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Ringkasan otomatis untuk rekaman ini belum selesai diproses atau belum di-generate.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="summary-viewer" className={cn('space-y-4', className)}>
      {/* Custom Perspective Angle Banner */}
      {summary.custom_angle && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
          <Compass className="h-3.5 w-3.5 shrink-0" />
          <span className="font-medium">Sudut Pandang Khusus:</span>
          <span className="text-foreground/90 italic truncate">&ldquo;{summary.custom_angle}&rdquo;</span>
        </div>
      )}

      {/* Main Rendered Content */}
      {renderedContent}
    </div>
  );
}
