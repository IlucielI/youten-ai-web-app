import { describe, it, expect, vi, afterEach } from 'vitest';
import { GET, DELETE } from './route';
import { recordingController } from '@/server/controllers/recording.controller';
import { NextResponse } from 'next/server';

describe('/api/recordings/[id] routes', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET delegates to recordingController.getDetail', async () => {
    const mockRes = NextResponse.json({ success: true, data: { id: 'rec-1' } }, { status: 200 });
    const spy = vi.spyOn(recordingController, 'getDetail').mockResolvedValue(mockRes);

    const req = new Request('http://localhost/api/recordings/rec-1', {
      method: 'GET',
    });

    const res = await GET(req, { params: Promise.resolve({ id: 'rec-1' }) });
    expect(spy).toHaveBeenCalledWith(req, 'rec-1');
    expect(res.status).toBe(200);
  });

  it('DELETE delegates to recordingController.delete', async () => {
    const mockRes = NextResponse.json({ success: true, message: 'Deleted' }, { status: 200 });
    const spy = vi.spyOn(recordingController, 'delete').mockResolvedValue(mockRes);

    const req = new Request('http://localhost/api/recordings/rec-1', {
      method: 'DELETE',
    });

    const res = await DELETE(req, { params: Promise.resolve({ id: 'rec-1' }) });
    expect(spy).toHaveBeenCalledWith(req, 'rec-1');
    expect(res.status).toBe(200);
  });
});
