import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { recordingService } from '@/server/services/recording.service';
import { RecordingStatus } from '@/server/constants';

vi.mock('@/server/services/recording.service', () => ({
  recordingService: {
    getRecordingDetail: vi.fn(),
  },
}));

describe('GET /api/recordings/[id]/progress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 404 if recording not found', async () => {
    vi.mocked(recordingService.getRecordingDetail).mockRejectedValueOnce(new Error('Not found'));

    const req = new Request('http://localhost/api/recordings/nonexistent/progress');
    const res = await GET(req, { params: Promise.resolve({ id: 'nonexistent' }) });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe('Recording not found');
  });

  it('returns text/event-stream headers and emits completed event for completed recording', async () => {
    vi.mocked(recordingService.getRecordingDetail).mockResolvedValueOnce({
      status: 'SUCCESS',
      code: 'OK',
      message: 'Found',
      data: {
        id: 'rec-done',
        title: 'Finished Audio',
        status: RecordingStatus.COMPLETED,
        created_at: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    } as never);

    const req = new Request('http://localhost/api/recordings/rec-done/progress');
    const res = await GET(req, { params: Promise.resolve({ id: 'rec-done' }) });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');
    expect(res.headers.get('Cache-Control')).toContain('no-cache');

    const text = await res.text();
    expect(text).toContain('"status":"COMPLETED"');
    expect(text).toContain('"progress":100');
  });

  it('streams progressive stages in fast mode', async () => {
    vi.mocked(recordingService.getRecordingDetail).mockResolvedValueOnce({
      status: 'SUCCESS',
      code: 'OK',
      message: 'Found',
      data: {
        id: 'rec-in-progress',
        title: 'Processing Audio',
        status: RecordingStatus.PENDING,
        created_at: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    } as never);

    const req = new Request('http://localhost/api/recordings/rec-in-progress/progress?fast=true');
    const res = await GET(req, { params: Promise.resolve({ id: 'rec-in-progress' }) });

    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('"status":"EXTRACTING"');
    expect(text).toContain('"status":"TRANSCRIBING"');
    expect(text).toContain('"status":"SUMMARIZING"');
    expect(text).toContain('"status":"COMPLETED"');
  });

  it('emits failed event when requested with fail=true query', async () => {
    vi.mocked(recordingService.getRecordingDetail).mockResolvedValueOnce({
      status: 'SUCCESS',
      code: 'OK',
      message: 'Found',
      data: {
        id: 'rec-fail',
        title: 'Error Audio',
        status: RecordingStatus.PENDING,
        created_at: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    } as never);

    const req = new Request('http://localhost/api/recordings/rec-fail/progress?fail=true');
    const res = await GET(req, { params: Promise.resolve({ id: 'rec-fail' }) });

    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('"status":"FAILED"');
    expect(text).toContain('"errorCode":"ERR_PIPELINE_FAILED"');
  });
});
