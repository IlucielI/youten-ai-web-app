import React from 'react';
import type { MomStructuredData } from '@/server/schemas/summary.schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card';
import { Badge } from '@/components/atoms/badge';
import { CheckCircle2, Calendar, Users, Target, Activity, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MomRendererProps {
  data: MomStructuredData;
  className?: string;
}

const priorityBadgeStyles: Record<string, string> = {
  P0: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  P1: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  P2: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
};

export function MomRenderer({ data, className }: MomRendererProps) {
  return (
    <div
      data-testid="mom-summary-renderer"
      className={cn('space-y-6 text-foreground', className)}
    >
      {/* Title & Goals Header */}
      <div className="rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur-sm shadow-sm">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Target className="h-4 w-4" />
            <span>Notula Rapat Eksekutif (MOM)</span>
          </div>
          <h2 className="text-xl font-bold text-foreground md:text-2xl">
            {data.meeting_title}
          </h2>
          {data.meeting_goal && (
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-medium text-foreground">Tujuan Rapat:</span> {data.meeting_goal}
            </p>
          )}
        </div>
      </div>

      {/* Executive Summary */}
      <Card className="border-border/60 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Ringkasan Eksekutif
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
            {data.executive_summary}
          </p>
        </CardContent>
      </Card>

      {/* Meeting Dynamics & Perspectives */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dynamics */}
        <Card className="border-border/60 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-sky-400" />
              Dinamika & Konsensus Rapat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Tingkat Konsensus:</span>
              <Badge variant="outline" className="font-medium bg-secondary/50">
                {data.meeting_dynamics.consensus_score}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Trayektori Sentimen:</span>
              <Badge variant="outline" className="font-medium bg-secondary/50">
                {data.meeting_dynamics.sentiment_trajectory}
              </Badge>
            </div>
            {data.meeting_dynamics.speaker_talk_time && data.meeting_dynamics.speaker_talk_time.length > 0 && (
              <div className="pt-2 border-t border-border/40 space-y-2">
                <span className="text-xs font-medium text-muted-foreground">Distribusi Bicara:</span>
                <div className="space-y-1.5">
                  {data.meeting_dynamics.speaker_talk_time.map((speaker, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="truncate max-w-[150px]">{speaker.speaker}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{speaker.duration_minutes}m</span>
                        <span className="font-semibold text-primary">{speaker.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stakeholder Perspectives */}
        <Card className="border-border/60 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-indigo-400" />
              Perspektif Pemangku Kepentingan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs">
            <div>
              <span className="font-semibold text-foreground/90">Eksekutif: </span>
              <span className="text-muted-foreground">{data.stakeholder_perspectives.executive_brief}</span>
            </div>
            <div>
              <span className="font-semibold text-foreground/90">Engineering: </span>
              <span className="text-muted-foreground">{data.stakeholder_perspectives.engineering_focus}</span>
            </div>
            <div>
              <span className="font-semibold text-foreground/90">Produk: </span>
              <span className="text-muted-foreground">{data.stakeholder_perspectives.product_delivery}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Decisions */}
      {data.key_decisions && data.key_decisions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Keputusan Utama ({data.key_decisions.length})
          </h3>
          <div className="space-y-3">
            {data.key_decisions.map((dec, idx) => (
              <Card key={idx} className="border-border/60 bg-card/40">
                <CardContent className="p-4 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {idx + 1}. {dec.decision}
                    </span>
                    <Badge variant="outline" className="text-[10px] shrink-0 border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                      Disetujui: {dec.approved_by}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-muted-foreground pt-1">
                    <div>
                      <span className="font-medium text-foreground/80">Pemicu Akar Masalah:</span>{' '}
                      {dec.root_cause_trigger}
                    </div>
                    <div>
                      <span className="font-medium text-foreground/80">Dampak Kuantitatif:</span>{' '}
                      {dec.quantitative_impact}
                    </div>
                    {dec.contested_points && (
                      <div className="md:col-span-2">
                        <span className="font-medium text-foreground/80">Poin Perdebatan:</span>{' '}
                        {dec.contested_points}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Action Items Table */}
      {data.action_items && data.action_items.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Tindak Lanjut & Tugas ({data.action_items.length})
          </h3>
          <div className="overflow-x-auto rounded-lg border border-border/60 bg-card/40">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 text-muted-foreground border-b border-border/60">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Prioritas</th>
                  <th className="py-2.5 px-3 font-semibold">Tugas</th>
                  <th className="py-2.5 px-3 font-semibold">PIC</th>
                  <th className="py-2.5 px-3 font-semibold">Tenggat Waktu</th>
                  <th className="py-2.5 px-3 font-semibold">Definisi Selesai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {data.action_items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-accent/20 transition-colors">
                    <td className="py-2.5 px-3">
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] font-bold px-1.5 py-0.5', priorityBadgeStyles[item.priority] || '')}
                      >
                        {item.priority}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-foreground">
                      <div>{item.task}</div>
                      {item.cost_of_inaction && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Konsekuensi: {item.cost_of_inaction}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground font-medium">{item.pic}</td>
                    <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">{item.due_date}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{item.definition_of_done}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Open Issues & Next Meeting */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.open_issues && data.open_issues.length > 0 && (
          <Card className="border-border/60 bg-card/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-amber-400">
                <ShieldAlert className="h-3.5 w-3.5" />
                Isu Terbuka / Pending ({data.open_issues.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                {data.open_issues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {data.next_meeting && (
          <Card className="border-border/60 bg-card/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-sky-400">
                <Calendar className="h-3.5 w-3.5" />
                Jadwal Rapat Lanjutan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-foreground/90 font-medium">
                {data.next_meeting}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
