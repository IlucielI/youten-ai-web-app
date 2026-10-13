import React from 'react';
import { Sparkles, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/locales';

export const DEFAULT_CHAT_PROMPTS = [
  'Apa poin keputusan utama dalam rapat ini?',
  'Daftar semua tindak lanjut (action items) dan PIC',
  'Rangkum tenggat waktu dan komitmen yang dibahas',
  'Apakah ada isu atau blocker kritis yang belum terselesaikan?',
];

export const INTERVIEW_CHAT_PROMPTS = [
  'Bagaimana evaluasi kualifikasi dan kompetensi kandidat?',
  'Apa kelebihan utama dan area perhatian (red flags) kandidat?',
  'Bagaimana kesimpulan rekomendasi keputusan perekrutan (hiring)?',
  'Pertanyaan apa yang disarankan untuk wawancara babak berikutnya?',
];

export interface ChatChipsProps {
  prompts?: string[];
  template?: string | null;
  onSelectPrompt: (prompt: string) => void;
  className?: string;
  disabled?: boolean;
}

export function ChatChips({
  prompts,
  template,
  onSelectPrompt,
  className,
  disabled = false,
}: ChatChipsProps) {
  const { t } = useTranslation();

  const getTemplatePrompts = (tpl?: string | null): string[] => {
    const normalized = (tpl || '').trim().toUpperCase().replace(/-/g, '_');

    switch (normalized) {
      case 'INTERVIEW':
        return [
          t('recording.chat.templatePrompts.interview.evalCompetencies'),
          t('recording.chat.templatePrompts.interview.strengthsConcerns'),
          t('recording.chat.templatePrompts.interview.hiringRecommendation'),
          t('recording.chat.templatePrompts.interview.nextRoundProbes'),
        ];
      case '1_ON_1':
      case 'ONE_ON_ONE':
        return [
          t('recording.chat.templatePrompts.oneOnOne.feedbackDiscussion'),
          t('recording.chat.templatePrompts.oneOnOne.sentimentWorkload'),
          t('recording.chat.templatePrompts.oneOnOne.goalsCommitments'),
          t('recording.chat.templatePrompts.oneOnOne.managerSupport'),
        ];
      case 'TECH_REVIEW':
      case 'TECHREVIEW':
        return [
          t('recording.chat.templatePrompts.techReview.architectureDecisions'),
          t('recording.chat.templatePrompts.techReview.rejectedAlternatives'),
          t('recording.chat.templatePrompts.techReview.nfrRisks'),
          t('recording.chat.templatePrompts.techReview.actionItemsPoc'),
        ];
      case 'SALES_DISCOVERY':
      case 'SALESDISCOVERY':
        return [
          t('recording.chat.templatePrompts.salesDiscovery.painPoints'),
          t('recording.chat.templatePrompts.salesDiscovery.budgetTimeline'),
          t('recording.chat.templatePrompts.salesDiscovery.decisionMakers'),
          t('recording.chat.templatePrompts.salesDiscovery.nextSteps'),
        ];
      case 'DAILY_STANDUP':
      case 'STANDUP':
        return [
          t('recording.chat.templatePrompts.dailyStandup.yesterdayProgress'),
          t('recording.chat.templatePrompts.dailyStandup.todayPriorities'),
          t('recording.chat.templatePrompts.dailyStandup.blockers'),
          t('recording.chat.templatePrompts.dailyStandup.sprintHealth'),
        ];
      case 'PODCAST':
        return [
          t('recording.chat.templatePrompts.podcast.centralThemes'),
          t('recording.chat.templatePrompts.podcast.memorableQuotes'),
          t('recording.chat.templatePrompts.podcast.keyTakeaways'),
          t('recording.chat.templatePrompts.podcast.resources'),
        ];
      case 'LECTURE':
        return [
          t('recording.chat.templatePrompts.lecture.coreTheories'),
          t('recording.chat.templatePrompts.lecture.caseStudies'),
          t('recording.chat.templatePrompts.lecture.examTakeaways'),
          t('recording.chat.templatePrompts.lecture.assignments'),
        ];
      case 'RESEARCH_DEEPDIVE':
      case 'RESEARCH':
        return [
          t('recording.chat.templatePrompts.researchDeepdive.researchQuestions'),
          t('recording.chat.templatePrompts.researchDeepdive.methodologyFindings'),
          t('recording.chat.templatePrompts.researchDeepdive.limitations'),
          t('recording.chat.templatePrompts.researchDeepdive.recommendations'),
        ];
      case 'MOM':
      case 'GENERAL':
      default:
        return [
          t('recording.chat.defaultPrompts.keyDecisions'),
          t('recording.chat.defaultPrompts.actionItems'),
          t('recording.chat.defaultPrompts.deadlines'),
          t('recording.chat.defaultPrompts.blockers'),
        ];
    }
  };

  const effectivePrompts = prompts ?? getTemplatePrompts(template);

  if (!effectivePrompts || effectivePrompts.length === 0) return null;

  return (
    <div data-testid="chat-chips" className={cn('space-y-2', className)}>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span>{t('recording.chat.quickQuestions')}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {effectivePrompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectPrompt(prompt)}
            disabled={disabled}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card/60 px-3 py-1.5 text-left text-xs text-foreground/90 transition-all',
              'hover:bg-secondary/70 hover:border-primary/40 hover:text-foreground active:scale-98',
              'disabled:pointer-events-none disabled:opacity-50',
              'focus:outline-none focus:ring-1 focus:ring-primary'
            )}
            data-testid={`chat-chip-${idx}`}
          >
            <MessageSquare className="h-3 w-3 text-primary shrink-0 opacity-80" />
            <span className="line-clamp-1">{prompt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
