import { describe, it, expect, vi, afterEach } from 'vitest';
import { GET } from './route';
import { recordingController } from '@/server/controllers/recording.controller';
import { NextResponse } from 'next/server';

describe('GET /api/recordings', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('delegates to recordingController.list', async () => {
    const mockRes = NextResponse.json({ success: true, data: [] }, { status: 200 });
    const spy = vi.spyOn(recordingController, 'list').mockResolvedValue(mockRes);

    const req = new Request('http://localhost/api/recordings?page=1&limit=10', {
      method: 'GET',
    });

    const res = await GET(req);
    expect(spy).toHaveBeenCalledWith(req);
    expect(res.status).toBe(200);
  });
});
