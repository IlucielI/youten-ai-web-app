import { describe, it, expect, vi } from 'vitest';
import { RecordingController } from './recording.controller';
import { IRecordingService } from '../services/recording.service.interface';
import { ResponseStatus, ResponseCode } from '../constants';

describe('RecordingController', () => {
  const mockService: IRecordingService = {
    presignUpload: vi.fn().mockResolvedValue({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Presign success',
      data: {
        upload_url: 'https://s3.amazonaws.com/test/audio.mp3',
        object_key: 'uploads/audio.mp3',
        filename: 'audio.mp3',
      },
      timestamp: new Date().toISOString(),
    }),
    uploadRecording: vi.fn().mockResolvedValue({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Upload success',
      data: {
        id: '11111111-1111-4111-8111-111111111111',
        title: 'Uploaded Audio',
        original_filename: 'audio.mp3',
        file_size_bytes: 5000,
        status: 'PENDING',
        selected_template: 'GENERAL',
        output_language: 'id',
        is_guest: true,
        ownership_token: 'token-guest-999',
        created_at: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    }),
    importUrl: vi.fn().mockResolvedValue({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Import success',
      data: {
        id: '22222222-2222-4222-8222-222222222222',
        title: 'Imported URL',
        original_filename: 'podcast.mp3',
        file_size_bytes: 8000,
        status: 'QUEUED',
        selected_template: 'GENERAL',
        output_language: 'id',
        is_guest: true,
        ownership_token: 'token-guest-888',
        created_at: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    }),
    getRecordingDetail: vi.fn(),
    retryRecording: vi.fn(),
    toggleShare: vi.fn(),
    getSharedRecording: vi.fn(),
    updateSpeakers: vi.fn(),
    claimRecording: vi.fn(),
    claimBulk: vi.fn(),
    listRecordings: vi.fn(),
    deleteRecording: vi.fn(),
    regenerateSummary: vi.fn(),
    updateTranscriptSegment: vi.fn(),
  };

  const controller = new RecordingController(mockService);

  it('handles presign request and returns 200 with presigned data', async () => {
    const req = new Request('http://localhost/api/recordings/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: 'recording.mp3',
        content_type: 'audio/mpeg',
      }),
    });

    const res = await controller.presign(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.upload_url).toBe('https://s3.amazonaws.com/test/audio.mp3');
  });

  it('rejects presign request with invalid schema (missing filename)', async () => {
    const req = new Request('http://localhost/api/recordings/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content_type: 'audio/mpeg',
      }),
    });

    const res = await controller.presign(req);
    expect(res.status).toBe(400);
  });

  it('handles upload request and returns 201 with recording data', async () => {
    const req = new Request('http://localhost/api/recordings/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: 'audio.mp3',
        object_key: 'uploads/audio.mp3',
        title: 'Weekly Standup',
      }),
    });

    const res = await controller.upload(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.data.id).toBe('11111111-1111-4111-8111-111111111111');
  });

  it('handles import-url request and returns 201 with queued recording', async () => {
    const req = new Request('http://localhost/api/recordings/import-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://cdn.example.com/audio.mp3',
        title: 'Keynote Speech',
      }),
    });

    const res = await controller.importUrl(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.data.id).toBe('22222222-2222-4222-8222-222222222222');
  });

  it('rejects import-url with disallowed URL protocol', async () => {
    const req = new Request('http://localhost/api/recordings/import-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'ftp://cdn.example.com/audio.mp3',
      }),
    });

    const res = await controller.importUrl(req);
    expect(res.status).toBe(400);
  });

  it('handles getDetail request and returns recording detail', async () => {
    mockService.getRecordingDetail = vi.fn().mockResolvedValue({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Detail retrieved',
      data: { id: 'test-rec-id', title: 'Test Recording', status: 'COMPLETED' },
      timestamp: new Date().toISOString(),
    });

    const req = new Request('http://localhost/api/recordings/test-rec-id', {
      method: 'GET',
    });

    const res = await controller.getDetail(req, 'test-rec-id');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.id).toBe('test-rec-id');
  });

  it('handles retry request and returns 200 with resumed pipeline status', async () => {
    mockService.retryRecording = vi.fn().mockResolvedValue({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Retry initiated',
      data: {
        id: 'test-rec-id',
        status: 'TRANSCRIBING',
        stage: 'transcription',
        message: 'Resumed',
        updated_at: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });

    const req = new Request('http://localhost/api/recordings/test-rec-id/retry', {
      method: 'POST',
    });

    const res = await controller.retry(req, 'test-rec-id');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.status).toBe('TRANSCRIBING');
  });

  it('handles toggleShare request and returns updated share status', async () => {
    mockService.toggleShare = vi.fn().mockResolvedValue({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Share updated',
      data: {
        is_share_enabled: true,
        share_token: 'share-token-xyz',
        share_url: 'http://localhost/share/share-token-xyz',
      },
      timestamp: new Date().toISOString(),
    });

    const req = new Request('http://localhost/api/recordings/test-rec-id/share', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_share_enabled: true }),
    });

    const res = await controller.toggleShare(req, 'test-rec-id');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.is_share_enabled).toBe(true);
  });

  it('handles updateSpeakers request and returns updated speaker mapping', async () => {
    mockService.updateSpeakers = vi.fn().mockResolvedValue({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Speakers updated',
      data: {
        updated_count: 2,
        speakers: { speaker_0: 'Budi Santoso', speaker_1: 'Siti Rahma' },
      },
      timestamp: new Date().toISOString(),
    });

    const req = new Request('http://localhost/api/recordings/test-rec-id/speakers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        speakers: { speaker_0: 'Budi Santoso', speaker_1: 'Siti Rahma' },
      }),
    });

    const res = await controller.updateSpeakers(req, 'test-rec-id');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.updated_count).toBe(2);
  });

  it('handles getShared request and returns shared recording data', async () => {
    mockService.getSharedRecording = vi.fn().mockResolvedValue({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Shared recording retrieved',
      data: {
        id: 'rec-shared-123',
        title: 'Shared Team Sync',
        duration_seconds: 120,
        selected_template: 'GENERAL',
        output_language: 'id',
        segments: [],
        chapters: [],
        highlights: [],
        created_at: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });

    const req = new Request('http://localhost/api/recordings/shared/token-xyz');
    const res = await controller.getShared(req, 'token-xyz');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.id).toBe('rec-shared-123');
    expect(json.data.title).toBe('Shared Team Sync');
  });

  it('handles claim single recording request', async () => {
    mockService.claimRecording = vi.fn().mockResolvedValue({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Claim success',
      data: { claimed: true },
      timestamp: new Date().toISOString(),
    });

    const req = new Request('http://localhost/api/recordings/rec-123/claim', {
      method: 'POST',
    });
    const res = await controller.claim(req, 'rec-123');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.claimed).toBe(true);
  });

  it('handles claimBulk request and returns claimed summary', async () => {
    mockService.claimBulk = vi.fn().mockResolvedValue({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Bulk claim success',
      data: { claimed_count: 2, recording_ids: ['rec-1', 'rec-2'] },
      timestamp: new Date().toISOString(),
    });

    const req = new Request('http://localhost/api/recordings/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokens: ['tok-guest-1', 'tok-guest-2'] }),
    });
    const res = await controller.claimBulk(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.claimed_count).toBe(2);
  });

  it('handles list request with query params', async () => {
    mockService.listRecordings = vi.fn().mockResolvedValue({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'List success',
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
      timestamp: new Date().toISOString(),
    });

    const req = new Request('http://localhost/api/recordings?page=1&limit=10&search=test', {
      method: 'GET',
    });
    const res = await controller.list(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.pagination.totalItems).toBe(0);
    expect(mockService.listRecordings).toHaveBeenCalled();
  });

  it('handles delete request by id', async () => {
    mockService.deleteRecording = vi.fn().mockResolvedValue({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Deleted successfully',
      timestamp: new Date().toISOString(),
    });

    const req = new Request('http://localhost/api/recordings/rec-123', {
      method: 'DELETE',
    });
    const res = await controller.delete(req, 'rec-123');
    expect(res.status).toBe(200);
    expect(mockService.deleteRecording).toHaveBeenCalledWith('rec-123');
  });

  it('handles regenerateSummary request and calls recordingService', async () => {
    mockService.regenerateSummary = vi.fn().mockResolvedValue({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Summary regenerated',
      data: {
        id: 'ver-2',
        version: 2,
        template_category: 'MOM',
        custom_angle: 'Focus on deliverables',
        structured_data: {},
        markdown_content: 'New notes',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });

    const req = new Request('http://localhost/api/recordings/rec-123/regenerate', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-ownership-token': 'token-abc',
      },
      body: JSON.stringify({
        template_category: 'MOM',
        custom_angle: 'Focus on deliverables',
      }),
    });

    const res = await controller.regenerateSummary(req, 'rec-123');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.version).toBe(2);
    expect(mockService.regenerateSummary).toHaveBeenCalledWith(
      'rec-123',
      expect.objectContaining({ template_category: 'MOM' }),
      'token-abc'
    );
  });

  it('handles updateSegment request and returns 200 with updated segment', async () => {
    mockService.updateTranscriptSegment = vi.fn().mockResolvedValue({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Transcript segment updated successfully',
      data: {
        id: 'seg-123',
        speaker_label: 'Speaker 0',
        speaker_name: 'Budi',
        start_time: 10,
        end_time: 15,
        text: 'Bekerja di bawah tekanan',
        sequence_order: 1,
      },
      timestamp: new Date().toISOString(),
    });

    const req = new Request('http://localhost/api/recordings/rec-123/segments/seg-123', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        'x-ownership-token': 'token-abc',
      },
      body: JSON.stringify({
        text: 'Bekerja di bawah tekanan',
      }),
    });

    const res = await controller.updateSegment(req, 'rec-123', 'seg-123');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.text).toBe('Bekerja di bawah tekanan');
    expect(mockService.updateTranscriptSegment).toHaveBeenCalledWith(
      'rec-123',
      'seg-123',
      expect.objectContaining({
        text: 'Bekerja di bawah tekanan',
        ownership_token: 'token-abc',
      })
    );
  });
});
