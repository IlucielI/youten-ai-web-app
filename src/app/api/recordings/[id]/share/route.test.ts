import { describe, it, expect, vi, afterEach } from 'vitest';
import { PATCH, POST } from './route';
import { recordingController } from '@/server/controllers/recording.controller';
import { NextResponse } from 'next/server';

describe('/api/recordings/[id]/share route handlers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('PATCH delegates to recordingController.toggleShare', async () => {
    const mockRes = NextResponse.json(
      { success: true, data: { is_share_enabled: true, share_token: 'tok-123' } },
      { status: 200 }
    );
    const spy = vi.spyOn(recordingController, 'toggleShare').mockResolvedValue(mockRes);

    const req = new Request('http://localhost/api/recordings/rec-123/share', {
      method: 'PATCH',
      body: JSON.stringify({ is_share_enabled: true }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: 'rec-123' }) });
    expect(spy).toHaveBeenCalledWith(req, 'rec-123');
    expect(res.status).toBe(200);
  });

  it('POST delegates to recordingController.toggleShare for backward compatibility', async () => {
    const mockRes = NextResponse.json(
      { success: true, data: { is_share_enabled: true, share_token: 'tok-123' } },
      { status: 200 }
    );
    const spy = vi.spyOn(recordingController, 'toggleShare').mockResolvedValue(mockRes);

    const req = new Request('http://localhost/api/recordings/rec-123/share', {
      method: 'POST',
      body: JSON.stringify({ is_share_enabled: true }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: 'rec-123' }) });
    expect(spy).toHaveBeenCalledWith(req, 'rec-123');
    expect(res.status).toBe(200);
  });
});
