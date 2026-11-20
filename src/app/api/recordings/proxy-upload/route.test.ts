import { describe, it, expect, vi, afterEach } from 'vitest';
import { POST } from './route';
import { recordingController } from '@/server/controllers/recording.controller';
import { NextResponse } from 'next/server';

describe('POST /api/recordings/proxy-upload', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('delegates to recordingController.proxyUpload', async () => {
    const mockRes = NextResponse.json({ success: true }, { status: 200 });
    const spy = vi.spyOn(recordingController, 'proxyUpload').mockResolvedValue(mockRes);

    const req = new Request('http://localhost/api/recordings/proxy-upload', {
      method: 'POST',
      headers: {
        'x-upload-url': 'https://s3.bayuanugerah.my.id/youten-ai/recordings/123/audio.mp4',
      },
    });

    const res = await POST(req);
    expect(spy).toHaveBeenCalledWith(req);
    expect(res.status).toBe(200);
  });
});
