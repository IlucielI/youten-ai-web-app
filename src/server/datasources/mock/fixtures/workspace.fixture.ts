import {
  SearchResultItemDTO,
  WorkspaceAskResponse,
  SpeakerSummaryDTO,
} from '../../../dtos';

export const mockSearchResults: SearchResultItemDTO[] = [
  {
    recording_id: '11111111-1111-1111-1111-111111111111',
    recording_title: 'Q4 Architectural Scalability Review',
    chunk_index: 0,
    snippet: 'We are officially approving the migration to PostgreSQL pgvector and Redis pub/sub.',
    score: 0.94,
    start_time: 12.0,
    end_time: 17.2,
  },
  {
    recording_id: '11111111-1111-1111-1111-111111111111',
    recording_title: 'Q4 Architectural Scalability Review',
    chunk_index: 1,
    snippet: 'The primary bottleneck we identified is our vector search database latency during peak transcription volume.',
    score: 0.88,
    start_time: 5.2,
    end_time: 11.5,
  },
];

export const mockWorkspaceAskResponse: WorkspaceAskResponse = {
  answer:
    'Across recent architecture reviews, the team identified vector database latency as the primary scalability blocker and officially approved migrating to PostgreSQL pgvector with Redis pub/sub for real-time progress streaming.',
  sources: [
    {
      recording_id: '11111111-1111-1111-1111-111111111111',
      recording_title: 'Q4 Architectural Scalability Review',
      chunk_index: 0,
      snippet: 'We are officially approving the migration to PostgreSQL pgvector...',
      start_time: 12.0,
      end_time: 17.2,
    },
  ],
};

export const mockSpeakers: SpeakerSummaryDTO[] = [
  {
    name: 'Alice',
    total_meetings: 14,
    total_talk_time: 18450.0,
    last_active: '2026-10-06T00:00:00.000Z',
  },
  {
    name: 'Bob',
    total_meetings: 12,
    total_talk_time: 14200.0,
    last_active: '2026-10-06T00:00:00.000Z',
  },
  {
    name: 'Charlie',
    total_meetings: 8,
    total_talk_time: 5600.0,
    last_active: '2026-10-05T00:00:00.000Z',
  },
];
