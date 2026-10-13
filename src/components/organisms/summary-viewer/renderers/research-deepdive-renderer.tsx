import React from 'react';
import type { ResearchDeepdiveStructuredData } from '@/server/schemas/summary.schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card';
import { Badge } from '@/components/atoms/badge';
import { Microscope, FileSearch, CheckCircle2, AlertCircle, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ResearchDeepdiveRendererProps {
  data: ResearchDeepdiveStructuredData;
  className?: string;
}

export function ResearchDeepdiveRenderer({ data, className }: ResearchDeepdiveRendererProps) {
  return (
    <div
      data-testid="research-deepdive-summary-renderer"
      className={cn('space-y-6 text-foreground max-w-full min-w-0', className)}
    >
      {/* Research Header Banner */}
      <div className="rounded-xl border border-teal-500/30 bg-gradient-to-br from-teal-500/10 via-card/80 to-emerald-500/5 p-5 backdrop-blur-sm shadow-sm space-y-3 max-w-full min-w-0">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-400">
          <Microscope className="h-4 w-4 text-teal-400 shrink-0" />
          <span>Analisis Riset Akademis & Deep Dive</span>
        </div>
        <h2 className="text-xl font-bold text-foreground md:text-2xl tracking-tight break-words min-w-0">
          {data.research_title}
        </h2>
        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line pt-1 break-words">
          {data.abstract_or_summary}
        </p>

        {/* Methodology */}
        {data.key_methodology && (
          <div className="mt-3 rounded-lg border border-teal-500/20 bg-teal-500/5 p-3 space-y-1 text-xs max-w-full min-w-0">
            <span className="font-semibold text-teal-400 flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 shrink-0" />
              <span>Metodologi Penelitian (Methodology)</span>
            </span>
            <p className="text-muted-foreground text-xs leading-relaxed pt-0.5 break-words">
              {data.key_methodology}
            </p>
          </div>
        )}
      </div>

      {/* Key Findings with Implications */}
      {data.key_findings && data.key_findings.length > 0 && (
        <div className="space-y-3 max-w-full min-w-0">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Temuan Utama & Implikasi ({data.key_findings.length})</span>
          </h3>
          <div className="space-y-3 max-w-full">
            {data.key_findings.map((item, idx) => (
              <Card key={idx} className="border-border/60 bg-card/40 hover:bg-card/60 transition-colors max-w-full overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2 min-w-0">
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shrink-0">
                      Temuan {idx + 1}
                    </Badge>
                    <span className="break-words min-w-0">{item.finding}</span>
                  </CardTitle>
                </CardHeader>
                {item.implication && (
                  <CardContent>
                    <div className="rounded border border-border/40 bg-muted/20 p-2.5 text-xs text-muted-foreground break-words">
                      <span className="font-semibold text-foreground">Implikasi Praktis: </span>
                      {item.implication}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Literature Synthesis */}
      {data.literature_synthesis && data.literature_synthesis.length > 0 && (
        <Card className="border-border/60 bg-card/40 max-w-full overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-indigo-400">
              <FileSearch className="h-4 w-4 shrink-0" />
              <span>Sintesis Literatur & Tinjauan Pustaka ({data.literature_synthesis.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-xs">
              {data.literature_synthesis.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2 text-foreground/90">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                  <span className="leading-relaxed break-words">{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Limitations and Future Work */}
      {data.limitations_and_future_work && data.limitations_and_future_work.length > 0 && (
        <Card className="border-border/60 bg-card/50 max-w-full overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Keterbatasan & Arah Riset Mendatang ({data.limitations_and_future_work.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-xs">
              {data.limitations_and_future_work.map((lim, idx) => (
                <li key={idx} className="flex items-start gap-2 text-foreground/90">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span className="leading-relaxed break-words">{lim}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
