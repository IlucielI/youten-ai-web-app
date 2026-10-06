import React from 'react';
import type { DailyStandupStructuredData } from '@/server/schemas/summary.schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card';
import { Badge } from '@/components/atoms/badge';
import { Activity, ShieldAlert, CheckCircle2, AlertTriangle, XCircle, Clock, Users, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DailyStandupRendererProps {
  data: DailyStandupStructuredData;
  className?: string;
}

const sprintStatusStyles: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; style: string }> = {
  'ON TRACK': {
    label: 'Sprint Sesuai Rencana (On Track)',
    icon: CheckCircle2,
    style: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  'AT RISK': {
    label: 'Sprint Berisiko (At Risk)',
    icon: AlertTriangle,
    style: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  BLOCKED: {
    label: 'Sprint Terhambat (Blocked)',
    icon: XCircle,
    style: 'bg-rose-500/15 text-rose-400 border-rose-500/30 font-bold',
  },
};

export function DailyStandupRenderer({ data, className }: DailyStandupRendererProps) {
  const sprintStatus = sprintStatusStyles[data.sprint_health.status] || {
    label: data.sprint_health.status,
    icon: Activity,
    style: 'bg-secondary text-foreground',
  };
  const StatusIcon = sprintStatus.icon;

  return (
    <div
      data-testid="daily-standup-summary-renderer"
      className={cn('space-y-6 text-foreground', className)}
    >
      {/* Sprint Health Banner */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Kesehatan Sprint (Daily Scrum)
            </CardTitle>
            <Badge variant="outline" className={cn('gap-1.5 text-xs px-2.5 py-1 font-semibold self-start sm:self-auto', sprintStatus.style)}>
              <StatusIcon className="h-3.5 w-3.5" />
              {sprintStatus.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
            {data.sprint_health.summary}
          </p>
        </CardContent>
      </Card>

      {/* Critical Blockers Banner */}
      {data.critical_blockers && data.critical_blockers.length > 0 && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
            <ShieldAlert className="h-4 w-4" />
            <span>Blocker Kritis / Butuh Eskalasi Segera ({data.critical_blockers.length})</span>
          </div>
          <ul className="space-y-1 text-xs text-rose-200 list-disc list-inside">
            {data.critical_blockers.map((blk, idx) => (
              <li key={idx} className="font-medium">{blk}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Member Updates Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Users className="h-4 w-4 text-sky-400" />
          Pembaruan Anggota Tim ({data.member_updates.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.member_updates.map((member, idx) => (
            <Card key={idx} className="border-border/60 bg-card/40">
              <CardHeader className="pb-2.5">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold">
                    {member.member_name.charAt(0).toUpperCase()}
                  </div>
                  {member.member_name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {/* Yesterday */}
                <div>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Kemarin (Selesai):
                  </span>
                  <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-0.5">
                    {member.yesterday.map((item, yIdx) => (
                      <li key={yIdx}>{item}</li>
                    ))}
                  </ul>
                </div>

                {/* Today */}
                <div>
                  <span className="font-semibold text-sky-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Hari Ini (Rencana):
                  </span>
                  <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-0.5">
                    {member.today.map((item, tIdx) => (
                      <li key={tIdx}>{item}</li>
                    ))}
                  </ul>
                </div>

                {/* Blockers */}
                {member.blockers && member.blockers.length > 0 && (
                  <div className="pt-1.5 border-t border-border/40">
                    <span className="font-semibold text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Blocker:
                    </span>
                    <ul className="list-disc list-inside text-rose-300 mt-1 space-y-0.5">
                      {member.blockers.map((item, bIdx) => (
                        <li key={bIdx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Parking Lot Discussions */}
      {data.parking_lot_discussions && data.parking_lot_discussions.length > 0 && (
        <Card className="border-border/60 bg-card/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-indigo-400">
              <MessageSquare className="h-3.5 w-3.5" />
              Diskusi Parking Lot ({data.parking_lot_discussions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs">
              {data.parking_lot_discussions.map((plot, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded-lg bg-secondary/30">
                  <span className="font-medium text-foreground">{plot.topic}</span>
                  <span className="text-[11px] text-muted-foreground">
                    Partisipan: {plot.participants.join(', ')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
