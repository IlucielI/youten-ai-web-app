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

/**
 * -----------------------------------------------------------------------------
 * 1. Polymorphic Template Structured Data Schemas
 * Codified directly from Core API migration JSON Schemas
 * -----------------------------------------------------------------------------
 */

export const MomStructuredDataSchema = z.object({
  meeting_title: z.string(),
  meeting_goal: z.string().optional(),
  executive_summary: z.string(),
  meeting_dynamics: z.object({
    speaker_talk_time: z.array(
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
  key_decisions: z.array(
    z.object({
      decision: z.string(),
      root_cause_trigger: z.string(),
      contested_points: z.string(),
      quantitative_impact: z.string(),
      approved_by: z.string(),
    })
  ),
  action_items: z.array(
    z.object({
      task: z.string(),
      pic: z.string(),
      due_date: z.string(),
      priority: z.enum([MomActionPriority.P0, MomActionPriority.P1, MomActionPriority.P2]),
      definition_of_done: z.string(),
      cost_of_inaction: z.string(),
    })
  ),
  open_issues: z.array(z.string()),
  next_meeting: z.string().optional(),
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
  key_wins: z.array(z.string()),
  blockers: z.array(z.string()),
  feedback_exchanged: z.object({
    for_report: z.array(z.string()),
    for_manager: z.array(z.string()),
  }),
  growth_notes: z.string().optional(),
  commitments: z.array(
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
  competency_scores: z.array(
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
  strengths: z.array(z.string()),
  concerns: z.array(z.string()),
  culture_fit_notes: z.string().optional(),
  next_round_probes: z.array(z.string()).optional(),
});
export type InterviewStructuredData = z.infer<typeof InterviewStructuredDataSchema>;

export const TechReviewStructuredDataSchema = z.object({
  context: z.string(),
  decisions_adopted: z.array(
    z.object({
      decision: z.string(),
      technical_justification: z.string(),
    })
  ),
  rejected_alternatives: z.array(
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
  technical_debt_impact: z.string().optional(),
  action_items: z.array(
    z.object({
      task: z.string(),
      assignee: z.string(),
      target_sprint: z.string(),
    })
  ),
});
export type TechReviewStructuredData = z.infer<typeof TechReviewStructuredDataSchema>;

export const SalesDiscoveryStructuredDataSchema = z.object({
  prospect_company: z.string(),
  deal_stage_suggested: z.string().optional(),
  pain_points: z.array(
    z.object({
      pain: z.string(),
      cost_of_inaction: z.string(),
    })
  ),
  desired_outcomes: z.array(z.string()),
  meddpicc: z.object({
    metrics: z.string(),
    economic_buyer: z.string(),
    decision_criteria: z.string(),
    champion: z.string(),
    competition: z.string().optional(),
  }),
  objections: z.array(z.string()),
  next_steps: z.array(
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
  member_updates: z.array(
    z.object({
      member_name: z.string(),
      yesterday: z.array(z.string()),
      today: z.array(z.string()),
      blockers: z.array(z.string()).optional(),
    })
  ),
  critical_blockers: z.array(z.string()),
  parking_lot_discussions: z
    .array(
      z.object({
        topic: z.string(),
        participants: z.array(z.string()),
      })
    )
    .optional(),
});
export type DailyStandupStructuredData = z.infer<typeof DailyStandupStructuredDataSchema>;

export const GeneralStructuredDataSchema = z.object({
  executive_overview: z.string(),
  core_themes: z.array(
    z.object({
      theme: z.string(),
      summary_points: z.array(z.string()),
    })
  ),
  key_takeaways: z.array(z.string()),
  notable_quotes: z.array(
    z.object({
      quote: z.string(),
      speaker: z.string(),
      context: z.string(),
    })
  ),
  referenced_resources: z.array(z.string()).optional(),
});
export type GeneralStructuredData = z.infer<typeof GeneralStructuredDataSchema>;

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
  ]).or(z.string()).optional(),
  custom_angle: z.string().trim().max(2000, 'Custom angle cannot exceed 2000 characters').nullable().optional(),
  ownership_token: z.string().optional(),
});
export type RegenerateSummaryRequestInput = z.infer<typeof RegenerateSummaryRequestSchema>;
