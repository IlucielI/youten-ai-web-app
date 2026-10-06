import { describe, it, expect, vi, afterEach } from 'vitest';
import { POST } from './route';
import { recordingController } from '@/server/controllers/recording.controller';
import { NextResponse } from 'next/server';

describe('POST /api/recordings/claim', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('delegates to recordingController.claimBulk', async () => {
    const mockRes = NextResponse.json({ success: true, claimed_count: 2 }, { status: 200 });
    const spy = vi.spyOn(recordingController, 'claimBulk').mockResolvedValue(mockRes);

    const req = new Request('http://localhost/api/recordings/claim', {
      method: 'POST',
      body: JSON.stringify({ tokens: ['tok-1', 'tok-2'] }),
    });

    const res = await POST(req);
    expect(spy).toHaveBeenCalledWith(req);
    expect(res.status).toBe(200);
  });
});
