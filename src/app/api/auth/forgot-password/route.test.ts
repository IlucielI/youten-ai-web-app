import { describe, it, expect, vi, afterEach } from 'vitest';
import { POST } from './route';
import { authController } from '@/server/controllers/auth.controller';
import { NextResponse } from 'next/server';

describe('POST /api/auth/forgot-password', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('delegates to authController.forgotPassword', async () => {
    const mockRes = NextResponse.json({ success: true }, { status: 200 });
    const spy = vi.spyOn(authController, 'forgotPassword').mockResolvedValue(mockRes);

    const req = new Request('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const res = await POST(req);
    expect(spy).toHaveBeenCalledWith(req);
    expect(res.status).toBe(200);
  });
});
