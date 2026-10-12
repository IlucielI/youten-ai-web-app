import { describe, it, expect, vi, afterEach } from 'vitest';
import { POST } from './route';
import { authController } from '@/server/controllers/auth.controller';
import { NextResponse } from 'next/server';

describe('POST /api/auth/refresh', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('delegates to authController.refreshToken', async () => {
    const mockRes = NextResponse.json({ success: true }, { status: 200 });
    const spy = vi.spyOn(authController, 'refreshToken').mockResolvedValue(mockRes);

    const req = new Request('http://localhost/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({
        refresh_token: 'valid_refresh_token',
      }),
    });

    const res = await POST(req);
    expect(spy).toHaveBeenCalledWith(req);
    expect(res.status).toBe(200);
  });
});
