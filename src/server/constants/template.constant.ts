/**
 * Template categories and internal schema enums.
 * Codified directly from youten-ai-core-api (internal/constants & migrations/20261004162533_create_templates_table.up.sql).
 */

export const TemplateKey = {
  MOM: 'MOM',                         // Minutes of Meeting (Agenda, Decisions, Action Items)
  ONE_ON_ONE: '1_ON_1',               // 1-on-1 Performance, Wellbeing & Growth Commitments
  INTERVIEW: 'INTERVIEW',             // STAR Scorecard, Competencies, Hiring Recommendation
  TECH_REVIEW: 'TECH_REVIEW',         // RFC / ADR, Rejected Alternatives, NFR Assessment
  SALES_DISCOVERY: 'SALES_DISCOVERY', // MEDDPICC Framework, Pain Points, Buying Process
  DAILY_STANDUP: 'DAILY_STANDUP',     // Agile Scrum (Yesterday, Today, Blockers, Sprint Health)
  GENERAL: 'GENERAL',                 // Cornell Notes, Executive Brief, Takeaways (Default)
  PODCAST: 'PODCAST',                 // Podcast & Talkshow
  LECTURE: 'LECTURE',                 // Lecture, Class & Webinar
  MUSIC_LYRICS: 'MUSIC_LYRICS',       // Music Lyrics & Composition
  RESEARCH_DEEPDIVE: 'RESEARCH_DEEPDIVE', // Academic Research & Deep Dive
} as const;

export type KnownTemplateKey = (typeof TemplateKey)[keyof typeof TemplateKey];
export type TemplateKey = KnownTemplateKey | (string & {});

export const DefaultTemplateKey = TemplateKey.GENERAL;

export const AllTemplateKeys = [
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
] as const;

/**
 * MOM internal schema enums
 */
export const MomActionPriority = {
  P0: 'P0',
  P1: 'P1',
  P2: 'P2',
} as const;
export type MomActionPriority = (typeof MomActionPriority)[keyof typeof MomActionPriority];

/**
 * 1-on-1 internal schema enums
 */
export const OneOnOneSentiment = {
  ENERGETIC: 'Energetic',
  BALANCED: 'Balanced',
  STRESSED: 'Stressed',
  OVERWHELMED: 'Overwhelmed',
} as const;
export type OneOnOneSentiment = (typeof OneOnOneSentiment)[keyof typeof OneOnOneSentiment];

export const OneOnOneParty = {
  MANAGER: 'MANAGER',
  REPORT: 'REPORT',
} as const;
export type OneOnOneParty = (typeof OneOnOneParty)[keyof typeof OneOnOneParty];

/**
 * Interview Scorecard internal schema enums
 */
export const InterviewRecommendation = {
  STRONG_HIRE: 'STRONG HIRE',
  HIRE: 'HIRE',
  LEAN_HIRE: 'LEAN HIRE',
  LEAN_REJECT: 'LEAN REJECT',
  STRONG_REJECT: 'STRONG REJECT',
} as const;
export type InterviewRecommendation =
  (typeof InterviewRecommendation)[keyof typeof InterviewRecommendation];

export const InterviewCompetencyRating = {
  EXCEEDS: 'Exceeds',
  MEETS: 'Meets',
  NEEDS_WORK: 'Needs Work',
  UNSATISFACTORY: 'Unsatisfactory',
} as const;
export type InterviewCompetencyRating =
  (typeof InterviewCompetencyRating)[keyof typeof InterviewCompetencyRating];

/**
 * Daily Standup internal schema enums
 */
export const DailyStandupSprintStatus = {
  ON_TRACK: 'ON TRACK',
  AT_RISK: 'AT RISK',
  BLOCKED: 'BLOCKED',
} as const;
export type DailyStandupSprintStatus =
  (typeof DailyStandupSprintStatus)[keyof typeof DailyStandupSprintStatus];
