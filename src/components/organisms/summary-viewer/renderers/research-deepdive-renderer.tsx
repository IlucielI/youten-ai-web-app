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
      className={cn('space-y-6 text-foreground', className)}
    >
      {/* Research Header Banner */}
      <div className="rounded-xl border border-teal-500/30 bg-gradient-to-br from-teal-500/10 via-card/80 to-emerald-500/5 p-5 backdrop-blur-sm shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-400">
          <Microscope className="h-4 w-4 text-teal-400" />
          <span>Analisis Riset Akademis & Deep Dive</span>
        </div>
        <h2 className="text-xl font-bold text-foreground md:text-2xl tracking-tight">
          {data.research_title}
        </h2>
        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line pt-1">
          {data.abstract_or_summary}
        </p>

        {/* Methodology */}
        {data.key_methodology && (
          <div className="mt-3 rounded-lg border border-teal-500/20 bg-teal-500/5 p-3 space-y-1 text-xs">
            <span className="font-semibold text-teal-400 flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5" />
              Metodologi Penelitian (Methodology)
            </span>
            <p className="text-muted-foreground text-xs leading-relaxed pt-0.5">
              {data.key_methodology}
            </p>
          </div>
        )}
      </div>

      {/* Key Findings with Implications */}
      {data.key_findings && data.key_findings.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Temuan Utama & Implikasi ({data.key_findings.length})
          </h3>
          <div className="space-y-3">
            {data.key_findings.map((item, idx) => (
              <Card key={idx} className="border-border/60 bg-card/40 hover:bg-card/60 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                      Temuan {idx + 1}
                    </Badge>
                    {item.finding}
                  </CardTitle>
                </CardHeader>
                {item.implication && (
                  <CardContent>
                    <div className="rounded border border-border/40 bg-muted/20 p-2.5 text-xs text-muted-foreground">
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
        <Card className="border-border/60 bg-card/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-indigo-400">
              <FileSearch className="h-4 w-4" />
              Sintesis Literatur & Tinjauan Pustaka ({data.literature_synthesis.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-xs">
              {data.literature_synthesis.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2 text-foreground/90">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Limitations and Future Work */}
      {data.limitations_and_future_work && data.limitations_and_future_work.length > 0 && (
        <Card className="border-border/60 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-400">
              <AlertCircle className="h-4 w-4" />
              Keterbatasan & Arah Riset Mendatang ({data.limitations_and_future_work.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-xs">
              {data.limitations_and_future_work.map((lim, idx) => (
                <li key={idx} className="flex items-start gap-2 text-foreground/90">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{lim}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
