import { describe, it, expect } from 'vitest';
import {
  RegisterRequestSchema,
  LoginRequestSchema,
  ChangePasswordRequestSchema,
  PresignUploadRequestSchema,
  UploadRecordingRequestSchema,
  ImportUrlRequestSchema,
  RecordingFilterQuerySchema,
  MomStructuredDataSchema,
  OneOnOneStructuredDataSchema,
  InterviewStructuredDataSchema,
  TechReviewStructuredDataSchema,
  SalesDiscoveryStructuredDataSchema,
  DailyStandupStructuredDataSchema,
  GeneralStructuredDataSchema,
  RegenerateSummaryRequestSchema,
  SpeakerAnalyticsSchema,
  RecordingAnalyticsSchema,
  CreateCommentRequestSchema,
  CommentResponseSchema,
  RecordingChatRequestSchema,
  ProgressEventSchema,
  ChatDoneEventSchema,
  SemanticSearchQuerySchema,
  WorkspaceAskRequestSchema,
  WaitlistRequestSchema,
} from './index';
import {
  TemplateKey,
  RecordingStatus,
  PipelineErrorCode,
  MomActionPriority,
  OneOnOneSentiment,
  OneOnOneParty,
  InterviewRecommendation,
  InterviewCompetencyRating,
  DailyStandupSprintStatus,
} from '../constants';

describe('Domain Schemas & Validation Rules', () => {
  describe('Auth Schemas', () => {
    it('should validate valid registration input', () => {
      const valid = {
        email: 'user@example.com',
        password: 'Password123',
        full_name: 'John Doe',
      };
      const parsed = RegisterRequestSchema.parse(valid);
      expect(parsed.email).toBe('user@example.com');
      expect(parsed.full_name).toBe('John Doe');
    });

    it('should validate valid login input', () => {
      const valid = {
        email: 'user@example.com',
        password: 'Password123',
      };
      const parsed = LoginRequestSchema.parse(valid);
      expect(parsed.email).toBe('user@example.com');
    });

    it('should reject password without digits or shorter than 8 chars', () => {
      expect(() =>
        RegisterRequestSchema.parse({
          email: 'user@example.com',
          password: 'password', // no digit
          full_name: 'John Doe',
        })
      ).toThrow();

      expect(() =>
        RegisterRequestSchema.parse({
          email: 'user@example.com',
          password: 'Pass1', // too short (<8)
          full_name: 'John Doe',
        })
      ).toThrow();
    });

    it('should reject ChangePassword if new_password is equal to old_password', () => {
      const input = {
        old_password: 'Password123',
        new_password: 'Password123',
      };
      expect(() => ChangePasswordRequestSchema.parse(input)).toThrow(
        /New password cannot be the same as current password/
      );
    });

    it('should accept ChangePassword with different valid new password', () => {
      const input = {
        old_password: 'Password123',
        new_password: 'NewPassword456',
      };
      expect(() => ChangePasswordRequestSchema.parse(input)).not.toThrow();
    });
  });

  describe('Recording Schemas', () => {
    it('should validate PresignUploadRequest', () => {
      const parsed = PresignUploadRequestSchema.parse({
        filename: 'meeting.mp4',
        content_type: 'video/mp4',
      });
      expect(parsed.filename).toBe('meeting.mp4');
    });

    it('should validate UploadRecordingRequest with defaults', () => {
      const parsed = UploadRecordingRequestSchema.parse({
        filename: 'audio.mp3',
        object_key: 'recordings/123/audio.mp3',
        title: 'Weekly Standup',
        template: TemplateKey.MOM,
        language: 'id',
      });
      expect(parsed.template).toBe('MOM');
    });

    it('should reject ImportUrlRequest with non-http/https URL', () => {
      expect(() =>
        ImportUrlRequestSchema.parse({
          url: 'ftp://example.com/audio.mp3',
        })
      ).toThrow(/Only http and https/);
    });

    it('should parse RecordingFilterQuery with sorting and pagination defaults', () => {
      const parsed = RecordingFilterQuerySchema.parse({});
      expect(parsed.page).toBe(1);
      expect(parsed.limit).toBe(10);
      expect(parsed.sort_by).toBe('created_at');
      expect(parsed.sort_order).toBe('desc');
    });
  });

  describe('Polymorphic Summary Structured Data Schemas', () => {
    it('should validate MOM structured data schema with P0/P1/P2 priorities', () => {
      const validMom = {
        meeting_title: 'Sprint Planning',
        executive_summary: 'Discussed Q4 roadmap and priorities.',
        meeting_dynamics: {
          speaker_talk_time: [
            { speaker: 'Alice', percentage: 60, duration_minutes: 30 },
            { speaker: 'Bob', percentage: 40, duration_minutes: 20 },
          ],
          consensus_score: '8.5/10',
          sentiment_trajectory: 'Positive throughout',
        },
        stakeholder_perspectives: {
          executive_brief: 'Timeline remains on track.',
          engineering_focus: 'Need to resolve DB connection pool issue.',
          product_delivery: 'Feature launch target confirmed.',
        },
        key_decisions: [
          {
            decision: 'Adopt PostgreSQL pgvector',
            root_cause_trigger: 'Scalability requirement',
            contested_points: 'Migration effort',
            quantitative_impact: '5x query performance',
            approved_by: 'CTO',
          },
        ],
        action_items: [
          {
            task: 'Deploy Redis cluster',
            pic: 'Bob',
            due_date: '2026-10-15',
            priority: MomActionPriority.P0,
            definition_of_done: 'Cluster operational with healthcheck passing',
            cost_of_inaction: 'Cache eviction under high load',
          },
        ],
        open_issues: ['Finalizing pricing tier'],
      };

      const parsed = MomStructuredDataSchema.parse(validMom);
      expect(parsed.meeting_title).toBe('Sprint Planning');
      expect(parsed.action_items[0].priority).toBe('P0');
    });

    it('should validate 1-on-1 structured data with sentiment enum', () => {
      const valid1on1 = {
        wellbeing_assessment: {
          sentiment_score: OneOnOneSentiment.BALANCED,
          summary: 'Feeling good, managing workload well.',
        },
        key_wins: ['Delivered authentication module'],
        blockers: ['Awaiting design specs'],
        feedback_exchanged: {
          for_report: ['Great ownership'],
          for_manager: ['Need earlier PR reviews'],
        },
        commitments: [
          {
            party: OneOnOneParty.MANAGER,
            action_item: 'Unblock design assets with design team',
            timeline: 'By tomorrow',
          },
        ],
      };

      const parsed = OneOnOneStructuredDataSchema.parse(valid1on1);
      expect(parsed.wellbeing_assessment.sentiment_score).toBe('Balanced');
      expect(parsed.commitments[0].party).toBe('MANAGER');
    });

    it('should validate Interview scorecard with recommendation enum', () => {
      const validInterview = {
        candidate_name: 'Jane Doe',
        target_role: 'Senior Backend Engineer',
        recommendation: InterviewRecommendation.STRONG_HIRE,
        justification: 'Excellent system design and deep understanding of distributed locks.',
        competency_scores: [
          {
            competency: 'System Architecture',
            rating: InterviewCompetencyRating.EXCEEDS,
            evidence: 'Designed resilient distributed rate limiter on whiteboard.',
          },
        ],
        strengths: ['Clear communication', 'Production debugging experience'],
        concerns: ['None significant'],
      };

      const parsed = InterviewStructuredDataSchema.parse(validInterview);
      expect(parsed.recommendation).toBe('STRONG HIRE');
    });

    it('should validate Tech Review structured data schema', () => {
      const validTech = {
        context: 'Evaluating vector search database',
        decisions_adopted: [
          {
            decision: 'Use pgvector extension in PostgreSQL',
            technical_justification: 'Unified operational boundary and zero additional infra costs',
          },
        ],
        rejected_alternatives: [
          {
            alternative: 'Standalone Pinecone / Qdrant',
            rejection_reason: 'Extra SaaS operational complexity and latency overhead',
          },
        ],
        nfr_assessment: {
          security: 'Internal VPC isolation',
          performance_scalability: 'HNSW indexing supports 1M vectors under 15ms',
          reliability_resilience: 'Standard Postgres failover replicas',
        },
        action_items: [
          {
            task: 'Run load test on vector index',
            assignee: 'Infra Lead',
            target_sprint: 'Sprint 24',
          },
        ],
      };

      const parsed = TechReviewStructuredDataSchema.parse(validTech);
      expect(parsed.decisions_adopted[0].decision).toContain('pgvector');
    });

    it('should validate Sales Discovery structured data schema', () => {
      const validSales = {
        prospect_company: 'Acme Corp',
        pain_points: [
          {
            pain: 'Manual meeting minutes take 2 hours per session',
            cost_of_inaction: '50 engineering hours wasted weekly',
          },
        ],
        desired_outcomes: ['Automated MOM generation in under 60 seconds'],
        meddpicc: {
          metrics: 'Save 200 hours monthly',
          economic_buyer: 'VP of Engineering',
          decision_criteria: 'On-premise / private cloud capability',
          champion: 'Engineering Manager',
        },
        objections: ['Data privacy concern for meeting transcripts'],
        next_steps: [
          {
            action: 'Send security architecture whitepaper',
            owner: 'Account Executive',
            target_date: '2026-10-12',
          },
        ],
      };

      const parsed = SalesDiscoveryStructuredDataSchema.parse(validSales);
      expect(parsed.prospect_company).toBe('Acme Corp');
    });

    it('should validate Daily Standup with sprint status enum', () => {
      const validStandup = {
        sprint_health: {
          status: DailyStandupSprintStatus.ON_TRACK,
          summary: 'Velocity steady, 80% tasks done.',
        },
        member_updates: [
          {
            member_name: 'Developer 1',
            yesterday: ['Refactored auth controller'],
            today: ['Adding schema tests'],
            blockers: [],
          },
        ],
        critical_blockers: [],
      };

      const parsed = DailyStandupStructuredDataSchema.parse(validStandup);
      expect(parsed.sprint_health.status).toBe('ON TRACK');
    });

    it('should validate General summary structured data schema', () => {
      const validGeneral = {
        executive_overview: 'Quarterly all-hands discussion',
        core_themes: [
          {
            theme: 'Product velocity',
            summary_points: ['Shipped Next.js 16 web app', 'Maintained 0 bugs'],
          },
        ],
        key_takeaways: ['Focus on AI meeting intelligence'],
        notable_quotes: [
          {
            quote: 'Simplicity is prerequisites for reliability.',
            speaker: 'CTO',
            context: 'Architecture review',
          },
        ],
      };

      const parsed = GeneralStructuredDataSchema.parse(validGeneral);
      expect(parsed.key_takeaways.length).toBe(1);
    });

    it('should validate RegenerateSummaryRequest custom angle constraint', () => {
      const valid = {
        template_category: TemplateKey.TECH_REVIEW,
        custom_angle: 'Focus on database migration risk and latency degradation.',
      };
      const parsed = RegenerateSummaryRequestSchema.parse(valid);
      expect(parsed.template_category).toBe('TECH_REVIEW');

      // Check max length limit on custom angle
      const invalid = {
        custom_angle: 'a'.repeat(2001),
      };
      expect(() => RegenerateSummaryRequestSchema.parse(invalid)).toThrow(
        /Custom angle cannot exceed 2000 characters/
      );
    });
  });

  describe('Analytics & Comments Schemas', () => {
    it('should validate SpeakerAnalyticsSchema individually', () => {
      const speaker = {
        name: 'Speaker 0',
        total_seconds: 45.0,
        word_count: 120,
        share_percent: 60.0,
      };
      const parsed = SpeakerAnalyticsSchema.parse(speaker);
      expect(parsed.name).toBe('Speaker 0');
    });

    it('should validate RecordingAnalytics with multiple speakers', () => {
      const valid = {
        total_duration_seconds: 120.5,
        total_words: 350,
        speakers: [
          {
            name: 'Speaker 0',
            total_seconds: 70.0,
            word_count: 200,
            share_percent: 58.09,
          },
          {
            name: 'Speaker 1',
            total_seconds: 50.5,
            word_count: 150,
            share_percent: 41.91,
          },
        ],
      };
      const parsed = RecordingAnalyticsSchema.parse(valid);
      expect(parsed.speakers.length).toBe(2);
      expect(parsed.speakers[0].share_percent).toBe(58.09);
    });

    it('should validate CreateCommentRequest with bounds', () => {
      const valid = {
        timestamp_sec: 45.2,
        comment_text: 'Is this deadline achievable?',
        author_name: 'Alice',
      };
      const parsed = CreateCommentRequestSchema.parse(valid);
      expect(parsed.timestamp_sec).toBe(45.2);

      expect(() =>
        CreateCommentRequestSchema.parse({
          timestamp_sec: -5,
          comment_text: 'Invalid negative timestamp',
        })
      ).toThrow();
    });

    it('should validate recursive nested replies in CommentResponseSchema', () => {
      const commentWithReplies = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        timestamp_sec: 10,
        author_name: 'Alice',
        comment_text: 'Top level comment',
        created_at: new Date().toISOString(),
        replies: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            timestamp_sec: 10,
            author_name: 'Bob',
            comment_text: 'Nested reply',
            parent_id: '123e4567-e89b-12d3-a456-426614174000',
            created_at: new Date().toISOString(),
          },
        ],
      };

      const parsed = CommentResponseSchema.parse(commentWithReplies);
      expect(parsed.replies?.[0].comment_text).toBe('Nested reply');
    });
  });

  describe('Chat & SSE Schemas', () => {
    it('should validate RecordingChatRequestSchema', () => {
      const req = {
        message: 'What was decided in the meeting?',
        conversation_history: [
          { role: 'user' as const, content: 'Hello' },
          { role: 'assistant' as const, content: 'Hi there' },
        ],
      };
      const parsed = RecordingChatRequestSchema.parse(req);
      expect(parsed.message).toBe('What was decided in the meeting?');
    });

    it('should validate ProgressEvent with status and error taxonomy', () => {
      const event = {
        recording_id: '123e4567-e89b-12d3-a456-426614174000',
        status: RecordingStatus.FAILED,
        stage: 'TRANSCRIBING',
        progress: 55,
        error_code: PipelineErrorCode.ERR_TRANSCRIPTION_FAILED,
        error_message: 'STT engine timed out',
        updated_at: new Date().toISOString(),
      };
      const parsed = ProgressEventSchema.parse(event);
      expect(parsed.error_code).toBe(PipelineErrorCode.ERR_TRANSCRIPTION_FAILED);
    });

    it('should validate ChatDoneEvent with citations array', () => {
      const done = {
        message_id: '123e4567-e89b-12d3-a456-426614174000',
        content: 'Action items were assigned at [02:15] and [04:30].',
        citations: ['02:15', '04:30'],
        retrieved_chunk_ids: ['chunk-1', 'chunk-2'],
      };
      const parsed = ChatDoneEventSchema.parse(done);
      expect(parsed.citations).toEqual(['02:15', '04:30']);
    });
  });

  describe('Workspace & Waitlist Schemas', () => {
    it('should validate WorkspaceAskRequestSchema', () => {
      const valid = {
        question: 'What are the main blockers across recent meetings?',
      };
      const parsed = WorkspaceAskRequestSchema.parse(valid);
      expect(parsed.question).toBe('What are the main blockers across recent meetings?');
    });

    it('should enforce limits on SemanticSearchQuery', () => {
      const parsed = SemanticSearchQuerySchema.parse({
        q: 'authentication architecture',
      });
      expect(parsed.limit).toBe(10); // default
      expect(parsed.threshold).toBe(0.0); // default

      expect(() =>
        SemanticSearchQuerySchema.parse({
          q: 'test',
          limit: 100, // exceeds max 50
        })
      ).toThrow();
    });

    it('should validate WaitlistRequest and apply defaults', () => {
      const parsed = WaitlistRequestSchema.parse({
        email: 'founder@startup.com',
      });
      expect(parsed.platform).toBe('google_meet');
      expect(parsed.company_size).toBe('1-10');
    });
  });
});
