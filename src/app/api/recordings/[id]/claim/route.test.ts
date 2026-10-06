import { describe, it, expect, vi, afterEach } from 'vitest';
import { POST } from './route';
import { recordingController } from '@/server/controllers/recording.controller';
import { NextResponse } from 'next/server';

describe('POST /api/recordings/[id]/claim', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('delegates to recordingController.claim with id', async () => {
    const mockRes = NextResponse.json({ success: true }, { status: 200 });
    const spy = vi.spyOn(recordingController, 'claim').mockResolvedValue(mockRes);

    const req = new Request('http://localhost/api/recordings/rec-123/claim', {
      method: 'POST',
    });
    const params = Promise.resolve({ id: 'rec-123' });

    const res = await POST(req, { params });
    expect(spy).toHaveBeenCalledWith(req, 'rec-123');
    expect(res.status).toBe(200);
  });
});
