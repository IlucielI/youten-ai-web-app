import { describe, it, expect, vi, afterEach } from 'vitest';
import { POST } from './route';
import { waitlistController } from '@/server/controllers/waitlist.controller';
import { NextResponse } from 'next/server';

describe('POST /api/waitlist/bot', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('delegates to waitlistController.join', async () => {
    const mockRes = NextResponse.json(
      {
        success: true,
        data: {
          email: 'founder@corp.com',
          platform: 'zoom',
          company_size: '1-10',
          status: 'PENDING',
          message: 'Success',
        },
      },
      { status: 200 }
    );
    const spy = vi.spyOn(waitlistController, 'join').mockResolvedValue(mockRes);

    const req = new Request('http://localhost/api/waitlist/bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'founder@corp.com' }),
    });

    const res = await POST(req);
    expect(spy).toHaveBeenCalledWith(req);
    expect(res.status).toBe(200);
  });
});
