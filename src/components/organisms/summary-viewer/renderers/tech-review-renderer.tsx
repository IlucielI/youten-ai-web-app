import React from 'react';
import type { TechReviewStructuredData } from '@/server/schemas/summary.schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card';
import { Badge } from '@/components/atoms/badge';
import { Cpu, CheckCircle2, XCircle, ShieldCheck, Zap, Server, AlertTriangle, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TechReviewRendererProps {
  data: TechReviewStructuredData;
  className?: string;
}

export function TechReviewRenderer({ data, className }: TechReviewRendererProps) {
  return (
    <div
      data-testid="tech-review-summary-renderer"
      className={cn('space-y-6 text-foreground max-w-full min-w-0', className)}
    >
      {/* Context & Architecture Background */}
      <div className="rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur-sm shadow-sm space-y-2 max-w-full min-w-0">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <Cpu className="h-4 w-4 shrink-0" />
          <span>Tinjauan Desain Teknis (RFC / ADR)</span>
        </div>
        <h2 className="text-lg font-bold text-foreground md:text-xl break-words min-w-0">
          Konteks & Latar Belakang Arsitektur
        </h2>
        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line pt-1 break-words">
          {data.context}
        </p>
      </div>

      {/* Decisions Adopted & Rejected Alternatives */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-full">
        {/* Adopted */}
        <div className="space-y-3 max-w-full min-w-0">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Keputusan yang Diadopsi ({data.decisions_adopted.length})</span>
          </h3>
          <div className="space-y-2.5 max-w-full">
            {data.decisions_adopted.map((dec, idx) => (
              <Card key={idx} className="border-border/60 bg-card/40 border-l-2 border-l-emerald-500 min-w-0 max-w-full overflow-hidden">
                <CardContent className="p-3.5 space-y-1.5 text-xs">
                  <div className="font-semibold text-foreground text-sm break-words">
                    {dec.decision}
                  </div>
                  <div className="text-muted-foreground leading-relaxed break-words">
                    <span className="font-medium text-foreground/80">Justifikasi Teknis: </span>
                    {dec.technical_justification}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Rejected */}
        <div className="space-y-3 max-w-full min-w-0">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>Alternatif yang Ditolak ({data.rejected_alternatives.length})</span>
          </h3>
          <div className="space-y-2.5 max-w-full">
            {data.rejected_alternatives.map((alt, idx) => (
              <Card key={idx} className="border-border/60 bg-card/40 border-l-2 border-l-rose-500 min-w-0 max-w-full overflow-hidden">
                <CardContent className="p-3.5 space-y-1.5 text-xs">
                  <div className="font-semibold text-foreground text-sm break-words">
                    {alt.alternative}
                  </div>
                  <div className="text-muted-foreground leading-relaxed break-words">
                    <span className="font-medium text-foreground/80">Alasan Penolakan: </span>
                    {alt.rejection_reason}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* NFR Assessment (Non-Functional Requirements) */}
      <Card className="border-border/60 bg-card/50 max-w-full overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-sky-400 shrink-0" />
            <span>Asesmen Kebutuhan Non-Fungsional (NFR)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs max-w-full">
            {/* Security */}
            <div className="rounded-lg bg-secondary/30 p-3 space-y-1.5 border border-border/40 min-w-0 max-w-full overflow-hidden break-words">
              <div className="font-semibold text-foreground flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Keamanan (Security)</span>
              </div>
              <p className="text-muted-foreground leading-relaxed break-words">
                {data.nfr_assessment.security}
              </p>
            </div>

            {/* Performance */}
            <div className="rounded-lg bg-secondary/30 p-3 space-y-1.5 border border-border/40 min-w-0 max-w-full overflow-hidden break-words">
              <div className="font-semibold text-foreground flex items-center gap-1.5 text-amber-400">
                <Zap className="h-4 w-4 shrink-0" />
                <span>Performa & Skalabilitas</span>
              </div>
              <p className="text-muted-foreground leading-relaxed break-words">
                {data.nfr_assessment.performance_scalability}
              </p>
            </div>

            {/* Reliability */}
            <div className="rounded-lg bg-secondary/30 p-3 space-y-1.5 border border-border/40 min-w-0 max-w-full overflow-hidden break-words">
              <div className="font-semibold text-foreground flex items-center gap-1.5 text-sky-400">
                <Server className="h-4 w-4 shrink-0" />
                <span>Keandalan & Resiliensi</span>
              </div>
              <p className="text-muted-foreground leading-relaxed break-words">
                {data.nfr_assessment.reliability_resilience}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tech Debt Impact */}
      {data.technical_debt_impact && (
        <Card className="border-border/60 bg-card/40 max-w-full overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>Dampak Hutang Teknis (Technical Debt)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line break-words">
              {data.technical_debt_impact}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Items */}
      {data.action_items && data.action_items.length > 0 && (
        <div className="space-y-3 max-w-full min-w-0">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ListTodo className="h-4 w-4 text-primary shrink-0" />
            <span>Tindak Lanjut Eksekusi Teknis ({data.action_items.length})</span>
          </h3>
          <div className="overflow-x-auto max-w-full rounded-lg border border-border/60 bg-card/40">
            <table className="min-w-[500px] w-full text-left text-xs">
              <thead className="bg-secondary/40 text-muted-foreground border-b border-border/60">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Tugas Teknis</th>
                  <th className="py-2.5 px-3 font-semibold w-[160px]">PIC / Assignee</th>
                  <th className="py-2.5 px-3 font-semibold w-[140px]">Target Sprint</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {data.action_items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-accent/20 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-foreground break-words">{item.task}</td>
                    <td className="py-2.5 px-3 text-muted-foreground font-medium break-words">{item.assignee}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant="outline" className="text-[10px] font-semibold bg-secondary/60 whitespace-normal break-words h-auto">
                        {item.target_sprint}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
