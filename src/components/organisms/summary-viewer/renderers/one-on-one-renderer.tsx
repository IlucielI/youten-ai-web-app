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
      className={cn('space-y-6 text-foreground max-w-full min-w-0', className)}
    >
      {/* Wellbeing & Pulse Check Banner */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm max-w-full overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 max-w-full min-w-0">
            <CardTitle className="text-base font-semibold flex items-center gap-2 min-w-0 break-words">
              <HeartHandshake className="h-5 w-5 text-rose-400 shrink-0" />
              <span>Asesmen Wellbeing & Kesejahteraan</span>
            </CardTitle>
            <Badge variant="outline" className={cn('gap-1 text-xs px-2.5 py-1 font-semibold self-start sm:self-auto whitespace-normal break-words max-w-full text-left h-auto', sentiment.style)}>
              <SentimentIcon className="h-3.5 w-3.5 shrink-0" />
              <span>{sentiment.label}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line break-words">
            {data.wellbeing_assessment.summary}
          </p>
        </CardContent>
      </Card>

      {/* Key Wins & Blockers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-full">
        {/* Wins */}
        <Card className="border-border/60 bg-card/50 min-w-0 max-w-full overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-400">
              <Trophy className="h-4 w-4 shrink-0" />
              <span>Pencapaian & Kemenangan ({data.key_wins.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-xs">
              {data.key_wins.map((win, idx) => (
                <li key={idx} className="flex items-start gap-2 text-foreground/90">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span className="break-words">{win}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Blockers */}
        <Card className="border-border/60 bg-card/50 min-w-0 max-w-full overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-400">
              <AlertOctagon className="h-4 w-4 shrink-0" />
              <span>Hambatan & Kendala ({data.blockers.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-xs">
              {data.blockers.map((blocker, idx) => (
                <li key={idx} className="flex items-start gap-2 text-foreground/90">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span className="break-words">{blocker}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* 2-Way Feedback Exchanged */}
      <Card className="border-border/60 bg-card/50 max-w-full overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-sky-400 shrink-0" />
            <span>Umpan Balik Timbal Balik (2-Way Feedback)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs max-w-full">
            <div className="rounded-lg bg-secondary/30 p-3.5 space-y-2 border border-border/40 min-w-0 max-w-full overflow-hidden">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Masukan untuk Tim (Report):</span>
              </span>
              <ul className="space-y-1.5 text-muted-foreground list-disc list-inside">
                {data.feedback_exchanged.for_report.map((item, idx) => (
                  <li key={idx} className="break-words">{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg bg-secondary/30 p-3.5 space-y-2 border border-border/40 min-w-0 max-w-full overflow-hidden">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                <span>Masukan untuk Manager:</span>
              </span>
              <ul className="space-y-1.5 text-muted-foreground list-disc list-inside">
                {data.feedback_exchanged.for_manager.map((item, idx) => (
                  <li key={idx} className="break-words">{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Growth Notes */}
      {data.growth_notes && (
        <Card className="border-border/60 bg-card/40 max-w-full overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-purple-400">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span>Catatan Pertumbuhan Karir</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed break-words">
              {data.growth_notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Commitments Table */}
      {data.commitments && data.commitments.length > 0 && (
        <div className="space-y-3 max-w-full min-w-0">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Komitmen Tindakan Bersama ({data.commitments.length})</span>
          </h3>
          <div className="overflow-x-auto max-w-full rounded-lg border border-border/60 bg-card/40">
            <table className="min-w-[550px] w-full text-left text-xs">
              <thead className="bg-secondary/40 text-muted-foreground border-b border-border/60">
                <tr>
                  <th className="py-2.5 px-3 font-semibold w-[160px]">Pihak Bertanggung Jawab</th>
                  <th className="py-2.5 px-3 font-semibold">Tindakan Komitmen</th>
                  <th className="py-2.5 px-3 font-semibold w-[140px]">Linimasa / Tenggat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {data.commitments.map((commit, idx) => (
                  <tr key={idx} className="hover:bg-accent/20 transition-colors">
                    <td className="py-2.5 px-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] font-semibold whitespace-normal break-words h-auto',
                          commit.party === 'MANAGER'
                            ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                            : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                        )}
                      >
                        {commit.party === 'MANAGER' ? 'Manager' : 'Report (Anggota)'}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-foreground break-words">{commit.action_item}</td>
                    <td className="py-2.5 px-3 text-muted-foreground break-words">{commit.timeline}</td>
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
