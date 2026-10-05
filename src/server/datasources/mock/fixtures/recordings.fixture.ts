import {
  RecordingDetailResponse,
  RecordingListItem,
  TranscriptSegmentDTO,
  ChapterDTO,
  HighlightDTO,
  RecordingAnalyticsDTO,
  SummaryDTO,
} from '../../../dtos';
import {
  RecordingStatus,
  SourceType,
  HighlightSource,
  TemplateKey,
} from '../../../constants';
import { mockMomStructuredData } from './templates.fixture';

export const mockSummaryDto: SummaryDTO = {
  id: '77777777-7777-7777-7777-777777777777',
  version: 1,
  template_category: TemplateKey.MOM,
  custom_angle: 'Scalability bottlenecks and vector search architecture',
  structured_data: mockMomStructuredData as unknown as Record<string, unknown>,
  markdown_content: `# Engineering Architecture & Q4 Scalability Review

## Executive Summary
The engineering leadership team reviewed Q4 scalability bottlenecks and approved migrating vector search to PostgreSQL pgvector alongside Redis caching for real-time SSE progress streaming.

## Key Decisions
1. **Adopt PostgreSQL pgvector as primary vector storage**: Reduced infrastructure cost by 65% with sub-50ms query latency.
2. **Implement Redis pub/sub for SSE progress events**: Eliminated database polling overhead during transcription jobs.

## Action Items
- **[P0]** Provision PostgreSQL pgvector replica and benchmark HNSW index (*Owner: Bob, Due: 2026-10-14*)
- **[P1]** Wire Redis SSE event publisher into transcription worker (*Owner: Alice, Due: 2026-10-16*)
`,
  is_active: true,
  created_at: '2026-10-06T00:00:00.000Z',
  updated_at: '2026-10-06T00:00:00.000Z',
};

export const mockTranscriptSegments: TranscriptSegmentDTO[] = [
  {
    id: '22222222-2222-2222-2222-222222222221',
    speaker_label: 'Speaker 0',
    speaker_name: 'Alice',
    start_time: 0.0,
    end_time: 4.8,
    text: 'Good morning everyone, welcome to our Q4 architectural review.',
    sequence_order: 1,
    words_data: [
      { word: 'Good', start: 0.0, end: 0.4, probability: 0.98 },
      { word: 'morning', start: 0.5, end: 1.1, probability: 0.99 },
      { word: 'everyone,', start: 1.2, end: 1.8, probability: 0.97 },
      { word: 'welcome', start: 2.0, end: 2.5, probability: 0.96 },
      { word: 'to', start: 2.6, end: 2.8, probability: 0.99 },
      { word: 'our', start: 2.9, end: 3.2, probability: 0.98 },
      { word: 'Q4', start: 3.3, end: 3.7, probability: 0.95 },
      { word: 'architectural', start: 3.8, end: 4.3, probability: 0.97 },
      { word: 'review.', start: 4.4, end: 4.8, probability: 0.99 },
    ],
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    speaker_label: 'Speaker 1',
    speaker_name: 'Bob',
    start_time: 5.2,
    end_time: 11.5,
    text: 'Thanks Alice. The primary bottleneck we identified is our vector search database latency during peak transcription volume.',
    sequence_order: 2,
    words_data: [
      { word: 'Thanks', start: 5.2, end: 5.6, probability: 0.99 },
      { word: 'Alice.', start: 5.7, end: 6.1, probability: 0.98 },
      { word: 'The', start: 6.3, end: 6.5, probability: 0.99 },
      { word: 'primary', start: 6.6, end: 7.1, probability: 0.96 },
      { word: 'bottleneck', start: 7.2, end: 7.8, probability: 0.97 },
      { word: 'we', start: 7.9, end: 8.1, probability: 0.99 },
      { word: 'identified', start: 8.2, end: 8.8, probability: 0.98 },
      { word: 'is', start: 8.9, end: 9.1, probability: 0.99 },
      { word: 'our', start: 9.2, end: 9.4, probability: 0.99 },
      { word: 'vector', start: 9.5, end: 9.9, probability: 0.97 },
      { word: 'search', start: 10.0, end: 10.4, probability: 0.98 },
      { word: 'database', start: 10.5, end: 10.9, probability: 0.96 },
      { word: 'latency.', start: 11.0, end: 11.5, probability: 0.98 },
    ],
  },
  {
    id: '22222222-2222-2222-2222-222222222223',
    speaker_label: 'Speaker 0',
    speaker_name: 'Alice',
    start_time: 12.0,
    end_time: 17.2,
    text: 'Understood. We are officially approving the migration to PostgreSQL pgvector and Redis pub/sub.',
    sequence_order: 3,
    words_data: [
      { word: 'Understood.', start: 12.0, end: 12.8, probability: 0.99 },
      { word: 'We', start: 13.0, end: 13.2, probability: 0.99 },
      { word: 'are', start: 13.3, end: 13.5, probability: 0.99 },
      { word: 'officially', start: 13.6, end: 14.2, probability: 0.97 },
      { word: 'approving', start: 14.3, end: 14.8, probability: 0.98 },
      { word: 'the', start: 14.9, end: 15.1, probability: 0.99 },
      { word: 'migration', start: 15.2, end: 15.8, probability: 0.98 },
      { word: 'to', start: 15.9, end: 16.1, probability: 0.99 },
      { word: 'PostgreSQL', start: 16.2, end: 16.7, probability: 0.96 },
      { word: 'pgvector.', start: 16.8, end: 17.2, probability: 0.97 },
    ],
  },
];

export const mockChapters: ChapterDTO[] = [
  {
    id: '33333333-3333-3333-3333-333333333331',
    title: 'Opening & Review Context',
    start_time: 0.0,
    end_time: 5.0,
    summary: 'Meeting kickoff and review objectives.',
    sequence_order: 1,
    created_at: '2026-10-06T00:00:00.000Z',
  },
  {
    id: '33333333-3333-3333-3333-333333333332',
    title: 'Vector Search Bottlenecks',
    start_time: 5.1,
    end_time: 11.9,
    summary: 'Analysis of vector search performance and latency.',
    sequence_order: 2,
    created_at: '2026-10-06T00:00:00.000Z',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    title: 'Migration Decision & Signoff',
    start_time: 12.0,
    end_time: 17.5,
    summary: 'Formal approval of PostgreSQL pgvector adoption.',
    sequence_order: 3,
    created_at: '2026-10-06T00:00:00.000Z',
  },
];

export const mockHighlights: HighlightDTO[] = [
  {
    id: '44444444-4444-4444-4444-444444444441',
    start_time: 12.0,
    end_time: 17.2,
    title: 'Architecture Decision Approval',
    note: 'CTO approves PostgreSQL pgvector and Redis pub/sub.',
    source: HighlightSource.AI,
    clip_url: 'https://cdn.example.com/clips/approval.mp4',
    created_at: '2026-10-06T00:00:00.000Z',
  },
];

const computedAliceWords = 19;
const computedBobWords = 13;
const computedTotalWords = 32;

export const mockRecordingAnalytics: RecordingAnalyticsDTO = {
  total_duration_seconds: 17.2,
  total_words: computedTotalWords,
  speakers: [
    {
      name: 'Alice',
      total_seconds: 10.0,
      word_count: computedAliceWords,
      share_percent: Number(((computedAliceWords / computedTotalWords) * 100).toFixed(1)),
    },
    {
      name: 'Bob',
      total_seconds: 7.2,
      word_count: computedBobWords,
      share_percent: Number(((computedBobWords / computedTotalWords) * 100).toFixed(1)),
    },
  ],
};

export const mockRecordingDetail: RecordingDetailResponse = {
  id: '11111111-1111-1111-1111-111111111111',
  user_id: '00000000-0000-0000-0000-000000000001',
  title: 'Q4 Architectural Scalability Review',
  original_filename: 'architecture_review_q4.mp4',
  file_size_bytes: 14680064, // 14 MB
  duration_seconds: 17.5,
  audio_url: 'https://cdn.example.com/audio/sample.mp3',
  playback_url: 'https://cdn.example.com/audio/sample.mp3',
  source_type: SourceType.UPLOAD,
  status: RecordingStatus.COMPLETED,
  error_message: null,
  error_code: null,
  selected_template: TemplateKey.MOM,
  detected_language: 'en',
  output_language: 'en',
  is_guest: false,
  consent_given: true,
  consent_version: 'v1.0',
  expires_at: null,
  analytics_data: mockRecordingAnalytics as unknown as Record<string, unknown>,
  segments: mockTranscriptSegments,
  active_summary: mockSummaryDto,
  chapters: mockChapters,
  highlights: mockHighlights,
  created_at: '2026-10-06T00:00:00.000Z',
  updated_at: '2026-10-06T00:05:00.000Z',
};

export const mockRecordingListItems: RecordingListItem[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    title: 'Q4 Architectural Scalability Review',
    original_filename: 'architecture_review_q4.mp4',
    duration_seconds: 17.5,
    file_size_bytes: 14680064,
    source_type: SourceType.UPLOAD,
    status: RecordingStatus.COMPLETED,
    selected_template: TemplateKey.MOM,
    output_language: 'en',
    created_at: '2026-10-06T00:00:00.000Z',
    updated_at: '2026-10-06T00:05:00.000Z',
  },
  {
    id: '11111111-1111-1111-1111-111111111112',
    title: 'Weekly Standup & Sprint Sync',
    original_filename: 'standup.mp4',
    duration_seconds: 900.0,
    file_size_bytes: 10485760,
    source_type: SourceType.UPLOAD,
    status: RecordingStatus.COMPLETED,
    selected_template: TemplateKey.DAILY_STANDUP,
    output_language: 'id',
    created_at: '2026-10-05T09:00:00.000Z',
    updated_at: '2026-10-05T09:20:00.000Z',
  },
  {
    id: '11111111-1111-1111-1111-111111111113',
    title: 'Senior Full Stack Interview - Alex Mercer',
    original_filename: 'interview.mp4',
    duration_seconds: 2700.0,
    file_size_bytes: 28311552,
    source_type: SourceType.LINK,
    status: RecordingStatus.COMPLETED,
    selected_template: TemplateKey.INTERVIEW,
    output_language: 'en',
    created_at: '2026-10-04T14:00:00.000Z',
    updated_at: '2026-10-04T14:50:00.000Z',
  },
];
