import React from 'react';
import type { GeneralStructuredData } from '@/server/schemas/summary.schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card';
import { Badge } from '@/components/atoms/badge';
import { FileText, CheckCircle2, Quote, Layers, Link as LinkIcon, ShieldAlert, ListTodo } from 'lucide-react';
import { DiscussionTopicsSection } from './discussion-topics-section';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/locales';

export interface GeneralRendererProps {
  data: GeneralStructuredData;
  className?: string;
}

export function GeneralRenderer({ data, className }: GeneralRendererProps) {
  const { t } = useTranslation();

  return (
    <div
      data-testid="general-summary-renderer"
      className={cn('space-y-6 text-foreground max-w-full min-w-0', className)}
    >
      {/* Executive Overview */}
      <div className="rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur-sm shadow-sm space-y-2 max-w-full min-w-0">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <FileText className="h-4 w-4 shrink-0" />
          <span>{t('recording.templates.general.badge')}</span>
        </div>
        <h2 className="text-lg font-bold text-foreground md:text-xl break-words min-w-0">
          {t('recording.templates.general.discussionOverview')}
        </h2>
        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line pt-1 break-words">
          {data.executive_overview}
        </p>
      </div>

      {/* Discussion Topics (Enriched General Format) */}
      <DiscussionTopicsSection
        title="Pembahasan Per Topik"
        topics={data.discussion_topics || []}
      />

      {/* Core Themes (Cornell Cues & Notes Layout) */}
      {data.core_themes && data.core_themes.length > 0 && (
        <div className="space-y-3 max-w-full min-w-0">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-400 shrink-0" />
            <span>{t('recording.templates.general.coreThemes', { count: data.core_themes.length })}</span>
          </h3>
          <div className="space-y-3 max-w-full">
            {data.core_themes.map((theme, idx) => (
              <Card key={idx} className="border-border/60 bg-card/40 max-w-full overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2 min-w-0">
                    <Badge variant="outline" className="text-[10px] font-bold bg-primary/10 text-primary border-primary/30 shrink-0">
                      {t('recording.templates.general.themeBadge', { number: idx + 1 })}
                    </Badge>
                    <span className="break-words min-w-0">{theme.theme}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5 text-xs text-foreground/90 list-disc list-inside">
                    {theme.summary_points.map((pt, pIdx) => (
                      <li key={pIdx} className="leading-relaxed break-words">{pt}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Key Takeaways */}
      {data.key_takeaways && data.key_takeaways.length > 0 && (
        <Card className="border-border/60 bg-card/50 max-w-full overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{t('recording.templates.general.keyTakeaways', { count: data.key_takeaways.length })}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-xs">
              {data.key_takeaways.map((takeaway, idx) => (
                <li key={idx} className="flex items-start gap-2 text-foreground/90">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span className="leading-relaxed break-words">{takeaway}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Notable Quotes */}
      {data.notable_quotes && data.notable_quotes.length > 0 && (
        <div className="space-y-3 max-w-full min-w-0">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Quote className="h-4 w-4 text-amber-400 shrink-0" />
            <span>{t('recording.templates.general.notableQuotes', { count: data.notable_quotes.length })}</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-full">
            {data.notable_quotes.map((q, idx) => (
              <Card key={idx} className="border-border/60 bg-card/40 border-l-2 border-l-amber-500 min-w-0 max-w-full overflow-hidden">
                <CardContent className="p-3.5 space-y-2 text-xs">
                  <p className="italic text-foreground/90 leading-relaxed break-words">
                    &ldquo;{q.quote}&rdquo;
                  </p>
                  <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground pt-1 border-t border-border/40 min-w-0">
                    <span className="font-semibold text-primary break-words min-w-0">{q.speaker}</span>
                    <span className="truncate max-w-[150px] shrink-0 text-right">{q.context}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Action Items & Open Points (Enriched General Format) */}
      {data.action_items && data.action_items.length > 0 && (
        <div className="space-y-3 max-w-full min-w-0">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ListTodo className="h-4 w-4 text-primary shrink-0" />
            <span>Rencana Tindak Lanjut ({data.action_items.length})</span>
          </h3>
          <div className="overflow-x-auto max-w-full rounded-lg border border-border/60 bg-card/40">
            <table className="min-w-[500px] w-full text-left text-xs">
              <thead className="bg-secondary/40 text-muted-foreground border-b border-border/60">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Tugas</th>
                  <th className="py-2.5 px-3 font-semibold w-[150px]">PIC</th>
                  <th className="py-2.5 px-3 font-semibold w-[130px]">Tenggat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {data.action_items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-accent/20 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-foreground break-words">
                      <span>{item.task}</span>
                      {item.priority && (
                        <Badge variant="outline" className="ml-2 text-[10px] font-bold">
                          {item.priority}
                        </Badge>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground font-medium break-words">{item.pic}</td>
                    <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">{item.due_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.open_points && data.open_points.length > 0 && (
        <Card className="border-border/60 bg-card/40 max-w-full overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-amber-400">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
              <span>Isu & Pertanyaan Terbuka ({data.open_points.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
              {data.open_points.map((point, idx) => (
                <li key={idx} className="break-words">{point}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Referenced Resources */}
      {data.referenced_resources && data.referenced_resources.length > 0 && (
        <Card className="border-border/60 bg-card/40 max-w-full overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-sky-400">
              <LinkIcon className="h-3.5 w-3.5 shrink-0" />
              <span>{t('recording.templates.general.resources', { count: data.referenced_resources.length })}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-xs text-muted-foreground list-disc list-inside">
              {data.referenced_resources.map((res, idx) => (
                <li key={idx} className="break-all">{res}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
