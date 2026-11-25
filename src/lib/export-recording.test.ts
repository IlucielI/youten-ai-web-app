import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportRecordingFile, getStoredGuestToken } from './export-recording';
import { ExportFormat } from '@/server/constants/recording.constant';
import type { RecordingDetailDto } from '@/server/schemas/recording.schema';
import { RecordingStatus } from '@/server/constants';

const mockRecording: RecordingDetailDto = {
  id: 'rec-test-1',
  title: 'Standup Meeting',
  original_filename: 'standup.mp3',
  file_size_bytes: 5000,
  duration_seconds: 60,
  source_type: 'UPLOAD',
  status: RecordingStatus.COMPLETED,
  selected_template: 'GENERAL',
  output_language: 'id',
  is_guest: false,
  consent_given: true,
  consent_version: 'v1.0',
  created_at: '2026-10-06T09:00:00Z',
  updated_at: '2026-10-06T09:05:00Z',
  active_summary: {
    id: 'sum-1',
    version: 1,
    template_category: 'GENERAL',
    is_active: true,
    structured_data: {},
    markdown_content: '# Meeting Notes\nDiscussion about sprint.',
    created_at: '2026-10-06T09:05:00Z',
    updated_at: '2026-10-06T09:05:00Z',
  },
  chapters: [],
  highlights: [],
  segments: [
    {
      id: 's1',
      speaker_label: 'spk-0',
      speaker_name: 'spk-0',
      sequence_order: 1,
      start_time: 0,
      end_time: 5,
      text: 'Good morning team',
    },
  ],
};

describe('export-recording utility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('retrieves guest token from localStorage when present', () => {
    const mockStorage = {
      state: {
        guestTokens: [{ id: 'rec-test-1', ownership_token: 'token-abc' }],
      },
    };
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(mockStorage));

    expect(getStoredGuestToken('rec-test-1')).toBe('token-abc');
    expect(getStoredGuestToken('unknown-id')).toBe('');
  });

  it('triggers remote fetch and calls onSuccess when API succeeds', async () => {
    const onSuccess = vi.fn();
    const mockBlob = new Blob(['sample data'], { type: 'application/pdf' });

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      blob: async () => mockBlob,
      headers: new Headers({
        'content-disposition': 'attachment; filename="Standup_Meeting.pdf"',
      }),
    } as unknown as Response);

    // Mock createObjectURL & revokeObjectURL
    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://localhost/test');
    const revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    await exportRecordingFile({
      recordingId: 'rec-test-1',
      format: ExportFormat.PDF,
      recording: mockRecording,
      onSuccess,
    });

    expect(createObjectUrlSpy).toHaveBeenCalled();
    expect(revokeObjectUrlSpy).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith(ExportFormat.PDF);
  });

  it('falls back to local text generation if remote endpoint fails', async () => {
    const onSuccess = vi.fn();
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://localhost/test');
    const revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    await exportRecordingFile({
      recordingId: 'rec-test-1',
      format: ExportFormat.TXT,
      recording: mockRecording,
      onSuccess,
    });

    expect(createObjectUrlSpy).toHaveBeenCalled();
    expect(revokeObjectUrlSpy).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith(ExportFormat.TXT);
  });

  it('rejects DOCX export when backend fails instead of corrupted fallback', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Backend 500'));
    const onError = vi.fn();

    await expect(
      exportRecordingFile({
        recordingId: 'rec-test-1',
        format: ExportFormat.DOCX,
        recording: mockRecording,
        onError,
      })
    ).rejects.toThrow(/requires backend processing/);

    expect(onError).toHaveBeenCalled();
  });
});
