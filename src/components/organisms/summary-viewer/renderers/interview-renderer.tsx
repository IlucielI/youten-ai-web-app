import React from 'react';
import type { InterviewStructuredData } from '@/server/schemas/summary.schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card';
import { Badge } from '@/components/atoms/badge';
import { Award, User, Briefcase, CheckCircle2, XCircle, HelpCircle, Star, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/locales';

export interface InterviewRendererProps {
  data: InterviewStructuredData;
  className?: string;
}

export function InterviewRenderer({ data, className }: InterviewRendererProps) {
  const { t } = useTranslation();

  const recommendationConfig: Record<string, { label: string; style: string }> = {
    'STRONG HIRE': {
      label: t('recording.templates.interview.recommendations.strongHire'),
      style: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold',
    },
    HIRE: {
      label: t('recording.templates.interview.recommendations.hire'),
      style: 'bg-green-500/15 text-green-400 border-green-500/30 font-semibold',
    },
    'LEAN HIRE': {
      label: t('recording.templates.interview.recommendations.leanHire'),
      style: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
    },
    'LEAN REJECT': {
      label: t('recording.templates.interview.recommendations.leanReject'),
      style: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    },
    'STRONG REJECT': {
      label: t('recording.templates.interview.recommendations.strongReject'),
      style: 'bg-rose-500/15 text-rose-400 border-rose-500/30 font-bold',
    },
  };

  const ratingConfig: Record<string, { label: string; style: string }> = {
    Exceeds: {
      label: t('recording.templates.interview.ratings.exceeds'),
      style: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    Meets: {
      label: t('recording.templates.interview.ratings.meets'),
      style: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    },
    'Needs Work': {
      label: t('recording.templates.interview.ratings.needsWork'),
      style: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    },
    Unsatisfactory: {
      label: t('recording.templates.interview.ratings.unsatisfactory'),
      style: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    },
  };

  const rec = recommendationConfig[data.recommendation] || {
    label: data.recommendation,
    style: 'bg-secondary text-foreground',
  };

  return (
    <div
      data-testid="interview-summary-renderer"
      className={cn('space-y-6 text-foreground max-w-full min-w-0', className)}
    >
      {/* Candidate Scorecard Header */}
      <div className="rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur-sm shadow-sm space-y-3 max-w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-full min-w-0">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <User className="h-4 w-4 shrink-0" />
              <span>{t('recording.templates.interview.scorecardBadge')}</span>
            </div>
            <h2 className="text-xl font-bold text-foreground md:text-2xl break-words min-w-0">
              {data.candidate_name}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0 break-words">
              <Briefcase className="h-3.5 w-3.5 shrink-0" />
              <span>{t('recording.templates.interview.targetRole')} {data.target_role}</span>
            </div>
          </div>
          <Badge variant="outline" className={cn('text-xs px-3 py-1.5 self-start sm:self-auto whitespace-normal break-words max-w-full text-left h-auto', rec.style)}>
            {rec.label}
          </Badge>
        </div>

        {/* Justification */}
        <div className="pt-2 border-t border-border/40">
          <span className="text-xs font-semibold text-foreground/90">
            {t('recording.templates.interview.decisionJustification')}
          </span>
          <p className="text-sm text-foreground/90 mt-1 leading-relaxed whitespace-pre-line break-words">
            {data.justification}
          </p>
        </div>
      </div>

      {/* Competency Scores */}
      {data.competency_scores && data.competency_scores.length > 0 && (
        <div className="space-y-3 max-w-full min-w-0">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Award className="h-4 w-4 text-primary shrink-0" />
            <span>{t('recording.templates.interview.competencyScores', { count: data.competency_scores.length })}</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-full">
            {data.competency_scores.map((comp, idx) => {
              const rBadge = ratingConfig[comp.rating] || {
                label: comp.rating,
                style: 'bg-secondary text-foreground',
              };
              return (
                <Card key={idx} className="border-border/60 bg-card/40 min-w-0 max-w-full overflow-hidden break-words">
                  <CardContent className="p-4 space-y-2 text-xs">
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <span className="font-semibold text-foreground text-sm flex items-center gap-1.5 min-w-0 break-words">
                        <Star className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <span>{comp.competency}</span>
                      </span>
                      <Badge variant="outline" className={cn('text-[10px] shrink-0 whitespace-normal break-words text-left max-w-[120px] h-auto', rBadge.style)}>
                        {rBadge.label}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">
                        {t('recording.templates.interview.behaviorEvidence')}
                      </span>
                      <p className="text-foreground/90 mt-0.5 leading-relaxed break-words">{comp.evidence}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Strengths & Concerns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-full">
        {/* Strengths */}
        <Card className="border-border/60 bg-card/50 min-w-0 max-w-full overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{t('recording.templates.interview.strengths', { count: data.strengths.length })}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-xs">
              {data.strengths.map((str, idx) => (
                <li key={idx} className="flex items-start gap-2 text-foreground/90">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span className="break-words">{str}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Concerns */}
        <Card className="border-border/60 bg-card/50 min-w-0 max-w-full overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-rose-400">
              <XCircle className="h-4 w-4 shrink-0" />
              <span>{t('recording.templates.interview.concerns', { count: data.concerns.length })}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-xs">
              {data.concerns.map((con, idx) => (
                <li key={idx} className="flex items-start gap-2 text-foreground/90">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  <span className="break-words">{con}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Culture Fit & Next Round Probes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-full">
        {data.culture_fit_notes && (
          <Card className="border-border/60 bg-card/40 min-w-0 max-w-full overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-purple-400">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span>{t('recording.templates.interview.cultureFit')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line break-words">
                {data.culture_fit_notes}
              </p>
            </CardContent>
          </Card>
        )}

        {data.next_round_probes && data.next_round_probes.length > 0 && (
          <Card className="border-border/60 bg-card/40 min-w-0 max-w-full overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-sky-400">
                <HelpCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{t('recording.templates.interview.nextRoundProbes', { count: data.next_round_probes.length })}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-xs text-foreground/90 list-disc list-inside">
                {data.next_round_probes.map((probe, idx) => (
                  <li key={idx} className="break-words">{probe}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
