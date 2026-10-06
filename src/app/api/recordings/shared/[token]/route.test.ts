import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { recordingController } from '@/server/controllers/recording.controller';
import { NextResponse } from 'next/server';

vi.mock('@/server/controllers/recording.controller', () => ({
  recordingController: {
    getShared: vi.fn(),
  },
}));

describe('GET /api/recordings/shared/[token]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates to recordingController.getShared with the extracted token', async () => {
    const mockResponse = NextResponse.json({
      status: 'SUCCESS',
      code: 'OK',
      message: 'Retrieved',
      data: { id: 'rec-1', title: 'Shared Recording' },
    });

    vi.mocked(recordingController.getShared).mockResolvedValueOnce(mockResponse);

    const req = new Request('http://localhost/api/recordings/shared/token-abc-123');
    const res = await GET(req, { params: Promise.resolve({ token: 'token-abc-123' }) });

    expect(recordingController.getShared).toHaveBeenCalledWith(req, 'token-abc-123');
    expect(res).toBe(mockResponse);
  });
});
