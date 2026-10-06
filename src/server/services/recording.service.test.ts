import { describe, it, expect, vi } from 'vitest';
import { RecordingService } from './recording.service';
import { IRecordingRepository } from '../repositories/recording.repository.interface';
import { ResponseStatus, ResponseCode } from '../constants';

describe('RecordingService', () => {
  const mockRepo: IRecordingRepository = {
    presignUpload: vi.fn().mockResolvedValue({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Presigned URL generated',
      data: {
        upload_url: 'https://s3.amazonaws.com/test-bucket/test.mp3',
        object_key: 'uploads/test.mp3',
        filename: 'test.mp3',
      },
      timestamp: new Date().toISOString(),
    }),
    uploadRecording: vi.fn().mockResolvedValue({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'Recording queued',
      data: {
        id: '11111111-1111-4111-8111-111111111111',
        title: 'Meeting Test',
        original_filename: 'test.mp3',
        file_size_bytes: 1024,
        status: 'PENDING',
        selected_template: 'GENERAL',
        output_language: 'id',
        is_guest: true,
        ownership_token: 'token-guest-123',
        created_at: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    }),
    importUrl: vi.fn().mockResolvedValue({
      status: ResponseStatus.SUCCESS,
      code: ResponseCode.SUCCESS,
      message: 'URL import queued',
      data: {
        id: '22222222-2222-4222-8222-222222222222',
        title: 'Podcast Import',
        original_filename: 'podcast.mp3',
        file_size_bytes: 2048,
        status: 'QUEUED',
        selected_template: 'GENERAL',
        output_language: 'id',
        is_guest: true,
        ownership_token: 'token-guest-456',
        created_at: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    }),
    getRecordingDetail: vi.fn(),
    listRecordings: vi.fn(),
    deleteRecording: vi.fn(),
    claimRecording: vi.fn(),
    claimBulk: vi.fn(),
    toggleShare: vi.fn(),
    getSharedRecording: vi.fn(),
    retryRecording: vi.fn(),
    updateSpeakers: vi.fn(),
  };

  const service = new RecordingService(mockRepo);

  it('delegates presignUpload to repository', async () => {
    const res = await service.presignUpload({
      filename: 'meeting.mp3',
      content_type: 'audio/mpeg',
    });

    expect(mockRepo.presignUpload).toHaveBeenCalledWith({
      filename: 'meeting.mp3',
      content_type: 'audio/mpeg',
    });
    expect(res.data?.upload_url).toBe('https://s3.amazonaws.com/test-bucket/test.mp3');
  });

  it('delegates uploadRecording to repository', async () => {
    const res = await service.uploadRecording({
      filename: 'meeting.mp3',
      object_key: 'uploads/meeting.mp3',
      title: 'Sprint Planning',
    });

    expect(mockRepo.uploadRecording).toHaveBeenCalledWith({
      filename: 'meeting.mp3',
      object_key: 'uploads/meeting.mp3',
      title: 'Sprint Planning',
    });
    expect(res.data?.id).toBe('11111111-1111-4111-8111-111111111111');
  });

  it('delegates importUrl to repository', async () => {
    const res = await service.importUrl({
      url: 'https://example.com/audio.mp3',
      title: 'Online Webinar',
    });

    expect(mockRepo.importUrl).toHaveBeenCalledWith({
      url: 'https://example.com/audio.mp3',
      title: 'Online Webinar',
    });
    expect(res.data?.id).toBe('22222222-2222-4222-8222-222222222222');
  });
});
