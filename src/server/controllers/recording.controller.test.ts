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
});
