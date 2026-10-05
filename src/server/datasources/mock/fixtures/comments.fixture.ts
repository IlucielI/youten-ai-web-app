import { CommentResponse } from '../../../dtos';

export const mockComments: CommentResponse[] = [
  {
    id: '55555555-5555-5555-5555-555555555551',
    recording_id: '11111111-1111-1111-1111-111111111111',
    user_id: '00000000-0000-0000-0000-000000000001',
    segment_id: null,
    author_name: 'Bayu Anugerah',
    timestamp_sec: 5.5,
    selected_text: 'vector search database latency',
    comment_text: 'Make sure we benchmark pgvector vs Qdrant before final signoff.',
    parent_id: null,
    replies: [
      {
        id: '55555555-5555-5555-5555-555555555552',
        recording_id: '11111111-1111-1111-1111-111111111111',
        user_id: '00000000-0000-0000-0000-000000000002',
        segment_id: null,
        author_name: 'Bob',
        timestamp_sec: 5.5,
        selected_text: null,
        comment_text: 'Benchmark script ready! I will share the latency metrics in the PR.',
        parent_id: '55555555-5555-5555-5555-555555555551',
        replies: [],
        created_at: '2026-10-06T01:10:00.000Z',
        updated_at: '2026-10-06T01:10:00.000Z',
      },
    ],
    created_at: '2026-10-06T01:00:00.000Z',
    updated_at: '2026-10-06T01:00:00.000Z',
  },
];
