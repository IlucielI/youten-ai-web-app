import React from 'react';
import type { OneOnOneStructuredData } from '@/server/schemas/summary.schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card';
import { Badge } from '@/components/atoms/badge';
import { HeartHandshake, Smile, Meh, Frown, AlertTriangle, Trophy, AlertOctagon, MessageSquare, Sparkles, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OneOnOneRendererProps {
  data: OneOnOneStructuredData;
  className?: string;
}

const sentimentConfig: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; style: string }
> = {
  Energetic: {
    label: 'Berenergi & Positif',
    icon: Smile,
    style: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  Balanced: {
    label: 'Seimbang',
    icon: Smile,
    style: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  },
  Stressed: {
    label: 'Mengalami Tekanan',
    icon: Meh,
    style: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  Overwhelmed: {
    label: 'Kewalahan (Butuh Dukungan)',
    icon: Frown,
    style: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  },
};

export function OneOnOneRenderer({ data, className }: OneOnOneRendererProps) {
  const sentiment = sentimentConfig[data.wellbeing_assessment.sentiment_score] || {
    label: data.wellbeing_assessment.sentiment_score,
    icon: AlertTriangle,
    style: 'bg-secondary text-foreground',
  };
  const SentimentIcon = sentiment.icon;

  return (
    <div
      data-testid="one-on-one-summary-renderer"
      className={cn('space-y-6 text-foreground', className)}
    >
      {/* Wellbeing & Pulse Check Banner */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <HeartHandshake className="h-5 w-5 text-rose-400" />
              Asesmen Wellbeing & Kesejahteraan
            </CardTitle>
            <Badge variant="outline" className={cn('gap-1 text-xs px-2.5 py-1 font-semibold', sentiment.style)}>
              <SentimentIcon className="h-3.5 w-3.5" />
              {sentiment.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
            {data.wellbeing_assessment.summary}
          </p>
        </CardContent>
      </Card>

      {/* Key Wins & Blockers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Wins */}
        <Card className="border-border/60 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-400">
              <Trophy className="h-4 w-4" />
              Pencapaian & Kemenangan ({data.key_wins.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-xs">
              {data.key_wins.map((win, idx) => (
                <li key={idx} className="flex items-start gap-2 text-foreground/90">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>{win}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Blockers */}
        <Card className="border-border/60 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-400">
              <AlertOctagon className="h-4 w-4" />
              Hambatan & Kendala ({data.blockers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-xs">
              {data.blockers.map((blocker, idx) => (
                <li key={idx} className="flex items-start gap-2 text-foreground/90">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span>{blocker}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* 2-Way Feedback Exchanged */}
      <Card className="border-border/60 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-sky-400" />
            Umpan Balik Timbal Balik (2-Way Feedback)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="rounded-lg bg-secondary/30 p-3.5 space-y-2 border border-border/40">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-primary" />
                Masukan untuk Tim (Report):
              </span>
              <ul className="space-y-1.5 text-muted-foreground list-disc list-inside">
                {data.feedback_exchanged.for_report.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg bg-secondary/30 p-3.5 space-y-2 border border-border/40">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-sky-400" />
                Masukan untuk Manager:
              </span>
              <ul className="space-y-1.5 text-muted-foreground list-disc list-inside">
                {data.feedback_exchanged.for_manager.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Growth Notes */}
      {data.growth_notes && (
        <Card className="border-border/60 bg-card/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-purple-400">
              <Sparkles className="h-3.5 w-3.5" />
              Catatan Pertumbuhan Karir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed">
              {data.growth_notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Commitments Table */}
      {data.commitments && data.commitments.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-emerald-400" />
            Komitmen Tindakan Bersama ({data.commitments.length})
          </h3>
          <div className="overflow-x-auto rounded-lg border border-border/60 bg-card/40">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 text-muted-foreground border-b border-border/60">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Pihak Bertanggung Jawab</th>
                  <th className="py-2.5 px-3 font-semibold">Tindakan Komitmen</th>
                  <th className="py-2.5 px-3 font-semibold">Linimasa / Tenggat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {data.commitments.map((commit, idx) => (
                  <tr key={idx} className="hover:bg-accent/20 transition-colors">
                    <td className="py-2.5 px-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] font-semibold',
                          commit.party === 'MANAGER'
                            ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                            : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                        )}
                      >
                        {commit.party === 'MANAGER' ? 'Manager' : 'Report (Anggota)'}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-foreground">{commit.action_item}</td>
                    <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">{commit.timeline}</td>
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
