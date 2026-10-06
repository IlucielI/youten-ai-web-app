import React from 'react';
import type { SalesDiscoveryStructuredData } from '@/server/schemas/summary.schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card';
import { Badge } from '@/components/atoms/badge';
import { Briefcase, Building, TrendingUp, AlertCircle, CheckCircle2, ShieldAlert, ArrowRight, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SalesDiscoveryRendererProps {
  data: SalesDiscoveryStructuredData;
  className?: string;
}

export function SalesDiscoveryRenderer({ data, className }: SalesDiscoveryRendererProps) {
  return (
    <div
      data-testid="sales-discovery-summary-renderer"
      className={cn('space-y-6 text-foreground', className)}
    >
      {/* Prospect & Stage Header */}
      <div className="rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur-sm shadow-sm space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Building className="h-4 w-4" />
              <span>Sales Discovery (MEDDPICC)</span>
            </div>
            <h2 className="text-xl font-bold text-foreground md:text-2xl">
              {data.prospect_company}
            </h2>
          </div>
          {data.deal_stage_suggested && (
            <Badge variant="outline" className="text-xs px-3 py-1 font-semibold bg-primary/10 text-primary border-primary/30 self-start sm:self-auto">
              Tahap Kesepakatan: {data.deal_stage_suggested}
            </Badge>
          )}
        </div>
      </div>

      {/* MEDDPICC Framework Grid */}
      <Card className="border-border/60 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Kerangka Kualifikasi MEDDPICC
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="rounded-lg bg-secondary/30 p-3 space-y-1 border border-border/40">
              <span className="font-semibold text-foreground flex items-center gap-1.5 text-emerald-400">
                <DollarSign className="h-3.5 w-3.5" />
                Metrics (Dampak Finansial):
              </span>
              <p className="text-muted-foreground leading-relaxed">{data.meddpicc.metrics}</p>
            </div>

            <div className="rounded-lg bg-secondary/30 p-3 space-y-1 border border-border/40">
              <span className="font-semibold text-foreground flex items-center gap-1.5 text-sky-400">
                <Briefcase className="h-3.5 w-3.5" />
                Economic Buyer:
              </span>
              <p className="text-muted-foreground leading-relaxed">{data.meddpicc.economic_buyer}</p>
            </div>

            <div className="rounded-lg bg-secondary/30 p-3 space-y-1 border border-border/40">
              <span className="font-semibold text-foreground flex items-center gap-1.5 text-indigo-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Decision Criteria:
              </span>
              <p className="text-muted-foreground leading-relaxed">{data.meddpicc.decision_criteria}</p>
            </div>

            <div className="rounded-lg bg-secondary/30 p-3 space-y-1 border border-border/40">
              <span className="font-semibold text-foreground flex items-center gap-1.5 text-purple-400">
                <TrendingUp className="h-3.5 w-3.5" />
                Champion:
              </span>
              <p className="text-muted-foreground leading-relaxed">{data.meddpicc.champion}</p>
            </div>

            {data.meddpicc.competition && (
              <div className="rounded-lg bg-secondary/30 p-3 space-y-1 border border-border/40 md:col-span-2">
                <span className="font-semibold text-foreground flex items-center gap-1.5 text-amber-400">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Kompetisi / Alternatif:
                </span>
                <p className="text-muted-foreground leading-relaxed">{data.meddpicc.competition}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pain Points & Desired Outcomes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pain Points */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400" />
            Kendala Prospek & Biaya Keengganan ({data.pain_points.length})
          </h3>
          <div className="space-y-2.5">
            {data.pain_points.map((pt, idx) => (
              <Card key={idx} className="border-border/60 bg-card/40 border-l-2 border-l-rose-500">
                <CardContent className="p-3.5 space-y-1 text-xs">
                  <div className="font-semibold text-foreground">{pt.pain}</div>
                  <div className="text-muted-foreground">
                    <span className="font-medium text-foreground/80">Cost of Inaction: </span>
                    {pt.cost_of_inaction}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Desired Outcomes & Objections */}
        <div className="space-y-4">
          <Card className="border-border/60 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Hasil yang Diharapkan ({data.desired_outcomes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs">
                {data.desired_outcomes.map((out, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-foreground/90">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span>{out}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {data.objections && data.objections.length > 0 && (
            <Card className="border-border/60 bg-card/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-amber-400">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Keberatan yang Diajukan ({data.objections.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-xs text-muted-foreground list-disc list-inside">
                  {data.objections.map((obj, idx) => (
                    <li key={idx}>{obj}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Next Steps */}
      {data.next_steps && data.next_steps.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-primary" />
            Langkah Selanjutnya ({data.next_steps.length})
          </h3>
          <div className="overflow-x-auto rounded-lg border border-border/60 bg-card/40">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 text-muted-foreground border-b border-border/60">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Tindakan</th>
                  <th className="py-2.5 px-3 font-semibold">Penanggung Jawab</th>
                  <th className="py-2.5 px-3 font-semibold">Target Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {data.next_steps.map((step, idx) => (
                  <tr key={idx} className="hover:bg-accent/20 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-foreground">{step.action}</td>
                    <td className="py-2.5 px-3 text-muted-foreground font-medium">{step.owner}</td>
                    <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">{step.target_date}</td>
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
