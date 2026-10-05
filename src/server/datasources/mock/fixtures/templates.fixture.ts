import {
  MomStructuredData,
  OneOnOneStructuredData,
  InterviewStructuredData,
  TechReviewStructuredData,
  SalesDiscoveryStructuredData,
  DailyStandupStructuredData,
  GeneralStructuredData,
} from '../../../schemas';
import {
  MomActionPriority,
  OneOnOneSentiment,
  OneOnOneParty,
  InterviewRecommendation,
  InterviewCompetencyRating,
  DailyStandupSprintStatus,
} from '../../../constants';

export const mockMomStructuredData: MomStructuredData = {
  meeting_title: 'Engineering Architecture & Q4 Scalability Review',
  executive_summary:
    'The engineering leadership team reviewed Q4 scalability bottlenecks and approved migrating vector search to PostgreSQL pgvector alongside Redis caching for real-time SSE progress streaming.',
  meeting_dynamics: {
    speaker_talk_time: [
      { speaker: 'Alice (CTO)', percentage: 45, duration_minutes: 27 },
      { speaker: 'Bob (Staff Engineer)', percentage: 35, duration_minutes: 21 },
      { speaker: 'Charlie (Product Lead)', percentage: 20, duration_minutes: 12 },
    ],
    consensus_score: '9.2 / 10',
    sentiment_trajectory: 'Cautious early on regarding migration complexity, transitioning into strong alignment on Redis caching.',
  },
  stakeholder_perspectives: {
    executive_brief: 'Architecture adjustments remain within budget and timeline.',
    engineering_focus: 'Need to isolate connection pool exhaustion and test SSE streaming durability.',
    product_delivery: 'Feature roadmap on track for launch next sprint.',
  },
  key_decisions: [
    {
      decision: 'Adopt PostgreSQL pgvector as primary vector storage',
      root_cause_trigger: 'Pinecone egress cost and operational complexity for on-premise deployments',
      contested_points: 'Migration effort and indexing re-build duration',
      quantitative_impact: 'Reduced cloud infrastructure cost by 65% with sub-50ms vector query latency',
      approved_by: 'Alice (CTO)',
    },
    {
      decision: 'Implement Redis pub/sub for SSE progress events',
      root_cause_trigger: 'Worker polling bottlenecks in high-concurrency transcription jobs',
      contested_points: 'In-memory fallback requirement for local development',
      quantitative_impact: 'Zero database polling overhead during transcription and diarization',
      approved_by: 'Bob (Staff Engineer)',
    },
  ],
  action_items: [
    {
      task: 'Provision PostgreSQL pgvector replica and benchmark HNSW index',
      pic: 'Bob',
      due_date: '2026-10-14',
      priority: MomActionPriority.P0,
      definition_of_done: 'Latency benchmark < 50ms across 1M chunks with zero read errors',
      cost_of_inaction: 'Vector query bottlenecks on production launch',
    },
    {
      task: 'Wire Redis SSE event publisher into transcription worker',
      pic: 'Alice',
      due_date: '2026-10-16',
      priority: MomActionPriority.P1,
      definition_of_done: 'SSE progress stepper connects and updates in UI in real-time',
      cost_of_inaction: 'Degraded UX with users unaware of transcription progress',
    },
  ],
  open_issues: [
    'Define automated database migration rollback strategies for schema versioning',
  ],
};

export const mockOneOnOneStructuredData: OneOnOneStructuredData = {
  wellbeing_assessment: {
    sentiment_score: OneOnOneSentiment.BALANCED,
    summary: 'Balanced after recent sprint reorganization',
  },
  key_wins: [
    'Implemented contract DTOs and runtime Zod schemas for BFF layer',
    'Standardized atomic UI primitives and Clean Architecture layers',
  ],
  blockers: [
    'Context switching between frontend UI and Core API pipeline',
  ],
  feedback_exchanged: {
    for_report: ['Continue mentoring peers on contract-first API development.'],
    for_manager: ['Keep weekly syncs focused on blockers and architectural alignment.'],
  },
  growth_notes: 'On track to lead the Next.js 16 App Router modernization',
  commitments: [
    {
      party: OneOnOneParty.MANAGER,
      action_item: 'Set up automated performance load test on local staging environment',
      timeline: '2026-10-18',
    },
    {
      party: OneOnOneParty.REPORT,
      action_item: 'Complete full BFF repository test coverage',
      timeline: '2026-10-12',
    },
  ],
};

export const mockInterviewStructuredData: InterviewStructuredData = {
  candidate_name: 'Alex Mercer',
  target_role: 'Senior Full Stack Engineer',
  recommendation: InterviewRecommendation.STRONG_HIRE,
  justification:
    'Alex possesses the exact architectural and hands-on skills needed to build and scale our Next.js BFF and real-time meeting intelligence platform.',
  competency_scores: [
    {
      competency: 'System Architecture & Clean Design',
      rating: InterviewCompetencyRating.EXCEEDS,
      evidence: 'Clearly explained Hexagonal Architecture, BFF layer boundaries, and Anti-Corruption patterns.',
    },
    {
      competency: 'TypeScript & Type Safety',
      rating: InterviewCompetencyRating.EXCEEDS,
      evidence: 'Mastery of Zod runtime validation, TypeScript strict mode, and schema-driven contracts.',
    },
    {
      competency: 'Frontend Performance & Audio Streaming',
      rating: InterviewCompetencyRating.MEETS,
      evidence: 'Solid understanding of Web Audio API, requestAnimationFrame, and Zustand state optimization.',
    },
  ],
  strengths: [
    'Deep architectural discipline with zero tolerance for sloppy types or guesswork',
    'Demonstrated expertise in building resilient streaming and SSE connections',
  ],
  concerns: [],
  culture_fit_notes: 'Proactive collaborator with high ownership and clean communication.',
  next_round_probes: ['Discuss experience handling massive WebSockets or SSE scale.'],
};

export const mockTechReviewStructuredData: TechReviewStructuredData = {
  context:
    'BFF Audio Ingestion & Diarization Pipeline - Direct browser-to-S3 presigned uploads with server-side metadata registration and SSE progress streaming.',
  decisions_adopted: [
    {
      decision: 'Direct S3 Presign Uploads',
      technical_justification:
        'Supports large files up to 500MB without buffer exhaustion and zero load on Next.js server.',
    },
  ],
  rejected_alternatives: [
    {
      alternative: 'Upload through Next.js API Route',
      rejection_reason: 'Server memory spikes and payload limits on serverless runtimes.',
    },
  ],
  nfr_assessment: {
    security: 'Presigned URLs expire after 15 minutes, Content-Type whitelisting strictly enforced.',
    performance_scalability: 'Direct uploads to S3 scale horizontally without Next.js memory footprint.',
    reliability_resilience: 'Automatic fallback and resumable upload options.',
  },
  technical_debt_impact: 'None; clean separation of ingestion and processing.',
  action_items: [
    {
      task: 'Wire Redis SSE event publisher into transcription worker',
      assignee: 'Alice',
      target_sprint: 'Sprint 4',
    },
  ],
};

export const mockSalesDiscoveryStructuredData: SalesDiscoveryStructuredData = {
  prospect_company: 'HyperScale Logistics Ltd',
  pain_points: [
    {
      pain: 'Account executives spend 10+ hours per week manually writing meeting minutes and task summaries',
      cost_of_inaction: '500+ sales engineering hours lost each month and missed deal follow-ups',
    },
  ],
  desired_outcomes: [
    'Instant meeting transcription and executive summary generation within 60 seconds of meeting end',
    'Automated CRM sync and team task assignments',
  ],
  meddpicc: {
    metrics: 'Save 10 hours per rep weekly; increase deal pipeline velocity by 25%',
    economic_buyer: 'Chief Commercial Officer (CCO)',
    decision_criteria: 'Accuracy of multilingual transcription (Indonesian & English), data privacy, and SOC2 compliance',
    champion: 'VP of Sales Operations',
  },
  objections: [
    'Customer audio privacy and data retention policies for meeting recordings',
  ],
  next_steps: [
    {
      action: 'Provide Enterprise Security Whitepaper and schedule technical deep-dive demo',
      owner: 'Account Executive',
      target_date: '2026-10-12',
    },
  ],
};

export const mockDailyStandupStructuredData: DailyStandupStructuredData = {
  sprint_health: {
    status: DailyStandupSprintStatus.ON_TRACK,
    summary: 'Sprint velocity is stable with all core features tracking on schedule.',
  },
  member_updates: [
    {
      member_name: 'David',
      yesterday: ['Implemented contract DTOs and runtime Zod schemas for BFF layer'],
      today: ['Build BFF HTTP client and contract-compliant repositories'],
      blockers: [],
    },
    {
      member_name: 'Eva',
      yesterday: ['Validated Core API route declarations and Redis queue latency'],
      today: ['Add integration test fixtures for diarized transcription pipeline'],
      blockers: [],
    },
  ],
  critical_blockers: [],
  parking_lot_discussions: [
    {
      topic: 'Coordinate with QA on automated Playwright test scenarios',
      participants: ['David', 'Eva'],
    },
  ],
};

export const mockGeneralStructuredData: GeneralStructuredData = {
  executive_overview:
    'Youten AI delivers enterprise-grade meeting minutes and actionable summaries at scale. Zero guesswork in contract architecture guarantees rapid and resilient feature integration.',
  core_themes: [
    {
      theme: 'Meeting Intelligence Product Roadmap',
      summary_points: [
        'Voice Bot for automated meeting recording joining Zoom and Google Meet',
        'Karaoke synchronized transcript playback with word-level confidence ratings',
        'Cross-meeting workspace semantic vector search via pgvector',
      ],
    },
  ],
  key_takeaways: [
    'Clean architecture and contract-first development eliminate 90% of integration defects.',
  ],
  notable_quotes: [
    {
      quote: 'Clean architecture and contract-first development eliminate 90% of integration defects.',
      speaker: 'Lead Architect',
      context: 'Sprint Planning',
    },
  ],
  referenced_resources: ['https://youten.ai/docs/architecture'],
};

