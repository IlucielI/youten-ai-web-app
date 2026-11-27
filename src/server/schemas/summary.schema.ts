import { z } from 'zod';
import {
  TemplateKey,
  MomActionPriority,
  OneOnOneSentiment,
  OneOnOneParty,
  InterviewRecommendation,
  InterviewCompetencyRating,
  DailyStandupSprintStatus,
} from '../constants/template.constant';

const nullableString = z.string().nullable().optional();

function nullableArray<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.preprocess((val) => (val == null ? [] : val), z.array(itemSchema));
}

function nullableOptionalArray<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.preprocess((val) => (val == null ? undefined : val), z.array(itemSchema).optional());
}

export const DiscussionTopicItemSchema = z.object({
  topic: z.string(),
  key_points: nullableArray(z.string()),
});

/**
 * -----------------------------------------------------------------------------
 * 1. Polymorphic Template Structured Data Schemas
 * Codified directly from Core API migration JSON Schemas
 * -----------------------------------------------------------------------------
 */

export const MomStructuredDataSchema = z.object({
  meeting_title: z.string(),
  meeting_goal: nullableString,
  executive_summary: z.string(),
  discussion_topics: nullableOptionalArray(DiscussionTopicItemSchema),
  meeting_dynamics: z.object({
    speaker_talk_time: nullableArray(
      z.object({
        speaker: z.string(),
        percentage: z.number(),
        duration_minutes: z.number(),
      })
    ),
    consensus_score: z.string(),
    sentiment_trajectory: z.string(),
  }),
  stakeholder_perspectives: z.object({
    executive_brief: z.string(),
    engineering_focus: z.string(),
    product_delivery: z.string(),
  }),
  key_decisions: nullableArray(
    z.object({
      decision: z.string(),
      root_cause_trigger: z.string(),
      contested_points: z.string(),
      quantitative_impact: z.string(),
      approved_by: z.string(),
    })
  ),
  action_items: nullableArray(
    z.object({
      task: z.string(),
      pic: z.string(),
      due_date: z.string(),
      priority: z.enum([MomActionPriority.P0, MomActionPriority.P1, MomActionPriority.P2]),
      definition_of_done: z.string(),
      cost_of_inaction: z.string(),
    })
  ),
  open_issues: nullableArray(z.string()),
  open_points: nullableOptionalArray(z.string()),
  next_meeting: nullableString,
});
export type MomStructuredData = z.infer<typeof MomStructuredDataSchema>;

export const OneOnOneStructuredDataSchema = z.object({
  wellbeing_assessment: z.object({
    sentiment_score: z.enum([
      OneOnOneSentiment.ENERGETIC,
      OneOnOneSentiment.BALANCED,
      OneOnOneSentiment.STRESSED,
      OneOnOneSentiment.OVERWHELMED,
    ]),
    summary: z.string(),
  }),
  key_wins: nullableArray(z.string()),
  blockers: nullableArray(z.string()),
  feedback_exchanged: z.object({
    for_report: nullableArray(z.string()),
    for_manager: nullableArray(z.string()),
  }),
  growth_notes: nullableString,
  commitments: nullableArray(
    z.object({
      party: z.enum([OneOnOneParty.MANAGER, OneOnOneParty.REPORT]),
      action_item: z.string(),
      timeline: z.string(),
    })
  ),
});
export type OneOnOneStructuredData = z.infer<typeof OneOnOneStructuredDataSchema>;

export const InterviewStructuredDataSchema = z.object({
  candidate_name: z.string(),
  target_role: z.string(),
  recommendation: z.enum([
    InterviewRecommendation.STRONG_HIRE,
    InterviewRecommendation.HIRE,
    InterviewRecommendation.LEAN_HIRE,
    InterviewRecommendation.LEAN_REJECT,
    InterviewRecommendation.STRONG_REJECT,
  ]),
  justification: z.string(),
  competency_scores: nullableArray(
    z.object({
      competency: z.string(),
      rating: z.enum([
        InterviewCompetencyRating.EXCEEDS,
        InterviewCompetencyRating.MEETS,
        InterviewCompetencyRating.NEEDS_WORK,
        InterviewCompetencyRating.UNSATISFACTORY,
      ]),
      evidence: z.string(),
    })
  ),
  strengths: nullableArray(z.string()),
  concerns: nullableArray(z.string()),
  culture_fit_notes: nullableString,
  next_round_probes: nullableArray(z.string()),
});
export type InterviewStructuredData = z.infer<typeof InterviewStructuredDataSchema>;

export const TechReviewStructuredDataSchema = z.object({
  context: z.string(),
  discussion_topics: nullableOptionalArray(DiscussionTopicItemSchema),
  decisions_adopted: nullableArray(
    z.object({
      decision: z.string(),
      technical_justification: z.string(),
    })
  ),
  rejected_alternatives: nullableArray(
    z.object({
      alternative: z.string(),
      rejection_reason: z.string(),
    })
  ),
  nfr_assessment: z.object({
    security: z.string(),
    performance_scalability: z.string(),
    reliability_resilience: z.string(),
  }),
  technical_debt_impact: nullableString,
  open_points: nullableOptionalArray(z.string()),
  action_items: nullableArray(
    z.object({
      task: z.string(),
      assignee: z.string(),
      target_sprint: z.string(),
      due_date: nullableString,
      priority: nullableString,
    })
  ),
});
export type TechReviewStructuredData = z.infer<typeof TechReviewStructuredDataSchema>;

export const SalesDiscoveryStructuredDataSchema = z.object({
  prospect_company: z.string(),
  deal_stage_suggested: nullableString,
  pain_points: nullableArray(
    z.object({
      pain: z.string(),
      cost_of_inaction: z.string(),
    })
  ),
  desired_outcomes: nullableArray(z.string()),
  meddpicc: z.object({
    metrics: z.string(),
    economic_buyer: z.string(),
    decision_criteria: z.string(),
    champion: z.string(),
    competition: nullableString,
  }),
  objections: nullableArray(z.string()),
  next_steps: nullableArray(
    z.object({
      action: z.string(),
      owner: z.string(),
      target_date: z.string(),
    })
  ),
});
export type SalesDiscoveryStructuredData = z.infer<typeof SalesDiscoveryStructuredDataSchema>;

export const DailyStandupStructuredDataSchema = z.object({
  sprint_health: z.object({
    status: z.enum([
      DailyStandupSprintStatus.ON_TRACK,
      DailyStandupSprintStatus.AT_RISK,
      DailyStandupSprintStatus.BLOCKED,
    ]),
    summary: z.string(),
  }),
  member_updates: nullableArray(
    z.object({
      member_name: z.string(),
      yesterday: nullableArray(z.string()),
      today: nullableArray(z.string()),
      blockers: nullableArray(z.string()),
    })
  ),
  critical_blockers: nullableArray(z.string()),
  parking_lot_discussions: nullableArray(
    z.object({
      topic: z.string(),
      participants: nullableArray(z.string()),
    })
  ),
});
export type DailyStandupStructuredData = z.infer<typeof DailyStandupStructuredDataSchema>;

export const GeneralStructuredDataSchema = z.object({
  executive_overview: z.string(),
  discussion_topics: nullableOptionalArray(DiscussionTopicItemSchema),
  open_points: nullableOptionalArray(z.string()),
  action_items: nullableOptionalArray(
    z.object({
      task: z.string(),
      pic: z.string(),
      due_date: z.string(),
      priority: nullableString,
    })
  ),
  core_themes: nullableOptionalArray(
    z.object({
      theme: z.string(),
      summary_points: nullableArray(z.string()),
    })
  ),
  key_takeaways: nullableArray(z.string()),
  notable_quotes: nullableOptionalArray(
    z.object({
      quote: z.string(),
      speaker: z.string(),
      context: nullableString,
    })
  ),
  referenced_resources: nullableOptionalArray(z.string()),
});
export type GeneralStructuredData = z.infer<typeof GeneralStructuredDataSchema>;

export const PodcastStructuredDataSchema = z.object({
  episode_title: z.string(),
  show_notes: z.string(),
  guest_overview: z
    .object({
      guest_name: nullableString,
      guest_title: nullableString,
      bio_or_background: nullableString,
    })
    .nullable()
    .optional(),
  topic_chapters: nullableArray(
    z.object({
      timestamp: z.string(),
      topic: z.string(),
      summary: z.string(),
    })
  ),
  key_takeaways: nullableArray(z.string()),
  golden_quotes: nullableArray(
    z.object({
      quote: z.string(),
      speaker: z.string(),
      context: nullableString,
    })
  ),
  referenced_resources: nullableArray(
    z.object({
      title: nullableString,
      type: nullableString,
      description: nullableString,
      url: nullableString,
    })
  ),
});
export type PodcastStructuredData = z.infer<typeof PodcastStructuredDataSchema>;

export const LectureStructuredDataSchema = z.object({
  lecture_title: z.string(),
  course_summary: z.string(),
  learning_objectives: nullableArray(z.string()),
  core_concepts: nullableArray(
    z.object({
      concept: z.string(),
      explanation: z.string(),
      examples: nullableString,
    })
  ),
  technical_glossary: nullableArray(
    z.object({
      term: z.string(),
      definition: z.string(),
    })
  ),
  topic_notes: nullableArray(
    z.object({
      topic: z.string(),
      key_points: nullableArray(z.string()),
    })
  ),
  exam_review_questions: nullableArray(
    z.object({
      question: z.string(),
      hint_or_key_answer: z.string(),
    })
  ),
});
export type LectureStructuredData = z.infer<typeof LectureStructuredDataSchema>;

export const MusicLyricsStructuredDataSchema = z.object({
  song_title: z.string(),
  artist_or_performers: nullableString,
  musical_style: nullableString,
  structured_lyrics: nullableArray(
    z.object({
      section: z.string(),
      lyrics: z.string(),
    })
  ),
  emotional_tone: z.object({
    primary_mood: z.string(),
    energy_level: z.string(),
    sentiment_analysis: nullableString,
  }),
  core_message: z.string(),
  thematic_elements: nullableArray(z.string()),
});
export type MusicLyricsStructuredData = z.infer<typeof MusicLyricsStructuredDataSchema>;

export const ResearchDeepdiveStructuredDataSchema = z.object({
  research_title: z.string(),
  abstract_or_summary: z.string(),
  key_methodology: nullableString,
  literature_synthesis: nullableArray(z.string()),
  key_findings: nullableArray(
    z.object({
      finding: z.string(),
      implication: nullableString,
    })
  ),
  limitations_and_future_work: nullableArray(z.string()),
});
export type ResearchDeepdiveStructuredData = z.infer<typeof ResearchDeepdiveStructuredDataSchema>;

/**
 * -----------------------------------------------------------------------------
 * 2. Summary & Versioning DTO Schemas
 * -----------------------------------------------------------------------------
 */

export const SummaryDtoSchema = z.object({
  id: z.string().uuid(),
  template_category: z.string(),
  custom_angle: z.string().nullable().optional(),
  version: z.number().int().positive(),
  is_active: z.boolean(),
  structured_data: z.record(z.string(), z.unknown()),
  markdown_content: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type SummaryDtoType = z.infer<typeof SummaryDtoSchema>;

export const SummaryVersionResponseSchema = z.object({
  id: z.string().uuid(),
  version: z.number().int().positive(),
  template_category: z.string(),
  custom_angle: z.string().nullable().optional(),
  structured_data: z.record(z.string(), z.unknown()),
  markdown_content: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
});
export type SummaryVersionResponseDto = z.infer<typeof SummaryVersionResponseSchema>;

export const RegenerateSummaryRequestSchema = z.object({
  template_category: z.enum([
    TemplateKey.MOM,
    TemplateKey.ONE_ON_ONE,
    TemplateKey.INTERVIEW,
    TemplateKey.TECH_REVIEW,
    TemplateKey.SALES_DISCOVERY,
    TemplateKey.DAILY_STANDUP,
    TemplateKey.GENERAL,
    TemplateKey.PODCAST,
    TemplateKey.LECTURE,
    TemplateKey.MUSIC_LYRICS,
    TemplateKey.RESEARCH_DEEPDIVE,
  ]).optional(),
  custom_angle: z.string().trim().max(2000, 'Custom angle cannot exceed 2000 characters').nullable().optional(),
  ownership_token: z.string().optional(),
});
export type RegenerateSummaryRequestInput = z.infer<typeof RegenerateSummaryRequestSchema>;
