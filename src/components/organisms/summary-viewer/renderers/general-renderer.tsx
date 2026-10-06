import React from 'react';
import type { GeneralStructuredData } from '@/server/schemas/summary.schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card';
import { Badge } from '@/components/atoms/badge';
import { FileText, CheckCircle2, Quote, Layers, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GeneralRendererProps {
  data: GeneralStructuredData;
  className?: string;
}

export function GeneralRenderer({ data, className }: GeneralRendererProps) {
  return (
    <div
      data-testid="general-summary-renderer"
      className={cn('space-y-6 text-foreground', className)}
    >
      {/* Executive Overview */}
      <div className="rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur-sm shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <FileText className="h-4 w-4" />
          <span>Ringkasan Eksekutif (Cornell Notes)</span>
        </div>
        <h2 className="text-lg font-bold text-foreground md:text-xl">
          Ikhtisar Pembahasan
        </h2>
        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line pt-1">
          {data.executive_overview}
        </p>
      </div>

      {/* Core Themes (Cornell Cues & Notes Layout) */}
      {data.core_themes && data.core_themes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-400" />
            Tema & Topik Utama ({data.core_themes.length})
          </h3>
          <div className="space-y-3">
            {data.core_themes.map((theme, idx) => (
              <Card key={idx} className="border-border/60 bg-card/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] font-bold bg-primary/10 text-primary border-primary/30">
                      Tema {idx + 1}
                    </Badge>
                    {theme.theme}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5 text-xs text-foreground/90 list-disc list-inside">
                    {theme.summary_points.map((pt, pIdx) => (
                      <li key={pIdx} className="leading-relaxed">{pt}</li>
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
        <Card className="border-border/60 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Poin Pembelajaran Kunci ({data.key_takeaways.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-xs">
              {data.key_takeaways.map((takeaway, idx) => (
                <li key={idx} className="flex items-start gap-2 text-foreground/90">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{takeaway}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Notable Quotes */}
      {data.notable_quotes && data.notable_quotes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Quote className="h-4 w-4 text-amber-400" />
            Kutipan Berkesan ({data.notable_quotes.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.notable_quotes.map((q, idx) => (
              <Card key={idx} className="border-border/60 bg-card/40 border-l-2 border-l-amber-500">
                <CardContent className="p-3.5 space-y-2 text-xs">
                  <p className="italic text-foreground/90 leading-relaxed">
                    &ldquo;{q.quote}&rdquo;
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                    <span className="font-semibold text-primary">{q.speaker}</span>
                    <span className="truncate max-w-[150px]">{q.context}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Referenced Resources */}
      {data.referenced_resources && data.referenced_resources.length > 0 && (
        <Card className="border-border/60 bg-card/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-sky-400">
              <LinkIcon className="h-3.5 w-3.5" />
              Referensi & Tautan yang Disebutkan ({data.referenced_resources.length})
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
